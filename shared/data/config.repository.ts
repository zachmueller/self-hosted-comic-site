/**
 * DynamoDB repository for Site Configuration
 * Manages color palette and site settings
 */

import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

export interface ColorPalette {
  primary: string;
  secondary: string;
  highlight: string;
  text: string;
  textSecondary: string;
}

export interface SiteConfig {
  id: string; // Always 'site-config'
  colorPalette: ColorPalette;
  updatedAt: string;
}

export const DEFAULT_COLOR_PALETTE: ColorPalette = {
  primary: '#007bff',
  secondary: '#6c757d',
  highlight: '#ffc107',
  text: '#212529',
  textSecondary: '#6c757d',
};

export class ConfigRepository {
  private client: DynamoDBClient;
  private tableName: string;
  private configId = 'site-config';

  constructor(tableName: string, region: string = 'us-east-1') {
    this.client = new DynamoDBClient({ region });
    this.tableName = tableName;
  }

  /**
   * Get site configuration
   * Returns default values if config doesn't exist
   */
  async get(): Promise<SiteConfig> {
    const params = {
      TableName: this.tableName,
      Key: marshall({ id: this.configId }),
    };

    try {
      const result = await this.client.send(new GetItemCommand(params));
      if (result.Item) {
        return unmarshall(result.Item) as SiteConfig;
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }

    // Return default configuration
    return {
      id: this.configId,
      colorPalette: DEFAULT_COLOR_PALETTE,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Update site configuration
   */
  async update(colorPalette: ColorPalette): Promise<SiteConfig> {
    const config: SiteConfig = {
      id: this.configId,
      colorPalette,
      updatedAt: new Date().toISOString(),
    };

    const params = {
      TableName: this.tableName,
      Item: marshall(config, { removeUndefinedValues: true }),
    };

    await this.client.send(new PutItemCommand(params));
    return config;
  }

  /**
   * Update only the color palette
   */
  async updateColorPalette(colorPalette: Partial<ColorPalette>): Promise<SiteConfig> {
    // First get current config
    const currentConfig = await this.get();

    // Merge with new values
    const updatedPalette: ColorPalette = {
      ...currentConfig.colorPalette,
      ...colorPalette,
    };

    return this.update(updatedPalette);
  }

  /**
   * Reset to default configuration
   */
  async reset(): Promise<SiteConfig> {
    return this.update(DEFAULT_COLOR_PALETTE);
  }

  /**
   * Validate color palette values
   */
  validateColorPalette(palette: ColorPalette): boolean {
    const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
    return (
      hexColorRegex.test(palette.primary) &&
      hexColorRegex.test(palette.secondary) &&
      hexColorRegex.test(palette.highlight) &&
      hexColorRegex.test(palette.text) &&
      hexColorRegex.test(palette.textSecondary)
    );
  }
}
