/**
 * DynamoDB repository for Comic entities
 * Provides CRUD operations and query utilities
 */

import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  BatchGetItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

export interface Comic {
  id: string;
  postedTimestamp: string;
  title: string;
  slug: string;
  scrollStyle: 'carousel' | 'longForm';
  caption?: string;
  happenedOnDate?: string;
  tags?: string[];
  images: ComicImage[];
  thumbnailIndex: number;
  derivedRelationships?: DerivedRelationship[];
}

export interface ComicImage {
  key: string;
  altText?: string;
  order: number;
}

export interface DerivedRelationship {
  targetComicId: string;
  sourceType: 'caption' | 'series' | 'tag';
  context?: string;
}

export interface PaginationResult<T> {
  items: T[];
  lastEvaluatedKey?: Record<string, any>;
  hasNextPage: boolean;
}

export class ComicRepository {
  private client: DynamoDBClient;
  private tableName: string;

  constructor(tableName: string, region: string = 'us-east-1') {
    this.client = new DynamoDBClient({ region });
    this.tableName = tableName;
  }

  /**
   * Create a new comic
   */
  async create(comic: Comic): Promise<Comic> {
    const params = {
      TableName: this.tableName,
      Item: marshall(comic, { removeUndefinedValues: true }),
    };

    await this.client.send(new PutItemCommand(params));
    return comic;
  }

  /**
   * Get a comic by ID
   */
  async getById(id: string, postedTimestamp: string): Promise<Comic | null> {
    const params = {
      TableName: this.tableName,
      Key: marshall({ id, postedTimestamp }),
    };

    const result = await this.client.send(new GetItemCommand(params));
    return result.Item ? (unmarshall(result.Item) as Comic) : null;
  }

  /**
   * Get a comic by slug using SlugIndex GSI
   */
  async getBySlug(slug: string): Promise<Comic | null> {
    const params = {
      TableName: this.tableName,
      IndexName: 'SlugIndex',
      KeyConditionExpression: 'slug = :slug',
      ExpressionAttributeValues: marshall({ ':slug': slug }),
      Limit: 1,
    };

    const result = await this.client.send(new QueryCommand(params));
    if (result.Items && result.Items.length > 0) {
      return unmarshall(result.Items[0]) as Comic;
    }
    return null;
  }

  /**
   * Search comics by title prefix using TitleIndex GSI
   * Used for autocomplete functionality
   */
  async searchByTitle(
    titlePrefix: string,
    limit: number = 10
  ): Promise<Comic[]> {
    const params = {
      TableName: this.tableName,
      IndexName: 'TitleIndex',
      KeyConditionExpression: 'begins_with(title, :prefix)',
      ExpressionAttributeValues: marshall({ ':prefix': titlePrefix }),
      Limit: limit,
      ScanIndexForward: false, // Most recent first
    };

    const result = await this.client.send(new QueryCommand(params));
    return result.Items?.map((item) => unmarshall(item) as Comic) || [];
  }

  /**
   * Get comics by tag using TagIndex GSI
   */
  async getByTag(
    tag: string,
    limit: number = 20,
    lastEvaluatedKey?: Record<string, any>
  ): Promise<PaginationResult<Comic>> {
    const params = {
      TableName: this.tableName,
      IndexName: 'TagIndex',
      KeyConditionExpression: 'tag = :tag',
      ExpressionAttributeValues: marshall({ ':tag': tag }),
      Limit: limit,
      ScanIndexForward: false, // Most recent first
      ExclusiveStartKey: lastEvaluatedKey
        ? marshall(lastEvaluatedKey)
        : undefined,
    };

    const result = await this.client.send(new QueryCommand(params));
    return {
      items: result.Items?.map((item) => unmarshall(item) as Comic) || [],
      lastEvaluatedKey: result.LastEvaluatedKey
        ? unmarshall(result.LastEvaluatedKey)
        : undefined,
      hasNextPage: !!result.LastEvaluatedKey,
    };
  }

  /**
   * Get all comics with pagination
   */
  async getAll(
    limit: number = 20,
    lastEvaluatedKey?: Record<string, any>
  ): Promise<PaginationResult<Comic>> {
    const params = {
      TableName: this.tableName,
      Limit: limit,
      ScanIndexForward: false, // Most recent first
      ExclusiveStartKey: lastEvaluatedKey
        ? marshall(lastEvaluatedKey)
        : undefined,
    };

    const result = await this.client.send(new QueryCommand(params));
    return {
      items: result.Items?.map((item) => unmarshall(item) as Comic) || [],
      lastEvaluatedKey: result.LastEvaluatedKey
        ? unmarshall(result.LastEvaluatedKey)
        : undefined,
      hasNextPage: !!result.LastEvaluatedKey,
    };
  }

  /**
   * Get multiple comics by their IDs
   * Used for resolving relationships
   */
  async getByIds(ids: string[]): Promise<Comic[]> {
    if (ids.length === 0) return [];

    const keys = ids.map((id) => marshall({ id }));
    const params = {
      RequestItems: {
        [this.tableName]: {
          Keys: keys,
        },
      },
    };

    const result = await this.client.send(new BatchGetItemCommand(params));
    const items = result.Responses?.[this.tableName] || [];
    return items.map((item) => unmarshall(item) as Comic);
  }

  /**
   * Update a comic
   */
  async update(
    id: string,
    postedTimestamp: string,
    updates: Partial<Comic>
  ): Promise<Comic> {
    // Build update expression
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    let index = 0;
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'postedTimestamp' && value !== undefined) {
        const placeholder = `#attr${index}`;
        const valuePlaceholder = `:val${index}`;
        updateExpressions.push(`${placeholder} = ${valuePlaceholder}`);
        expressionAttributeNames[placeholder] = key;
        expressionAttributeValues[valuePlaceholder] = value;
        index++;
      }
    }

    if (updateExpressions.length === 0) {
      throw new Error('No valid updates provided');
    }

    const params = {
      TableName: this.tableName,
      Key: marshall({ id, postedTimestamp }),
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: marshall(expressionAttributeValues, {
        removeUndefinedValues: true,
      }),
      ReturnValues: 'ALL_NEW' as const,
    };

    const result = await this.client.send(new UpdateItemCommand(params));
    return unmarshall(result.Attributes!) as Comic;
  }

  /**
   * Delete a comic
   */
  async delete(id: string, postedTimestamp: string): Promise<void> {
    const params = {
      TableName: this.tableName,
      Key: marshall({ id, postedTimestamp }),
    };

    await this.client.send(new DeleteItemCommand(params));
  }

  /**
   * Add a relationship to a comic
   */
  async addRelationship(
    id: string,
    postedTimestamp: string,
    relationship: DerivedRelationship
  ): Promise<void> {
    const params = {
      TableName: this.tableName,
      Key: marshall({ id, postedTimestamp }),
      UpdateExpression:
        'SET derivedRelationships = list_append(if_not_exists(derivedRelationships, :empty_list), :new_relationship)',
      ExpressionAttributeValues: marshall({
        ':empty_list': [],
        ':new_relationship': [relationship],
      }),
    };

    await this.client.send(new UpdateItemCommand(params));
  }

  /**
   * Remove a relationship from a comic
   */
  async removeRelationship(
    id: string,
    postedTimestamp: string,
    targetComicId: string,
    sourceType: 'caption' | 'series' | 'tag'
  ): Promise<void> {
    // First, get the comic to find the index of the relationship
    const comic = await this.getById(id, postedTimestamp);
    if (!comic || !comic.derivedRelationships) return;

    const relationshipIndex = comic.derivedRelationships.findIndex(
      (r) => r.targetComicId === targetComicId && r.sourceType === sourceType
    );

    if (relationshipIndex === -1) return;

    const params = {
      TableName: this.tableName,
      Key: marshall({ id, postedTimestamp }),
      UpdateExpression: `REMOVE derivedRelationships[${relationshipIndex}]`,
    };

    await this.client.send(new UpdateItemCommand(params));
  }
}
