import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { GetTopicAttributesCommand, SNSClient } from '@aws-sdk/client-sns';
import fs from 'fs';
import path from 'path';

// This function will now ALWAYS fetch outputs from AWS to ensure data is not stale.
const getStackOutputs = async (stackName: string, region: string) => {
  console.log(`Fetching latest outputs for stack: ${stackName}...`);
  const client = new CloudFormationClient({ region });
  const command = new DescribeStacksCommand({ StackName: stackName });
  const response = await client.send(command);

  if (!response.Stacks || response.Stacks.length === 0) {
    throw new Error(`Stack '${stackName}' not found in region ${region}.`);
  }

  const outputs = response.Stacks[0].Outputs || [];
  if (outputs.length === 0) {
    throw new Error(`Stack '${stackName}' has no outputs.`);
  }

  const flatOutputs = outputs.reduce<{ [key: string]: string | undefined }>(
    (acc, output) => {
      if (output.OutputKey) {
        acc[output.OutputKey] = output.OutputValue;
      }
      return acc;
    },
    {}
  );

  // Create directory and write the file for caching/inspection.
  const dir = path.join(__dirname, '../../cfn-outputs');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  const outputPath = path.join(dir, 'flat-outputs.json');
  fs.writeFileSync(outputPath, JSON.stringify(flatOutputs, null, 2));
  console.log(`✅ Successfully generated outputs at ${outputPath}`);

  return flatOutputs;
};

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;

let outputs: any;
// Initialize clients in the global scope
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const snsClient = new SNSClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });

describe('Secure Cloud Infrastructure Integration Tests', () => {
  beforeAll(async () => {
    outputs = await getStackOutputs(stackName, region);
  });

  describe('Networking and Security', () => {
    test('VPC should be available and correctly tagged', async () => {
      const command = new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] });
      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];
      expect(vpc?.State).toBe('available');

      // Verify resource tags
      const companyTag = vpc?.Tags?.find(t => t.Key === 'Company');
      const envTag = vpc?.Tags?.find(t => t.Key === 'Environment');
      expect(companyTag?.Value).toBe(outputs.CompanyNameOutput);
      expect(envTag?.Value).toBe(outputs.EnvironmentOutput);
    });

    test('All subnets should be available', async () => {
      const subnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
      ];
      const command = new DescribeSubnetsCommand({ SubnetIds: subnetIds });
      const response = await ec2Client.send(command);
      expect(response.Subnets?.length).toBe(4);
      response.Subnets?.forEach(subnet => {
        expect(subnet.State).toBe('available');
      });
    });

    test('Bastion host security group should have no inbound rules', async () => {
      // In a real scenario, you might get the SG ID from outputs or lookup by tags.
      // For this example, we'll assume a naming convention.
      const sgName = `${outputs.CompanyNameOutput}-${outputs.EnvironmentOutput}-Bastion-SG`;
      const command = new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'group-name', Values: [sgName] }],
      });
      const response = await ec2Client.send(command);
      const sg = response.SecurityGroups?.[0];
      expect(sg).toBeDefined();
      expect(sg?.IpPermissions?.length).toBe(0);
    });

    test('Private instance security group should not allow SSH', async () => {
      const sgName = `${outputs.CompanyNameOutput}-${outputs.EnvironmentOutput}-Private-Instance-SG`;
      const command = new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'group-name', Values: [sgName] }],
      });
      const response = await ec2Client.send(command);
      const sg = response.SecurityGroups?.[0];
      expect(sg).toBeDefined();
      const sshRule = sg?.IpPermissions?.find(rule => rule.FromPort === 22);
      expect(sshRule).toBeUndefined();
    });
  });

  describe('Compute Resources', () => {
    test('All EC2 instances should be running and correctly tagged', async () => {
      const instanceIds = [
        outputs.BastionHostId,
        outputs.PrivateInstance1Id,
        outputs.PrivateInstance2Id,
      ];
      const command = new DescribeInstancesCommand({
        InstanceIds: instanceIds,
      });
      const response = await ec2Client.send(command);
      const instances = response.Reservations?.flatMap(r => r.Instances || []);
      expect(instances?.length).toBe(3);

      instances?.forEach(instance => {
        expect(instance?.State?.Name).toBe('running');

        // Verify resource tags
        const companyTag = instance?.Tags?.find(t => t.Key === 'Company');
        const envTag = instance?.Tags?.find(t => t.Key === 'Environment');
        expect(companyTag?.Value).toBe(outputs.CompanyNameOutput);
        expect(envTag?.Value).toBe(outputs.EnvironmentOutput);
      });
    });
  });

  describe('Storage', () => {
    test('Application S3 bucket should have AES256 encryption', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.ApplicationBucketName,
      });
      const response = await s3Client.send(command);
      const sseRule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(sseRule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
        'AES256'
      );
    });

    test('Logging S3 bucket should block all public access', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.LoggingBucketName,
      });
      const response = await s3Client.send(command);
      const config = response.PublicAccessBlockConfiguration;
      expect(config).toBeDefined();
      expect(config?.BlockPublicAcls).toBe(true);
      expect(config?.BlockPublicPolicy).toBe(true);
      expect(config?.IgnorePublicAcls).toBe(true);
      expect(config?.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Monitoring', () => {
    test('SNS Topic for alarms should exist and have no subscriptions', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.SNSTopicArn,
      });
      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.SubscriptionsPending).toBe('0');
      expect(response.Attributes?.SubscriptionsConfirmed).toBe('0');
    });

    test('CloudWatch Alarms should be correctly configured for all instances', async () => {
      const alarmNames = [
        `${outputs.CompanyNameOutput}-${outputs.EnvironmentOutput}-Bastion-CPU-High`,
        `${outputs.CompanyNameOutput}-${outputs.EnvironmentOutput}-Private-Instance-1-CPU-High`,
        `${outputs.CompanyNameOutput}-${outputs.EnvironmentOutput}-Private-Instance-2-CPU-High`,
      ];
      const instanceIds = [
        outputs.BastionHostId,
        outputs.PrivateInstance1Id,
        outputs.PrivateInstance2Id,
      ];

      const command = new DescribeAlarmsCommand({ AlarmNames: alarmNames });
      const response = await cloudWatchClient.send(command);

      const alarms = response.MetricAlarms;
      expect(alarms).toBeDefined();
      expect(alarms?.length).toBe(3);

      // Verify each alarm's configuration
      alarms?.forEach(alarm => {
        expect(alarm.MetricName).toBe('CPUUtilization');
        expect(alarm.Namespace).toBe('AWS/EC2');
        expect(alarm.Statistic).toBe('Average');
        expect(alarm.Threshold).toBe(80);
        expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
        expect(alarm.AlarmActions).toContain(outputs.SNSTopicArn);

        // Check that the alarm is monitoring one of our instances
        const alarmInstanceId = alarm.Dimensions?.find(
          d => d.Name === 'InstanceId'
        )?.Value;
        expect(instanceIds).toContain(alarmInstanceId);
      });
    });
  });
});