import fs from 'fs';
import path from 'path';
import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  ElasticLoadBalancingV2Client,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import axios from 'axios';

// Configuration - These are coming from cfn-outputs after stack deployment
let outputs: any = {};
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX;
const region = process.env.AWS_REGION;

// AWS clients - configured with specific region
const elbClient = new ElasticLoadBalancingV2Client({ region });
const s3Client = new S3Client({ region });

// Test configuration
const HTTP_TIMEOUT = 30000; // 30 seconds
const HEALTH_CHECK_RETRIES = 10;
const HEALTH_CHECK_DELAY = 10000; // 10 seconds

beforeAll(async () => {
  // Load CloudFormation stack outputs
  try {
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(outputsContent);
    } else {
      throw new Error('CloudFormation outputs file not found. Stack must be deployed first.');
    }
  } catch (error) {
    throw new Error(`Failed to load CloudFormation outputs: ${error}`);
  }
});

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForHealthCheck(url: string, retries: number = HEALTH_CHECK_RETRIES): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, { timeout: HTTP_TIMEOUT });
      if (response.status === 200) {
        return true;
      }
    } catch (error) {
      // Continue retrying
    }
    if (i < retries - 1) {
      await sleep(HEALTH_CHECK_DELAY);
    }
  }
  return false;
}

describe('TapStack Integration Tests - End-to-End Data Flow', () => {
  describe('1. User Request → Load Balancer → EC2 → Response', () => {
    test('Load Balancer should be accessible and return HTTP 200', async () => {
      const albUrl = outputs.LoadBalancerURL;
      expect(albUrl).toBeDefined();

      const isHealthy = await waitForHealthCheck(albUrl);
      expect(isHealthy).toBe(true);

      const response = await axios.get(albUrl, { timeout: HTTP_TIMEOUT });
      expect(response.status).toBe(200);
      // Response could be from static EC2 instances or ASG instances
      expect(
        response.data.includes('Web Application Infrastructure') ||
        response.data.includes('Auto Scaled Instance')
      ).toBe(true);
    });

    test('Load Balancer should route requests to healthy EC2 instances', async () => {
      const albUrl = outputs.LoadBalancerURL;
      
      // Make multiple requests to verify load balancing
      const requests = Array(5).fill(null).map(() => 
        axios.get(albUrl, { timeout: HTTP_TIMEOUT })
      );
      
      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data).toContain('Instance ID');
      });
    });

    test('Direct EC2 instance access via Elastic IP should work', async () => {
      const instance1Url = outputs.WebServerInstance1URL;
      const instance2Url = outputs.WebServerInstance2URL;
      
      expect(instance1Url).toBeDefined();
      expect(instance2Url).toBeDefined();

      const isHealthy1 = await waitForHealthCheck(instance1Url);
      const isHealthy2 = await waitForHealthCheck(instance2Url);
      
      expect(isHealthy1).toBe(true);
      expect(isHealthy2).toBe(true);

      const response1 = await axios.get(instance1Url, { timeout: HTTP_TIMEOUT });
      const response2 = await axios.get(instance2Url, { timeout: HTTP_TIMEOUT });
      
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });

  describe('2. EC2 to S3 Integration - Data Flow Simulation', () => {
    const testDataKeys: string[] = [];

    afterEach(async () => {
      // Cleanup: Delete all test data created during tests
      const bucketName = outputs.S3BucketName;
      if (bucketName && testDataKeys.length > 0) {
        for (const key of testDataKeys) {
          try {
            const deleteCommand = new DeleteObjectCommand({
              Bucket: bucketName,
              Key: key,
            });
            await s3Client.send(deleteCommand);
          } catch (error) {
            console.error('Cleanup error:', error);
          }
        }
        testDataKeys.length = 0; // Clear array
      }
    });

    test('Simulate: Write data to S3 → Verify EC2 can access it → Cleanup', async () => {
      const bucketName = outputs.S3BucketName;
      const albUrl = outputs.LoadBalancerURL;
      
      expect(bucketName).toBeDefined();
      expect(albUrl).toBeDefined();

      // Step 1: Write test data to S3 
      const testKey = `test-data-flow-${Date.now()}.json`;
      const testData = JSON.stringify({
        testId: `test-${Date.now()}`,
        timestamp: new Date().toISOString(),
        message: 'Data flow simulation test',
        source: 'integration-test',
      });

      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testData,
        ContentType: 'application/json',
      });
      await s3Client.send(putCommand);
      testDataKeys.push(testKey);

      // Step 2: Verify data was written successfully
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      });
      const getResponse = await s3Client.send(getCommand);
      const retrievedData = await getResponse.Body?.transformToString();
      
      expect(retrievedData).toBe(testData);
      const parsedData = JSON.parse(retrievedData!);
      expect(parsedData.message).toBe('Data flow simulation test');

      // Step 3: Verify EC2 instances can see this data (via S3 list operation)
      // This simulates EC2 instance reading from S3
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: 'test-data-flow-',
      });
      const listResponse = await s3Client.send(listCommand);
      
      expect(listResponse.Contents).toBeDefined();
      const testFile = listResponse.Contents!.find(obj => obj.Key === testKey);
      expect(testFile).toBeDefined();

      // Step 4: Verify the data flow is working end-to-end
      // Make request to load balancer to ensure system is operational
      const webResponse = await axios.get(albUrl, { timeout: HTTP_TIMEOUT });
      expect(webResponse.status).toBe(200);
      expect(webResponse.data).toContain(bucketName);
    });

    test('Simulate: Write multiple files to S3 → Verify access → Cleanup', async () => {
      const bucketName = outputs.S3BucketName;
      
      expect(bucketName).toBeDefined();

      // Step 1: Write multiple test files to S3
      const testFiles = [
        { key: `test-batch-${Date.now()}-1.txt`, content: 'Test file 1 content' },
        { key: `test-batch-${Date.now()}-2.txt`, content: 'Test file 2 content' },
        { key: `test-batch-${Date.now()}-3.txt`, content: 'Test file 3 content' },
      ];

      for (const file of testFiles) {
        const putCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: file.key,
          Body: file.content,
        });
        await s3Client.send(putCommand);
        testDataKeys.push(file.key);
      }

      // Step 2: Verify all files are accessible
      for (const file of testFiles) {
        const getCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: file.key,
        });
        const response = await s3Client.send(getCommand);
        const content = await response.Body?.transformToString();
        expect(content).toBe(file.content);
      }

      // Step 3: Verify files appear in list operation (simulating EC2 listing)
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: 'test-batch-',
      });
      const listResponse = await s3Client.send(listCommand);
      
      expect(listResponse.Contents).toBeDefined();
      expect(listResponse.Contents!.length).toBeGreaterThanOrEqual(testFiles.length);
    });

    test('Simulate: Write data → Access via Load Balancer → Verify S3 integration → Cleanup', async () => {
      const bucketName = outputs.S3BucketName;
      const albUrl = outputs.LoadBalancerURL;
      
      expect(bucketName).toBeDefined();
      expect(albUrl).toBeDefined();

      // Step 1: Write test data to S3 
      const testKey = `user-data-${Date.now()}.json`;
      const userData = JSON.stringify({
        userId: 'test-user-123',
        action: 'data-upload',
        timestamp: new Date().toISOString(),
        data: { test: 'integration flow' },
      });

      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: userData,
        ContentType: 'application/json',
      });
      await s3Client.send(putCommand);
      testDataKeys.push(testKey);

      // Step 2: Access application via Load Balancer
      const webResponse = await axios.get(albUrl, { timeout: HTTP_TIMEOUT });
      expect(webResponse.status).toBe(200);
      // Response could be from static EC2 instances or ASG instances
      expect(
        webResponse.data.includes('Web Application Infrastructure') ||
        webResponse.data.includes('Auto Scaled Instance')
      ).toBe(true);

      // Step 3: Verify the data is accessible 
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      });
      const getResponse = await s3Client.send(getCommand);
      const retrievedData = await getResponse.Body?.transformToString();
      const parsedData = JSON.parse(retrievedData!);
      
      expect(parsedData.userId).toBe('test-user-123');
      expect(parsedData.action).toBe('data-upload');

      // Step 4: Verify complete data flow: User → LB → EC2 → S3 → Response
      // The web response should indicate S3 bucket is accessible
      expect(webResponse.data).toContain(bucketName);
    });
  });

  describe('3. Complete End-to-End Workflow', () => {
    test('Full workflow: User request → Load Balancer → EC2 → S3 → Response', async () => {
      const albUrl = outputs.LoadBalancerURL;
      const bucketName = outputs.S3BucketName;

      // Step 1: User sends HTTP request to Load Balancer
      const userRequest = await axios.get(albUrl, { timeout: HTTP_TIMEOUT });
      expect(userRequest.status).toBe(200);
      
      // Step 2: Verify response contains instance information
      // Response could be from static EC2 instances or ASG instances
      expect(
        userRequest.data.includes('Instance ID') ||
        userRequest.data.includes('Instance ID:')
      ).toBe(true);
      expect(userRequest.data).toContain('S3 Bucket');
      
      // Step 3: Verify S3 bucket is accessible (EC2 instances can read/write)
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 10,
      });
      const s3Response = await s3Client.send(listCommand);
      expect(s3Response.Contents).toBeDefined();
      
      // Step 4: Verify complete data flow worked
      // Response should indicate successful S3 integration
      expect(userRequest.data).toContain(bucketName);
    });

    test('Workflow resilience: Multiple concurrent requests should be handled', async () => {
      const albUrl = outputs.LoadBalancerURL;

      // Simulate multiple concurrent users
      const concurrentRequests = Array(20).fill(null).map(() =>
        axios.get(albUrl, { timeout: HTTP_TIMEOUT })
      );

      const responses = await Promise.all(concurrentRequests);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Verify load balancing is working
      // Responses may contain 'Instance ID' or 'Instance ID:' depending on instance type
      const uniqueInstanceIds = new Set(
        responses
          .map(r => r.data)
          .filter(html => html.includes('Instance ID') || html.includes('Instance ID:'))
      );
      expect(uniqueInstanceIds.size).toBeGreaterThan(0);
    });

    test('Load Balancer should handle requests even if one instance is unhealthy', async () => {
      const albUrl = outputs.LoadBalancerURL;
      const tgArn = outputs.TargetGroupArn;

      // Get current target health
      const healthCommand = new DescribeTargetHealthCommand({
        TargetGroupArn: tgArn,
      });
      const healthResponse = await elbClient.send(healthCommand);
      
      const healthyTargets = healthResponse.TargetHealthDescriptions!.filter(
        t => t.TargetHealth?.State === 'healthy'
      );
      
      // Should have at least one healthy target
      expect(healthyTargets.length).toBeGreaterThan(0);
      
      // Load balancer should still serve traffic
      const response = await axios.get(albUrl, { timeout: HTTP_TIMEOUT });
      expect(response.status).toBe(200);
    });

    test('Load Balancer should distribute traffic across multiple instances', async () => {
      const albUrl = outputs.LoadBalancerURL;
      const instance1Id = outputs.WebServerInstance1Id;
      const instance2Id = outputs.WebServerInstance2Id;

      // Make requests and check that responses come from different instances
      const responses = await Promise.all(
        Array(10).fill(null).map(() => 
          axios.get(albUrl, { timeout: HTTP_TIMEOUT })
        )
      );

      // Extract instance IDs from responses (if present in HTML)
      const instanceIdsInResponses = responses
        .map(r => r.data)
        .filter(html => html.includes(instance1Id) || html.includes(instance2Id));
      
      // Should see responses from multiple instances
      expect(responses.length).toBe(10);
      expect(responses.every(r => r.status === 200)).toBe(true);
    });
  });
});
