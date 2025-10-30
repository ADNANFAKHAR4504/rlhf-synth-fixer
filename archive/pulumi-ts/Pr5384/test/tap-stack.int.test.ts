import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
} from '@aws-sdk/client-ec2';
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand } from '@aws-sdk/client-s3';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

/**
 * Integration tests for TapStack
 *
 * These tests verify that the deployed infrastructure works correctly
 * by testing against actual AWS resources using outputs from the deployment.
 */

describe('TapStack Integration Tests', () => {
  let outputs: any;
  let region: string;

  beforeAll(() => {
    // Load outputs from flat-outputs.json
    const outputsPath = path.join(
      process.cwd(),
      'cfn-outputs',
      'flat-outputs.json'
    );

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Outputs file not found at ${outputsPath}. Run deployment first.`
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    region = process.env.AWS_REGION || 'ap-northeast-1';

    console.log('Loaded outputs:', Object.keys(outputs));
  });

  describe('VPC and Networking', () => {
    let ec2Client: EC2Client;

    beforeAll(() => {
      ec2Client = new EC2Client({ region });
    });

    it('should have a VPC deployed', async () => {
      expect(outputs.vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });

      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs![0].State).toBe('available');
    });

    it('should have public and private subnets', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(4);

      // Verify CIDR blocks
      const cidrBlocks = response.Subnets!.map((subnet) => subnet.CidrBlock);
      expect(cidrBlocks).toContain('10.0.1.0/24');
      expect(cidrBlocks).toContain('10.0.2.0/24');
      expect(cidrBlocks).toContain('10.0.11.0/24');
      expect(cidrBlocks).toContain('10.0.12.0/24');
    });
  });

  describe('S3 Bucket', () => {
    let s3Client: S3Client;

    beforeAll(() => {
      s3Client = new S3Client({ region });
    });

    it('should have an S3 bucket deployed', async () => {
      expect(outputs.s3BucketName).toBeDefined();

      const command = new HeadBucketCommand({
        Bucket: outputs.s3BucketName,
      });

      // If bucket exists, this won't throw an error
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    it('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.s3BucketName,
      });

      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });
  });

  describe('RDS Database', () => {
    let rdsClient: RDSClient;

    beforeAll(() => {
      rdsClient = new RDSClient({ region });
    });

    it('should have an RDS instance deployed and available', async () => {
      expect(outputs.dbEndpoint).toBeDefined();

      // Extract DB identifier from endpoint
      const dbIdentifier = outputs.dbEndpoint.split('.')[0];

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });

      const response = await rdsClient.send(command);

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances?.length).toBe(1);

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('postgres');
      expect(dbInstance.DBInstanceClass).toBe('db.t3.micro');
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.PubliclyAccessible).toBe(false);
    });
  });

  describe('CloudWatch Log Groups', () => {
    let cloudwatchClient: CloudWatchLogsClient;

    beforeAll(() => {
      cloudwatchClient = new CloudWatchLogsClient({ region });
    });

    it('should have application log group created', async () => {
      expect(outputs.appLogGroupName).toBeDefined();

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.appLogGroupName,
      });

      const response = await cloudwatchClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThanOrEqual(1);

      const logGroup = response.logGroups!.find(
        (lg) => lg.logGroupName === outputs.appLogGroupName
      );

      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(7);
    });

    it('should have infrastructure log group created', async () => {
      expect(outputs.infraLogGroupName).toBeDefined();

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.infraLogGroupName,
      });

      const response = await cloudwatchClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThanOrEqual(1);

      const logGroup = response.logGroups!.find(
        (lg) => lg.logGroupName === outputs.infraLogGroupName
      );

      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(7);
    });
  });

  describe('Stack Outputs', () => {
    it('should have all required outputs', () => {
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.albDnsName).toBeDefined();
      expect(outputs.s3BucketName).toBeDefined();
      expect(outputs.dbEndpoint).toBeDefined();
      expect(outputs.appLogGroupName).toBeDefined();
      expect(outputs.infraLogGroupName).toBeDefined();
    });

    it('should have valid output formats', () => {
      // VPC ID should start with vpc-
      expect(outputs.vpcId).toMatch(/^vpc-[a-f0-9]+$/);

      // ALB DNS should end with elb.amazonaws.com
      expect(outputs.albDnsName).toMatch(/\.elb\.amazonaws\.com$/);

      // S3 bucket name should be lowercase and contain environmentSuffix
      expect(outputs.s3BucketName).toMatch(/^[a-z0-9-]+$/);

      // DB endpoint should contain RDS domain
      expect(outputs.dbEndpoint).toContain('.rds.amazonaws.com');

      // Log group names should start with /aws/
      expect(outputs.appLogGroupName).toMatch(/^\/aws\//);
      expect(outputs.infraLogGroupName).toMatch(/^\/aws\//);
    });
  });
});
