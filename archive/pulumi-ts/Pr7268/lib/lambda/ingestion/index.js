/**
 * Webhook ingestion Lambda function
 * Receives cryptocurrency price data from webhooks and stores it in DynamoDB
 */
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { marshall } = require('@aws-sdk/util-dynamodb');

const dynamoClient = new DynamoDBClient({});
const sqsClient = new SQSClient({});

const PRICE_HISTORY_TABLE = process.env.PRICE_HISTORY_TABLE;
const QUEUE_URL = process.env.QUEUE_URL;

exports.handler = async (event) => {
  console.log('Received webhook event:', JSON.stringify(event));

  try {
    const body = JSON.parse(event.body);
    const { exchange, symbol, price } = body;

    // Validate required fields (API Gateway validation should catch this, but double-check)
    if (!exchange || !symbol || price === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields: exchange, symbol, price',
        }),
      };
    }

    const timestamp = Date.now();
    const expiryTime = Math.floor(timestamp / 1000) + 86400 * 7; // 7 days TTL

    // Store price data in DynamoDB
    const putCommand = new PutItemCommand({
      TableName: PRICE_HISTORY_TABLE,
      Item: marshall({
        symbol,
        timestamp,
        exchange,
        price,
        expiryTime,
      }),
    });

    await dynamoClient.send(putCommand);
    console.log('Price data stored in DynamoDB');

    // Send message to SQS for evaluation
    const sqsCommand = new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify({
        symbol,
        timestamp,
        exchange,
        price,
      }),
    });

    await sqsClient.send(sqsCommand);
    console.log('Message sent to SQS queue');

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Webhook processed successfully',
        symbol,
        price,
      }),
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};
