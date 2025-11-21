import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ConfigRepository, DEFAULT_COLOR_PALETTE } from '../../shared/data/config.repository';

const dynamoClient = new DynamoDBClient({});
const tableName = process.env.COMIC_TABLE_NAME || '';
const configRepo = new ConfigRepository(tableName);

/**
 * Lambda handler to get site configuration
 * Publicly accessible - no authentication required
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  console.log('GetConfig Lambda invoked', { event });

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
  };

  try {
    // Handle OPTIONS request for CORS
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: '',
      };
    }

    // Get configuration from DynamoDB
    const config = await configRepo.get();

    console.log('Configuration retrieved successfully', {
      configId: config.id,
      updatedAt: config.updatedAt,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(config),
    };
  } catch (error) {
    console.error('Error retrieving configuration:', error);

    // Return default configuration on error
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: 'site-config',
        colorPalette: DEFAULT_COLOR_PALETTE,
        updatedAt: new Date().toISOString(),
      }),
    };
  }
}
