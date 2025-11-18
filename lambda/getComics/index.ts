/**
 * GetComics Lambda Function
 * Returns paginated list of comics with optional tag filtering
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.COMIC_TABLE_NAME || '';
const PAGE_SIZE = 20;

interface GetComicsEvent {
  queryStringParameters?: {
    page?: string;
    tag?: string;
    limit?: string;
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
}

export const handler = async (event: GetComicsEvent) => {
  console.log('GetComics event:', JSON.stringify(event, null, 2));

  try {
    const queryParams = event.queryStringParameters || {};
    const page = parseInt(queryParams.page || '1', 10);
    const tag = queryParams.tag;
    const limit = parseInt(queryParams.limit || String(PAGE_SIZE), 10);

    let items: Comic[];
    let hasNextPage = false;

    if (tag) {
      // Query by tag using TagIndex GSI
      const result = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: 'TagIndex',
          KeyConditionExpression: 'tag = :tag',
          ExpressionAttributeValues: {
            ':tag': tag,
          },
          ScanIndexForward: false, // Sort by postedTimestamp descending
          Limit: limit * page, // Get all items up to current page
        })
      );

      items = (result.Items || []) as Comic[];
      
      // Implement pagination by slicing results
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      items = items.slice(startIndex, endIndex);
      hasNextPage = (result.Items?.length || 0) > page * limit;
    } else {
      // Scan all comics sorted by postedTimestamp
      const result = await docClient.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          Limit: limit * page,
        })
      );

      items = (result.Items || []) as Comic[];
      
      // Sort by postedTimestamp descending
      items.sort((a, b) => b.postedTimestamp.localeCompare(a.postedTimestamp));
      
      // Implement pagination
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      items = items.slice(startIndex, endIndex);
      hasNextPage = (result.Items?.length || 0) > page * limit;
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        items,
        page,
        hasNextPage,
        total: items.length,
      }),
    };
  } catch (error) {
    console.error('Error fetching comics:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to fetch comics',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
