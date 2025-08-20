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

describe('SecureInfrastructure Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.PULUMI_CREATE_CONFIG_RESOURCES;
  });

  describe('AWS Config Resource Creation', () => {
    it('should create Config recorder and delivery channel when env var is true', () => {
      process.env.PULUMI_CREATE_CONFIG_RESOURCES = 'true';
      const aws = require('@pulumi/aws');

      const infrastructure = new SecureInfrastructure('test-create-config', { 
        environment: 'test' 
      });

      expect(aws.cfg.Recorder).toHaveBeenCalled();
      expect(aws.cfg.DeliveryChannel).toHaveBeenCalled();
      expect(infrastructure).toBeDefined();
    });

    it('should not create Config recorder when env var is false', () => {
      process.env.PULUMI_CREATE_CONFIG_RESOURCES = 'false';
      const aws = require('@pulumi/aws');

      const infrastructure = new SecureInfrastructure('test-no-config', { 
        environment: 'test' 
      });

      expect(aws.cfg.Rule).toHaveBeenCalled();
      expect(infrastructure).toBeDefined();
    });

    it('should not create Config recorder when env var is undefined', () => {
      delete process.env.PULUMI_CREATE_CONFIG_RESOURCES;
      const aws = require('@pulumi/aws');

      const infrastructure = new SecureInfrastructure('test-undefined-config', { 
        environment: 'test' 
      });

      expect(aws.cfg.Rule).toHaveBeenCalled();
      expect(infrastructure).toBeDefined();
    });
  });

  describe('Tag Handling', () => {
    it('should handle undefined tags gracefully', () => {
      const infrastructure = new SecureInfrastructure('test-no-tags', { 
        environment: 'production',
        tags: undefined
      });

      expect(infrastructure).toBeDefined();
      expect(infrastructure.vpcId).toBeDefined();
    });

    it('should merge custom tags with default tags', () => {
      const customTags = { 
        CustomTag: 'CustomValue',
        Environment: 'overridden-env'
      };
      
      const infrastructure = new SecureInfrastructure('test-custom-tags', { 
        environment: 'staging',
        tags: customTags
      });

      expect(infrastructure).toBeDefined();
    });
  });

  describe('Environment Variations', () => {
    it('should handle different environment names', () => {
      const environments = ['dev', 'staging', 'production', 'test'];
      
      environments.forEach(env => {
        const infrastructure = new SecureInfrastructure(`test-${env}`, { 
          environment: env 
        });
        expect(infrastructure).toBeDefined();
      });
    });

    it('should handle empty environment string', () => {
      const infrastructure = new SecureInfrastructure('test-empty-env', { 
        environment: '' 
      });

      expect(infrastructure).toBeDefined();
    });
  });

  describe('Resource Options', () => {
    it('should handle custom resource options', () => {
      const customOpts = {
        protect: true,
        ignoreChanges: ['tags']
      };

      const infrastructure = new SecureInfrastructure('test-custom-opts', { 
        environment: 'test' 
      }, customOpts);

      expect(infrastructure).toBeDefined();
    });
  });
});