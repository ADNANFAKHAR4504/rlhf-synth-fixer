import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketTaggingCommand,
} from '@aws-sdk/client-s3';
import {
  IAMClient,
  GetRoleCommand,
} from '@aws-sdk/client-iam';
import * as fs from 'fs';
import * as path from 'path';

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const ec2Client = new EC2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });

describe('TAP Stack AWS Infrastructure Integration Tests', () => {
  let bastionIp: string;
  let rdsEndpoint: string;
  let bucketName: string;
  let roleName: string;
  let securityGroupId: string;

  beforeAll(() => {
    const suffix = process.env.ENVIRONMENT_SUFFIX;
    if (!suffix) throw new Error('ENVIRONMENT_SUFFIX environment variable is not set.');

    const outputFilePath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }

    const outputs = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));
    const stackKey = Object.keys(outputs).find(k => k.includes(suffix));
    if (!stackKey) throw new Error(`No output found for environment: ${suffix}`);

    const stackOutputs = outputs[stackKey];

    bastionIp = stackOutputs['bastion_public_ip'];
    rdsEndpoint = stackOutputs['rds_instance_endpoint'];
    bucketName = stackOutputs['s3_bucket_name'];
    roleName = stackOutputs['iam_role_name'];
    securityGroupId = stackOutputs['security_group_id'];

    if (!bastionIp || !rdsEndpoint || !bucketName || !roleName || !securityGroupId) {
      throw new Error('Missing one or more required outputs in stack.');
    }
  });

  // Bastion Host EC2
  describe('Bastion Host EC2 Instance', () => {
    test('should be running with correct tags', async () => {
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({
          Filters: [{ Name: 'ip-address', Values: [bastionIp] }],
        })
      );

      const instance = Reservations?.[0]?.Instances?.[0];
      expect(instance).toBeDefined();
      expect(instance?.State?.Name).toBe('running');
      expect(instance?.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Key: 'Name',
            Value: expect.stringContaining('-bastion-host'),
          }),
        ])
      );
    }, 20000);
  });

  // RDS
  describe('RDS PostgreSQL Instance', () => {
    test('should exist and be available', async () => {
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({}));
      const db = DBInstances?.find(d => d.Endpoint?.Address === rdsEndpoint);
      expect(db).toBeDefined();
      expect(db?.Engine).toBe('postgres');
      expect(db?.DBInstanceStatus).toBe('available');
    }, 20000);
  });

  // S3
  describe('S3 Bucket', () => {
    test('should have versioning enabled', async () => {
      const { Status } = await s3Client.send(new GetBucketVersioningCommand({ Bucket: bucketName }));
      expect(Status).toBe('Enabled');
    }, 10000);

    test('should have correct tags', async () => {
      const { TagSet } = await s3Client.send(new GetBucketTaggingCommand({ Bucket: bucketName }));
      expect(TagSet).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Key: 'Environment',
            Value: expect.any(String),
          }),
        ])
      );
    }, 10000);
  });

  // IAM
  describe('IAM Role', () => {
    test('should exist with correct name', async () => {
      const { Role } = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
      expect(Role?.RoleName).toBe(roleName);
      expect(Role?.AssumeRolePolicyDocument).toBeDefined();
    }, 10000);
  });

  // Security Group
  describe('Security Group', () => {
    test('should exist with SSH access', async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] })
      );
      const sg = SecurityGroups?.[0];
      expect(sg).toBeDefined();
      const hasSSH = sg?.IpPermissions?.some(
        perm => perm.FromPort === 22 && perm.ToPort === 22
      );
      expect(hasSSH).toBe(true);
    }, 10000);
  });
});
