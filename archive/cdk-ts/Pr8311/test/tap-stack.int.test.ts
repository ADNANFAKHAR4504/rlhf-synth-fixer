// Configuration - These are coming from cfn-outputs after cdk deploy
import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetEventSelectorsCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeFlowLogsCommand,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { GetRoleCommand, IAMClient } from '@aws-sdk/client-iam';
import {
  GetBucketEncryptionCommand,
  GetBucketPolicyCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// LocalStack configuration
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                     process.env.AWS_ENDPOINT_URL?.includes('4566');
const localstackEndpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';

// AWS clients with LocalStack support
const clientConfig = isLocalStack ? {
  region: 'us-east-1',
  endpoint: localstackEndpoint,
  forcePathStyle: true, // Required for S3 in LocalStack
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
} : {
  region: 'us-east-1',
};

const ec2Client = new EC2Client(clientConfig);
const s3Client = new S3Client(clientConfig);
const cloudTrailClient = new CloudTrailClient(clientConfig);
const logsClient = new CloudWatchLogsClient(clientConfig);
const iamClient = new IAMClient(clientConfig);

describe('Secure AWS CDK Environment Integration Tests', () => {
  describe('VPC and Network Security', () => {
    test('VPC exists with correct configuration', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.VpcId],
        })
      );

      const vpc = response.Vpcs?.[0];
      expect(vpc).toBeDefined();
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc?.State).toBe('available');

      // Check tags
      const environmentTag = vpc?.Tags?.find(tag => tag.Key === 'Environment');
      expect(environmentTag?.Value).toBe(environmentSuffix);

      const projectTag = vpc?.Tags?.find(tag => tag.Key === 'Project');
      expect(projectTag?.Value).toBe('SecureEnvironment');
    });

  });

  describe('S3 Security Configuration', () => {
    test('S3 bucket has AES-256 encryption enabled', async () => {
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: outputs.SecureBucketName,
        })
      );

      const encryption = response.ServerSideEncryptionConfiguration;
      expect(encryption).toBeDefined();
      expect(encryption?.Rules).toBeDefined();
      expect(
        encryption?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    test('S3 bucket has versioning enabled', async () => {
      const response = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: outputs.SecureBucketName,
        })
      );

      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket blocks public access', async () => {
      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({
          Bucket: outputs.SecureBucketName,
        })
      );

      const config = response.PublicAccessBlockConfiguration;
      expect(config?.BlockPublicAcls).toBe(true);
      expect(config?.BlockPublicPolicy).toBe(true);
      expect(config?.IgnorePublicAcls).toBe(true);
      expect(config?.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket enforces HTTPS-only access', async () => {
      const response = await s3Client.send(
        new GetBucketPolicyCommand({
          Bucket: outputs.SecureBucketName,
        })
      );

      const policy = JSON.parse(response.Policy || '{}');
      const statements = policy.Statement || [];

      // Find the HTTPS enforcement statement
      const httpsStatement = statements.find(
        (stmt: any) =>
          stmt.Effect === 'Deny' &&
          stmt.Condition?.Bool?.['aws:SecureTransport'] === 'false'
      );

      expect(httpsStatement).toBeDefined();
      expect(httpsStatement.Action).toBe('s3:*');
    });
  });

  describe('Comprehensive Logging', () => {
    test('CloudTrail is configured for API logging', async () => {
      const response = await cloudTrailClient.send(
        new DescribeTrailsCommand({
          trailNameList: [`security-audit-trail-${environmentSuffix}`],
        })
      );

      const trail = response.trailList?.[0];
      expect(trail).toBeDefined();
      expect(trail?.IsMultiRegionTrail).toBe(true);
      expect(trail?.IncludeGlobalServiceEvents).toBe(true);
      expect(trail?.LogFileValidationEnabled).toBe(true);

      // Check event selectors for S3 data events
      const eventResponse = await cloudTrailClient.send(
        new GetEventSelectorsCommand({
          TrailName: trail?.TrailARN,
        })
      );

      const eventSelectors = eventResponse.EventSelectors;
      expect(eventSelectors).toBeDefined();
      expect(eventSelectors?.length).toBeGreaterThan(0);

      // Check for S3 data events
      const s3DataEvents = eventSelectors?.[0]?.DataResources?.find(
        resource => resource.Type === 'AWS::S3::Object'
      );
      expect(s3DataEvents).toBeDefined();
    });

    test('CloudWatch log groups are created', async () => {
      const expectedLogGroups = [
        `/aws/vpc/flowlogs/${environmentSuffix}`,
        `/aws/application/${environmentSuffix}`,
        `/aws/ec2/system-logs/${environmentSuffix}`,
        `/aws/ec2/security-logs/${environmentSuffix}`,
      ];

      for (const logGroupName of expectedLogGroups) {
        const response = await logsClient.send(
          new DescribeLogGroupsCommand({
            logGroupNamePrefix: logGroupName,
          })
        );

        const logGroup = response.logGroups?.find(
          lg => lg.logGroupName === logGroupName
        );
        expect(logGroup).toBeDefined();

        // LocalStack might not fully support retention policies, so make this lenient
        if (!isLocalStack) {
          expect(logGroup?.retentionInDays).toBeDefined();
        }
      }
    });
  });

  describe('End-to-End Security Validation', () => {
    test('Resources are properly tagged for governance', async () => {
      const expectedTags = {
        Environment: environmentSuffix,
        Project: 'SecureEnvironment',
        Owner: 'InfrastructureTeam',
      };

      // Check VPC tags
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.VpcId] })
      );
      const vpcTags = vpcResponse.Vpcs?.[0]?.Tags || [];

      // LocalStack may not fully support tag propagation, so we check if tags exist
      // rather than strict equality
      if (isLocalStack) {
        // For LocalStack, just verify the VPC exists and has some tags
        expect(vpcResponse.Vpcs?.[0]).toBeDefined();
        // Tags might not propagate in LocalStack, skip strict tag validation
      } else {
        Object.entries(expectedTags).forEach(([key, value]) => {
          const tag = vpcTags.find(t => t.Key === key);
          expect(tag?.Value).toBe(value);
        });
      }

      // Check EC2 instance tags
      const instanceResponse = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [outputs.PrivateInstanceId],
        })
      );
      const instanceTags =
        instanceResponse.Reservations?.[0]?.Instances?.[0]?.Tags || [];

      if (isLocalStack) {
        // For LocalStack, just verify the instance exists
        expect(instanceResponse.Reservations?.[0]?.Instances?.[0]).toBeDefined();
        // Tags might not propagate in LocalStack, skip strict tag validation
      } else {
        Object.entries(expectedTags).forEach(([key, value]) => {
          const tag = instanceTags.find(t => t.Key === key);
          expect(tag?.Value).toBe(value);
        });
      }
    });
  });

});
