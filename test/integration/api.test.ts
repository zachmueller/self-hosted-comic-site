/**
 * API Integration Tests
 * 
 * Tests all Lambda functions with DynamoDB Local
 * Requires: DynamoDB Local running on port 8000
 * 
 * Run with: npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

// Lambda function handlers
import { handler as getComicsHandler } from '../../lambda/getComics';
import { handler as getComicHandler } from '../../lambda/getComic';
import { handler as searchTitlesHandler } from '../../lambda/searchTitles';
import { handler as processUploadHandler } from '../../lambda/processUpload';
import { handler as generatePresignedUrlHandler } from '../../lambda/generatePresignedUrl';
import { handler as getConfigHandler } from '../../lambda/getConfig';
import { handler as updateConfigHandler } from '../../lambda/updateConfig';

// Test configuration
const TEST_TABLE_NAME = 'ComicsTable-Test';
const TEST_CONFIG_TABLE_NAME = 'ConfigTable-Test';

// DynamoDB Local configuration
const dynamoDBConfig = {
  endpoint: 'http://localhost:8000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
};

let ddbClient: DynamoDBClient;
let docClient: DynamoDBDocumentClient;

// Test fixtures
const createTestComic = (overrides = {}) => ({
  id: 'test-comic-1',
  postedTimestamp: '2025-01-01T00:00:00Z',
  title: 'Test Comic',
  slug: 'test-comic',
  scrollStyle: 'carousel' as const,
  publishDate: '2025-01-01',
  images: [
    {
      s3Key: 'comics/test-comic-1/image-1.jpg',
      altText: 'Test image',
      order: 0,
    },
  ],
  tags: ['test', 'integration'],
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

const createTestConfig = () => ({
  id: 'site-config',
  colorPalette: {
    primary: '#007bff',
    secondary: '#6c757d',
    background: '#ffffff',
    text: '#212529',
    accent: '#ffc107',
  },
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
});

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Initialize DynamoDB clients
    ddbClient = new DynamoDBClient(dynamoDBConfig);
    docClient = DynamoDBDocumentClient.from(ddbClient);

    // Set environment variables for Lambda functions
    process.env.COMICS_TABLE_NAME = TEST_TABLE_NAME;
    process.env.CONFIG_TABLE_NAME = TEST_CONFIG_TABLE_NAME;
    process.env.AWS_REGION = 'us-east-1';
  });

  afterAll(async () => {
    // Cleanup
    if (ddbClient) {
      ddbClient.destroy();
    }
  });

  beforeEach(async () => {
    // Clear test tables before each test
    await clearTable(TEST_TABLE_NAME);
    await clearTable(TEST_CONFIG_TABLE_NAME);
  });

  describe('GetComics Lambda', () => {
    it('should return paginated comics', async () => {
      // Seed test data
      const comics = [
        createTestComic({ id: 'comic-1', postedTimestamp: '2025-01-01T00:00:00Z' }),
        createTestComic({ id: 'comic-2', postedTimestamp: '2025-01-02T00:00:00Z' }),
        createTestComic({ id: 'comic-3', postedTimestamp: '2025-01-03T00:00:00Z' }),
      ];

      for (const comic of comics) {
        await docClient.send(
          new PutCommand({
            TableName: TEST_TABLE_NAME,
            Item: comic,
          })
        );
      }

      // Test pagination
      const event = {
        queryStringParameters: {
          page: '1',
        },
      };

      const response = await getComicsHandler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.comics).toBeDefined();
      expect(body.comics.length).toBeGreaterThan(0);
      expect(body.comics.length).toBeLessThanOrEqual(20);
      expect(body.pagination).toBeDefined();
    });

    it('should filter comics by tag', async () => {
      // Seed test data with different tags
      const comics = [
        createTestComic({ id: 'comic-1', tags: ['adventure', 'action'] }),
        createTestComic({ id: 'comic-2', tags: ['comedy', 'slice-of-life'] }),
        createTestComic({ id: 'comic-3', tags: ['adventure', 'fantasy'] }),
      ];

      for (const comic of comics) {
        await docClient.send(
          new PutCommand({
            TableName: TEST_TABLE_NAME,
            Item: comic,
          })
        );
      }

      // Test tag filtering
      const event = {
        queryStringParameters: {
          tag: 'adventure',
        },
      };

      const response = await getComicsHandler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.comics).toBeDefined();
      
      // All returned comics should have 'adventure' tag
      body.comics.forEach((comic: any) => {
        expect(comic.tags).toContain('adventure');
      });
    });

    it('should return empty array when no comics exist', async () => {
      const event = {
        queryStringParameters: {},
      };

      const response = await getComicsHandler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.comics).toEqual([]);
    });

    it('should handle invalid page parameter', async () => {
      const event = {
        queryStringParameters: {
          page: 'invalid',
        },
      };

      const response = await getComicsHandler(event);

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GetComic Lambda', () => {
    it('should return comic by ID with relationships', async () => {
      // Seed test data with relationships
      const mainComic = createTestComic({
        id: 'main-comic',
        caption: 'This references [[Related Comic]]',
      });

      const relatedComic = createTestComic({
        id: 'related-comic',
        title: 'Related Comic',
        slug: 'related-comic',
      });

      await docClient.send(
        new PutCommand({
          TableName: TEST_TABLE_NAME,
          Item: mainComic,
        })
      );

      await docClient.send(
        new PutCommand({
          TableName: TEST_TABLE_NAME,
          Item: relatedComic,
        })
      );

      // Test retrieval with relationships
      const event = {
        pathParameters: {
          id: 'main-comic',
        },
      };

      const response = await getComicHandler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.comic).toBeDefined();
      expect(body.comic.id).toBe('main-comic');
      
      // Check if relationships are resolved
      if (body.comic.derivedRelationships) {
        expect(Array.isArray(body.comic.derivedRelationships)).toBe(true);
      }
    });

    it('should return 404 for non-existent comic', async () => {
      const event = {
        pathParameters: {
          id: 'non-existent',
        },
      };

      const response = await getComicHandler(event);

      expect(response.statusCode).toBe(404);
    });

    it('should handle missing ID parameter', async () => {
      const event = {
        pathParameters: {},
      };

      const response = await getComicHandler(event);

      expect(response.statusCode).toBe(400);
    });
  });

  describe('SearchComicTitles Lambda', () => {
    it('should return matching titles for autocomplete', async () => {
      // Seed test data
      const comics = [
        createTestComic({ id: 'comic-1', title: 'Hero Origin Story' }),
        createTestComic({ id: 'comic-2', title: 'Hero Adventure' }),
        createTestComic({ id: 'comic-3', title: 'Villain Strikes Back' }),
      ];

      for (const comic of comics) {
        await docClient.send(
          new PutCommand({
            TableName: TEST_TABLE_NAME,
            Item: comic,
          })
        );
      }

      // Test search
      const event = {
        queryStringParameters: {
          q: 'Hero',
        },
      };

      const response = await searchTitlesHandler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.titles).toBeDefined();
      expect(Array.isArray(body.titles)).toBe(true);
      
      // Should return comics with 'Hero' in title
      expect(body.titles.length).toBeGreaterThanOrEqual(2);
      body.titles.forEach((title: string) => {
        expect(title.toLowerCase()).toContain('hero');
      });
    });

    it('should handle empty search query', async () => {
      const event = {
        queryStringParameters: {},
      };

      const response = await searchTitlesHandler(event);

      expect(response.statusCode).toBe(400);
    });

    it('should return empty array when no matches found', async () => {
      await docClient.send(
        new PutCommand({
          TableName: TEST_TABLE_NAME,
          Item: createTestComic({ title: 'Test Comic' }),
        })
      );

      const event = {
        queryStringParameters: {
          q: 'NoMatchFound',
        },
      };

      const response = await searchTitlesHandler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.titles).toEqual([]);
    });
  });

  describe('ProcessUpload Lambda', () => {
    it('should validate and process upload metadata', async () => {
      const event = {
        body: JSON.stringify({
          title: 'New Comic Upload',
          slug: 'new-comic-upload',
          publishDate: '2025-01-15',
          images: [
            {
              s3Key: 'comics/new-comic/image-1.jpg',
              altText: 'First panel',
              order: 0,
            },
          ],
          tags: ['new', 'upload-test'],
        }),
      };

      const response = await processUploadHandler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.comicId).toBeDefined();
      
      // Verify comic was stored in database
      const storedComic = await getComicFromDB(body.comicId);
      expect(storedComic).toBeDefined();
      expect(storedComic.title).toBe('New Comic Upload');
    });

    it('should reject upload with invalid metadata', async () => {
      const event = {
        body: JSON.stringify({
          title: '', // Empty title (invalid)
          images: [],
        }),
      };

      const response = await processUploadHandler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBeDefined();
    });

    it('should reject upload with too many images', async () => {
      const images = Array.from({ length: 21 }, (_, i) => ({
        s3Key: `comics/test/image-${i}.jpg`,
        altText: `Image ${i}`,
        order: i,
      }));

      const event = {
        body: JSON.stringify({
          title: 'Too Many Images',
          slug: 'too-many-images',
          publishDate: '2025-01-15',
          images,
          tags: ['test'],
        }),
      };

      const response = await processUploadHandler(event);

      expect(response.statusCode).toBe(400);
    });

    it('should create bidirectional relationships', async () => {
      // First, create a comic to reference
      const referencedComic = createTestComic({
        id: 'referenced-comic',
        title: 'Referenced Comic',
      });

      await docClient.send(
        new PutCommand({
          TableName: TEST_TABLE_NAME,
          Item: referencedComic,
        })
      );

      // Now create a new comic that references it
      const event = {
        body: JSON.stringify({
          title: 'New Comic',
          slug: 'new-comic',
          publishDate: '2025-01-15',
          caption: 'This continues from [[Referenced Comic]]',
          images: [
            {
              s3Key: 'comics/new-comic/image-1.jpg',
              altText: 'Panel',
              order: 0,
            },
          ],
          tags: ['test'],
        }),
      };

      const response = await processUploadHandler(event);
      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      
      // Check if new comic has forward relationship
      const newComic = await getComicFromDB(body.comicId);
      expect(newComic.derivedRelationships).toBeDefined();
      
      // Check if referenced comic has reverse relationship
      const updatedReferencedComic = await getComicFromDB('referenced-comic');
      expect(updatedReferencedComic.derivedRelationships).toBeDefined();
    });
  });

  describe('GeneratePresignedUrl Lambda', () => {
    it('should generate presigned URL for valid request', async () => {
      const event = {
        body: JSON.stringify({
          fileName: 'test-image.jpg',
          contentType: 'image/jpeg',
          fileSize: 1024 * 1024, // 1MB
        }),
        requestContext: {
          authorizer: {
            claims: {
              sub: 'test-user-id',
            },
          },
        },
      };

      const response = await generatePresignedUrlHandler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.uploadUrl).toBeDefined();
      expect(body.s3Key).toBeDefined();
      expect(typeof body.uploadUrl).toBe('string');
    });

    it('should reject unauthenticated requests', async () => {
      const event = {
        body: JSON.stringify({
          fileName: 'test-image.jpg',
          contentType: 'image/jpeg',
          fileSize: 1024 * 1024,
        }),
        requestContext: {}, // No authorizer
      };

      const response = await generatePresignedUrlHandler(event);

      expect(response.statusCode).toBe(401);
    });

    it('should reject files over 20MB', async () => {
      const event = {
        body: JSON.stringify({
          fileName: 'large-image.jpg',
          contentType: 'image/jpeg',
          fileSize: 21 * 1024 * 1024, // 21MB
        }),
        requestContext: {
          authorizer: {
            claims: {
              sub: 'test-user-id',
            },
          },
        },
      };

      const response = await generatePresignedUrlHandler(event);

      expect(response.statusCode).toBe(400);
    });

    it('should reject unsupported file types', async () => {
      const event = {
        body: JSON.stringify({
          fileName: 'test-file.pdf',
          contentType: 'application/pdf',
          fileSize: 1024 * 1024,
        }),
        requestContext: {
          authorizer: {
            claims: {
              sub: 'test-user-id',
            },
          },
        },
      };

      const response = await generatePresignedUrlHandler(event);

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GetConfig Lambda', () => {
    it('should return site configuration', async () => {
      // Seed test config
      const config = createTestConfig();
      await docClient.send(
        new PutCommand({
          TableName: TEST_CONFIG_TABLE_NAME,
          Item: config,
        })
      );

      const event = {};

      const response = await getConfigHandler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.config).toBeDefined();
      expect(body.config.colorPalette).toBeDefined();
    });

    it('should return default config if none exists', async () => {
      const event = {};

      const response = await getConfigHandler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.config).toBeDefined();
    });
  });

  describe('UpdateConfig Lambda', () => {
    it('should update site configuration', async () => {
      const event = {
        body: JSON.stringify({
          colorPalette: {
            primary: '#ff0000',
            secondary: '#00ff00',
            background: '#ffffff',
            text: '#000000',
            accent: '#0000ff',
          },
        }),
        requestContext: {
          authorizer: {
            claims: {
              sub: 'test-user-id',
            },
          },
        },
      };

      const response = await updateConfigHandler(event);

      expect(response.statusCode).toBe(200);
      
      // Verify config was updated
      const updatedConfig = await getConfigFromDB();
      expect(updatedConfig.colorPalette.primary).toBe('#ff0000');
    });

    it('should reject invalid color values', async () => {
      const event = {
        body: JSON.stringify({
          colorPalette: {
            primary: 'invalid-color',
            secondary: '#00ff00',
            background: '#ffffff',
            text: '#000000',
            accent: '#0000ff',
          },
        }),
        requestContext: {
          authorizer: {
            claims: {
              sub: 'test-user-id',
            },
          },
        },
      };

      const response = await updateConfigHandler(event);

      expect(response.statusCode).toBe(400);
    });

    it('should reject unauthenticated requests', async () => {
      const event = {
        body: JSON.stringify({
          colorPalette: {
            primary: '#ff0000',
            secondary: '#00ff00',
            background: '#ffffff',
            text: '#000000',
            accent: '#0000ff',
          },
        }),
        requestContext: {}, // No authorizer
      };

      const response = await updateConfigHandler(event);

      expect(response.statusCode).toBe(401);
    });
  });
});

// Helper functions

async function clearTable(tableName: string) {
  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: tableName,
      })
    );

    if (result.Items) {
      for (const item of result.Items) {
        await docClient.send(
          new DeleteCommand({
            TableName: tableName,
            Key: { id: item.id, postedTimestamp: item.postedTimestamp },
          })
        );
      }
    }
  } catch (error) {
    // Table might not exist yet, which is fine for tests
    console.warn(`Could not clear table ${tableName}:`, error);
  }
}

async function getComicFromDB(id: string) {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TEST_TABLE_NAME,
      FilterExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':id': id,
      },
    })
  );

  return result.Items?.[0];
}

async function getConfigFromDB() {
  const result = await docClient.send(
    new ScanCommand({
      TableName: TEST_CONFIG_TABLE_NAME,
      FilterExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':id': 'site-config',
      },
    })
  );

  return result.Items?.[0];
}
