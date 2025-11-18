/**
 * GeneratePresignedUrl Lambda Function
 * Generates presigned URLs for direct S3 uploads from browser
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({});

const BUCKET_NAME = process.env.COMIC_BUCKET_NAME || '';
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const URL_EXPIRATION = 15 * 60; // 15 minutes in seconds

interface GeneratePresignedUrlEvent {
  body?: string;
  requestContext?: {
    authorizer?: {
      claims?: {
        sub?: string;
        email?: string;
      };
    };
  };
}

interface PresignedUrlRequest {
  fileName: string;
  contentType: string;
  fileSize: number;
}

export const handler = async (event: GeneratePresignedUrlEvent) => {
  console.log('GeneratePresignedUrl event:', JSON.stringify(event, null, 2));

  try {
    // Verify authentication
    const userId = event.requestContext?.authorizer?.claims?.sub;
    const userEmail = event.requestContext?.authorizer?.claims?.email;

    if (!userId) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Unauthorized - Authentication required',
        }),
      };
    }

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

    const request: PresignedUrlRequest = JSON.parse(event.body);

    // Validate request
    if (!request.fileName || !request.contentType || !request.fileSize) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Missing required fields: fileName, contentType, fileSize',
        }),
      };
    }

    // Validate content type
    if (!ALLOWED_CONTENT_TYPES.includes(request.contentType)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: `Invalid content type. Allowed types: ${ALLOWED_CONTENT_TYPES.join(', ')}`,
        }),
      };
    }

    // Validate file size
    if (request.fileSize > MAX_FILE_SIZE) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        }),
      };
    }

    // Generate unique S3 key
    const timestamp = Date.now();
    const sanitizedFileName = request.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `comics/${userId}/${timestamp}-${sanitizedFileName}`;

    // Create presigned URL
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ContentType: request.contentType,
      ContentLength: request.fileSize,
      Metadata: {
        uploadedBy: userEmail || userId,
        uploadedAt: new Date().toISOString(),
      },
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: URL_EXPIRATION,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        presignedUrl,
        s3Key,
        expiresIn: URL_EXPIRATION,
        fields: {
          'Content-Type': request.contentType,
        },
      }),
    };
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to generate presigned URL',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
