const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

const client = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(client);
const tableName = process.env.TABLE_NAME || '';

exports.handler = async (event) => {
  try {
    console.log('Event:', JSON.stringify(event, null, 2));

    // Parse the request body
    const body = JSON.parse(event.body || '{}');

    // Validate the request
    if (!body.amount || !body.from || !body.to) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Missing required fields',
          requiredFields: ['amount', 'from', 'to'],
        }),
      };
    }

    // Generate a unique transaction ID
    const transactionId = randomUUID();
    const timestamp = new Date().toISOString();

    // Create the transaction record
    const transaction = {
      transactionId,
      timestamp,
      amount: body.amount,
      from: body.from,
      to: body.to,
      status: 'completed',
      region: process.env.REGION,
    };

    // Save the transaction to DynamoDB
    await dynamoDB.send(
      new PutCommand({
        TableName: tableName,
        Item: transaction,
      })
    );

    // Return the transaction details
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Transaction completed successfully',
        transaction,
      }),
    };
  } catch (error) {
    console.error('Error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};
