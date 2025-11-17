import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SFNClient, StartSyncExecutionCommand } from '@aws-sdk/client-sfn';
import { S3Event } from 'aws-lambda';

const sfnClient = new SFNClient({});
const dynamoClient = new DynamoDBClient({});

export const handler = async (event: S3Event): Promise<void> => {
  console.log('Trigger handler received event:', JSON.stringify(event));

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log(`Processing file: ${key} from bucket: ${bucket}`);

    try {
      // Create initial metadata entry
      await dynamoClient.send(
        new PutItemCommand({
          TableName: process.env.METADATA_TABLE!,
          Item: {
            jobId: { S: jobId },
            fileName: { S: key.split('/').pop() || key },
            status: { S: 'started' },
            timestamp: { N: Date.now().toString() },
            s3Bucket: { S: bucket },
            s3Key: { S: key },
          },
        })
      );

      // Start Step Functions execution
      const input = {
        bucket,
        key,
        jobId,
      };

      const command = new StartSyncExecutionCommand({
        stateMachineArn: process.env.STATE_MACHINE_ARN!,
        input: JSON.stringify(input),
      });

      const result = await sfnClient.send(command);

      // Handle sync execution result
      if (result.status === 'SUCCEEDED') {
        console.log(`Execution succeeded: ${result.executionArn}`);
        // Optionally update metadata with success status
      } else if (result.status === 'FAILED') {
        console.error(`Execution failed: ${result.error}`, result.cause);
        // Update metadata with error
        await dynamoClient.send(
          new PutItemCommand({
            TableName: process.env.METADATA_TABLE!,
            Item: {
              jobId: { S: jobId },
              fileName: { S: key.split('/').pop() || key },
              status: { S: 'execution_failed' },
              timestamp: { N: Date.now().toString() },
              error: {
                S: result.error || 'Execution failed',
              },
            },
          })
        );
      } else {
        console.log(
          `Execution status: ${result.status}, executionArn: ${result.executionArn}`
        );
      }
    } catch (error) {
      console.error(`Error processing ${key}:`, error);

      // Update metadata with error
      await dynamoClient.send(
        new PutItemCommand({
          TableName: process.env.METADATA_TABLE!,
          Item: {
            jobId: { S: jobId },
            fileName: { S: key.split('/').pop() || key },
            status: { S: 'trigger_failed' },
            timestamp: { N: Date.now().toString() },
            error: {
              S: error instanceof Error ? error.message : 'Unknown error',
            },
          },
        })
      );
    }
  }
};
