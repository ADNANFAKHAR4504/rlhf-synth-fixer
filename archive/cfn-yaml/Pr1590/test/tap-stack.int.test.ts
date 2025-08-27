// Live Integration Tests for TapStack CloudFormation Template
// These tests interact with actual AWS resources deployed by TapStack.yml

import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand
} from '@aws-sdk/client-cloudtrail';
import {
  DeleteItemCommand,
  DescribeTableCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand
} from '@aws-sdk/client-dynamodb';
import {
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  GetRoleCommand,
  IAMClient
} from '@aws-sdk/client-iam';
import {
  KMSClient
} from '@aws-sdk/client-kms';
import {
  DescribeDBInstancesCommand,
  RDSClient
} from '@aws-sdk/client-rds';
import {
  DeleteObjectCommand,
  GetBucketEncryptionCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import {
  GetCallerIdentityCommand,
  STSClient
} from '@aws-sdk/client-sts';
import fs from 'fs';
import path from 'path';

// Get environment suffix from environment variable
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = 'us-east-1'; // From PROMPT.md requirements

// AWS clients
const dynamoClient = new DynamoDBClient({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const ec2Client = new EC2Client({ region });
const kmsClient = new KMSClient({ region });
const cloudTrailClient = new CloudTrailClient({ region });
const iamClient = new IAMClient({ region });
const stsClient = new STSClient({ region });

// Helper function to load TapStack CloudFormation outputs
function loadTapStackOutputs() {
  const allOutputsPath = path.join(__dirname, '../cfn-outputs/all-outputs.json');
  if (fs.existsSync(allOutputsPath)) {
    return JSON.parse(fs.readFileSync(allOutputsPath, 'utf8'));
  }
  return {};
}

// Resource names based on TapStack.yml template
// Get AWS Account ID dynamically
let awsAccountId: string;

const getAwsAccountId = async (): Promise<string> => {
  if (!awsAccountId) {
    const response = await stsClient.send(new GetCallerIdentityCommand({}));
    awsAccountId = response.Account!;
  }
  return awsAccountId;
};

const getResourceNames = (stackOutputs: any) => {
  // Extract the first (and likely only) stack from outputs
  const stackName = Object.keys(stackOutputs)[0];
  const outputs = stackOutputs[stackName] || [];
  
  // Helper function to find output value by key
  const getOutputValue = (key: string) => {
    const output = outputs.find((o: any) => o.OutputKey === key);
    return output?.OutputValue || '';
  };
  
  // Extract actual resource names from CloudFormation outputs
  const dynamoTableName = getOutputValue('TurnAroundPromptTableName');
  const rdsEndpoint = getOutputValue('RDSEndpoint');
  const rdsInstanceId = rdsEndpoint.split('.')[0]; // Extract instance ID from endpoint
  const appDataBucket = getOutputValue('ApplicationDataBucket');
  const vpcId = getOutputValue('VPCId');
  const kmsKeyId = getOutputValue('KMSKeyId');
  const cloudTrailArn = getOutputValue('CloudTrailArn');
  const cloudTrailName = cloudTrailArn.split('/')[1]; // Extract trail name from ARN
  const applicationRoleArn = getOutputValue('ApplicationRoleArn');
  const iamRoleName = applicationRoleArn.split('/')[1]; // Extract role name from ARN
  const environmentSuffixFromOutputs = getOutputValue('EnvironmentSuffix');
  
  // Extract bucket names directly from outputs where available
  // For buckets not in outputs, we'll construct them based on the pattern
  const appDataBucketPrefix = appDataBucket.replace(`-${environmentSuffixFromOutputs}`, '').replace(/app-data-/, '');
  
  return {
    dynamoTableName,
    rdsInstanceId,
    cloudTrailBucket: `cloudtrail-logs-${appDataBucketPrefix}-${environmentSuffixFromOutputs}`,
    accessLogsBucket: `access-logs-${appDataBucketPrefix}-${environmentSuffixFromOutputs}`,
    appDataBucket,
    vpcId,
    vpcName: `secure-vpc-${environmentSuffixFromOutputs}`,
    kmsAlias: `alias/rds-${environmentSuffixFromOutputs}-key`,
    kmsKeyId,
    cloudTrailName,
    iamRoleName,
    environmentSuffix: environmentSuffixFromOutputs
  };
};



describe('TapStack Live Infrastructure Integration Tests', () => {
  let stackOutputs: any;
  let resourceNames: ReturnType<typeof getResourceNames>;

  beforeAll(async () => {
    stackOutputs = loadTapStackOutputs();
    resourceNames = getResourceNames(stackOutputs);
    
    console.log(`Testing infrastructure with environment suffix: ${resourceNames.environmentSuffix}`);
    console.log(`Resource names loaded from CloudFormation outputs:`);
    console.log(JSON.stringify(resourceNames, null, 2));
  }, 30000);

  describe('DynamoDB Table Tests', () => {
    test('should verify DynamoDB table exists and is accessible', async () => {
      const command = new DescribeTableCommand({
        TableName: resourceNames.dynamoTableName
      });

      const response = await dynamoClient.send(command);
      
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(resourceNames.dynamoTableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(response.Table?.DeletionProtectionEnabled).toBe(false);
    }, 30000);

    test('should perform CRUD operations on DynamoDB table', async () => {
      const testId = `test-${Date.now()}`;
      const testData = {
        id: { S: testId },
        prompt: { S: 'Test integration prompt' },
        response: { S: 'Test integration response' },
        timestamp: { S: new Date().toISOString() }
      };

      // PUT operation
      await dynamoClient.send(new PutItemCommand({
        TableName: resourceNames.dynamoTableName,
        Item: testData
      }));

      // GET operation
      const getResponse = await dynamoClient.send(new GetItemCommand({
        TableName: resourceNames.dynamoTableName,
        Key: { id: { S: testId } }
      }));

      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item?.id.S).toBe(testId);
      expect(getResponse.Item?.prompt.S).toBe('Test integration prompt');

      // CLEANUP - DELETE operation
      await dynamoClient.send(new DeleteItemCommand({
        TableName: resourceNames.dynamoTableName,
        Key: { id: { S: testId } }
      }));
    }, 30000);
  });

  describe('RDS Database Tests', () => {
    test('should verify RDS instance exists and is available', async () => {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: resourceNames.rdsInstanceId
      });

      const response = await rdsClient.send(command);
      
      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances?.[0]).toBeDefined();
      
      const dbInstance = response.DBInstances?.[0];
      expect(dbInstance?.DBInstanceIdentifier).toBe(resourceNames.rdsInstanceId);
      expect(dbInstance?.DBInstanceStatus).toBe('available');
      expect(dbInstance?.Engine).toBe('mysql');
      expect(dbInstance?.EngineVersion).toBe('8.0.42');
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.PubliclyAccessible).toBe(false);
      expect(dbInstance?.DeletionProtection).toBe(false); // DeletionProtection removed from template
    }, 60000);
  });

  describe('S3 Buckets Tests', () => {
    test('should verify all S3 buckets exist and are accessible', async () => {
      const buckets = [
        resourceNames.cloudTrailBucket,
        resourceNames.accessLogsBucket,
        resourceNames.appDataBucket
      ];

      for (const bucketName of buckets) {
        const command = new HeadBucketCommand({ Bucket: bucketName });
        
        // Should not throw an error if bucket exists and is accessible
        await expect(s3Client.send(command)).resolves.not.toThrow();
      }
    }, 30000);

    test('should verify S3 bucket encryption configuration', async () => {
      const buckets = [
        resourceNames.cloudTrailBucket,
        resourceNames.accessLogsBucket,
        resourceNames.appDataBucket
      ];

      for (const bucketName of buckets) {
        const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
        
        const response = await s3Client.send(command);
        expect(response.ServerSideEncryptionConfiguration).toBeDefined();
        
        const rules = response.ServerSideEncryptionConfiguration?.Rules;
        expect(rules).toBeDefined();
        expect(rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
      }
    }, 30000);

    test('should perform file operations on application data bucket', async () => {
      const testKey = `integration-test-${Date.now()}.txt`;
      const testContent = 'Integration test file content';

      // PUT operation
      await s3Client.send(new PutObjectCommand({
        Bucket: resourceNames.appDataBucket,
        Key: testKey,
        Body: testContent,
        ServerSideEncryption: 'AES256'
      }));

      // GET operation
      const getResponse = await s3Client.send(new GetObjectCommand({
        Bucket: resourceNames.appDataBucket,
        Key: testKey
      }));

      expect(getResponse.Body).toBeDefined();
      expect(getResponse.ServerSideEncryption).toBe('AES256');

      // CLEANUP - DELETE operation
      await s3Client.send(new DeleteObjectCommand({
        Bucket: resourceNames.appDataBucket,
        Key: testKey
      }));
    }, 30000);
  });

  describe('VPC and Networking Tests', () => {
    test('should verify VPC exists with correct configuration', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [resourceNames.vpcId]
      });

      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.[0]).toBeDefined();
      
      const vpc = response.Vpcs?.[0];
      expect(vpc?.State).toBe('available');
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc?.DhcpOptionsId).toBeDefined();
    }, 30000);


  });



  describe('CloudTrail Tests', () => {
    test('should verify CloudTrail exists and is logging', async () => {
      const describeCommand = new DescribeTrailsCommand({
        trailNameList: [resourceNames.cloudTrailName]
      });

      const response = await cloudTrailClient.send(describeCommand);
      
      expect(response.trailList).toBeDefined();
      expect(response.trailList?.[0]).toBeDefined();
      
      const trail = response.trailList?.[0];
      expect(trail?.Name).toBe(resourceNames.cloudTrailName);
      expect(trail?.S3BucketName).toBe(resourceNames.cloudTrailBucket);
      expect(trail?.IsMultiRegionTrail).toBe(true);
      expect(trail?.LogFileValidationEnabled).toBe(true);
    }, 30000);

    test('should verify CloudTrail is actively logging', async () => {
      const statusCommand = new GetTrailStatusCommand({
        Name: resourceNames.cloudTrailName
      });

      const response = await cloudTrailClient.send(statusCommand);
      
      expect(response.IsLogging).toBe(true);
      expect(response.LatestDeliveryTime).toBeDefined();
    }, 30000);
  });

  describe('IAM Role Tests', () => {
    test('should verify IAM role exists with correct configuration', async () => {
      const command = new GetRoleCommand({
        RoleName: resourceNames.iamRoleName
      });

      const response = await iamClient.send(command);
      
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(resourceNames.iamRoleName);
      expect(response.Role?.AssumeRolePolicyDocument).toBeDefined();
      
      // Verify assume role policy allows EC2
      const assumePolicy = JSON.parse(decodeURIComponent(response.Role?.AssumeRolePolicyDocument || ''));
      expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
    }, 30000);
  });

  describe('End-to-End Integration Test', () => {
    test('should perform complete workflow using all components', async () => {
      console.log('Running end-to-end integration test...');
      
      // 1. Store a prompt in DynamoDB
      const testId = `e2e-test-${Date.now()}`;
      const promptData = {
        id: { S: testId },
        prompt: { S: 'End-to-end test prompt' },
        response: { S: 'Generated response' },
        timestamp: { S: new Date().toISOString() },
        metadata: { S: JSON.stringify({ source: 'integration-test' }) }
      };

      await dynamoClient.send(new PutItemCommand({
        TableName: resourceNames.dynamoTableName,
        Item: promptData
      }));

      // 2. Store related data in S3
      const s3Key = `e2e-test/${testId}.json`;
      await s3Client.send(new PutObjectCommand({
        Bucket: resourceNames.appDataBucket,
        Key: s3Key,
        Body: JSON.stringify(promptData),
        ServerSideEncryption: 'AES256'
      }));

      // 3. Verify data can be retrieved from both services
      const dynamoResponse = await dynamoClient.send(new GetItemCommand({
        TableName: resourceNames.dynamoTableName,
        Key: { id: { S: testId } }
      }));

      const s3Response = await s3Client.send(new GetObjectCommand({
        Bucket: resourceNames.appDataBucket,
        Key: s3Key
      }));

      expect(dynamoResponse.Item?.id.S).toBe(testId);
      expect(s3Response.Body).toBeDefined();

      // 4. Cleanup
      await dynamoClient.send(new DeleteItemCommand({
        TableName: resourceNames.dynamoTableName,
        Key: { id: { S: testId } }
      }));

      await s3Client.send(new DeleteObjectCommand({
        Bucket: resourceNames.appDataBucket,
        Key: s3Key
      }));

      console.log('End-to-end integration test completed successfully!');
    }, 60000);
  });
});
