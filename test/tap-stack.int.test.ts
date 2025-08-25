// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import { EC2Client, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { IAMClient, GetRoleCommand, GetInstanceProfileCommand } from '@aws-sdk/client-iam';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

const region = process.env.AWS_REGION || 'us-east-1';

const ec2 = new EC2Client({ region });
const iam = new IAMClient({ region });
const sns = new SNSClient({ region });
const logs = new CloudWatchLogsClient({ region });
const s3 = new S3Client({ region });

describe('Turn Around Prompt API Integration Tests', () => {
  describe('Write Integration TESTS', () => {
    test('Dont forget!', async () => {
      expect(true).toBe(true);
    });
  });
});

describe('TapStack CloudFormation Outputs Integration', () => {
  const expectedOutputs = [
    'S3AccessLogGroupName',
    'ApplicationSecurityGroupId',
    'ConfigRoleArn',
    'SecurityAlertsTopicArn',
    'DatabaseSubnetGroupName',
    'DatabaseSecurityGroupId',
    'EC2InstanceProfileArn',
    'VPCFlowLogsGroupName',
    'ConfigBucketName',
  ];

  test('should have all required outputs', () => {
    expectedOutputs.forEach(key => {
      expect(outputs[key]).toBeDefined();
      expect(outputs[key]).not.toBe('');
    });
  });

  test('S3AccessLogGroupName should be a valid log group name', () => {
    expect(outputs.S3AccessLogGroupName).toMatch(/^\/aws\/s3\//);
  });

  test('ApplicationSecurityGroupId should be a valid security group id', () => {
    expect(outputs.ApplicationSecurityGroupId).toMatch(/^sg-[a-f0-9]{17}$/);
  });

  test('ConfigRoleArn should be a valid IAM role ARN', () => {
    expect(outputs.ConfigRoleArn).toMatch(/^arn:aws:iam::\d{12}:role\//);
  });

  test('SecurityAlertsTopicArn should be a valid SNS topic ARN', () => {
    expect(outputs.SecurityAlertsTopicArn).toMatch(/^arn:aws:sns:[a-z0-9-]+:\d{12}:/);
  });

  test('DatabaseSubnetGroupName should be a non-empty string', () => {
    expect(typeof outputs.DatabaseSubnetGroupName).toBe('string');
    expect(outputs.DatabaseSubnetGroupName.length).toBeGreaterThan(0);
  });

  test('DatabaseSecurityGroupId should be a valid security group id', () => {
    expect(outputs.DatabaseSecurityGroupId).toMatch(/^sg-[a-f0-9]{17}$/);
  });

  test('EC2InstanceProfileArn should be a valid instance profile ARN', () => {
    expect(outputs.EC2InstanceProfileArn).toMatch(/^arn:aws:iam::\d{12}:instance-profile\//);
  });

  test('VPCFlowLogsGroupName should be a valid log group name', () => {
    expect(outputs.VPCFlowLogsGroupName).toMatch(/^\/aws\/vpc\/flowlogs\//);
  });

  test('ConfigBucketName should be a valid S3 bucket name', () => {
    expect(typeof outputs.ConfigBucketName).toBe('string');
    expect(outputs.ConfigBucketName.length).toBeGreaterThan(0);
    expect(outputs.ConfigBucketName).toMatch(/^tapstack2215-production-config-/);
  });
});

describe('TapStack CloudFormation Outputs Live Integration', () => {
  test('ApplicationSecurityGroupId exists in EC2', async () => {
    const resp = await ec2.send(new DescribeSecurityGroupsCommand({
      GroupIds: [outputs.ApplicationSecurityGroupId],
    }));
    expect(resp.SecurityGroups?.length).toBe(1);
    expect(resp.SecurityGroups?.[0].GroupId).toBe(outputs.ApplicationSecurityGroupId);
  });

  test('DatabaseSecurityGroupId exists in EC2', async () => {
    const resp = await ec2.send(new DescribeSecurityGroupsCommand({
      GroupIds: [outputs.DatabaseSecurityGroupId],
    }));
    expect(resp.SecurityGroups?.length).toBe(1);
    expect(resp.SecurityGroups?.[0].GroupId).toBe(outputs.DatabaseSecurityGroupId);
  });

  test('ConfigRoleArn exists in IAM', async () => {
    const roleName = outputs.ConfigRoleArn.split('/').pop();
    const resp = await iam.send(new GetRoleCommand({ RoleName: roleName }));
    expect(resp.Role).toBeDefined();
    expect(resp.Role?.Arn).toBe(outputs.ConfigRoleArn);
  });

  test('EC2InstanceProfileArn exists in IAM', async () => {
    const profileName = outputs.EC2InstanceProfileArn.split('/').pop();
    const resp = await iam.send(new GetInstanceProfileCommand({ InstanceProfileName: profileName }));
    expect(resp.InstanceProfile).toBeDefined();
    expect(resp.InstanceProfile?.Arn).toBe(outputs.EC2InstanceProfileArn);
  });

  test('SecurityAlertsTopicArn exists in SNS', async () => {
    const resp = await sns.send(new GetTopicAttributesCommand({ TopicArn: outputs.SecurityAlertsTopicArn }));
    expect(resp.Attributes?.TopicArn).toBe(outputs.SecurityAlertsTopicArn);
  });

  test('S3AccessLogGroupName exists in CloudWatch Logs', async () => {
    const resp = await logs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: outputs.S3AccessLogGroupName }));
    const found = resp.logGroups?.some(lg => lg.logGroupName === outputs.S3AccessLogGroupName);
    expect(found).toBe(true);
  });

  test('VPCFlowLogsGroupName exists in CloudWatch Logs', async () => {
    const resp = await logs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: outputs.VPCFlowLogsGroupName }));
    const found = resp.logGroups?.some(lg => lg.logGroupName === outputs.VPCFlowLogsGroupName);
    expect(found).toBe(true);
  });

  test('ConfigBucketName exists in S3', async () => {
    await expect(s3.send(new HeadBucketCommand({ Bucket: outputs.ConfigBucketName }))).resolves.toBeDefined();
  });
});
