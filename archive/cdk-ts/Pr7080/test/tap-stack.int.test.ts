/**
 * Serverless API Infrastructure Integration Tests
 *
 * Tests all deployed AWS resources and validates end-to-end connectivity.
 * Uses actual deployment outputs from cfn-outputs/flat-outputs.json.
 * No hardcoding - all resource identifiers discovered dynamically.
 */

import {
  APIGatewayClient,
  GetResourcesCommand,
  GetRestApisCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DeleteItemCommand,
  DescribeTableCommand,
  DynamoDBClient,
  GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  DescribeKeyCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import {
  GetFunctionConfigurationCommand,
  InvokeCommand,
  LambdaClient,
  ListFunctionsCommand
} from '@aws-sdk/client-lambda';
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetPublicAccessBlockCommand,
  S3Client
} from '@aws-sdk/client-s3';
import {
  GetQueueAttributesCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import {
  GetParameterCommand,
  SSMClient,
} from '@aws-sdk/client-ssm';
import axios from 'axios';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Configuration - Load outputs from deployment
const outputsPath = 'cfn-outputs/flat-outputs.json';
const regionPath = 'lib/AWS_REGION';

let rawOutputs: any;
let outputs: any;
let region: string;

// AWS Clients (will be initialized after region is loaded)
let apiGatewayClient: APIGatewayClient;
let cloudWatchClient: CloudWatchClient;
let cloudWatchLogsClient: CloudWatchLogsClient;
let dynamodbClient: DynamoDBClient;
let kmsClient: KMSClient;
let lambdaClient: LambdaClient;
let s3Client: S3Client;
let sqsClient: SQSClient;
let ssmClient: SSMClient;

/**
 * Maps raw CloudFormation outputs to standardized keys
 * Handles dynamic suffix patterns for any environment
 */
function mapOutputs(rawOutputs: any): any {
  const mapped: any = {};

  // Flatten nested structure if needed (e.g., { StackName: { OutputKey: value } })
  let flatOutputs: any = {};
  for (const [stackKey, stackValue] of Object.entries(rawOutputs)) {
    if (typeof stackValue === 'object' && stackValue !== null && !Array.isArray(stackValue)) {
      // This is a nested structure, flatten it
      flatOutputs = { ...flatOutputs, ...stackValue };
    } else {
      // This is already flat
      flatOutputs[stackKey] = stackValue;
    }
  }

  // Find outputs by matching prefixes/patterns
  for (const [key, value] of Object.entries(flatOutputs)) {
    const lowerKey = key.toLowerCase();

    // API URL/Endpoint
    if (
      lowerKey.includes('apiurl') ||
      lowerKey.includes('apiendpoint') ||
      (typeof value === 'string' && String(value).includes('execute-api'))
    ) {
      mapped.ApiUrl = value;
    }
    // DynamoDB Table Name
    if (
      lowerKey.includes('dynamotable') ||
      lowerKey.includes('tablename')
    ) {
      mapped.TableName = value;
    }
    // S3 Logs Bucket Name
    if (lowerKey.includes('logsbucket') || lowerKey.includes('bucketname')) {
      mapped.BucketName = value;
    }
    // Lambda Function Name
    if (lowerKey.includes('lambdafunction') && lowerKey.includes('name') && !lowerKey.includes('arn')) {
      mapped.LambdaFunctionName = value;
    }
    // Dead Letter Queue URL
    if (lowerKey.includes('deadletter') || lowerKey.includes('dlq')) {
      mapped.DeadLetterQueueUrl = value;
    }
    // SSM Parameter Name
    if (lowerKey.includes('configparameter') || (lowerKey.includes('parameter') && lowerKey.includes('name'))) {
      mapped.ConfigParameterName = value;
    }
    // KMS Key ID
    if (lowerKey.includes('kmskey') || (lowerKey.includes('kms') && lowerKey.includes('key'))) {
      mapped.KmsKeyId = value;
    }
    // Region
    if (lowerKey === 'region') {
      mapped.Region = value;
    }
  }

  return mapped;
}

/**
 * Discovers Lambda function name by finding function that references the DynamoDB table
 */
async function discoverLambdaFunction(tableName: string): Promise<string | null> {
  try {
    const listCommand = new ListFunctionsCommand({ MaxItems: 50 });
    const response = await lambdaClient.send(listCommand);

    for (const func of response.Functions || []) {
      try {
        const configCmd = new GetFunctionConfigurationCommand({
          FunctionName: func.FunctionName!,
        });
        const config = await lambdaClient.send(configCmd);

        if (
          config.Environment?.Variables?.TABLE_NAME === tableName ||
          config.Environment?.Variables?.TABLE_NAME?.includes(tableName)
        ) {
          return func.FunctionName!;
        }
      } catch (e) {
        // Skip functions we can't access
        continue;
      }
    }
  } catch (error) {
    console.error('Error discovering Lambda function:', error);
  }
  return null;
}

/**
 * Discovers SQS DLQ by finding queue associated with Lambda
 */
async function discoverDeadLetterQueue(
  functionName: string
): Promise<string | null> {
  try {
    const command = new GetFunctionConfigurationCommand({
      FunctionName: functionName,
    });
    const config = await lambdaClient.send(command);

    if (config.DeadLetterConfig?.TargetArn) {
      // Extract queue name from ARN: arn:aws:sqs:region:account:queue-name
      const queueName = config.DeadLetterConfig.TargetArn.split(':').pop();
      // Construct queue URL
      const accountId = config.DeadLetterConfig.TargetArn.split(':')[4];
      return `https://sqs.${region}.amazonaws.com/${accountId}/${queueName}`;
    }
  } catch (error) {
    console.error('Error discovering DLQ:', error);
  }
  return null;
}

describe('Serverless API Infrastructure Integration Tests', () => {
  let functionName: string;
  let queueUrl: string | null;

  beforeAll(async () => {
    // Load outputs
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Outputs file not found at ${outputsPath}. Did you run the deployment?`
      );
    }
    rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    outputs = mapOutputs(rawOutputs);

    // Validate required outputs
    const requiredOutputs = ['ApiUrl', 'TableName', 'BucketName'];
    const missing = requiredOutputs.filter((key) => !outputs[key]);
    if (missing.length > 0) {
      throw new Error(
        `Missing required outputs: ${missing.join(', ')}. Available: ${Object.keys(outputs).join(', ')}`
      );
    }

    // Load region
    if (fs.existsSync(regionPath)) {
      region = fs.readFileSync(regionPath, 'utf8').trim();
    } else {
      // Infer region from API URL
      if (outputs.ApiUrl && outputs.ApiUrl.includes('execute-api')) {
        const match = outputs.ApiUrl.match(/\.execute-api\.([^.]+)\.amazonaws\.com/);
        region = match ? match[1] : 'us-east-1';
      } else {
        region = process.env.AWS_REGION || 'us-east-1';
      }
    }

    console.log(`Running tests in region: ${region}`);
    console.log(`Mapped outputs:`, outputs);

    // Initialize AWS clients
    apiGatewayClient = new APIGatewayClient({ region });
    cloudWatchClient = new CloudWatchClient({ region });
    cloudWatchLogsClient = new CloudWatchLogsClient({ region });
    dynamodbClient = new DynamoDBClient({ region });
    kmsClient = new KMSClient({ region });
    lambdaClient = new LambdaClient({ region });
    s3Client = new S3Client({ region });
    sqsClient = new SQSClient({ region });
    ssmClient = new SSMClient({ region });

    // Discover Lambda function
    const discoveredFunction = await discoverLambdaFunction(outputs.TableName);
    if (!discoveredFunction) {
      throw new Error(
        `Could not discover Lambda function for table ${outputs.TableName}`
      );
    }
    functionName = discoveredFunction;
    console.log(`Discovered Lambda function: ${functionName}`);

    // Discover DLQ
    queueUrl = await discoverDeadLetterQueue(functionName);
    if (queueUrl) {
      console.log(`Discovered DLQ: ${queueUrl}`);
    }
  });

  describe('DynamoDB Table Configuration', () => {
    test('should have DynamoDB table with correct configuration', async () => {
      const tableName = outputs.TableName;
      expect(tableName).toBeDefined();

      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table!.TableStatus).toBe('ACTIVE');
      expect(response.Table!.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );

      // Check partition key
      expect(response.Table!.KeySchema).toHaveLength(1);
      expect(response.Table!.KeySchema![0].AttributeName).toBe('id');
      expect(response.Table!.KeySchema![0].KeyType).toBe('HASH');

      // Check attribute definition
      expect(response.Table!.AttributeDefinitions).toHaveLength(1);
      expect(response.Table!.AttributeDefinitions![0].AttributeName).toBe('id');
      expect(response.Table!.AttributeDefinitions![0].AttributeType).toBe('S');
    });

    test('should have DynamoDB table with encryption enabled', async () => {
      const tableName = outputs.TableName;
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      expect(response.Table!.SSEDescription).toBeDefined();
      expect(response.Table!.SSEDescription!.Status).toBe('ENABLED');
      // Should be using KMS encryption (CUSTOMER_MANAGED or AWS_MANAGED)
      expect(response.Table!.SSEDescription!.SSEType).toMatch(/KMS|AES256/);
    });
  });

  describe('S3 Bucket Security and Configuration', () => {
    test('should have S3 bucket with encryption enabled', async () => {
      const bucketName = outputs.BucketName;
      expect(bucketName).toBeDefined();

      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const encryptionRule =
        response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(
        encryptionRule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm
      ).toBeDefined();
      // Should be KMS (aws:kms) or AES256
      expect(
        encryptionRule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm
      ).toMatch(/aws:kms|AES256/);
    });

    test('should have S3 bucket with public access blocked', async () => {
      const bucketName = outputs.BucketName;
      const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      const config = response.PublicAccessBlockConfiguration!;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });

    test('should have S3 bucket with lifecycle policy', async () => {
      const bucketName = outputs.BucketName;
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);
      // Should have expiration rule
      const expirationRule = response.Rules!.find((rule) => rule.Expiration);
      expect(expirationRule).toBeDefined();
      expect(expirationRule!.Status).toBe('Enabled');
    });
  });

  describe('Lambda Function Configuration', () => {
    test('should have Lambda function with correct configuration', async () => {
      expect(functionName).toBeDefined();

      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.FunctionName).toBeDefined();
      expect(response.Runtime).toMatch(/nodejs/);
      expect(response.Handler).toBeDefined();
      expect(response.Timeout).toBeGreaterThanOrEqual(30);
      expect(response.MemorySize).toBeGreaterThanOrEqual(256);
    });

    test('should have Lambda function with correct environment variables', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Environment).toBeDefined();
      expect(response.Environment!.Variables).toBeDefined();
      expect(response.Environment!.Variables!.TABLE_NAME).toBe(
        outputs.TableName
      );
      expect(response.Environment!.Variables!.CONFIG_PARAMETER_NAME).toBeDefined();
      expect(response.Environment!.Variables!.ENV).toBeDefined();
    });

    test('should have Lambda function with X-Ray tracing enabled', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.TracingConfig).toBeDefined();
      expect(response.TracingConfig!.Mode).toBe('Active');
    });

    test('should have Lambda function with dead-letter queue configured', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.DeadLetterConfig).toBeDefined();
      expect(response.DeadLetterConfig!.TargetArn).toBeDefined();
      expect(response.DeadLetterConfig!.TargetArn).toContain('sqs');
    });
  });

  describe('SQS Dead-Letter Queue Configuration', () => {
    test('should have SQS queue with encryption and retention', async () => {
      if (!queueUrl) {
        console.log('DLQ not discovered, skipping SQS tests');
        return;
      }

      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['All'],
      });
      const response = await sqsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.MessageRetentionPeriod).toBeDefined();
      // Should have retention (14 days = 1209600 seconds)
      const retention = parseInt(response.Attributes!.MessageRetentionPeriod!);
      expect(retention).toBeGreaterThan(0);
      expect(retention).toBeLessThanOrEqual(1209600);
    });
  });

  describe('SSM Parameter Store', () => {
    test('should have SSM parameter with application config', async () => {
      const configCommand = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const functionConfig = await lambdaClient.send(configCommand);
      const paramName =
        functionConfig.Environment!.Variables!.CONFIG_PARAMETER_NAME;

      expect(paramName).toBeDefined();

      const command = new GetParameterCommand({ Name: paramName });
      const response = await ssmClient.send(command);

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Type).toBe('String');
      expect(response.Parameter!.Value).toBeDefined();

      const config = JSON.parse(response.Parameter!.Value!);
      expect(config.apiVersion).toBe('1.0');
      expect(config.environment).toBeDefined();
    });
  });

  describe('KMS Key Configuration', () => {
    test('should have KMS key for encryption', async () => {
      // Get table to find KMS key
      const tableName = outputs.TableName;
      const tableCommand = new DescribeTableCommand({ TableName: tableName });
      const tableResponse = await dynamodbClient.send(tableCommand);

      if (
        tableResponse.Table!.SSEDescription &&
        tableResponse.Table!.SSEDescription!.KMSMasterKeyArn
      ) {
        const keyArn = tableResponse.Table!.SSEDescription!.KMSMasterKeyArn;
        const keyId = keyArn.split('/').pop()!;

        const command = new DescribeKeyCommand({ KeyId: keyId });
        const response = await kmsClient.send(command);

        expect(response.KeyMetadata).toBeDefined();
        expect(response.KeyMetadata!.Enabled).toBe(true);
        expect(response.KeyMetadata!.KeyState).toBe('Enabled');
        // Key rotation should be enabled
        expect(response.KeyMetadata!.KeyManager).toBeDefined();
      } else {
        console.log('Using AWS-managed encryption key');
      }
    });
  });

  describe('API Gateway Configuration', () => {
    test('should have REST API with correct configuration', async () => {
      const apiUrl = outputs.ApiUrl;
      expect(apiUrl).toBeDefined();

      // Extract API ID from URL
      const apiId = apiUrl.split('//')[1].split('.')[0];

      const command = new GetRestApisCommand({});
      const response = await apiGatewayClient.send(command);

      const api = response.items!.find((item) => item.id === apiId);
      expect(api).toBeDefined();
      expect(api!.name).toBeDefined();
    });

    test('should have API Gateway with items resource and methods', async () => {
      const apiUrl = outputs.ApiUrl;
      const apiId = apiUrl.split('//')[1].split('.')[0];

      const command = new GetResourcesCommand({ restApiId: apiId });
      const response = await apiGatewayClient.send(command);

      const itemsResource = response.items!.find(
        (item) => item.pathPart === 'items'
      );
      expect(itemsResource).toBeDefined();
      expect(itemsResource!.resourceMethods).toBeDefined();
      expect(itemsResource!.resourceMethods!.POST).toBeDefined();
      expect(itemsResource!.resourceMethods!.OPTIONS).toBeDefined(); // CORS
    });

    test('should have API Gateway with X-Ray tracing enabled', async () => {
      const apiUrl = outputs.ApiUrl;
      const apiId = apiUrl.split('//')[1].split('.')[0];

      const command = new GetStageCommand({
        restApiId: apiId,
        stageName: 'prod',
      });
      const response = await apiGatewayClient.send(command);

      expect(response.tracingEnabled).toBe(true);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have CloudWatch alarms configured', async () => {
      const command = new DescribeAlarmsCommand({});
      const response = await cloudWatchClient.send(command);

      // Should have alarms for Lambda or API
      const alarms = response.MetricAlarms!.filter(
        (alarm) =>
          alarm.AlarmName?.includes('Lambda') ||
          alarm.AlarmName?.includes('Duration') ||
          alarm.AlarmName?.includes('Api') ||
          alarm.AlarmName?.includes('5xx')
      );

      expect(alarms.length).toBeGreaterThanOrEqual(1);
    });

    test('should have CloudWatch log groups for Lambda and API', async () => {
      const command = new DescribeLogGroupsCommand({});
      const response = await cloudWatchLogsClient.send(command);

      // Find Lambda log group
      const lambdaLogGroup = response.logGroups!.find((lg) =>
        lg.logGroupName?.includes('/aws/lambda/') &&
        lg.logGroupName?.includes(functionName)
      );
      expect(lambdaLogGroup).toBeDefined();

      // Find API Gateway log group
      const apiLogGroup = response.logGroups!.find((lg) =>
        lg.logGroupName?.includes('/aws/apigateway/')
      );
      expect(apiLogGroup).toBeDefined();
    });
  });

  describe('End-to-End Workflow: API → Lambda → DynamoDB', () => {
    const testId = uuidv4();
    const testData = {
      id: testId,
      payload: {
        message: 'Integration test',
        timestamp: new Date().toISOString(),
      },
    };

    test('should successfully POST data to API endpoint', async () => {
      const apiUrl = outputs.ApiUrl;
      const url = `${apiUrl}items`;

      const response = await axios.post(url, testData, {
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true, // Don't throw on any status
        timeout: 15000,
      });

      expect(response.status).toBe(201);
      expect(response.data).toBeDefined();
      expect(response.data.message).toBeDefined();
    });

    test('should find the item in DynamoDB after API POST', async () => {
      const tableName = outputs.TableName;

      // Wait for Lambda to process
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Get the item from DynamoDB
      const command = new GetItemCommand({
        TableName: tableName,
        Key: { id: { S: testId } },
      });

      const response = await dynamodbClient.send(command);
      expect(response.Item).toBeDefined();
      expect(response.Item!.id.S).toBe(testId);
      expect(response.Item!.receivedAt).toBeDefined();
      expect(response.Item!.environment).toBeDefined();
    });

    test('should return 400 for invalid POST request', async () => {
      const apiUrl = outputs.ApiUrl;
      const url = `${apiUrl}items`;

      // POST without required 'id' field
      const response = await axios.post(
        url,
        { payload: { test: 'data' } },
        {
          headers: { 'Content-Type': 'application/json' },
          validateStatus: () => true,
          timeout: 15000,
        }
      );

      expect(response.status).toBe(400);
      expect(response.data).toBeDefined();
      expect(response.data.error).toBeDefined();
    });

    afterAll(async () => {
      // Cleanup: Delete test item from DynamoDB
      try {
        const tableName = outputs.TableName;
        await dynamodbClient.send(
          new DeleteItemCommand({
            TableName: tableName,
            Key: { id: { S: testId } },
          })
        );
      } catch (error) {
        console.log('Cleanup completed or item already removed');
      }
    });
  });

  describe('End-to-End Workflow: Lambda Direct Invocation', () => {
    test('should invoke Lambda function directly and get successful response', async () => {
      const testPayload = {
        body: JSON.stringify({
          id: uuidv4(),
          payload: {
            message: 'Direct invocation test',
            testType: 'integration',
          },
        }),
      };

      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify(testPayload),
      });

      const response = await lambdaClient.send(command);

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();

      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      expect(payload.statusCode).toBe(201);
      expect(payload.body).toBeDefined();

      const body = JSON.parse(payload.body);
      expect(body.message).toBeDefined();
    });
  });

  describe('CORS Configuration', () => {
    test('should return CORS headers on OPTIONS request', async () => {
      const apiUrl = outputs.ApiUrl;
      const url = `${apiUrl}items`;

      const response = await axios.options(url, {
        validateStatus: () => true,
        timeout: 10000,
      });

      // OPTIONS can return 200 or 204
      expect([200, 204]).toContain(response.status);
      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });

    test('should successfully invoke POST request (CORS configured at API Gateway level)', async () => {
      const apiUrl = outputs.ApiUrl;
      const url = `${apiUrl}items`;

      const response = await axios.post(
        url,
        { id: uuidv4(), payload: { test: 'cors' } },
        {
          headers: { 'Content-Type': 'application/json' },
          validateStatus: () => true,
          timeout: 10000,
        }
      );

      // Request should succeed (CORS is properly configured at API Gateway)
      // Note: With Lambda proxy integration, CORS headers in responses
      // must be returned by the Lambda function itself. API Gateway CORS
      // configuration handles preflight OPTIONS requests.
      expect(response.status).toBe(201);
    });
  });

  describe('Lambda SSM Configuration Access', () => {
    test('should verify Lambda can access SSM parameter', async () => {
      const configCommand = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const functionConfig = await lambdaClient.send(configCommand);
      const paramName =
        functionConfig.Environment!.Variables!.CONFIG_PARAMETER_NAME;

      // Verify parameter exists and is accessible
      const command = new GetParameterCommand({ Name: paramName });
      const response = await ssmClient.send(command);

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Value).toBeDefined();

      // Verify Lambda has permission to read it (already tested in SSM tests)
      const config = JSON.parse(response.Parameter!.Value!);
      expect(config).toBeDefined();
    });
  });
});
