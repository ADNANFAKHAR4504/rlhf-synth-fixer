import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

const dynamoClient = new DynamoDBClient({ region: process.env.REGION });
const s3Client = new S3Client({ region: process.env.REGION });
const secretsClient = new SecretsManagerClient({ region: process.env.REGION });

interface ServiceStatus {
  service: string;
  status: 'healthy' | 'unhealthy';
  message?: string;
  details?: Record<string, unknown>;
}

/**
 * Health check handler that validates connectivity and access to all AWS services
 * This provides a comprehensive system status check for the application
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Health check initiated:', JSON.stringify(event));

  const tableName = process.env.DYNAMODB_TABLE_NAME;
  const bucketName = process.env.S3_BUCKET_NAME;
  const secretName = process.env.SECRET_NAME;

  const serviceChecks: ServiceStatus[] = [];

  // Check DynamoDB connectivity
  try {
    const tableInfo = await dynamoClient.send(
      new DescribeTableCommand({ TableName: tableName })
    );
    serviceChecks.push({
      service: 'DynamoDB',
      status: 'healthy',
      details: {
        tableName: tableInfo.Table?.TableName,
        itemCount: tableInfo.Table?.ItemCount,
        status: tableInfo.Table?.TableStatus,
      },
    });
  } catch (error) {
    console.error('DynamoDB health check failed:', error);
    serviceChecks.push({
      service: 'DynamoDB',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Check S3 connectivity
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    serviceChecks.push({
      service: 'S3',
      status: 'healthy',
      details: {
        bucketName,
      },
    });
  } catch (error) {
    console.error('S3 health check failed:', error);
    serviceChecks.push({
      service: 'S3',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Check Secrets Manager connectivity
  try {
    const secretValue = await secretsClient.send(
      new GetSecretValueCommand({ SecretId: secretName })
    );
    serviceChecks.push({
      service: 'Secrets Manager',
      status: 'healthy',
      details: {
        secretName,
        versionId: secretValue.VersionId,
      },
    });
  } catch (error) {
    console.error('Secrets Manager health check failed:', error);
    serviceChecks.push({
      service: 'Secrets Manager',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Determine overall health status
  const allHealthy = serviceChecks.every(check => check.status === 'healthy');
  const statusCode = allHealthy ? 200 : 503;

  const response: APIGatewayProxyResult = {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      status: allHealthy ? 'healthy' : 'degraded',
      environment: process.env.ENVIRONMENT_SUFFIX,
      region: process.env.REGION,
      timestamp: new Date().toISOString(),
      services: serviceChecks,
    }),
  };

  return response;
};
