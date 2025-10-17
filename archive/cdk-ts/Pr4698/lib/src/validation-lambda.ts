import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: 'us-east-1' });
const bucketName = process.env.RAW_DATA_BUCKET!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing request body' }),
      };
    }

    // Parse the incoming data
    const data = JSON.parse(event.body);

    // Generate a unique key for the S3 object
    const key = `${data.deviceId}/${data.timestamp}-${Date.now()}.json`;

    // Upload the raw data to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: event.body,
        ContentType: 'application/json',
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Data received and stored successfully',
      }),
    };
  } catch (error) {
    console.error('Error processing sensor data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process sensor data' }),
    };
  }
};
