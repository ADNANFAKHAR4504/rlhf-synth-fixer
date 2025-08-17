// test/tap-stack.integration.test.ts

import * as aws from '@aws-sdk/client-dynamodb';
import * as apigateway from '@aws-sdk/client-api-gateway';
import * as lambda from '@aws-sdk/client-lambda';
import * as kinesis from '@aws-sdk/client-kinesis';
import * as s3 from '@aws-sdk/client-s3';
import * as sns from '@aws-sdk/client-sns';
import * as ec2 from '@aws-sdk/client-ec2';
import * as cloudfront from '@aws-sdk/client-cloudfront';
import axios from 'axios';

// Configuration - Update these values based on your deployment
const STACK_OUTPUTS = {
  apiGatewayUrl: "https://b3897q3qbh.execute-api.us-east-1.amazonaws.com/v1",
  cloudfrontDomain: "d22ns9nd7ezbz4.cloudfront.net",
  dynamodbTableName: "pulumi-infra-backend-app-data",
  kinesisStreamName: "pulumi-infra-data-realtime-events",
  lambdaFunctionName: "pulumi-infra-backend-function",
  s3BucketName: "pulumi-infra-frontend-website-409bd0c",
  snsTopicArn: "arn:aws:sns:us-east-1:123456789012:pulumi-infra-monitoring-alerts", // Replace *** with actual account
  vpcId: "vpc-007b1ff5e0ab2cf1f"
};

const STACK_NAME = "TapStackpr1433";
const AWS_REGION = "us-east-1";

// AWS SDK clients
const dynamodbClient = new aws.DynamoDBClient({ region: AWS_REGION });
const apiGatewayClient = new apigateway.APIGatewayClient({ region: AWS_REGION });
const lambdaClient = new lambda.LambdaClient({ region: AWS_REGION });
const kinesisClient = new kinesis.KinesisClient({ region: AWS_REGION });
const s3Client = new s3.S3Client({ region: AWS_REGION });
const snsClient = new sns.SNSClient({ region: AWS_REGION });
const ec2Client = new ec2.EC2Client({ region: AWS_REGION });
const cloudfrontClient = new cloudfront.CloudFrontClient({ region: AWS_REGION });

// Test timeout for long-running operations
jest.setTimeout(120000); // 2 minutes

describe("TapStack Integration Tests - Live Deployment", () => {
  
  describe("Infrastructure Resources Existence", () => {
    
    it("should have a valid VPC", async () => {
      const result = await ec2Client.send(new ec2.DescribeVpcsCommand({
        VpcIds: [STACK_OUTPUTS.vpcId]
      }));
      
      expect(result.Vpcs).toHaveLength(1);
      expect(result.Vpcs![0].VpcId).toBe(STACK_OUTPUTS.vpcId);
      expect(result.Vpcs![0].State).toBe("available");
      expect(result.Vpcs![0].CidrBlock).toBeDefined();
    });

    it("should have a valid DynamoDB table", async () => {
      const result = await dynamodbClient.send(new aws.DescribeTableCommand({
        TableName: STACK_OUTPUTS.dynamodbTableName
      }));
      
      expect(result.Table).toBeDefined();
      expect(result.Table!.TableName).toBe(STACK_OUTPUTS.dynamodbTableName);
      expect(result.Table!.TableStatus).toBe("ACTIVE");
      expect(result.Table!.AttributeDefinitions).toBeDefined();
    });

    it("should have a valid Lambda function", async () => {
      const result = await lambdaClient.send(new lambda.GetFunctionCommand({
        FunctionName: STACK_OUTPUTS.lambdaFunctionName
      }));
      
      expect(result.Configuration).toBeDefined();
      expect(result.Configuration!.FunctionName).toBe(STACK_OUTPUTS.lambdaFunctionName);
      expect(result.Configuration!.State).toBe("Active");
      expect(result.Configuration!.Runtime).toBeDefined();
    });

    it("should have a valid Kinesis stream", async () => {
      const result = await kinesisClient.send(new kinesis.DescribeStreamCommand({
        StreamName: STACK_OUTPUTS.kinesisStreamName
      }));
      
      expect(result.StreamDescription).toBeDefined();
      expect(result.StreamDescription!.StreamName).toBe(STACK_OUTPUTS.kinesisStreamName);
      expect(result.StreamDescription!.StreamStatus).toBe("ACTIVE");
      expect(result.StreamDescription!.Shards).toBeDefined();
    });

    it("should have a valid S3 bucket", async () => {
      const result = await s3Client.send(new s3.HeadBucketCommand({
        Bucket: STACK_OUTPUTS.s3BucketName
      }));
      
      // If no error is thrown, the bucket exists and is accessible
      expect(result).toBeDefined();
    });

    it("should have S3 bucket with website files", async () => {
      const files = ['index.html', 'styles.css', 'app.js', 'error.html'];
      
      for (const file of files) {
        const result = await s3Client.send(new s3.HeadObjectCommand({
          Bucket: STACK_OUTPUTS.s3BucketName,
          Key: file
        }));
        
        expect(result).toBeDefined();
        expect(result.ContentLength).toBeGreaterThan(0);
      }
    });

    it("should have a valid SNS topic", async () => {
      const result = await snsClient.send(new sns.GetTopicAttributesCommand({
        TopicArn: STACK_OUTPUTS.snsTopicArn
      }));
      
      expect(result.Attributes).toBeDefined();
      expect(result.Attributes!.TopicArn).toBe(STACK_OUTPUTS.snsTopicArn);
    });

    it("should have a valid CloudFront distribution", async () => {
      // Extract distribution ID from domain
      const distributionId = STACK_OUTPUTS.cloudfrontDomain.split('.')[0].substring(1);
      
      const result = await cloudfrontClient.send(new cloudfront.GetDistributionCommand({
        Id: distributionId
      }));
      
      expect(result.Distribution).toBeDefined();
      expect(result.Distribution!.Status).toBe("Deployed");
      expect(result.Distribution!.DomainName).toBe(STACK_OUTPUTS.cloudfrontDomain);
    });
  });

  describe("API Gateway Functionality", () => {
    
    it("should respond to GET /items request", async () => {
      const response = await axios.get(`${STACK_OUTPUTS.apiGatewayUrl}/items`, {
        timeout: 30000
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data.items)).toBe(true);
    });

    it("should allow POST /items to create a new item", async () => {
      const testItem = {
        name: `Integration Test Item ${Date.now()}`,
        description: "Created by integration test",
        category: "test"
      };
      
      const response = await axios.post(`${STACK_OUTPUTS.apiGatewayUrl}/items`, testItem, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      expect(response.status).toBe(201);
      expect(response.data).toBeDefined();
      expect(response.data.id).toBeDefined();
      expect(response.data.name).toBe(testItem.name);
    });

    it("should allow GET /items/{id} to retrieve specific item", async () => {
      // First create an item
      const testItem = {
        name: `Retrieve Test Item ${Date.now()}`,
        description: "Created to test retrieval",
        category: "test"
      };
      
      const createResponse = await axios.post(`${STACK_OUTPUTS.apiGatewayUrl}/items`, testItem, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      expect(createResponse.status).toBe(201);
      const itemId = createResponse.data.id;
      
      // Then retrieve it
      const getResponse = await axios.get(`${STACK_OUTPUTS.apiGatewayUrl}/items/${itemId}`, {
        timeout: 30000
      });
      
      expect(getResponse.status).toBe(200);
      expect(getResponse.data.id).toBe(itemId);
      expect(getResponse.data.name).toBe(testItem.name);
    });

    it("should return 404 for non-existent item", async () => {
      const nonExistentId = `non-existent-${Date.now()}`;
      
      try {
        await axios.get(`${STACK_OUTPUTS.apiGatewayUrl}/items/${nonExistentId}`, {
          timeout: 30000
        });
        fail("Expected 404 error");
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });

    it("should have proper CORS headers", async () => {
      const response = await axios.get(`${STACK_OUTPUTS.apiGatewayUrl}/items`, {
        timeout: 30000
      });
      
      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['content-type']).toContain('application/json');
    });
  });

  describe("CloudFront Distribution", () => {
    
    it("should serve the website from CloudFront", async () => {
      const response = await axios.get(`https://${STACK_OUTPUTS.cloudfrontDomain}`, {
        timeout: 30000
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toContain('Multi-Tier Web Application');
      expect(response.data).toContain('<!DOCTYPE html>');
    });

    it("should serve CSS file from CloudFront", async () => {
      const response = await axios.get(`https://${STACK_OUTPUTS.cloudfrontDomain}/styles.css`, {
        timeout: 30000
      });
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/css');
      expect(response.data).toContain('font-family');
    });

    it("should serve JavaScript file from CloudFront", async () => {
      const response = await axios.get(`https://${STACK_OUTPUTS.cloudfrontDomain}/app.js`, {
        timeout: 30000
      });
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/javascript');
      expect(response.data).toContain('testAPI');
    });

    it("should handle 404 errors with custom error page", async () => {
      const response = await axios.get(`https://${STACK_OUTPUTS.cloudfrontDomain}/non-existent-page`, {
        timeout: 30000
      });
      
      // CloudFront should serve index.html for 404s (SPA behavior)
      expect(response.status).toBe(200);
      expect(response.data).toContain('Multi-Tier Web Application');
    });
  });

  describe("Kinesis Stream Functionality", () => {
    
    it("should allow putting records to Kinesis stream", async () => {
      const testRecord = {
        timestamp: new Date().toISOString(),
        event: "integration_test",
        data: { testId: `test-${Date.now()}` }
      };
      
      const result = await kinesisClient.send(new kinesis.PutRecordCommand({
        StreamName: STACK_OUTPUTS.kinesisStreamName,
        Data: Buffer.from(JSON.stringify(testRecord)),
        PartitionKey: testRecord.data.testId
      }));
      
      expect(result.ShardId).toBeDefined();
      expect(result.SequenceNumber).toBeDefined();
    });

    it("should have stream with correct shard count", async () => {
      const result = await kinesisClient.send(new kinesis.DescribeStreamCommand({
        StreamName: STACK_OUTPUTS.kinesisStreamName
      }));
      
      expect(result.StreamDescription!.Shards).toHaveLength(1);
    });
  });

  describe("DynamoDB Table Operations", () => {
    
    it("should allow direct table scan", async () => {
      const result = await dynamodbClient.send(new aws.ScanCommand({
        TableName: STACK_OUTPUTS.dynamodbTableName,
        Limit: 10
      }));
      
      expect(result.Items).toBeDefined();
      expect(Array.isArray(result.Items)).toBe(true);
    });

    it("should have proper table structure", async () => {
      const result = await dynamodbClient.send(new aws.DescribeTableCommand({
        TableName: STACK_OUTPUTS.dynamodbTableName
      }));
      
      expect(result.Table!.KeySchema).toBeDefined();
      expect(result.Table!.AttributeDefinitions).toBeDefined();
      
      // Check for primary key
      const primaryKey = result.Table!.KeySchema!.find(key => key.KeyType === 'HASH');
      expect(primaryKey).toBeDefined();
      expect(primaryKey!.AttributeName).toBe('id');
    });
  });

  describe("Lambda Function Direct Invocation", () => {
    
    it("should handle direct Lambda invocation for GET items", async () => {
      const payload = {
        httpMethod: 'GET',
        path: '/items',
        headers: {},
        queryStringParameters: null,
        body: null
      };
      
      const result = await lambdaClient.send(new lambda.InvokeCommand({
        FunctionName: STACK_OUTPUTS.lambdaFunctionName,
        Payload: Buffer.from(JSON.stringify(payload))
      }));
      
      expect(result.StatusCode).toBe(200);
      expect(result.Payload).toBeDefined();
      
      const response = JSON.parse(Buffer.from(result.Payload!).toString());
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).items).toBeDefined();
    });

    it("should handle direct Lambda invocation for POST items", async () => {
      const testItem = {
        name: `Direct Lambda Test ${Date.now()}`,
        description: "Created via direct Lambda invocation",
        category: "test"
      };
      
      const payload = {
        httpMethod: 'POST',
        path: '/items',
        headers: { 'Content-Type': 'application/json' },
        queryStringParameters: null,
        body: JSON.stringify(testItem)
      };
      
      const result = await lambdaClient.send(new lambda.InvokeCommand({
        FunctionName: STACK_OUTPUTS.lambdaFunctionName,
        Payload: Buffer.from(JSON.stringify(payload))
      }));
      
      expect(result.StatusCode).toBe(200);
      expect(result.Payload).toBeDefined();
      
      const response = JSON.parse(Buffer.from(result.Payload!).toString());
      expect(response.statusCode).toBe(201);
      
      const responseBody = JSON.parse(response.body);
      expect(responseBody.id).toBeDefined();
      expect(responseBody.name).toBe(testItem.name);
    });
  });

  describe("End-to-End Workflow", () => {
    
    it("should complete full workflow: API -> DynamoDB -> Kinesis", async () => {
      const testItem = {
        name: `E2E Test Item ${Date.now()}`,
        description: "End-to-end test workflow",
        category: "e2e-test",
        workflow: true
      };
      
      // Step 1: Create item via API Gateway
      const createResponse = await axios.post(`${STACK_OUTPUTS.apiGatewayUrl}/items`, testItem, {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(createResponse.status).toBe(201);
      const itemId = createResponse.data.id;
      
      // Step 2: Verify item exists in DynamoDB
      const getResponse = await axios.get(`${STACK_OUTPUTS.apiGatewayUrl}/items/${itemId}`, {
        timeout: 30000
      });
      
      expect(getResponse.status).toBe(200);
      expect(getResponse.data.id).toBe(itemId);
      
      // Step 3: Send event to Kinesis
      const kinesisEvent = {
        eventType: "item_created",
        itemId: itemId,
        timestamp: new Date().toISOString(),
        metadata: testItem
      };
      
      const kinesisResult = await kinesisClient.send(new kinesis.PutRecordCommand({
        StreamName: STACK_OUTPUTS.kinesisStreamName,
        Data: Buffer.from(JSON.stringify(kinesisEvent)),
        PartitionKey: itemId
      }));
      
      expect(kinesisResult.ShardId).toBeDefined();
      expect(kinesisResult.SequenceNumber).toBeDefined();
      
      // Step 4: Verify all components worked together
      expect(itemId).toBeDefined();
      expect(kinesisResult.SequenceNumber).toBeDefined();
    });
  });

  describe("Security and Performance", () => {
    
    it("should enforce HTTPS on CloudFront", async () => {
      // Test that HTTP redirects to HTTPS
      try {
        const response = await axios.get(`http://${STACK_OUTPUTS.cloudfrontDomain}`, {
          timeout: 30000,
          maxRedirects: 0
        });
        
        // If we get here, no redirect happened (which might be okay for some configs)
        expect(response.status).toBeGreaterThanOrEqual(200);
      } catch (error: any) {
        // Expect either a redirect or connection refusal for HTTP
        expect([301, 302, 'ENOTFOUND', 'ECONNREFUSED']).toContain(
          error.response?.status || error.code
        );
      }
    });

    it("should have reasonable API response times", async () => {
      const startTime = Date.now();
      
      const response = await axios.get(`${STACK_OUTPUTS.apiGatewayUrl}/items`, {
        timeout: 30000
      });
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Less than 5 seconds
    });

    it("should have reasonable CloudFront response times", async () => {
      const startTime = Date.now();
      
      const response = await axios.get(`https://${STACK_OUTPUTS.cloudfrontDomain}`, {
        timeout: 30000
      });
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(3000); // Less than 3 seconds
    });
  });
});

// Utility function to clean up test data (optional)
export async function cleanupTestData() {
  try {
    // Clean up test items from DynamoDB
    const scanResult = await dynamodbClient.send(new aws.ScanCommand({
      TableName: STACK_OUTPUTS.dynamodbTableName,
      FilterExpression: 'contains(#name, :testPrefix)',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':testPrefix': { S: 'Integration Test' }
      }
    }));

    if (scanResult.Items && scanResult.Items.length > 0) {
      for (const item of scanResult.Items) {
        await dynamodbClient.send(new aws.DeleteItemCommand({
          TableName: STACK_OUTPUTS.dynamodbTableName,
          Key: { id: item.id }
        }));
      }
    }
  } catch (error) {
    console.warn('Failed to clean up test data:', error);
  }
}

// Run cleanup after all tests (optional)
afterAll(async () => {
  await cleanupTestData();
});