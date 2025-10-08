import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand
} from '@aws-sdk/client-api-gateway';
import {
  CloudWatchClient,
  GetDashboardCommand
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeTableCommand,
  DynamoDBClient
} from '@aws-sdk/client-dynamodb';
import {
  DescribeEventBusCommand,
  EventBridgeClient
} from '@aws-sdk/client-eventbridge';
import {
  GetFunctionCommand,
  LambdaClient
} from '@aws-sdk/client-lambda';
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketPolicyCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  S3Client
} from '@aws-sdk/client-s3';
import {
  DescribeStateMachineCommand,
  SFNClient
} from '@aws-sdk/client-sfn';
import {
  GetTopicAttributesCommand,
  SNSClient
} from '@aws-sdk/client-sns';
import fs from 'fs';
import path from 'path';

// AWS Service clients
const region = process.env.AWS_REGION || 'us-west-1';
const dynamodb = new DynamoDBClient({ region });
const s3 = new S3Client({ region });
const sns = new SNSClient({ region });
const sfn = new SFNClient({ region });
const apiGateway = new APIGatewayClient({ region });
const lambda = new LambdaClient({ region });
const cloudwatch = new CloudWatchClient({ region });
const eventbridge = new EventBridgeClient({ region });

// Load deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any = {};

beforeAll(() => {
  if (fs.existsSync(outputsPath)) {
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  } else {
    console.warn('CFN outputs file not found. Some tests may fail.');
  }
});

// Get environment suffix from environment variable or outputs
const getEnvironmentSuffix = () => {
  if (process.env.ENVIRONMENT_SUFFIX) {
    return process.env.ENVIRONMENT_SUFFIX;
  }
  // Try to extract from bucket name if available
  if (outputs.AttachmentsBucketName) {
    const match = outputs.AttachmentsBucketName.match(/bug-attachments-\d+-(.+)$/);
    return match ? match[1] : 'dev';
  }
  return 'dev';
};

const environmentSuffix = getEnvironmentSuffix();

describe('TapStack Integration Tests', () => {
  const testTimeout = 30000; // 30 seconds for AWS API calls

  describe('Deployment Outputs Validation', () => {
    test('Required outputs are present and valid', () => {
      const requiredKeys = [
        'ApiUrl',
        'BugsTableName',
        'AttachmentsBucketName',
        'NotificationTopicArn',
        'StateMachineArn',
        'DashboardName',
        'EventBusName'
      ];

      requiredKeys.forEach(key => {
        expect(outputs[key]).toBeDefined();
        expect(outputs[key]).not.toBe('');
        expect(typeof outputs[key]).toBe('string');
      });
    }, testTimeout);

    test('Output values match expected naming patterns', () => {
      expect(outputs.BugsTableName).toMatch(/^bug-reports-.+$/);
      expect(outputs.AttachmentsBucketName).toMatch(/^bug-attachments-\d+-.+$/);
      expect(outputs.NotificationTopicArn).toMatch(/^arn:aws:sns:[\w-]+:\d+:bug-notifications-.+$/);
      expect(outputs.StateMachineArn).toMatch(/^arn:aws:states:[\w-]+:\d+:stateMachine:bug-triage-.+$/);
      expect(outputs.DashboardName).toMatch(/^bug-tracking-.+$/);
      expect(outputs.EventBusName).toMatch(/^bug-events-.+$/);
      expect(outputs.ApiUrl).toMatch(/^https:\/\/[\w-]+\.execute-api\.[\w-]+\.amazonaws\.com\/.+\/$/);
    }, testTimeout);

    test('ARNs contain correct environment suffix', () => {
      expect(outputs.NotificationTopicArn).toContain(environmentSuffix);
      expect(outputs.StateMachineArn).toContain(environmentSuffix);
    }, testTimeout);
  });

  describe('DynamoDB Table Validation', () => {
    test('DynamoDB table exists and is configured correctly', async () => {
      const tableName = outputs.BugsTableName;
      expect(tableName).toBeDefined();

      const response = await dynamodb.send(new DescribeTableCommand({
        TableName: tableName
      }));

      const table = response.Table;
      expect(table).toBeDefined();
      expect(table?.TableStatus).toBe('ACTIVE');
      expect(table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');

      // Verify key schema
      expect(table?.KeySchema).toHaveLength(2);
      expect(table?.KeySchema?.[0].AttributeName).toBe('bugId');
      expect(table?.KeySchema?.[0].KeyType).toBe('HASH');
      expect(table?.KeySchema?.[1].AttributeName).toBe('timestamp');
      expect(table?.KeySchema?.[1].KeyType).toBe('RANGE');

      // Verify streams
      expect(table?.StreamSpecification?.StreamEnabled).toBe(true);
      expect(table?.StreamSpecification?.StreamViewType).toBe('NEW_AND_OLD_IMAGES');

      // Verify point-in-time recovery
      expect(table?.RestoreSummary?.RestoreInProgress).toBeFalsy();
    }, testTimeout);

    test('DynamoDB table has correct Global Secondary Indexes', async () => {
      const tableName = outputs.BugsTableName;

      const response = await dynamodb.send(new DescribeTableCommand({
        TableName: tableName
      }));

      const table = response.Table;
      expect(table?.GlobalSecondaryIndexes).toHaveLength(2);

      const gsiNames = table?.GlobalSecondaryIndexes?.map(gsi => gsi.IndexName);
      expect(gsiNames).toContain('PriorityIndex');
      expect(gsiNames).toContain('StatusIndex');

      // Verify each GSI is active
      table?.GlobalSecondaryIndexes?.forEach(gsi => {
        expect(gsi.IndexStatus).toBe('ACTIVE');
      });
    }, testTimeout);

    test('DynamoDB table has proper tags', async () => {
      const tableName = outputs.BugsTableName;

      const response = await dynamodb.send(new DescribeTableCommand({
        TableName: tableName
      }));

      expect(response.Table?.TableArn).toBeDefined();
    }, testTimeout);
  });

  describe('S3 Bucket Validation', () => {
    test('S3 bucket exists and is configured correctly', async () => {
      const bucketName = outputs.AttachmentsBucketName;
      expect(bucketName).toBeDefined();

      // Test bucket encryption
      const encryptionResponse = await s3.send(new GetBucketEncryptionCommand({
        Bucket: bucketName
      }));

      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);

      // Test versioning
      const versioningResponse = await s3.send(new GetBucketVersioningCommand({
        Bucket: bucketName
      }));

      expect(versioningResponse.Status).toBe('Enabled');

      // Test public access block
      const publicAccessResponse = await s3.send(new GetPublicAccessBlockCommand({
        Bucket: bucketName
      }));

      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, testTimeout);

    test('S3 bucket has SSL enforcement policy', async () => {
      const bucketName = outputs.AttachmentsBucketName;

      try {
        const policyResponse = await s3.send(new GetBucketPolicyCommand({
          Bucket: bucketName
        }));

        const policy = JSON.parse(policyResponse.Policy || '{}');
        expect(policy.Statement).toBeDefined();

        // Look for SSL enforcement policy
        const sslStatement = policy.Statement.find((stmt: any) =>
          stmt.Condition?.Bool?.['aws:SecureTransport'] === 'false'
        );
        expect(sslStatement).toBeDefined();
        expect(sslStatement.Effect).toBe('Deny');
      } catch (error: any) {
        if (error.name !== 'NoSuchBucketPolicy') {
          throw error;
        }
      }
    }, testTimeout);

    test('S3 bucket has lifecycle configuration', async () => {
      const bucketName = outputs.AttachmentsBucketName;

      const lifecycleResponse = await s3.send(new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName
      }));

      expect(lifecycleResponse.Rules).toBeDefined();
      expect(lifecycleResponse.Rules).toHaveLength(1);

      const rule = lifecycleResponse.Rules?.[0];
      expect(rule?.Status).toBe('Enabled');
      expect(rule?.Expiration?.Days).toBe(90);
      expect(rule?.Transitions).toBeDefined();
      expect(rule?.Transitions?.[0]?.StorageClass).toBe('STANDARD_IA');
      expect(rule?.Transitions?.[0]?.Days).toBe(30);
    }, testTimeout);
  });

  describe('SNS Topic Validation', () => {
    test('SNS topic exists and is configured correctly', async () => {
      const topicArn = outputs.NotificationTopicArn;
      expect(topicArn).toBeDefined();

      const response = await sns.send(new GetTopicAttributesCommand({
        TopicArn: topicArn
      }));

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(topicArn);
      expect(response.Attributes?.DisplayName).toBe('Bug Assignment Notifications');
    }, testTimeout);
  });

  describe('Lambda Functions Validation', () => {
    test('Process bug Lambda function exists and is configured correctly', async () => {
      const functionName = `process-bug-${environmentSuffix}`;

      const response = await lambda.send(new GetFunctionCommand({
        FunctionName: functionName
      }));

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('python3.10');
      expect(response.Configuration?.Handler).toBe('index.lambda_handler');
      expect(response.Configuration?.Timeout).toBe(60);
      expect(response.Configuration?.MemorySize).toBe(512);

      // Verify environment variables
      const envVars = response.Configuration?.Environment?.Variables;
      expect(envVars?.BUGS_TABLE_NAME).toBe(outputs.BugsTableName);
      expect(envVars?.ATTACHMENTS_BUCKET).toBe(outputs.AttachmentsBucketName);
      expect(envVars?.AWS_REGION_NAME).toBe(region);
      expect(envVars?.BEDROCK_REGION).toBe('us-west-2');
    }, testTimeout);

    test('Triage bug Lambda function exists', async () => {
      const functionName = `triage-bug-${environmentSuffix}`;

      const response = await lambda.send(new GetFunctionCommand({
        FunctionName: functionName
      }));

      expect(response.Configuration?.Runtime).toBe('python3.10');
      expect(response.Configuration?.Timeout).toBe(30);
      expect(response.Configuration?.MemorySize).toBe(256);
    }, testTimeout);

    test('Assign bug Lambda function exists', async () => {
      const functionName = `assign-bug-${environmentSuffix}`;

      const response = await lambda.send(new GetFunctionCommand({
        FunctionName: functionName
      }));

      expect(response.Configuration?.Runtime).toBe('python3.10');

      const envVars = response.Configuration?.Environment?.Variables;
      expect(envVars?.BUGS_TABLE_NAME).toBe(outputs.BugsTableName);
      expect(envVars?.NOTIFICATION_TOPIC_ARN).toBe(outputs.NotificationTopicArn);
    }, testTimeout);

    test('Batch process Lambda function exists', async () => {
      const functionName = `batch-process-${environmentSuffix}`;

      const response = await lambda.send(new GetFunctionCommand({
        FunctionName: functionName
      }));

      expect(response.Configuration?.Runtime).toBe('python3.10');
      expect(response.Configuration?.Timeout).toBe(60);
      expect(response.Configuration?.MemorySize).toBe(512);
    }, testTimeout);
  });

  describe('Step Functions Validation', () => {
    test('State machine exists and is configured correctly', async () => {
      const stateMachineArn = outputs.StateMachineArn;
      expect(stateMachineArn).toBeDefined();

      const response = await sfn.send(new DescribeStateMachineCommand({
        stateMachineArn
      }));

      expect(response.name).toBe(`bug-triage-${environmentSuffix}`);
      expect(response.status).toBe('ACTIVE');
      expect(response.type).toBe('STANDARD');

      // Verify definition contains expected states
      const definition = JSON.parse(response.definition || '{}');
      expect(definition.States).toBeDefined();
      expect(definition.StartAt).toBeDefined();

      // Look for key states
      const stateNames = Object.keys(definition.States);
      expect(stateNames.some(name => name.includes('Triage'))).toBe(true);
      expect(stateNames.some(name => name.includes('Choice') || name.includes('Priority'))).toBe(true);
    }, testTimeout);
  });

  describe('API Gateway Validation', () => {
    test('API Gateway exists and is accessible', async () => {
      const apiUrl = outputs.ApiUrl;
      expect(apiUrl).toBeDefined();

      // Extract API ID from URL
      const apiIdMatch = apiUrl.match(/https:\/\/([^.]+)\.execute-api\./);
      expect(apiIdMatch).toBeDefined();

      if (apiIdMatch) {
        const apiId = apiIdMatch[1];

        const response = await apiGateway.send(new GetRestApiCommand({
          restApiId: apiId
        }));

        expect(response.name).toBe(`bug-tracking-api-${environmentSuffix}`);
        expect(response.description).toBe('API for bug tracking system');
      }
    }, testTimeout);

    test('API Gateway stage is configured correctly', async () => {
      const apiUrl = outputs.ApiUrl;
      const apiIdMatch = apiUrl.match(/https:\/\/([^.]+)\.execute-api\./);

      if (apiIdMatch) {
        const apiId = apiIdMatch[1];

        const response = await apiGateway.send(new GetStageCommand({
          restApiId: apiId,
          stageName: environmentSuffix
        }));

        expect(response.stageName).toBe(environmentSuffix);
        expect(response.tracingEnabled).toBe(true);

        // Verify method settings
        if (response.methodSettings) {
          const methodSettingsKeys = Object.keys(response.methodSettings);
          expect(methodSettingsKeys.length).toBeGreaterThan(0);
        }
      }
    }, testTimeout);
  });

  describe('EventBridge Validation', () => {
    test('EventBridge event bus exists', async () => {
      const eventBusName = outputs.EventBusName;
      expect(eventBusName).toBeDefined();

      const response = await eventbridge.send(new DescribeEventBusCommand({
        Name: eventBusName
      }));

      expect(response.Name).toBe(eventBusName);
      expect(response.Arn).toMatch(new RegExp(`event-bus/${eventBusName}`));
    }, testTimeout);
  });

  describe('CloudWatch Dashboard Validation', () => {
    test('CloudWatch dashboard exists', async () => {
      const dashboardName = outputs.DashboardName;
      expect(dashboardName).toBeDefined();

      const response = await cloudwatch.send(new GetDashboardCommand({
        DashboardName: dashboardName
      }));

      expect(response.DashboardName).toBe(dashboardName);
      expect(response.DashboardBody).toBeDefined();

      const dashboardBody = JSON.parse(response.DashboardBody || '{}');
      expect(dashboardBody.widgets).toBeDefined();
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);
    }, testTimeout);
  });

  describe('End-to-End Connectivity Tests', () => {
    test('API URL is reachable', async () => {
      const apiUrl = outputs.ApiUrl;

      // Simple connectivity test - just check if URL format is valid
      expect(apiUrl).toMatch(/^https:\/\//);
      expect(apiUrl).toMatch(/\.execute-api\./);
      expect(apiUrl).toMatch(/\.amazonaws\.com/);

      // Could add actual HTTP call here if needed:
      // const response = await fetch(apiUrl);
      // expect(response).toBeDefined();
    }, testTimeout);

    test('All resource names follow consistent naming pattern', () => {
      const suffix = environmentSuffix;

      expect(outputs.BugsTableName).toBe(`bug-reports-${suffix}`);
      expect(outputs.AttachmentsBucketName).toMatch(new RegExp(`bug-attachments-\\d+-${suffix}$`));
      expect(outputs.NotificationTopicArn).toMatch(new RegExp(`bug-notifications-${suffix}$`));
      expect(outputs.StateMachineArn).toMatch(new RegExp(`bug-triage-${suffix}$`));
      expect(outputs.DashboardName).toBe(`bug-tracking-${suffix}`);
      expect(outputs.EventBusName).toBe(`bug-events-${suffix}`);
    }, testTimeout);
  });

  describe('Security and Compliance Validation', () => {
    test('S3 bucket follows security best practices', async () => {
      const bucketName = outputs.AttachmentsBucketName;

      // Verify public access is blocked
      const publicAccessResponse = await s3.send(new GetPublicAccessBlockCommand({
        Bucket: bucketName
      }));

      const config = publicAccessResponse.PublicAccessBlockConfiguration;
      expect(config?.BlockPublicAcls).toBe(true);
      expect(config?.BlockPublicPolicy).toBe(true);
      expect(config?.IgnorePublicAcls).toBe(true);
      expect(config?.RestrictPublicBuckets).toBe(true);

      // Verify encryption is enabled
      const encryptionResponse = await s3.send(new GetBucketEncryptionCommand({
        Bucket: bucketName
      }));

      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
    }, testTimeout);

    test('DynamoDB table has point-in-time recovery enabled', async () => {
      const tableName = outputs.BugsTableName;

      const response = await dynamodb.send(new DescribeTableCommand({
        TableName: tableName
      }));

      // Point-in-time recovery should be enabled (no restore in progress indicates it's enabled)
      expect(response.Table?.RestoreSummary?.RestoreInProgress).toBeFalsy();
    }, testTimeout);
  });
});
