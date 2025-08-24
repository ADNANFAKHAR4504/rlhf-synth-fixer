import fs from 'fs';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
} from '@aws-sdk/client-ec2';

const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

describe('TapStack CloudFormation Integration Tests', () => {
  const rdsClient = new RDSClient({ region });
  const s3Client = new S3Client({ region });
  const cwClient = new CloudWatchClient({ region });
  const ec2Client = new EC2Client({ region });

  describe('RDS Instance', () => {
    test('RDS instance should be available and accessible', async () => {
      const dbInstanceIdentifier = outputs.RDSInstanceIdentifier;
      expect(dbInstanceIdentifier).toBeDefined();

      const result = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbInstanceIdentifier })
      );

      const db = result.DBInstances?.[0];
      expect(db).toBeDefined();
      expect(db?.DBInstanceStatus).toBe('available');
      expect(db?.Endpoint?.Address).toBe(outputs.RDSInstanceEndpoint);
    });
  });

  describe('S3 Logging Bucket', () => {
    test('S3 log bucket should exist and be accessible', async () => {
      const bucketName = outputs.LoggingBucket;
      expect(bucketName).toBeDefined();

      const result = await s3Client.send(
        new HeadBucketCommand({ Bucket: bucketName })
      );

      expect(result.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('CloudWatch Alarm', () => {
    test('CloudWatch CPU alarm should be present', async () => {
      const stackName = outputs.StackName;
      expect(stackName).toBeDefined();

      const expectedAlarmName = `High-CPU-EC2-${stackName}`;

      const result = await cwClient.send(
        new DescribeAlarmsCommand({ AlarmNames: [expectedAlarmName] })
      );

      const alarm = result.MetricAlarms?.[0];
      expect(alarm).toBeDefined();
      expect(alarm?.AlarmName).toBe(expectedAlarmName);
      expect(alarm?.MetricName).toBe('CPUUtilization');
      expect(alarm?.Threshold).toBe(80);
    });
  });

  describe('VPC & Subnets', () => {
    test('VPC should exist', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const result = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      expect(result.Vpcs?.[0]).toBeDefined();
    });

    test('Private subnets should exist', async () => {
      const subnetIds = outputs.PrivateSubnets.split(',');
      expect(subnetIds.length).toBeGreaterThanOrEqual(2);

      const result = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );

      expect(result.Subnets?.length).toBe(subnetIds.length);

      result.Subnets?.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.VPCId);
      });
    });
  });
});
