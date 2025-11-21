import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import { ConfigRepository } from '../../shared/data/config.repository';

const dynamoClient = new DynamoDBClient({});
const cloudFrontClient = new CloudFrontClient({});
const tableName = process.env.COMIC_TABLE_NAME || '';
const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID || '';
const configRepo = new ConfigRepository(tableName);

interface ColorPalette {
  primary: string;
  secondary: string;
  highlight: string;
  text: string;
  textSecondary: string;
}

interface UpdateConfigRequest {
  colorPalette: ColorPalette;
}

/**
 * Lambda handler to update site configuration
 * Requires Cognito authentication
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  console.log('UpdateConfig Lambda invoked', { event });

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'PUT,OPTIONS',
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

    // Verify authentication
    if (!event.requestContext.authorizer) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const requestBody: UpdateConfigRequest = JSON.parse(event.body);

    if (!requestBody.colorPalette) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'colorPalette is required' }),
      };
    }

    // Validate color palette
    if (!configRepo.validateColorPalette(requestBody.colorPalette)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid color palette. All colors must be in hex format (#RRGGBB)',
        }),
      };
    }

    // Update configuration in DynamoDB
    const updatedConfig = await configRepo.update(requestBody.colorPalette);

    console.log('Configuration updated successfully', {
      configId: updatedConfig.id,
      updatedAt: updatedConfig.updatedAt,
    });

    // Invalidate CloudFront cache to ensure new config is served
    if (distributionId) {
      try {
        const invalidationParams = {
          DistributionId: distributionId,
          InvalidationBatch: {
            CallerReference: `config-update-${Date.now()}`,
            Paths: {
              Quantity: 1,
              Items: ['/api/config*'],
            },
          },
        };

        await cloudFrontClient.send(new CreateInvalidationCommand(invalidationParams));
        console.log('CloudFront cache invalidated for config');
      } catch (invalidationError) {
        console.error('Error invalidating CloudFront cache:', invalidationError);
        // Don't fail the request if invalidation fails
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updatedConfig),
    };
  } catch (error) {
    console.error('Error updating configuration:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}
