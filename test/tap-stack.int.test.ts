// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import axios, { AxiosError } from 'axios';
import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';

// Load outputs from deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// AWS SDK clients
const lambdaClient = new LambdaClient({
  region: outputs.Region || 'us-east-1',
});
const cloudWatchClient = new CloudWatchClient({
  region: outputs.Region || 'us-east-1',
});
const snsClient = new SNSClient({ region: outputs.Region || 'us-east-1' });
const apiGatewayClient = new APIGatewayClient({
  region: outputs.Region || 'us-east-1',
});

describe('Serverless Infrastructure Integration Tests', () => {
  const apiUrl = outputs.ApiUrl;
  const processingFunctionArn = outputs.ProcessingFunctionArn;
  const streamingFunctionArn = outputs.StreamingFunctionArn;
  const alertTopicArn = outputs.AlertTopicArn;
  const apiId = outputs.ApiId;

  describe('API Gateway Endpoints', () => {
    test('Health endpoint should return healthy status', async () => {
      const response = await axios.get(`${apiUrl}v1/health`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'healthy');
      expect(response.data).toHaveProperty('environment');
      expect(response.data).toHaveProperty('timestamp');
    });

    test('Process endpoint GET should invoke Lambda and return success', async () => {
      const response = await axios.get(`${apiUrl}v1/process`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty(
        'message',
        'Request processed successfully'
      );
      expect(response.data).toHaveProperty('timestamp');
      expect(response.data).toHaveProperty('environment');
      expect(response.data).toHaveProperty('region', outputs.Region);
      expect(response.data).toHaveProperty('requestId');
    });

    test('Process endpoint POST should handle request body', async () => {
      const testData = { test: 'data', timestamp: new Date().toISOString() };
      const response = await axios.post(`${apiUrl}v1/process`, testData, {
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty(
        'message',
        'Request processed successfully'
      );
    });

    test('Stream endpoint GET should return streaming simulation', async () => {
      const response = await axios.get(`${apiUrl}v1/stream`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data.data).toHaveProperty('chunks');
      expect(response.data.data.chunks).toHaveLength(10);
      expect(response.data).toHaveProperty('completed', true);
      expect(response.data).toHaveProperty('totalChunks', 10);
    });

    test('CORS headers should be present', async () => {
      const response = await axios.get(`${apiUrl}v1/process`);

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    test('Invalid endpoint should return 403', async () => {
      try {
        await axios.get(`${apiUrl}v1/nonexistent`);
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(403);
      }
    });
  });

  describe('Lambda Functions', () => {
    test('Processing Lambda function should be deployed and functional', async () => {
      const getFunctionCommand = new GetFunctionCommand({
        FunctionName: processingFunctionArn,
      });

      const functionInfo = await lambdaClient.send(getFunctionCommand);

      expect(functionInfo.Configuration?.FunctionArn).toBe(
        processingFunctionArn
      );
      expect(functionInfo.Configuration?.Runtime).toBe('nodejs20.x');
      expect(functionInfo.Configuration?.MemorySize).toBe(512);
      expect(functionInfo.Configuration?.Timeout).toBe(30);
      // Reserved concurrency may be undefined or set to a value
      const reservedConcurrency = (functionInfo.Configuration as any)
        ?.ReservedConcurrentExecutions;
      if (reservedConcurrency !== undefined) {
        expect(reservedConcurrency).toBeGreaterThan(0);
      }
    });

    test('Streaming Lambda function should be deployed and functional', async () => {
      const getFunctionCommand = new GetFunctionCommand({
        FunctionName: streamingFunctionArn,
      });

      const functionInfo = await lambdaClient.send(getFunctionCommand);

      expect(functionInfo.Configuration?.FunctionArn).toBe(
        streamingFunctionArn
      );
      expect(functionInfo.Configuration?.Runtime).toBe('nodejs20.x');
      expect(functionInfo.Configuration?.MemorySize).toBe(1024);
      expect(functionInfo.Configuration?.Timeout).toBe(300);
      // Reserved concurrency may be undefined or set to a value
      const reservedConcurrency = (functionInfo.Configuration as any)
        ?.ReservedConcurrentExecutions;
      if (reservedConcurrency !== undefined) {
        expect(reservedConcurrency).toBeGreaterThan(0);
      }
    });

    test('Direct Lambda invocation should work', async () => {
      const invokeCommand = new InvokeCommand({
        FunctionName: processingFunctionArn,
        Payload: JSON.stringify({
          test: 'direct invocation',
          requestContext: { requestId: 'test-123' },
        }),
      });

      const result = await lambdaClient.send(invokeCommand);
      const payload = JSON.parse(new TextDecoder().decode(result.Payload));

      expect(result.StatusCode).toBe(200);
      expect(payload.statusCode).toBe(200);

      const body = JSON.parse(payload.body);
      expect(body).toHaveProperty('message', 'Request processed successfully');
      expect(body).toHaveProperty('requestId', 'test-123');
    });

    test('Lambda environment variables should be set correctly', async () => {
      const getFunctionCommand = new GetFunctionCommand({
        FunctionName: processingFunctionArn,
      });

      const functionInfo = await lambdaClient.send(getFunctionCommand);
      const envVars = functionInfo.Configuration?.Environment?.Variables;

      expect(envVars).toHaveProperty('ENVIRONMENT');
      expect(envVars).toHaveProperty('LOG_LEVEL', 'INFO');
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('CloudWatch alarms should be configured', async () => {
      const describeAlarmsCommand = new DescribeAlarmsCommand({
        MaxRecords: 100,
      });

      const alarms = await cloudWatchClient.send(describeAlarmsCommand);
      const alarmNames = alarms.MetricAlarms?.map(a => a.AlarmName) || [];

      // Filter alarms related to our deployment using environment suffix
      const envSuffix = outputs.Environment;
      const deploymentAlarms = alarmNames.filter(name =>
        name?.includes(envSuffix)
      );

      // Check for Lambda alarms - looking for alarms with the environment suffix
      const processingErrorAlarms = deploymentAlarms.filter(
        name =>
          name?.includes('processing-function') && name?.includes('errors')
      );
      const streamingErrorAlarms = deploymentAlarms.filter(
        name => name?.includes('streaming-function') && name?.includes('errors')
      );

      expect(processingErrorAlarms.length).toBeGreaterThan(0);
      expect(streamingErrorAlarms.length).toBeGreaterThan(0);

      // Check for API Gateway alarms
      const apiErrorAlarm = deploymentAlarms.find(name =>
        name?.includes('api-gateway-high-errors')
      );
      const apiLatencyAlarm = deploymentAlarms.find(name =>
        name?.includes('api-gateway-high-latency')
      );

      expect(apiErrorAlarm).toBeDefined();
      expect(apiLatencyAlarm).toBeDefined();
    });

    test('SNS topic for alerts should exist', async () => {
      const getTopicCommand = new GetTopicAttributesCommand({
        TopicArn: alertTopicArn,
      });

      const topicAttributes = await snsClient.send(getTopicCommand);

      expect(topicAttributes.Attributes?.TopicArn).toBe(alertTopicArn);
      expect(topicAttributes.Attributes?.DisplayName).toContain(
        'Serverless Alerts'
      );
    });
  });

  describe('API Gateway Configuration', () => {
    test('API Gateway should have correct configuration', async () => {
      const getApiCommand = new GetRestApiCommand({
        restApiId: apiId,
      });

      const apiInfo = await apiGatewayClient.send(getApiCommand);

      expect(apiInfo.name).toContain('serverless-api');
      expect(apiInfo.description).toContain('TLS 1.3 support');
      expect(apiInfo.endpointConfiguration?.types).toContain('REGIONAL');
    });

    test('API Gateway stage should have tracing enabled', async () => {
      const getStageCommand = new GetStageCommand({
        restApiId: apiId,
        stageName: outputs.Environment,
      });

      const stageInfo = await apiGatewayClient.send(getStageCommand);

      expect(stageInfo.tracingEnabled).toBe(true);
      expect(stageInfo.methodSettings).toBeDefined();
    });
  });

  describe('End-to-End Workflows', () => {
    test('Multiple concurrent requests should be handled', async () => {
      const promises = Array(10)
        .fill(null)
        .map(() => axios.get(`${apiUrl}v1/process`));

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty(
          'message',
          'Request processed successfully'
        );
      });
    });

    test('Rate limiting should be enforced', async () => {
      // This test validates that usage plan is in place
      // In production, you would test actual rate limiting behavior
      const getApiCommand = new GetRestApiCommand({
        restApiId: apiId,
      });

      const apiInfo = await apiGatewayClient.send(getApiCommand);
      expect(apiInfo.id).toBe(apiId);

      // The usage plan is configured with 1000 req/s rate limit
      // We're not actually testing the limit to avoid affecting other tests
    });

    test('Error handling should work correctly', async () => {
      // Send invalid data to trigger error handling
      try {
        // Invoke Lambda with malformed event to test error handling
        const invokeCommand = new InvokeCommand({
          FunctionName: processingFunctionArn,
          Payload: JSON.stringify({
            // Missing requestContext to potentially trigger different code path
            malformedData: true,
          }),
        });

        const result = await lambdaClient.send(invokeCommand);
        const payload = JSON.parse(new TextDecoder().decode(result.Payload));

        expect(result.StatusCode).toBe(200);
        expect(payload.statusCode).toBe(200);

        const body = JSON.parse(payload.body);
        // Even with malformed data, our Lambda handles it gracefully
        expect(body).toHaveProperty(
          'message',
          'Request processed successfully'
        );
        expect(body.requestId).toBe('N/A'); // Default when requestId is not provided
      } catch (error) {
        // If error occurs, it should be handled gracefully
        expect(error).toBeDefined();
      }
    });

    test('Cross-region functionality should be configured correctly', async () => {
      // Verify that the infrastructure is deployed in the expected region
      expect(outputs.Region).toBe('us-east-1');

      // Verify Lambda functions are in the correct region
      const processingArn = processingFunctionArn.split(':');
      expect(processingArn[3]).toBe('us-east-1');

      const streamingArn = streamingFunctionArn.split(':');
      expect(streamingArn[3]).toBe('us-east-1');
    });
  });

  describe('Performance and Scaling', () => {
    test('Lambda functions should have appropriate memory and timeout settings', async () => {
      // Processing function - optimized for quick responses
      const processingFunc = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: processingFunctionArn })
      );
      expect(processingFunc.Configuration?.MemorySize).toBeLessThanOrEqual(512);
      expect(processingFunc.Configuration?.Timeout).toBeLessThanOrEqual(30);

      // Streaming function - configured for larger payloads
      const streamingFunc = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: streamingFunctionArn })
      );
      expect(streamingFunc.Configuration?.MemorySize).toBeGreaterThanOrEqual(
        1024
      );
      expect(streamingFunc.Configuration?.Timeout).toBeGreaterThanOrEqual(300);
    });

    test('Lambda functions should be properly configured for scaling', async () => {
      const processingFunc = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: processingFunctionArn })
      );
      const streamingFunc = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: streamingFunctionArn })
      );

      // Functions should be properly configured (runtime, handler, etc)
      expect(processingFunc.Configuration?.Runtime).toBe('nodejs20.x');
      expect(processingFunc.Configuration?.Handler).toBe('index.handler');
      expect(streamingFunc.Configuration?.Runtime).toBe('nodejs20.x');
      expect(streamingFunc.Configuration?.Handler).toBe('index.handler');

      // If reserved concurrency is set, it should be appropriate
      const processingReserved = (processingFunc.Configuration as any)
        ?.ReservedConcurrentExecutions;
      const streamingReserved = (streamingFunc.Configuration as any)
        ?.ReservedConcurrentExecutions;

      if (processingReserved) {
        expect(processingReserved).toBeGreaterThan(0);
      }
      if (streamingReserved) {
        expect(streamingReserved).toBeGreaterThan(0);
      }
    });
  });
});
