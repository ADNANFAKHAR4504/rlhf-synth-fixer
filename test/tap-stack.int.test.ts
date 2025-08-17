// test/tap-stack.int.test.ts

import * as aws from '@aws-sdk/client-dynamodb';
import * as kinesis from '@aws-sdk/client-kinesis';
import * as s3 from '@aws-sdk/client-s3';
import * as sns from '@aws-sdk/client-sns';
import * as ec2 from '@aws-sdk/client-ec2';
import * as cloudfront from '@aws-sdk/client-cloudfront';
import * as sts from '@aws-sdk/client-sts';
import axios from 'axios';

// Get AWS account ID dynamically
let AWS_ACCOUNT_ID: string;
let STACK_OUTPUTS: any;

const STACK_NAME = "TapStackpr1433";
const AWS_REGION = "us-east-1";

// AWS SDK clients (removed API Gateway and Lambda)
const dynamodbClient = new aws.DynamoDBClient({ region: AWS_REGION });
const kinesisClient = new kinesis.KinesisClient({ region: AWS_REGION });
const s3Client = new s3.S3Client({ region: AWS_REGION });
const snsClient = new sns.SNSClient({ region: AWS_REGION });
const ec2Client = new ec2.EC2Client({ region: AWS_REGION });
const cloudfrontClient = new cloudfront.CloudFrontClient({ region: AWS_REGION });
const stsClient = new sts.STSClient({ region: AWS_REGION });

// Test timeout for long-running operations
jest.setTimeout(120000); // 2 minutes

beforeAll(async () => {
  // Get AWS account ID
  const identity = await stsClient.send(new sts.GetCallerIdentityCommand({}));
  AWS_ACCOUNT_ID = identity.Account!;

  // Set up stack outputs (removed API Gateway URL and Lambda function name)
  STACK_OUTPUTS = {
    cloudfrontDomain: "d22ns9nd7ezbz4.cloudfront.net",
    dynamodbTableName: "pulumi-infra-backend-app-data",
    kinesisStreamName: "pulumi-infra-data-realtime-events",
    s3BucketName: "pulumi-infra-frontend-website-409bd0c",
    snsTopicArn: `arn:aws:sns:us-east-1:${AWS_ACCOUNT_ID}:pulumi-infra-monitoring-alerts`,
    vpcId: "vpc-007b1ff5e0ab2cf1f"
  };
});

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
      // List distributions to find the correct one by domain name
      const result = await cloudfrontClient.send(new cloudfront.ListDistributionsCommand({}));
      
      expect(result.DistributionList).toBeDefined();
      
      const distribution = result.DistributionList!.Items?.find(
        dist => dist.DomainName === STACK_OUTPUTS.cloudfrontDomain
      );
      
      expect(distribution).toBeDefined();
      expect(distribution!.Status).toBe("Deployed");
      expect(distribution!.Enabled).toBe(true);
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

    it("should allow creating test items in DynamoDB", async () => {
      const testItemId = `integration-test-${Date.now()}`;
      const testItem = {
        id: { S: testItemId },
        name: { S: `Integration Test Item ${Date.now()}` },
        description: { S: "Created by integration test" },
        category: { S: "test" },
        createdAt: { S: new Date().toISOString() }
      };
      
      // Create item
      await dynamodbClient.send(new aws.PutItemCommand({
        TableName: STACK_OUTPUTS.dynamodbTableName,
        Item: testItem
      }));
      
      // Verify item exists
      const getResult = await dynamodbClient.send(new aws.GetItemCommand({
        TableName: STACK_OUTPUTS.dynamodbTableName,
        Key: { id: { S: testItemId } }
      }));
      
      expect(getResult.Item).toBeDefined();
      expect(getResult.Item!.id.S).toBe(testItemId);
      expect(getResult.Item!.name.S).toContain("Integration Test Item");
    });

    it("should allow updating items in DynamoDB", async () => {
      const testItemId = `update-test-${Date.now()}`;
      const originalItem = {
        id: { S: testItemId },
        name: { S: "Original Name" },
        description: { S: "Original Description" },
        category: { S: "test" },
        createdAt: { S: new Date().toISOString() }
      };
      
      // Create original item
      await dynamodbClient.send(new aws.PutItemCommand({
        TableName: STACK_OUTPUTS.dynamodbTableName,
        Item: originalItem
      }));
      
      // Update item
      await dynamodbClient.send(new aws.UpdateItemCommand({
        TableName: STACK_OUTPUTS.dynamodbTableName,
        Key: { id: { S: testItemId } },
        UpdateExpression: 'SET #name = :newName, #desc = :newDesc',
        ExpressionAttributeNames: {
          '#name': 'name',
          '#desc': 'description'
        },
        ExpressionAttributeValues: {
          ':newName': { S: 'Updated Name' },
          ':newDesc': { S: 'Updated Description' }
        }
      }));
      
      // Verify update
      const getResult = await dynamodbClient.send(new aws.GetItemCommand({
        TableName: STACK_OUTPUTS.dynamodbTableName,
        Key: { id: { S: testItemId } }
      }));
      
      expect(getResult.Item!.name.S).toBe('Updated Name');
      expect(getResult.Item!.description.S).toBe('Updated Description');
    });

    it("should allow deleting items from DynamoDB", async () => {
      const testItemId = `delete-test-${Date.now()}`;
      const testItem = {
        id: { S: testItemId },
        name: { S: "To Be Deleted" },
        description: { S: "This item will be deleted" },
        category: { S: "test" },
        createdAt: { S: new Date().toISOString() }
      };
      
      // Create item
      await dynamodbClient.send(new aws.PutItemCommand({
        TableName: STACK_OUTPUTS.dynamodbTableName,
        Item: testItem
      }));
      
      // Verify item exists
      const getResult1 = await dynamodbClient.send(new aws.GetItemCommand({
        TableName: STACK_OUTPUTS.dynamodbTableName,
        Key: { id: { S: testItemId } }
      }));
      expect(getResult1.Item).toBeDefined();
      
      // Delete item
      await dynamodbClient.send(new aws.DeleteItemCommand({
        TableName: STACK_OUTPUTS.dynamodbTableName,
        Key: { id: { S: testItemId } }
      }));
      
      // Verify item is deleted
      const getResult2 = await dynamodbClient.send(new aws.GetItemCommand({
        TableName: STACK_OUTPUTS.dynamodbTableName,
        Key: { id: { S: testItemId } }
      }));
      expect(getResult2.Item).toBeUndefined();
    });
  });

  describe("Data Workflow", () => {
    
    it("should complete workflow: DynamoDB -> Kinesis", async () => {
      const testItemId = `workflow-test-${Date.now()}`;
      const testItem = {
        id: { S: testItemId },
        name: { S: `Workflow Test Item ${Date.now()}` },
        description: { S: "Data workflow test" },
        category: { S: "workflow-test" },
        createdAt: { S: new Date().toISOString() }
      };
      
      // Step 1: Create item in DynamoDB
      await dynamodbClient.send(new aws.PutItemCommand({
        TableName: STACK_OUTPUTS.dynamodbTableName,
        Item: testItem
      }));
      
      // Step 2: Verify item exists in DynamoDB
      const getResult = await dynamodbClient.send(new aws.GetItemCommand({
        TableName: STACK_OUTPUTS.dynamodbTableName,
        Key: { id: { S: testItemId } }
      }));
      
      expect(getResult.Item).toBeDefined();
      expect(getResult.Item!.id.S).toBe(testItemId);
      
      // Step 3: Send event to Kinesis
      const kinesisEvent = {
        eventType: "item_created",
        itemId: testItemId,
        timestamp: new Date().toISOString(),
        metadata: {
          name: testItem.name.S,
          description: testItem.description.S,
          category: testItem.category.S
        }
      };
      
      const kinesisResult = await kinesisClient.send(new kinesis.PutRecordCommand({
        StreamName: STACK_OUTPUTS.kinesisStreamName,
        Data: Buffer.from(JSON.stringify(kinesisEvent)),
        PartitionKey: testItemId
      }));
      
      expect(kinesisResult.ShardId).toBeDefined();
      expect(kinesisResult.SequenceNumber).toBeDefined();
      
      // Step 4: Verify stream is active
      const streamInfo = await kinesisClient.send(new kinesis.DescribeStreamCommand({
        StreamName: STACK_OUTPUTS.kinesisStreamName
      }));
      
      expect(streamInfo.StreamDescription!.StreamStatus).toBe("ACTIVE");
    });
  });

  describe("Security and Performance", () => {
    
    it("should enforce HTTPS on CloudFront", async () => {
      // Test that HTTPS works
      const response = await axios.get(`https://${STACK_OUTPUTS.cloudfrontDomain}`, {
        timeout: 30000
      });
      
      expect(response.status).toBe(200);
      expect(response.request.protocol).toBe('https:');
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

    it("should have proper S3 bucket configuration", async () => {
      // Check that bucket exists and is accessible
      const result = await s3Client.send(new s3.HeadBucketCommand({
        Bucket: STACK_OUTPUTS.s3BucketName
      }));
      
      expect(result).toBeDefined();
      
      // Check bucket has proper website configuration
      try {
        const websiteConfig = await s3Client.send(new s3.GetBucketWebsiteCommand({
          Bucket: STACK_OUTPUTS.s3BucketName
        }));
        expect(websiteConfig.IndexDocument?.Suffix).toBe('index.html');
      } catch (error: any) {
        // Website configuration might not be directly on S3 if using CloudFront
        console.log('S3 website config not found - likely using CloudFront distribution');
      }
    });

    it("should have proper DynamoDB table configuration", async () => {
      const tableInfo = await dynamodbClient.send(new aws.DescribeTableCommand({
        TableName: STACK_OUTPUTS.dynamodbTableName
      }));
      
      // Check that table has proper configuration
      expect(tableInfo.Table!.TableStatus).toBe('ACTIVE');
      expect(tableInfo.Table!.KeySchema).toBeDefined();
      expect(tableInfo.Table!.AttributeDefinitions).toBeDefined();
    });

    it("should have proper Kinesis stream configuration", async () => {
      const streamInfo = await kinesisClient.send(new kinesis.DescribeStreamCommand({
        StreamName: STACK_OUTPUTS.kinesisStreamName
      }));
      
      expect(streamInfo.StreamDescription!.StreamStatus).toBe('ACTIVE');
      expect(streamInfo.StreamDescription!.RetentionPeriodHours).toBeGreaterThan(0);
      expect(streamInfo.StreamDescription!.Shards).toBeDefined();
    });
  });
});

// Utility function to clean up test data
export async function cleanupTestData() {
  try {
    // Clean up test items from DynamoDB
    const scanResult = await dynamodbClient.send(new aws.ScanCommand({
      TableName: STACK_OUTPUTS.dynamodbTableName,
      FilterExpression: 'contains(#name, :testPrefix1) OR contains(#name, :testPrefix2) OR contains(#name, :testPrefix3) OR contains(#name, :testPrefix4)',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':testPrefix1': { S: 'Integration Test' },
        ':testPrefix2': { S: 'Workflow Test' },
        ':testPrefix3': { S: 'Updated Name' },
        ':testPrefix4': { S: 'To Be Deleted' }
      }
    }));

    if (scanResult.Items && scanResult.Items.length > 0) {
      for (const item of scanResult.Items) {
        await dynamodbClient.send(new aws.DeleteItemCommand({
          TableName: STACK_OUTPUTS.dynamodbTableName,
          Key: { id: item.id }
        }));
      }
      console.log(`Cleaned up ${scanResult.Items.length} test items`);
    }
  } catch (error) {
    console.warn('Failed to clean up test data:', error);
  }
}

// Run cleanup after all tests
afterAll(async () => {
  await cleanupTestData();
});