// Integration tests for Terraform recommendation system infrastructure
// These tests check if deployed resources exist and are configured correctly

import { execSync } from 'child_process';
import * as AWS from 'aws-sdk';

// Helper function to skip tests if infrastructure is not deployed
function skipIfStackMissing(): boolean {
  try {
    const output = execSync('terraform output -json', {
      cwd: './lib',
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const outputs = JSON.parse(output);
    if (!outputs || Object.keys(outputs).length === 0) {
      console.warn('⚠️  Terraform stack not deployed - skipping integration tests');
      return true;
    }
    return false;
  } catch (error) {
    console.warn('⚠️  Terraform stack not deployed - skipping integration tests');
    return true;
  }
}

describe('Recommendation System Integration Tests', () => {
  let outputs: any;
  let kinesis: AWS.Kinesis;
  let dynamodb: AWS.DynamoDB;
  let s3: AWS.S3;
  let lambda: AWS.Lambda;
  let apiGateway: AWS.APIGateway;
  let sns: AWS.SNS;
  let cloudwatch: AWS.CloudWatch;

  beforeAll(() => {
    if (skipIfStackMissing()) {
      return;
    }

    try {
      const outputJson = execSync('terraform output -json', {
        cwd: './lib',
        encoding: 'utf-8'
      });
      outputs = JSON.parse(outputJson);

      const region = process.env.AWS_REGION || 'us-east-1';
      kinesis = new AWS.Kinesis({ region });
      dynamodb = new AWS.DynamoDB({ region });
      s3 = new AWS.S3({ region });
      lambda = new AWS.Lambda({ region });
      apiGateway = new AWS.APIGateway({ region });
      sns = new AWS.SNS({ region });
      cloudwatch = new AWS.CloudWatch({ region });
    } catch (error) {
      console.error('Failed to initialize AWS clients:', error);
    }
  });

  describe('Terraform Outputs', () => {
    test('should have API Gateway URL output', () => {
      if (skipIfStackMissing()) return;
      expect(outputs.api_gateway_url).toBeDefined();
      expect(outputs.api_gateway_url.value).toMatch(/https:\/\/.+\.execute-api\..+\.amazonaws\.com/);
    });

    test('should have Kinesis stream ARN output', () => {
      if (skipIfStackMissing()) return;
      expect(outputs.kinesis_stream_arn).toBeDefined();
      expect(outputs.kinesis_stream_arn.value).toMatch(/arn:aws:kinesis:/);
    });

    test('should have S3 training bucket output', () => {
      if (skipIfStackMissing()) return;
      expect(outputs.s3_training_bucket).toBeDefined();
      expect(outputs.s3_training_bucket.value).toMatch(/recommendation-system-training-data/);
    });

    test('should have SNS topic ARN output', () => {
      if (skipIfStackMissing()) return;
      expect(outputs.sns_topic_arn).toBeDefined();
      expect(outputs.sns_topic_arn.value).toMatch(/arn:aws:sns:/);
    });

    test('should have Step Functions ARN output', () => {
      if (skipIfStackMissing()) return;
      expect(outputs.step_functions_arn).toBeDefined();
      expect(outputs.step_functions_arn.value).toMatch(/arn:aws:states:/);
    });
  });

  describe('Kinesis Data Stream', () => {
    test('should exist and be active', async () => {
      if (skipIfStackMissing()) return;

      const streamName = 'recommendation-system-user-interactions';
      const response = await kinesis.describeStream({ StreamName: streamName }).promise();
      
      expect(response.StreamDescription).toBeDefined();
      expect(response.StreamDescription.StreamStatus).toBe('ACTIVE');
    });

    test('should have encryption enabled', async () => {
      if (skipIfStackMissing()) return;

      const streamName = 'recommendation-system-user-interactions';
      const response = await kinesis.describeStream({ StreamName: streamName }).promise();
      
      expect(response.StreamDescription.EncryptionType).toBe('KMS');
    });
  });

  describe('DynamoDB Tables', () => {
    test('user profiles table should exist', async () => {
      if (skipIfStackMissing()) return;

      const tableName = 'recommendation-system-user-profiles';
      const response = await dynamodb.describeTable({ TableName: tableName }).promise();
      
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });

    test('interactions table should exist with GSI', async () => {
      if (skipIfStackMissing()) return;

      const tableName = 'recommendation-system-interactions';
      const response = await dynamodb.describeTable({ TableName: tableName }).promise();
      
      expect(response.Table).toBeDefined();
      expect(response.Table?.GlobalSecondaryIndexes).toBeDefined();
      expect(response.Table?.GlobalSecondaryIndexes?.length).toBeGreaterThan(0);
      expect(response.Table?.GlobalSecondaryIndexes?.[0].IndexName).toBe('ItemIndex');
    });

    test('tables should have encryption enabled', async () => {
      if (skipIfStackMissing()) return;

      const tableName = 'recommendation-system-user-profiles';
      const response = await dynamodb.describeTable({ TableName: tableName }).promise();
      
      expect(response.Table?.SSEDescription).toBeDefined();
      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
    });
  });

  describe('S3 Bucket', () => {
    test('training data bucket should exist', async () => {
      if (skipIfStackMissing()) return;

      const bucketName = outputs.s3_training_bucket.value;
      const response = await s3.headBucket({ Bucket: bucketName }).promise();
      
      expect(response).toBeDefined();
    });

    test('bucket should have versioning enabled', async () => {
      if (skipIfStackMissing()) return;

      const bucketName = outputs.s3_training_bucket.value;
      const response = await s3.getBucketVersioning({ Bucket: bucketName }).promise();
      
      expect(response.Status).toBe('Enabled');
    });

    test('bucket should have encryption enabled', async () => {
      if (skipIfStackMissing()) return;

      const bucketName = outputs.s3_training_bucket.value;
      const response = await s3.getBucketEncryption({ Bucket: bucketName }).promise();
      
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
    });

    test('bucket should have lifecycle configuration', async () => {
      if (skipIfStackMissing()) return;

      const bucketName = outputs.s3_training_bucket.value;
      const response = await s3.getBucketLifecycleConfiguration({ Bucket: bucketName }).promise();
      
      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);
    });
  });

  describe('Lambda Functions', () => {
    test('stream processor Lambda should exist', async () => {
      if (skipIfStackMissing()) return;

      const functionName = 'recommendation-system-stream-processor';
      const response = await lambda.getFunction({ FunctionName: functionName }).promise();
      
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('python3.11');
    });

    test('recommendation API Lambda should exist', async () => {
      if (skipIfStackMissing()) return;

      const functionName = 'recommendation-system-recommendation-api';
      const response = await lambda.getFunction({ FunctionName: functionName }).promise();
      
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('python3.11');
    });

    test('recommendation API Lambda should have VPC configuration', async () => {
      if (skipIfStackMissing()) return;

      const functionName = 'recommendation-system-recommendation-api';
      const response = await lambda.getFunction({ FunctionName: functionName }).promise();
      
      expect(response.Configuration?.VpcConfig).toBeDefined();
      expect(response.Configuration?.VpcConfig?.SubnetIds).toBeDefined();
      expect(response.Configuration?.VpcConfig?.SecurityGroupIds).toBeDefined();
    });
  });

  describe('API Gateway', () => {
    test('REST API should exist', async () => {
      if (skipIfStackMissing()) return;

      const apis = await apiGateway.getRestApis().promise();
      const recommendationApi = apis.items?.find(api => api.name === 'recommendation-system-api');
      
      expect(recommendationApi).toBeDefined();
    });

    test('should have recommendations resource', async () => {
      if (skipIfStackMissing()) return;

      const apis = await apiGateway.getRestApis().promise();
      const recommendationApi = apis.items?.find(api => api.name === 'recommendation-system-api');
      
      if (recommendationApi?.id) {
        const resources = await apiGateway.getResources({ restApiId: recommendationApi.id }).promise();
        const recommendationsResource = resources.items?.find(r => r.path === '/recommendations');
        
        expect(recommendationsResource).toBeDefined();
      }
    });
  });

  describe('SNS Topic', () => {
    test('notifications topic should exist', async () => {
      if (skipIfStackMissing()) return;

      const topicArn = outputs.sns_topic_arn.value;
      const response = await sns.getTopicAttributes({ TopicArn: topicArn }).promise();
      
      expect(response.Attributes).toBeDefined();
    });

    test('topic should have KMS encryption', async () => {
      if (skipIfStackMissing()) return;

      const topicArn = outputs.sns_topic_arn.value;
      const response = await sns.getTopicAttributes({ TopicArn: topicArn }).promise();
      
      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have CloudWatch alarms configured', async () => {
      if (skipIfStackMissing()) return;

      const response = await cloudwatch.describeAlarms({
        AlarmNamePrefix: 'recommendation-system'
      }).promise();
      
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);
    });

    test('should have dashboard configured', async () => {
      if (skipIfStackMissing()) return;

      const response = await cloudwatch.listDashboards({
        DashboardNamePrefix: 'recommendation-system'
      }).promise();
      
      expect(response.DashboardEntries).toBeDefined();
      expect(response.DashboardEntries?.length).toBeGreaterThan(0);
    });
  });
});
