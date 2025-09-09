import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

const region = process.env.REGION || 'us-east-1';
const dynamoClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });
const ssmClient = new SSMClient({ region });

interface ProcessedData {
  id: string;
  timestamp: string;
  data: unknown;
  processed: boolean;
}

export const handler = async (event: any): Promise<any> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, X-Amz-Date, Authorization, X-Api-Key',
  };

  try {
    console.log('Processing request:', JSON.stringify(event, null, 2));

    // Get configuration from Parameter Store
    const [tableNameParam, bucketNameParam] = await Promise.all([
      ssmClient.send(
        new GetParameterCommand({ Name: process.env.TABLE_NAME_PARAM! })
      ),
      ssmClient.send(
        new GetParameterCommand({ Name: process.env.BUCKET_NAME_PARAM! })
      ),
    ]);

    const tableName = tableNameParam.Parameter?.Value;
    const bucketName = bucketNameParam.Parameter?.Value;

    if (!tableName || !bucketName) {
      throw new Error('Missing required configuration parameters');
    }

    // Parse request body
    const requestBody = event.body ? JSON.parse(event.body) : {};
    const id = requestBody.id || `item-${Date.now()}`;

    // Create processed data object
    const processedData: ProcessedData = {
      id,
      timestamp: new Date().toISOString(),
      data: requestBody,
      processed: true,
    };

    console.log('Processing data for ID:', id);

    // Store in DynamoDB
    await dynamoClient.send(
      new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: processedData.id },
          timestamp: { S: processedData.timestamp },
          data: { S: JSON.stringify(processedData.data) },
          processed: { BOOL: processedData.processed },
        },
      })
    );

    console.log('Data stored in DynamoDB');

    // Store in S3
    const s3Key = `processed-data/${processedData.id}-${Date.now()}.json`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: JSON.stringify(processedData, null, 2),
        ContentType: 'application/json',
        ServerSideEncryption: 'AES256',
      })
    );

    console.log('Data stored in S3 with key:', s3Key);

    // Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Data processed successfully',
        data: {
          id: processedData.id,
          timestamp: processedData.timestamp,
          s3Key,
        },
      }),
    };
  } catch (error) {
    console.error('Error processing request:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
