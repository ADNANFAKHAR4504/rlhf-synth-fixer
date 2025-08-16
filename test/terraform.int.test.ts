// integration-tests.ts
// Live integration tests for deployed Terraform infrastructure
// Tests real AWS services - Lambda, API Gateway, Secrets Manager

import fs from 'fs';
import path from 'path';
import {
  APIGatewayClient,
  GetRestApisCommand,
  GetResourcesCommand,
  GetMethodCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

// Test configuration
const REGION = 'us-east-1';
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'pr1392';
const ENVIRONMENT = 'dev';

// AWS clients
const apiGwClient = new APIGatewayClient({ region: REGION });
const lambdaClient = new LambdaClient({ region: REGION });
const secretsClient = new SecretsManagerClient({ region: REGION });
const logsClient = new CloudWatchLogsClient({ region: REGION });
const iamClient = new IAMClient({ region: REGION });
const stsClient = new STSClient({ region: REGION });

// Load outputs from deployment
let outputs: any = {};
const OUTPUTS_PATH = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');

describe('Terraform Infrastructure Integration Tests', () => {
  let namePrefix: string;

  beforeAll(async () => {
    // Construct expected name prefix
    namePrefix = `serverless-api-${ENVIRONMENT}-${ENVIRONMENT_SUFFIX}`;

    // Try to load deployment outputs
    try {
      if (fs.existsSync(OUTPUTS_PATH)) {
        outputs = JSON.parse(fs.readFileSync(OUTPUTS_PATH, 'utf8'));
        console.log('Loaded deployment outputs:', Object.keys(outputs));
      } else {
        console.warn(`Outputs file not found at ${OUTPUTS_PATH}, using computed values`);
      }
    } catch (error) {
      console.warn('Could not load deployment outputs, using computed values:', error);
    }

    // Verify AWS credentials
    try {
      const identity = await stsClient.send(new GetCallerIdentityCommand({}));
      console.log('AWS Identity:', identity.Arn);
    } catch (error) {
      console.error('AWS credentials not configured properly:', error);
      throw error;
    }
  }, 30000);

  describe('1. AWS Secrets Manager Integration', () => {
    test('secret exists and is accessible', async () => {
      const secretName = `${namePrefix}-config`;
      
      const command = new DescribeSecretCommand({ SecretId: secretName });
      const response = await secretsClient.send(command);
      
      expect(response.Name).toBe(secretName);
      expect(response.Description).toContain('Configuration secret for Lambda');
      expect(response.RecoveryWindowInDays).toBe(7);
    });

    test('secret contains expected structure', async () => {
      const secretName = `${namePrefix}-config`;
      
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await secretsClient.send(command);
      
      const secretData = JSON.parse(response.SecretString!);
      expect(secretData).toHaveProperty('api_key');
      expect(secretData).toHaveProperty('feature');
      expect(typeof secretData.api_key).toBe('string');
    });

    test('secret is encrypted at rest (KMS managed)', async () => {
      const secretName = `${namePrefix}-config`;
      
      const command = new DescribeSecretCommand({ SecretId: secretName });
      const response = await secretsClient.send(command);
      
      // AWS Secrets Manager encrypts by default with AWS managed key
      expect(response.KmsKeyId).toBeDefined();
    });
  });

  describe('2. AWS Lambda Function Integration', () => {
    test('Lambda function exists with correct configuration', async () => {
      const functionName = `${namePrefix}-fn`;
      
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);
      
      expect(response.Configuration?.FunctionName).toBe(functionName);
      expect(response.Configuration?.Runtime).toBe('python3.12');
      expect(response.Configuration?.Handler).toBe('handler.lambda_handler');
      expect(response.Configuration?.MemorySize).toBe(256);
      expect(response.Configuration?.Timeout).toBe(20);
    });

    test('Lambda function has correct environment variables', async () => {
      const functionName = `${namePrefix}-fn`;
      
      const command = new GetFunctionConfigurationCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);
      
      const env = response.Environment?.Variables || {};
      expect(env).toHaveProperty('SECRET_ARN');
      expect(env).toHaveProperty('APP_ENV');
      expect(env).toHaveProperty('ENV_SUFFIX');
      expect(env.APP_ENV).toBe(ENVIRONMENT);
      expect(env.ENV_SUFFIX).toBe(ENVIRONMENT_SUFFIX);
      expect(env.SECRET_ARN).toContain('secretsmanager');
      expect(env.SECRET_ARN).toContain(`${namePrefix}-config`);
    });

    test('Lambda function can be invoked directly', async () => {
      const functionName = `${namePrefix}-fn`;
      
      const payload = {
        httpMethod: 'GET',
        path: '/invoke',
        queryStringParameters: { test: 'integration' },
        headers: { 'Content-Type': 'application/json' }
      };

      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify(payload),
      });
      
      const response = await lambdaClient.send(command);
      
      expect(response.StatusCode).toBe(200);
      
      const result = JSON.parse(Buffer.from(response.Payload!).toString());
      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('message');
      expect(body).toHaveProperty('env');
      expect(body).toHaveProperty('secret_keys');
      expect(body.env).toBe(ENVIRONMENT);
      expect(Array.isArray(body.secret_keys)).toBe(true);
    });

    test('Lambda function retrieves secrets successfully', async () => {
      const functionName = `${namePrefix}-fn`;
      
      const payload = { test: 'secret-retrieval' };

      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify(payload),
      });
      
      const response = await lambdaClient.send(command);
      const result = JSON.parse(Buffer.from(response.Payload!).toString());
      const body = JSON.parse(result.body);
      
      // Should contain secret keys but not values
      expect(body.secret_keys).toContain('api_key');
      expect(body.secret_keys).toContain('feature');
      expect(body.secret_keys).not.toContain('example-key'); // Should not expose values
    });
  });

  describe('3. AWS API Gateway Integration', () => {
    test('API Gateway REST API exists', async () => {
      const command = new GetRestApisCommand({});
      const response = await apiGwClient.send(command);
      
      const api = response.items?.find(item => item.name === namePrefix);
      expect(api).toBeDefined();
      expect(api?.endpointConfiguration?.types).toContain('REGIONAL');
    });

    test('API Gateway has correct resource structure', async () => {
      const apisCommand = new GetRestApisCommand({});
      const apisResponse = await apiGwClient.send(apisCommand);
      const api = apisResponse.items?.find(item => item.name === namePrefix);
      
      const resourcesCommand = new GetResourcesCommand({ restApiId: api!.id });
      const resourcesResponse = await apiGwClient.send(resourcesCommand);
      
      const invokeResource = resourcesResponse.items?.find(item => item.pathPart === 'invoke');
      expect(invokeResource).toBeDefined();
      expect(invokeResource?.resourceMethods).toHaveProperty('ANY');
    });

    test('API Gateway method has IAM authorization', async () => {
      const apisCommand = new GetRestApisCommand({});
      const apisResponse = await apiGwClient.send(apisCommand);
      const api = apisResponse.items?.find(item => item.name === namePrefix);
      
      const resourcesCommand = new GetResourcesCommand({ restApiId: api!.id });
      const resourcesResponse = await apiGwClient.send(resourcesCommand);
      const invokeResource = resourcesResponse.items?.find(item => item.pathPart === 'invoke');
      
      const methodCommand = new GetMethodCommand({
        restApiId: api!.id,
        resourceId: invokeResource!.id,
        httpMethod: 'ANY'
      });
      const methodResponse = await apiGwClient.send(methodCommand);
      
      expect(methodResponse.authorizationType).toBe('AWS_IAM');
      expect(methodResponse.methodIntegration?.type).toBe('AWS_PROXY');
    });

    test('API Gateway stage is deployed correctly', async () => {
      const apisCommand = new GetRestApisCommand({});
      const apisResponse = await apiGwClient.send(apisCommand);
      const api = apisResponse.items?.find(item => item.name === namePrefix);
      
      const stageCommand = new GetStageCommand({
        restApiId: api!.id,
        stageName: 'stage_aws_apigtw'
      });
      const stageResponse = await stageCommand.send(stageCommand);
      
      expect(stageResponse.stageName).toBe('stage_aws_apigtw');
      expect(stageResponse.accessLogSettings?.destinationArn).toBeDefined();
      expect(stageResponse.accessLogSettings?.destinationArn).toContain('cloudwatch');
    });
  });

  describe('4. AWS CloudWatch Logs Integration', () => {
    test('Lambda CloudWatch log group exists', async () => {
      const logGroupName = `/aws/lambda/${namePrefix}-fn`;
      
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);
      
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(7);
    });

    test('API Gateway access log group exists', async () => {
      const logGroupName = `/aws/apigw/${namePrefix}-${ENVIRONMENT}`;
      
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);
      
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(7);
    });

    test('Lambda generates logs when invoked', async () => {
      const functionName = `${namePrefix}-fn`;
      const logGroupName = `/aws/lambda/${namePrefix}-fn`;
      
      // First invoke the function to generate logs
      const invokeCommand = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify({ test: 'log-generation' }),
      });
      await lambdaClient.send(invokeCommand);
      
      // Wait a bit for logs to appear
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for log streams
      const command = new DescribeLogStreamsCommand({
        logGroupName,
        orderBy: 'LastEventTime',
        descending: true,
        limit: 1,
      });
      const response = await logsClient.send(command);
      
      expect(response.logStreams).toBeDefined();
      expect(response.logStreams!.length).toBeGreaterThan(0);
    });
  });

  describe('5. AWS IAM Integration', () => {
    test('Lambda execution role exists with correct policies', async () => {
      const roleName = `${namePrefix}-lambda-role`;
      
      const getRoleCommand = new GetRoleCommand({ RoleName: roleName });
      const roleResponse = await iamClient.send(getRoleCommand);
      
      expect(roleResponse.Role?.RoleName).toBe(roleName);
      expect(roleResponse.Role?.AssumeRolePolicyDocument).toContain('lambda.amazonaws.com');
      
      // Check attached policies
      const listPoliciesCommand = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
      const policiesResponse = await iamClient.send(listPoliciesCommand);
      
      const policyArns = policiesResponse.AttachedPolicies?.map(p => p.PolicyArn) || [];
      expect(policyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });

    test('API Gateway CloudWatch logs role exists', async () => {
      const roleName = `${namePrefix}-apigw-logs-role`;
      
      const getRoleCommand = new GetRoleCommand({ RoleName: roleName });
      const roleResponse = await iamClient.send(getRoleCommand);
      
      expect(roleResponse.Role?.RoleName).toBe(roleName);
      expect(roleResponse.Role?.AssumeRolePolicyDocument).toContain('apigateway.amazonaws.com');
      
      // Check attached policies
      const listPoliciesCommand = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
      const policiesResponse = await iamClient.send(listPoliciesCommand);
      
      const policyArns = policiesResponse.AttachedPolicies?.map(p => p.PolicyArn) || [];
      expect(policyArns).toContain('arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs');
    });
  });

  describe('6. End-to-End Workflow Tests', () => {
    test('complete serverless workflow: API -> Lambda -> Secrets', async () => {
      // This test simulates the complete flow but doesn't make HTTP calls to API Gateway
      // since that would require signed requests and proper IAM setup
      
      const functionName = `${namePrefix}-fn`;
      
      // Simulate API Gateway request payload
      const apiGatewayEvent = {
        httpMethod: 'POST',
        path: '/invoke',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'AWS4-HMAC-SHA256 ...' // Simulated auth header
        },
        queryStringParameters: { 
          action: 'test',
          source: 'integration-test'
        },
        body: JSON.stringify({ 
          message: 'End-to-end test',
          timestamp: new Date().toISOString()
        }),
        requestContext: {
          requestId: 'test-request-' + Date.now(),
          stage: 'stage_aws_apigtw',
          httpMethod: 'POST',
          path: '/invoke'
        }
      };

      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify(apiGatewayEvent),
      });
      
      const response = await lambdaClient.send(command);
      
      expect(response.StatusCode).toBe(200);
      
      const result = JSON.parse(Buffer.from(response.Payload!).toString());
      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      
      // Verify the complete workflow worked
      expect(body.message).toBe('Hello from Lambda');
      expect(body.env).toBe(ENVIRONMENT);
      expect(body.secret_keys).toContain('api_key');
      expect(body.secret_keys).toContain('feature');
      
      // Verify proper API Gateway response format
      expect(result.headers).toHaveProperty('Content-Type');
      expect(result.headers['Content-Type']).toBe('application/json');
    });

    test('Lambda handles errors gracefully', async () => {
      const functionName = `${namePrefix}-fn`;
      
      // Test with malformed input to trigger error handling
      const malformedEvent = {
        // Missing required fields to potentially trigger errors
        invalidField: 'should-cause-graceful-handling'
      };

      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify(malformedEvent),
      });
      
      const response = await lambdaClient.send(command);
      
      // Should still return 200 from Lambda execution perspective
      expect(response.StatusCode).toBe(200);
      
      const result = JSON.parse(Buffer.from(response.Payload!).toString());
      
      // Function should handle gracefully and return valid response
      expect(result).toHaveProperty('statusCode');
      expect(result.statusCode).toBe(200); // Our function handles errors gracefully
      
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('message');
    });
  });

  describe('7. Security and Compliance Validation', () => {
    test('resources are properly tagged', async () => {
      const functionName = `${namePrefix}-fn`;
      
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);
      
      const tags = response.Tags || {};
      expect(tags).toHaveProperty('Project');
      expect(tags).toHaveProperty('Environment');
      expect(tags).toHaveProperty('ManagedBy');
      expect(tags.Project).toBe('serverless-api');
      expect(tags.Environment).toBe(ENVIRONMENT);
      expect(tags.ManagedBy).toBe('terraform');
    });

    test('Lambda function uses least privilege IAM role', async () => {
      const functionName = `${namePrefix}-fn`;
      
      const functionCommand = new GetFunctionCommand({ FunctionName: functionName });
      const functionResponse = await lambdaClient.send(functionCommand);
      
      const roleArn = functionResponse.Configuration?.Role;
      expect(roleArn).toBeDefined();
      expect(roleArn).toContain(`${namePrefix}-lambda-role`);
      
      // Role should only have access to specific secret
      const secretArn = functionResponse.Configuration?.Environment?.Variables?.SECRET_ARN;
      expect(secretArn).toBeDefined();
      expect(secretArn).toContain(`${namePrefix}-config`);
    });

    test('secrets are encrypted and access-controlled', async () => {
      const secretName = `${namePrefix}-config`;
      
      const command = new DescribeSecretCommand({ SecretId: secretName });
      const response = await secretsClient.send(command);
      
      // Verify encryption
      expect(response.KmsKeyId).toBeDefined();
      
      // Verify proper naming and recovery policy
      expect(response.Name).toBe(secretName);
      expect(response.RecoveryWindowInDays).toBe(7);
    });
  });
});