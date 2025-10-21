import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: process.env.AWS_REGION });

interface LogEvent {
  timestamp: number;
  level: string;
  message: string;
  metadata?: Record<string, unknown>;
}

interface LambdaEvent {
  logs?: LogEvent[];
  message?: string;
  metadata?: Record<string, unknown>;
}

interface LambdaResponse {
  statusCode: number;
  message: string;
  logsProcessed?: number;
  s3Location?: string;
  environment?: string;
  projectName?: string;
  timestamp: string;
  error?: string;
}

/**
 * Lambda function to process application logs and store them securely
 * This function demonstrates:
 * - Reading log data from event
 * - Processing and validating log entries
 * - Storing logs in encrypted S3 bucket
 * - Publishing to CloudWatch Logs for monitoring
 */
export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
  console.log('Processing log event:', JSON.stringify(event, null, 2));

  const bucketName = process.env.APP_BUCKET_NAME;
  const logGroupName = process.env.LOG_GROUP_NAME;
  const environment = process.env.ENVIRONMENT;
  const projectName = process.env.PROJECT_NAME;

  if (!bucketName || !logGroupName) {
    throw new Error(
      'Missing required environment variables: APP_BUCKET_NAME or LOG_GROUP_NAME'
    );
  }

  try {
    // Parse and validate log events from the input
    const logEvents: LogEvent[] = Array.isArray(event.logs)
      ? event.logs
      : [
          {
            timestamp: Date.now(),
            level: 'INFO',
            message: event.message || 'No message provided',
            metadata: event.metadata || {},
          },
        ];

    // Process each log event
    const processedLogs = logEvents.map(log => ({
      ...log,
      environment,
      projectName,
      processedAt: new Date().toISOString(),
    }));

    // Store logs in S3 with encryption (KMS encryption is configured at bucket level)
    const s3Key = `logs/${environment}/${new Date().toISOString().split('T')[0]}/${Date.now()}.json`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: JSON.stringify(processedLogs, null, 2),
        ContentType: 'application/json',
        ServerSideEncryption: 'aws:kms', // Use KMS encryption
        Metadata: {
          environment: environment || 'unknown',
          project: projectName || 'unknown',
          'log-count': processedLogs.length.toString(),
        },
      })
    );

    console.log(`Successfully stored logs in S3: ${s3Key}`);

    // Log processing summary to CloudWatch
    const summary = {
      statusCode: 200,
      message: 'Logs processed successfully',
      logsProcessed: processedLogs.length,
      s3Location: `s3://${bucketName}/${s3Key}`,
      environment,
      projectName,
      timestamp: new Date().toISOString(),
    };

    console.log('Processing summary:', JSON.stringify(summary, null, 2));

    return summary;
  } catch (error) {
    console.error('Error processing logs:', error);

    // Log error details for troubleshooting
    const errorResponse = {
      statusCode: 500,
      message: 'Failed to process logs',
      error: error instanceof Error ? error.message : 'Unknown error',
      environment,
      projectName,
      timestamp: new Date().toISOString(),
    };

    console.error('Error response:', JSON.stringify(errorResponse, null, 2));

    throw error; // Re-throw to trigger Lambda retry logic if configured
  }
};
