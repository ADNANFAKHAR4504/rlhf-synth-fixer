/**
 * Integration tests for Migration Infrastructure
 * Tests real AWS resources deployed by the infrastructure
 * Uses actual deployment outputs - NO MOCKING
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
  DescribeVpcEndpointsCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import {
  IAMClient,
  GetRoleCommand,
  GetInstanceProfileCommand,
  GetRolePolicyCommand,
} from '@aws-sdk/client-iam';

const AWS_REGION = 'us-east-1';
const ec2Client = new EC2Client({ region: AWS_REGION });
const rdsClient = new RDSClient({ region: AWS_REGION });
const s3Client = new S3Client({ region: AWS_REGION });
const iamClient = new IAMClient({ region: AWS_REGION });

describe('Migration Infrastructure Integration Tests', () => {
  let outputs: any;
  const environmentSuffix = 'synth1gtk5t';

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error('Deployment outputs not found. Deploy infrastructure first.');
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  });

  describe('VPC Configuration', () => {
    it('should have VPC deployed with correct CIDR', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs![0].State).toBe('available');
    });

    it('should have DNS support and hostnames enabled', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs![0].EnableDnsSupport).toBe(true);
      expect(response.Vpcs![0].EnableDnsHostnames).toBe(true);
    });

    it('should have correct tags including environment suffix', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });
      const response = await ec2Client.send(command);

      const tags = response.Vpcs![0].Tags || [];
      const nameTag = tags.find((t) => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain(environmentSuffix);

      const envTag = tags.find((t) => t.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag!.Value).toBe('dev');
    });
  });

  describe('Subnet Configuration', () => {
    it('should have public subnets in different AZs', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.publicSubnet1Id, outputs.publicSubnet2Id],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets).toHaveLength(2);

      const azs = response.Subnets!.map((s) => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(2);

      response.Subnets!.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    it('should have private subnets in different AZs', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.privateSubnet1Id, outputs.privateSubnet2Id],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets).toHaveLength(2);

      const azs = response.Subnets!.map((s) => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(2);

      response.Subnets!.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    it('should have correct CIDR blocks for subnets', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const cidrBlocks = response.Subnets!.map((s) => s.CidrBlock);
      expect(cidrBlocks).toContain('10.0.1.0/24');
      expect(cidrBlocks).toContain('10.0.2.0/24');
      expect(cidrBlocks).toContain('10.0.11.0/24');
      expect(cidrBlocks).toContain('10.0.12.0/24');
    });
  });

  describe('NAT Gateway Configuration', () => {
    it('should have NAT gateway in public subnet', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);

      const natGateway = response.NatGateways![0];
      expect(natGateway.State).toBe('available');
      expect([outputs.publicSubnet1Id, outputs.publicSubnet2Id]).toContain(
        natGateway.SubnetId
      );
    });

    it('should have public IP address assigned', async () => {
      expect(outputs.natGatewayPublicIp).toBeDefined();
      expect(outputs.natGatewayPublicIp).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
    });
  });

  describe('VPC Endpoint Configuration', () => {
    it('should have S3 VPC endpoint configured', async () => {
      const command = new DescribeVpcEndpointsCommand({
        VpcEndpointIds: [outputs.s3VpcEndpointId],
      });
      const response = await ec2Client.send(command);

      expect(response.VpcEndpoints).toBeDefined();
      expect(response.VpcEndpoints).toHaveLength(1);

      const endpoint = response.VpcEndpoints![0];
      expect(endpoint.VpcEndpointType).toBe('Gateway');
      expect(endpoint.ServiceName).toContain('s3');
      expect(endpoint.State).toBe('available');
    });
  });

  describe('EC2 Instance Configuration', () => {
    it('should have two EC2 instances running', async () => {
      const command = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
          {
            Name: 'instance-state-name',
            Values: ['running', 'pending'],
          },
          {
            Name: 'tag:Name',
            Values: [`*${environmentSuffix}*`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const instances = response.Reservations!.flatMap((r) => r.Instances || []);
      expect(instances.length).toBe(2);
    });

    it('should have instances in private subnets', async () => {
      const command = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
          {
            Name: 'instance-state-name',
            Values: ['running', 'pending'],
          },
          {
            Name: 'tag:Name',
            Values: [`*${environmentSuffix}*`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const instances = response.Reservations!.flatMap((r) => r.Instances || []);
      instances.forEach((instance) => {
        expect([outputs.privateSubnet1Id, outputs.privateSubnet2Id]).toContain(
          instance.SubnetId
        );
        expect(instance.PublicIpAddress).toBeUndefined();
      });
    });

    it('should use t3.medium instance type', async () => {
      const command = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
          {
            Name: 'instance-state-name',
            Values: ['running', 'pending'],
          },
          {
            Name: 'tag:Name',
            Values: [`*${environmentSuffix}*`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const instances = response.Reservations!.flatMap((r) => r.Instances || []);
      instances.forEach((instance) => {
        expect(instance.InstanceType).toBe('t3.medium');
      });
    });

    it('should have IAM instance profile attached', async () => {
      const command = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
          {
            Name: 'instance-state-name',
            Values: ['running', 'pending'],
          },
          {
            Name: 'tag:Name',
            Values: [`*${environmentSuffix}*`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const instances = response.Reservations!.flatMap((r) => r.Instances || []);
      instances.forEach((instance) => {
        expect(instance.IamInstanceProfile).toBeDefined();
        expect(instance.IamInstanceProfile!.Arn).toContain('ec2-instance-profile');
      });
    });
  });

  describe('Security Group Configuration', () => {
    it('should have EC2 and RDS security groups', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
          {
            Name: 'tag:Name',
            Values: [`*${environmentSuffix}*`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(2);

      const sgNames = response.SecurityGroups!.map((sg) => sg.GroupName);
      const hasEc2Sg = sgNames.some((name) => name!.includes('ec2-sg'));
      const hasRdsSg = sgNames.some((name) => name!.includes('rds-sg'));

      expect(hasEc2Sg).toBe(true);
      expect(hasRdsSg).toBe(true);
    });

    it('should have RDS security group allowing MySQL from EC2 SG', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
          {
            Name: 'group-name',
            Values: [`*rds-sg-${environmentSuffix}*`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(1);

      const rdsSg = response.SecurityGroups![0];
      const mysqlRule = rdsSg.IpPermissions!.find(
        (rule) => rule.FromPort === 3306 && rule.ToPort === 3306
      );

      expect(mysqlRule).toBeDefined();
      expect(mysqlRule!.UserIdGroupPairs).toBeDefined();
      expect(mysqlRule!.UserIdGroupPairs!.length).toBeGreaterThan(0);
    });
  });

  describe('RDS Configuration', () => {
    it('should have RDS MySQL instance running', async () => {
      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-instance-id',
            Values: [`migration-db-${environmentSuffix}`],
          },
        ],
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBe(1);

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.EngineVersion).toContain('8.0');
    });

    it('should have storage encryption enabled', async () => {
      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-instance-id',
            Values: [`migration-db-${environmentSuffix}`],
          },
        ],
      });
      const response = await rdsClient.send(command);

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.StorageEncrypted).toBe(true);
    });

    it('should not be publicly accessible', async () => {
      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-instance-id',
            Values: [`migration-db-${environmentSuffix}`],
          },
        ],
      });
      const response = await rdsClient.send(command);

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.PubliclyAccessible).toBe(false);
    });

    it('should have automated backups configured', async () => {
      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-instance-id',
            Values: [`migration-db-${environmentSuffix}`],
          },
        ],
      });
      const response = await rdsClient.send(command);

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.BackupRetentionPeriod).toBe(7);
    });

    it('should be in private subnets', async () => {
      const command = new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: `db-subnet-group-${environmentSuffix}`,
      });
      const response = await rdsClient.send(command);

      expect(response.DBSubnetGroups).toBeDefined();
      expect(response.DBSubnetGroups!.length).toBe(1);

      const subnetGroup = response.DBSubnetGroups![0];
      expect(subnetGroup.Subnets).toBeDefined();
      expect(subnetGroup.Subnets!.length).toBe(2);

      const subnetIds = subnetGroup.Subnets!.map((s) => s.SubnetIdentifier);
      expect(subnetIds).toContain(outputs.privateSubnet1Id);
      expect(subnetIds).toContain(outputs.privateSubnet2Id);
    });

    it('should have correct endpoint format', () => {
      expect(outputs.rdsEndpoint).toBeDefined();
      expect(outputs.rdsEndpoint).toContain('.rds.amazonaws.com:3306');
      expect(outputs.rdsAddress).toBeDefined();
      expect(outputs.rdsAddress).toContain('.rds.amazonaws.com');
    });
  });

  describe('S3 Bucket Configuration', () => {
    it('should have S3 bucket created', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.s3BucketName,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    it('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.s3BucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    it('should have server-side encryption configured', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.s3BucketName,
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('AES256');
    });
  });

  describe('IAM Configuration', () => {
    it('should have EC2 IAM role created', async () => {
      const command = new GetRoleCommand({
        RoleName: `ec2-role-${environmentSuffix}`,
      });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role!.AssumeRolePolicyDocument).toBeDefined();
    });

    it('should have instance profile created', async () => {
      const command = new GetInstanceProfileCommand({
        InstanceProfileName: `ec2-instance-profile-${environmentSuffix}`,
      });
      const response = await iamClient.send(command);

      expect(response.InstanceProfile).toBeDefined();
      expect(response.InstanceProfile!.Roles).toBeDefined();
      expect(response.InstanceProfile!.Roles!.length).toBe(1);
      expect(response.InstanceProfile!.Roles![0].RoleName).toBe(`ec2-role-${environmentSuffix}`);
    });

    it('should have S3 policy attached to EC2 role', async () => {
      const command = new GetRolePolicyCommand({
        RoleName: `ec2-role-${environmentSuffix}`,
        PolicyName: `ec2-s3-policy-${environmentSuffix}`,
      });
      const response = await iamClient.send(command);

      expect(response.PolicyDocument).toBeDefined();
      const policy = JSON.parse(decodeURIComponent(response.PolicyDocument!));
      expect(policy.Statement).toBeDefined();

      const s3Statement = policy.Statement[0];
      expect(s3Statement.Action).toContain('s3:GetObject');
      expect(s3Statement.Action).toContain('s3:PutObject');
      expect(s3Statement.Action).toContain('s3:ListBucket');
    });

    it('should have S3 replication role created', async () => {
      const command = new GetRoleCommand({
        RoleName: `s3-replication-role-${environmentSuffix}`,
      });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
    });
  });

  describe('Resource Outputs', () => {
    it('should have all required outputs defined', () => {
      const requiredOutputs = [
        'vpcId',
        'publicSubnet1Id',
        'publicSubnet2Id',
        'privateSubnet1Id',
        'privateSubnet2Id',
        'rdsEndpoint',
        'rdsAddress',
        'ec2Instance1PrivateIp',
        'ec2Instance2PrivateIp',
        's3BucketName',
        's3BucketArn',
        'natGatewayPublicIp',
        's3VpcEndpointId',
      ];

      requiredOutputs.forEach((output) => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    it('should have valid VPC ID format', () => {
      expect(outputs.vpcId).toMatch(/^vpc-[a-f0-9]+$/);
    });

    it('should have valid subnet ID formats', () => {
      expect(outputs.publicSubnet1Id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.publicSubnet2Id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.privateSubnet1Id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.privateSubnet2Id).toMatch(/^subnet-[a-f0-9]+$/);
    });

    it('should have valid S3 ARN format', () => {
      expect(outputs.s3BucketArn).toMatch(/^arn:aws:s3:::.+$/);
    });

    it('should have valid VPC endpoint ID format', () => {
      expect(outputs.s3VpcEndpointId).toMatch(/^vpce-[a-f0-9]+$/);
    });

    it('should have valid private IP addresses', () => {
      const ipPattern = /^10\.0\.\d{1,3}\.\d{1,3}$/;
      expect(outputs.ec2Instance1PrivateIp).toMatch(ipPattern);
      expect(outputs.ec2Instance2PrivateIp).toMatch(ipPattern);
    });
  });

  describe('High Availability Validation', () => {
    it('should have resources distributed across multiple AZs', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          outputs.publicSubnet1Id,
          outputs.publicSubnet2Id,
          outputs.privateSubnet1Id,
          outputs.privateSubnet2Id,
        ],
      });
      const response = await ec2Client.send(command);

      const azs = new Set(response.Subnets!.map((s) => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    it('should have EC2 instances in different AZs', async () => {
      const command = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
          {
            Name: 'instance-state-name',
            Values: ['running', 'pending'],
          },
          {
            Name: 'tag:Name',
            Values: [`*${environmentSuffix}*`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const instances = response.Reservations!.flatMap((r) => r.Instances || []);
      const azs = new Set(instances.map((i) => i.Placement!.AvailabilityZone));
      expect(azs.size).toBe(2);
    });
  });
});
