import * as AWSXRay from 'aws-xray-sdk-core';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Wrap AWS SDK clients with X-Ray
const ddbClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({}));
DynamoDBDocumentClient.from(ddbClient);

export const handler = async (event: any) => {
  console.log('Payment validation logic', JSON.stringify(event));

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
    subsegment = segment?.addNewSubsegment('database-validation');
  } catch (e) {
    // X-Ray segment not available (e.g., in Lambda URL direct invocation)
    console.log('X-Ray segment not available, continuing without tracing');
  }

  try {
    // Placeholder for actual validation logic
    const validationResult = {
      transactionId: parsedEvent.transactionId || 'test-transaction',
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
    console.error('Error in payment validation:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
        error: (error as Error).message,
      }),
    };
  }
};
