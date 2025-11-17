const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

/**
 * Data Processing Lambda Handler
 * Processes incoming trade data and stores in DynamoDB/S3
 */
exports.handler = async (event) => {
  console.log('Processing event:', JSON.stringify(event));

  const { ENVIRONMENT, SESSIONS_TABLE, API_KEYS_TABLE } = process.env;

  try {
    // Validate API key if present
    if (event.headers && event.headers['x-api-key']) {
      const apiKey = event.headers['x-api-key'];
      const apiKeyResult = await dynamodb.get({
        TableName: API_KEYS_TABLE,
        Key: { apiKeyId: apiKey }
      }).promise();

      if (!apiKeyResult.Item) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Invalid API key' })
        };
      }
    }

    // Parse request body
    let requestData;
    try {
      requestData = JSON.parse(event.body || '{}');
    } catch (e) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    // Process data based on type
    if (requestData.type === 'session') {
      // Store session data
      await dynamodb.put({
        TableName: SESSIONS_TABLE,
        Item: {
          sessionId: requestData.sessionId || generateId(),
          timestamp: new Date().toISOString(),
          data: requestData.data,
          environment: ENVIRONMENT
        }
      }).promise();

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Session data processed successfully',
          sessionId: requestData.sessionId
        })
      };
    } else if (requestData.type === 'trade') {
      // Process trade data
      const tradeId = generateId();
      const processedData = {
        tradeId,
        timestamp: new Date().toISOString(),
        ...requestData.data,
        processingEnvironment: ENVIRONMENT
      };

      // Store summary in DynamoDB
      await dynamodb.put({
        TableName: SESSIONS_TABLE,
        Item: {
          sessionId: `trade-${tradeId}`,
          timestamp: processedData.timestamp,
          summary: {
            tradeId: processedData.tradeId,
            amount: processedData.amount,
            status: 'processed'
          }
        }
      }).promise();

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Trade data processed successfully',
          tradeId
        })
      };
    } else {
      // Default processing
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Data processed successfully',
          environment: ENVIRONMENT
        })
      };
    }
  } catch (error) {
    console.error('Processing error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

/**
 * Generate unique ID
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}