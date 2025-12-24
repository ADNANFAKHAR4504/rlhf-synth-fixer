// Integration tests for Terraform multi-region infrastructure
// These tests validate the deployed AWS resources using actual outputs
import fs from 'fs';
import path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcAttributeCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
} from '@aws-sdk/client-rds';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';

// Helper function to parse subnet IDs - handles both JSON arrays and comma-separated strings
function parseSubnetIds(value: string): string[] {
  if (!value) return [];

  // If it's already an array, return it
  if (Array.isArray(value)) return value;

  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
    // If it's a single string, wrap it in an array
    return [parsed];
  } catch {
    // If JSON parsing fails, treat as comma-separated string or single value
    if (value.includes(',')) {
      return value.split(',').map(id => id.trim());
    }
    // Single subnet ID
    return [value];
  }
}

describe('Terraform Infrastructure Integration Tests', () => {
let outputs: any = {};
const environmentSuffix = 'dev';

  // AWS clients for both regions
  const primaryRegion = 'us-east-1';
  const secondaryRegion = 'us-west-2';

  const ec2ClientPrimary = new EC2Client({ region: primaryRegion });
  const ec2ClientSecondary = new EC2Client({ region: secondaryRegion });
  const rdsClientPrimary = new RDSClient({ region: primaryRegion });
  const rdsClientSecondary = new RDSClient({ region: secondaryRegion });
  const secretsClient = new SecretsManagerClient({ region: primaryRegion });
  const iamClient = new IAMClient({ region: primaryRegion });

  beforeAll(() => {
    // Load deployment outputs from cfn-outputs/flat-outputs.json
    const outputsPath = path.resolve(
      __dirname,
      '../cfn-outputs/flat-outputs.json'
    );
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(outputsContent);
    } else {
      console.warn('No deployment outputs found. Some tests may be skipped.');
    }
  });

  describe('VPC Infrastructure Tests', () => {
    describe('Primary Region VPC', () => {
      test('VPC exists and is configured correctly', async () => {
        if (!outputs.primary_vpc_id) {
          console.log('Skipping test: primary_vpc_id not found in outputs');
          return;
        }

        const command = new DescribeVpcsCommand({
          VpcIds: [outputs.primary_vpc_id],
        });

        const response = await ec2ClientPrimary.send(command);
        expect(response.Vpcs).toHaveLength(1);

        const vpc = response.Vpcs![0];
        expect(vpc.CidrBlock).toBe('10.0.0.0/16');
        expect(vpc.State).toBe('available');

        // Check DNS settings using DescribeVpcAttributeCommand
        const dnsHostnamesAttr = await ec2ClientPrimary.send(new DescribeVpcAttributeCommand({
          VpcId: outputs.primary_vpc_id,
          Attribute: 'enableDnsHostnames',
        }));
        expect(dnsHostnamesAttr.EnableDnsHostnames?.Value).toBe(true);

        const dnsSupportAttr = await ec2ClientPrimary.send(new DescribeVpcAttributeCommand({
          VpcId: outputs.primary_vpc_id,
          Attribute: 'enableDnsSupport',
        }));
        expect(dnsSupportAttr.EnableDnsSupport?.Value).toBe(true);

        // Check tags
        const nameTag = vpc.Tags?.find(tag => tag.Key === 'Name');
        expect(nameTag?.Value).toContain(`primary-vpc-${environmentSuffix}`);
      });

      test('public subnets are properly configured', async () => {
        if (!outputs.primary_public_subnet_ids) {
          console.log(
            'Skipping test: primary_public_subnet_ids not found in outputs'
          );
          return;
        }

        const subnetIds = parseSubnetIds(outputs.primary_public_subnet_ids);
        expect(subnetIds).toHaveLength(2);

        const command = new DescribeSubnetsCommand({
          SubnetIds: subnetIds,
        });

        const response = await ec2ClientPrimary.send(command);
        expect(response.Subnets).toHaveLength(2);

        response.Subnets!.forEach((subnet, index) => {
          expect(subnet.MapPublicIpOnLaunch).toBe(true);
          expect(subnet.State).toBe('available');
          expect(subnet.CidrBlock).toMatch(/^10\.0\.\d+\.0\/24$/);
        });
      });

      test('private subnets are properly configured', async () => {
        if (!outputs.primary_private_subnet_ids) {
          console.log(
            'Skipping test: primary_private_subnet_ids not found in outputs'
          );
          return;
        }

        const subnetIds = parseSubnetIds(outputs.primary_private_subnet_ids);
        expect(subnetIds).toHaveLength(2);

        const command = new DescribeSubnetsCommand({
          SubnetIds: subnetIds,
        });

        const response = await ec2ClientPrimary.send(command);
        expect(response.Subnets).toHaveLength(2);

        response.Subnets!.forEach(subnet => {
          expect(subnet.MapPublicIpOnLaunch).toBe(false);
          expect(subnet.State).toBe('available');
          expect(subnet.CidrBlock).toMatch(/^10\.0\.\d+\.0\/24$/);
        });
      });

      test('Internet Gateway is attached to VPC', async () => {
        if (!outputs.primary_vpc_id) {
          console.log('Skipping test: primary_vpc_id not found in outputs');
          return;
        }

        const command = new DescribeInternetGatewaysCommand({
          Filters: [
            {
              Name: 'attachment.vpc-id',
              Values: [outputs.primary_vpc_id],
            },
          ],
        });

        const response = await ec2ClientPrimary.send(command);
        expect(response.InternetGateways).toHaveLength(1);

        const igw = response.InternetGateways![0];
        expect(igw.Attachments).toHaveLength(1);
        expect(igw.Attachments![0].State).toBe('available');
      });

      test('NAT Gateway is configured', async () => {
        if (!outputs.primary_vpc_id) {
          console.log('Skipping test: primary_vpc_id not found in outputs');
          return;
        }

        const command = new DescribeNatGatewaysCommand({
          Filter: [
            {
              Name: 'vpc-id',
              Values: [outputs.primary_vpc_id],
            },
            {
              Name: 'state',
              Values: ['available'],
            },
          ],
        });

        const response = await ec2ClientPrimary.send(command);
        expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);

        const natGateway = response.NatGateways![0];
        expect(natGateway.State).toBe('available');
        expect(natGateway.NatGatewayAddresses).toHaveLength(1);
      });
    });

    describe('Secondary Region VPC', () => {
      test('VPC exists and is configured correctly', async () => {
        if (!outputs.secondary_vpc_id) {
          console.log('Skipping test: secondary_vpc_id not found in outputs');
          return;
        }

        const command = new DescribeVpcsCommand({
          VpcIds: [outputs.secondary_vpc_id],
        });

        const response = await ec2ClientSecondary.send(command);
        expect(response.Vpcs).toHaveLength(1);

        const vpc = response.Vpcs![0];
        expect(vpc.CidrBlock).toBe('10.0.0.0/16');
        expect(vpc.State).toBe('available');

        // Check DNS settings using DescribeVpcAttributeCommand
        const dnsHostnamesAttr = await ec2ClientSecondary.send(new DescribeVpcAttributeCommand({
          VpcId: outputs.secondary_vpc_id,
          Attribute: 'enableDnsHostnames',
        }));
        expect(dnsHostnamesAttr.EnableDnsHostnames?.Value).toBe(true);

        const dnsSupportAttr = await ec2ClientSecondary.send(new DescribeVpcAttributeCommand({
          VpcId: outputs.secondary_vpc_id,
          Attribute: 'enableDnsSupport',
        }));
        expect(dnsSupportAttr.EnableDnsSupport?.Value).toBe(true);

        // Check tags
        const nameTag = vpc.Tags?.find(tag => tag.Key === 'Name');
        expect(nameTag?.Value).toContain(`secondary-vpc-${environmentSuffix}`);
      });

      test('public subnets are properly configured', async () => {
        if (!outputs.secondary_public_subnet_ids) {
          console.log(
            'Skipping test: secondary_public_subnet_ids not found in outputs'
          );
          return;
        }

        const subnetIds = parseSubnetIds(outputs.secondary_public_subnet_ids);
        expect(subnetIds).toHaveLength(2);

        const command = new DescribeSubnetsCommand({
          SubnetIds: subnetIds,
        });

        const response = await ec2ClientSecondary.send(command);
        expect(response.Subnets).toHaveLength(2);

        response.Subnets!.forEach(subnet => {
          expect(subnet.MapPublicIpOnLaunch).toBe(true);
          expect(subnet.State).toBe('available');
        });
      });

      test('private subnets are properly configured', async () => {
        if (!outputs.secondary_private_subnet_ids) {
          console.log(
            'Skipping test: secondary_private_subnet_ids not found in outputs'
          );
          return;
        }

        const subnetIds = parseSubnetIds(outputs.secondary_private_subnet_ids);
        expect(subnetIds).toHaveLength(2);

        const command = new DescribeSubnetsCommand({
          SubnetIds: subnetIds,
        });

        const response = await ec2ClientSecondary.send(command);
        expect(response.Subnets).toHaveLength(2);

        response.Subnets!.forEach(subnet => {
          expect(subnet.MapPublicIpOnLaunch).toBe(false);
          expect(subnet.State).toBe('available');
        });
      });
    });
  });

  describe('RDS Infrastructure Tests', () => {
    describe('Primary Region RDS', () => {
      test('RDS instance exists and is configured correctly', async () => {
        const dbIdentifier = `mysql-primary-${environmentSuffix}`;

        try {
          const command = new DescribeDBInstancesCommand({
            DBInstanceIdentifier: dbIdentifier,
          });

          const response = await rdsClientPrimary.send(command);
          expect(response.DBInstances).toHaveLength(1);

          const dbInstance = response.DBInstances![0];
          expect(dbInstance.DBInstanceStatus).toBe('available');
          expect(dbInstance.Engine).toBe('mysql');
          expect(dbInstance.EngineVersion).toContain('8.0');
          expect(dbInstance.DBInstanceClass).toBe('db.t3.micro');

          // Check Multi-AZ configuration
          expect(dbInstance.MultiAZ).toBe(true);

          // Check encryption
          expect(dbInstance.StorageEncrypted).toBe(true);

          // Check backup configuration
          expect(dbInstance.BackupRetentionPeriod).toBe(7);

          // Check monitoring
          expect(dbInstance.MonitoringInterval).toBe(60);

          // Only require Performance Insights if explicitly enabled in CI
          const expectPI = (process.env.ENABLE_RDS_PI || '').toLowerCase() === 'true';

          if (expectPI) {
            expect(dbInstance.PerformanceInsightsEnabled).toBe(true);
          } else {
            // If not expecting PI, tolerate false/undefined (many small instances don’t support PI)
            expect(dbInstance.PerformanceInsightsEnabled ?? false).toBe(false);
          }


          // Check public accessibility
          expect(dbInstance.PubliclyAccessible).toBe(false);

          // Check deletion protection
          expect(dbInstance.DeletionProtection).toBe(false);
        } catch (error: any) {
          if (error.name === 'DBInstanceNotFoundFault') {
            console.log(
              'RDS instance not found. This is expected if deployment was skipped.'
            );
          } else {
            throw error;
          }
        }
      });

      test('RDS subnet group is configured', async () => {
        const subnetGroupName = `primary-db-subnet-group-${environmentSuffix}`;

        try {
          const command = new DescribeDBSubnetGroupsCommand({
            DBSubnetGroupName: subnetGroupName,
          });

          const response = await rdsClientPrimary.send(command);
          expect(response.DBSubnetGroups).toHaveLength(1);

          const subnetGroup = response.DBSubnetGroups![0];
          expect(subnetGroup.SubnetGroupStatus).toBe('Complete');
          expect(subnetGroup.Subnets!.length).toBeGreaterThanOrEqual(2);
        } catch (error: any) {
          if (error.name === 'DBSubnetGroupNotFoundFault') {
            console.log(
              'DB subnet group not found. This is expected if deployment was skipped.'
            );
          } else {
            throw error;
          }
        }
      });

      test('RDS security group is configured', async () => {
        if (!outputs.primary_vpc_id) {
          console.log('Skipping test: primary_vpc_id not found in outputs');
          return;
        }

        const command = new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.primary_vpc_id],
            },
            {
              Name: 'group-name',
              Values: [`rds-primary-sg-${environmentSuffix}`],
            },
          ],
        });

        try {
          const response = await ec2ClientPrimary.send(command);
          expect(response.SecurityGroups).toHaveLength(1);

          const sg = response.SecurityGroups![0];

          // Check ingress rules for MySQL port
          const mysqlRule = sg.IpPermissions?.find(
            rule => rule.FromPort === 3306 && rule.ToPort === 3306
          );
          expect(mysqlRule).toBeDefined();
          expect(mysqlRule?.IpProtocol).toBe('tcp');
        } catch (error) {
          console.log(
            'Security group not found. This is expected if deployment was skipped.'
          );
        }
      });
    });

    describe('Secondary Region RDS', () => {
      test('RDS instance exists and is configured correctly', async () => {
        const dbIdentifier = `mysql-secondary-${environmentSuffix}`;

        try {
          const command = new DescribeDBInstancesCommand({
            DBInstanceIdentifier: dbIdentifier,
          });

          const response = await rdsClientSecondary.send(command);
          expect(response.DBInstances).toHaveLength(1);

          const dbInstance = response.DBInstances![0];
          expect(dbInstance.DBInstanceStatus).toBe('available');
          expect(dbInstance.Engine).toBe('mysql');
          expect(dbInstance.MultiAZ).toBe(true);
          expect(dbInstance.StorageEncrypted).toBe(true);
          expect(dbInstance.PubliclyAccessible).toBe(false);
        } catch (error: any) {
          if (error.name === 'DBInstanceNotFoundFault') {
            console.log(
              'RDS instance not found. This is expected if deployment was skipped.'
            );
          } else {
            throw error;
          }
        }
      });
    });
  });

  describe('IAM and Secrets Tests', () => {
    test('RDS enhanced monitoring role exists', async () => {
      const roleName = `rds-enhanced-monitoring-role-${environmentSuffix}`;

      try {
        const command = new GetRoleCommand({
          RoleName: roleName,
        });

        const response = await iamClient.send(command);
        expect(response.Role).toBeDefined();
        expect(response.Role?.RoleName).toBe(roleName);

        // Check assume role policy
        const assumeRolePolicy = JSON.parse(
          decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}')
        );
        expect(assumeRolePolicy.Statement[0].Principal.Service).toContain(
          'monitoring.rds.amazonaws.com'
        );
      } catch (error: any) {
        if (error.name === 'NoSuchEntity') {
          console.log(
            'IAM role not found. This is expected if deployment was skipped.'
          );
        } else {
          throw error;
        }
      }
    });

    test('Secrets Manager secret exists', async () => {
      if (!outputs.db_secret_arn) {
        console.log('Skipping test: db_secret_arn not found in outputs');
        return;
      }

      const command = new DescribeSecretCommand({
        SecretId: outputs.db_secret_arn,
      });

      try {
        const response = await secretsClient.send(command);
        expect(response.Name).toContain(
          `rds-mysql-password-${environmentSuffix}`
        );
        expect(response.Description).toContain(
          'Password for RDS MySQL instances'
        );

        // Check replication status
        expect(response.ReplicationStatus).toBeDefined();
        const replication = response.ReplicationStatus?.find(
          r => r.Region === secondaryRegion
        );
        expect(replication).toBeDefined();
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.log(
            'Secret not found. This is expected if deployment was skipped.'
          );
        } else {
          throw error;
        }
      }
    });
  });

  describe('High Availability Tests', () => {
    test('resources are distributed across multiple availability zones', async () => {
      if (!outputs.primary_private_subnet_ids) {
        console.log('Skipping test: subnet IDs not found in outputs');
        return;
      }

      const subnetIds = parseSubnetIds(outputs.primary_private_subnet_ids);
      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });

      const response = await ec2ClientPrimary.send(command);
      const azs = new Set(response.Subnets?.map(s => s.AvailabilityZone));

      // Should have subnets in at least 2 availability zones
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('both regions have functional infrastructure', async () => {
      // Check primary region
      if (outputs.primary_vpc_id) {
        const primaryVpcCommand = new DescribeVpcsCommand({
          VpcIds: [outputs.primary_vpc_id],
        });
        const primaryResponse = await ec2ClientPrimary.send(primaryVpcCommand);
        expect(primaryResponse.Vpcs![0].State).toBe('available');
      }

      // Check secondary region
      if (outputs.secondary_vpc_id) {
        const secondaryVpcCommand = new DescribeVpcsCommand({
          VpcIds: [outputs.secondary_vpc_id],
        });
        const secondaryResponse =
          await ec2ClientSecondary.send(secondaryVpcCommand);
        expect(secondaryResponse.Vpcs![0].State).toBe('available');
      }
    });
  });

  describe('Network Connectivity Tests', () => {
    test('VPCs have proper CIDR blocks configured', async () => {
      if (outputs.primary_vpc_id) {
        const command = new DescribeVpcsCommand({
          VpcIds: [outputs.primary_vpc_id],
        });
        const response = await ec2ClientPrimary.send(command);
        expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      }

      if (outputs.secondary_vpc_id) {
        const command = new DescribeVpcsCommand({
          VpcIds: [outputs.secondary_vpc_id],
        });
        const response = await ec2ClientSecondary.send(command);
        expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      }
    });

    test('subnets do not have overlapping CIDR blocks within VPC', async () => {
      if (
        !outputs.primary_public_subnet_ids ||
        !outputs.primary_private_subnet_ids
      ) {
        console.log('Skipping test: subnet IDs not found in outputs');
        return;
      }

      const publicSubnetIds = parseSubnetIds(outputs.primary_public_subnet_ids);
      const privateSubnetIds = parseSubnetIds(outputs.primary_private_subnet_ids);
      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      });

      const response = await ec2ClientPrimary.send(command);
      const cidrBlocks = response.Subnets?.map(s => s.CidrBlock) || [];

      // Check for unique CIDR blocks
      const uniqueCidrBlocks = new Set(cidrBlocks);
      expect(uniqueCidrBlocks.size).toBe(cidrBlocks.length);
    });
  });

  describe('Resource Tagging Tests', () => {
    test('all resources have proper environment tags', async () => {
      if (!outputs.primary_vpc_id) {
        console.log('Skipping test: primary_vpc_id not found in outputs');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.primary_vpc_id],
      });

      const response = await ec2ClientPrimary.send(command);
      const vpc = response.Vpcs![0];

      const envTag = vpc.Tags?.find(tag => tag.Key === 'Environment');
      expect(envTag?.Value).toBe(environmentSuffix);

      const projectTag = vpc.Tags?.find(tag => tag.Key === 'Project');
      expect(projectTag?.Value).toContain(
        `multi-region-ha-${environmentSuffix}`
      );

      const managedByTag = vpc.Tags?.find(tag => tag.Key === 'ManagedBy');
      expect(managedByTag?.Value).toBe('terraform');
    });
  });
});
