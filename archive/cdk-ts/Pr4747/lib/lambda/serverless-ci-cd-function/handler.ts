import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { APIGatewayProxyResult, Context } from 'aws-lambda';
import * as AWSXRay from 'aws-xray-sdk-core';

// Wrap AWS SDK clients with X-Ray
const s3Client = AWSXRay.captureAWSv3Client(new S3Client({}));
const secretsClient = AWSXRay.captureAWSv3Client(new SecretsManagerClient({}));
const sqsClient = AWSXRay.captureAWSv3Client(new SQSClient({}));

interface AppSecrets {
  apiKey: string;
  password: string;
}

let cachedSecrets: AppSecrets | null = null;

async function getSecrets(): Promise<AppSecrets> {
  if (cachedSecrets) {
    return cachedSecrets;
  }

  const command = new GetSecretValueCommand({
    SecretId: process.env.SECRET_ARN!,
  });

  const response = await secretsClient.send(command);
  cachedSecrets = JSON.parse(response.SecretString!) as AppSecrets;
  return cachedSecrets;
}

export async function main(
  event: unknown,
  context: Context
): Promise<APIGatewayProxyResult> {
  try {
    // Log the incoming event
    console.log('Received event:', JSON.stringify(event, null, 2));

    // Get secrets (cache for future invocations)
    await getSecrets();

    // Example: Process data and store in S3
    const data = {
      timestamp: new Date().toISOString(),
      requestId: context.awsRequestId,
      processed: true,
    };

    const putCommand = new PutObjectCommand({
      Bucket: process.env.APPLICATION_BUCKET!,
      Key: `processed/${context.awsRequestId}.json`,
      Body: JSON.stringify(data),
      ServerSideEncryption: 'aws:kms',
    });

    await s3Client.send(putCommand);

    // Add custom metric
    console.log(
      JSON.stringify({
        _aws: {
          Timestamp: Date.now(),
          CloudWatchMetrics: [
            {
              Namespace: 'TapApplication',
              Dimensions: [['Environment']],
              Metrics: [
                {
                  Name: 'ProcessedRequests',
                  Unit: 'Count',
                  Value: 1,
                },
              ],
            },
          ],
        },
        Environment: process.env.NODE_ENV,
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Successfully processed request',
        requestId: context.awsRequestId,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    console.error('Error processing request:', error);

    // Send to DLQ if critical error
    if (process.env.DEAD_LETTER_QUEUE_URL) {
      const dlqCommand = new SendMessageCommand({
        QueueUrl: process.env.DEAD_LETTER_QUEUE_URL,
        MessageBody: JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
          event,
          timestamp: new Date().toISOString(),
        }),
      });

      await sqsClient.send(dlqCommand);
    }

    throw error;
  }
}
