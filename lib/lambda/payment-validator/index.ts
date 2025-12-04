import * as AWSXRay from 'aws-xray-sdk-core';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Wrap AWS SDK clients with X-Ray
const ddbClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({}));
DynamoDBDocumentClient.from(ddbClient);

export const handler = async (event: { transactionId?: string }) => {
  console.log('Payment validation logic', JSON.stringify(event));

  // Create custom X-Ray subsegment for database call
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('database-validation');

  try {
    // Placeholder for actual validation logic
    const validationResult = {
      transactionId: event.transactionId || 'test-transaction',
      status: 'validated',
      timestamp: new Date().toISOString(),
    };

    // Simulate database call with X-Ray subsegment
    if (subsegment) {
      subsegment.addAnnotation('operation', 'payment-validation');
      subsegment.addMetadata('transaction', validationResult);
    }

    // Example DynamoDB operation (would be actual validation in production)
    // const command = new PutCommand({
    //   TableName: process.env.DYNAMODB_TABLE || 'transactions',
    //   Item: validationResult,
    // });
    // await docClient.send(command); // Uncomment for actual DynamoDB usage

    subsegment?.close();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Payment validated',
        data: validationResult,
      }),
    };
  } catch (error) {
    subsegment?.addError(error as Error);
    subsegment?.close();
    throw error;
  }
};
