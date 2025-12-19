import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack'; // Adjust path as needed

// Mock the modules at the top level before any imports
jest.mock('../lib/modules', () => ({
  KmsModule: jest.fn().mockImplementation((scope, id, props) => ({
    key: {
      keyId: 'mock-kms-key-id',
      arn: 'arn:aws:kms:us-east-1:123456789012:key/mock-key-id',
    },
  })),
  S3Module: jest.fn().mockImplementation((scope, id, props) => ({
    bucket: {
      bucket: `mock-bucket-${id}`,
      arn: `arn:aws:s3:::mock-bucket-${id}`,
    },
  })),
  IamModule: jest.fn().mockImplementation((scope, id, props) => ({
    instanceProfile: {
      name: 'mock-instance-profile',
      arn: 'arn:aws:iam::123456789012:instance-profile/mock-instance-profile',
    },
  })),
  VpcModule: jest.fn().mockImplementation((scope, id, props) => ({
    vpc: {
      id: 'vpc-mock123',
    },
    publicSubnets: [
      { id: 'subnet-public-1' },
      { id: 'subnet-public-2' },
    ],
    privateSubnets: [
      { id: 'subnet-private-1' },
      { id: 'subnet-private-2' },
    ],
  })),
  SecurityGroupModule: jest.fn().mockImplementation((scope, id, props) => ({
    securityGroup: {
      id: `sg-mock-${id}`,
    },
  })),
  Ec2Module: jest.fn().mockImplementation((scope, id, props) => ({
    instance: {
      id: `i-mock-${id}`,
      publicIp: id.includes('public') ? '203.0.113.100' : undefined,
      privateIp: '10.0.1.100',
    },
  })),
  RdsModule: jest.fn().mockImplementation((scope, id, props) => ({
    dbInstance: {
      endpoint: 'mock-db.cluster-xyz.us-east-1.rds.amazonaws.com:5432',
    },
  })),
}));

// Import the mocked modules
import {
  KmsModule,
  S3Module,
  IamModule,
  VpcModule,
  SecurityGroupModule,
  Ec2Module,
  RdsModule,
} from '../lib/modules';

describe('TapStack', () => {
  let app: any;
  
  beforeEach(() => {
    app = Testing.app();
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.AWS_REGION_OVERRIDE;
  });

  describe('Constructor with default props', () => {
    it('should create stack with default configuration', () => {
      const stack = new TapStack(app, 'test-stack');
      const synthesized = Testing.synth(stack);
      
      // Verify the stack is created
      expect(synthesized).toBeDefined();
      expect(typeof synthesized).toBe('string');
    });

    it('should use default environment suffix when not provided', () => {
      new TapStack(app, 'test-stack');
      
      expect(KmsModule).toHaveBeenCalledWith(
        expect.anything(),
        'kms',
        expect.objectContaining({
          environment: 'dev',
        })
      );
    });

    it('should use default AWS region when not provided', () => {
      new TapStack(app, 'test-stack');
      
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          availabilityZones: ['us-east-1a', 'us-east-1b'],
        })
      );
    });
  });

  describe('Constructor with custom props', () => {
    it('should create stack with custom environment suffix', () => {
      new TapStack(app, 'test-stack', {
        environmentSuffix: 'prod',
      });
      
      expect(KmsModule).toHaveBeenCalledWith(
        expect.anything(),
        'kms',
        expect.objectContaining({
          environment: 'prod',
        })
      );
    });

    it('should create stack with custom AWS region', () => {
      new TapStack(app, 'test-stack', {
        awsRegion: 'us-west-2',
      });
      
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          availabilityZones: ['us-west-2a', 'us-west-2b'],
        })
      );
    });

    it('should create stack with custom state bucket configuration', () => {
      const stack = new TapStack(app, 'test-stack', {
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'eu-west-1',
      });
      
      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('custom-state-bucket');
    });

    it('should create stack with custom default tags', () => {
      const customTags = {
        tags: {
          Environment: 'test',
          Project: 'custom-project',
        },
      };
      
      const stack = new TapStack(app, 'test-stack', {
        defaultTags: customTags,
      });
      
      const synthesized = Testing.synth(stack);
      expect(synthesized).toBeDefined();
    });

    it('should handle all custom props together', () => {
      new TapStack(app, 'test-stack', {
        environmentSuffix: 'staging',
        awsRegion: 'eu-west-1',
        stateBucket: 'staging-tf-state',
        stateBucketRegion: 'eu-central-1',
        defaultTags: {
          tags: {
            Environment: 'staging',
          },
        },
      });

      expect(KmsModule).toHaveBeenCalledWith(
        expect.anything(),
        'kms',
        expect.objectContaining({
          environment: 'staging',
        })
      );

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          availabilityZones: ['eu-west-1a', 'eu-west-1b'],
        })
      );
    });
  });

  describe('Environment variable handling', () => {
    it('should use AWS_REGION_OVERRIDE when set', () => {
      process.env.AWS_REGION_OVERRIDE = 'eu-central-1';
      
      new TapStack(app, 'test-stack');
      
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          availabilityZones: ['eu-central-1a', 'eu-central-1b'],
        })
      );
    });

    it('should ignore empty AWS_REGION_OVERRIDE', () => {
      process.env.AWS_REGION_OVERRIDE = '   ';
      
      new TapStack(app, 'test-stack', {
        awsRegion: 'us-west-1',
      });
      
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          availabilityZones: ['us-west-1a', 'us-west-1b'],
        })
      );
    });

    it('should trim whitespace from AWS_REGION_OVERRIDE', () => {
      process.env.AWS_REGION_OVERRIDE = '  ap-southeast-1  ';
      
      new TapStack(app, 'test-stack');
      
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          availabilityZones: ['ap-southeast-1a', 'ap-southeast-1b'],
        })
      );
    });

    it('should override props awsRegion with environment variable', () => {
      process.env.AWS_REGION_OVERRIDE = 'ap-northeast-1';
      
      new TapStack(app, 'test-stack', {
        awsRegion: 'us-west-2', // This should be overridden
      });
      
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          availabilityZones: ['ap-northeast-1a', 'ap-northeast-1b'],
        })
      );
    });

    it('should handle undefined environment variable', () => {
      delete process.env.AWS_REGION_OVERRIDE;
      
      new TapStack(app, 'test-stack', {
        awsRegion: 'ca-central-1',
      });
      
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          availabilityZones: ['ca-central-1a', 'ca-central-1b'],
        })
      );
    });
  });

  describe('Module instantiation', () => {
    it('should create all required modules', () => {
      new TapStack(app, 'test-stack');
      
      expect(KmsModule).toHaveBeenCalledTimes(1);
      expect(S3Module).toHaveBeenCalledTimes(3); // app-data, public-assets, private-data
      expect(IamModule).toHaveBeenCalledTimes(1);
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(SecurityGroupModule).toHaveBeenCalledTimes(3); // public-ec2, private-ec2, rds
      expect(Ec2Module).toHaveBeenCalledTimes(2); // public and private
      expect(RdsModule).toHaveBeenCalledTimes(1);
    });

    it('should create KMS module with correct parameters', () => {
      new TapStack(app, 'test-stack', {
        environmentSuffix: 'staging',
      });
      
      expect(KmsModule).toHaveBeenCalledWith(
        expect.anything(),
        'kms',
        expect.objectContaining({
          project: 'tap-project',
          environment: 'staging',
          description: 'KMS key for tap-project staging environment',
        })
      );
    });

    it('should create S3 modules with correct configurations', () => {
      new TapStack(app, 'test-stack', {
        environmentSuffix: 'prod',
      });
      
      // Check app-data bucket
      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        's3-app-data',
        expect.objectContaining({
          project: 'tap-project',
          environment: 'prod',
          bucketName: 'tap-project-prod-app-data',
        })
      );
      
      // Check public assets bucket
      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        's3-public-assets',
        expect.objectContaining({
          project: 'tap-project',
          environment: 'prod',
          bucketName: 'tap-project-prod-public-assets',
          isPublic: true,
        })
      );
      
      // Check private data bucket
      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        's3-private-data',
        expect.objectContaining({
          project: 'tap-project',
          environment: 'prod',
          bucketName: 'tap-project-prod-private-data',
          isPublic: false,
        })
      );
    });

    it('should create VPC module with correct CIDR and AZs', () => {
      new TapStack(app, 'test-stack', {
        awsRegion: 'ap-northeast-1',
      });
      
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          project: 'tap-project',
          environment: 'dev',
          cidrBlock: '10.0.0.0/16',
          availabilityZones: ['ap-northeast-1a', 'ap-northeast-1b'],
        })
      );
    });

    it('should create security groups with correct rules', () => {
      new TapStack(app, 'test-stack');
      
      // Check public EC2 security group
      expect(SecurityGroupModule).toHaveBeenCalledWith(
        expect.anything(),
        'public-ec2-sg',
        expect.objectContaining({
          name: 'public-ec2',
          description: 'Security group for public EC2 instances',
          rules: expect.arrayContaining([
            expect.objectContaining({
              type: 'ingress',
              fromPort: 22,
              toPort: 22,
              protocol: 'tcp',
              cidrBlocks: ['203.0.113.0/24'],
            }),
          ]),
        })
      );
    });

    it('should create EC2 instances with correct configurations', () => {
      new TapStack(app, 'test-stack');
      
      // Check public EC2
      expect(Ec2Module).toHaveBeenCalledWith(
        expect.anything(),
        'public-ec2',
        expect.objectContaining({
          instanceType: 't3.micro',
          userData: expect.stringContaining('#!/bin/bash'),
        })
      );
      
      // Check private EC2
      expect(Ec2Module).toHaveBeenCalledWith(
        expect.anything(),
        'private-ec2',
        expect.objectContaining({
          instanceType: 't3.micro',
        })
      );
    });

    it('should create RDS module with correct parameters', () => {
      new TapStack(app, 'test-stack');
      
      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        'rds',
        expect.objectContaining({
          project: 'tap-project',
          environment: 'dev',
          engine: 'postgres',
          instanceClass: 'db.t3.micro',
          allocatedStorage: 20,
          dbName: 'appdb',
          username: 'dbadmin',
        })
      );
    });
  });

  describe('AWS resources', () => {
    it('should create AWS provider with correct region', () => {
      const stack = new TapStack(app, 'test-stack', {
        awsRegion: 'eu-west-2',
      });
      
      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('eu-west-2');
    });

    it('should create DataAwsCallerIdentity resource', () => {
      const stack = new TapStack(app, 'test-stack');
      const synthesized = Testing.synth(stack);
      
      // Should contain caller identity data source - check for the actual JSON structure
      expect(synthesized).toContain('"aws_caller_identity"');
      expect(synthesized).toContain('"current"');
    });

    it('should create DataAwsCallerIdentity resource correctly', () => {
      const stack = new TapStack(app, 'test-stack');
      const synthesized = Testing.synth(stack);
      
      // Should contain caller identity data source and not secrets manager (removed)
      expect(synthesized).toContain('"aws_caller_identity"');
      expect(synthesized).toContain('"current"');
      expect(synthesized).not.toContain('"aws_secretsmanager_secret_version"');
    });
  });

  describe('S3 Backend configuration', () => {
    it('should configure S3 backend with correct parameters', () => {
      const stack = new TapStack(app, 'test-stack', {
        environmentSuffix: 'test',
        stateBucket: 'my-tf-state-bucket',
        stateBucketRegion: 'us-west-2',
      });
      
      const synthesized = Testing.synth(stack);
      
      expect(synthesized).toContain('my-tf-state-bucket');
      expect(synthesized).toContain('test/test-stack.tfstate');
      expect(synthesized).toContain('us-west-2');
    });

    it('should enable state locking', () => {
      const stack = new TapStack(app, 'test-stack');
      const synthesized = Testing.synth(stack);
      
      // Should contain use_lockfile override
      expect(synthesized).toContain('use_lockfile');
    });

    it('should use default state bucket configuration', () => {
      const stack = new TapStack(app, 'test-stack');
      const synthesized = Testing.synth(stack);
      
      expect(synthesized).toContain('iac-rlhf-tf-states');
      expect(synthesized).toContain('dev/test-stack.tfstate');
    });
  });

  describe('Terraform outputs', () => {
    it('should create all required outputs', () => {
      const stack = new TapStack(app, 'test-stack');
      const synthesized = Testing.synth(stack);
      
      const expectedOutputs = [
        'vpc-id',
        'public-subnet-ids',
        'private-subnet-ids',
        'public-ec2-instance-id',
        'public-ec2-public-ip',
        'private-ec2-instance-id',
        'private-ec2-private-ip',
        'public-s3-bucket-name',
        'private-s3-bucket-name',
        'rds-endpoint',
        'kms-key-id',
        'aws-account-id',
      ];
      
      // Parse the JSON to check for outputs
      const config = JSON.parse(synthesized);
      expect(config.output).toBeDefined();
      
      expectedOutputs.forEach(output => {
        expect(config.output[output]).toBeDefined();
      });
    });

    it('should create outputs with correct descriptions', () => {
      const stack = new TapStack(app, 'test-stack');
      const synthesized = Testing.synth(stack);
      
      const config = JSON.parse(synthesized);
      
      expect(config.output['vpc-id'].description).toBe('VPC ID');
      expect(config.output['public-subnet-ids'].description).toBe('Public subnet IDs');
      expect(config.output['rds-endpoint'].description).toBe('RDS instance endpoint');
      expect(config.output['aws-account-id'].description).toBe('Current AWS Account ID');
    });

    it('should create outputs with correct values', () => {
      const stack = new TapStack(app, 'test-stack');
      const synthesized = Testing.synth(stack);
      
      const config = JSON.parse(synthesized);
      
      // Check that outputs reference the correct mock values
      expect(config.output['vpc-id'].value).toBe('vpc-mock123');
      expect(config.output['public-subnet-ids'].value).toContain('subnet-public-1');
      expect(config.output['public-s3-bucket-name'].value).toContain('mock-bucket');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle undefined props gracefully', () => {
      expect(() => {
        new TapStack(app, 'test-stack', undefined);
      }).not.toThrow();
    });

    it('should handle empty props object', () => {
      expect(() => {
        new TapStack(app, 'test-stack', {});
      }).not.toThrow();
    });

    it('should handle props with only some values set', () => {
      expect(() => {
        new TapStack(app, 'test-stack', {
          environmentSuffix: 'partial',
        });
      }).not.toThrow();
    });

    it('should handle null environment suffix', () => {
      new TapStack(app, 'test-stack', {
        environmentSuffix: undefined,
      });
      
      expect(KmsModule).toHaveBeenCalledWith(
        expect.anything(),
        'kms',
        expect.objectContaining({
          environment: 'dev', // Should default to 'dev'
        })
      );
    });

    it('should handle empty string environment suffix', () => {
      new TapStack(app, 'test-stack', {
        environmentSuffix: '',
      });
      
      // The code uses || operator, so empty string will fallback to 'dev'
      expect(KmsModule).toHaveBeenCalledWith(
        expect.anything(),
        'kms',
        expect.objectContaining({
          environment: 'dev', // Empty string falls back to 'dev' due to || operator
        })
      );
    });

    it('should handle empty defaultTags array', () => {
      expect(() => {
        new TapStack(app, 'test-stack', {
          defaultTags: undefined,
        });
      }).not.toThrow();
    });
  });

  describe('Integration tests', () => {
    it('should create a valid Terraform configuration', () => {
      const stack = new TapStack(app, 'integration-test', {
        environmentSuffix: 'integration',
        awsRegion: 'us-east-2',
        stateBucket: 'integration-tf-state',
        stateBucketRegion: 'us-east-1',
      });
      
      const synthesized = Testing.synth(stack);
      
      // Basic validation that the configuration is valid
      expect(synthesized).toBeDefined();
      expect(typeof synthesized).toBe('string');
      expect(synthesized.length).toBeGreaterThan(0);
      
      // Parse JSON to ensure it's valid
      expect(() => JSON.parse(synthesized)).not.toThrow();
      
      const config = JSON.parse(synthesized);
      
      // Check that all major components are present
      expect(config.provider).toBeDefined();
      expect(config.data).toBeDefined();
      expect(config.output).toBeDefined();
    });

    it('should create stack with complex configuration', () => {
      const stack = new TapStack(app, 'complex-test', {
        environmentSuffix: 'complex',
        awsRegion: 'ap-south-1',
        stateBucket: 'complex-tf-state',
        stateBucketRegion: 'ap-south-1',
        defaultTags: {
          tags: {
            Environment: 'complex',
            Team: 'infrastructure',
            CostCenter: '12345',
          },
        },
      });
      
      const synthesized = Testing.synth(stack);
      expect(synthesized).toBeDefined();
      
      // Verify all modules were called with complex configuration
      expect(KmsModule).toHaveBeenCalledWith(
        expect.anything(),
        'kms',
        expect.objectContaining({
          environment: 'complex',
        })
      );
      
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          availabilityZones: ['ap-south-1a', 'ap-south-1b'],
        })
      );
    });
  });
});