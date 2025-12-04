import * as AWSXRay from 'aws-xray-sdk-core';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Wrap AWS SDK clients with X-Ray
const ddbClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({}));
DynamoDBDocumentClient.from(ddbClient);

export const handler = async (event: any) => {
  console.log('Notification sending logic', JSON.stringify(event));

  // Parse body if it's a Lambda URL request
  let parsedEvent = event;
  if (event.body && typeof event.body === 'string') {
    try {
      parsedEvent = JSON.parse(event.body);
    } catch (e) {
      parsedEvent = event;
    }
  }

  // Create custom X-Ray subsegment for database call (if segment available)
  let subsegment;
  try {
    const segment = AWSXRay.getSegment();
    subsegment = segment?.addNewSubsegment('database-notification-update');
  } catch (e) {
    // X-Ray segment not available (e.g., in Lambda URL direct invocation)
    console.log('X-Ray segment not available, continuing without tracing');
  }

  try {
    // Placeholder for actual notification logic
    const notificationResult = {
      transactionId: parsedEvent.transactionId || 'test-transaction',
      notificationType: parsedEvent.notificationType || 'email',
      status: 'sent',
      timestamp: new Date().toISOString(),
    };

    // Add X-Ray annotations
    if (subsegment) {
      subsegment.addAnnotation('operation', 'notification-send');
      subsegment.addAnnotation('type', notificationResult.notificationType);
      subsegment.addMetadata('notification', notificationResult);
    }

    // Example DynamoDB operation (would be actual notification update in production)
    // const command = new UpdateCommand({
    //     TableName: process.env.DYNAMODB_TABLE || "transactions",
    //     Key: { transactionId: parsedEvent.transactionId },
    //     UpdateExpression: "SET notificationStatus = :status, notificationTime = :time",
    //     ExpressionAttributeValues: {
    //         ":status": "sent",
    //         ":time": new Date().toISOString(),
    //     },
    // });
    // await docClient.send(command);

    subsegment?.close();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Notification sent',
        data: notificationResult,
      }),
    };
  } catch (error) {
    subsegment?.addError(error as Error);
    subsegment?.close();
    console.error('Error in notification sending:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
        error: (error as Error).message,
      }),
    };
  }
};
