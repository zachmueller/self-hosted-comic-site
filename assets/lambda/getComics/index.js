const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const ddbClient = new DynamoDBClient({
	region: 'us-east-1',
});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

exports.handler = async (event) => {
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
		console.error('Error fetching comics:', error);
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