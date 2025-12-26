const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION })
);

exports.handler = async (event) => {
  console.log('Processing payment webhook:', JSON.stringify(event));

  try {
    // Parse request body
    let paymentData;
    if (event.body) {
      paymentData = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } else {
      paymentData = event;
    }

    const sessionId = paymentData.sessionId || `session-${Date.now()}`;
    const amount = paymentData.amount || 0;
    const timestamp = new Date().toISOString();

    // Store session data in DynamoDB
    await dynamoClient.send(
      new PutCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Item: {
          session_id: sessionId,
          amount: amount,
          timestamp: timestamp,
          region: process.env.AWS_REGION,
          status: 'processed'
        }
      })
    );

    console.log('Session stored in DynamoDB:', sessionId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Payment processed successfully',
        sessionId: sessionId,
        region: process.env.AWS_REGION,
        timestamp: timestamp
      })
    };
  } catch (error) {
    console.error('Error processing payment:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Error processing payment',
        error: error.message,
        region: process.env.AWS_REGION
      })
    };
  }
};

// Health check endpoint
exports.health = async () => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: 'healthy',
      region: process.env.AWS_REGION,
      timestamp: new Date().toISOString()
    })
  };
};
