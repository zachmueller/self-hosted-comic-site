import * as cdk from 'aws-cdk-lib';
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
			publicReadAccess: false,
			blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
			websiteIndexDocument: 'index.html',
			cors: [{
				allowedMethods: [s3.HttpMethods.GET],
				allowedOrigins: ['*'],
				allowedHeaders: ['*'],
			}],
		});

		// Create Origin Access Identity for CloudFront
		const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI');

		// Grant read access to CloudFront
		websiteBucket.grantRead(originAccessIdentity);

		// Create CloudFront distribution
		const distribution = new cloudfront.Distribution(this, 'ComicDistribution', {
			defaultBehavior: {
				origin: new origins.S3Origin(websiteBucket, {
					originAccessIdentity,
				}),
				viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
			},
			defaultRootObject: 'index.html',
		});

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
		});

		// Create Cognito App Client
		const userPoolClient = new cognito.UserPoolClient(this, 'ComicUserPoolClient', {
			userPool,
			generateSecret: false,
			authFlows: {
				adminUserPassword: true,
				userPassword: true,
			},
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

		// Output values you'll need for the frontend
		new cdk.CfnOutput(this, 'UserPoolId', {
			value: userPool.userPoolId,
		});

		new cdk.CfnOutput(this, 'UserPoolClientId', {
			value: userPoolClient.userPoolClientId,
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