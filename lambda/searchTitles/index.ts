/**
 * SearchComicTitles Lambda Function
 * Autocomplete search for comic titles
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.COMIC_TABLE_NAME || '';
const MAX_RESULTS = 10;

interface SearchTitlesEvent {
  queryStringParameters?: {
    q?: string;
  };
}

interface ComicSearchResult {
  id: string;
  title: string;
  slug: string;
  happenedOnDate?: string;
}

export const handler = async (event: SearchTitlesEvent) => {
  console.log('SearchTitles event:', JSON.stringify(event, null, 2));

  try {
    const query = event.queryStringParameters?.q?.toLowerCase().trim();

    if (!query) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Missing query parameter',
        }),
      };
    }

    // Query using TitleIndex GSI for prefix matching
    // Note: DynamoDB doesn't support LIKE queries, so we'll use begins_with
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'TitleIndex',
        KeyConditionExpression: 'begins_with(title, :query)',
        ExpressionAttributeValues: {
          ':query': query,
        },
        Limit: MAX_RESULTS,
        ScanIndexForward: false, // Sort by happenedOnDate descending
      })
    );

    // If no results with begins_with, fall back to scan with contains
    let items = result.Items || [];
    
    if (items.length === 0) {
      // Fallback: Scan all comics and filter by title containing query
      const scanResult = await docClient.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          FilterExpression: 'contains(#title, :query)',
          ExpressionAttributeNames: {
            '#title': 'title',
          },
          ExpressionAttributeValues: {
            ':query': query,
          },
          Limit: 100, // Scan limit to avoid performance issues
        })
      );

      items = (scanResult.Items || [])
        .sort((a, b) => {
          // Sort by happenedOnDate descending
          const dateA = a.happenedOnDate || a.postedTimestamp;
          const dateB = b.happenedOnDate || b.postedTimestamp;
          return dateB.localeCompare(dateA);
        })
        .slice(0, MAX_RESULTS);
    }

    // Map to search result format
    const results: ComicSearchResult[] = items.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      happenedOnDate: item.happenedOnDate,
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        results,
        query,
      }),
    };
  } catch (error) {
    console.error('Error searching titles:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to search titles',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
