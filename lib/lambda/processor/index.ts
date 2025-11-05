import { SQSEvent } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const s3Client = new S3Client({});
const dynamoClient = new DynamoDBClient({});

const BUCKET_NAME = process.env.BUCKET_NAME!;
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log(`Processing ${event.Records.length} messages`);

  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.body);
      const { webhookId, payload } = message;

      console.log(`Processing webhook ${webhookId}`);

      // Process the webhook (placeholder logic)
      const processedData = {
        webhookId,
        originalPayload: payload,
        processedAt: Date.now(),
        result: 'Successfully processed',
      };

      // Store results in S3
      const s3Key = `processed/${webhookId}.json`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: JSON.stringify(processedData),
          ContentType: 'application/json',
        })
      );

      console.log(`Stored results in S3: ${s3Key}`);

      // Update DynamoDB with processing status
      await dynamoClient.send(
        new UpdateItemCommand({
          TableName: TABLE_NAME,
          Key: {
            webhookId: { S: webhookId },
          },
          UpdateExpression:
            'SET #status = :status, #processedAt = :processedAt, #s3Key = :s3Key',
          ExpressionAttributeNames: {
            '#status': 'status',
            '#processedAt': 'processedAt',
            '#s3Key': 's3Key',
          },
          ExpressionAttributeValues: {
            ':status': { S: 'completed' },
            ':processedAt': { N: Date.now().toString() },
            ':s3Key': { S: s3Key },
          },
        })
      );

      console.log(`Updated DynamoDB for webhook ${webhookId}`);
    } catch (error) {
      console.error('Error processing message:', error);
      throw error; // Let SQS handle retries
    }
  }
};
