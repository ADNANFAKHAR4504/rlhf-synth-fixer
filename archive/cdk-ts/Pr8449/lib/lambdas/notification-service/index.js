const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const {
  DynamoDBClient,
  UpdateItemCommand,
} = require('@aws-sdk/client-dynamodb');
const {
  CloudWatchClient,
  PutMetricDataCommand,
} = require('@aws-sdk/client-cloudwatch');

// Initialize AWS clients with LocalStack endpoint configuration
const endpoint = process.env.AWS_ENDPOINT_URL || undefined;
const clientConfig = {
  region: process.env.REGION,
  ...(endpoint && { endpoint }),
};

const snsClient = new SNSClient(clientConfig);
const dynamoClient = new DynamoDBClient(clientConfig);
const cloudWatchClient = new CloudWatchClient(clientConfig);

// Publish CloudWatch metric
async function publishMetric(metricName, value) {
  try {
    await cloudWatchClient.send(
      new PutMetricDataCommand({
        Namespace: 'ServerlessImageDetector',
        MetricData: [
          {
            MetricName: metricName,
            Value: value,
            Unit: 'Count',
            Timestamp: new Date(),
          },
        ],
      })
    );
  } catch (error) {
    console.error('Error publishing metric:', error);
  }
}

// Main Lambda handler
exports.handler = async (event, context) => {
  console.log('Notification Service Event:', JSON.stringify(event, null, 2));

  try {
    const { imageId, detectedAnimal, confidenceScore, s3Location, reason } =
      event;

    if (!imageId || !detectedAnimal || confidenceScore === undefined) {
      throw new Error(
        'Missing required parameters: imageId, detectedAnimal, confidenceScore'
      );
    }

    // Create notification message
    const message = {
      alert: 'Uncertain Image Classification',
      imageId,
      detectedAnimal,
      confidenceScore,
      s3Location,
      reason: reason || 'Low confidence detection',
      timestamp: new Date().toISOString(),
      environment: process.env.ENVIRONMENT || 'dev',
    };

    const subject = `Image Classification Alert - ${detectedAnimal} (${confidenceScore}% confidence)`;

    console.log(
      `Sending notification for uncertain classification: ${imageId}`
    );

    // Send SNS notification
    await snsClient.send(
      new PublishCommand({
        TopicArn: process.env.SNS_TOPIC_ARN,
        Subject: subject,
        Message: JSON.stringify(message, null, 2),
        MessageAttributes: {
          imageId: {
            DataType: 'String',
            StringValue: imageId,
          },
          confidenceScore: {
            DataType: 'Number',
            StringValue: confidenceScore.toString(),
          },
          detectedAnimal: {
            DataType: 'String',
            StringValue: detectedAnimal,
          },
          alertType: {
            DataType: 'String',
            StringValue: 'uncertain_classification',
          },
        },
      })
    );

    console.log(`SNS notification sent for image: ${imageId}`);

    // Update DynamoDB record to mark notification sent
    await dynamoClient.send(
      new UpdateItemCommand({
        TableName: process.env.TABLE_NAME,
        Key: { ImageID: { S: imageId } },
        UpdateExpression:
          'SET NotificationSent = :sent, NotificationTimestamp = :timestamp',
        ExpressionAttributeValues: {
          ':sent': { BOOL: true },
          ':timestamp': { S: new Date().toISOString() },
        },
      })
    );

    console.log(
      `DynamoDB record updated with notification status for image: ${imageId}`
    );

    // Publish metrics
    await publishMetric('NotificationsSent', 1);
    await publishMetric('UncertainClassifications', 1);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Notification sent successfully',
        imageId,
        detectedAnimal,
        confidenceScore,
        subject,
      }),
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    await publishMetric('NotificationErrors', 1);

    // Update DynamoDB with error status
    if (event.imageId) {
      try {
        await dynamoClient.send(
          new UpdateItemCommand({
            TableName: process.env.TABLE_NAME,
            Key: { ImageID: { S: event.imageId } },
            UpdateExpression:
              'SET NotificationError = :error, NotificationErrorTimestamp = :timestamp',
            ExpressionAttributeValues: {
              ':error': { S: error.message || 'Unknown error' },
              ':timestamp': { S: new Date().toISOString() },
            },
          })
        );
      } catch (dbError) {
        console.error(
          'Error updating DynamoDB with notification error:',
          dbError
        );
      }
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Notification failed',
        message: error.message || 'Unknown error',
        requestId: context.awsRequestId,
      }),
    };
  }
};
