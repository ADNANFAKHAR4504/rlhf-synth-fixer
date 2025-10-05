import {
  LambdaClient,
  InvokeCommand
} from '@aws-sdk/client-lambda';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  PutItemCommand,
  DeleteItemCommand
} from '@aws-sdk/client-dynamodb';
import {
  CloudWatchLogsClient,
  FilterLogEventsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import fs from 'fs';

// Load outputs from deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const {
  UserPreferencesTable,
  JobPostingsTable,
  S3Bucket,
  LambdaFunctionARN
} = outputs;

// Initialize AWS SDK clients
const lambdaClient = new LambdaClient({});
const s3Client = new S3Client({});
const dynamoDBClient = new DynamoDBClient({});
const cloudWatchLogsClient = new CloudWatchLogsClient({});

const TEST_USER_ID = 'integration-test-user-123';
const TEST_JOB_ID = 'integration-test-job-456';
const TEST_EMAIL = 'test-user@example.com';
const TEMPLATE_KEY = 'notification-template.html';

describe('Serverless Email Notification System - Integration Tests', () => {

  // Set a longer timeout for AWS operations
  jest.setTimeout(60000); // 60 seconds

  beforeAll(async () => {
    // Setup: Create test data in DynamoDB and S3
    await s3Client.send(new PutObjectCommand({
      Bucket: S3Bucket,
      Key: TEMPLATE_KEY,
      Body: '<html><body><h1>New Jobs!</h1></body></html>'
    }));

    await dynamoDBClient.send(new PutItemCommand({
      TableName: UserPreferencesTable,
      Item: {
        userId: {
          S: TEST_USER_ID
        },
        email: {
          S: TEST_EMAIL
        },
        keywords: {
          SS: ['developer', 'remote']
        }
      }
    }));

    await dynamoDBClient.send(new PutItemCommand({
      TableName: JobPostingsTable,
      Item: {
        jobId: {
          S: TEST_JOB_ID
        },
        title: {
          S: 'Senior Remote Developer'
        },
        description: {
          S: 'A great job opportunity.'
        }
      }
    }));
  });

  afterAll(async () => {
    // Teardown: Clean up test data
    await s3Client.send(new DeleteObjectCommand({
      Bucket: S3Bucket,
      Key: TEMPLATE_KEY
    }));
    await dynamoDBClient.send(new DeleteItemCommand({
      TableName: UserPreferencesTable,
      Key: {
        userId: {
          S: TEST_USER_ID
        }
      }
    }));
    await dynamoDBClient.send(new DeleteItemCommand({
      TableName: JobPostingsTable,
      Key: {
        jobId: {
          S: TEST_JOB_ID
        }
      }
    }));
  });

  test('Lambda function should execute successfully and log success message', async () => {
    const functionName = LambdaFunctionARN.split(':').pop();
    const logGroupName = `/aws/lambda/${functionName}`;
    const startTime = Date.now();

    // Invoke the Lambda function
    const invokeCommand = new InvokeCommand({
      FunctionName: LambdaFunctionARN,
      InvocationType: 'RequestResponse'
    });
    const response = await lambdaClient.send(invokeCommand);

    // Check for successful invocation
    expect(response.StatusCode).toBe(200);
    const payload = JSON.parse(new TextDecoder().decode(response.Payload));
    expect(payload.body).toContain('Notifications sent successfully');

    // Wait a moment for logs to propagate
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check CloudWatch logs for the success message
    const filterLogEventsCommand = new FilterLogEventsCommand({
      logGroupName: logGroupName,
      startTime: startTime,
      filterPattern: '"Notifications sent successfully"'
    });

    const logEvents = await cloudWatchLogsClient.send(filterLogEventsCommand);
    expect(logEvents.events?.length).toBeGreaterThan(0);
  });
});
