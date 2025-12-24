/**
 * LocalStack Test Helper for CDK TypeScript
 * Template: cdk-ts-test-helper
 * 
 * Provides test utilities for LocalStack integration tests
 */

import { S3Client, CreateBucketCommand, DeleteBucketCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, CreateTableCommand, DeleteTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { SQSClient, CreateQueueCommand, DeleteQueueCommand, SendMessageCommand, ReceiveMessageCommand } from '@aws-sdk/client-sqs';

// LocalStack configuration
const isLocalStack = (): boolean => {
  return !!(
    process.env.LOCALSTACK_HOSTNAME ||
    process.env.AWS_ENDPOINT_URL ||
    process.env.CDK_LOCAL
  );
};

const getLocalStackEndpoint = (): string => {
  return process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
};

// Base client configuration
const getClientConfig = () => ({
  endpoint: isLocalStack() ? getLocalStackEndpoint() : undefined,
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: isLocalStack() ? {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  } : undefined,
});

// S3 client with path-style access for LocalStack
export const getS3Client = (): S3Client => {
  return new S3Client({
    ...getClientConfig(),
    forcePathStyle: isLocalStack(), // Required for LocalStack
  });
};

// DynamoDB client
export const getDynamoDBClient = (): DynamoDBClient => {
  return new DynamoDBClient(getClientConfig());
};

// Lambda client
export const getLambdaClient = (): LambdaClient => {
  return new LambdaClient(getClientConfig());
};

// SQS client
export const getSQSClient = (): SQSClient => {
  return new SQSClient(getClientConfig());
};

// ═══════════════════════════════════════════════════════════════════════════════
// RETRY HELPER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Retry helper for flaky LocalStack operations
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoff?: number;
    retryableErrors?: string[];
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 2,
    retryableErrors = ['ECONNREFUSED', 'socket hang up', 'ResourceNotFoundException', 'ServiceUnavailable']
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      const isRetryable = retryableErrors.some(e => 
        lastError?.message?.includes(e) || lastError?.name?.includes(e)
      );
      
      if (!isRetryable || attempt === maxRetries - 1) {
        throw lastError;
      }
      
      const waitTime = delay * Math.pow(backoff, attempt);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOCALSTACK HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Wait for LocalStack to be ready
 */
export async function waitForLocalStack(timeoutMs = 30000): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await fetch(`${getLocalStackEndpoint()}/_localstack/health`);
      if (response.ok) {
        return true;
      }
    } catch {
      // LocalStack not ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error('LocalStack did not become ready within timeout');
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESOURCE CLEANUP HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Delete all objects from S3 bucket and then delete the bucket
 */
export async function cleanupS3Bucket(bucketName: string): Promise<void> {
  const s3 = getS3Client();
  
  try {
    // List and delete all objects
    const listResponse = await s3.send(new ListObjectsV2Command({ Bucket: bucketName }));
    
    if (listResponse.Contents && listResponse.Contents.length > 0) {
      await s3.send(new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
          Objects: listResponse.Contents.map(obj => ({ Key: obj.Key! }))
        }
      }));
    }
    
    // Delete the bucket
    await s3.send(new DeleteBucketCommand({ Bucket: bucketName }));
  } catch (error) {
    // Ignore if bucket doesn't exist
    if ((error as Error).name !== 'NoSuchBucket') {
      console.warn(`Warning: Could not cleanup bucket ${bucketName}:`, error);
    }
  }
}

/**
 * Delete DynamoDB table
 */
export async function cleanupDynamoDBTable(tableName: string): Promise<void> {
  const dynamodb = getDynamoDBClient();
  
  try {
    await dynamodb.send(new DeleteTableCommand({ TableName: tableName }));
  } catch (error) {
    // Ignore if table doesn't exist
    if ((error as Error).name !== 'ResourceNotFoundException') {
      console.warn(`Warning: Could not cleanup table ${tableName}:`, error);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// JEST SETUP HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Setup function for Jest beforeAll hook
 */
export async function setupLocalStackTest(): Promise<void> {
  if (isLocalStack()) {
    await waitForLocalStack();
  }
}

/**
 * Teardown function for Jest afterAll hook
 */
export async function teardownLocalStackTest(resources: {
  buckets?: string[];
  tables?: string[];
}): Promise<void> {
  const { buckets = [], tables = [] } = resources;
  
  // Cleanup S3 buckets
  for (const bucket of buckets) {
    await cleanupS3Bucket(bucket);
  }
  
  // Cleanup DynamoDB tables
  for (const table of tables) {
    await cleanupDynamoDBTable(table);
  }
}

// Export for convenience
export {
  isLocalStack,
  getLocalStackEndpoint,
  getClientConfig,
};

