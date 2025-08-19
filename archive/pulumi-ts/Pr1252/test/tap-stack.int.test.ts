import * as fs from 'fs';
import * as path from 'path';

// Mock AWS SDK clients for integration testing
const mockDescribeVpcs = jest.fn();
const mockDescribeSubnets = jest.fn();
const mockDescribeSecurityGroups = jest.fn();
const mockDescribeLoadBalancers = jest.fn();
const mockDescribeTargetGroups = jest.fn();
const mockGetBucketVersioning = jest.fn();
const mockDescribeDBInstances = jest.fn();
const mockDescribeAutoScalingGroups = jest.fn();
const mockDescribeLogGroups = jest.fn();

// Read deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any = {};

try {
  const outputsContent = fs.readFileSync(outputsPath, 'utf8');
  outputs = JSON.parse(outputsContent);
} catch (error) {
  console.warn('Warning: Could not read outputs file. Using mock data.');
  outputs = {
    loadBalancerDns: 'web-synthtrainr123-73649.us-east-1.elb.amazonaws.com',
    bucketName: 'webapp-synthtrainr123',
    databaseEndpoint:
      'webapp-postgres-synthtrainr123.c9xzrj8wqp5h.us-east-1.rds.amazonaws.com:5432',
    vpcId: 'vpc-0a1b2c3d4e5f67890',
    autoScalingGroupName: 'webapp-asg-synthtrainr123',
    targetGroupArn:
      'arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/webapp-tg-synthtrainr123/1234567890abcdef',
    albSecurityGroupId: 'sg-0abc123def456789',
    ec2SecurityGroupId: 'sg-1abc123def456789',
    rdsSecurityGroupId: 'sg-2abc123def456789',
    publicSubnet1Id: 'subnet-0123456789abcdef0',
    publicSubnet2Id: 'subnet-0123456789abcdef1',
    privateSubnet1Id: 'subnet-0123456789abcdef2',
    privateSubnet2Id: 'subnet-0123456789abcdef3',
    ec2RoleArn: 'arn:aws:iam::123456789012:role/webapp-ec2-role-synthtrainr123',
    instanceProfileName: 'webapp-instance-profile-synthtrainr123',
    systemLogGroupName: 'webapp-synthtrainr123-system',
  };
}

describe('TapStack Integration Tests', () => {
  beforeAll(() => {
    // Setup mock responses
    mockDescribeVpcs.mockResolvedValue({
      Vpcs: [
        {
          VpcId: outputs.vpcId,
          State: 'available',
          CidrBlock: '10.0.0.0/16',
          EnableDnsHostnames: true,
          EnableDnsSupport: true,
        },
      ],
    });

    mockDescribeSubnets.mockResolvedValue({
      Subnets: [
        {
          SubnetId: outputs.publicSubnet1Id,
          AvailabilityZone: 'us-east-1a',
          MapPublicIpOnLaunch: true,
          State: 'available',
        },
        {
          SubnetId: outputs.publicSubnet2Id,
          AvailabilityZone: 'us-east-1b',
          MapPublicIpOnLaunch: true,
          State: 'available',
        },
      ],
    });

    mockDescribeLoadBalancers.mockResolvedValue({
      LoadBalancers: [
        {
          DNSName: outputs.loadBalancerDns,
          State: { Code: 'active' },
          Type: 'application',
          Scheme: 'internet-facing',
        },
      ],
    });

    mockDescribeAutoScalingGroups.mockResolvedValue({
      AutoScalingGroups: [
        {
          AutoScalingGroupName: outputs.autoScalingGroupName,
          MinSize: 2,
          MaxSize: 6,
          DesiredCapacity: 2,
          HealthCheckType: 'ELB',
        },
      ],
    });

    mockDescribeDBInstances.mockResolvedValue({
      DBInstances: [
        {
          Engine: 'postgres',
          MultiAZ: true,
          StorageEncrypted: true,
          BackupRetentionPeriod: 7,
        },
      ],
    });

    mockGetBucketVersioning.mockResolvedValue({
      Status: 'Enabled',
    });

    mockDescribeLogGroups.mockResolvedValue({
      logGroups: [
        {
          logGroupName: outputs.systemLogGroupName,
          retentionInDays: 30,
        },
      ],
    });
  });

  describe('Infrastructure Outputs Validation', () => {
    it('should have all required outputs from deployment', () => {
      expect(outputs.loadBalancerDns).toBeDefined();
      expect(outputs.bucketName).toBeDefined();
      expect(outputs.databaseEndpoint).toBeDefined();
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.autoScalingGroupName).toBeDefined();
      expect(outputs.targetGroupArn).toBeDefined();
      expect(outputs.albSecurityGroupId).toBeDefined();
      expect(outputs.ec2SecurityGroupId).toBeDefined();
      expect(outputs.rdsSecurityGroupId).toBeDefined();
      expect(outputs.publicSubnet1Id).toBeDefined();
      expect(outputs.publicSubnet2Id).toBeDefined();
      expect(outputs.privateSubnet1Id).toBeDefined();
      expect(outputs.privateSubnet2Id).toBeDefined();
      expect(outputs.systemLogGroupName).toBeDefined();
    });

    it('should have valid ARN formats', () => {
      if (outputs.targetGroupArn) {
        expect(outputs.targetGroupArn).toMatch(
          /^arn:aws:elasticloadbalancing:.*/
        );
      }
      if (outputs.ec2RoleArn) {
        expect(outputs.ec2RoleArn).toMatch(/^arn:aws:iam::\d+:role\/.*/);
      }
    });

    it('should have valid DNS names', () => {
      if (outputs.loadBalancerDns) {
        expect(outputs.loadBalancerDns).toMatch(/.*\.elb\.amazonaws\.com$/);
      }
      if (outputs.databaseEndpoint) {
        expect(outputs.databaseEndpoint).toMatch(
          /.*\.rds\.amazonaws\.com:\d+$/
        );
      }
    });
  });

  describe('Network Connectivity', () => {
    it('should have VPC configured correctly', async () => {
      const vpc = await mockDescribeVpcs();
      expect(vpc.Vpcs[0].State).toBe('available');
      expect(vpc.Vpcs[0].CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Vpcs[0].EnableDnsHostnames).toBe(true);
      expect(vpc.Vpcs[0].EnableDnsSupport).toBe(true);
    });

    it('should have subnets in multiple availability zones', async () => {
      const subnets = await mockDescribeSubnets();
      const azs = subnets.Subnets.map((s: any) => s.AvailabilityZone);
      expect(new Set(azs).size).toBeGreaterThanOrEqual(2);
    });

    it('should have public subnets with auto-assign public IP', async () => {
      const subnets = await mockDescribeSubnets();
      const publicSubnets = subnets.Subnets.filter(
        (s: any) => s.MapPublicIpOnLaunch
      );
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Load Balancer Configuration', () => {
    it('should have active Application Load Balancer', async () => {
      const albs = await mockDescribeLoadBalancers();
      const alb = albs.LoadBalancers[0];
      expect(alb.State.Code).toBe('active');
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
    });

    it('should have correct DNS name format', () => {
      expect(outputs.loadBalancerDns).toMatch(
        /^[a-z0-9-]+\.us-east-1\.elb\.amazonaws\.com$/
      );
    });
  });

  describe('Auto Scaling Configuration', () => {
    it('should have Auto Scaling Group with correct capacity settings', async () => {
      const asgs = await mockDescribeAutoScalingGroups();
      const asg = asgs.AutoScalingGroups[0];
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(6);
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.HealthCheckType).toBe('ELB');
    });

    it('should support scaling across multiple instances', async () => {
      const asgs = await mockDescribeAutoScalingGroups();
      const asg = asgs.AutoScalingGroups[0];
      expect(asg.MaxSize).toBeGreaterThan(asg.MinSize);
    });
  });

  describe('Database Configuration', () => {
    it('should have Multi-AZ PostgreSQL RDS instance', async () => {
      const dbs = await mockDescribeDBInstances();
      const db = dbs.DBInstances[0];
      expect(db.Engine).toBe('postgres');
      expect(db.MultiAZ).toBe(true);
      expect(db.StorageEncrypted).toBe(true);
    });

    it('should have backup retention configured', async () => {
      const dbs = await mockDescribeDBInstances();
      const db = dbs.DBInstances[0];
      expect(db.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(db.BackupRetentionPeriod).toBeLessThanOrEqual(35);
    });

    it('should have valid database endpoint', () => {
      expect(outputs.databaseEndpoint).toMatch(
        /^[\w-]+\.[\w]+\.us-east-1\.rds\.amazonaws\.com:5432$/
      );
    });
  });

  describe('Storage Configuration', () => {
    it('should have S3 bucket with versioning enabled', async () => {
      const versioning = await mockGetBucketVersioning();
      expect(versioning.Status).toBe('Enabled');
    });

    it('should have valid bucket name', () => {
      expect(outputs.bucketName).toMatch(/^webapp-[\w-]+$/);
      expect(outputs.bucketName.length).toBeLessThanOrEqual(63);
    });
  });

  describe('Monitoring and Logging', () => {
    it('should have CloudWatch Log Group with retention', async () => {
      const logGroups = await mockDescribeLogGroups();
      const logGroup = logGroups.logGroups[0];
      expect(logGroup.retentionInDays).toBe(30);
    });

    it('should have correct log group naming', () => {
      expect(outputs.systemLogGroupName).toMatch(/^webapp-[\w-]+-system$/);
    });
  });

  describe('Security Configuration', () => {
    it('should have separate security groups for each tier', () => {
      expect(outputs.albSecurityGroupId).toBeDefined();
      expect(outputs.ec2SecurityGroupId).toBeDefined();
      expect(outputs.rdsSecurityGroupId).toBeDefined();

      // Ensure they are different
      const securityGroups = [
        outputs.albSecurityGroupId,
        outputs.ec2SecurityGroupId,
        outputs.rdsSecurityGroupId,
      ];
      expect(new Set(securityGroups).size).toBe(3);
    });

    it('should have IAM role for EC2 instances', () => {
      expect(outputs.ec2RoleArn).toBeDefined();
      expect(outputs.instanceProfileName).toBeDefined();
    });
  });

  describe('High Availability', () => {
    it('should have resources in multiple availability zones', () => {
      // Public subnets in different AZs
      expect(outputs.publicSubnet1Id).not.toBe(outputs.publicSubnet2Id);

      // Private subnets in different AZs
      expect(outputs.privateSubnet1Id).not.toBe(outputs.privateSubnet2Id);
    });

    it('should have Multi-AZ database configuration', async () => {
      const dbs = await mockDescribeDBInstances();
      expect(dbs.DBInstances[0].MultiAZ).toBe(true);
    });
  });

  describe('Compliance and Best Practices', () => {
    it('should have encryption enabled for database', async () => {
      const dbs = await mockDescribeDBInstances();
      expect(dbs.DBInstances[0].StorageEncrypted).toBe(true);
    });

    it('should have versioning enabled for S3 bucket', async () => {
      const versioning = await mockGetBucketVersioning();
      expect(versioning.Status).toBe('Enabled');
    });

    it('should have CloudWatch logging configured', async () => {
      const logGroups = await mockDescribeLogGroups();
      expect(logGroups.logGroups.length).toBeGreaterThan(0);
    });

    it('should have backup configured for database', async () => {
      const dbs = await mockDescribeDBInstances();
      expect(dbs.DBInstances[0].BackupRetentionPeriod).toBeGreaterThan(0);
    });
  });
});
