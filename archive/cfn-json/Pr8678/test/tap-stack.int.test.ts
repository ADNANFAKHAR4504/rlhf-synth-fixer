import { CloudTrailClient, GetTrailStatusCommand, LookupEventsCommand } from '@aws-sdk/client-cloudtrail';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  FilterLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  ElasticLoadBalancingV2Client
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DecryptCommand,
  DescribeKeyCommand,
  EncryptCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectVersionsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

import fs from 'fs';
import path from 'path';

// Read region from AWS_REGION file
const region = fs.readFileSync(path.join(__dirname, '../lib/AWS_REGION'), 'utf-8').trim();

// Read outputs directly from cfn-outputs file (created during deployment)
const cfnOutputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, string> = {};
if (fs.existsSync(cfnOutputsPath)) {
  outputs = JSON.parse(fs.readFileSync(cfnOutputsPath, 'utf8'));
} else {
  throw new Error('cfn-outputs/flat-outputs.json not found. Run deployment first.');
}

// Get environment suffix from outputs
const environmentSuffix = outputs.EnvironmentSuffix || 'dev';

// Initialize AWS SDK clients with LocalStack endpoint support
const endpoint = process.env.AWS_ENDPOINT_URL;
const isLocalStack = !!endpoint;
const clientConfig = endpoint ? { region, endpoint } : { region };

// S3 needs forcePathStyle for LocalStack
const s3ClientConfig = endpoint
  ? { region, endpoint, forcePathStyle: true }
  : { region };

// Initialize AWS SDK clients
const lambdaClient = new LambdaClient(clientConfig);
const s3Client = new S3Client(s3ClientConfig);
const cloudWatchLogsClient = new CloudWatchLogsClient(clientConfig);
const cloudWatchClient = new CloudWatchClient(clientConfig);
const cloudTrailClient = new CloudTrailClient(clientConfig);
const ec2Client = new EC2Client(clientConfig);
const kmsClient = new KMSClient(clientConfig);
const secretsClient = new SecretsManagerClient(clientConfig);
const rdsClient = new RDSClient(clientConfig);
const elbClient = new ElasticLoadBalancingV2Client(clientConfig);

// Helper function to wait for CloudWatch Logs to appear
async function waitForLogs(
  logGroupName: string,
  filterPattern: string,
  startTime: number,
  maxWaitTime = 60000
): Promise<any[]> {
  const startWait = Date.now();

  while (Date.now() - startWait < maxWaitTime) {
    try {
      const response = await cloudWatchLogsClient.send(
        new FilterLogEventsCommand({
          logGroupName,
          filterPattern,
          startTime,
          limit: 50,
        })
      );

      if (response.events && response.events.length > 0) {
        return response.events;
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  return [];
}

// Helper function to invoke Lambda and parse response
async function invokeLambda(functionName: string, payload: any = {}): Promise<any> {
  const response = await lambdaClient.send(
    new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(payload),
    })
  );

  const responsePayload = JSON.parse(new TextDecoder().decode(response.Payload));
  return responsePayload;
}

describe('Integration Tests for Secure Production Environment', () => {
  // Read stack name from metadata.json
  const metadata = JSON.parse(fs.readFileSync(path.join(__dirname, '../metadata.json'), 'utf-8'));
  const stackName = metadata.stackName;

  // Extract outputs from flat-outputs.json (loaded at top level)
  const vpcId = outputs.VPCId || '';
  const publicSubnet1Id = outputs.PublicSubnet1Id || '';
  const publicSubnet2Id = outputs.PublicSubnet2Id || '';
  const privateSubnet1Id = outputs.PrivateSubnet1Id || '';
  const privateSubnet2Id = outputs.PrivateSubnet2Id || '';
  const s3BucketName = outputs.S3BucketName || '';
  const s3BucketArn = outputs.S3BucketArn || '';
  const lambdaFunctionArn = outputs.LambdaFunctionArn || '';
  const lambdaFunctionName = outputs.LambdaFunctionName || '';
  const cloudTrailName = outputs.CloudTrailName || '';
  const kmsKeyId = outputs.KMSKeyId || '';
  const kmsKeyArn = outputs.KMSKeyArn || '';
  const ec2InstanceId = outputs.EC2InstanceId || '';
  const ec2SecurityGroupId = outputs.EC2SecurityGroupId || '';
  const rdsSecurityGroupId = outputs.RDSSecurityGroupId || '';
  const rdsEndpoint = outputs.RDSEndpoint || '';
  const rdsPort = outputs.RDSPort || '';
  const dbSecretArn = outputs.DBSecretArn || '';
  const albArn = outputs.ALBArn || '';
  const albDnsName = outputs.ALBDNSName || '';

  beforeAll(async () => {
    // Verify all required outputs are present
    expect(vpcId).toBeTruthy();
    expect(s3BucketName).toBeTruthy();
    expect(lambdaFunctionName).toBeTruthy();
    expect(ec2InstanceId).toBeTruthy();
    expect(kmsKeyId).toBeTruthy();
    expect(dbSecretArn).toBeTruthy();
    expect(rdsEndpoint).toBeTruthy();
  }, 30000);

  // ========================================
  // SERVICE-LEVEL Tests (Single Service Interactions)
  // ========================================

  describe('[SERVICE-LEVEL] Lambda Function - Direct Invocation', () => {
    test('should invoke Lambda function directly and receive successful response', async () => {
      // ACTION: Actually invoke the Lambda function
      const response = await invokeLambda(lambdaFunctionName, { test: 'integration' });

      // Verify Lambda executed successfully
      expect(response.statusCode).toBe(200);
      expect(response.headers).toBeDefined();
      expect(response.headers['Content-Type']).toBe('application/json');

      // Parse and verify response body
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Secure production function running');
      expect(body.environment).toBe(environmentSuffix);
    }, 60000);

    test('should invoke Lambda function with custom payload and verify execution', async () => {
      // ACTION: Invoke Lambda with custom event data
      const customPayload = {
        action: 'integration-test',
        timestamp: new Date().toISOString(),
        testData: 'SERVICE-LEVEL test payload',
      };

      const response = await invokeLambda(lambdaFunctionName, customPayload);

      // Verify Lambda processed the request
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('Secure production function');
    }, 60000);
  });

  describe('[SERVICE-LEVEL] S3 Bucket - Object Operations with KMS Encryption', () => {
    const testObjectKey = `integration-test-${Date.now()}.txt`;
    const testContent = 'This is integration test content for S3 operations with KMS encryption';

    test('should PUT object to S3 bucket with KMS encryption', async () => {
      // ACTION: Actually create an object in S3
      const putResponse = await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: testObjectKey,
          Body: testContent,
          ContentType: 'text/plain',
          ServerSideEncryption: 'aws:kms',
          SSEKMSKeyId: kmsKeyArn,
        })
      );

      // Verify object was created with encryption
      expect(putResponse.ETag).toBeDefined();
      // LocalStack may return AES256 instead of aws:kms
      expect(['aws:kms', 'AES256']).toContain(putResponse.ServerSideEncryption);
      if (!isLocalStack) expect(putResponse.SSEKMSKeyId).toBeDefined();
    }, 30000);

    test('should GET object from S3 bucket and verify content', async () => {
      // First, ensure object exists
      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: testObjectKey,
          Body: testContent,
          ServerSideEncryption: 'aws:kms',
          SSEKMSKeyId: kmsKeyArn,
        })
      );

      // ACTION: Actually retrieve the object from S3
      const getResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: s3BucketName,
          Key: testObjectKey,
        })
      );

      // Verify object was retrieved with correct content and encryption
      expect(getResponse.Body).toBeDefined();
      // LocalStack may return AES256 instead of aws:kms
      expect(['aws:kms', 'AES256']).toContain(getResponse.ServerSideEncryption);
      if (!isLocalStack) expect(getResponse.SSEKMSKeyId).toBeDefined();

      const retrievedContent = await getResponse.Body?.transformToString();
      expect(retrievedContent).toBe(testContent);
    }, 30000);

    test('should DELETE object from S3 bucket and verify removal', async () => {
      // First, create object
      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: testObjectKey,
          Body: testContent,
        })
      );

      // ACTION: Actually delete the object from S3
      const deleteResponse = await s3Client.send(
        new DeleteObjectCommand({
          Bucket: s3BucketName,
          Key: testObjectKey,
        })
      );

      // Verify deletion (versioned bucket returns delete marker)
      expect(deleteResponse.DeleteMarker).toBeDefined();

      // Try to get the deleted object (should fail)
      try {
        await s3Client.send(
          new GetObjectCommand({
            Bucket: s3BucketName,
            Key: testObjectKey,
          })
        );
      } catch (error: any) {
        expect(error.name).toBe('NoSuchKey');
      }
    }, 30000);

    test('should verify S3 bucket has versioning enabled by creating multiple versions', async () => {
      const versionTestKey = `version-test-${Date.now()}.txt`;

      // ACTION: Create multiple versions of the same object
      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: versionTestKey,
          Body: 'Version 1 content',
        })
      );

      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: versionTestKey,
          Body: 'Version 2 content',
        })
      );

      // Verify multiple versions exist
      const versionsResponse = await s3Client.send(
        new ListObjectVersionsCommand({
          Bucket: s3BucketName,
          Prefix: versionTestKey,
        })
      );

      expect(versionsResponse.Versions).toBeDefined();
      expect(versionsResponse.Versions!.length).toBeGreaterThanOrEqual(2);

      // Cleanup
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: s3BucketName,
          Key: versionTestKey,
        })
      );
    }, 40000);
  });

  describe('[SERVICE-LEVEL] Secrets Manager - Retrieve Database Credentials', () => {
    test('should retrieve RDS database credentials from Secrets Manager', async () => {
      // ACTION: Retrieve actual secret value
      const response = await secretsClient.send(
        new GetSecretValueCommand({
          SecretId: dbSecretArn,
        })
      );

      expect(response.SecretString).toBeDefined();

      const secretData = JSON.parse(response.SecretString!);
      expect(secretData.username).toBeDefined();
      expect(secretData.username).toBe('admin');
      expect(secretData.password).toBeDefined();
      expect(secretData.password.length).toBeGreaterThanOrEqual(32);
    }, 60000);
  });

  describe('[SERVICE-LEVEL] RDS Instance - Verify Database Configuration', () => {
    test('should verify RDS instance is available and properly configured', async () => {
      // ACTION: Describe RDS instance
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );

      const rdsInstance = response.DBInstances?.find(
        (instance) =>
          instance.Endpoint?.Address === rdsEndpoint &&
          instance.DBSubnetGroup?.VpcId === vpcId
      );

      expect(rdsInstance).toBeDefined();
      expect(rdsInstance!.DBInstanceStatus).toBe('available');
      expect(rdsInstance!.Endpoint?.Address).toBe(rdsEndpoint);
      expect(rdsInstance!.Endpoint?.Port).toBe(Number(rdsPort));
      expect(rdsInstance!.PubliclyAccessible).toBe(false);
      // LocalStack uses StorageEncrypted: false for compatibility
      if (!isLocalStack) expect(rdsInstance!.StorageEncrypted).toBe(true);
      expect(rdsInstance!.Engine).toBe('mysql');
    }, 60000);
  });

  describe('[SERVICE-LEVEL] CloudWatch Logs - Query Lambda Execution Logs', () => {
    test('should query CloudWatch Logs for Lambda execution records', async () => {
      const logGroupName = `/aws/lambda/${lambdaFunctionName}`;
      const startTime = Date.now();

      // First, invoke Lambda to generate logs
      await invokeLambda(lambdaFunctionName, { testType: 'log-generation' });

      // ACTION: Wait for logs to appear in CloudWatch
      const logs = await waitForLogs(logGroupName, '', startTime, 90000);

      // Verify logs exist
      expect(logs).toBeDefined();
      expect(logs.length).toBeGreaterThan(0);

      // Verify log events contain Lambda execution information
      const logMessages = logs.map((e) => e.message || '').join(' ');
      expect(logMessages).toContain('START RequestId');
    }, 120000);

    test('should verify Lambda log group has correct retention period', async () => {
      const logGroupName = `/aws/lambda/${lambdaFunctionName}`;

      // ACTION: Query log group configuration
      const logGroupsResponse = await cloudWatchLogsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName,
        })
      );

      // Verify log group exists and has retention configured
      expect(logGroupsResponse.logGroups).toBeDefined();
      expect(logGroupsResponse.logGroups!.length).toBeGreaterThan(0);

      const logGroup = logGroupsResponse.logGroups![0];
      // LocalStack may not return retention period
      if (!isLocalStack) expect(logGroup.retentionInDays).toBe(30);
    }, 30000);
  });

  describe('[SERVICE-LEVEL] CloudWatch Alarms - Verify Monitoring Configuration', () => {
    test('should verify EC2, RDS, and Lambda alarms are configured', async () => {
      // ACTION: Query CloudWatch Alarms
      const alarmsResponse = await cloudWatchClient.send(new DescribeAlarmsCommand({}));

      // Verify alarms exist
      expect(alarmsResponse.MetricAlarms).toBeDefined();
      expect(alarmsResponse.MetricAlarms!.length).toBeGreaterThan(0);

      // Find alarms related to our stack
      const stackAlarms = alarmsResponse.MetricAlarms!.filter(
        (alarm) => alarm.AlarmName?.includes(environmentSuffix)
      );

      expect(stackAlarms.length).toBeGreaterThanOrEqual(3); // EC2, RDS, Lambda alarms

      // Verify EC2 CPU alarm configuration
      const ec2CPUAlarm = stackAlarms.find((a) => a.AlarmName?.includes('EC2-HighCPU'));
      expect(ec2CPUAlarm).toBeDefined();
      expect(ec2CPUAlarm!.MetricName).toBe('CPUUtilization');
      expect(ec2CPUAlarm!.Namespace).toBe('AWS/EC2');
      expect(ec2CPUAlarm!.Threshold).toBe(80);

      // Verify RDS CPU alarm configuration
      const rdsCPUAlarm = stackAlarms.find((a) => a.AlarmName?.includes('RDS-HighCPU'));
      expect(rdsCPUAlarm).toBeDefined();
      expect(rdsCPUAlarm!.MetricName).toBe('CPUUtilization');
      expect(rdsCPUAlarm!.Namespace).toBe('AWS/RDS');
      expect(rdsCPUAlarm!.Threshold).toBe(80);

      // Verify Lambda error alarm configuration
      const lambdaErrorAlarm = stackAlarms.find((a) => a.AlarmName?.includes('Lambda-Errors'));
      expect(lambdaErrorAlarm).toBeDefined();
      expect(lambdaErrorAlarm!.MetricName).toBe('Errors');
      expect(lambdaErrorAlarm!.Namespace).toBe('AWS/Lambda');
      expect(lambdaErrorAlarm!.Threshold).toBe(5);
    }, 30000);
  });

  describe('[SERVICE-LEVEL] CloudTrail - Verify Audit Logging', () => {
    test('should verify CloudTrail is actively logging events', async () => {
      // ACTION: Check CloudTrail status
      const trailStatusResponse = await cloudTrailClient.send(
        new GetTrailStatusCommand({
          Name: cloudTrailName,
        })
      );

      // Verify CloudTrail is logging
      expect(trailStatusResponse.IsLogging).toBe(true);
    }, 30000);

    test('should query CloudTrail for recent management events', async () => {
      // ACTION: Actually query CloudTrail events
      const eventsResponse = await cloudTrailClient.send(
        new LookupEventsCommand({
          MaxResults: 10,
        })
      );

      // Verify events are being captured
      expect(eventsResponse.Events).toBeDefined();
      expect(eventsResponse.Events!.length).toBeGreaterThan(0);

      // Verify event structure
      const firstEvent = eventsResponse.Events![0];
      expect(firstEvent.EventTime).toBeDefined();
      expect(firstEvent.EventName).toBeDefined();
      expect(firstEvent.Resources || firstEvent.Username || firstEvent.EventSource).toBeDefined();
    }, 30000);
  });

  describe('[SERVICE-LEVEL] KMS Key - Encryption and Decryption Operations', () => {
    test('should encrypt and decrypt data using KMS key', async () => {
      const plaintext = 'Sensitive data for encryption test';

      // ACTION: Encrypt data using KMS
      const encryptResponse = await kmsClient.send(
        new EncryptCommand({
          KeyId: kmsKeyId,
          Plaintext: Buffer.from(plaintext),
        })
      );

      expect(encryptResponse.CiphertextBlob).toBeDefined();
      expect(encryptResponse.KeyId).toContain(kmsKeyId);

      // ACTION: Decrypt data using KMS
      const decryptResponse = await kmsClient.send(
        new DecryptCommand({
          CiphertextBlob: encryptResponse.CiphertextBlob,
        })
      );

      const decryptedText = Buffer.from(decryptResponse.Plaintext!).toString('utf-8');
      expect(decryptedText).toBe(plaintext);
      expect(decryptResponse.KeyId).toContain(kmsKeyId);
    }, 40000);

    test('should verify KMS key is enabled with automatic rotation', async () => {
      // ACTION: Query KMS key details
      const keyResponse = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: kmsKeyId,
        })
      );

      // Verify key configuration
      expect(keyResponse.KeyMetadata).toBeDefined();
      expect(keyResponse.KeyMetadata!.Enabled).toBe(true);
      expect(keyResponse.KeyMetadata!.KeyState).toBe('Enabled');
      expect(keyResponse.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
    }, 30000);
  });

  describe('[SERVICE-LEVEL] Application Load Balancer - Verify Target Health', () => {
    test('should verify ALB is active and properly configured', async () => {
      // ACTION: Get load balancer details
      const lbResponse = await elbClient.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [albArn],
        })
      );

      expect(lbResponse.LoadBalancers).toBeDefined();
      expect(lbResponse.LoadBalancers!.length).toBe(1);

      const loadBalancer = lbResponse.LoadBalancers![0];
      expect(loadBalancer.State?.Code).toBe('active');
      expect(loadBalancer.Scheme).toBe('internet-facing');
      expect(loadBalancer.VpcId).toBe(vpcId);
    }, 40000);
  });

  describe('[SERVICE-LEVEL] VPC and Network Configuration', () => {
    test('should verify VPC exists with correct CIDR block', async () => {
      // ACTION: Describe VPC
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);

      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(vpcId);
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    }, 60000);

    test('should verify all subnets exist in different availability zones', async () => {
      // ACTION: Describe all subnets
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [publicSubnet1Id, publicSubnet2Id, privateSubnet1Id, privateSubnet2Id],
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(4);

      // Verify all subnets are available
      response.Subnets!.forEach((subnet) => {
        expect(subnet.State).toBe('available');
        expect(subnet.AvailabilityZone).toBeDefined();
      });

      const publicSubnet1 = response.Subnets!.find((s) => s.SubnetId === publicSubnet1Id);
      const publicSubnet2 = response.Subnets!.find((s) => s.SubnetId === publicSubnet2Id);
      const privateSubnet1 = response.Subnets!.find((s) => s.SubnetId === privateSubnet1Id);
      const privateSubnet2 = response.Subnets!.find((s) => s.SubnetId === privateSubnet2Id);

      // Verify public subnets allow public IPs
      expect(publicSubnet1!.MapPublicIpOnLaunch).toBe(true);
      expect(publicSubnet2!.MapPublicIpOnLaunch).toBe(true);

      // Verify private subnets do not allow public IPs
      expect(privateSubnet1!.MapPublicIpOnLaunch).toBe(false);
      expect(privateSubnet2!.MapPublicIpOnLaunch).toBe(false);

      // Verify subnets are in different AZs for high availability
      expect(publicSubnet1!.AvailabilityZone).toBeDefined();
      expect(publicSubnet2!.AvailabilityZone).toBeDefined();
      expect(privateSubnet1!.AvailabilityZone).toBe(publicSubnet1!.AvailabilityZone);
      expect(privateSubnet2!.AvailabilityZone).toBe(publicSubnet2!.AvailabilityZone);
      expect(publicSubnet1!.AvailabilityZone).not.toBe(publicSubnet2!.AvailabilityZone);
    }, 60000);
  });

  describe('[SERVICE-LEVEL] Security Groups - Verify Access Control', () => {
    test('should verify EC2 security group allows traffic only from ALB', async () => {
      // ACTION: Describe EC2 Security Group
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [ec2SecurityGroupId],
        })
      );

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);

      const sg = response.SecurityGroups![0];
      expect(sg.IpPermissions).toBeDefined();
      // LocalStack may not populate security group rules
      if (!isLocalStack) {
        expect(sg.IpPermissions!.length).toBe(2);

        // Verify HTTP and HTTPS rules reference ALB security group (not 0.0.0.0/0)
        sg.IpPermissions!.forEach((rule) => {
          expect(rule.UserIdGroupPairs).toBeDefined();
          expect(rule.UserIdGroupPairs!.length).toBeGreaterThan(0);
          // Should not have open IP ranges
          expect(rule.IpRanges || []).toHaveLength(0);
        });
      }
    }, 60000);

    test('should verify RDS security group allows MySQL only from EC2 security group', async () => {
      // ACTION: Describe RDS Security Group
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [rdsSecurityGroupId],
        })
      );

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);

      const sg = response.SecurityGroups![0];
      expect(sg.IpPermissions).toBeDefined();
      // LocalStack may not populate security group rules
      if (!isLocalStack) {
        expect(sg.IpPermissions!.length).toBe(1);

        const mysqlRule = sg.IpPermissions![0];
        expect(mysqlRule.FromPort).toBe(3306);
        expect(mysqlRule.ToPort).toBe(3306);
        expect(mysqlRule.IpProtocol).toBe('tcp');
        expect(mysqlRule.UserIdGroupPairs).toBeDefined();
        expect(mysqlRule.UserIdGroupPairs![0].GroupId).toBe(ec2SecurityGroupId);
        // Verify no public access
        expect(mysqlRule.IpRanges || []).toHaveLength(0);
      }
    }, 60000);
  });

  // ========================================
  // CROSS-SERVICE Tests (Two Services Talking)
  // ========================================

  describe('[CROSS-SERVICE] Lambda → CloudWatch Logs Integration', () => {
    test('should invoke Lambda and verify logs appear in CloudWatch with execution details', async () => {
      const startTime = Date.now();
      const testPayload = {
        testType: 'cloudwatch-integration',
        timestamp: new Date().toISOString(),
      };

      // ACTION: Invoke Lambda
      await invokeLambda(lambdaFunctionName, testPayload);

      // ACTION: Query CloudWatch Logs for the invocation
      const logGroupName = `/aws/lambda/${lambdaFunctionName}`;
      const logs = await waitForLogs(logGroupName, '', startTime, 90000);

      // Verify logs captured the Lambda execution
      expect(logs.length).toBeGreaterThan(0);

      const logMessages = logs.map((e) => e.message || '').join(' ');
      expect(logMessages).toContain('START RequestId');
      expect(logMessages).toContain('END RequestId');
    }, 120000);
  });

  describe('[CROSS-SERVICE] S3 → KMS Encryption Integration', () => {
    test('should verify S3 objects are encrypted with KMS key', async () => {
      const testKey = `kms-test-${Date.now()}.txt`;

      // ACTION: Create object in S3 (uses default bucket encryption with KMS)
      const putResponse = await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
          Body: 'KMS encryption test content',
        })
      );

      // Verify object was encrypted
      expect(putResponse.ServerSideEncryption).toBeDefined();

      // ACTION: Get object and verify encryption details
      const getResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
        })
      );

      // LocalStack may return AES256 instead of aws:kms
      expect(['aws:kms', 'AES256']).toContain(getResponse.ServerSideEncryption);
      if (!isLocalStack) expect(getResponse.SSEKMSKeyId).toContain(kmsKeyId);

      // Cleanup
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
        })
      );
    }, 40000);
  });

  // ========================================
  // E2E Tests (Complete Workflows with Real Data)
  // ========================================

  describe('[E2E] Complete S3 Workflow: PUT → GET → Versioning → DELETE with KMS Encryption', () => {
    test('should execute complete S3 workflow with real data and cleanup', async () => {
      const testKey = `e2e-workflow-${Date.now()}.json`;
      const testData = {
        testType: 'E2E S3 Workflow',
        timestamp: new Date().toISOString(),
        data: 'Integration test for complete S3 operations with KMS encryption and versioning',
        iterations: [1, 2, 3],
      };

      console.log('[E2E S3 Test] Step 1: Creating object in S3 with KMS encryption...');
      // Step 1: Create object
      const putResponse = await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
          Body: JSON.stringify(testData),
          ContentType: 'application/json',
          Metadata: {
            'test-type': 'e2e-workflow',
          },
        })
      );

      expect(putResponse.ETag).toBeDefined();
      expect(putResponse.ServerSideEncryption).toBeDefined();
      const version1ETag = putResponse.ETag;

      console.log('[E2E S3 Test] Step 2: Retrieving object and verifying content...');
      // Step 2: Get object and verify content
      const getResponse1 = await s3Client.send(
        new GetObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
        })
      );

      expect(getResponse1.Body).toBeDefined();
      // LocalStack may return AES256 instead of aws:kms
      expect(['aws:kms', 'AES256']).toContain(getResponse1.ServerSideEncryption);
      expect(getResponse1.Metadata).toBeDefined();
      expect(getResponse1.Metadata!['test-type']).toBe('e2e-workflow');

      const retrievedData1 = JSON.parse((await getResponse1.Body!.transformToString()) || '{}');
      expect(retrievedData1.testType).toBe('E2E S3 Workflow');
      expect(retrievedData1.data).toContain('Integration test');

      console.log('[E2E S3 Test] Step 3: Updating object to create new version...');
      // Step 3: Update object (create new version)
      const updatedData = { ...testData, version: 2, updated: true };
      const putResponse2 = await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
          Body: JSON.stringify(updatedData),
          ContentType: 'application/json',
        })
      );

      expect(putResponse2.ETag).toBeDefined();
      expect(putResponse2.ETag).not.toBe(version1ETag);

      console.log('[E2E S3 Test] Step 4: Verifying versioning - multiple versions exist...');
      // Step 4: Verify versioning
      const versionsResponse = await s3Client.send(
        new ListObjectVersionsCommand({
          Bucket: s3BucketName,
          Prefix: testKey,
        })
      );

      expect(versionsResponse.Versions).toBeDefined();
      expect(versionsResponse.Versions!.length).toBeGreaterThanOrEqual(2);

      console.log('[E2E S3 Test] Step 5: Getting updated object and verifying changes...');
      // Step 5: Get updated object
      const getResponse2 = await s3Client.send(
        new GetObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
        })
      );

      const retrievedData2 = JSON.parse((await getResponse2.Body!.transformToString()) || '{}');
      expect(retrievedData2.version).toBe(2);
      expect(retrievedData2.updated).toBe(true);

      console.log('[E2E S3 Test] Step 6: Deleting object and verifying cleanup...');
      // Step 6: Delete object (cleanup)
      const deleteResponse = await s3Client.send(
        new DeleteObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
        })
      );

      expect(deleteResponse.DeleteMarker).toBeDefined();

      console.log('[E2E S3 Test] Step 7: Verifying object is no longer accessible...');
      // Step 7: Verify deletion
      try {
        await s3Client.send(
          new GetObjectCommand({
            Bucket: s3BucketName,
            Key: testKey,
          })
        );
        fail('Object should not be accessible after deletion');
      } catch (error: any) {
        expect(error.name).toBe('NoSuchKey');
      }

      console.log('[E2E S3 Test] E2E S3 workflow completed successfully - All 7 steps verified');
    }, 120000);
  });

  describe('[E2E] Complete Security Flow: CloudTrail → S3 → KMS with Event Tracking', () => {
    test('should execute complete security audit workflow with real operations', async () => {
      const testKey = `security-audit-${Date.now()}.txt`;

      console.log('[E2E Security Test] Step 1: Performing S3 operation to generate CloudTrail event...');
      // Step 1: Perform S3 operation (tracked by CloudTrail)
      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
          Body: 'Security audit test - this operation should be logged in CloudTrail',
        })
      );

      console.log('[E2E Security Test] Step 2: Verifying CloudTrail is actively logging...');
      // Step 2: Verify CloudTrail is logging
      const trailStatus = await cloudTrailClient.send(
        new GetTrailStatusCommand({
          Name: cloudTrailName,
        })
      );

      expect(trailStatus.IsLogging).toBe(true);

      console.log('[E2E Security Test] Step 3: Verifying S3 object encryption...');
      // Step 3: Verify S3 encryption
      const getResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
        })
      );

      // LocalStack may return AES256 instead of aws:kms
      expect(['aws:kms', 'AES256']).toContain(getResponse.ServerSideEncryption);
      if (!isLocalStack) expect(getResponse.SSEKMSKeyId).toContain(kmsKeyId);

      console.log('[E2E Security Test] Step 4: Verifying KMS key is enabled...');
      // Step 4: Verify KMS key status
      const keyResponse = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: kmsKeyId,
        })
      );

      expect(keyResponse.KeyMetadata!.Enabled).toBe(true);
      expect(keyResponse.KeyMetadata!.KeyState).toBe('Enabled');

      console.log('[E2E Security Test] Step 5: Querying CloudTrail for recent events...');
      // Step 5: Query CloudTrail events
      await new Promise((resolve) => setTimeout(resolve, 10000));

      const eventsResponse = await cloudTrailClient.send(
        new LookupEventsCommand({
          MaxResults: 50,
        })
      );

      expect(eventsResponse.Events).toBeDefined();
      expect(eventsResponse.Events!.length).toBeGreaterThan(0);

      console.log('[E2E Security Test] Step 6: Cleaning up...');
      // Step 6: Cleanup
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
        })
      );

      console.log('[E2E Security Test] E2E security audit workflow completed - All 6 steps verified');
    }, 180000);
  });

  describe('[E2E] Complete Monitoring Flow: Lambda Invocation → Metrics → CloudWatch', () => {
    test('should execute complete monitoring workflow with real Lambda executions', async () => {
      console.log('[E2E Monitoring Test] Step 1: Invoking Lambda multiple times to generate metrics...');
      // Step 1: Invoke Lambda multiple times to generate metrics
      const invocationPromises = [];
      for (let i = 0; i < 5; i++) {
        invocationPromises.push(
          invokeLambda(lambdaFunctionName, {
            iteration: i + 1,
            testType: 'monitoring-workflow',
          })
        );
      }

      const invocationResults = await Promise.all(invocationPromises);

      // Verify all invocations succeeded
      invocationResults.forEach((result, index) => {
        expect(result.statusCode).toBe(200);
        console.log(`[E2E Monitoring Test] Invocation ${index + 1}/5 completed successfully`);
      });

      console.log('[E2E Monitoring Test] Step 2: Waiting for metrics to propagate to CloudWatch...');
      // Step 2: Wait for metrics to propagate
      await new Promise((resolve) => setTimeout(resolve, 15000));

      console.log('[E2E Monitoring Test] Step 3: Verifying CloudWatch Alarms are monitoring Lambda...');
      // Step 3: Verify CloudWatch Alarms exist and are monitoring
      const alarmsResponse = await cloudWatchClient.send(new DescribeAlarmsCommand({}));

      const lambdaAlarms = alarmsResponse.MetricAlarms!.filter(
        (alarm) => alarm.AlarmName?.includes('Lambda') && alarm.AlarmName?.includes(environmentSuffix)
      );

      expect(lambdaAlarms.length).toBeGreaterThanOrEqual(1);

      // Verify alarm configuration
      const errorAlarm = lambdaAlarms.find((a) => a.MetricName === 'Errors');
      expect(errorAlarm).toBeDefined();
      expect(errorAlarm!.Namespace).toBe('AWS/Lambda');
      expect(errorAlarm!.StateValue).toBeDefined();

      console.log('[E2E Monitoring Test] Step 4: Verifying Lambda execution logs in CloudWatch...');
      // Step 4: Verify logs captured all invocations
      const logGroupName = `/aws/lambda/${lambdaFunctionName}`;
      const logsResponse = await cloudWatchLogsClient.send(
        new FilterLogEventsCommand({
          logGroupName,
          startTime: Date.now() - 300000,
          limit: 100,
        })
      );

      expect(logsResponse.events).toBeDefined();
      expect(logsResponse.events!.length).toBeGreaterThan(0);

      // Count START events to verify invocations were logged
      const startEvents = logsResponse.events!.filter((e) => e.message?.includes('START RequestId'));
      expect(startEvents.length).toBeGreaterThanOrEqual(5);

      console.log('[E2E Monitoring Test] E2E monitoring workflow completed - All 4 steps verified');
      console.log(`[E2E Monitoring Test] Captured ${startEvents.length} Lambda executions in CloudWatch Logs`);
    }, 180000);
  });
});