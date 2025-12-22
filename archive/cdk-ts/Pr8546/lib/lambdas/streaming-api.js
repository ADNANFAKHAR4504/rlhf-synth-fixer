const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');

const dynamodb = new DynamoDBClient();

// Regular handler instead of streamifyResponse for LocalStack compatibility
exports.handler = async (event) => {
  const patientId = event.pathParameters?.patientId;

  if (!patientId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Patient ID required' })
    };
  }

  try {
    // Query patient data
    const result = await dynamodb.send(new QueryCommand({
      TableName: process.env.PATIENTS_TABLE,
      KeyConditionExpression: 'patientId = :patientId',
      ExpressionAttributeValues: {
        ':patientId': { S: patientId }
      }
    }));

    const records = result.Items.map(item => ({
      recordDate: item.recordDate.S,
      data: JSON.parse(item.data.S),
      status: item.status.S
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'success',
        data: records
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};
