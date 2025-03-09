const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const ddbClient = new DynamoDBClient({
	region: 'us-east-1',
});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const COMIC_TABLE_NAME = 'ComicSiteStack-ComicTable08D43903-1P90ZTTO7EA0V';  // hard-coding for now

exports.handler = async (event) => {
	console.log('Lambda@Edge function invoked with event:', JSON.stringify(event, null, 2));

	try {
		console.log('Attempting to query DynamoDB table:', COMIC_TABLE_NAME);

		const result = await ddbDocClient.send(new QueryCommand({
			TableName: COMIC_TABLE_NAME,
			Limit: 10,
			ScanIndexForward: false,
			KeyConditionExpression: 'id = :id',
			ExpressionAttributeValues: {
				':id': '#PUBLISHED',
			},
		}));

		console.log('DynamoDB query result:', JSON.stringify(result, null, 2));

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
		console.error('Error details:', {
			message: error.message,
			stack: error.stack,
			name: error.name
		});

		return {
			status: '500',
			statusDescription: 'Internal Server Error',
			headers: {
				'content-type': [{ key: 'Content-Type', value: 'application/json' }],
			},
			body: JSON.stringify({
				error: 'Failed to fetch comics',
				details: error.message
			}),
		};
	}
};