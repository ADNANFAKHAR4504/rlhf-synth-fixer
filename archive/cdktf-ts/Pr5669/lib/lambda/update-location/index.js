const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.REGION || process.env.AWS_REGION || 'us-east-1',
});

const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    // Extract parameters from query string
    const queryParams = event.queryStringParameters || {};
    const driverId = queryParams.driverId;
    const latitude = queryParams.latitude;
    const longitude = queryParams.longitude;

    // Validate required fields
    if (!driverId || !latitude || !longitude) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Missing required fields: driverId, latitude, longitude',
        }),
      };
    }

    // Validate latitude and longitude
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Invalid latitude or longitude',
        }),
      };
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Latitude must be between -90 and 90, longitude between -180 and 180',
        }),
      };
    }

    const timestamp = Date.now();

    // Store location in DynamoDB
    const params = {
      TableName: process.env.TABLE_NAME,
      Item: {
        driverId,
        timestamp,
        latitude: lat,
        longitude: lon,
        updatedAt: new Date().toISOString(),
      },
    };

    await docClient.send(new PutCommand(params));

    console.log('Location updated successfully:', {
      driverId,
      timestamp,
      latitude: lat,
      longitude: lon,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Location updated successfully',
        driverId,
        timestamp,
        latitude: lat,
        longitude: lon,
      }),
    };
  } catch (error) {
    console.error('Error updating location:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to update location',
        message: error.message,
      }),
    };
  }
};
