/**
 * Cognito authentication utilities
 * Handles OAuth flow with Cognito Hosted UI
 */

export interface CognitoConfig {
  userPoolId: string;
  clientId: string;
  domain: string;
  redirectUri: string;
  identityPoolId: string;
  region: string;
}

export interface CognitoTokens {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface CognitoUser {
  email: string;
  sub: string;
  name?: string;
}

/**
 * Parse JWT token without verification (verification happens server-side)
 */
function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
}

/**
 * Build the Cognito Hosted UI login URL
 */
export function buildLoginUrl(config: CognitoConfig): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    scope: 'email openid profile',
    redirect_uri: config.redirectUri,
  });

  return `${config.domain}/oauth2/authorize?${params.toString()}`;
}

/**
 * Build the Cognito Hosted UI logout URL
 */
export function buildLogoutUrl(config: CognitoConfig): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    logout_uri: config.redirectUri,
  });

  return `${config.domain}/logout?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  config: CognitoConfig
): Promise<CognitoTokens> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    code,
    redirect_uri: config.redirectUri,
  });

  const response = await fetch(`${config.domain}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();
  
  // Calculate expiration time (current time + expires_in seconds)
  const expiresAt = Date.now() + data.expires_in * 1000;

  return {
    idToken: data.id_token,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
  config: CognitoConfig
): Promise<CognitoTokens> {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: config.clientId,
    refresh_token: refreshToken,
  });

  const response = await fetch(`${config.domain}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const data = await response.json();
  
  // Calculate expiration time
  const expiresAt = Date.now() + data.expires_in * 1000;

  return {
    idToken: data.id_token,
    accessToken: data.access_token,
    refreshToken: refreshToken, // Refresh token doesn't change
    expiresAt,
  };
}

/**
 * Get user info from ID token
 */
export function getUserFromToken(idToken: string): CognitoUser | null {
  const payload = parseJwt(idToken);
  if (!payload) {
    return null;
  }

  return {
    email: payload.email,
    sub: payload.sub,
    name: payload.name,
  };
}

/**
 * Check if tokens are expired or about to expire (within 5 minutes)
 */
export function isTokenExpired(expiresAt: number): boolean {
  const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
  return Date.now() >= expiresAt - bufferTime;
}

/**
 * Get AWS credentials for authenticated user using Cognito Identity Pool
 */
export async function getAwsCredentials(
  idToken: string,
  config: CognitoConfig
): Promise<{
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: Date;
}> {
  // First, get the identity ID
  const getIdResponse = await fetch(
    `https://cognito-identity.${config.region}.amazonaws.com/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityService.GetId',
      },
      body: JSON.stringify({
        IdentityPoolId: config.identityPoolId,
        Logins: {
          [`cognito-idp.${config.region}.amazonaws.com/${config.userPoolId}`]: idToken,
        },
      }),
    }
  );

  if (!getIdResponse.ok) {
    throw new Error('Failed to get identity ID');
  }

  const { IdentityId } = await getIdResponse.json();

  // Get credentials for the identity
  const getCredentialsResponse = await fetch(
    `https://cognito-identity.${config.region}.amazonaws.com/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityService.GetCredentialsForIdentity',
      },
      body: JSON.stringify({
        IdentityId,
        Logins: {
          [`cognito-idp.${config.region}.amazonaws.com/${config.userPoolId}`]: idToken,
        },
      }),
    }
  );

  if (!getCredentialsResponse.ok) {
    throw new Error('Failed to get AWS credentials');
  }

  const { Credentials } = await getCredentialsResponse.json();

  return {
    accessKeyId: Credentials.AccessKeyId,
    secretAccessKey: Credentials.SecretKey,
    sessionToken: Credentials.SessionToken,
    expiration: new Date(Credentials.Expiration * 1000),
  };
}
