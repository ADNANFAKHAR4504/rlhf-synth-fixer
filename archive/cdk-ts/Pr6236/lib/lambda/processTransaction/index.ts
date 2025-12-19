import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const dynamodb = new DynamoDBClient({});
const sqs = new SQSClient({});

const TABLE_NAME = process.env.TABLE_NAME!;
const QUEUE_URL = process.env.QUEUE_URL!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || '{}');

    // Validation
    if (!body.transactionId || !body.amount || !body.currency) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Missing required fields: transactionId, amount, currency',
        }),
      };
    }

    const transaction = {
      transactionId: body.transactionId,
      timestamp: body.timestamp || Date.now(),
      amount: body.amount,
      currency: body.currency,
      customerId: body.customerId || 'unknown',
      status: 'processed',
    };

    // Store in DynamoDB
    await dynamodb.send(
      new PutItemCommand({
        TableName: TABLE_NAME,
        Item: {
          transactionId: { S: transaction.transactionId },
          timestamp: { N: transaction.timestamp.toString() },
          amount: { N: transaction.amount.toString() },
          currency: { S: transaction.currency },
          customerId: { S: transaction.customerId },
          status: { S: transaction.status },
        },
      })
    );

    // Send to audit queue
    await sqs.send(
      new SendMessageCommand({
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify(transaction),
      })
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Transaction processed successfully',
        transactionId: transaction.transactionId,
      }),
    };
  } catch (error) {
    console.error('Error processing transaction:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Failed to process transaction',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
