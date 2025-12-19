import * as fs from 'fs';
import * as path from 'path';
import {
  DynamoDBClient,
  DescribeTableCommand,
  DescribeContinuousBackupsCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketReplicationCommand,
} from '@aws-sdk/client-s3';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeTargetGroupsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  Route53Client,
  ListHostedZonesByNameCommand,
} from '@aws-sdk/client-route-53';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';

describe('TAP Stack Integration Tests - Multi-Region DR', () => {
  let outputs: any;
  const primaryRegion = 'us-east-1';
  const secondaryRegion = 'us-west-2';

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error('Deployment outputs not found at cfn-outputs/flat-outputs.json. Please deploy first.');
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  });

  describe('Deployment Outputs Validation', () => {
    it('should have all required outputs', () => {
      expect(outputs).toHaveProperty('primaryVpcId');
      expect(outputs).toHaveProperty('secondaryVpcId');
      expect(outputs).toHaveProperty('dynamoTableName');
      expect(outputs).toHaveProperty('primaryBucketName');
      expect(outputs).toHaveProperty('secondaryBucketName');
    });

    it('should have valid VPC IDs', () => {
      expect(outputs.primaryVpcId).toMatch(/^vpc-[a-f0-9]+$/);
      expect(outputs.secondaryVpcId).toMatch(/^vpc-[a-f0-9]+$/);
      expect(outputs.primaryVpcId).not.toEqual(outputs.secondaryVpcId);
    });

    it('should differentiate primary and secondary buckets', () => {
      expect(outputs.primaryBucketName).not.toEqual(outputs.secondaryBucketName);
    });
  });

  describe('VPC Configuration - Primary Region', () => {
    const ec2Client = new EC2Client({ region: primaryRegion });

    it('should have VPC in primary region', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.primaryVpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].VpcId).toEqual(outputs.primaryVpcId);
      expect(response.Vpcs![0].State).toEqual('available');
    });

    it('should have multiple subnets in primary region', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.primaryVpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets!.length).toBeGreaterThanOrEqual(3);
      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3); // Multiple AZs
    });
  });

  describe('VPC Configuration - Secondary Region', () => {
    const ec2Client = new EC2Client({ region: secondaryRegion });

    it('should have VPC in secondary region', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.secondaryVpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].VpcId).toEqual(outputs.secondaryVpcId);
      expect(response.Vpcs![0].State).toEqual('available');
    });

    it('should have multiple subnets in secondary region', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.secondaryVpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets!.length).toBeGreaterThanOrEqual(3);
      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3); // Multiple AZs
    });
  });

  describe('DynamoDB Global Table', () => {
    const dynamoClient = new DynamoDBClient({ region: primaryRegion });

    it('should exist and be active', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.dynamoTableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table!.TableName).toEqual(outputs.dynamoTableName);
      expect(response.Table!.TableStatus).toEqual('ACTIVE');
    });

    it('should have point-in-time recovery enabled', async () => {
      const command = new DescribeContinuousBackupsCommand({
        TableName: outputs.dynamoTableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.ContinuousBackupsDescription!.PointInTimeRecoveryDescription!.PointInTimeRecoveryStatus).toEqual('ENABLED');
    });

    it('should have global table configuration', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.dynamoTableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table!.Replicas).toBeDefined();
      expect(response.Table!.Replicas!.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('S3 Buckets - Primary Region', () => {
    const s3Client = new S3Client({ region: primaryRegion });

    it('should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.primaryBucketName,
      });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    it('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.primaryBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Status).toEqual('Enabled');
    });

    it('should have replication configured', async () => {
      const command = new GetBucketReplicationCommand({
        Bucket: outputs.primaryBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.ReplicationConfiguration).toBeDefined();
      expect(response.ReplicationConfiguration!.Rules).toBeDefined();
      expect(response.ReplicationConfiguration!.Rules!.length).toBeGreaterThan(0);
      expect(response.ReplicationConfiguration!.Rules![0].Status).toEqual('Enabled');
    });

    it('should have replication to secondary region', async () => {
      const command = new GetBucketReplicationCommand({
        Bucket: outputs.primaryBucketName,
      });
      const response = await s3Client.send(command);

      const rule = response.ReplicationConfiguration!.Rules![0];
      expect(rule.Destination!.Bucket).toContain(outputs.secondaryBucketName);
    });
  });

  describe('S3 Buckets - Secondary Region', () => {
    const s3Client = new S3Client({ region: secondaryRegion });

    it('should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.secondaryBucketName,
      });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    it('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.secondaryBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Status).toEqual('Enabled');
    });
  });

  describe('Application Load Balancers - Primary Region', () => {
    const elbClient = new ElasticLoadBalancingV2Client({ region: primaryRegion });

    it('should have target group configured', async () => {
      const command = new DescribeTargetGroupsCommand({
        Names: [`tg-pri-synthn4i3p`],
      });
      const response = await elbClient.send(command);

      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups!.length).toBeGreaterThan(0);
      expect(response.TargetGroups![0].TargetType).toEqual('lambda');
    });
  });

  describe('Application Load Balancers - Secondary Region', () => {
    const elbClient = new ElasticLoadBalancingV2Client({ region: secondaryRegion });

    it('should have target group configured', async () => {
      const command = new DescribeTargetGroupsCommand({
        Names: [`tg-sec-synthn4i3p`],
      });
      const response = await elbClient.send(command);

      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups!.length).toBeGreaterThan(0);
      expect(response.TargetGroups![0].TargetType).toEqual('lambda');
    });
  });

  describe('Route53 Failover Configuration', () => {
    const route53Client = new Route53Client({ region: 'us-east-1' }); // Route53 is global but accessed via us-east-1

    it('should have hosted zone created', async () => {
      const command = new ListHostedZonesByNameCommand({
        DNSName: 'testing.dr-n4i3p2v4.com',
        MaxItems: 1,
      });
      const response = await route53Client.send(command);

      expect(response.HostedZones).toBeDefined();
      expect(response.HostedZones!.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Alarms', () => {
    const cloudwatchClient = new CloudWatchClient({ region: primaryRegion });

    it('should have health monitoring alarms', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'dr-health',
      });
      const response = await cloudwatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);
    });
  });

  describe('Cross-Region Disaster Recovery Validation', () => {
    it('should have resources in both regions', () => {
      expect(outputs.primaryVpcId).toBeDefined();
      expect(outputs.secondaryVpcId).toBeDefined();
      expect(outputs.primaryBucketName).toBeDefined();
      expect(outputs.secondaryBucketName).toBeDefined();
    });

    it('should have DynamoDB global table spanning regions', async () => {
      const dynamoClient = new DynamoDBClient({ region: primaryRegion });
      const command = new DescribeTableCommand({
        TableName: outputs.dynamoTableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table!.Replicas).toBeDefined();
      expect(response.Table!.Replicas!.length).toBeGreaterThanOrEqual(1);
    });
  });
});
