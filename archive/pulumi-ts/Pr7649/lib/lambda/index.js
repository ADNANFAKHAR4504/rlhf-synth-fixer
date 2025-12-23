/**
 * Optimized Lambda function handler for payments processing
 *
 * This function has been optimized with:
 * - Node.js 18.x runtime
 * - 512MB memory allocation
 * - 30-second timeout
 * - AWS X-Ray tracing enabled
 * - Reserved concurrency of 50
 */

const { DynamoDBClient, GetItemCommand, PutItemCommand } = require('@aws-sdk/client-dynamodb');

// Initialize DynamoDB client
const dynamodb = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

exports.handler = async (event) => {
  console.log('Processing payment request', {
    requestId: event.requestId,
    timestamp: new Date().toISOString(),
  });

  try {
    // Get configuration from environment variables
    const newRelicKey = process.env.NEW_RELIC_LICENSE_KEY;
    const connectionPoolSize = process.env.DB_CONNECTION_POOL_SIZE || '10';
    const tableName = 'payments-table';

    console.log('Configuration loaded', {
      newRelicConfigured: !!newRelicKey,
      connectionPoolSize,
      tableName,
    });

    // Example: Query DynamoDB payments table
    const params = {
      TableName: tableName,
      Key: {
        paymentId: { S: event.paymentId || 'test-payment-id' },
      },
    };

    const result = await dynamodb.send(new GetItemCommand(params));

    console.log('DynamoDB query completed', {
      found: !!result.Item,
      paymentId: event.paymentId,
    });

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Payment processed successfully',
        paymentId: event.paymentId,
        data: result.Item,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Error processing payment', {
      error: error.message,
      stack: error.stack,
    });

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to process payment',
        error: error.message,
      }),
    };
  }
};
