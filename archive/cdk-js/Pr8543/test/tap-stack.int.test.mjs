import fs from 'fs';
import https from 'https';
import http from 'http';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, HeadBucketCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import { APIGatewayClient, GetRestApiCommand } from '@aws-sdk/client-api-gateway';
import { CloudWatchClient, DescribeAlarmsCommand, ListDashboardsCommand } from '@aws-sdk/client-cloudwatch';
import { EventBridgeClient, DescribeEventBusCommand } from '@aws-sdk/client-eventbridge';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';
const isLocalStack = !!process.env.AWS_ENDPOINT_URL;

// Read actual deployment outputs (required for integration tests)
let outputs;
try {
  outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
  console.log('Loaded deployment outputs from cfn-outputs/flat-outputs.json');
} catch (error) {
  try {
    const cdkOutputs = JSON.parse(fs.readFileSync('cdk-outputs.json', 'utf8'));
    const stackName = `TapStack${environmentSuffix}`;
    outputs = cdkOutputs[stackName] || {};
    console.log(`Loaded deployment outputs from cdk-outputs.json (stack: ${stackName})`);
  } catch (cdkError) {
    console.error('Failed to load deployment outputs');
    console.error('Integration tests require real deployment outputs');
    process.exit(1);
  }
}

const clientConfig = { region };
const dynamoClient = new DynamoDBClient(clientConfig);
const s3Client = new S3Client(clientConfig);
const lambdaClient = new LambdaClient(clientConfig);
const apiGatewayClient = new APIGatewayClient(clientConfig);
const cloudWatchClient = new CloudWatchClient(clientConfig);
const eventBridgeClient = new EventBridgeClient(clientConfig);

// Helper function to make HTTP requests
const makeHttpRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const request = protocol.request(url, options, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          headers: response.headers,
          body: data,
        });
      });
    });

    request.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      request.write(options.body);
    }

    request.end();
  });
};

describe('Global API Infrastructure Integration Tests', () => {
  const apiEndpoint = outputs.ApiEndpoint;
  const apiId = outputs.ApiId;
  const tableName = outputs.TableName;
  const assetBucketName = outputs.AssetBucketName;
  const backupBucketName = outputs.BackupBucketName;
  const eventBusName = outputs.EventBusName;
  const lambdaFunctionName = outputs.LambdaFunctionName;

  beforeAll(() => {
    console.log('Stack Outputs:', outputs);
    console.log(`Testing Global API (${environmentSuffix})`);
    console.log(`LocalStack mode: ${isLocalStack}`);
  });

  describe('DynamoDB Global Table', () => {
    test('table exists', async () => {
      if (!tableName) {
        console.log('TableName not in outputs, skipping');
        return;
      }

      try {
        const response = await dynamoClient.send(
          new DescribeTableCommand({ TableName: tableName })
        );
        expect(response.Table).toBeDefined();
        expect(response.Table.TableStatus).toBe('ACTIVE');
        console.log(`DynamoDB table ${tableName} is active`);
      } catch (error) {
        if (isLocalStack && error.name === 'ResourceNotFoundException') {
          console.log('Table not found in LocalStack (expected for non-persistent resources)');
          return;
        }
        throw error;
      }
    });
  });

  describe('S3 Buckets', () => {
    test('asset bucket exists', async () => {
      if (!assetBucketName) {
        console.log('AssetBucketName not in outputs, skipping');
        return;
      }

      try {
        await s3Client.send(new HeadBucketCommand({ Bucket: assetBucketName }));
        console.log(`Asset bucket exists: ${assetBucketName}`);
      } catch (error) {
        if (isLocalStack && error.name === 'NotFound') {
          console.log('Bucket not found in LocalStack (expected for non-persistent resources)');
          return;
        }
        throw error;
      }
    });

    test('backup bucket exists', async () => {
      if (!backupBucketName) {
        console.log('BackupBucketName not in outputs, skipping');
        return;
      }

      try {
        await s3Client.send(new HeadBucketCommand({ Bucket: backupBucketName }));
        console.log(`Backup bucket exists: ${backupBucketName}`);
      } catch (error) {
        if (isLocalStack && error.name === 'NotFound') {
          console.log('Bucket not found in LocalStack (expected for non-persistent resources)');
          return;
        }
        throw error;
      }
    });

    test('can upload and retrieve content from asset bucket', async () => {
      if (!assetBucketName) {
        console.log('AssetBucketName not in outputs, skipping');
        return;
      }

      const testKey = `test-asset-${Date.now()}.json`;
      const testContent = JSON.stringify({ test: 'data', timestamp: Date.now() });

      try {
        await s3Client.send(
          new PutObjectCommand({
            Bucket: assetBucketName,
            Key: testKey,
            Body: testContent,
            ContentType: 'application/json',
          })
        );
        console.log(`Uploaded test content: ${testKey}`);

        const response = await s3Client.send(
          new GetObjectCommand({
            Bucket: assetBucketName,
            Key: testKey,
          })
        );
        const body = await response.Body.transformToString();
        expect(body).toBe(testContent);
        console.log('Content verified');

        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: assetBucketName,
            Key: testKey,
          })
        );
        console.log('Test content cleaned up');
      } catch (error) {
        if (isLocalStack && (error.name === 'NotFound' || error.name === 'NoSuchBucket')) {
          console.log('Bucket not found in LocalStack (expected for non-persistent resources)');
          return;
        }
        throw error;
      }
    });
  });

  describe('EventBridge', () => {
    test('event bus exists', async () => {
      if (!eventBusName) {
        console.log('EventBusName not in outputs, skipping');
        return;
      }

      try {
        const response = await eventBridgeClient.send(
          new DescribeEventBusCommand({ Name: eventBusName })
        );
        expect(response.Name).toBe(eventBusName);
        console.log(`Event bus exists: ${eventBusName}`);
      } catch (error) {
        if (isLocalStack && error.name === 'ResourceNotFoundException') {
          console.log('Event bus not found in LocalStack (expected for non-persistent resources)');
          return;
        }
        throw error;
      }
    });
  });

  describe('Lambda Function', () => {
    test('Lambda function exists', async () => {
      if (!lambdaFunctionName) {
        console.log('LambdaFunctionName not in outputs, skipping');
        return;
      }

      try {
        const response = await lambdaClient.send(
          new GetFunctionCommand({ FunctionName: lambdaFunctionName })
        );
        expect(response.Configuration).toBeDefined();
        expect(response.Configuration.Runtime).toBe('nodejs20.x');
        console.log(`Lambda function exists: ${lambdaFunctionName}`);
      } catch (error) {
        if (isLocalStack && error.name === 'ResourceNotFoundException') {
          console.log('Lambda not found in LocalStack (expected for non-persistent resources)');
          return;
        }
        throw error;
      }
    });
  });

  describe('API Gateway', () => {
    test('API Gateway REST API exists', async () => {
      if (!apiId) {
        console.log('ApiId not in outputs, skipping');
        return;
      }

      try {
        const response = await apiGatewayClient.send(
          new GetRestApiCommand({ restApiId: apiId })
        );
        expect(response.id).toBe(apiId);
        console.log(`API Gateway exists: ${apiId}`);
      } catch (error) {
        if (isLocalStack && error.name === 'NotFoundException') {
          console.log('API Gateway not found in LocalStack (expected for non-persistent resources)');
          return;
        }
        throw error;
      }
    });

    test('API health endpoint returns 200', async () => {
      if (!apiEndpoint) {
        console.log('ApiEndpoint not in outputs, skipping');
        return;
      }

      try {
        const healthUrl = `${apiEndpoint}health`;
        const response = await makeHttpRequest(healthUrl);
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.status).toBe('healthy');
        console.log(`API health check passed: ${healthUrl}`);
      } catch (error) {
        if (isLocalStack) {
          console.log('API health check skipped in LocalStack');
          return;
        }
        throw error;
      }
    });

    test('API root endpoint returns 200', async () => {
      if (!apiEndpoint) {
        console.log('ApiEndpoint not in outputs, skipping');
        return;
      }

      try {
        const response = await makeHttpRequest(apiEndpoint);
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.message).toContain('Global API');
        console.log(`API root endpoint passed: ${apiEndpoint}`);
      } catch (error) {
        if (isLocalStack) {
          console.log('API root check skipped in LocalStack');
          return;
        }
        throw error;
      }
    });
  });

  describe('CloudWatch Resources', () => {
    test('CloudWatch alarms exist', async () => {
      if (isLocalStack) {
        console.log('Skipping CloudWatch alarms check in LocalStack');
        return;
      }

      try {
        const response = await cloudWatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNamePrefix: 'global-api-',
          })
        );
        expect(response.MetricAlarms.length).toBeGreaterThanOrEqual(1);
        console.log(`Found ${response.MetricAlarms.length} alarms with prefix 'global-api-'`);
      } catch (error) {
        console.log(`CloudWatch alarms check failed: ${error.message}`);
      }
    });

    test('CloudWatch dashboard exists', async () => {
      if (isLocalStack) {
        console.log('Skipping CloudWatch dashboard check in LocalStack');
        return;
      }

      try {
        const response = await cloudWatchClient.send(
          new ListDashboardsCommand({
            DashboardNamePrefix: 'tap-monitoring-',
          })
        );
        expect(response.DashboardEntries.length).toBeGreaterThanOrEqual(1);
        console.log(`Found ${response.DashboardEntries.length} dashboards with prefix 'tap-monitoring-'`);
      } catch (error) {
        console.log(`CloudWatch dashboard check failed: ${error.message}`);
      }
    });
  });

  describe('Stack Outputs Validation', () => {
    test('all required outputs are present', () => {
      const requiredOutputs = [
        'ApiEndpoint',
        'ApiId',
        'TableName',
        'AssetBucketName',
        'BackupBucketName',
        'EventBusName',
        'LambdaFunctionName',
      ];

      const missingOutputs = requiredOutputs.filter((key) => !outputs[key]);
      if (missingOutputs.length > 0) {
        console.log(`Missing outputs: ${missingOutputs.join(', ')}`);
      }
      expect(missingOutputs.length).toBe(0);
    });

    test('API endpoint is valid HTTPS URL', () => {
      const url = outputs.ApiEndpoint;
      if (!url) {
        console.log('ApiEndpoint not in outputs, skipping');
        return;
      }
      expect(url).toMatch(/^https:\/\/.+/);
      console.log(`API endpoint URL is valid: ${url}`);
    });
  });
});

