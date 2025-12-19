const { DynamoDBClient, PutItemCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');

const dynamodb = new DynamoDBClient();

exports.handler = async (event) => {
  console.log('Processing analytics:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const message = JSON.parse(record.body);

    // Perform analytics processing
    const analyticsResult = await performAnalytics(message.patientId);

    // Store analytics results
    await dynamodb.send(new PutItemCommand({
      TableName: process.env.ANALYTICS_TABLE,
      Item: {
        analyticsId: { S: `${message.patientId}-${Date.now()}` },
        timestamp: { S: new Date().toISOString() },
        patientId: { S: message.patientId },
        results: { S: JSON.stringify(analyticsResult) },
        type: { S: 'patient_analysis' }
      }
    }));
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Analytics processed successfully' })
  };
};

async function performAnalytics(patientId) {
  // Simulate analytics processing
  return {
    patientId: patientId,
    riskScore: Math.floor(Math.random() * 100),
    recommendations: ['Regular checkup recommended', 'Monitor vital signs'],
    processedAt: new Date().toISOString()
  };
}
