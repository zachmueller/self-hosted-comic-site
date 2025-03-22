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
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as path from 'node:path';
import * as fs from 'node:fs';

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

		// Create DynamoDB table
		const comicTable = new dynamodb.Table(this, 'ComicTable', {
			partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
			sortKey: { name: 'postedTimestamp', type: dynamodb.AttributeType.STRING },
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
		});

		// Add GSI for slug lookups
		comicTable.addGlobalSecondaryIndex({
			indexName: 'SlugIndex',
			partitionKey: { name: 'slug', type: dynamodb.AttributeType.STRING },
			projectionType: dynamodb.ProjectionType.ALL
		});

		// Add GSI for title lookups
		comicTable.addGlobalSecondaryIndex({
			indexName: 'TitleIndex',
			partitionKey: { name: 'title', type: dynamodb.AttributeType.STRING },
			sortKey: { name: 'happenedOnDate', type: dynamodb.AttributeType.STRING },
			projectionType: dynamodb.ProjectionType.ALL
		});

		// Read the getComics Lambda function code
		const getComicsLambdaCode = fs.readFileSync(
			path.join(__dirname, '..', 'assets', 'lambda', 'getComics', 'index.js.template'),
			'utf8'
		);

		// Replace the placeholder with the actual table name
		const processedCode = getComicsLambdaCode.replace(
				'{{DYNAMODB_TABLE_NAME}}', comicTable.tableName
			).replace(
				'{{COMIC_BUCKET_NAME}}', comicBucket.bucketName
			);

		// Create Lambda@Edge function for fetching comics
		const getComicsLambda = new lambda.Function(this, 'GetComicsLambda', {
			runtime: lambda.Runtime.NODEJS_18_X,
			handler: 'index.handler',
			code: lambda.Code.fromInline(processedCode),
			timeout: Duration.seconds(5),
		});

		// Grant Lambda@Edge permissions to assume role
		getComicsLambda.addToRolePolicy(new iam.PolicyStatement({
			actions: ['sts:AssumeRole'],
			resources: ['*'],
		}));

		// Grant Lambda@Edge permissions to interact with DynamoDB
		comicBucket.grantRead(getComicsLambda);
		comicTable.grantReadData(getComicsLambda);
		getComicsLambda.addToRolePolicy(new iam.PolicyStatement({
			effect: iam.Effect.ALLOW,
			actions: [
				'logs:CreateLogGroup',
				'logs:CreateLogStream',
				'logs:PutLogEvents'
			],
			resources: ['*']
		}));

		// Create CloudFront Function for image routing
		const cfFunctionCode = 
`function handler(event) {
	var request = event.request;
    var parts = request.uri.split('/');
    var key = parts[parts.length - 1];
    request.uri = '/comics/' + key;
	return request;
}`;
		const imageRouterFunction = new cloudfront.Function(this, 'ImageRouterFunction', {
			code: cloudfront.FunctionCode.fromInline(cfFunctionCode),
		});

		// Create CloudFront distribution
		const apiCachePolicyBase = new cloudfront.CachePolicy(this, 'ComicsApiCachePolicy', {
			defaultTtl: Duration.minutes(10),
			minTtl: Duration.seconds(0),
			maxTtl: Duration.minutes(300),
			queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
			enableAcceptEncodingGzip: true,
			enableAcceptEncodingBrotli: true,
		});
		const apiOriginRequestPolicy = new cloudfront.OriginRequestPolicy(this, 'ComicsApiOriginRequestPolicy', {
			queryStringBehavior: cloudfront.OriginRequestQueryStringBehavior.all(),
			headerBehavior: cloudfront.OriginRequestHeaderBehavior.none(),
			cookieBehavior: cloudfront.OriginRequestCookieBehavior.none(),
		});
		const websiteBucketS3Origin = new origins.S3Origin(websiteBucket);
		const comicBucketS3Origin = new origins.S3Origin(comicBucket);
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
				origin: websiteBucketS3Origin,
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
			priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
			additionalBehaviors: {
				'/api/getComics*': {
					origin: websiteBucketS3Origin, // Dummy origin, will be overridden by Lambda@Edge
					viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
					edgeLambdas: [{
						functionVersion: getComicsLambda.currentVersion,
						eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
						includeBody: false,
					}],
					allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
					cachePolicy: apiCachePolicyBase,
					originRequestPolicy: apiOriginRequestPolicy,
				},
				'/api/comics': {
					origin: websiteBucketS3Origin, // Dummy origin, will be overridden by Lambda@Edge
					viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
					edgeLambdas: [{
						functionVersion: getComicsLambda.currentVersion,
						eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
						includeBody: false,
					}],
					allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
					cachePolicy: apiCachePolicyBase,
				},
				'/api/images/*': {
					origin: comicBucketS3Origin,
					viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
					functionAssociations: [{
						function: imageRouterFunction,
						eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
					}],
				},
				'/assets/*': {
					origin: websiteBucketS3Origin,
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
				domainPrefix: 'whatacomicallife-06079590',
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

		// Create Lambda function for processing uploads
		const processUploadsCode = fs.readFileSync(
			path.join(__dirname, '..', 'assets', 'lambda', 'processUploads', 'index.js.template'),
			'utf8'
		);
		const processUploadsLambda = new lambda.Function(this, 'ProcessUploads', {
			runtime: lambda.Runtime.NODEJS_18_X,
			handler: 'index.handler',
			code: lambda.Code.fromInline(processUploadsCode),
			environment: {
				COMIC_TABLE_NAME: comicTable.tableName,
				COMIC_BUCKET_NAME: comicBucket.bucketName,
				NODE_OPTIONS: '--enable-source-maps',
			},
			timeout: Duration.seconds(30),
			memorySize: 256,
		});

		// Grant Lambda permissions
		comicBucket.grantRead(processUploadsLambda);
		comicTable.grantWriteData(processUploadsLambda);
		// Add specific permission for invalidation triggers
		processUploadsLambda.addToRolePolicy(new iam.PolicyStatement({
			effect: iam.Effect.ALLOW,
			actions: [
				's3:PutObject',
				's3:GetObject',
			],
			resources: [
				`${comicBucket.bucketArn}/comics/*`,
				`${comicBucket.bucketArn}/uploads/*`,
				`${comicBucket.bucketArn}/invalidation/*`
			]
		}));

		// Add S3 trigger for metadata uploads
		comicBucket.addEventNotification(
			s3.EventType.OBJECT_CREATED,
			new s3n.LambdaDestination(processUploadsLambda),
			{ prefix: 'uploads/' }
		);

		// Create Lambda function for processing cache invalidations
		const manageS3CacheCode = fs.readFileSync(
			path.join(__dirname, '..', 'assets', 'lambda', 'manageS3Cache', 'index.js.template'),
			'utf8'
		);
		const manageS3CacheLambda = new lambda.Function(this, 'manageS3Cache', {
			runtime: lambda.Runtime.NODEJS_18_X,
			handler: 'index.handler',
			code: lambda.Code.fromInline(manageS3CacheCode),
			environment: {
				COMIC_TABLE_NAME: comicTable.tableName,
				COMIC_BUCKET_NAME: comicBucket.bucketName,
				NODE_OPTIONS: '--enable-source-maps',
			},
			timeout: Duration.minutes(5),
			memorySize: 1024,
		});

		// Grant Lambda permissions
		comicBucket.grantRead(manageS3CacheLambda);
		comicTable.grantReadData(manageS3CacheLambda);
		manageS3CacheLambda.addToRolePolicy(new iam.PolicyStatement({
			effect: iam.Effect.ALLOW,
			actions: [
				'dynamodb:Query',
				's3:PutObject',
				's3:DeleteObject',
				's3:ListObjects',
				's3:ListObjectsV2',
				'logs:CreateLogGroup',
				'logs:CreateLogStream',
				'logs:PutLogEvents'
			],
			resources: ['*'] //TODO::pare this down and target the ARNs appropriately::
		}));

		// Add S3 trigger for invalidation uploads
		comicBucket.addEventNotification(
			s3.EventType.OBJECT_CREATED,
			new s3n.LambdaDestination(manageS3CacheLambda),
			{ prefix: 'invalidation/' }
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

		new cdk.CfnOutput(this, 'ComicTableName', {
			value: comicTable.tableName,
			description: 'Name of the DynamoDB table for comics'
		});
	}
}