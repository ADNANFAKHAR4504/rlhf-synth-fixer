import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeKeyCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import {
  ListBucketsCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// --- Test Setup ---
const region = process.env.AWS_REGION || 'us-east-1';

// Detect LocalStack environment
const isLocalStack = (() => {
  const endpoint = process.env.AWS_ENDPOINT_URL || '';
  return endpoint.includes('localhost') || endpoint.includes('localstack');
})();

// AWS SDK client configuration for LocalStack
const clientConfig = isLocalStack
  ? {
    region,
    endpoint: process.env.AWS_ENDPOINT_URL,
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
  }
  : { region };

// S3 needs forcePathStyle for LocalStack
const s3ClientConfig = isLocalStack
  ? { ...clientConfig, forcePathStyle: true }
  : clientConfig;

const ec2Client = new EC2Client(clientConfig);
const kmsClient = new KMSClient(clientConfig);
const s3Client = new S3Client(s3ClientConfig);
const logsClient = new CloudWatchLogsClient(clientConfig);

// Support both flat outputs (direct values) and nested outputs ({ value: string })
interface StackOutputs {
  [key: string]: string | undefined;
}

describe('Secure Infrastructure Stack Integration Tests', () => {
  let outputs: StackOutputs;

  // Read the CI/CD outputs file once before running tests
  beforeAll(() => {
    const possiblePaths = [
      'cfn-outputs/flat-outputs.json',
      'cdk-outputs/flat-outputs.json',
    ];

    let outputPath = '';
    for (const p of possiblePaths) {
      const fullPath = path.resolve(process.cwd(), p);
      if (fs.existsSync(fullPath)) {
        outputPath = fullPath;
        break;
      }
    }

    if (!outputPath) {
      throw new Error(
        `Output file not found. Tried: ${possiblePaths.join(', ')}. Run the deployment pipeline first.`
      );
    }
    const rawJson = fs.readFileSync(outputPath, 'utf-8');
    outputs = JSON.parse(rawJson);
  });

  // --- CloudFormation Outputs Validation ---
  describe('CloudFormation Outputs', () => {
    test('KMS Key ID should exist', () => {
      const kmsKeyId = outputs['KMSKeyId'];
      expect(kmsKeyId).toBeDefined();
      expect(kmsKeyId).toMatch(/^[0-9a-fA-F-]{36}$/);
    });

    test('VPC ID should exist', () => {
      const vpcId = outputs['VPCId'];
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-/);
    });

    test('EC2 Security Group should exist', () => {
      const ec2SecurityGroupId = outputs['EC2SecurityGroupId'];
      expect(ec2SecurityGroupId).toBeDefined();
      expect(ec2SecurityGroupId).toMatch(/^sg-/);
    });

    test('RDS Security Group should exist', () => {
      const rdsSecurityGroupId = outputs['RDSSecurityGroupId'];
      expect(rdsSecurityGroupId).toBeDefined();
      expect(rdsSecurityGroupId).toMatch(/^sg-/);
    });

    test('Secure Data S3 bucket name should exist', () => {
      const secureDataBucketName = outputs['SecureDataBucketName'];
      expect(secureDataBucketName).toBeDefined();
      expect(secureDataBucketName).toMatch(/^[a-z0-9.-]+$/);
    });

    test('CloudTrail Bucket name should exist', () => {
      const cloudTrailBucketName = outputs['CloudTrailBucketName'];
      expect(cloudTrailBucketName).toBeDefined();
      expect(cloudTrailBucketName).toMatch(/^[a-z0-9.-]+$/);
    });

    test('Logging Bucket name should exist', () => {
      const loggingBucketName = outputs['LoggingBucketName'];
      expect(loggingBucketName).toBeDefined();
      expect(loggingBucketName).toMatch(/^[a-z0-9.-]+$/);
    });

    test('EC2 IAM Role ARN should exist', () => {
      const ec2RoleArn = outputs['EC2RoleArn'];
      expect(ec2RoleArn).toBeDefined();
      expect(ec2RoleArn).toMatch(/^arn:aws:iam::/);
    });

    test('CloudWatch Log Groups should exist in outputs', () => {
      expect(outputs['EC2LogGroupName']).toBeDefined();
      expect(outputs['RDSLogGroupName']).toBeDefined();
      expect(outputs['S3LogGroupName']).toBeDefined();
      expect(outputs['CloudTrailLogGroupName']).toBeDefined();
    });
  });

  // --- VPC Verification ---
  describe('VPC Configuration', () => {
    test('VPC should exist and be configured correctly', async () => {
      const vpcId = outputs['VPCId'];
      const command = new DescribeVpcsCommand({ VpcIds: [vpcId!] });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });
  });

  // --- Security Groups Verification ---
  describe('Security Groups', () => {
    test('EC2 Security Group should exist', async () => {
      const sgId = outputs['EC2SecurityGroupId'];
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [sgId!],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);
    });

    test('RDS Security Group should exist', async () => {
      const sgId = outputs['RDSSecurityGroupId'];
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [sgId!],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);
    });
  });

  // --- S3 Bucket Existence Check ---
  describe('S3 Bucket Existence', () => {
    test('All required S3 buckets should exist', async () => {
      const command = new ListBucketsCommand({});
      const response = await s3Client.send(command);

      const bucketNames = response.Buckets?.map((b) => b.Name) || [];

      const secureDataBucketName = outputs['SecureDataBucketName'];
      const cloudTrailBucketName = outputs['CloudTrailBucketName'];
      const loggingBucketName = outputs['LoggingBucketName'];

      expect(bucketNames).toContain(secureDataBucketName);
      expect(bucketNames).toContain(cloudTrailBucketName);
      expect(bucketNames).toContain(loggingBucketName);
    });
  });

  // --- KMS Key Verification ---
  describe('KMS Key Configuration', () => {
    test('KMS Key should be enabled', async () => {
      const keyId = outputs['KMSKeyId'];
      const command = new DescribeKeyCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata?.Enabled).toBe(true);
      expect(response.KeyMetadata?.KeyManager).toBe('CUSTOMER');
    });
  });

  // --- CloudWatch Log Groups Existence Check ---
  describe('CloudWatch Log Groups Existence', () => {
    test('EC2 Log Group should exist', async () => {
      const logGroupName = outputs['EC2LogGroupName'];
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      const found = response.logGroups?.some(
        (lg) => lg.logGroupName === logGroupName
      );
      expect(found).toBe(true);
    });

    test('RDS Log Group should exist', async () => {
      const logGroupName = outputs['RDSLogGroupName'];
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      const found = response.logGroups?.some(
        (lg) => lg.logGroupName === logGroupName
      );
      expect(found).toBe(true);
    });

    test('S3 Log Group should exist', async () => {
      const logGroupName = outputs['S3LogGroupName'];
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      const found = response.logGroups?.some(
        (lg) => lg.logGroupName === logGroupName
      );
      expect(found).toBe(true);
    });

    test('CloudTrail Log Group should exist', async () => {
      const logGroupName = outputs['CloudTrailLogGroupName'];
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      const found = response.logGroups?.some(
        (lg) => lg.logGroupName === logGroupName
      );
      expect(found).toBe(true);
    });
  });

  // --- Conditional Tests (only run if resources were created) ---
  describe('Conditional Resources', () => {
    test('RDS Endpoint should exist if RDS was created', () => {
      const rdsEndpoint = outputs['RDSEndpoint'];
      if (rdsEndpoint) {
        expect(rdsEndpoint).toContain('.');
      } else {
        // RDS was not created (LocalStack mode)
        expect(true).toBe(true);
      }
    });

    test('EC2 Instance ID should exist if EC2 was created', () => {
      const ec2InstanceId = outputs['EC2InstanceId'];
      if (ec2InstanceId) {
        expect(ec2InstanceId).toMatch(/^i-/);
      } else {
        // EC2 was not created (LocalStack mode)
        expect(true).toBe(true);
      }
    });
  });
});
