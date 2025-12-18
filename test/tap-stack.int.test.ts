// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetResourcesCommand,
} from '@aws-sdk/client-api-gateway';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS clients
const s3Client = new S3Client({ region: 'us-east-1' });
const lambdaClient = new LambdaClient({ region: 'us-east-1' });
const apiGatewayClient = new APIGatewayClient({ region: 'us-east-1' });

describe('Serverless Infrastructure Integration Tests', () => {
  describe('S3 Bucket', () => {
    test('should have S3 bucket accessible and properly configured', async () => {
      const bucketName = outputs.BucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toBe(`corp-user-data-bucket-${environmentSuffix}`);

      // Test bucket exists and is accessible
      const headBucketCommand = new HeadBucketCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(headBucketCommand);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should be able to list objects in the bucket', async () => {
      const bucketName = outputs.BucketName;

      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 1,
      });

      const response = await s3Client.send(listCommand);
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(response.KeyCount).toBeDefined();
    });
  });

  describe('Lambda Function', () => {
    test('should have Lambda function deployed and accessible', async () => {
      const functionName = outputs.LambdaFunctionName;
      expect(functionName).toBeDefined();
      expect(functionName).toBe(`CorpUserDataProcessor-${environmentSuffix}`);

      const getFunctionCommand = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(getFunctionCommand);
      expect(response.Configuration?.FunctionName).toBe(functionName);
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Handler).toBe('index.handler');
      expect(response.Configuration?.Environment?.Variables?.BUCKET_NAME).toBe(
        outputs.BucketName
      );
    });

    test('should be able to invoke Lambda function directly', async () => {
      const functionName = outputs.LambdaFunctionName;

      const testEvent = {
        body: JSON.stringify({
          userId: 'test-user-123',
          data: 'test data for integration',
          timestamp: new Date().toISOString(),
        }),
        requestId: 'integration-test-request',
      };

      const invokeCommand = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify(testEvent),
      });

      const response = await lambdaClient.send(invokeCommand);
      expect(response.StatusCode).toBe(200);

      const payload = JSON.parse(
        new TextDecoder().decode(response.Payload)
      );
      expect(payload.statusCode).toBe(200);

      const body = JSON.parse(payload.body);
      expect(body.message).toBe('User data processed successfully');
      expect(body.s3Key).toBeDefined();
      expect(body.timestamp).toBeDefined();
    });
  });

  describe('API Gateway', () => {
    test('should have API Gateway deployed and accessible', async () => {
      const apiId = outputs.ApiGatewayId;
      const apiUrl = outputs.ApiGatewayUrl;

      expect(apiId).toBeDefined();
      expect(apiUrl).toBeDefined();
      expect(apiUrl).toContain(apiId);

      // Check for either AWS or LocalStack URL format
      const isValidUrl = apiUrl.includes('us-east-1.amazonaws.com') ||
                        apiUrl.includes('execute-api.localhost.localstack.cloud') ||
                        apiUrl.includes('execute-api');
      expect(isValidUrl).toBe(true);

      const getApiCommand = new GetRestApiCommand({
        restApiId: apiId,
      });

      const response = await apiGatewayClient.send(getApiCommand);
      expect(response.name).toBe(`CorpUserDataApi-${environmentSuffix}`);
      expect(response.description).toBe(
        'API Gateway for processing user data with IP whitelisting'
      );
      expect(response.endpointConfiguration?.types).toContain('REGIONAL');
    });

    test('should have correct API resources configured', async () => {
      const apiId = outputs.ApiGatewayId;

      const getResourcesCommand = new GetResourcesCommand({
        restApiId: apiId,
      });

      const response = await apiGatewayClient.send(getResourcesCommand);
      const resources = response.items || [];

      // Should have root resource and userdata resource
      expect(resources.length).toBeGreaterThanOrEqual(2);

      const userdataResource = resources.find(
        (r) => r.pathPart === 'userdata'
      );
      expect(userdataResource).toBeDefined();
      expect(userdataResource?.resourceMethods).toBeDefined();

      // Should have GET, POST, and OPTIONS methods
      const methods = Object.keys(userdataResource?.resourceMethods || {});
      expect(methods).toContain('GET');
      expect(methods).toContain('POST');
      expect(methods).toContain('OPTIONS');
    });
  });

  describe('End-to-End Workflow', () => {
    test('should process data through complete workflow via API Gateway', async () => {
      const apiUrl = outputs.ApiGatewayUrl;
      const bucketName = outputs.BucketName;

      // Test data
      const testData = {
        userId: 'integration-test-user',
        action: 'e2e-test',
        data: {
          message: 'End-to-end integration test',
          timestamp: new Date().toISOString(),
        },
      };

      // Get initial object count in bucket
      const initialListCommand = new ListObjectsV2Command({
        Bucket: bucketName,
      });
      const initialResponse = await s3Client.send(initialListCommand);
      const initialCount = initialResponse.KeyCount || 0;

      // Make API call
      const response = await fetch(`${apiUrl}userdata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      expect(response.status).toBe(200);
      const responseBody = await response.json() as any;
      expect(responseBody.message).toBe('User data processed successfully');
      expect(responseBody.s3Key).toBeDefined();

      // Verify data was stored in S3
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for S3 consistency

      const finalListCommand = new ListObjectsV2Command({
        Bucket: bucketName,
      });
      const finalResponse = await s3Client.send(finalListCommand);
      const finalCount = finalResponse.KeyCount || 0;

      expect(finalCount).toBeGreaterThan(initialCount);

      // Verify the specific object exists and has correct content
      const getObjectCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: responseBody.s3Key,
      });

      const objectResponse = await s3Client.send(getObjectCommand);
      const objectBody = await objectResponse.Body?.transformToString();
      const storedData = JSON.parse(objectBody || '{}');

      expect(storedData.userId).toBe(testData.userId);
      expect(storedData.action).toBe(testData.action);
      expect(storedData.data.message).toBe(testData.data.message);
      expect(storedData.processedAt).toBeDefined();
      expect(storedData.requestId).toBeDefined();
    });

    test('should handle CORS preflight requests', async () => {
      const apiUrl = outputs.ApiGatewayUrl;

      const response = await fetch(`${apiUrl}userdata`, {
        method: 'OPTIONS',
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
      expect(response.headers.get('access-control-allow-methods')).toContain(
        'GET'
      );
      expect(response.headers.get('access-control-allow-methods')).toContain(
        'POST'
      );
      expect(response.headers.get('access-control-allow-methods')).toContain(
        'OPTIONS'
      );
    });

    test('should handle GET requests to the API', async () => {
      const apiUrl = outputs.ApiGatewayUrl;

      const response = await fetch(`${apiUrl}userdata`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);
      const responseBody = await response.json() as any;
      expect(responseBody.message).toBe('User data processed successfully');
    });
  });

  describe('Security and Configuration', () => {
    test('should have IP whitelisting policy configured', async () => {
      const apiId = outputs.ApiGatewayId;

      const getApiCommand = new GetRestApiCommand({
        restApiId: apiId,
      });

      const response = await apiGatewayClient.send(getApiCommand);
      expect(response.policy).toBeDefined();

      if (response.policy) {
        // The policy comes as an escaped JSON string
        const policyString = response.policy.replace(/\\"/g, '"');
        const policy = JSON.parse(policyString);
        expect(policy.Statement).toBeDefined();
        expect(policy.Statement[0].Condition.IpAddress).toBeDefined();
        expect(policy.Statement[0].Condition.IpAddress['aws:SourceIp']).toBeDefined();
      }
    });

    test('should have appropriate IAM permissions for Lambda', async () => {
      const functionName = outputs.LambdaFunctionName;

      const getFunctionCommand = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(getFunctionCommand);
      expect(response.Configuration?.Role).toBeDefined();
      expect(response.Configuration?.Role).toContain('CorpLambdaRole');
    });
  });
});
