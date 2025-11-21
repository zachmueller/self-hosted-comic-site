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
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
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

		// Add GSI for title lookups (for autocomplete)
		comicTable.addGlobalSecondaryIndex({
			indexName: 'TitleIndex',
			partitionKey: { name: 'title', type: dynamodb.AttributeType.STRING },
			sortKey: { name: 'happenedOnDate', type: dynamodb.AttributeType.STRING },
			projectionType: dynamodb.ProjectionType.ALL
		});

		// Add GSI for tag filtering
		comicTable.addGlobalSecondaryIndex({
			indexName: 'TagIndex',
			partitionKey: { name: 'tag', type: dynamodb.AttributeType.STRING },
			sortKey: { name: 'postedTimestamp', type: dynamodb.AttributeType.STRING },
			projectionType: dynamodb.ProjectionType.ALL
		});

		// Create SNS topic for monitoring alerts
		const monitoringTopic = new sns.Topic(this, 'MonitoringTopic', {
			displayName: 'Comic Site Monitoring Alerts',
		});

		// Constitutional Cost Monitoring: $8/month threshold alarm
		// This alarm triggers at $8/month to provide early warning before hitting $10 target
		const costAlarm = new cloudwatch.Alarm(this, 'MonthlyCostAlarm', {
			metric: new cloudwatch.Metric({
				namespace: 'AWS/Billing',
				metricName: 'EstimatedCharges',
				statistic: 'Maximum',
				period: Duration.hours(6),
				dimensionsMap: {
					Currency: 'USD',
				},
			}),
			threshold: 8.0, // Alert at $8 (80% of $10 constitutional target)
			evaluationPeriods: 1,
			comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
			alarmDescription: 'Alert when monthly AWS costs exceed $8 (constitutional limit: $10/month)',
			treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
		});
		costAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(monitoringTopic));

		// DynamoDB Table Monitoring: User Errors
		const tableUserErrorsAlarm = new cloudwatch.Alarm(this, 'TableUserErrorsAlarm', {
			metric: comicTable.metricUserErrors({
				statistic: 'Sum',
				period: Duration.minutes(5),
			}),
			threshold: 10,
			evaluationPeriods: 2,
			alarmDescription: 'Alert when DynamoDB table has excessive user errors',
			treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
		});
		tableUserErrorsAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(monitoringTopic));

		// DynamoDB Table Monitoring: System Errors
		const tableSystemErrorsAlarm = new cloudwatch.Alarm(this, 'TableSystemErrorsAlarm', {
			metric: comicTable.metricSystemErrorsForOperations({
				operations: [dynamodb.Operation.GET_ITEM, dynamodb.Operation.PUT_ITEM, dynamodb.Operation.QUERY],
				statistic: 'Sum',
				period: Duration.minutes(5),
			}),
			threshold: 5,
			evaluationPeriods: 2,
			alarmDescription: 'Alert when DynamoDB table has system errors',
			treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
		});
		tableSystemErrorsAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(monitoringTopic));

		// Create Lambda functions for API endpoints
		// Note: Using regular Lambda functions, not Lambda@Edge for better flexibility
		
		// GetComics Lambda function
		const getComicsLambda = new lambda.Function(this, 'GetComicsLambda', {
			runtime: lambda.Runtime.NODEJS_20_X,
			handler: 'index.handler',
			code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'getComics')),
			environment: {
				COMIC_TABLE_NAME: comicTable.tableName,
			},
			timeout: Duration.seconds(10),
			memorySize: 512,
		});

		// GetComic Lambda function
		const getComicLambda = new lambda.Function(this, 'GetComicLambda', {
			runtime: lambda.Runtime.NODEJS_20_X,
			handler: 'index.handler',
			code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'getComic')),
			environment: {
				COMIC_TABLE_NAME: comicTable.tableName,
			},
			timeout: Duration.seconds(10),
			memorySize: 512,
		});

		// SearchTitles Lambda function
		const searchTitlesLambda = new lambda.Function(this, 'SearchTitlesLambda', {
			runtime: lambda.Runtime.NODEJS_20_X,
			handler: 'index.handler',
			code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'searchTitles')),
			environment: {
				COMIC_TABLE_NAME: comicTable.tableName,
			},
			timeout: Duration.seconds(10),
			memorySize: 512,
		});

		// GeneratePresignedUrl Lambda function
		const generatePresignedUrlLambda = new lambda.Function(this, 'GeneratePresignedUrlLambda', {
			runtime: lambda.Runtime.NODEJS_20_X,
			handler: 'index.handler',
			code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'generatePresignedUrl')),
			environment: {
				COMIC_BUCKET_NAME: comicBucket.bucketName,
			},
			timeout: Duration.seconds(10),
			memorySize: 256,
		});

		// Grant DynamoDB permissions to Lambda functions
		comicTable.grantReadData(getComicsLambda);
		comicTable.grantReadData(getComicLambda);
		comicTable.grantReadData(searchTitlesLambda);

		// Grant S3 permissions
		comicBucket.grantPut(generatePresignedUrlLambda);

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

		// Create CloudFront distribution with optimized cache policies

		// API Cache Policy: 5 minute cache for API responses (cost-conscious)
		const apiCachePolicy = new cloudfront.CachePolicy(this, 'ComicsApiCachePolicy', {
			defaultTtl: Duration.minutes(5),
			minTtl: Duration.seconds(0),
			maxTtl: Duration.minutes(10),
			queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
			enableAcceptEncodingGzip: true,
			enableAcceptEncodingBrotli: true,
			comment: 'Cache policy for API endpoints - 5 minute TTL',
		});

		// Static Assets Cache Policy: 1 year cache for immutable assets
		const staticAssetsCachePolicy = new cloudfront.CachePolicy(this, 'StaticAssetsCachePolicy', {
			defaultTtl: Duration.days(365),
			minTtl: Duration.days(365),
			maxTtl: Duration.days(365),
			queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
			enableAcceptEncodingGzip: true,
			enableAcceptEncodingBrotli: true,
			comment: 'Cache policy for static assets (JS, CSS) - 1 year TTL',
		});

		// Image Cache Policy: 1 day cache for comic images
		const imageCachePolicy = new cloudfront.CachePolicy(this, 'ImageCachePolicy', {
			defaultTtl: Duration.days(1),
			minTtl: Duration.hours(1),
			maxTtl: Duration.days(7),
			queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
			enableAcceptEncodingGzip: false, // Images are already compressed
			enableAcceptEncodingBrotli: false,
			comment: 'Cache policy for comic images - 1 day TTL',
		});

		// No Cache Policy: For index.html (SPA routing)
		const noCachePolicy = new cloudfront.CachePolicy(this, 'NoCachePolicy', {
			defaultTtl: Duration.seconds(0),
			minTtl: Duration.seconds(0),
			maxTtl: Duration.seconds(0),
			queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
			headerBehavior: cloudfront.CacheHeaderBehavior.none(),
			cookieBehavior: cloudfront.CacheCookieBehavior.none(),
			comment: 'No cache policy for index.html',
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
				cachePolicy: noCachePolicy, // index.html should not be cached
				responseHeadersPolicy: responseHeadersPolicy,
				compress: true,
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
				'/api/images/*': {
					origin: comicBucketS3Origin,
					viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
					functionAssociations: [{
						function: imageRouterFunction,
						eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
					}],
					cachePolicy: imageCachePolicy, // 1 day cache for comic images
					compress: false, // Images already compressed
				},
				'/assets/*': {
					origin: websiteBucketS3Origin,
					viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
					cachePolicy: staticAssetsCachePolicy, // 1 year cache for static assets
					compress: true,
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

		// Upload React app build artifacts
		// NOTE: Run 'cd frontend && npm run build' before deploying
		new s3deploy.BucketDeployment(this, 'DeployWebsite', {
			sources: [s3deploy.Source.asset(path.join(__dirname, '..', 'frontend', 'dist'))],
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

		// Grant processUploadsLambda Lambda permissions
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
				CLOUDFRONT_DISTRIBUTION_ID: distribution.distributionId,
				NODE_OPTIONS: '--enable-source-maps',
			},
			timeout: Duration.minutes(5),
			memorySize: 1024,
		});

		// Grant manageS3CacheCode Lambda permissions
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

		// Grant CloudFront invalidation permissions
		manageS3CacheLambda.addToRolePolicy(new iam.PolicyStatement({
			effect: iam.Effect.ALLOW,
			actions: [
				'cloudfront:CreateInvalidation'
			],
			resources: [
				`arn:aws:cloudfront::${cdk.Stack.of(this).account}:distribution/${distribution.distributionId}`
			]
		}));

		// Add S3 trigger for invalidation uploads
		comicBucket.addEventNotification(
			s3.EventType.OBJECT_CREATED,
			new s3n.LambdaDestination(manageS3CacheLambda),
			{ prefix: 'invalidation/' }
		);

		// GetConfig Lambda function (defined after distribution)
		const getConfigLambda = new lambda.Function(this, 'GetConfigLambda', {
			runtime: lambda.Runtime.NODEJS_20_X,
			handler: 'lambda/getConfig/index.handler',
			code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'getConfig', 'dist')),
			environment: {
				COMIC_TABLE_NAME: comicTable.tableName,
			},
			timeout: Duration.seconds(10),
			memorySize: 256,
		});

		// UpdateConfig Lambda function (defined after distribution)
		const updateConfigLambda = new lambda.Function(this, 'UpdateConfigLambda', {
			runtime: lambda.Runtime.NODEJS_20_X,
			handler: 'lambda/updateConfig/index.handler',
			code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'updateConfig', 'dist')),
			environment: {
				COMIC_TABLE_NAME: comicTable.tableName,
				CLOUDFRONT_DISTRIBUTION_ID: distribution.distributionId,
			},
			timeout: Duration.seconds(10),
			memorySize: 256,
		});

		// Grant DynamoDB permissions to config Lambdas
		comicTable.grantReadData(getConfigLambda);
		comicTable.grantReadWriteData(updateConfigLambda);

		// Grant CloudFront invalidation permission to updateConfig Lambda
		updateConfigLambda.addToRolePolicy(new iam.PolicyStatement({
			effect: iam.Effect.ALLOW,
			actions: ['cloudfront:CreateInvalidation'],
			resources: [`arn:aws:cloudfront::${cdk.Stack.of(this).account}:distribution/${distribution.distributionId}`],
		}));

		// Create API Gateway REST API for Lambda functions
		const api = new apigateway.RestApi(this, 'ComicSiteApi', {
			restApiName: 'Comic Site API',
			description: 'API for comic site operations',
			deployOptions: {
				stageName: 'prod',
				loggingLevel: apigateway.MethodLoggingLevel.INFO,
				dataTraceEnabled: true,
				metricsEnabled: true,
			},
			defaultCorsPreflightOptions: {
				allowOrigins: apigateway.Cors.ALL_ORIGINS,
				allowMethods: apigateway.Cors.ALL_METHODS,
				allowHeaders: ['Content-Type', 'Authorization'],
			},
		});

		// Add /api resource
		const apiResource = api.root.addResource('api');

		// GET /api/comics - List comics with pagination and tag filtering
		const comicsResource = apiResource.addResource('comics');
		comicsResource.addMethod('GET', new apigateway.LambdaIntegration(getComicsLambda));

		// GET /api/comic/{slug} - Get single comic by slug
		const comicResource = apiResource.addResource('comic');
		const comicBySlugResource = comicResource.addResource('{slug}');
		comicBySlugResource.addMethod('GET', new apigateway.LambdaIntegration(getComicLambda));

		// GET /api/search/titles - Search comic titles
		const searchResource = apiResource.addResource('search');
		const titlesResource = searchResource.addResource('titles');
		titlesResource.addMethod('GET', new apigateway.LambdaIntegration(searchTitlesLambda));

		// Add Cognito authorizer for protected endpoints
		const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'ComicApiAuthorizer', {
			cognitoUserPools: [userPool],
			authorizerName: 'ComicApiAuthorizer',
		});

		// POST /api/upload/presigned-url - Generate presigned URL (requires auth)
		const uploadResource = apiResource.addResource('upload');
		const presignedUrlResource = uploadResource.addResource('presigned-url');
		presignedUrlResource.addMethod('POST', new apigateway.LambdaIntegration(generatePresignedUrlLambda), {
			authorizer,
			authorizationType: apigateway.AuthorizationType.COGNITO,
		});

		// ProcessUpload Lambda for comic metadata processing
		const processUploadLambda = new lambda.Function(this, 'ProcessUploadLambda', {
			runtime: lambda.Runtime.NODEJS_20_X,
			handler: 'index.handler',
			code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'processUpload')),
			environment: {
				COMIC_TABLE_NAME: comicTable.tableName,
				COMIC_BUCKET_NAME: comicBucket.bucketName,
				CLOUDFRONT_DISTRIBUTION_ID: distribution.distributionId,
			},
			timeout: Duration.seconds(30),
			memorySize: 512,
		});

		// Grant permissions to processUpload Lambda
		comicTable.grantWriteData(processUploadLambda);
		comicTable.grantReadData(processUploadLambda);
		comicBucket.grantRead(processUploadLambda);
		processUploadLambda.addToRolePolicy(new iam.PolicyStatement({
			effect: iam.Effect.ALLOW,
			actions: ['cloudfront:CreateInvalidation'],
			resources: [`arn:aws:cloudfront::${cdk.Stack.of(this).account}:distribution/${distribution.distributionId}`],
		}));

		// POST /api/upload/process - Process upload after S3 upload (requires auth)
		const processUploadResource = uploadResource.addResource('process');
		processUploadResource.addMethod('POST', new apigateway.LambdaIntegration(processUploadLambda), {
			authorizer,
			authorizationType: apigateway.AuthorizationType.COGNITO,
		});

		// GET /api/config - Get site configuration (public)
		const configResource = apiResource.addResource('config');
		configResource.addMethod('GET', new apigateway.LambdaIntegration(getConfigLambda));

		// PUT /api/config - Update site configuration (requires auth)
		configResource.addMethod('PUT', new apigateway.LambdaIntegration(updateConfigLambda), {
			authorizer,
			authorizationType: apigateway.AuthorizationType.COGNITO,
		});

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

		new cdk.CfnOutput(this, 'ApiUrl', {
			value: api.url,
			description: 'API Gateway endpoint URL'
		});
	}
}
