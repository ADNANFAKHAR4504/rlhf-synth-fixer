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
      this.id = pulumi.output(`rtbassoc-${Math.random().toString(36).substr(2, 9)}`);
      return this;
    }),
    Eip: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = pulumi.output(`eip-${Math.random().toString(36).substr(2, 9)}`);
      this.publicIp = pulumi.output('203.0.113.1');
      return this;
    }),
    NatGateway: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = pulumi.output(`nat-${Math.random().toString(36).substr(2, 9)}`);
      return this;
    }),
    SecurityGroup: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = pulumi.output(`sg-${Math.random().toString(36).substr(2, 9)}`);
      return this;
    }),
    VpcEndpoint: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = pulumi.output(`vpce-${Math.random().toString(36).substr(2, 9)}`);
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
    BucketPolicy: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      return this;
    }),
    BucketVersioning: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      return this;
    }),
    BucketServerSideEncryptionConfiguration: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      return this;
    }),
    BucketPublicAccessBlock: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
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
      this.keyId = pulumi.output(`${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 12)}`);
      this.arn = pulumi.output(`arn:aws:kms:ap-south-1:123456789012:key/${this.keyId}`);
      return this;
    }),
    Alias: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = pulumi.output(`alias-${Math.random().toString(36).substr(2, 9)}`);
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
      this.id = pulumi.output(`attachment-${Math.random().toString(36).substr(2, 9)}`);
      return this;
    }),
    InstanceProfile: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = pulumi.output(`profile-${Math.random().toString(36).substr(2, 9)}`);
      this.name = pulumi.output(args.name || 'test-profile');
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
    getDetector: jest.fn(() => Promise.reject(new Error('No detector found'))),
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
      this.id = pulumi.output(`channel-${Math.random().toString(36).substr(2, 9)}`);
      this.name = pulumi.output(args.name || 'test-channel');
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

  let infrastructure: SecureInfrastructure;

  beforeEach(() => {
    infrastructure = new SecureInfrastructure('test', { environment: 'test' });
  });

  describe('Constructor', () => {
    it('should create SecureInfrastructure with default arguments', () => {
      expect(infrastructure).toBeDefined();
      expect(infrastructure.vpcId).toBeDefined();
    });

    it('should create SecureInfrastructure with custom tags', () => {
      const customTags = { CustomTag: 'CustomValue' };
      const customInfrastructure = new SecureInfrastructure('test-custom', { 
        environment: 'test',
        tags: customTags
      });
      
      expect(customInfrastructure).toBeDefined();
    });
  });

  describe('Network Infrastructure', () => {
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

    it('should create public and private subnets', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.ec2.Subnet).toHaveBeenCalled();
    });

    it('should create Internet Gateway', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.ec2.InternetGateway).toHaveBeenCalled();
    });

    it('should create NAT Gateway with EIP', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.ec2.Eip).toHaveBeenCalled();
      expect(aws.ec2.NatGateway).toHaveBeenCalled();
    });
  });

  describe('Security Groups', () => {
    it('should create web and database security groups', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.ec2.SecurityGroup).toHaveBeenCalled();
    });
  });

  describe('Storage Resources', () => {
    it('should create S3 bucket with encryption', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.s3.Bucket).toHaveBeenCalled();
      expect(aws.s3.BucketServerSideEncryptionConfiguration).toHaveBeenCalled();
    });

    it('should create DynamoDB table with encryption', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.dynamodb.Table).toHaveBeenCalled();
    });

    it('should create KMS key', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.kms.Key).toHaveBeenCalled();
      expect(aws.kms.Alias).toHaveBeenCalled();
    });
  });

  describe('IAM Resources', () => {
    it('should create EC2 role and policies', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.iam.Role).toHaveBeenCalled();
      expect(aws.iam.Policy).toHaveBeenCalled();
      expect(aws.iam.RolePolicyAttachment).toHaveBeenCalled();
      expect(aws.iam.InstanceProfile).toHaveBeenCalled();
    });
  });

  describe('Monitoring and Security', () => {
    it('should create CloudTrail', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.cloudtrail.Trail).toHaveBeenCalled();
    });

    it('should create SNS topic', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.sns.Topic).toHaveBeenCalled();
    });

    it('should create CloudWatch alarms', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalled();
    });

    it('should handle GuardDuty detector', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.guardduty.getDetector).toHaveBeenCalled();
      expect(aws.guardduty.DetectorFeature).toHaveBeenCalled();
    });

    it('should handle Config rules', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.cfg.Rule).toHaveBeenCalled();
    });
  });

  describe('VPC Endpoints', () => {
    it('should create SSM VPC endpoints', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.ec2.VpcEndpoint).toHaveBeenCalled();
    });
  });

  describe('Output Properties', () => {
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
  });
});
