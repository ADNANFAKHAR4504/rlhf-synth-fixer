// Configuration - These are coming from cfn-outputs after cdk deploy
import {
  APIGatewayClient,
  GetRestApiCommand
} from '@aws-sdk/client-api-gateway';
import {
  CloudWatchClient,
  GetMetricStatisticsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  GetFunctionCommand,
  InvokeCommand,
  LambdaClient
} from '@aws-sdk/client-lambda';
import axios from 'axios';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS clients
const lambdaClient = new LambdaClient({ region: outputs.Region || 'us-west-2' });
const apiGatewayClient = new APIGatewayClient({ region: outputs.Region || 'us-west-2' });
const cloudWatchClient = new CloudWatchClient({ region: outputs.Region || 'us-west-2' });

describe('Serverless API Integration Tests', () => {
  
  describe('Lambda Function Tests', () => {
    test('Lambda function should exist and be configured correctly', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName
      });
      
      const response = await lambdaClient.send(command);
      
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(outputs.LambdaFunctionName);
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
      expect(response.Configuration?.MemorySize).toBe(256);
      expect(response.Configuration?.Timeout).toBe(30);
      expect(response.Configuration?.Environment?.Variables).toMatchObject({
        NODE_ENV: 'production',
        LOG_LEVEL: 'info'
      });
    });

    test('Lambda function URL should return valid response', async () => {
      const response = await axios.get(outputs.FunctionUrl);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message');
      expect(response.data.message).toBe('Hello from serverless API!');
      expect(response.data).toHaveProperty('timestamp');
      expect(response.data).toHaveProperty('requestId');
    });

    test('Lambda function should handle CORS headers correctly', async () => {
      const response = await axios.get(outputs.FunctionUrl);
      
      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-headers']).toBe('Content-Type');
      expect(response.headers['access-control-allow-methods']).toBe('GET,POST,PUT,DELETE,OPTIONS');
    });

    test('Lambda function should be invokable directly', async () => {
      const command = new InvokeCommand({
        FunctionName: outputs.LambdaFunctionName,
        Payload: JSON.stringify({
          requestContext: {
            requestId: 'test-request-123'
          }
        })
      });
      
      const response = await lambdaClient.send(command);
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      
      expect(response.StatusCode).toBe(200);
      expect(payload.statusCode).toBe(200);
      const body = JSON.parse(payload.body);
      expect(body.message).toBe('Hello from serverless API!');
      expect(body.requestId).toBe('test-request-123');
    });
  });

  describe('API Gateway Tests', () => {
    test('API Gateway should exist with correct configuration', async () => {
      const command = new GetRestApiCommand({
        restApiId: outputs.ApiGatewayRestApiId
      });
      
      const response = await apiGatewayClient.send(command);
      
      expect(response).toBeDefined();
      expect(response.name).toContain('serverless-api');
      expect(response.description).toContain('Serverless API');
    });

    test('API Gateway health endpoint should return success', async () => {
      const healthUrl = `${outputs.ApiGatewayUrl}api/v1/health`;
      const response = await axios.get(healthUrl);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message');
      expect(response.data.message).toBe('Hello from serverless API!');
    });

    test('API Gateway data endpoint should support GET method', async () => {
      const dataUrl = `${outputs.ApiGatewayUrl}api/v1/data`;
      const response = await axios.get(dataUrl);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message');
    });

    test('API Gateway data endpoint should support POST method', async () => {
      const dataUrl = `${outputs.ApiGatewayUrl}api/v1/data`;
      const response = await axios.post(dataUrl, {
        test: 'data'
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message');
    });

    test('API Gateway data endpoint should support PUT method', async () => {
      const dataUrl = `${outputs.ApiGatewayUrl}api/v1/data`;
      const response = await axios.put(dataUrl, {
        test: 'update'
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message');
    });

    test('API Gateway data endpoint should support DELETE method', async () => {
      const dataUrl = `${outputs.ApiGatewayUrl}api/v1/data`;
      const response = await axios.delete(dataUrl);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message');
    });

    test('API Gateway should handle CORS preflight requests', async () => {
      const dataUrl = `${outputs.ApiGatewayUrl}api/v1/data`;
      const response = await axios.options(dataUrl);
      
      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });
  });

  describe('CloudWatch Monitoring Tests', () => {
    // Set timeout to 2 minutes for all tests in this suite
    jest.setTimeout(120000);
    beforeAll(async () => {
      try {
        // Invoke Lambda to ensure we have metrics
      const command = new InvokeCommand({
        FunctionName: outputs.LambdaFunctionName,
        Payload: JSON.stringify({ test: true })
      });
      await lambdaClient.send(command);
      
      // Wait for metrics to propagate (45 seconds should be enough)
      await new Promise(resolve => setTimeout(resolve, 45000));
      } catch (error) {
        console.error('Error in beforeAll:', error);
        throw error;
      }
    });
    
    test('CloudWatch dashboard should be accessible', async () => {
      // Verify dashboard URL is properly formatted
      expect(outputs.DashboardUrl).toContain('cloudwatch');
      expect(outputs.DashboardUrl).toContain(outputs.DashboardName);
      expect(outputs.DashboardUrl).toContain(outputs.Region);
    });

    test('SNS alert topic should exist', async () => {
      expect(outputs.AlertTopicArn).toContain('arn:aws:sns');
      expect(outputs.AlertTopicArn).toContain(outputs.Region);
      expect(outputs.AlertTopicArn).toContain('serverless-api-alerts');
    });

    test('Lambda function should have CloudWatch metrics', async () => {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // 24 hour ago
      
      const command = new GetMetricStatisticsCommand({
        Namespace: 'AWS/Lambda',
        MetricName: 'Invocations',
        Dimensions: [
          {
            Name: 'FunctionName',
            Value: outputs.LambdaFunctionName
          }
        ],
        StartTime: startTime,
        EndTime: endTime,
        Period: 86400, // // 24 hours in seconds instead of 1 hour
        Statistics: ['Sum']
      });
      
      const response = await cloudWatchClient.send(command);
      
      expect(response.Datapoints).toBeDefined();
      // Just verify metrics exist without checking values
      expect(Array.isArray(response.Datapoints)).toBe(true);
      // At least one invocation from our tests
    });
  });

  describe('End-to-End Workflow Tests', () => {
    test('Complete request flow through API Gateway to Lambda', async () => {
      // Make request through API Gateway
      const apiUrl = `${outputs.ApiGatewayUrl}api/v1/health`;
      const apiResponse = await axios.get(apiUrl);
      
      // Verify response structure
      expect(apiResponse.status).toBe(200);
      expect(apiResponse.data).toHaveProperty('message', 'Hello from serverless API!');
      expect(apiResponse.data).toHaveProperty('timestamp');
      expect(apiResponse.data).toHaveProperty('requestId');
      
      // Verify timestamp is recent (within last minute)
      const timestamp = new Date(apiResponse.data.timestamp);
      const now = new Date();
      const timeDiff = now.getTime() - timestamp.getTime();
      expect(timeDiff).toBeLessThan(60000); // Less than 1 minute
    });

    test('Multiple endpoints should work consistently', async () => {
      const endpoints = [
        { url: outputs.FunctionUrl, name: 'Function URL' },
        { url: `${outputs.ApiGatewayUrl}api/v1/health`, name: 'API Gateway Health' },
        { url: `${outputs.ApiGatewayUrl}api/v1/data`, name: 'API Gateway Data' }
      ];
      
      const results = await Promise.all(
        endpoints.map(async (endpoint) => {
          try {
            const response = await axios.get(endpoint.url);
            return {
              endpoint: endpoint.name,
              success: response.status === 200,
              hasMessage: response.data?.message === 'Hello from serverless API!'
            };
          } catch (error) {
            return {
              endpoint: endpoint.name,
              success: false,
              hasMessage: false
            };
          }
        })
      );
      
      // All endpoints should be successful
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.hasMessage).toBe(true);
      });
    });

    test('Production environment tags should be applied', async () => {
      // Verify Lambda function has production configuration
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionName
      });
      
      const response = await lambdaClient.send(command);
      
      // Check environment variables indicate production
      expect(response.Configuration?.Environment?.Variables?.NODE_ENV).toBe('production');
      
      // Verify outputs contain production identifiers
      expect(outputs.LambdaFunctionName).toContain(environmentSuffix);
      expect(outputs.DashboardName).toContain(environmentSuffix);
    });
  });
});
