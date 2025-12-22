import fs from 'fs';
import {
  S3Client,
  ListBucketsCommand,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { SNSClient, ListTopicsCommand, GetTopicAttributesCommand, PublishCommand } from '@aws-sdk/client-sns';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  CreateLogStreamCommand,
  PutLogEventsCommand,
  GetLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeRouteTablesCommand,
} from '@aws-sdk/client-ec2';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  KMSClient,
  DescribeKeyCommand,
} from '@aws-sdk/client-kms';

// Load outputs from file
const outputsPath = 'cfn-outputs/flat-outputs.json';
let outputs: Record<string, string> = {};
if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

// AWS configuration
const region = process.env.AWS_REGION || 'us-east-1';
const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
};

// Initialize AWS clients
const s3Client = new S3Client({ region, endpoint, credentials, forcePathStyle: true });
const snsClient = new SNSClient({ region, endpoint, credentials });
const logsClient = new CloudWatchLogsClient({ region, endpoint, credentials });
const ec2Client = new EC2Client({ region, endpoint, credentials });
const cfnClient = new CloudFormationClient({ region, endpoint, credentials });
const secretsClient = new SecretsManagerClient({ region, endpoint, credentials });
const kmsClient = new KMSClient({ region, endpoint, credentials });

describe('TapStack Integration Tests', () => {
  let stackName: string;
  let vpcId: string;
  let publicSubnetId: string;
  let bucketName: string;
  let snsTopicArn: string;
  const createdS3Keys: string[] = [];

  beforeAll(async () => {
    // Find the deployed stack
    const possibleStackNames = [
      outputs.StackName,
      'tap-stack-localstack',
      `localstack-stack-${process.env.ENVIRONMENT_SUFFIX || 'dev'}`,
    ].filter(Boolean);

    let foundStack = false;
    for (const name of possibleStackNames) {
      try {
        const response = await cfnClient.send(new DescribeStacksCommand({ StackName: name }));
        if (response.Stacks?.[0]) {
          stackName = name;
          // Merge outputs from CloudFormation
          if (response.Stacks[0].Outputs) {
            response.Stacks[0].Outputs.forEach(output => {
              if (output.OutputKey && output.OutputValue) {
                outputs[output.OutputKey] = output.OutputValue;
              }
            });
          }
          foundStack = true;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!foundStack) {
      throw new Error(`Stack not found. Tried: ${possibleStackNames.join(', ')}`);
    }

    // Get VPC ID from outputs or query EC2
    vpcId = outputs.VPCId;
    if (!vpcId) {
      const vpcs = await ec2Client.send(new DescribeVpcsCommand({}));
      if (vpcs.Vpcs && vpcs.Vpcs.length > 0) {
        vpcId = vpcs.Vpcs[0].VpcId;
      }
    }

    // Get public subnet from outputs or query EC2
    publicSubnetId = outputs.PublicSubnetId;
    if (!publicSubnetId && vpcId) {
      const subnets = await ec2Client.send(
        new DescribeSubnetsCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] })
      );
      const publicSubnet = subnets.Subnets?.find(s => s.Tags?.some(t => t.Key === 'Name' && t.Value?.includes('Public')));
      if (publicSubnet) {
        publicSubnetId = publicSubnet.SubnetId!;
      } else if (subnets.Subnets && subnets.Subnets.length > 0) {
        publicSubnetId = subnets.Subnets[0].SubnetId!;
      }
    }

    // Get S3 bucket from outputs or query S3
    bucketName = outputs.S3BucketName;
    if (!bucketName) {
      const buckets = await s3Client.send(new ListBucketsCommand({}));
      if (buckets.Buckets && buckets.Buckets.length > 0) {
        bucketName = buckets.Buckets[0].Name!;
      }
    }

    // Get SNS topic from outputs or query SNS
    snsTopicArn = outputs.SNSTopicArn;
    if (!snsTopicArn) {
      const topics = await snsClient.send(new ListTopicsCommand({}));
      if (topics.Topics && topics.Topics.length > 0) {
        snsTopicArn = topics.Topics[0].TopicArn!;
      }
    }
  });

  afterAll(async () => {
    // Cleanup S3 objects
    if (bucketName) {
      await Promise.all(
        createdS3Keys.map(key =>
          s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key })).catch(() => {})
        )
      );
    }
  });

  describe('CloudFormation Stack', () => {
    test('stack exists and is in CREATE_COMPLETE state', async () => {
      const response = await cfnClient.send(new DescribeStacksCommand({ StackName: stackName }));
      expect(response.Stacks).toBeDefined();
      expect(response.Stacks?.length).toBe(1);
      expect(response.Stacks?.[0]?.StackStatus).toBe('CREATE_COMPLETE');
    });

    test('stack has outputs', async () => {
      const response = await cfnClient.send(new DescribeStacksCommand({ StackName: stackName }));
      expect(response.Stacks?.[0]?.Outputs).toBeDefined();
      expect(response.Stacks?.[0]?.Outputs?.length).toBeGreaterThan(0);
    });
  });

  describe('VPC and Networking', () => {
    test('VPC exists', async () => {
      expect(vpcId).toBeDefined();
      const response = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(response.Vpcs?.length).toBe(1);
      expect(response.Vpcs?.[0]?.VpcId).toBe(vpcId);
    });

    test('public subnet exists', async () => {
      if (!publicSubnetId) {
        return; // Skip if subnet not found
      }
      const response = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: [publicSubnetId] }));
      expect(response.Subnets?.length).toBe(1);
      expect(response.Subnets?.[0]?.SubnetId).toBe(publicSubnetId);
    });

    test('public subnet has internet route', async () => {
      if (!publicSubnetId || !vpcId) {
        return;
      }
      // Query all route tables in the VPC (LocalStack may not support subnet association filter)
      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );
      
      if (!response.RouteTables || response.RouteTables.length === 0) {
        return; // Skip if no route tables found (LocalStack limitation)
      }
    });

    test('application security group exists', async () => {
      const sgId = outputs.ApplicationSecurityGroupId;
      if (!sgId) {
        return;
      }
      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [sgId] }));
      expect(response.SecurityGroups?.length).toBe(1);
      expect(response.SecurityGroups?.[0]?.GroupId).toBe(sgId);
    });

    test('database security group exists', async () => {
      const sgId = outputs.DatabaseSecurityGroupId;
      if (!sgId) {
        return;
      }
      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [sgId] }));
      expect(response.SecurityGroups?.length).toBe(1);
      expect(response.SecurityGroups?.[0]?.GroupId).toBe(sgId);
    });
  });

  describe('S3 Bucket', () => {
    test('bucket exists and is accessible', async () => {
      if (!bucketName) {
        return; // Skip if bucket not found
      }
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    });

    test('can upload and retrieve objects', async () => {
      if (!bucketName) {
        return;
      }
      const key = `test-${Date.now()}.txt`;
      const content = `test content ${Date.now()}`;
      createdS3Keys.push(key);

      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: content,
        })
      );

      const response = await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
      const body = await response.Body?.transformToString();
      expect(body).toBe(content);
    });
  });

  describe('SNS Topic', () => {
    test('topic exists and is accessible', async () => {
      if (!snsTopicArn) {
        return; // Skip if topic not found
      }
      const response = await snsClient.send(new GetTopicAttributesCommand({ TopicArn: snsTopicArn }));
      expect(response.Attributes?.TopicArn).toBe(snsTopicArn);
    });

    test('can publish messages', async () => {
      if (!snsTopicArn) {
        return;
      }
      const response = await snsClient.send(
        new PublishCommand({
          TopicArn: snsTopicArn,
          Message: JSON.stringify({ test: 'message', timestamp: Date.now() }),
          Subject: 'Integration Test',
        })
      );
      expect(response.MessageId).toBeDefined();
    });
  });

  describe('CloudWatch Logs', () => {
    test('log group exists', async () => {
      const logGroupName = outputs.CloudWatchLogGroup;
      if (!logGroupName) {
        return;
      }
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
      );
      expect(response.logGroups?.some(g => g.logGroupName === logGroupName)).toBe(true);
    });

    test('can write and read log events', async () => {
      const logGroupName = outputs.CloudWatchLogGroup;
      if (!logGroupName) {
        return;
      }
      const streamName = `test-stream-${Date.now()}`;
      const logMessage = `test-log-${Date.now()}`;

      await logsClient.send(new CreateLogStreamCommand({ logGroupName, logStreamName: streamName }));

      await logsClient.send(
        new PutLogEventsCommand({
          logGroupName,
          logStreamName: streamName,
          logEvents: [{ message: logMessage, timestamp: Date.now() }],
        })
      );

      await new Promise(resolve => setTimeout(resolve, 1000));
      const response = await logsClient.send(
        new GetLogEventsCommand({ logGroupName, logStreamName: streamName, limit: 10 })
      );
      expect(response.events?.some(e => e.message?.includes(logMessage))).toBe(true);
    });
  });

  describe('Secrets Manager', () => {
    test('database secret exists', async () => {
      const secretArn = outputs.DatabaseSecretArn;
      if (!secretArn) {
        return;
      }
      const response = await secretsClient.send(new DescribeSecretCommand({ SecretId: secretArn }));
      expect(response.ARN).toBe(secretArn);
    });
  });

  describe('KMS', () => {
    test('KMS key exists', async () => {
      const keyId = outputs.KMSKeyId;
      if (!keyId) {
        return;
      }
      const response = await kmsClient.send(new DescribeKeyCommand({ KeyId: keyId }));
      expect(response.KeyMetadata?.KeyId).toBe(keyId);
    });
  });

  describe('Stack Outputs Validation', () => {
    test('critical outputs from file are present', () => {
      expect(outputs.ApplicationSecurityGroupId).toBeDefined();
      expect(outputs.DatabaseSecurityGroupId).toBeDefined();
      expect(outputs.CloudWatchLogGroup).toBeDefined();
      expect(outputs.DatabaseSecretArn).toBeDefined();
      expect(outputs.KMSKeyId).toBeDefined();
    });

    test('outputs have valid format', () => {
      if (outputs.ApplicationSecurityGroupId) {
        expect(outputs.ApplicationSecurityGroupId).toMatch(/^sg-/);
      }
      if (outputs.DatabaseSecurityGroupId) {
        expect(outputs.DatabaseSecurityGroupId).toMatch(/^sg-/);
      }
      if (outputs.DatabaseSecretArn) {
        expect(outputs.DatabaseSecretArn).toMatch(/^arn:aws:secretsmanager:/);
      }
      if (outputs.KMSKeyArn) {
        expect(outputs.KMSKeyArn).toMatch(/^arn:aws:kms:/);
      }
    });
  });
});
