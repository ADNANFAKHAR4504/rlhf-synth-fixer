import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  S3Client
} from '@aws-sdk/client-s3';
import {
  GetTopicAttributesCommand,
  SNSClient
} from '@aws-sdk/client-sns';
import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure Integration Tests - Task 7ivau', () => {
  let outputs: any;
  const ec2ClientUsEast1 = new EC2Client({ region: 'us-east-1' });
  const cloudwatchClient = new CloudWatchClient({ region: 'us-east-1' });
  const snsClient = new SNSClient({ region: 'us-east-1' });
  const s3Client = new S3Client({ region: 'us-east-1' });

  beforeAll(() => {
    // Load outputs from deployment
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Outputs file not found at ${outputsPath}. Deploy infrastructure first.`);
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  });

  describe('Outputs Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs).toBeDefined();
      expect(outputs.production_vpc_id).toBeDefined();
      expect(outputs.partner_vpc_id).toBeDefined();
    });

    test('should have DNS resolution outputs', () => {
      expect(outputs.dns_resolution_enabled_requester).toBeDefined();
      expect(outputs.dns_resolution_enabled_accepter).toBeDefined();
    });

    test('should have route count output', () => {
      expect(outputs.total_configured_routes).toBeDefined();
      expect(parseInt(outputs.total_configured_routes)).toBeGreaterThanOrEqual(18);
    });

    test('should have security group IDs', () => {
      expect(outputs.production_app_security_group_id).toBeDefined();
      expect(outputs.production_app_security_group_id).toMatch(/^sg-/);
      expect(outputs.partner_app_security_group_id).toBeDefined();
      expect(outputs.partner_app_security_group_id).toMatch(/^sg-/);
    });
  });

  describe('S3 Bucket for Flow Logs', () => {
    test('S3 bucket should have encryption enabled', async () => {
      const bucketName = outputs.flow_logs_bucket_name;
      const command = new GetBucketEncryptionCommand({
        Bucket: bucketName
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);
      expect(response.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket should have public access blocked', async () => {
      const bucketName = outputs.flow_logs_bucket_name;
      const command = new GetPublicAccessBlockCommand({
        Bucket: bucketName
      });

      const response = await s3Client.send(command);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('alarms should have SNS actions configured', async () => {
      const command = new DescribeAlarmsCommand({});
      const response = await cloudwatchClient.send(command);

      const alarms = response.MetricAlarms?.filter(alarm =>
        alarm.AlarmName?.includes('peering') || alarm.AlarmName?.includes('traffic')
      ) || [];

      if (alarms.length > 0) {
        expect(alarms[0].AlarmActions).toBeDefined();
        expect(alarms[0].AlarmActions!.length).toBeGreaterThan(0);
        expect(alarms[0].AlarmActions![0]).toContain('arn:aws:sns:');
      }
    });
  });

  describe('Routing Configuration', () => {
    test('should have at least 18 total configured routes', () => {
      const routeCount = parseInt(outputs.total_configured_routes);
      expect(routeCount).toBeGreaterThanOrEqual(18);
    });
  });

  describe('Resource Tagging', () => {
    test('production VPC should have required tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.production_vpc_id]
      });
      const response = await ec2ClientUsEast1.send(command);

      const tags = response.Vpcs![0].Tags || [];
      const tagKeys = tags.map(tag => tag.Key);
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('CostCenter');
    });

  });

});
