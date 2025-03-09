import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const ddbClient = new DynamoDBClient({
	region: 'us-east-1',
});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

export const handler = async (event: any) => {
	try {
		const result = await ddbDocClient.send(new QueryCommand({
			TableName: process.env.COMIC_TABLE_NAME,
			Limit: 10,
			ScanIndexForward: false,
			KeyConditionExpression: 'id = :id',
			ExpressionAttributeValues: {
				':id': '#PUBLISHED',
			},
		}));

		return {
			status: '200',
			statusDescription: 'OK',
			headers: {
				'content-type': [{ key: 'Content-Type', value: 'application/json' }],
				'cache-control': [{ key: 'Cache-Control', value: 'max-age=300' }],
			},
			body: JSON.stringify(result.Items),
		};
	} catch (error) {
		return {
			status: '500',
			statusDescription: 'Internal Server Error',
			headers: {
				'content-type': [{ key: 'Content-Type', value: 'application/json' }],
			},
			body: JSON.stringify({ error: 'Failed to fetch comics' }),
		};
	}
};