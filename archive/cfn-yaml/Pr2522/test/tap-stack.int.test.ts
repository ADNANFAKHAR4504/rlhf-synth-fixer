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
import {
  Route53Client,
  ListHostedZonesByNameCommand,
  ListResourceRecordSetsCommand,
} from '@aws-sdk/client-route-53';

const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

describe('TapStack CloudFormation Integration Tests', () => {
  const rdsClient = new RDSClient({ region });
  const s3Client = new S3Client({ region });
  const cwClient = new CloudWatchClient({ region });
  const ec2Client = new EC2Client({ region });
  const r53Client = new Route53Client({ region });

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
    test('CloudWatch CPU alarm for RDS should be present', async () => {
      const stackName = outputs.StackName;
      const rdsInstanceId = outputs.RDSInstanceIdentifier;
      expect(stackName).toBeDefined();
      expect(rdsInstanceId).toBeDefined();

      const expectedAlarmName = `High-CPU-RDS-${stackName}`;

      const result = await cwClient.send(
        new DescribeAlarmsCommand({ AlarmNames: [expectedAlarmName] })
      );

      const alarm = result.MetricAlarms?.[0];
      expect(alarm).toBeDefined();
      expect(alarm?.AlarmName).toBe(expectedAlarmName);
      expect(alarm?.Namespace).toBe('AWS/RDS');
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

  describe('Route 53 Hosted Zone & Record', () => {
    const dnsName = outputs.RDSDNSName;

    if (!dnsName) {
      test.skip('Skipping Route 53 tests — RDSDNSName not defined in outputs', () => {});
      return;
    }

    test('Hosted zone should exist and match expected domain', async () => {
      const domainName = dnsName.split('.').slice(1).join('.') + '.'; // Remove 'db.' and add trailing dot

      const result = await r53Client.send(
        new ListHostedZonesByNameCommand({ DNSName: domainName })
      );

      const hostedZone = result.HostedZones?.find(zone => zone.Name === domainName);
      expect(hostedZone).toBeDefined();
    });

    test('CNAME record for RDS should exist in hosted zone and match RDS endpoint', async () => {
      const recordName = dnsName + '.';
      const domainName = dnsName.split('.').slice(1).join('.') + '.';

      const hostedZones = await r53Client.send(
        new ListHostedZonesByNameCommand({ DNSName: domainName })
      );
      const hostedZone = hostedZones.HostedZones?.find(zone => zone.Name === domainName);
      expect(hostedZone).toBeDefined();

      const records = await r53Client.send(
        new ListResourceRecordSetsCommand({
          HostedZoneId: hostedZone?.Id,
          StartRecordName: recordName,
        })
      );

      const cnameRecord = records.ResourceRecordSets?.find(
        rec => rec.Type === 'CNAME' && rec.Name === recordName
      );

      expect(cnameRecord).toBeDefined();
      expect(cnameRecord?.ResourceRecords?.[0].Value).toBe(outputs.RDSInstanceEndpoint);
    });
  });
});
