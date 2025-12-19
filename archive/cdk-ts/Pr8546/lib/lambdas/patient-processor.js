const { DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const dynamodb = new DynamoDBClient();
const sns = new SNSClient();
const sqs = new SQSClient();

exports.handler = async (event, context) => {
  console.log('Processing patient data:', JSON.stringify(event, null, 2));

  try {
    // Process patient data
    const patientData = event.patientData || {};
    const patientId = patientData.patientId || context.requestId;

    // Store patient record in DynamoDB
    await dynamodb.send(new PutItemCommand({
      TableName: process.env.PATIENTS_TABLE,
      Item: {
        patientId: { S: patientId },
        recordDate: { S: new Date().toISOString() },
        data: { S: JSON.stringify(patientData) },
        status: { S: 'processed' }
      }
    }));

    // Send notification
    await sns.send(new PublishCommand({
      TopicArn: process.env.NOTIFICATIONS_TOPIC,
      Message: JSON.stringify({
        type: 'patient_processed',
        patientId: patientId,
        timestamp: new Date().toISOString()
      }),
      Subject: 'Patient Data Processed'
    }));

    // Queue analytics processing
    await sqs.send(new SendMessageCommand({
      QueueUrl: process.env.ANALYTICS_QUEUE,
      MessageBody: JSON.stringify({
        patientId: patientId,
        action: 'analyze',
        timestamp: new Date().toISOString()
      })
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Patient data processed successfully',
        patientId: patientId
      })
    };
  } catch (error) {
    console.error('Error processing patient data:', error);

    // Send alert for error
    await sns.send(new PublishCommand({
      TopicArn: process.env.ALERTS_TOPIC,
      Message: JSON.stringify({
        type: 'processing_error',
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      Subject: 'Patient Processing Error'
    }));

    throw error;
  }
};
