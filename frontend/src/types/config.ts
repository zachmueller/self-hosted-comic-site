/**
 * Application configuration types
 */

/**
 * AWS Cognito configuration
 */
export interface CognitoConfig {
  userPoolId: string;
  clientId: string;
  identityPoolId: string;
  region: string;
  cognitoDomain: string;
}

/**
 * S3 configuration
 */
export interface S3Config {
  bucketName: string;
  region: string;
}

/**
 * API configuration
 */
export interface ApiEndpointConfig {
  baseUrl: string;
  timeout?: number;
}

/**
 * CloudFront configuration
 */
export interface CloudFrontConfig {
  distributionDomain: string;
}

/**
 * Application environment configuration
 */
export interface AppConfig {
  cognito: CognitoConfig;
  s3: S3Config;
  api: ApiEndpointConfig;
  cloudfront: CloudFrontConfig;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  pageSize: number; // Comics per page
  ttl: number; // Cache TTL in minutes
  invalidationPaths: string[]; // CloudFront paths to invalidate
}

/**
 * Color palette for site theming
 */
export interface ColorPalette {
  primary: string; // Hex color
  secondary: string; // Hex color
  highlight: string; // Hex color
  text: string; // Hex color
  textSecondary: string; // Hex color
}

/**
 * Site configuration stored in DynamoDB
 */
export interface SiteConfig {
  id: string; // Config identifier (e.g., 'site-config')
  colorPalette: ColorPalette;
  updatedAt: string; // ISO 8601 timestamp
}

/**
 * Default color palette values
 */
export const DEFAULT_COLOR_PALETTE: ColorPalette = {
  primary: '#007bff',
  secondary: '#6c757d',
  highlight: '#ffc107',
  text: '#212529',
  textSecondary: '#6c757d',
};

/**
 * Environment variable keys
 */
export const ENV_KEYS = {
  COGNITO_USER_POOL_ID: 'VITE_COGNITO_USER_POOL_ID',
  COGNITO_CLIENT_ID: 'VITE_COGNITO_CLIENT_ID',
  COGNITO_IDENTITY_POOL_ID: 'VITE_COGNITO_IDENTITY_POOL_ID',
  COGNITO_REGION: 'VITE_COGNITO_REGION',
  COGNITO_DOMAIN: 'VITE_COGNITO_DOMAIN',
  S3_BUCKET_NAME: 'VITE_S3_BUCKET_NAME',
  S3_REGION: 'VITE_S3_REGION',
  API_URL: 'VITE_API_URL',
  CLOUDFRONT_DOMAIN: 'VITE_CLOUDFRONT_DOMAIN',
} as const;

/**
 * Default cache configuration
 */
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  pageSize: 20,
  ttl: 60,
  invalidationPaths: ['/api/*', '/comics/*', '/'],
};
