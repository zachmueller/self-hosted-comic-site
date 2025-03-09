import * as cdk from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as path from 'node:path';

export class ComicSiteStack extends cdk.Stack {
	constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		// Create S3 bucket for comics
		const comicBucket = new s3.Bucket(this, 'ComicBucket', {
			cors: [
				{
					allowedMethods: [
						s3.HttpMethods.GET,
						s3.HttpMethods.PUT,
						s3.HttpMethods.POST,
					],
					allowedOrigins: ['*'],
					allowedHeaders: ['*'],
				},
			],
		});

		// Create S3 bucket for website static content
		const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
			blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
			removalPolicy: cdk.RemovalPolicy.DESTROY, // For development - remove in production
			autoDeleteObjects: true, // For development - remove in production
		});

		// Create Origin Access Control
		const oac = new cloudfront.CfnOriginAccessControl(this, 'OAC', {
			originAccessControlConfig: {
				name: 'WebsiteOAC',
				originAccessControlOriginType: 's3',
				signingBehavior: 'always',
				signingProtocol: 'sigv4',
			},
		});

		// Create CloudFront distribution
		const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(this, 'SecurityHeadersPolicy', {
			responseHeadersPolicyName: 'SecurityHeadersPolicy',
			securityHeadersBehavior: {
				contentSecurityPolicy: {
					override: true,
					contentSecurityPolicy: [
								"default-src 'self' *.amazonaws.com unpkg.com;",
								"script-src 'self' 'unsafe-inline' *.amazonaws.com unpkg.com;",
								"style-src 'self' 'unsafe-inline';",
								"img-src 'self' data: blob: *.amazonaws.com;",
								"connect-src 'self' *.amazonaws.com *.amazoncognito.com;"
							].join(' ')
				},
				strictTransportSecurity: {
					override: true,
					accessControlMaxAge: Duration.days(2 * 365),
					includeSubdomains: true,
					preload: true
				},
				frameOptions: {
					override: true,
					frameOption: cloudfront.HeadersFrameOption.DENY
				},
				xssProtection: {
					override: true,
					protection: true,
					modeBlock: true
				},
				contentTypeOptions: {
					override: true
				}
			}
		});
		const distribution = new cloudfront.Distribution(this, 'WebsiteDistribution', {
			defaultBehavior: {
				origin: new origins.S3Origin(websiteBucket),
				viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
				allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
				cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
				responseHeadersPolicy: responseHeadersPolicy
			},
			defaultRootObject: 'index.html',
			errorResponses: [
				{
					httpStatus: 403,
					responseHttpStatus: 200,
					responsePagePath: '/index.html'
				},
				{
					httpStatus: 404,
					responseHttpStatus: 200,
					responsePagePath: '/index.html'
				}
			],
			additionalBehaviors: {
				'/assets/*': {
					origin: new origins.S3Origin(websiteBucket),
					viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
				}
			}
		});

		// Configure OAC on the distribution
		const cfnDistribution = distribution.node.defaultChild as cloudfront.CfnDistribution;
		cfnDistribution.addPropertyOverride('DistributionConfig.Origins.0.S3OriginConfig.OriginAccessIdentity', '');
		cfnDistribution.addPropertyOverride('DistributionConfig.Origins.0.OriginAccessControlId', oac.getAtt('Id'));

		// Add bucket policy to allow CloudFront access
		websiteBucket.addToResourcePolicy(new iam.PolicyStatement({
			actions: ['s3:GetObject'],
			resources: [websiteBucket.arnForObjects('*')],
			principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
			conditions: {
				StringEquals: {
					'AWS:SourceArn': `arn:aws:cloudfront::${cdk.Stack.of(this).account}:distribution/${distribution.distributionId}`
				}
			}
		}));

		// Upload static website content
		new s3deploy.BucketDeployment(this, 'DeployWebsite', {
			sources: [s3deploy.Source.asset(path.join(__dirname, '..', 'assets', 'website'))],
			destinationBucket: websiteBucket,
			distribution,
			distributionPaths: ['/*'],
		});

		// Create Cognito User Pool
		const userPool = new cognito.UserPool(this, 'ComicUserPool', {
			selfSignUpEnabled: false,
			signInAliases: {
				email: true,
			},
			standardAttributes: {
				email: {
					required: true,
					mutable: true,
				},
			},
			featurePlan: cognito.FeaturePlan.PLUS,
			mfa: cognito.Mfa.OPTIONAL,
			signInCaseSensitive: false,
			autoVerify: {
				email: true,
			},
		});

		// Create the Cognito domain (using AWS domain)
		const userPoolDomain = userPool.addDomain('CognitoDomain', {
			cognitoDomain: {
				domainPrefix: 'whatacomicallife-' + this.account.substring(0, 8), // Must be unique
			},
		});

		// Create Cognito App Client
		const userPoolClient = new cognito.UserPoolClient(this, 'ComicUserPoolClient', {
			userPool,
			generateSecret: false,
			authFlows: {
				adminUserPassword: true,
				userPassword: true,
				userSrp: true,
				custom: true,
			},
			supportedIdentityProviders: [
				cognito.UserPoolClientIdentityProvider.COGNITO
			],
			oAuth: {
				flows: {
					authorizationCodeGrant: true,
				},
				scopes: [
					cognito.OAuthScope.EMAIL,
					cognito.OAuthScope.OPENID,
					cognito.OAuthScope.PROFILE,
				],
				callbackUrls: [
					`https://${distribution.distributionDomainName}`
				],
				logoutUrls: [
					`https://${distribution.distributionDomainName}`
				],
			},
		});

		// Add Managed Login Branding
		new cognito.CfnManagedLoginBranding(this, 'ManagedLoginBranding', {
			userPoolId: userPool.userPoolId,
			clientId: userPoolClient.userPoolClientId,
			returnMergedResources: true,
			useCognitoProvidedValues: true,
		});

		// Create a Cognito Identity Pool to link with User Pool
		const identityPool = new cognito.CfnIdentityPool(this, 'ComicIdentityPool', {
			allowUnauthenticatedIdentities: false, // Don't allow unauthenticated users
			cognitoIdentityProviders: [{
				clientId: userPoolClient.userPoolClientId,
				providerName: userPool.userPoolProviderName,
			}],
		});

		// Create DynamoDB table
		const comicTable = new dynamodb.Table(this, 'ComicTable', {
			partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
			sortKey: { name: 'uploadDate', type: dynamodb.AttributeType.STRING },
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
		});

		// Create Lambda for processing metadata
		const processMetadataLambda = new lambda.Function(this, 'ProcessMetadataLambda', {
			runtime: lambda.Runtime.NODEJS_LATEST,
			handler: 'index.handler',
			code: lambda.Code.fromAsset(path.join(__dirname, '..', 'assets', 'lambda')),
			environment: {
				COMIC_TABLE_NAME: comicTable.tableName,
				COMIC_BUCKET_NAME: comicBucket.bucketName,
			},
		});

		// Grant Lambda permissions
		comicBucket.grantRead(processMetadataLambda);
		comicTable.grantWriteData(processMetadataLambda);

		// Add S3 trigger for metadata.json uploads
		comicBucket.addEventNotification(
			s3.EventType.OBJECT_CREATED,
			new s3n.LambdaDestination(processMetadataLambda),
			{ suffix: 'metadata.json' }
		);

		// Create IAM role limited to Cognito Identity Pool
		const presignedUrlRole = new iam.Role(this, 'PresignedUrlRole', {
			assumedBy: new iam.FederatedPrincipal(
				'cognito-identity.amazonaws.com',
				{
					StringEquals: {
						'cognito-identity.amazonaws.com:aud': identityPool.ref,
					},
					'ForAnyValue:StringLike': {
						'cognito-identity.amazonaws.com:amr': 'authenticated',
					},
				},
				'sts:AssumeRoleWithWebIdentity'
			),
		});

		// Create the authenticated role/policy association
		new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleAttachment', {
			identityPoolId: identityPool.ref,
			roles: {
				authenticated: presignedUrlRole.roleArn,
			},
		});

		// Restrict actions and S3 paths
		presignedUrlRole.addToPolicy(new iam.PolicyStatement({
			effect: iam.Effect.ALLOW,
			actions: [
				's3:PutObject',
				's3:GetObject',
			],
			resources: [
				`${comicBucket.bucketArn}/comics/*`,
			],
		}));

		comicBucket.grantPut(presignedUrlRole);

		// Output values needed for the frontend
		new cdk.CfnOutput(this, 'UserPoolId', {
			value: userPool.userPoolId,
		});

		new cdk.CfnOutput(this, 'UserPoolClientId', {
			value: userPoolClient.userPoolClientId,
		});

		new cdk.CfnOutput(this, 'CognitoDomainUrl', {
			value: userPoolDomain.baseUrl(),
		});

		new cdk.CfnOutput(this, 'CognitoLoginUrl', {
			value: userPoolDomain.signInUrl(userPoolClient, {
				redirectUri: `https://${distribution.distributionDomainName}`,
			})
		});

		new cdk.CfnOutput(this, 'IdentityPoolId', {
			value: identityPool.ref,
		});

		new cdk.CfnOutput(this, 'ComicBucketName', {
			value: comicBucket.bucketName,
		});

		new cdk.CfnOutput(this, 'WebsiteBucketName', {
			value: websiteBucket.bucketName,
		});

		new cdk.CfnOutput(this, 'DistributionDomainName', {
			value: distribution.distributionDomainName,
		});
	}
}