const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

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
    const limit = queryParams.limit ? parseInt(queryParams.limit, 10) : 50;
    const startTime = queryParams.startTime ? parseInt(queryParams.startTime, 10) : null;
    const endTime = queryParams.endTime ? parseInt(queryParams.endTime, 10) : null;

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

    // Build query parameters
    const params = {
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: 'driverId = :driverId',
      ExpressionAttributeValues: {
        ':driverId': driverId,
      },
      ScanIndexForward: false, // Sort descending (most recent first)
      Limit: Math.min(limit, 100), // Cap at 100 items
    };

    // Add time range filter if provided
    if (startTime && endTime) {
      params.KeyConditionExpression += ' AND #ts BETWEEN :startTime AND :endTime';
      params.ExpressionAttributeNames = {
        '#ts': 'timestamp',
      };
      params.ExpressionAttributeValues[':startTime'] = startTime;
      params.ExpressionAttributeValues[':endTime'] = endTime;
    } else if (startTime) {
      params.KeyConditionExpression += ' AND #ts >= :startTime';
      params.ExpressionAttributeNames = {
        '#ts': 'timestamp',
      };
      params.ExpressionAttributeValues[':startTime'] = startTime;
    } else if (endTime) {
      params.KeyConditionExpression += ' AND #ts <= :endTime';
      params.ExpressionAttributeNames = {
        '#ts': 'timestamp',
      };
      params.ExpressionAttributeValues[':endTime'] = endTime;
    }

    const result = await docClient.send(new QueryCommand(params));

    const locations = result.Items || [];

    console.log(`Retrieved ${locations.length} location history records for driver ${driverId}`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        driverId,
        count: locations.length,
        locations: locations.map((loc) => ({
          timestamp: loc.timestamp,
          latitude: loc.latitude,
          longitude: loc.longitude,
          updatedAt: loc.updatedAt,
        })),
      }),
    };
  } catch (error) {
    console.error('Error retrieving location history:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to retrieve location history',
        message: error.message,
      }),
    };
  }
};
