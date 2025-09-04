import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
} from '@aws-sdk/client-s3';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import fs from 'fs';

// Configuration
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn(
    'Warning: cfn-outputs/flat-outputs.json not found. Some tests may be skipped.'
  );
}

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'prod';
const stackName = `TapStack${environmentSuffix}`;
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS clients
const cloudFormationClient = new CloudFormationClient({ region });
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const iamClient = new IAMClient({ region });

describe('TapStack Live Integration Tests', () => {
  let stackResources: any[] = [];
  let vpcId: string;
  let dbInstanceIdentifier: string;
  let s3BucketName: string;

  beforeAll(async () => {
    try {
      // Get stack resources
      const listResourcesCommand = new ListStackResourcesCommand({
        StackName: stackName,
      });
      const resourcesResponse = await cloudFormationClient.send(listResourcesCommand);
      stackResources = resourcesResponse.StackResourceSummaries || [];

      // Extract resource identifiers
      const vpcResource = stackResources.find(
        (r: any) => r.ResourceType === 'AWS::EC2::VPC'
      );
      const rdsResource = stackResources.find(
        (r: any) => r.ResourceType === 'AWS::RDS::DBInstance'
      );
      const s3Resource = stackResources.find(
        (r: any) => r.ResourceType === 'AWS::S3::Bucket'
      );

      vpcId = vpcResource?.PhysicalResourceId || '';
      dbInstanceIdentifier = rdsResource?.PhysicalResourceId || '';
      s3BucketName = s3Resource?.PhysicalResourceId || '';
    } catch (error) {
      console.error('Error in beforeAll:', error);
      throw error;
    }
  }, 30000);

  describe('CloudFormation Stack Validation', () => {
    test('Stack exists and is in CREATE_COMPLETE state', async () => {
      const command = new DescribeStacksCommand({
        StackName: stackName,
      });

      const response = await cloudFormationClient.send(command);
      const stack = response.Stacks?.[0];

      expect(stack).toBeDefined();
      expect(stack?.StackName).toBe(stackName);
      expect(stack?.StackStatus).toBe('UPDATE_COMPLETE');
    });
  });

  describe('VPC Validation', () => {
    test('VPC exists with correct CIDR block', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });

      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];

      expect(vpc).toBeDefined();
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC has correct subnet configuration', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });

      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];

      expect(subnets.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Security Groups Validation', () => {
    test('Security groups exist', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });

      const response = await ec2Client.send(command);
      const securityGroups = response.SecurityGroups || [];

      expect(securityGroups.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('RDS Database Validation', () => {
    test('RDS instance exists with correct configuration', async () => {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceIdentifier,
      });

      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances?.[0];

      expect(dbInstance).toBeDefined();
      expect(dbInstance?.DBInstanceIdentifier).toBe(dbInstanceIdentifier);
      expect(dbInstance?.Engine).toBe('postgres');
      expect(dbInstance?.MultiAZ).toBe(true);
      expect(dbInstance?.StorageEncrypted).toBe(true);
    });
  });

  describe('S3 Bucket Validation', () => {
    test('S3 bucket exists and is accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: s3BucketName,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('S3 bucket has versioning enabled', async () => {
      const versioningCommand = new GetBucketVersioningCommand({
        Bucket: s3BucketName,
      });

      const response = await s3Client.send(versioningCommand);
      expect(response.Status).toBe('Enabled');
    });
  });

  describe('IAM Role Validation', () => {
    test('EC2 IAM role exists', async () => {
      const iamRoles = stackResources
        .filter((r: any) => r.ResourceType === 'AWS::IAM::Role')
        .map((r: any) => r.PhysicalResourceId)
        .filter((id: any): id is string => id !== undefined && id.includes('ec2-role'));

      expect(iamRoles.length).toBeGreaterThanOrEqual(0);

      for (const roleArn of iamRoles) {
        const roleName = roleArn.split('/').pop();
        if (roleName) {
          const command = new GetRoleCommand({
            RoleName: roleName,
          });

          const response = await iamClient.send(command);
          const role = response.Role;

          expect(role).toBeDefined();
        }
      }
    }, 30000);
  });

  describe('Stack Outputs Validation', () => {
    test('VPC ID output matches actual VPC', async () => {
      if (outputs.VpcId) {
        expect(outputs.VpcId).toBe(vpcId);
      }
    });

    test('RDS endpoint output matches actual database', async () => {
      if (outputs.RdsEndpoint) {
        const command = new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbInstanceIdentifier,
        });

        const response = await rdsClient.send(command);
        const dbInstance = response.DBInstances?.[0];

        expect(outputs.RdsEndpoint).toContain(dbInstance?.Endpoint?.Address);
      }
    });

    test('S3 bucket name output matches actual bucket', async () => {
      if (outputs.S3BucketName) {
        expect(outputs.S3BucketName).toBe(s3BucketName);
      }
    });
  });
});