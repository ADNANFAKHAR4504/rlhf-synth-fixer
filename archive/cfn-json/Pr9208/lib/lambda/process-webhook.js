const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const PRICE_HISTORY_TABLE = process.env.PRICE_HISTORY_TABLE;

exports.handler = async (event) => {
  console.log('Received webhook event:', JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body);
    const { symbol, price, timestamp } = body;

    if (!symbol || !price || !timestamp) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields: symbol, price, timestamp' })
      };
    }

    const priceValue = parseFloat(price);
    if (isNaN(priceValue)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid price value' })
      };
    }

    const ttl = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

    const params = {
      TableName: PRICE_HISTORY_TABLE,
      Item: {
        symbol: symbol,
        timestamp: parseInt(timestamp),
        price: priceValue,
        ttl: ttl,
        receivedAt: Date.now()
      }
    };

    await ddbDocClient.send(new PutCommand(params));

    console.log(`Stored price data for ${symbol}: $${priceValue}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Price data processed successfully' })
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};
