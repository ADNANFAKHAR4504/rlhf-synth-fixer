import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  AttributeValue,
} from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

/* istanbul ignore next - Default region fallback */
const REGION = process.env.REGION || process.env.AWS_REGION || 'us-east-1';

const s3Client = new S3Client({
  region: REGION,
});
const dynamoClient = new DynamoDBClient({
  region: REGION,
});
const snsClient = new SNSClient({
  region: REGION,
});
const sqsClient = new SQSClient({
  region: REGION,
});

const PROD_BUCKET = process.env.PROD_BUCKET!;
const PROD_TABLE = process.env.PROD_TABLE!;
const SUCCESS_TOPIC_ARN = process.env.SUCCESS_TOPIC_ARN!;
const FAILURE_TOPIC_ARN = process.env.FAILURE_TOPIC_ARN!;
const DLQ_URL = process.env.DLQ_URL!;
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX!;

interface EventDetail {
  eventSource: string;
  eventName: string;
  requestParameters: {
    bucketName?: string;
    tableName?: string;
    key?: string;
  };
}

interface ReplicationEvent {
  detail: EventDetail;
}

const TARGET_ENVIRONMENTS = ['dev', 'staging'];

// Exponential backoff configuration
const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000; // 1 second

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      // If this is the last retry, throw the error
      if (i >= retries - 1) {
        throw error;
      }

      const delay = INITIAL_DELAY * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${retries} after ${delay}ms`);
      await sleep(delay);
    }
  }

  /* istanbul ignore next - This line is unreachable */
  throw new Error('Max retries exceeded');
}

async function replicateS3Object(
  key: string,
  targetEnv: string
): Promise<void> {
  console.log(`Replicating S3 object ${key} to ${targetEnv}`);

  // Get object from production bucket
  const getCommand = new GetObjectCommand({
    Bucket: PROD_BUCKET,
    Key: key,
  });

  const response = await retryWithBackoff(() => s3Client.send(getCommand));
  const body = await response.Body?.transformToByteArray();

  if (!body) {
    throw new Error('Empty object body');
  }

  // Put object to target environment bucket
  const targetBucket = `company-data-${targetEnv}-${REGION}-${ENVIRONMENT_SUFFIX}`;
  const putCommand = new PutObjectCommand({
    Bucket: targetBucket,
    Key: key,
    Body: body,
    Metadata: response.Metadata,
  });

  await retryWithBackoff(() => s3Client.send(putCommand));
  console.log(`Successfully replicated S3 object to ${targetBucket}/${key}`);
}

async function replicateDynamoDBItem(
  itemKey: Record<string, AttributeValue>
): Promise<void> {
  console.log('Replicating DynamoDB item to target environments');

  // Get item from production table
  const getCommand = new GetItemCommand({
    TableName: PROD_TABLE,
    Key: itemKey,
  });

  const response = await retryWithBackoff(() => dynamoClient.send(getCommand));

  if (!response.Item) {
    throw new Error('Item not found');
  }

  // Replicate to each target environment
  for (const targetEnv of TARGET_ENVIRONMENTS) {
    const targetTable = `pipeline-metadata-${targetEnv}-${ENVIRONMENT_SUFFIX}`;
    const putCommand = new PutItemCommand({
      TableName: targetTable,
      Item: {
        ...response.Item,
        environment: { S: targetEnv },
        replicatedFrom: { S: 'prod' },
        replicationTimestamp: { N: Date.now().toString() },
      },
    });

    await retryWithBackoff(() => dynamoClient.send(putCommand));
    console.log(`Successfully replicated DynamoDB item to ${targetTable}`);
  }
}

async function publishNotification(
  success: boolean,
  message: string
): Promise<void> {
  const topicArn = success ? SUCCESS_TOPIC_ARN : FAILURE_TOPIC_ARN;
  const subject = success ? 'Replication Success' : 'Replication Failure';

  const command = new PublishCommand({
    TopicArn: topicArn,
    Subject: subject,
    Message: JSON.stringify(
      {
        success,
        message,
        timestamp: new Date().toISOString(),
        environment: 'prod',
      },
      null,
      2
    ),
  });

  await snsClient.send(command);
}

async function sendToDeadLetterQueue(
  event: ReplicationEvent,
  error: string
): Promise<void> {
  const command = new SendMessageCommand({
    QueueUrl: DLQ_URL,
    MessageBody: JSON.stringify({
      event,
      error,
      timestamp: new Date().toISOString(),
    }),
  });

  await sqsClient.send(command);
}

export async function handler(
  event: ReplicationEvent
): Promise<{ statusCode: number; body: string }> {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    const detail = event.detail;
    const eventSource = detail.eventSource;

    if (eventSource === 's3.amazonaws.com') {
      const key = detail.requestParameters.key;
      if (!key) {
        throw new Error('S3 key not found in event');
      }

      // Replicate to each target environment
      for (const targetEnv of TARGET_ENVIRONMENTS) {
        await replicateS3Object(key, targetEnv);
      }

      await publishNotification(
        true,
        `Successfully replicated S3 object ${key} to ${TARGET_ENVIRONMENTS.join(', ')}`
      );
    } else if (eventSource === 'dynamodb.amazonaws.com') {
      // For DynamoDB, we need to construct the key from the event
      // This is a simplified version - in production, you'd parse the actual key from CloudTrail
      const itemKey = {
        id: { S: detail.requestParameters.key || 'unknown' },
        timestamp: { N: Date.now().toString() },
      };

      await replicateDynamoDBItem(itemKey);

      await publishNotification(
        true,
        `Successfully replicated DynamoDB item to ${TARGET_ENVIRONMENTS.join(', ')}`
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Replication completed successfully' }),
    };
  } catch (error) {
    console.error('Replication failed:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    // Send to DLQ
    await sendToDeadLetterQueue(event, errorMessage);

    // Publish failure notification
    await publishNotification(false, `Replication failed: ${errorMessage}`);

    throw error;
  }
}
