/**
 * Unit tests for Migration Infrastructure
 * Tests infrastructure code structure, configuration, and resource definitions
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Migration Infrastructure Unit Tests', () => {
  let indexCode: string;

  beforeAll(() => {
    // Read the infrastructure code
    const indexPath = path.join(__dirname, '../lib/index.ts');
    indexCode = fs.readFileSync(indexPath, 'utf-8');
  });

  describe('VPC Configuration', () => {
    it('should define VPC with correct CIDR block', () => {
      expect(indexCode).toContain('new aws.ec2.Vpc');
      expect(indexCode).toContain('cidrBlock: \'10.0.0.0/16\'');
    });

    it('should enable DNS hostnames and support', () => {
      expect(indexCode).toContain('enableDnsHostnames: true');
      expect(indexCode).toContain('enableDnsSupport: true');
    });

    it('should include environmentSuffix in VPC name', () => {
      expect(indexCode).toContain('migration-vpc-${environmentSuffix}');
    });
  });

  describe('Subnet Configuration', () => {
    it('should define public subnets in multiple AZs', () => {
      expect(indexCode).toContain('public-subnet-1-${environmentSuffix}');
      expect(indexCode).toContain('public-subnet-2-${environmentSuffix}');
      expect(indexCode).toContain('10.0.1.0/24');
      expect(indexCode).toContain('10.0.2.0/24');
    });

    it('should define private subnets in multiple AZs', () => {
      expect(indexCode).toContain('private-subnet-1-${environmentSuffix}');
      expect(indexCode).toContain('private-subnet-2-${environmentSuffix}');
      expect(indexCode).toContain('10.0.11.0/24');
      expect(indexCode).toContain('10.0.12.0/24');
    });

    it('should configure public subnets with public IP mapping', () => {
      expect(indexCode).toContain('mapPublicIpOnLaunch: true');
    });

    it('should use availability zones from data source', () => {
      expect(indexCode).toContain('availabilityZones.names[0]');
      expect(indexCode).toContain('availabilityZones.names[1]');
    });
  });

  describe('Internet Gateway and NAT Configuration', () => {
    it('should define Internet Gateway', () => {
      expect(indexCode).toContain('new aws.ec2.InternetGateway');
      expect(indexCode).toContain('migration-igw-${environmentSuffix}');
    });

    it('should define Elastic IP for NAT Gateway', () => {
      expect(indexCode).toContain('new aws.ec2.Eip');
      expect(indexCode).toContain('nat-eip-${environmentSuffix}');
      expect(indexCode).toContain('domain: \'vpc\'');
    });

    it('should define NAT Gateway', () => {
      expect(indexCode).toContain('new aws.ec2.NatGateway');
      expect(indexCode).toContain('nat-gateway-${environmentSuffix}');
    });

    it('should attach NAT Gateway to public subnet', () => {
      expect(indexCode).toContain('subnetId: publicSubnet1.id');
      expect(indexCode).toMatch(/allocationId:\s*natEip\.id/);
    });
  });

  describe('Route Table Configuration', () => {
    it('should define public route table', () => {
      expect(indexCode).toContain('public-rt-${environmentSuffix}');
      expect(indexCode).toContain('new aws.ec2.RouteTable');
    });

    it('should define private route table', () => {
      expect(indexCode).toContain('private-rt-${environmentSuffix}');
    });

    it('should create route to Internet Gateway for public subnets', () => {
      expect(indexCode).toContain('public-route-${environmentSuffix}');
      expect(indexCode).toContain('destinationCidrBlock: \'0.0.0.0/0\'');
      expect(indexCode).toContain('gatewayId: igw.id');
    });

    it('should create route to NAT Gateway for private subnets', () => {
      expect(indexCode).toContain('private-route-${environmentSuffix}');
      expect(indexCode).toContain('natGatewayId: natGateway.id');
    });

    it('should associate route tables with subnets', () => {
      expect(indexCode).toContain('new aws.ec2.RouteTableAssociation');
      expect(indexCode).toContain('public-rt-assoc-1-${environmentSuffix}');
      expect(indexCode).toContain('public-rt-assoc-2-${environmentSuffix}');
      expect(indexCode).toContain('private-rt-assoc-1-${environmentSuffix}');
      expect(indexCode).toContain('private-rt-assoc-2-${environmentSuffix}');
    });
  });

  describe('VPC Endpoint Configuration', () => {
    it('should define S3 VPC endpoint', () => {
      expect(indexCode).toContain('new aws.ec2.VpcEndpoint');
      expect(indexCode).toContain('s3-endpoint-${environmentSuffix}');
    });

    it('should configure S3 endpoint as Gateway type', () => {
      expect(indexCode).toContain('vpcEndpointType: \'Gateway\'');
      expect(indexCode).toContain('com.amazonaws.${region}.s3');
    });

    it('should associate S3 endpoint with private route table', () => {
      expect(indexCode).toContain('routeTableIds: [privateRouteTable.id]');
    });
  });

  describe('Security Group Configuration', () => {
    it('should define EC2 security group', () => {
      expect(indexCode).toContain('new aws.ec2.SecurityGroup');
      expect(indexCode).toContain('ec2-sg-${environmentSuffix}');
    });

    it('should define RDS security group', () => {
      expect(indexCode).toContain('rds-sg-${environmentSuffix}');
    });

    it('should allow MySQL traffic from EC2 to RDS', () => {
      expect(indexCode).toContain('fromPort: 3306');
      expect(indexCode).toContain('toPort: 3306');
      expect(indexCode).toContain('securityGroups: [ec2SecurityGroup.id]');
    });

    it('should allow all egress traffic', () => {
      expect(indexCode).toContain('egress:');
      expect(indexCode).toContain('protocol: \'-1\'');
      expect(indexCode).toContain('cidrBlocks: [\'0.0.0.0/0\']');
    });
  });

  describe('RDS Configuration', () => {
    it('should define RDS subnet group', () => {
      expect(indexCode).toContain('new aws.rds.SubnetGroup');
      expect(indexCode).toContain('db-subnet-group-${environmentSuffix}');
    });

    it('should use both private subnets for RDS', () => {
      expect(indexCode).toContain('[privateSubnet1.id, privateSubnet2.id]');
    });

    it('should define RDS MySQL instance', () => {
      expect(indexCode).toContain('new aws.rds.Instance');
      expect(indexCode).toContain('migration-db-${environmentSuffix}');
    });

    it('should configure MySQL 8.0 engine', () => {
      expect(indexCode).toContain('engine: \'mysql\'');
      expect(indexCode).toContain('engineVersion: \'8.0\'');
    });

    it('should enable storage encryption', () => {
      expect(indexCode).toContain('storageEncrypted: true');
    });

    it('should configure automated backups', () => {
      expect(indexCode).toContain('backupRetentionPeriod: 7');
    });

    it('should skip final snapshot for destroyability', () => {
      expect(indexCode).toContain('skipFinalSnapshot: true');
    });

    it('should not be publicly accessible', () => {
      expect(indexCode).toContain('publiclyAccessible: false');
    });

    it('should use secure password from config', () => {
      expect(indexCode).toContain('config.requireSecret(\'dbPassword\')');
    });
  });

  describe('IAM Configuration', () => {
    it('should define EC2 IAM role', () => {
      expect(indexCode).toContain('new aws.iam.Role');
      expect(indexCode).toContain('ec2-role-${environmentSuffix}');
    });

    it('should configure EC2 assume role policy', () => {
      expect(indexCode).toContain('Service: \'ec2.amazonaws.com\'');
      expect(indexCode).toContain('Action: \'sts:AssumeRole\'');
    });

    it('should define S3 replication role', () => {
      expect(indexCode).toContain('s3-replication-role-${environmentSuffix}');
      expect(indexCode).toContain('Service: \'s3.amazonaws.com\'');
    });

    it('should define EC2 S3 policy', () => {
      expect(indexCode).toContain('new aws.iam.RolePolicy');
      expect(indexCode).toContain('ec2-s3-policy-${environmentSuffix}');
    });

    it('should grant S3 permissions to EC2 role', () => {
      expect(indexCode).toContain('s3:GetObject');
      expect(indexCode).toContain('s3:PutObject');
      expect(indexCode).toContain('s3:ListBucket');
    });

    it('should define instance profile', () => {
      expect(indexCode).toContain('new aws.iam.InstanceProfile');
      expect(indexCode).toContain('ec2-instance-profile-${environmentSuffix}');
    });

    it('should configure replication policy', () => {
      expect(indexCode).toContain('s3-replication-policy-${environmentSuffix}');
      expect(indexCode).toContain('s3:GetReplicationConfiguration');
      expect(indexCode).toContain('s3:GetObjectVersionForReplication');
      expect(indexCode).toContain('s3:ReplicateObject');
    });
  });

  describe('S3 Configuration', () => {
    it('should define S3 bucket', () => {
      expect(indexCode).toContain('new aws.s3.Bucket');
      expect(indexCode).toContain('migration-bucket-${environmentSuffix}');
    });

    it('should enable versioning', () => {
      expect(indexCode).toContain('versioning:');
      expect(indexCode).toContain('enabled: true');
    });

    it('should enable server-side encryption', () => {
      expect(indexCode).toContain('serverSideEncryptionConfiguration:');
      expect(indexCode).toContain('sseAlgorithm: \'AES256\'');
    });
  });

  describe('EC2 Configuration', () => {
    it('should use Amazon Linux 2 AMI', () => {
      expect(indexCode).toContain('aws.ec2.getAmiOutput');
      expect(indexCode).toContain('amzn2-ami-hvm-*-x86_64-gp2');
      expect(indexCode).toContain('owners: [\'amazon\']');
    });

    it('should define two EC2 instances', () => {
      expect(indexCode).toContain('app-instance-1-${environmentSuffix}');
      expect(indexCode).toContain('app-instance-2-${environmentSuffix}');
    });

    it('should use t3.medium instance type', () => {
      expect(indexCode).toContain('instanceType: \'t3.medium\'');
    });

    it('should deploy instances in private subnets', () => {
      expect(indexCode).toContain('subnetId: privateSubnet1.id');
      expect(indexCode).toContain('subnetId: privateSubnet2.id');
    });

    it('should not assign public IP addresses', () => {
      expect(indexCode).toContain('associatePublicIpAddress: false');
    });

    it('should attach IAM instance profile', () => {
      expect(indexCode).toContain('iamInstanceProfile: ec2InstanceProfile.name');
    });

    it('should attach security group', () => {
      expect(indexCode).toContain('vpcSecurityGroupIds: [ec2SecurityGroup.id]');
    });
  });

  describe('Resource Tagging', () => {
    it('should define common tags', () => {
      expect(indexCode).toContain('const commonTags');
      expect(indexCode).toContain('Environment: \'dev\'');
      expect(indexCode).toContain('MigrationDate: migrationDate');
    });

    it('should use current date for MigrationDate tag', () => {
      expect(indexCode).toContain('new Date().toISOString().split(\'T\')[0]');
    });

    it('should apply tags to resources', () => {
      expect(indexCode).toContain('...commonTags');
    });

    it('should include Name tags with environmentSuffix', () => {
      const nameTagPattern = /Name:\s*`.*\$\{environmentSuffix\}`/;
      expect(indexCode).toMatch(nameTagPattern);
    });
  });

  describe('Configuration Management', () => {
    it('should use Pulumi config for environmentSuffix', () => {
      expect(indexCode).toContain('new pulumi.Config()');
      // environmentSuffix now uses env var with config fallback
      expect(indexCode).toContain('process.env.ENVIRONMENT_SUFFIX');
      expect(indexCode).toContain("config.get('environmentSuffix')");
    });

    it('should use region configuration', () => {
      expect(indexCode).toContain('aws.config.region');
      expect(indexCode).toContain('\'us-east-1\'');
    });

    it('should use secure config for database password', () => {
      expect(indexCode).toContain('config.requireSecret(\'dbPassword\')');
    });
  });

  describe('Exports', () => {
    it('should export VPC ID', () => {
      expect(indexCode).toContain('export const vpcId = vpc.id');
    });

    it('should export subnet IDs', () => {
      expect(indexCode).toContain('export const publicSubnetIds');
      expect(indexCode).toContain('export const privateSubnetIds');
    });

    it('should export RDS endpoint and address', () => {
      // RDS exports now have LocalStack fallback support
      expect(indexCode).toContain('export const rdsEndpoint');
      expect(indexCode).toContain('export const rdsAddress');
      expect(indexCode).toContain('rdsInstance?.endpoint');
      expect(indexCode).toContain('rdsInstance?.address');
    });

    it('should export EC2 private IPs', () => {
      expect(indexCode).toContain('export const ec2Instance1PrivateIp');
      expect(indexCode).toContain('export const ec2Instance2PrivateIp');
    });

    it('should export S3 bucket details', () => {
      expect(indexCode).toContain('export const s3BucketName');
      expect(indexCode).toContain('export const s3BucketArn');
    });

    it('should export NAT gateway public IP', () => {
      expect(indexCode).toContain('export const natGatewayPublicIp');
    });

    it('should export S3 VPC endpoint ID', () => {
      expect(indexCode).toContain('export const s3VpcEndpointId');
    });
  });

  describe('Resource Dependencies', () => {
    it('should specify NAT EIP dependency on IGW', () => {
      expect(indexCode).toContain('dependsOn: [igw]');
    });
  });

  describe('High Availability', () => {
    it('should distribute resources across multiple AZs', () => {
      expect(indexCode).toContain('availabilityZones.names[0]');
      expect(indexCode).toContain('availabilityZones.names[1]');
    });

    it('should create resources in both availability zones', () => {
      const az0Count = (indexCode.match(/availabilityZones\.names\[0\]/g) || []).length;
      const az1Count = (indexCode.match(/availabilityZones\.names\[1\]/g) || []).length;
      expect(az0Count).toBeGreaterThan(0);
      expect(az1Count).toBeGreaterThan(0);
      expect(az0Count).toBe(az1Count);
    });
  });

  describe('Security Best Practices', () => {
    it('should not hardcode sensitive values', () => {
      expect(indexCode).not.toContain('password: \'');
      expect(indexCode).not.toContain('password: "');
    });

    it('should use security groups for network isolation', () => {
      const sgCount = (indexCode.match(/new aws\.ec2\.SecurityGroup/g) || []).length;
      expect(sgCount).toBeGreaterThanOrEqual(2);
    });

    it('should restrict RDS access to EC2 security group', () => {
      expect(indexCode).toContain('securityGroups: [ec2SecurityGroup.id]');
    });

    it('should enable encryption for storage', () => {
      expect(indexCode).toContain('storageEncrypted: true');
      expect(indexCode).toContain('sseAlgorithm: \'AES256\'');
    });
  });
});
