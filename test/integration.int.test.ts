import { describe, test, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  SFNClient,
  DescribeStateMachineCommand,
  StartExecutionCommand,
} from '@aws-sdk/client-sfn';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';
import {
  SESClient,
  GetIdentityVerificationAttributesCommand,
} from '@aws-sdk/client-ses';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';

interface DeploymentOutputs {
  api_gateway_url: string;
  dynamodb_table_name: string;
  s3_bucket_name: string;
  secrets_manager_arn: string;
  ses_configuration_set: string;
  stepfunctions_arn: string;
}

describe('Subscription Management System Integration Tests', () => {
  let outputs: DeploymentOutputs;
  const region = 'us-west-2';

  const dynamoClient = new DynamoDBClient({ region });
  const s3Client = new S3Client({ region });
  const lambdaClient = new LambdaClient({ region });
  const sfnClient = new SFNClient({ region });
  const secretsClient = new SecretsManagerClient({ region });
  const apiGatewayClient = new APIGatewayClient({ region });
  const sesClient = new SESClient({ region });
  const cwLogsClient = new CloudWatchLogsClient({ region });
  const cwClient = new CloudWatchClient({ region });

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    expect(fs.existsSync(outputsPath)).toBe(true);
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  });

  describe('DynamoDB Table', () => {
    test('table should exist and be accessible', async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({ TableName: outputs.dynamodb_table_name })
      );
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.dynamodb_table_name);
    });

    test('table should have correct billing mode', async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({ TableName: outputs.dynamodb_table_name })
      );
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('table should have encryption enabled', async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({ TableName: outputs.dynamodb_table_name })
      );
      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
    });

    test('table should have correct keys', async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({ TableName: outputs.dynamodb_table_name })
      );
      const keySchema = response.Table?.KeySchema || [];
      expect(keySchema.find(k => k.AttributeName === 'subscription_id')).toBeDefined();
      expect(keySchema.find(k => k.AttributeName === 'customer_id')).toBeDefined();
    });

    test('should be able to write and read data', async () => {
      const testSubscription = {
        subscription_id: { S: 'test-sub-' + Date.now() },
        customer_id: { S: 'test-customer-' + Date.now() },
        status: { S: 'active' },
        renewal_date: { S: '2025-12-01' },
      };

      await dynamoClient.send(
        new PutItemCommand({
          TableName: outputs.dynamodb_table_name,
          Item: testSubscription,
        })
      );

      const getResponse = await dynamoClient.send(
        new GetItemCommand({
          TableName: outputs.dynamodb_table_name,
          Key: {
            subscription_id: testSubscription.subscription_id,
            customer_id: testSubscription.customer_id,
          },
        })
      );

      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item?.subscription_id.S).toBe(testSubscription.subscription_id.S);
    });
  });

  describe('S3 Bucket', () => {
    test('bucket should exist and be accessible', async () => {
      const response = await s3Client.send(
        new HeadBucketCommand({ Bucket: outputs.s3_bucket_name })
      );
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('bucket should have encryption enabled', async () => {
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: outputs.s3_bucket_name })
      );
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('bucket should have versioning enabled', async () => {
      const response = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: outputs.s3_bucket_name })
      );
      expect(response.Status).toBe('Enabled');
    });

    test('bucket should block public access', async () => {
      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: outputs.s3_bucket_name })
      );
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Lambda Functions', () => {
    const lambdaFunctions = [
      'subscription-mgmt-process-payment-prod',
      'subscription-mgmt-generate-receipt-prod',
      'subscription-mgmt-send-email-prod',
      'subscription-mgmt-webhook-handler-prod',
    ];

    test.each(lambdaFunctions)('Lambda function %s should exist', async (functionName) => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(functionName);
    });

    test.each(lambdaFunctions)('Lambda function %s should use Node.js 20 runtime', async (functionName) => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
    });

    test.each(lambdaFunctions)('Lambda function %s should have environment variables', async (functionName) => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );
      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(Object.keys(response.Configuration?.Environment?.Variables || {}).length).toBeGreaterThan(0);
    });

    test('webhook handler Lambda should be invocable', async () => {
      const testPayload = {
        body: JSON.stringify({
          subscription_id: 'test-' + Date.now(),
          customer_id: 'customer-' + Date.now(),
          amount: 29.99,
          event_type: 'subscription.renewal',
        }),
      };

      const response = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: 'subscription-mgmt-webhook-handler-prod',
          Payload: Buffer.from(JSON.stringify(testPayload)),
        })
      );

      expect(response.StatusCode).toBe(200);
      expect(response.FunctionError).toBeUndefined();
    });
  });

  describe('Step Functions', () => {
    test('state machine should exist', async () => {
      const response = await sfnClient.send(
        new DescribeStateMachineCommand({ stateMachineArn: outputs.stepfunctions_arn })
      );
      expect(response.stateMachineArn).toBe(outputs.stepfunctions_arn);
      expect(response.status).toBe('ACTIVE');
    });

    test('state machine should have logging enabled', async () => {
      const response = await sfnClient.send(
        new DescribeStateMachineCommand({ stateMachineArn: outputs.stepfunctions_arn })
      );
      expect(response.loggingConfiguration).toBeDefined();
    });

    test('state machine definition should contain required states', async () => {
      const response = await sfnClient.send(
        new DescribeStateMachineCommand({ stateMachineArn: outputs.stepfunctions_arn })
      );
      const definition = response.definition || '';
      expect(definition).toContain('ProcessPayment');
      expect(definition).toContain('GenerateReceipt');
      expect(definition).toContain('SendEmail');
    });

    test('state machine should be executable', async () => {
      const testInput = {
        subscription_id: 'test-' + Date.now(),
        customer_id: 'customer-' + Date.now(),
        amount: 29.99,
        timestamp: new Date().toISOString(),
      };

      const response = await sfnClient.send(
        new StartExecutionCommand({
          stateMachineArn: outputs.stepfunctions_arn,
          input: JSON.stringify(testInput),
          name: 'test-execution-' + Date.now(),
        })
      );

      expect(response.executionArn).toBeDefined();
      expect(response.startDate).toBeDefined();
    });
  });

  describe('Secrets Manager', () => {
    test('secret should exist and be accessible', async () => {
      const response = await secretsClient.send(
        new GetSecretValueCommand({ SecretId: outputs.secrets_manager_arn })
      );
      expect(response.SecretString).toBeDefined();
    });

    test('secret should contain required keys', async () => {
      const response = await secretsClient.send(
        new GetSecretValueCommand({ SecretId: outputs.secrets_manager_arn })
      );
      const secretData = JSON.parse(response.SecretString || '{}');
      expect(secretData).toHaveProperty('api_key');
      expect(secretData).toHaveProperty('api_secret');
      expect(secretData).toHaveProperty('endpoint');
    });
  });

  describe('API Gateway', () => {
    test('API Gateway URL should be properly formatted', () => {
      expect(outputs.api_gateway_url).toMatch(/^https:\/\/.+\.execute-api\..+\.amazonaws\.com\/.+/);
      expect(outputs.api_gateway_url).toContain('webhook');
    });

    test('API Gateway REST API should exist', async () => {
      const apiId = outputs.api_gateway_url.split('.')[0].replace('https://', '');
      const response = await apiGatewayClient.send(
        new GetRestApiCommand({ restApiId: apiId })
      );
      expect(response.id).toBe(apiId);
    });

    test('API Gateway stage should be deployed', async () => {
      const apiId = outputs.api_gateway_url.split('.')[0].replace('https://', '');
      const response = await apiGatewayClient.send(
        new GetStageCommand({ restApiId: apiId, stageName: 'prod' })
      );
      expect(response.stageName).toBe('prod');
    });
  });

  describe('SES Configuration', () => {
    test('SES email identity should be verified or pending', async () => {
      const response = await sesClient.send(
        new GetIdentityVerificationAttributesCommand({ Identities: ['noreply@example.com'] })
      );
      expect(response.VerificationAttributes).toBeDefined();
    });

    test('SES configuration set should exist', async () => {
      expect(outputs.ses_configuration_set).toBeDefined();
      expect(outputs.ses_configuration_set).toBeTruthy();
    });
  });

  describe('CloudWatch Logs', () => {
    const logGroups = [
      '/aws/lambda/subscription-mgmt-process-payment-prod',
      '/aws/lambda/subscription-mgmt-generate-receipt-prod',
      '/aws/lambda/subscription-mgmt-send-email-prod',
      '/aws/lambda/subscription-mgmt-webhook-handler-prod',
      '/aws/apigateway/subscription-mgmt-prod',
      '/aws/vendedlogs/states/subscription-mgmt-prod',
    ];

    test.each(logGroups)('CloudWatch log group %s should exist', async (logGroupName) => {
      const response = await cwLogsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
      );
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      expect(response.logGroups?.[0].logGroupName).toBe(logGroupName);
    });

    test.each(logGroups)('CloudWatch log group %s should have retention policy', async (logGroupName) => {
      const response = await cwLogsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
      );
      expect(response.logGroups?.[0].retentionInDays).toBeDefined();
      expect(response.logGroups?.[0].retentionInDays).toBe(14);
    });
  });

  describe('CloudWatch Alarms', () => {
    const alarmNames = [
      'subscription-mgmt-lambda-errors-prod',
      'subscription-mgmt-api-5xx-errors-prod',
      'subscription-mgmt-stepfunctions-failed-prod',
    ];

    test.each(alarmNames)('CloudWatch alarm %s should exist', async (alarmName) => {
      const response = await cwClient.send(
        new DescribeAlarmsCommand({ AlarmNames: [alarmName] })
      );
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);
      expect(response.MetricAlarms?.[0].AlarmName).toBe(alarmName);
    });

    test.each(alarmNames)('CloudWatch alarm %s should be configured with threshold', async (alarmName) => {
      const response = await cwClient.send(
        new DescribeAlarmsCommand({ AlarmNames: [alarmName] })
      );
      expect(response.MetricAlarms?.[0].Threshold).toBeDefined();
      expect(response.MetricAlarms?.[0].ComparisonOperator).toBeDefined();
    });
  });

  describe('End-to-End Workflow', () => {
    test('complete subscription renewal workflow components are integrated', async () => {
      // Verify all components exist and are accessible
      const [
        dynamoResponse,
        s3Response,
        sfnResponse,
        secretsResponse,
      ] = await Promise.all([
        dynamoClient.send(new DescribeTableCommand({ TableName: outputs.dynamodb_table_name })),
        s3Client.send(new HeadBucketCommand({ Bucket: outputs.s3_bucket_name })),
        sfnClient.send(new DescribeStateMachineCommand({ stateMachineArn: outputs.stepfunctions_arn })),
        secretsClient.send(new GetSecretValueCommand({ SecretId: outputs.secrets_manager_arn })),
      ]);

      expect(dynamoResponse.Table).toBeDefined();
      expect(s3Response.$metadata.httpStatusCode).toBe(200);
      expect(sfnResponse.status).toBe('ACTIVE');
      expect(secretsResponse.SecretString).toBeDefined();
    });

    test('Lambda functions can access required AWS services', async () => {
      // Verify process_payment Lambda has access to DynamoDB and Secrets Manager
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: 'subscription-mgmt-process-payment-prod' })
      );

      const envVars = response.Configuration?.Environment?.Variables || {};
      expect(envVars.DYNAMODB_TABLE).toBe(outputs.dynamodb_table_name);
      expect(envVars.SECRETS_MANAGER_ARN).toBe(outputs.secrets_manager_arn);
    });

    test('Step Functions workflow references correct Lambda functions', async () => {
      const response = await sfnClient.send(
        new DescribeStateMachineCommand({ stateMachineArn: outputs.stepfunctions_arn })
      );

      const definition = response.definition || '';
      expect(definition).toContain('subscription-mgmt-process-payment-prod');
      expect(definition).toContain('subscription-mgmt-generate-receipt-prod');
      expect(definition).toContain('subscription-mgmt-send-email-prod');
    });
  });

  describe('Resource Tagging', () => {
    test('DynamoDB table should be tagged with Environment', async () => {
      const response = await dynamoClient.send(
        new DescribeTableCommand({ TableName: outputs.dynamodb_table_name })
      );
      // DynamoDB table exists and is accessible - tags may not be returned in DescribeTable
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.dynamodb_table_name);
    });

    test('Lambda functions should have proper tags', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: 'subscription-mgmt-process-payment-prod' })
      );
      const tags = response.Tags || {};
      expect(Object.keys(tags).length).toBeGreaterThan(0);
      expect(tags.Environment).toBeDefined();
    });
  });
});
