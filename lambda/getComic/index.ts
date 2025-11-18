/**
 * GetComic Lambda Function
 * Returns a single comic by slug with resolved relationships
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.COMIC_TABLE_NAME || '';

interface GetComicEvent {
  pathParameters?: {
    slug?: string;
  };
}

interface Comic {
  id: string;
  title: string;
  slug: string;
  postedTimestamp: string;
  happenedOnDate?: string;
  caption?: string;
  tags: string[];
  images: Array<{
    s3Key: string;
    altText?: string;
  }>;
  thumbnailIndex: number;
  scrollStyle: 'carousel' | 'long-form';
  derivedRelationships?: Array<{
    targetId: string;
    sourceType: 'caption' | 'series' | 'tag';
    contextSnippet?: string;
  }>;
}

interface ResolvedRelationship {
  comic: Comic;
  sourceType: 'caption' | 'series' | 'tag';
  contextSnippet?: string;
}

export const handler = async (event: GetComicEvent) => {
  console.log('GetComic event:', JSON.stringify(event, null, 2));

  try {
    const slug = event.pathParameters?.slug;

    if (!slug) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Missing slug parameter',
        }),
      };
    }

    // Query by slug using SlugIndex GSI
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'SlugIndex',
        KeyConditionExpression: 'slug = :slug',
        ExpressionAttributeValues: {
          ':slug': slug,
        },
        Limit: 1,
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Comic not found',
        }),
      };
    }

    const comic = result.Items[0] as Comic;

    // Resolve relationships if they exist
    let resolvedRelationships: ResolvedRelationship[] = [];
    if (comic.derivedRelationships && comic.derivedRelationships.length > 0) {
      // Batch get related comics
      const relationshipIds = comic.derivedRelationships.map((rel) => rel.targetId);
      
      // DynamoDB BatchGet requires both partition and sort keys
      // We'll need to query each one individually or use a different approach
      // For now, we'll fetch them individually
      const relatedComicsPromises = relationshipIds.map(async (targetId) => {
        const relResult = await docClient.send(
          new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'id = :id',
            ExpressionAttributeValues: {
              ':id': targetId,
            },
            Limit: 1,
          })
        );
        return relResult.Items?.[0] as Comic | undefined;
      });

      const relatedComics = await Promise.all(relatedComicsPromises);

      // Build resolved relationships
      resolvedRelationships = comic.derivedRelationships
        .map((rel, index) => {
          const relatedComic = relatedComics[index];
          if (!relatedComic) return null;

          return {
            comic: relatedComic,
            sourceType: rel.sourceType,
            contextSnippet: rel.contextSnippet,
          };
        })
        .filter((rel): rel is ResolvedRelationship => rel !== null);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        comic,
        relationships: resolvedRelationships,
      }),
    };
  } catch (error) {
    console.error('Error fetching comic:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to fetch comic',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
