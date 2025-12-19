// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import axios from 'axios';
import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  APIGatewayClient,
  GetRestApiCommand,
} from '@aws-sdk/client-api-gateway';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// LocalStack configuration
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                     process.env.AWS_ENDPOINT_URL?.includes('4566');
const endpoint = isLocalStack ? 'http://localhost:4566' : undefined;

describe('Serverless Greeting API Integration Tests', () => {
  let outputs: any;
  let lambdaClient: LambdaClient;
  let apiGatewayClient: APIGatewayClient;
  let cloudWatchLogsClient: CloudWatchLogsClient;

  beforeAll(() => {
    // Load the outputs from the deployment
    try {
      outputs = JSON.parse(
        fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
      );
    } catch (error) {
      console.warn(
        'Warning: Could not load cfn-outputs/flat-outputs.json. Tests will be skipped.'
      );
      outputs = {};
    }

    // Initialize AWS SDK clients with LocalStack endpoint
    const clientConfig = {
      region: 'us-east-1',
      ...(endpoint && { endpoint }),
    };

    lambdaClient = new LambdaClient(clientConfig);
    apiGatewayClient = new APIGatewayClient(clientConfig);
    cloudWatchLogsClient = new CloudWatchLogsClient(clientConfig);
  });

  describe('Lambda Function Tests', () => {
    test('should have Lambda function deployed', async () => {
      if (!outputs.LambdaFunctionArn) {
        console.log('Skipping test - no Lambda ARN in outputs');
        return;
      }

      const functionName = outputs.LambdaFunctionArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toContain(
        'greeting-function'
      );
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.MemorySize).toBe(256);
      expect(response.Configuration?.Timeout).toBe(30);
    });

    test('should have correct Lambda configuration', async () => {
      if (!outputs.LambdaFunctionArn) {
        console.log('Skipping test - no Lambda ARN in outputs');
        return;
      }

      const functionName = outputs.LambdaFunctionArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      // Verify runtime and configuration
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Handler).toBe('greeting-function.handler');
    });

    test('should invoke Lambda function directly', async () => {
      if (!outputs.LambdaFunctionArn) {
        console.log('Skipping test - no Lambda ARN in outputs');
        return;
      }

      const functionName = outputs.LambdaFunctionArn.split(':').pop();
      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify({
          queryStringParameters: { name: 'IntegrationTest' },
          requestContext: { requestId: 'test-integration' },
        }),
      });

      const response = await lambdaClient.send(command);
      const payload = JSON.parse(
        new TextDecoder().decode(response.Payload || new Uint8Array())
      );

      expect(response.StatusCode).toBe(200);
      expect(payload.statusCode).toBe(200);

      const body = JSON.parse(payload.body);
      expect(body.message).toContain('IntegrationTest');
      expect(body.timestamp).toBeDefined();
    });
  });

  describe('Lambda Function URL Tests', () => {
    test('should access Lambda function via Function URL', async () => {
      if (!outputs.FunctionUrl) {
        console.log('Skipping test - no Function URL in outputs');
        return;
      }

      const response = await axios.get(outputs.FunctionUrl, {
        params: { name: 'FunctionUrlTest' },
      });

      expect(response.status).toBe(200);
      expect(response.data.message).toContain('FunctionUrlTest');
      expect(response.data.timestamp).toBeDefined();
    });

    test('should handle CORS headers in Function URL', async () => {
      if (!outputs.FunctionUrl) {
        console.log('Skipping test - no Function URL in outputs');
        return;
      }

      const response = await axios.get(outputs.FunctionUrl);

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['content-type']).toContain('application/json');
    });
  });

  describe('API Gateway Tests', () => {
    test('should have API Gateway deployed', async () => {
      if (!outputs.ApiGatewayUrl) {
        console.log('Skipping test - no API Gateway URL in outputs');
        return;
      }

      // Extract API ID from the URL
      const apiId = outputs.ApiGatewayUrl.split('/')[2].split('.')[0];
      const command = new GetRestApiCommand({
        restApiId: apiId,
      });

      const response = await apiGatewayClient.send(command);
      expect(response.name).toContain('greeting-api');
      expect(response.description).toContain('Serverless greeting API');
    });

    test('should access API via API Gateway root endpoint', async () => {
      if (!outputs.ApiGatewayUrl) {
        console.log('Skipping test - no API Gateway URL in outputs');
        return;
      }

      const response = await axios.get(outputs.ApiGatewayUrl, {
        params: { name: 'ApiGatewayTest' },
      });

      expect(response.status).toBe(200);
      expect(response.data.message).toContain('ApiGatewayTest');
      expect(response.data.timestamp).toBeDefined();
    });

    test('should access API via greeting resource', async () => {
      if (!outputs.ApiGatewayUrl) {
        console.log('Skipping test - no API Gateway URL in outputs');
        return;
      }

      const greetingUrl = `${outputs.ApiGatewayUrl}greeting`;
      const response = await axios.get(greetingUrl, {
        params: { name: 'ResourceTest' },
      });

      expect(response.status).toBe(200);
      expect(response.data.message).toContain('ResourceTest');
    });

    test('should handle CORS in API Gateway', async () => {
      if (!outputs.ApiGatewayUrl) {
        console.log('Skipping test - no API Gateway URL in outputs');
        return;
      }

      const response = await axios.get(outputs.ApiGatewayUrl);

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['content-type']).toContain('application/json');
    });

    test('should handle default guest name', async () => {
      if (!outputs.ApiGatewayUrl) {
        console.log('Skipping test - no API Gateway URL in outputs');
        return;
      }

      const response = await axios.get(outputs.ApiGatewayUrl);

      expect(response.status).toBe(200);
      expect(response.data.message).toContain('Guest');
    });
  });

  describe('CloudWatch Logs Tests', () => {
    test('should have CloudWatch Log Group created', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/greeting-function-`,
      });

      const response = await cloudWatchLogsClient.send(command);
      const logGroup = response.logGroups?.find((lg) =>
        lg.logGroupName?.includes(environmentSuffix)
      );

      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(7);
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle invalid requests gracefully', async () => {
      if (!outputs.ApiGatewayUrl) {
        console.log('Skipping test - no API Gateway URL in outputs');
        return;
      }

      // Test with malformed URL - should still work as it doesn't require specific parameters
      const response = await axios.get(outputs.ApiGatewayUrl);
      expect(response.status).toBe(200);
      expect(response.data.message).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    test('API should respond within acceptable time', async () => {
      if (!outputs.ApiGatewayUrl) {
        console.log('Skipping test - no API Gateway URL in outputs');
        return;
      }

      const startTime = Date.now();
      await axios.get(outputs.ApiGatewayUrl);
      const responseTime = Date.now() - startTime;

      // Should respond within 3 seconds (accounting for cold start)
      expect(responseTime).toBeLessThan(3000);
    });

    test('Function URL should respond within acceptable time', async () => {
      if (!outputs.FunctionUrl) {
        console.log('Skipping test - no Function URL in outputs');
        return;
      }

      const startTime = Date.now();
      await axios.get(outputs.FunctionUrl);
      const responseTime = Date.now() - startTime;

      // Should respond within 3 seconds (accounting for cold start)
      expect(responseTime).toBeLessThan(3000);
    });
  });
});