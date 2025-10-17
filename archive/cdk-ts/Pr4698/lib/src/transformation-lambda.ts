import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { S3Event } from 'aws-lambda';

const s3Client = new S3Client({ region: 'us-east-1' });
const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(ddbClient);
const tableName = process.env.DYNAMODB_TABLE!;

export const handler = async (event: S3Event): Promise<void> => {
  try {
    // Process each record (S3 event)
    for (const record of event.Records) {
      // Get the bucket and key from the event
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

      // Retrieve the object from S3
      const response = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );

      // Convert the stream to a string and parse as JSON
      if (!response.Body) {
        throw new Error('Empty response body from S3');
      }
      const bodyContents = await streamToString(
        response.Body as NodeJS.ReadableStream
      );
      const sensorData = JSON.parse(bodyContents);

      // Transform the data
      const transformedData = {
        deviceId: sensorData.deviceId,
        timestamp: sensorData.timestamp,
        moisture: sensorData.moisture,
        pH: sensorData.pH,
        // Add TTL attribute (expire after 90 days)
        expirationTime: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60,
      };

      // Store the transformed data in DynamoDB
      await docClient.send(
        new PutCommand({
          TableName: tableName,
          Item: transformedData,
        })
      );

      console.log(`Processed sensor data for device ${sensorData.deviceId}`);
    }
  } catch (error) {
    console.error('Error transforming sensor data:', error);
    throw error; // Re-throw to trigger the DLQ
  }
};

// Helper function to convert a readable stream to a string
function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}
