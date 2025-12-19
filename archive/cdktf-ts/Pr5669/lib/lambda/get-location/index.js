const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.REGION || process.env.AWS_REGION || 'us-east-1',
});

const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    // Extract driverId from query string
    const queryParams = event.queryStringParameters || {};
    const driverId = queryParams.driverId;

    if (!driverId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Missing required field: driverId',
        }),
      };
    }

    // Query DynamoDB for the most recent location
    const params = {
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: 'driverId = :driverId',
      ExpressionAttributeValues: {
        ':driverId': driverId,
      },
      ScanIndexForward: false, // Sort descending (most recent first)
      Limit: 1,
    };

    const result = await docClient.send(new QueryCommand(params));

    if (!result.Items || result.Items.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'No location found for driver',
          driverId,
        }),
      };
    }

    const location = result.Items[0];

    console.log('Retrieved current location:', location);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        driverId: location.driverId,
        timestamp: location.timestamp,
        latitude: location.latitude,
        longitude: location.longitude,
        updatedAt: location.updatedAt,
      }),
    };
  } catch (error) {
    console.error('Error retrieving location:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to retrieve location',
        message: error.message,
      }),
    };
  }
};
