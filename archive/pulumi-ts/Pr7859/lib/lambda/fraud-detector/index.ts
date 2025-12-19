import * as AWSXRay from 'aws-xray-sdk-core';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Wrap AWS SDK clients with X-Ray
const ddbClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({}));
DynamoDBDocumentClient.from(ddbClient);

export const handler = async (event: any) => {
  console.log('Fraud detection logic', JSON.stringify(event));

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
    subsegment = segment?.addNewSubsegment('database-fraud-check');
  } catch (e) {
    // X-Ray segment not available (e.g., in Lambda URL direct invocation)
    console.log('X-Ray segment not available, continuing without tracing');
  }

  try {
    // Placeholder for actual fraud detection logic
    const fraudCheckResult = {
      transactionId: parsedEvent.transactionId || 'test-transaction',
      riskScore: Math.random(),
      status: 'clean',
      timestamp: new Date().toISOString(),
    };

    // Add X-Ray annotations
    if (subsegment) {
      subsegment.addAnnotation('operation', 'fraud-detection');
      subsegment.addAnnotation('riskScore', fraudCheckResult.riskScore);
      subsegment.addMetadata('transaction', fraudCheckResult);
    }

    // Example DynamoDB operation (would be actual fraud check in production)
    // const command = new GetCommand({
    //     TableName: process.env.DYNAMODB_TABLE || "transactions",
    //     Key: { transactionId: parsedEvent.transactionId },
    // });
    // await docClient.send(command);

    subsegment?.close();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Fraud check complete',
        data: fraudCheckResult,
      }),
    };
  } catch (error) {
    subsegment?.addError(error as Error);
    subsegment?.close();
    console.error('Error in fraud detection:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
        error: (error as Error).message,
      }),
    };
  }
};
