import {
  APIGatewayClient,
  GetRestApiCommand,
} from '@aws-sdk/client-api-gateway';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  GetFunctionCommand,
  InvokeCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import axios from 'axios';
import fs from 'fs';

// LocalStack configuration
const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
const isLocalStack = endpoint.includes('localhost') || endpoint.includes('4566');

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthtrainr11';

// AWS Clients configuration for LocalStack
const clientConfig = isLocalStack
  ? {
      region: 'us-east-1',
      endpoint: endpoint,
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
      },
    }
  : { region: 'us-east-1' };

// AWS Clients
const lambdaClient = new LambdaClient(clientConfig);
const apiGatewayClient = new APIGatewayClient(clientConfig);
const cloudWatchClient = new CloudWatchClient(clientConfig);

describe('ProjectX Serverless Infrastructure Integration Tests', () => {
  describe('API Gateway Endpoints', () => {
    const apiUrl = outputs.ProjectXApiUrl;

    test('should have a valid API Gateway URL in outputs', () => {
      expect(apiUrl).toBeDefined();
      // LocalStack URL format: https://{apiId}.execute-api.localhost.localstack.cloud:4566/{stage}/
      // or legacy: http://localhost:4566/restapis/{id}/{stage}/_user_request_/
      if (isLocalStack) {
        expect(apiUrl).toMatch(
          /^https?:\/\/([a-z0-9]+\.execute-api\.localhost\.localstack\.cloud:4566|localhost:4566\/restapis\/[a-z0-9]+)\//
        );
      } else {
        expect(apiUrl).toMatch(
          /^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com/
        );
      }
    });

    test('GET / should return successful response', async () => {
      const response = await axios.get(apiUrl);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message');
      expect(response.data.message).toBe('Hello from ProjectX Lambda!');
      expect(response.data).toHaveProperty('timestamp');
      expect(response.data).toHaveProperty('requestId');
      expect(response.data.path).toBe('/');
      expect(response.data.httpMethod).toBe('GET');
    }, 30000);

    test('POST / should return successful response', async () => {
      const testData = { test: 'data', timestamp: new Date().toISOString() };
      const response = await axios.post(apiUrl, testData);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message');
      expect(response.data.httpMethod).toBe('POST');
    });

    test('GET /health should return successful response', async () => {
      const response = await axios.get(`${apiUrl}health`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message');
      expect(response.data.path).toBe('/health');
    });

    test('GET /api/v1/data should return successful response', async () => {
      const response = await axios.get(`${apiUrl}api/v1/data`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message');
      expect(response.data.path).toBe('/api/v1/data');
    });

    test('POST /api/v1/data should return successful response', async () => {
      const testData = { data: 'test', type: 'integration' };
      const response = await axios.post(`${apiUrl}api/v1/data`, testData);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message');
      expect(response.data.httpMethod).toBe('POST');
    });

    test('GET /random/path should be handled by proxy resource', async () => {
      const response = await axios.get(`${apiUrl}random/path`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message');
      expect(response.data.path).toBe('/random/path');
    });

    test('OPTIONS request should return CORS headers', async () => {
      const response = await axios.options(apiUrl);
      expect(response.status).toBe(204); // OPTIONS returns 204 No Content
      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });
  });

  describe('Lambda Function', () => {
    const functionArn = outputs.ProjectXLambdaFunctionArn;

    test('should have a valid Lambda function ARN in outputs', () => {
      expect(functionArn).toBeDefined();
      // LocalStack uses account ID 000000000000
      if (isLocalStack) {
        expect(functionArn).toMatch(
          /^arn:aws:lambda:[a-z0-9-]+:000000000000:function:/
        );
      } else {
        expect(functionArn).toMatch(
          /^arn:aws:lambda:[a-z0-9-]+:[0-9]+:function:/
        );
      }
    });

    test('Lambda function should exist and be active', async () => {
      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.State).toBe('Active');
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
      expect(response.Configuration?.Handler).toBe('index.handler');
      expect(response.Configuration?.MemorySize).toBe(512);
      expect(response.Configuration?.Timeout).toBe(300);
    });

    test('Lambda function should have correct environment variables', async () => {
      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(response.Configuration?.Environment?.Variables?.PROJECT_NAME).toBe(
        'projectX'
      );
      expect(
        response.Configuration?.Environment?.Variables?.NODE_ENV
      ).toBeDefined();
    });

    test('Lambda function can be invoked directly', async () => {
      const functionName = functionArn.split(':').pop();
      const event = {
        httpMethod: 'GET',
        path: '/test-direct',
        headers: {},
        body: null,
      };

      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify(event),
      });

      const response = await lambdaClient.send(command);
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));

      expect(response.StatusCode).toBe(200);
      expect(payload.statusCode).toBe(200);
      const body = JSON.parse(payload.body);
      expect(body.message).toBe('Hello from ProjectX Lambda!');
      expect(body.path).toBe('/test-direct');
    });
  });

  describe('API Gateway Configuration', () => {
    const apiId = outputs.ProjectXApiId;

    test('should have API Gateway ID in outputs', () => {
      expect(apiId).toBeDefined();
      expect(apiId).toMatch(/^[a-z0-9]+$/);
    });

    test('REST API should exist with correct configuration', async () => {
      const command = new GetRestApiCommand({ restApiId: apiId });
      const response = await apiGatewayClient.send(command);

      expect(response.name).toContain('projectX-api');
      expect(response.description).toBe('ProjectX Serverless Web Service API');
      expect(response.endpointConfiguration?.types).toContain('EDGE');
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have dashboard URL in outputs', () => {
      const dashboardUrl = outputs.ProjectXDashboardUrl;
      expect(dashboardUrl).toBeDefined();
      expect(dashboardUrl).toContain('cloudwatch');
      expect(dashboardUrl).toContain('dashboards');
      expect(dashboardUrl).toContain('projectX-monitoring');
    });

    test('Lambda error alarm should exist', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`projectX-lambda-errors-${environmentSuffix}`],
      });
      const response = await cloudWatchClient.send(command);

      expect(response.MetricAlarms).toHaveLength(1);
      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('Errors');
      expect(alarm.Namespace).toBe('AWS/Lambda');
      expect(alarm.Threshold).toBe(5);
      expect(alarm.EvaluationPeriods).toBe(2);
    });

    test('API latency alarm should exist', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`projectX-api-high-latency-${environmentSuffix}`],
      });
      const response = await cloudWatchClient.send(command);

      expect(response.MetricAlarms).toHaveLength(1);
      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('Latency');
      expect(alarm.Namespace).toBe('AWS/ApiGateway');
      expect(alarm.Threshold).toBe(5000);
      expect(alarm.EvaluationPeriods).toBe(3);
    });
  });

  describe('End-to-End Workflow', () => {
    const apiUrl = outputs.ProjectXApiUrl;

    test('should handle multiple sequential requests', async () => {
      // First request
      const response1 = await axios.get(`${apiUrl}health`);
      expect(response1.status).toBe(200);

      // Second request with data
      const testData = { sequence: 1, test: true };
      const response2 = await axios.post(`${apiUrl}api/v1/data`, testData);
      expect(response2.status).toBe(200);

      // Third request to proxy endpoint
      const response3 = await axios.get(`${apiUrl}custom/endpoint`);
      expect(response3.status).toBe(200);

      // All responses should have consistent structure
      [response1, response2, response3].forEach(response => {
        expect(response.data).toHaveProperty('message');
        expect(response.data).toHaveProperty('timestamp');
        expect(response.data).toHaveProperty('requestId');
      });
    });

    test('should handle concurrent requests', async () => {
      const requests = [
        axios.get(apiUrl),
        axios.get(`${apiUrl}health`),
        axios.post(`${apiUrl}api/v1/data`, { concurrent: true }),
        axios.get(`${apiUrl}test/concurrent`),
      ];

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('message');
        expect(response.data.message).toBe('Hello from ProjectX Lambda!');
      });
    });

    test('API responses should have proper CORS headers', async () => {
      const response = await axios.get(apiUrl, {
        headers: {
          Origin: 'https://example.com',
        },
      });

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
  });

  describe('Performance and Reliability', () => {
    const apiUrl = outputs.ProjectXApiUrl;

    test('API should respond within acceptable time', async () => {
      const startTime = Date.now();
      const response = await axios.get(apiUrl);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(3000); // Should respond within 3 seconds
    });

    test('Lambda function should handle edge cases', async () => {
      // Test with empty POST body
      const response1 = await axios.post(apiUrl, null);
      expect(response1.status).toBe(200);

      // Test with large payload
      const largeData = { data: 'x'.repeat(1000) };
      const response2 = await axios.post(`${apiUrl}api/v1/data`, largeData);
      expect(response2.status).toBe(200);
    });
  });
});
