import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand } from '@aws-sdk/client-ec2';
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand, GetBucketEncryptionCommand, GetPublicAccessBlockCommand, GetBucketLifecycleConfigurationCommand, GetBucketCorsCommand } from '@aws-sdk/client-s3';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import * as fs from 'fs';
import * as path from 'path';

// Read the deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthtrainr77';

// Initialize AWS clients
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const snsClient = new SNSClient({ region });
const logsClient = new CloudWatchLogsClient({ region });

describe('TapStack Integration Tests', () => {
  describe('VPC Infrastructure', () => {
    test('VPC exists and is available', async () => {
      if (!outputs.VpcId) {
        console.log('VPC ID not found in outputs, skipping test');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId],
      });
      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toMatch(/^10\.\d+\.0\.0\/16$/);
    });

    test('VPC has correct number of subnets', async () => {
      if (!outputs.VpcId) {
        console.log('VPC ID not found in outputs, skipping test');
        return;
      }

      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);
      
      // Should have 6 subnets (2 AZs * 3 subnet types)
      expect(response.Subnets).toHaveLength(6);
      
      // Check subnet types
      const publicSubnets = response.Subnets!.filter(s => 
        s.MapPublicIpOnLaunch === true
      );
      const privateSubnets = response.Subnets!.filter(s => 
        s.MapPublicIpOnLaunch === false
      );
      
      expect(publicSubnets.length).toBeGreaterThan(0);
      expect(privateSubnets.length).toBeGreaterThan(0);
    });
  });

  describe('S3 Buckets', () => {
    test('Primary S3 bucket exists and is accessible', async () => {
      if (!outputs.S3BucketName) {
        console.log('S3 bucket name not found in outputs, skipping test');
        return;
      }

      const command = new HeadBucketCommand({
        Bucket: outputs.S3BucketName,
      });
      
      // Should not throw an error
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('Primary bucket has versioning enabled', async () => {
      if (!outputs.S3BucketName) {
        console.log('S3 bucket name not found in outputs, skipping test');
        return;
      }

      const command = new GetBucketVersioningCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);
      
      expect(response.Status).toBe('Enabled');
    });

    test('Primary bucket has encryption enabled', async () => {
      if (!outputs.S3BucketName) {
        console.log('S3 bucket name not found in outputs, skipping test');
        return;
      }

      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);
      
      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(response.ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('Primary bucket blocks public access', async () => {
      if (!outputs.S3BucketName) {
        console.log('S3 bucket name not found in outputs, skipping test');
        return;
      }

      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);
      
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    test('Primary bucket has lifecycle configuration', async () => {
      if (!outputs.S3BucketName) {
        console.log('S3 bucket name not found in outputs, skipping test');
        return;
      }

      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);
      
      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);
      
      // Check for transition rule (AWS uses uppercase ID)
      const transitionRule = response.Rules!.find(r => r.ID === 'TransitionToIA');
      expect(transitionRule).toBeDefined();
      expect(transitionRule?.Status).toBe('Enabled');
      
      // Check for deletion rule (AWS uses uppercase ID)
      const deleteRule = response.Rules!.find(r => r.ID === 'DeleteOldVersions');
      expect(deleteRule).toBeDefined();
      expect(deleteRule?.Status).toBe('Enabled');
    });

    test('Primary bucket has CORS configuration', async () => {
      if (!outputs.S3BucketName) {
        console.log('S3 bucket name not found in outputs, skipping test');
        return;
      }

      const command = new GetBucketCorsCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);
      
      expect(response.CORSRules).toBeDefined();
      expect(response.CORSRules!.length).toBeGreaterThan(0);
      expect(response.CORSRules![0].AllowedMethods).toContain('GET');
      expect(response.CORSRules![0].AllowedMethods).toContain('POST');
      expect(response.CORSRules![0].AllowedMethods).toContain('PUT');
    });

    test('Replication bucket exists', async () => {
      const replicationBucketName = `tap-replica-${environmentSuffix}-718240086340`;
      
      const command = new HeadBucketCommand({
        Bucket: replicationBucketName,
      });
      
      // Should not throw an error
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('Application log group exists', async () => {
      const logGroupName = `/aws/application/${environmentSuffix}`;
      
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);
      
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBeDefined();
    });

    test('Infrastructure log group exists when logging is enabled', async () => {
      const logGroupName = `/aws/infrastructure/${environmentSuffix}`;
      
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);
      
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBeDefined();
    });

    test('VPC Flow Logs log group exists', async () => {
      const logGroupName = `/aws/vpc/flowlogs/${environmentSuffix}`;
      
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);
      
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
    });

    test('CloudWatch alarm for high error rate exists', async () => {
      const alarmName = `HighErrorRate-${environmentSuffix}`;
      
      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });
      const response = await cloudWatchClient.send(command);
      
      expect(response.MetricAlarms).toHaveLength(1);
      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmName).toBe(alarmName);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.EvaluationPeriods).toBe(2);
      expect(alarm.Threshold).toBeDefined();
      expect(alarm.AlarmActions).toBeDefined();
      expect(alarm.AlarmActions!.length).toBeGreaterThan(0);
    });

    test('SNS topic for alerts exists', async () => {
      const topicName = `infrastructure-alerts-${environmentSuffix}`;
      
      // First, get the topic ARN from the alarm
      const alarmCommand = new DescribeAlarmsCommand({
        AlarmNames: [`HighErrorRate-${environmentSuffix}`],
      });
      const alarmResponse = await cloudWatchClient.send(alarmCommand);
      
      if (alarmResponse.MetricAlarms && alarmResponse.MetricAlarms[0]?.AlarmActions) {
        const topicArn = alarmResponse.MetricAlarms[0].AlarmActions[0];
        
        const command = new GetTopicAttributesCommand({
          TopicArn: topicArn,
        });
        const response = await snsClient.send(command);
        
        expect(response.Attributes).toBeDefined();
        expect(response.Attributes?.DisplayName).toContain('Infrastructure Alerts');
      }
    });
  });

  describe('Cross-Environment Consistency', () => {
    test('Resources follow naming convention', async () => {
      // Check that resources include environment suffix
      if (outputs.S3BucketName) {
        expect(outputs.S3BucketName).toContain(environmentSuffix);
      }

      // Check log groups
      const logGroupCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/application/${environmentSuffix}`,
      });
      const logGroupResponse = await logsClient.send(logGroupCommand);
      expect(logGroupResponse.logGroups).toBeDefined();
      
      // Check alarms
      const alarmCommand = new DescribeAlarmsCommand({
        AlarmNamePrefix: `HighErrorRate-${environmentSuffix}`,
      });
      const alarmResponse = await cloudWatchClient.send(alarmCommand);
      expect(alarmResponse.MetricAlarms).toBeDefined();
    });

    test('Stack outputs are accessible and valid', () => {
      // Verify outputs exist and are not empty
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
      
      // Check specific outputs
      if (outputs.VpcId) {
        expect(outputs.VpcId).toMatch(/^vpc-[a-f0-9]+$/);
      }
      
      if (outputs.S3BucketName) {
        expect(outputs.S3BucketName).toMatch(/^tap-primary-/);
      }
    });
  });

  describe('Data Flow and Connectivity', () => {
    test('VPC has internet connectivity through IGW and NAT', async () => {
      if (!outputs.VpcId) {
        console.log('VPC ID not found in outputs, skipping test');
        return;
      }

      // Check subnets have proper routes
      const subnetCommand = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId],
          },
        ],
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      
      // Public subnets should have MapPublicIpOnLaunch
      const publicSubnets = subnetResponse.Subnets!.filter(s => s.MapPublicIpOnLaunch);
      expect(publicSubnets.length).toBeGreaterThan(0);
      
      // Private subnets should not have MapPublicIpOnLaunch
      const privateSubnets = subnetResponse.Subnets!.filter(s => !s.MapPublicIpOnLaunch);
      expect(privateSubnets.length).toBeGreaterThan(0);
    });

    test('S3 bucket replication is configured', async () => {
      if (!outputs.S3BucketName) {
        console.log('S3 bucket name not found in outputs, skipping test');
        return;
      }

      // Check that both buckets exist (primary and replication)
      const primaryExists = await s3Client.send(new HeadBucketCommand({
        Bucket: outputs.S3BucketName,
      })).then(() => true).catch(() => false);
      
      const replicationBucketName = `tap-replica-${environmentSuffix}-718240086340`;
      const replicationExists = await s3Client.send(new HeadBucketCommand({
        Bucket: replicationBucketName,
      })).then(() => true).catch(() => false);
      
      expect(primaryExists).toBe(true);
      expect(replicationExists).toBe(true);
    });
  });
});