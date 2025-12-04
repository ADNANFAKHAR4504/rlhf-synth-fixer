import * as AWSXRay from 'aws-xray-sdk-core';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Wrap AWS SDK clients with X-Ray
const ddbClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({}));
DynamoDBDocumentClient.from(ddbClient);

export const handler = async (event: { transactionId?: string }) => {
  console.log('Fraud detection logic', JSON.stringify(event));

  // Create custom X-Ray subsegment for database call
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('database-fraud-check');

  try {
    // Placeholder for actual fraud detection logic
    const fraudCheckResult = {
      transactionId: event.transactionId || 'test-transaction',
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
    //     Key: { transactionId: event.transactionId },
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
    throw error;
  }
};
