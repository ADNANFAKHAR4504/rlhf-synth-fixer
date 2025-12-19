import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
const tableName = process.env.DYNAMO_TABLE || '';

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const routeKey = event.routeKey;

    if (routeKey === 'POST /payment') {
      // Process payment
      const body = JSON.parse(event.body || '{}');
      const transactionId = `txn-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const timestamp = Date.now();

      // Store transaction in DynamoDB
      await dynamoClient.send(
        new PutItemCommand({
          TableName: tableName,
          Item: marshall({
            transactionId,
            timestamp,
            userId: body.userId || 'unknown',
            amount: body.amount || 0,
            status: 'completed',
            createdAt: new Date().toISOString(),
          }),
        })
      );

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Payment processed successfully',
          transactionId,
          timestamp,
        }),
      };
    } else if (routeKey?.startsWith('GET /payment/')) {
      // Get payment status
      const transactionId = event.pathParameters?.id || '';

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Payment retrieved',
          transactionId,
        }),
      };
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Route not found' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
        error: String(error),
      }),
    };
  }
};
