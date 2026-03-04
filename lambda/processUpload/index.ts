/**
 * ProcessUpload Lambda Function
 * Processes comic metadata upload and creates relationships
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});
const cloudFrontClient = new CloudFrontClient({});

const TABLE_NAME = process.env.COMIC_TABLE_NAME || '';
const BUCKET_NAME = process.env.COMIC_BUCKET_NAME || '';
const DISTRIBUTION_ID = process.env.CLOUDFRONT_DISTRIBUTION_ID || '';

interface ProcessUploadEvent {
  body?: string;
}

interface ComicMetadata {
  title: string;
  caption?: string;
  postedDate: string;
  happenedOnDate?: string;
  tags: string[];
  images: Array<{
    s3Key: string;
    altText?: string;
  }>;
  thumbnailIndex: number;
  scrollStyle: 'carousel' | 'long-form';
}

interface DerivedRelationship {
  targetId: string;
  sourceType: 'caption' | 'series' | 'tag';
  contextSnippet?: string;
}

/**
 * Parse caption for [[Title]] or [[Title|Alias]] references
 * 
 * NOTE: This is an inline copy of the canonical parser in shared/utils/referenceParser.ts.
 * Lambda functions are bundled individually and cannot import from shared/.
 * If you modify parsing logic, keep both locations in sync.
 */
function parseReferences(caption: string): Array<{ title: string; alias?: string }> {
  const referenceRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  const references: Array<{ title: string; alias?: string }> = [];
  
  let match;
  while ((match = referenceRegex.exec(caption)) !== null) {
    references.push({
      title: match[1].trim(),
      alias: match[2]?.trim(),
    });
  }
  
  return references;
}

/**
 * Generate slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const handler = async (event: ProcessUploadEvent) => {
  console.log('ProcessUpload event:', JSON.stringify(event, null, 2));

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Missing request body',
        }),
      };
    }

    const metadata: ComicMetadata = JSON.parse(event.body);

    // Generate comic ID and slug
    const comicId = uuidv4();
    const slug = generateSlug(metadata.title);
    const postedTimestamp = new Date(metadata.postedDate).toISOString();

    // Parse caption for references
    const derivedRelationships: DerivedRelationship[] = [];
    if (metadata.caption) {
      const references = parseReferences(metadata.caption);
      
      // Query DynamoDB for each reference
      for (const ref of references) {
        const result = await docClient.send(
          new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: 'TitleIndex',
            KeyConditionExpression: 'title = :title',
            ExpressionAttributeValues: {
              ':title': ref.title,
            },
            Limit: 1,
          })
        );

        if (result.Items && result.Items.length > 0) {
          const targetComic = result.Items[0];
          
          // Extract context snippet (sentence containing the reference)
          const captionText = metadata.caption || '';
          const refText = ref.alias || ref.title;
          const refIndex = captionText.indexOf(`[[${ref.title}`);
          const sentenceStart = captionText.lastIndexOf('.', refIndex) + 1;
          const sentenceEnd = captionText.indexOf('.', refIndex);
          const contextSnippet = captionText.substring(
            sentenceStart,
            sentenceEnd > 0 ? sentenceEnd + 1 : captionText.length
          ).trim();

          derivedRelationships.push({
            targetId: targetComic.id,
            sourceType: 'caption',
            contextSnippet,
          });

          // Update target comic with bidirectional relationship
          await docClient.send(
            new UpdateCommand({
              TableName: TABLE_NAME,
              Key: {
                id: targetComic.id,
                postedTimestamp: targetComic.postedTimestamp,
              },
              UpdateExpression: 'SET derivedRelationships = list_append(if_not_exists(derivedRelationships, :empty_list), :new_rel)',
              ExpressionAttributeValues: {
                ':empty_list': [],
                ':new_rel': [{
                  targetId: comicId,
                  sourceType: 'caption' as const,
                  contextSnippet,
                }],
              },
            })
          );
        }
      }
    }

    // Add tag-based relationships
    for (const tag of metadata.tags) {
      // Query for other comics with same tag
      const result = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: 'TagIndex',
          KeyConditionExpression: 'tag = :tag',
          ExpressionAttributeValues: {
            ':tag': tag,
          },
          Limit: 5, // Limit related comics per tag
        })
      );

      if (result.Items) {
        for (const relatedComic of result.Items) {
          if (relatedComic.id !== comicId) {
            derivedRelationships.push({
              targetId: relatedComic.id,
              sourceType: 'tag',
            });
          }
        }
      }
    }

    // Create comic item
    const comic = {
      id: comicId,
      title: metadata.title,
      slug,
      postedTimestamp,
      happenedOnDate: metadata.happenedOnDate,
      caption: metadata.caption,
      tags: metadata.tags,
      tag: metadata.tags[0] || 'untagged', // For TagIndex GSI
      images: metadata.images,
      thumbnailIndex: metadata.thumbnailIndex,
      scrollStyle: metadata.scrollStyle,
      derivedRelationships,
    };

    // Write to DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: comic,
      })
    );

    // Trigger CloudFront cache invalidation
    try {
      await cloudFrontClient.send(
        new CreateInvalidationCommand({
          DistributionId: DISTRIBUTION_ID,
          InvalidationBatch: {
            CallerReference: `upload-${comicId}-${Date.now()}`,
            Paths: {
              Quantity: 3,
              Items: ['/', '/api/getComics*', `/comic/${slug}`],
            },
          },
        })
      );
    } catch (error) {
      console.error('Failed to invalidate cache:', error);
      // Don't fail the upload if cache invalidation fails
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        comicId,
        slug,
        message: 'Comic published successfully. Cache will update in ~5 minutes.',
      }),
    };
  } catch (error) {
    console.error('Error processing upload:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to process upload',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
