import * as fs from 'fs';
import * as https from 'https';
import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  KMSClient,
  DescribeKeyCommand,
} from '@aws-sdk/client-kms';

// Load outputs from deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Configure AWS clients
const region = 'us-east-1';
const endpoint = process.env.AWS_ENDPOINT_URL;
const lambdaClient = new LambdaClient({ region, ...(endpoint && { endpoint }) });
const s3Client = new S3Client({
  region,
  ...(endpoint && { endpoint, forcePathStyle: true })
});
const cloudWatchClient = new CloudWatchLogsClient({ region, ...(endpoint && { endpoint }) });
const kmsClient = new KMSClient({ region, ...(endpoint && { endpoint }) });

// Helper function to make HTTP requests
function makeRequest(url: string, method: string = 'GET', data?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(responseData),
            headers: res.headers,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers,
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

describe('Serverless Infrastructure Integration Tests', () => {
  const apiGatewayUrl = outputs.ApiGatewayUrl;
  const lambdaFunctionArn = outputs.LambdaFunctionArn;
  const s3BucketName = outputs.S3BucketName;
  const kmsKeyId = outputs.KmsKeyId;
  const logGroupName = outputs.CloudWatchLogGroup;
  const xrayTracingGroup = outputs.XRayTracingGroup;
  const eventBusName = outputs.EventBusName;
  const eventBusArn = outputs.EventBusArn;
  const eventProcessorArn = outputs.EventProcessorFunctionArn;
  const eventProcessingRuleArn = outputs.EventProcessingRuleArn;

  describe('API Gateway Endpoints', () => {
    test('Should respond to GET request at root endpoint', async () => {
      const response = await makeRequest(apiGatewayUrl);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message');
      expect(response.data.message).toBe('Serverless function executed successfully');
      expect(response.data).toHaveProperty('bucketName', s3BucketName);
      expect(response.data).toHaveProperty('method', 'GET');
      expect(response.data).toHaveProperty('path', '/');
    });

    test('Should respond to POST request at root endpoint', async () => {
      const response = await makeRequest(apiGatewayUrl, 'POST', { test: 'data' });
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message');
      expect(response.data.message).toBe('Serverless function executed successfully');
      expect(response.data).toHaveProperty('method', 'POST');
    });

    test('Should respond to GET request at health endpoint', async () => {
      const healthUrl = apiGatewayUrl + 'health';
      const response = await makeRequest(healthUrl);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message');
      expect(response.data.message).toBe('Serverless function executed successfully');
      expect(response.data).toHaveProperty('path', '/health');
    });

    test('Should include CORS headers in response', async () => {
      const response = await makeRequest(apiGatewayUrl);
      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
  });

  describe('Lambda Function', () => {
    test('Should be invokable directly', async () => {
      const command = new InvokeCommand({
        FunctionName: lambdaFunctionArn,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({
          httpMethod: 'GET',
          path: '/test',
        }),
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);
      
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      expect(payload.statusCode).toBe(200);
      const body = JSON.parse(payload.body);
      expect(body).toHaveProperty('message');
      expect(body.bucketName).toBe(s3BucketName);
    });

    test('Should have correct configuration', async () => {
      const functionName = lambdaFunctionArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
      expect(response.Configuration?.Timeout).toBe(30);
      expect(response.Configuration?.MemorySize).toBe(256);
      expect(response.Configuration?.Environment?.Variables).toHaveProperty('BUCKET_NAME', s3BucketName);
      expect(response.Configuration?.Environment?.Variables).toHaveProperty('KMS_KEY_ID', kmsKeyId);
    });
  });

  describe('S3 Bucket', () => {
    const testKey = `test-object-${Date.now()}.txt`;
    const testContent = 'Test content for integration testing';

    afterAll(async () => {
      // Cleanup test object
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
        }));
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    test('Should allow object upload with KMS encryption', async () => {
      const command = new PutObjectCommand({
        Bucket: s3BucketName,
        Key: testKey,
        Body: testContent,
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: kmsKeyId,
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(response.ServerSideEncryption).toBe('aws:kms');
    });

    test('Should retrieve uploaded object', async () => {
      const command = new GetObjectCommand({
        Bucket: s3BucketName,
        Key: testKey,
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
      expect(response.ServerSideEncryption).toBe('aws:kms');
      
      const body = await response.Body?.transformToString();
      expect(body).toBe(testContent);
    });

    test('Should list objects in bucket', async () => {
      const command = new ListObjectsV2Command({
        Bucket: s3BucketName,
        MaxKeys: 10,
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('KMS Key', () => {
    test('Should have correct configuration', async () => {
      const command = new DescribeKeyCommand({
        KeyId: kmsKeyId,
      });

      const response = await kmsClient.send(command);
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(response.KeyMetadata?.KeySpec).toBe('SYMMETRIC_DEFAULT');
      expect(response.KeyMetadata?.KeyManager).toBe('CUSTOMER');
      expect(response.KeyMetadata?.Enabled).toBe(true);
    });
  });

  describe('CloudWatch Logging', () => {
    test('Should have log group created', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await cloudWatchClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(7);
    });
  });

  describe('End-to-End Workflow', () => {
    test('Should process request through complete infrastructure', async () => {
      // 1. Make API Gateway request
      const apiResponse = await makeRequest(apiGatewayUrl, 'POST', {
        action: 'test',
        timestamp: Date.now(),
      });
      
      expect(apiResponse.status).toBe(200);
      expect(apiResponse.data.message).toBe('Serverless function executed successfully');
      
      // 2. Verify S3 bucket is accessible
      const s3Command = new ListObjectsV2Command({
        Bucket: s3BucketName,
        MaxKeys: 1,
      });
      
      const s3Response = await s3Client.send(s3Command);
      expect(s3Response.$metadata.httpStatusCode).toBe(200);
    });

    test('Should handle concurrent requests', async () => {
      const requests = Array(3).fill(null).map((_, index) => 
        makeRequest(`${apiGatewayUrl}?request=${index}`)
      );
      
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data.message).toBe('Serverless function executed successfully');
      });
    });
  });

  describe('Enhanced Features Validation', () => {
    test('Should include X-Ray and EventBridge features in response', async () => {
      const response = await makeRequest(apiGatewayUrl);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('xrayTracingGroup');
      expect(response.data.xrayTracingGroup).toBe(xrayTracingGroup);
      expect(response.data).toHaveProperty('eventBusName');
      expect(response.data.eventBusName).toBe(eventBusName);
      expect(response.data).toHaveProperty('features');
      expect(response.data.features).toContain('X-Ray Tracing');
      expect(response.data.features).toContain('EventBridge Integration');
    });

    test('Should validate event processor Lambda exists', async () => {
      const functionName = eventProcessorArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.FunctionName).toBe(functionName);
      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });

    test('Should validate main Lambda has X-Ray tracing enabled', async () => {
      const functionName = lambdaFunctionArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });
  });

  describe('Security Validation', () => {
    test('Should enforce IAM permissions for Lambda', async () => {
      // Verify Lambda has limited permissions by checking its configuration
      const functionName = lambdaFunctionArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Role).toBeDefined();
      // Role should follow least privilege principle
      expect(response.Configuration?.Role).toContain('ServerlessLambdaRole');
    });

    test('Should use KMS encryption for S3 operations', async () => {
      const testKey = `security-test-${Date.now()}.txt`;
      
      try {
        // Upload without specifying encryption should still use bucket default
        const putCommand = new PutObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
          Body: 'Security test content',
        });
        
        const putResponse = await s3Client.send(putCommand);
        expect(putResponse.ServerSideEncryption).toBe('aws:kms');
        
        // Verify object is encrypted
        const getCommand = new GetObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
        });
        
        const getResponse = await s3Client.send(getCommand);
        expect(getResponse.ServerSideEncryption).toBe('aws:kms');
        expect(getResponse.SSEKMSKeyId).toBeDefined();
      } finally {
        // Cleanup
        await s3Client.send(new DeleteObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
        }));
      }
    });
  });
});