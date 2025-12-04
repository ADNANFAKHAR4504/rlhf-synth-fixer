import * as AWSXRay from 'aws-xray-sdk-core';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Wrap AWS SDK clients with X-Ray
const ddbClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({}));
DynamoDBDocumentClient.from(ddbClient);

export const handler = async (event: {
  transactionId?: string;
  notificationType?: string;
}) => {
  console.log('Notification sending logic', JSON.stringify(event));

  // Create custom X-Ray subsegment for database call
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('database-notification-update');

  try {
    // Placeholder for actual notification logic
    const notificationResult = {
      transactionId: event.transactionId || 'test-transaction',
      notificationType: event.notificationType || 'email',
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
    //     Key: { transactionId: event.transactionId },
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
    throw error;
  }
};
