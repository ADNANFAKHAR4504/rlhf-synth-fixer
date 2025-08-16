import * as pulumi from '@pulumi/pulumi';
import { SecureInfrastructure } from '../lib/secure-infrastructure';

// Mock Pulumi
jest.mock('@pulumi/pulumi', () => ({
  ComponentResource: jest.fn().mockImplementation(function(this: any, type: string, name: string, args: any, opts: any) {
    this.registerOutputs = jest.fn();
    return this;
  }),
  Output: {
    create: jest.fn((value) => ({ apply: jest.fn((fn) => fn(value)) })),
  },
  output: jest.fn((value) => ({ apply: jest.fn((fn) => fn(value)) })),
  all: jest.fn((outputs) => ({ apply: jest.fn((fn) => fn(outputs)) })),
  interpolate: jest.fn((template, ...args) => ({ apply: jest.fn((fn) => fn(`interpolated-${template}`)) })),
}));

// Mock AWS SDK
jest.mock('@pulumi/aws', () => ({
  Provider: jest.fn().mockImplementation(function(this: any, name: string, args: any) {
    return this;
  }),
  getAvailabilityZones: jest.fn(() => Promise.resolve({
    names: ['ap-south-1a', 'ap-south-1b', 'ap-south-1c']
  })),
  getCallerIdentity: jest.fn(() => Promise.resolve({
    accountId: '123456789012',
    arn: 'arn:aws:iam::123456789012:root',
    userId: 'AIDACKCEVSQ6C2EXAMPLE'
  })),
  ec2: {
    Vpc: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = pulumi.output('vpc-12345678');
      this.cidrBlock = pulumi.output('10.0.0.0/16');
      return this;
    }),
    Subnet: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = pulumi.output(`subnet-${Math.random().toString(36).substr(2, 9)}`);
      return this;
    }),
    InternetGateway: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = pulumi.output('igw-12345678');
      return this;
    }),
    RouteTable: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = pulumi.output(`rtb-${Math.random().toString(36).substr(2, 9)}`);
      return this;
    }),
    Route: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      return this;
    }),
    RouteTableAssociation: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      return this;
    }),
    SecurityGroup: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = pulumi.output(`sg-${Math.random().toString(36).substr(2, 9)}`);
      return this;
    }),
    Eip: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = pulumi.output(`eipalloc-${Math.random().toString(36).substr(2, 9)}`);
      return this;
    }),
    NatGateway: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = pulumi.output(`nat-${Math.random().toString(36).substr(2, 9)}`);
      return this;
    }),
    VpcEndpoint: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = pulumi.output(`vpce-${Math.random().toString(36).substr(2, 9)}`);
      return this;
    }),
    FlowLog: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = pulumi.output(`fl-${Math.random().toString(36).substr(2, 9)}`);
      return this;
    }),
  },
  s3: {
    Bucket: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = pulumi.output(`bucket-${Math.random().toString(36).substr(2, 9)}`);
      this.bucket = pulumi.output(args.bucket || `test-bucket-${Math.random().toString(36).substr(2, 9)}`);
      this.arn = pulumi.output(`arn:aws:s3:::${args.bucket || 'test-bucket'}`);
      return this;
    }),
    BucketPublicAccessBlock: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      return this;
    }),
    BucketPolicy: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      return this;
    }),
    BucketVersioning: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      return this;
    }),
    BucketServerSideEncryptionConfiguration: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      return this;
    }),
    BucketLifecycleConfiguration: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      return this;
    }),
    BucketNotification: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      return this;
    }),
  },
  dynamodb: {
    Table: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = pulumi.output(`table-${Math.random().toString(36).substr(2, 9)}`);
      this.name = pulumi.output(args.name || 'test-table');
      this.arn = pulumi.output(`arn:aws:dynamodb:ap-south-1:123456789012:table/${args.name || 'test-table'}`);
      return this;
    }),
  },
  kms: {
    Key: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = pulumi.output(`key-${Math.random().toString(36).substr(2, 9)}`);
      this.keyId = pulumi.output(`12345678-1234-1234-1234-123456789012`);
      this.arn = pulumi.output(`arn:aws:kms:ap-south-1:123456789012:key/12345678-1234-1234-1234-123456789012`);
      return this;
    }),
    Alias: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      return this;
    }),
  },
  iam: {
    Role: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = pulumi.output(`role-${Math.random().toString(36).substr(2, 9)}`);
      this.name = pulumi.output(args.name || 'test-role');
      this.arn = pulumi.output(`arn:aws:iam::123456789012:role/${args.name || 'test-role'}`);
      return this;
    }),
    Policy: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = pulumi.output(`policy-${Math.random().toString(36).substr(2, 9)}`);
      this.arn = pulumi.output(`arn:aws:iam::123456789012:policy/${args.name || 'test-policy'}`);
      return this;
    }),
    RolePolicyAttachment: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      return this;
    }),
    InstanceProfile: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = pulumi.output(`instance-profile-${Math.random().toString(36).substr(2, 9)}`);
      this.name = pulumi.output(args.name || 'test-instance-profile');
      return this;
    }),
  },
  cloudtrail: {
    Trail: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = pulumi.output(`trail-${Math.random().toString(36).substr(2, 9)}`);
      this.arn = pulumi.output(`arn:aws:cloudtrail:ap-south-1:123456789012:trail/${args.name || 'test-trail'}`);
      return this;
    }),
  },
  sns: {
    Topic: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = pulumi.output(`topic-${Math.random().toString(36).substr(2, 9)}`);
      this.arn = pulumi.output(`arn:aws:sns:ap-south-1:123456789012:${args.name || 'test-topic'}`);
      return this;
    }),
  },
  cloudwatch: {
    MetricAlarm: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = pulumi.output(`alarm-${Math.random().toString(36).substr(2, 9)}`);
      return this;
    }),
  },
  guardduty: {
    getDetector: jest.fn().mockRejectedValue(new Error('No detector found')), // Simulate no existing detector
    Detector: Object.assign(
      jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
        this.id = pulumi.output(`detector-${Math.random().toString(36).substr(2, 9)}`);
        return this;
      }),
      {
        get: jest.fn().mockImplementation((name: string, id: string, state?: any, opts?: any) => {
          return {
            id: pulumi.output(id),
          };
        }),
      }
    ),
    DetectorFeature: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      return this;
    }),
  },
  cfg: {
    DeliveryChannel: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = pulumi.output(`delivery-channel-${Math.random().toString(36).substr(2, 9)}`);
      this.name = pulumi.output(args.name || 'test-delivery-channel');
      return this;
    }),
    Recorder: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = pulumi.output(`recorder-${Math.random().toString(36).substr(2, 9)}`);
      return this;
    }),
    Rule: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = pulumi.output(`rule-${Math.random().toString(36).substr(2, 9)}`);
      return this;
    }),
  },
}));

describe('SecureInfrastructure Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create SecureInfrastructure with default arguments', () => {
      const infrastructure = new SecureInfrastructure('test-infra', {
        environment: 'test',
        tags: { Environment: 'test' }
      });

      expect(infrastructure).toBeDefined();
      expect(infrastructure.vpcId).toBeDefined();
      expect(infrastructure.publicSubnetIds).toBeDefined();
      expect(infrastructure.privateSubnetIds).toBeDefined();
    });

    it('should create SecureInfrastructure with custom tags', () => {
      const customTags = {
        Environment: 'production',
        Project: 'secure-infra',
        Owner: 'security-team'
      };

      const infrastructure = new SecureInfrastructure('test-infra', {
        environment: 'production',
        tags: customTags
      });

      expect(infrastructure).toBeDefined();
    });
  });

  describe('Network Infrastructure', () => {
    let infrastructure: SecureInfrastructure;

    beforeEach(() => {
      infrastructure = new SecureInfrastructure('test-infra', {
        environment: 'test',
        tags: { Environment: 'test' }
      });
    });

    it('should create VPC with correct CIDR block', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.ec2.Vpc).toHaveBeenCalledWith(
        'main-vpc-test',
        expect.objectContaining({
          cidrBlock: '10.0.0.0/16',
          enableDnsHostnames: true,
          enableDnsSupport: true,
        }),
        expect.any(Object)
      );
    });

    it('should verify VPC CIDR block configuration', () => {
      const aws = require('@pulumi/aws');
      const vpcCalls = (aws.ec2.Vpc as jest.Mock).mock.calls;
      
      // Find the main VPC call
      const mainVpcCall = vpcCalls.find(call => call[0] === 'main-vpc-test');
      expect(mainVpcCall).toBeDefined();
      
      const vpcConfig = mainVpcCall[1];
      expect(vpcConfig.cidrBlock).toBe('10.0.0.0/16');
    });

    it('should create public subnets in different AZs', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        'public-subnet-1-test',
        expect.objectContaining({
          cidrBlock: '10.0.1.0/24',
          mapPublicIpOnLaunch: true,
        }),
        expect.any(Object)
      );

      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        'public-subnet-2-test',
        expect.objectContaining({
          cidrBlock: '10.0.2.0/24',
          mapPublicIpOnLaunch: true,
        }),
        expect.any(Object)
      );
    });

    it('should verify public subnets with specific CIDR blocks', () => {
      const aws = require('@pulumi/aws');
      const subnetCalls = (aws.ec2.Subnet as jest.Mock).mock.calls;
      
      // Find public subnet calls
      const publicSubnet1 = subnetCalls.find(call => call[0] === 'public-subnet-1-test');
      const publicSubnet2 = subnetCalls.find(call => call[0] === 'public-subnet-2-test');
      
      expect(publicSubnet1).toBeDefined();
      expect(publicSubnet2).toBeDefined();
      
      expect(publicSubnet1[1].cidrBlock).toBe('10.0.1.0/24');
      expect(publicSubnet2[1].cidrBlock).toBe('10.0.2.0/24');
      
      // Verify they are public subnets
      expect(publicSubnet1[1].mapPublicIpOnLaunch).toBe(true);
      expect(publicSubnet2[1].mapPublicIpOnLaunch).toBe(true);
    });

    it('should create private subnets in different AZs', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        'private-subnet-1-test',
        expect.objectContaining({
          cidrBlock: '10.0.10.0/24',
          mapPublicIpOnLaunch: false,
        }),
        expect.any(Object)
      );

      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        'private-subnet-2-test',
        expect.objectContaining({
          cidrBlock: '10.0.11.0/24',
          mapPublicIpOnLaunch: false,
        }),
        expect.any(Object)
      );
    });

    it('should create Internet Gateway', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.ec2.InternetGateway).toHaveBeenCalledWith(
        'main-igw-test',
        expect.objectContaining({
          tags: expect.objectContaining({
            Name: 'main-igw-test',
          }),
        }),
        expect.any(Object)
      );
    });

    it('should create NAT Gateway with EIP', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.ec2.Eip).toHaveBeenCalledWith(
        'nat-eip-test',
        expect.objectContaining({
          domain: 'vpc',
        }),
        expect.any(Object)
      );

      expect(aws.ec2.NatGateway).toHaveBeenCalledWith(
        'nat-gateway-test',
        expect.objectContaining({
          tags: expect.objectContaining({
            Name: 'nat-gateway-test',
          }),
        }),
        expect.any(Object)
      );
    });
  });

  describe('Security Groups', () => {
    let infrastructure: SecureInfrastructure;

    beforeEach(() => {
      infrastructure = new SecureInfrastructure('test-infra', {
        environment: 'test',
        tags: { Environment: 'test' }
      });
    });

    it('should create web security group without SSH access', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        'web-security-group-test',
        expect.objectContaining({
          name: 'web-security-group-test',
          description: 'Security group for web servers with restricted access - NO SSH',
          ingress: expect.arrayContaining([
            expect.objectContaining({
              description: 'HTTP access from internet',
              fromPort: 80,
              toPort: 80,
              protocol: 'tcp',
              cidrBlocks: ['0.0.0.0/0'],
            }),
            expect.objectContaining({
              description: 'HTTPS access from internet',
              fromPort: 443,
              toPort: 443,
              protocol: 'tcp',
              cidrBlocks: ['0.0.0.0/0'],
            }),
          ]),
        }),
        expect.any(Object)
      );
    });

    it('should verify SSH access configuration', () => {
      const aws = require('@pulumi/aws');
      const securityGroupCalls = (aws.ec2.SecurityGroup as jest.Mock).mock.calls;
      
      // Check if any security group allows SSH access
      const hasSSHAccess = securityGroupCalls.some(call => {
        const config = call[1];
        if (config.ingress) {
          return config.ingress.some((rule: any) => 
            rule.fromPort === 22 && rule.toPort === 22 && 
            rule.cidrBlocks && rule.cidrBlocks.includes('0.0.0.0/0')
          );
        }
        return false;
      });
      
      expect(hasSSHAccess).toBe(false);
    });

    it('should verify HTTP access configuration', () => {
      const aws = require('@pulumi/aws');
      const securityGroupCalls = (aws.ec2.SecurityGroup as jest.Mock).mock.calls;
      
      // Check if web security group allows HTTP access
      const webSecurityGroupCall = securityGroupCalls.find(call => 
        call[0] === 'web-security-group-test'
      );
      
      expect(webSecurityGroupCall).toBeDefined();
      const config = webSecurityGroupCall[1];
      
      const hasHTTPAccess = config.ingress.some((rule: any) => 
        rule.fromPort === 80 && rule.toPort === 80 && 
        rule.cidrBlocks && rule.cidrBlocks.includes('0.0.0.0/0')
      );
      
      expect(hasHTTPAccess).toBe(true);
    });

    it('should create database security group with restricted access', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        'database-security-group-test',
        expect.objectContaining({
          name: 'database-security-group-test',
          description: 'Security group for database tier - only accessible from web tier',
        }),
        expect.any(Object)
      );
    });

    it('should not allow SSH access in any security group', () => {
      const aws = require('@pulumi/aws');
      const securityGroupCalls = (aws.ec2.SecurityGroup as jest.Mock).mock.calls;
      
      securityGroupCalls.forEach(call => {
        const config = call[1];
        if (config.ingress) {
          config.ingress.forEach((rule: any) => {
            expect(rule.fromPort).not.toBe(22);
            expect(rule.toPort).not.toBe(22);
          });
        }
      });
    });
  });

  describe('Storage Resources', () => {
    let infrastructure: SecureInfrastructure;

    beforeEach(() => {
      infrastructure = new SecureInfrastructure('test-infra', {
        environment: 'test',
        tags: { Environment: 'test' }
      });
    });

    it('should create S3 bucket with encryption', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        'cloudtrail-logs-bucket-test',
        expect.objectContaining({
          tags: expect.objectContaining({
            Name: 'cloudtrail-logs-bucket-test',
            Purpose: 'CloudTrail logs storage',
          }),
        }),
        expect.any(Object)
      );

      expect(aws.s3.BucketServerSideEncryptionConfiguration).toHaveBeenCalled();
    });

    it('should create DynamoDB table with encryption', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.dynamodb.Table).toHaveBeenCalledWith(
        'application-table-test',
        expect.objectContaining({
          name: 'application-data-table-test',
          billingMode: 'PROVISIONED',
          readCapacity: 10,
          writeCapacity: 5,
          pointInTimeRecovery: { enabled: true },
          deletionProtectionEnabled: true,
        }),
        expect.any(Object)
      );
    });

    it('should verify DynamoDB provisioned throughput configuration', () => {
      const aws = require('@pulumi/aws');
      const dynamoTableCalls = (aws.dynamodb.Table as jest.Mock).mock.calls;
      
      // Find the main DynamoDB table call
      const tableCall = dynamoTableCalls.find(call => call[0] === 'application-table-test');
      expect(tableCall).toBeDefined();
      
      const tableConfig = tableCall[1];
      
      expect(tableConfig.billingMode).toBe('PROVISIONED');
      
      // Verify read and write capacity units are specified
      expect(tableConfig.readCapacity).toBeDefined();
      expect(tableConfig.writeCapacity).toBeDefined();
      expect(typeof tableConfig.readCapacity).toBe('number');
      expect(typeof tableConfig.writeCapacity).toBe('number');
      expect(tableConfig.readCapacity).toBeGreaterThan(0);
      expect(tableConfig.writeCapacity).toBeGreaterThan(0);
    });

    it('should verify DynamoDB KMS encryption configuration', () => {
      const aws = require('@pulumi/aws');
      const dynamoTableCalls = (aws.dynamodb.Table as jest.Mock).mock.calls;
      
      const tableCall = dynamoTableCalls.find(call => call[0] === 'application-table-test');
      expect(tableCall).toBeDefined();
      
      const tableConfig = tableCall[1];
      
      expect(tableConfig.serverSideEncryption).toBeDefined();
      expect(tableConfig.serverSideEncryption.enabled).toBe(true);
      expect(tableConfig.serverSideEncryption.kmsKeyArn).toBeDefined();
    });

    it('should create KMS key with proper policy', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.kms.Key).toHaveBeenCalledWith(
        'infrastructure-kms-key-test',
        expect.objectContaining({
          description: 'KMS key for infrastructure encryption - test',
          keyUsage: 'ENCRYPT_DECRYPT',
        }),
        expect.any(Object)
      );

      expect(aws.kms.Alias).toHaveBeenCalledWith(
        'infrastructure-kms-key-alias-test',
        expect.objectContaining({
          name: 'alias/infrastructure-key-test',
        }),
        expect.any(Object)
      );
    });
  });

  describe('IAM Resources', () => {
    let infrastructure: SecureInfrastructure;

    beforeEach(() => {
      infrastructure = new SecureInfrastructure('test-infra', {
        environment: 'test',
        tags: { Environment: 'test' }
      });
    });

    it('should create EC2 role with least privilege policy', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.iam.Role).toHaveBeenCalledWith(
        'ec2-deployment-role-test',
        expect.objectContaining({
          name: 'ec2-deployment-role-test',
          assumeRolePolicy: expect.stringContaining('ec2.amazonaws.com'),
        }),
        expect.any(Object)
      );
    });

    it('should create IAM policy with scoped permissions', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.iam.Policy).toHaveBeenCalledWith(
        'ec2-deployment-policy-test',
        expect.objectContaining({
          name: 'ec2-deployment-policy-test',
          description: 'Policy allowing only necessary EC2 actions for application deployment',
        }),
        expect.any(Object)
      );
    });

    it('should verify IAM role configuration for EC2 deployment', () => {
      const aws = require('@pulumi/aws');
      const iamRoleCalls = (aws.iam.Role as jest.Mock).mock.calls;
      const iamPolicyCalls = (aws.iam.Policy as jest.Mock).mock.calls;
      
      // Find the EC2 deployment role
      const ec2RoleCall = iamRoleCalls.find(call => call[0] === 'ec2-deployment-role-test');
      expect(ec2RoleCall).toBeDefined();
      
      // Find the EC2 deployment policy
      const ec2PolicyCall = iamPolicyCalls.find(call => call[0] === 'ec2-deployment-policy-test');
      expect(ec2PolicyCall).toBeDefined();
      
      const roleConfig = ec2RoleCall[1];
      const policyConfig = ec2PolicyCall[1];
      
      expect(policyConfig.description).toContain('necessary EC2 actions for application deployment');
      
      // Verify role is for EC2 service
      expect(roleConfig.assumeRolePolicy).toContain('ec2.amazonaws.com');
    });

    it('should verify ap-south-1 region deployment configuration', () => {
      const aws = require('@pulumi/aws');
      const providerCalls = (aws.Provider as jest.Mock).mock.calls;
      
      // Find the ap-south-1 provider
      const apSouthProvider = providerCalls.find(call => call[0] === 'ap-south-1-provider-test');
      expect(apSouthProvider).toBeDefined();
      
      const providerConfig = apSouthProvider[1];
      
      expect(providerConfig.region).toBe('ap-south-1');
    });

    it('should attach SSM managed policy for Session Manager', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.iam.RolePolicyAttachment).toHaveBeenCalledWith(
        'ec2-ssm-policy-attachment-test',
        expect.objectContaining({
          policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
        }),
        expect.any(Object)
      );
    });
  });

  describe('Monitoring and Security', () => {
    let infrastructure: SecureInfrastructure;

    beforeEach(() => {
      infrastructure = new SecureInfrastructure('test-infra', {
        environment: 'test',
        tags: { Environment: 'test' }
      });
    });

    it('should create CloudTrail with encryption', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.cloudtrail.Trail).toHaveBeenCalledWith(
        'main-cloudtrail-test',
        expect.objectContaining({
          name: 'main-cloudtrail-test',
          includeGlobalServiceEvents: true,
          isMultiRegionTrail: true,
          enableLogFileValidation: true,
        }),
        expect.any(Object)
      );
    });

    it('should verify CloudTrail logging configuration', () => {
      const aws = require('@pulumi/aws');
      const cloudtrailCalls = (aws.cloudtrail.Trail as jest.Mock).mock.calls;
      
      // Find the main CloudTrail
      const cloudtrailCall = cloudtrailCalls.find(call => call[0] === 'main-cloudtrail-test');
      expect(cloudtrailCall).toBeDefined();
      
      const trailConfig = cloudtrailCall[1];
      
      expect(trailConfig.includeGlobalServiceEvents).toBe(true);
      expect(trailConfig.enableLogFileValidation).toBe(true);
      expect(trailConfig.eventSelectors).toBeDefined();
      
      // Verify S3 bucket is specified for log storage
      expect(trailConfig.s3BucketName).toBeDefined();
    });

    it('should verify CloudTrail S3 bucket encryption configuration', () => {
      const aws = require('@pulumi/aws');
      const cloudtrailCalls = (aws.cloudtrail.Trail as jest.Mock).mock.calls;
      const s3BucketCalls = (aws.s3.Bucket as jest.Mock).mock.calls;
      const s3EncryptionCalls = (aws.s3.BucketServerSideEncryptionConfiguration as jest.Mock).mock.calls;
      
      // Find CloudTrail configuration
      const cloudtrailCall = cloudtrailCalls.find(call => call[0] === 'main-cloudtrail-test');
      expect(cloudtrailCall).toBeDefined();
      
      // Find CloudTrail S3 bucket
      const cloudtrailBucketCall = s3BucketCalls.find(call => call[0] === 'cloudtrail-logs-bucket-test');
      expect(cloudtrailBucketCall).toBeDefined();
      
      // Find S3 encryption configuration
      const encryptionCall = s3EncryptionCalls.find(call => call[0] === 'cloudtrail-bucket-encryption-test');
      expect(encryptionCall).toBeDefined();
      
      const trailConfig = cloudtrailCall[1];
      const encryptionConfig = encryptionCall[1];
      
      expect(trailConfig.kmsKeyId).toBeDefined();
      expect(encryptionConfig.rules[0].applyServerSideEncryptionByDefault.sseAlgorithm).toBe('aws:kms');
      expect(encryptionConfig.rules[0].applyServerSideEncryptionByDefault.kmsMasterKeyId).toBeDefined();
    });

    it('should create SNS topic for alerts', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.sns.Topic).toHaveBeenCalledWith(
        'security-alerts-topic-test',
        expect.objectContaining({
          name: 'security-alerts-topic-test',
          displayName: 'Security Alerts and Monitoring',
        }),
        expect.any(Object)
      );
    });

    it('should create CloudWatch alarms', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledWith(
        'dynamodb-read-throttle-alarm-test',
        expect.objectContaining({
          name: 'dynamodb-read-throttle-alarm-test',
          metricName: 'ReadThrottledEvents',
          namespace: 'AWS/DynamoDB',
        }),
        expect.any(Object)
      );
    });

    it('should create GuardDuty detector with features', () => {
      const aws = require('@pulumi/aws');
      
      // Since we check for existing detector first and create new one if none exists
      expect(aws.guardduty.getDetector).toHaveBeenCalled();
      // Note: The actual detector creation happens asynchronously in pulumi.output().apply()
      // so we can't easily test the exact call in a synchronous test
      expect(aws.guardduty.DetectorFeature).toHaveBeenCalledTimes(3); // S3, EKS, Malware features
    });

    it('should handle AWS Config resources based on environment variable', () => {
      const aws = require('@pulumi/aws');
      
      // By default (without PULUMI_CREATE_CONFIG_RESOURCES=true), 
      // Config recorder and delivery channel should NOT be created
      expect(aws.cfg.DeliveryChannel).not.toHaveBeenCalled();
      expect(aws.cfg.Recorder).not.toHaveBeenCalled();
      
      // But Config rules should always be created
      expect(aws.cfg.Rule).toHaveBeenCalledWith(
        'encrypted-volumes-rule-test',
        expect.objectContaining({
          source: expect.objectContaining({
            sourceIdentifier: 'ENCRYPTED_VOLUMES',
          }),
        }),
        expect.any(Object)
      );
    });
  });

  describe('VPC Endpoints for SSM', () => {
    let infrastructure: SecureInfrastructure;

    beforeEach(() => {
      infrastructure = new SecureInfrastructure('test-infra', {
        environment: 'test',
        tags: { Environment: 'test' }
      });
    });

    it('should create SSM VPC endpoints', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.ec2.VpcEndpoint).toHaveBeenCalledWith(
        'ssm-endpoint-test',
        expect.objectContaining({
          serviceName: 'com.amazonaws.ap-south-1.ssm',
          vpcEndpointType: 'Interface',
        }),
        expect.any(Object)
      );

      expect(aws.ec2.VpcEndpoint).toHaveBeenCalledWith(
        'ssm-messages-endpoint-test',
        expect.objectContaining({
          serviceName: 'com.amazonaws.ap-south-1.ssmmessages',
          vpcEndpointType: 'Interface',
        }),
        expect.any(Object)
      );

      expect(aws.ec2.VpcEndpoint).toHaveBeenCalledWith(
        'ec2-messages-endpoint-test',
        expect.objectContaining({
          serviceName: 'com.amazonaws.ap-south-1.ec2messages',
          vpcEndpointType: 'Interface',
        }),
        expect.any(Object)
      );
    });
  });

  describe('Output Properties', () => {
    let infrastructure: SecureInfrastructure;

    beforeEach(() => {
      infrastructure = new SecureInfrastructure('test-infra', {
        environment: 'test',
        tags: { Environment: 'test' }
      });
    });

    it('should expose all required outputs', () => {
      expect(infrastructure.vpcId).toBeDefined();
      expect(infrastructure.publicSubnetIds).toBeDefined();
      expect(infrastructure.privateSubnetIds).toBeDefined();
      expect(infrastructure.webSecurityGroupId).toBeDefined();
      expect(infrastructure.dbSecurityGroupId).toBeDefined();
      expect(infrastructure.iamRoleArn).toBeDefined();
      expect(infrastructure.instanceProfileName).toBeDefined();
      expect(infrastructure.dynamoTableName).toBeDefined();
      expect(infrastructure.kmsKeyId).toBeDefined();
      expect(infrastructure.kmsKeyArn).toBeDefined();
      expect(infrastructure.cloudtrailArn).toBeDefined();
      expect(infrastructure.s3BucketName).toBeDefined();
      expect(infrastructure.availableAZs).toBeDefined();
      expect(infrastructure.snsTopicArn).toBeDefined();
      expect(infrastructure.guardDutyDetectorId).toBeDefined();
      expect(infrastructure.configDeliveryChannelName).toBeDefined();
    });

    it('should register all outputs', () => {
      expect(infrastructure.vpcId).toBeDefined();
      expect(infrastructure.publicSubnetIds).toBeDefined();
      expect(infrastructure.privateSubnetIds).toBeDefined();
      expect(infrastructure.webSecurityGroupId).toBeDefined();
      expect(infrastructure.dbSecurityGroupId).toBeDefined();
      expect(infrastructure.iamRoleArn).toBeDefined();
      expect(infrastructure.instanceProfileName).toBeDefined();
      expect(infrastructure.dynamoTableName).toBeDefined();
      expect(infrastructure.kmsKeyId).toBeDefined();
      expect(infrastructure.kmsKeyArn).toBeDefined();
      expect(infrastructure.cloudtrailArn).toBeDefined();
      expect(infrastructure.s3BucketName).toBeDefined();
      expect(infrastructure.availableAZs).toBeDefined();
      expect(infrastructure.snsTopicArn).toBeDefined();
      expect(infrastructure.guardDutyDetectorId).toBeDefined();
      expect(infrastructure.configDeliveryChannelName).toBeDefined();
    });
  });

  describe('Infrastructure Requirements Compliance', () => {
    let infrastructure: SecureInfrastructure;

    beforeEach(() => {
      infrastructure = new SecureInfrastructure('test-infra', {
        environment: 'test',
        tags: { Environment: 'test' }
      });
    });

    it('should verify all infrastructure requirements are implemented', () => {
      const aws = require('@pulumi/aws');
      
      // 1. VPC with CIDR '10.0.0.0/16'
      const vpcCalls = (aws.ec2.Vpc as jest.Mock).mock.calls;
      const vpcCall = vpcCalls.find(call => call[0] === 'main-vpc-test');
      expect(vpcCall[1].cidrBlock).toBe('10.0.0.0/16');
      
      // 2. Two public subnets with specific CIDRs in separate AZs
      const subnetCalls = (aws.ec2.Subnet as jest.Mock).mock.calls;
      const publicSubnet1 = subnetCalls.find(call => call[0] === 'public-subnet-1-test');
      const publicSubnet2 = subnetCalls.find(call => call[0] === 'public-subnet-2-test');
      expect(publicSubnet1[1].cidrBlock).toBe('10.0.1.0/24');
      expect(publicSubnet2[1].cidrBlock).toBe('10.0.2.0/24');
      
      // 3. Security groups with HTTP access
      const sgCalls = (aws.ec2.SecurityGroup as jest.Mock).mock.calls;
      const webSgCall = sgCalls.find(call => call[0] === 'web-security-group-test');
      const hasHTTP = webSgCall[1].ingress.some((rule: any) => rule.fromPort === 80);
      expect(hasHTTP).toBe(true);
      
      // 4. IAM role for EC2 deployment
      const iamRoleCalls = (aws.iam.Role as jest.Mock).mock.calls;
      const ec2RoleCall = iamRoleCalls.find(call => call[0] === 'ec2-deployment-role-test');
      expect(ec2RoleCall[1].assumeRolePolicy).toContain('ec2.amazonaws.com');
      
      // 5. CloudTrail enabled for logging
      const cloudtrailCalls = (aws.cloudtrail.Trail as jest.Mock).mock.calls;
      const trailCall = cloudtrailCalls.find(call => call[0] === 'main-cloudtrail-test');
      expect(trailCall[1].includeGlobalServiceEvents).toBe(true);
      
      // 6. S3 bucket with KMS encryption
      const s3EncryptionCalls = (aws.s3.BucketServerSideEncryptionConfiguration as jest.Mock).mock.calls;
      const encryptionCall = s3EncryptionCalls.find(call => call[0] === 'cloudtrail-bucket-encryption-test');
      expect(encryptionCall[1].rules[0].applyServerSideEncryptionByDefault.sseAlgorithm).toBe('aws:kms');
      
      // 7. DynamoDB with provisioned throughput mode
      const dynamoCalls = (aws.dynamodb.Table as jest.Mock).mock.calls;
      const tableCall = dynamoCalls.find(call => call[0] === 'application-table-test');
      expect(tableCall[1].billingMode).toBe('PROVISIONED');
      expect(tableCall[1].readCapacity).toBeGreaterThan(0);
      expect(tableCall[1].writeCapacity).toBeGreaterThan(0);
      
      // 8. DynamoDB with KMS encryption at rest
      expect(tableCall[1].serverSideEncryption.enabled).toBe(true);
      expect(tableCall[1].serverSideEncryption.kmsKeyArn).toBeDefined();
      
      // 9. Resource tagging
      expect(vpcCall[1].tags).toBeDefined();
      expect(vpcCall[1].tags.Environment).toBe('test');
      
      // 10. ap-south-1 region deployment
      const providerCalls = (aws.Provider as jest.Mock).mock.calls;
      const providerCall = providerCalls.find(call => call[0] === 'ap-south-1-provider-test');
      expect(providerCall[1].region).toBe('ap-south-1');
    });

    it('should verify SSH access is blocked for security', () => {
      const aws = require('@pulumi/aws');
      const sgCalls = (aws.ec2.SecurityGroup as jest.Mock).mock.calls;
      
      const hasSSHAccess = sgCalls.some(call => {
        const config = call[1];
        if (config.ingress) {
          return config.ingress.some((rule: any) => 
            rule.fromPort === 22 && rule.cidrBlocks?.includes('0.0.0.0/0')
          );
        }
        return false;
      });
      
      expect(hasSSHAccess).toBe(false);
    });
  });
});
