const { DynamoDBClient, GetItemCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');

const dynamodbClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;

exports.handler = async (event) => {
  console.log('Checking transaction status:', JSON.stringify(event));

  try {
    const transactionId = event.queryStringParameters?.transaction_id;

    if (!transactionId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'Missing transaction_id parameter',
        }),
      };
    }

    // Query DynamoDB for transaction
    const queryParams = {
      TableName: DYNAMODB_TABLE,
      KeyConditionExpression: 'transaction_id = :tid',
      ExpressionAttributeValues: {
        ':tid': { S: transactionId },
      },
      Limit: 1,
      ScanIndexForward: false, // Most recent first
    };

    const result = await dynamodbClient.send(new QueryCommand(queryParams));

    if (!result.Items || result.Items.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'Transaction not found',
          transaction_id: transactionId,
        }),
      };
    }

    const transaction = result.Items[0];

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
      },
      body: JSON.stringify({
        transaction_id: transaction.transaction_id.S,
        timestamp: parseInt(transaction.timestamp.N),
        amount: parseFloat(transaction.amount.N),
        status: transaction.status.S,
        card_last_four: transaction.card_last_four.S,
        merchant_id: transaction.merchant_id.S,
      }),
    };
  } catch (error) {
    console.error('Error checking transaction status:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Error checking transaction status',
        error: error.message,
      }),
    };
  }
};
