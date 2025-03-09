import { S3Event } from 'aws-lambda';
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

// Initialize clients
const s3Client = new S3Client({});
const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

// Define interfaces for type safety
interface ComicImage {
	filename: string;
	altText?: string;
}

interface ComicMetadata {
	title: string;
	slug: string;
	caption: string;
	tags: string[];
	happenedOnDate: string;
	scrollStyle: 'carousel' | 'long';
	postedTimestamp: string;
	integrations: Array<{
		type: string;
		use: boolean;
	}>;
	images: ComicImage[];
}

export const handler = async (event: S3Event) => {
	const bucket = event.Records[0].s3.bucket.name;
	const key = decodeURIComponent(event.Records[0].s3.object.key);
	
	try {
		// Get metadata file
		const metadataResponse = await s3Client.send(new GetObjectCommand({
			Bucket: bucket,
			Key: key,
		}));

		if (!metadataResponse.Body) {
			throw new Error('No metadata body received');
		}

		const metadata = JSON.parse(
			await streamToString(metadataResponse.Body)
		) as ComicMetadata;
		
		// Validate metadata
		if (!metadata.title || !metadata.slug || !metadata.images?.length) {
			throw new Error('Invalid metadata format');
		}
		
		// Check if all referenced images exist
		const comicPath = key.substring(0, key.lastIndexOf('/'));
		await Promise.all(metadata.images.map(async (image) => {
			try {
				await s3Client.send(new HeadObjectCommand({
					Bucket: bucket,
					Key: `${comicPath}/${image.filename}`
				}));
			} catch (error) {
				throw new Error(`Referenced image not found: ${image.filename}`);
			}
		}));
		
		// Write to DynamoDB
		await ddbDocClient.send(new PutCommand({
			TableName: process.env.COMIC_TABLE_NAME,
			Item: {
				...metadata,
				id: metadata.slug,
				uploadDate: new Date().toISOString(),
			}
		}));

		return {
			statusCode: 200,
			body: JSON.stringify({
				message: 'Successfully processed metadata',
				slug: metadata.slug
			})
		};
		
	} catch (error) {
		console.error('Error processing metadata:', error);
		throw error;
	}
};

// Utility function to convert stream to string
async function streamToString(stream: any): Promise<string> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		stream.on('data', (chunk: Buffer) => chunks.push(chunk));
		stream.on('error', reject);
		stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
	});
}