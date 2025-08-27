// test/integration/tap-stack.integration.test.ts
import { Testing, TerraformStack } from 'cdktf';
import { TapStack } from '../lib/tap-stack';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { S3Backend } from 'cdktf';

// Mock the modules to avoid actual AWS calls during testing
jest.mock('../lib/modules', () => ({
  KmsModule: jest.fn().mockImplementation((scope, id, props) => ({
    key: {
      keyId: 'mock-kms-key-id',
      arn: `arn:aws:kms:${props.region || 'us-east-1'}:123456789012:key/mock-key-id`,
    },
  })),
  S3Module: jest.fn().mockImplementation((scope, id, props) => ({
    bucket: {
      id: `mock-bucket-${id}`,
      bucket: props.bucketName,
      arn: `arn:aws:s3:::${props.bucketName}`,
    },
  })),
  IamModule: jest.fn().mockImplementation((scope, id, props) => ({
    instanceProfile: {
      name: `${props.project}-${props.environment}-instance-profile`,
      arn: `arn:aws:iam::123456789012:instance-profile/${props.project}-${props.environment}-instance-profile`,
    },
    role: {
      name: `${props.project}-${props.environment}-role`,
      arn: `arn:aws:iam::123456789012:role/${props.project}-${props.environment}-role`,
    },
  })),
  VpcModule: jest.fn().mockImplementation((scope, id, props) => ({
    vpc: {
      id: 'vpc-mock123',
      cidrBlock: props.cidrBlock,
    },
    publicSubnets: [
      { id: 'subnet-public1', availabilityZone: props.availabilityZones[0] },
      { id: 'subnet-public2', availabilityZone: props.availabilityZones[1] },
    ],
    privateSubnets: [
      { id: 'subnet-private1', availabilityZone: props.availabilityZones[0] },
      { id: 'subnet-private2', availabilityZone: props.availabilityZones[1] },
    ],
  })),
  SecurityGroupModule: jest.fn().mockImplementation((scope, id, props) => ({
    securityGroup: {
      id: `sg-${props.name}-mock`,
      name: `${props.project}-${props.environment}-${props.name}`,
    },
  })),
  Ec2Module: jest.fn().mockImplementation((scope, id, props) => ({
    instance: {
      id: `i-${id}-mock`,
      publicIp: id.includes('public') ? '203.0.113.100' : undefined,
      privateIp: '10.0.1.100',
      instanceType: props.instanceType,
    },
  })),
  RdsModule: jest.fn().mockImplementation((scope, id, props) => ({
    dbInstance: {
      id: `${props.project}-${props.environment}-db`,
      endpoint: `${props.project}-${props.environment}-db.cluster-xyz.us-east-1.rds.amazonaws.com:5432`,
      engine: props.engine,
      instanceClass: props.instanceClass,
    },
  })),
}));

// Mock AWS data sources
jest.mock('@cdktf/provider-aws/lib/data-aws-caller-identity', () => ({
  DataAwsCallerIdentity: jest.fn().mockImplementation(() => ({
    accountId: '123456789012',
    userId: 'AIDACKCEVSQ6C2EXAMPLE',
    arn: 'arn:aws:iam::123456789012:user/test-user',
  })),
}));

jest.mock('@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version', () => ({
  DataAwsSecretsmanagerSecretVersion: jest.fn().mockImplementation(() => ({
    secretString: 'mock-db-password-123',
    versionId: 'EXAMPLE1-90ab-cdef-fedc-ba987EXAMPLE',
  })),
}));

describe('TapStack Integration Tests', () => {
  let app: any;
  let stack: TapStack;

  beforeEach(() => {
    app = Testing.app();
    jest.clearAllMocks();
  });

  afterEach(() => {
    app = null;
    stack = null as any;
  });

  describe('Stack Creation and Configuration', () => {
    test('should create stack with default configuration', () => {
      stack = new TapStack(app, 'test-stack');
      
      expect(stack).toBeInstanceOf(TerraformStack);
      expect(stack.node.id).toBe('test-stack');
    });

    test('should create stack with custom environment suffix', () => {
      stack = new TapStack(app, 'test-stack', {
        environmentSuffix: 'prod',
      });
      
      expect(stack).toBeInstanceOf(TerraformStack);
    });

    test('should handle AWS region override from environment variable', () => {
      const originalEnv = process.env.AWS_REGION_OVERRIDE;
      process.env.AWS_REGION_OVERRIDE = 'eu-west-1';
      
      stack = new TapStack(app, 'test-stack');
      
      expect(stack).toBeInstanceOf(TerraformStack);
      
      // Restore original environment
      if (originalEnv) {
        process.env.AWS_REGION_OVERRIDE = originalEnv;
      } else {
        delete process.env.AWS_REGION_OVERRIDE;
      }
    });

    test('should create stack with custom props', () => {
      const props = {
        environmentSuffix: 'staging',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-west-2',
        defaultTags: {
          tags: {
            Environment: 'staging',
            Project: 'tap-project',
          },
        },
      };

      stack = new TapStack(app, 'test-stack', props);
      
      expect(stack).toBeInstanceOf(TerraformStack);
    });
  });

  describe('Module Integration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'test-stack', {
        environmentSuffix: 'test',
      });
    });

    test('should create all required modules', () => {
      const {
        KmsModule,
        S3Module,
        IamModule,
        VpcModule,
        SecurityGroupModule,
        Ec2Module,
        RdsModule,
      } = require('../../src/modules');

      // Verify all modules are instantiated
      expect(KmsModule).toHaveBeenCalledTimes(1);
      expect(S3Module).toHaveBeenCalledTimes(3); // app-data, public-assets, private-data
      expect(IamModule).toHaveBeenCalledTimes(1);
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(SecurityGroupModule).toHaveBeenCalledTimes(3); // public-ec2, private-ec2, rds
      expect(Ec2Module).toHaveBeenCalledTimes(2); // public, private
      expect(RdsModule).toHaveBeenCalledTimes(1);
    });

    test('should create KMS module with correct configuration', () => {
      const { KmsModule } = require('../../src/modules');
      
      expect(KmsModule).toHaveBeenCalledWith(
        stack,
        'kms',
        expect.objectContaining({
          project: 'tap-project',
          environment: 'test',
          description: 'KMS key for tap-project test environment',
          accountId: '123456789012',
        })
      );
    });

    test('should create VPC module with correct configuration', () => {
      const { VpcModule } = require('../../src/modules');
      
      expect(VpcModule).toHaveBeenCalledWith(
        stack,
        'vpc',
        expect.objectContaining({
          project: 'tap-project',
          environment: 'test',
          cidrBlock: '10.0.0.0/16',
          availabilityZones: ['us-east-1a', 'us-east-1b'],
        })
      );
    });

    test('should create S3 modules with correct configurations', () => {
      const { S3Module } = require('../../src/modules');
      
      // Check app-data bucket
      expect(S3Module).toHaveBeenCalledWith(
        stack,
        's3-app-data',
        expect.objectContaining({
          project: 'tap-project',
          environment: 'test',
          bucketName: 'tap-project-test-app-data',
        })
      );

      // Check public assets bucket
      expect(S3Module).toHaveBeenCalledWith(
        stack,
        's3-public-assets',
        expect.objectContaining({
          project: 'tap-project',
          environment: 'test',
          bucketName: 'tap-project-test-public-assets',
          isPublic: true,
        })
      );

      // Check private data bucket
      expect(S3Module).toHaveBeenCalledWith(
        stack,
        's3-private-data',
        expect.objectContaining({
          project: 'tap-project',
          environment: 'test',
          bucketName: 'tap-project-test-private-data',
          isPublic: false,
        })
      );
    });

    test('should create security groups with correct rules', () => {
      const { SecurityGroupModule } = require('../../src/modules');
      
      // Check public EC2 security group
      expect(SecurityGroupModule).toHaveBeenCalledWith(
        stack,
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

      // Check RDS security group
      expect(SecurityGroupModule).toHaveBeenCalledWith(
        stack,
        'rds-sg',
        expect.objectContaining({
          name: 'rds',
          description: 'Security group for RDS instances',
          rules: expect.arrayContaining([
            expect.objectContaining({
              type: 'ingress',
              fromPort: 5432,
              toPort: 5432,
              protocol: 'tcp',
            }),
          ]),
        })
      );
    });

    test('should create EC2 instances with correct configurations', () => {
      const { Ec2Module } = require('../../src/modules');
      
      // Check public EC2
      expect(Ec2Module).toHaveBeenCalledWith(
        stack,
        'public-ec2',
        expect.objectContaining({
          project: 'tap-project',
          environment: 'test',
          instanceType: 't3.micro',
          keyName: 'turing-key',
          userData: expect.stringContaining('#!/bin/bash'),
        })
      );

      // Check private EC2
      expect(Ec2Module).toHaveBeenCalledWith(
        stack,
        'private-ec2',
        expect.objectContaining({
          project: 'tap-project',
          environment: 'test',
          instanceType: 't3.micro',
          keyName: 'turing-key',
        })
      );
    });

    test('should create RDS instance with correct configuration', () => {
      const { RdsModule } = require('../../src/modules');
      
      expect(RdsModule).toHaveBeenCalledWith(
        stack,
        'rds',
        expect.objectContaining({
          project: 'tap-project',
          environment: 'test',
          engine: 'postgres',
          instanceClass: 'db.t3.micro',
          allocatedStorage: 20,
          dbName: 'appdb',
          username: 'dbadmin',
          password: 'mock-db-password-123',
        })
      );
    });
  });

  describe('Outputs Validation', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'test-stack', {
        environmentSuffix: 'test',
      });
    });

    test('should generate all required outputs', () => {
      const synthesized = Testing.synth(stack);
      const outputs = synthesized.output;

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

      expectedOutputs.forEach(outputName => {
        expect(outputs).toHaveProperty(outputName);
        expect(outputs[outputName]).toHaveProperty('value');
        expect(outputs[outputName]).toHaveProperty('description');
      });
    });

    test('should have correct output values', () => {
      const synthesized = Testing.synth(stack);
      const outputs = synthesized.output;

      expect(outputs['vpc-id'].value).toBe('${module.vpc.vpc_id}');
      expect(outputs['aws-account-id'].value).toBe('${data.aws_caller_identity.current.account_id}');
      expect(outputs['kms-key-id'].value).toBe('${module.kms.key_id}');
    });
  });

  describe('Provider and Backend Configuration', () => {
    test('should configure AWS provider correctly', () => {
      stack = new TapStack(app, 'test-stack', {
        awsRegion: 'us-west-2',
        defaultTags: {
          tags: {
            Environment: 'test',
            Project: 'tap-project',
          },
        },
      });

      const synthesized = Testing.synth(stack);
      
      expect(synthesized.provider).toHaveProperty('aws');
      expect(synthesized.provider.aws[0]).toMatchObject({
        region: 'us-west-2',
        default_tags: [{
          tags: {
            Environment: 'test',
            Project: 'tap-project',
          },
        }],
      });
    });

    test('should configure S3 backend correctly', () => {
      stack = new TapStack(app, 'test-stack', {
        environmentSuffix: 'prod',
        stateBucket: 'my-custom-state-bucket',
        stateBucketRegion: 'eu-west-1',
      });

      const synthesized = Testing.synth(stack);
      
      expect(synthesized.terraform).toHaveProperty('backend');
      expect(synthesized.terraform.backend.s3).toMatchObject({
        bucket: 'my-custom-state-bucket',
        key: 'prod/test-stack.tfstate',
        region: 'eu-west-1',
        encrypt: true,
        use_lockfile: true,
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty AWS_REGION_OVERRIDE environment variable', () => {
      const originalEnv = process.env.AWS_REGION_OVERRIDE;
      process.env.AWS_REGION_OVERRIDE = '';
      
      stack = new TapStack(app, 'test-stack', {
        awsRegion: 'eu-central-1',
      });
      
      expect(stack).toBeInstanceOf(TerraformStack);
      
      // Restore original environment
      if (originalEnv) {
        process.env.AWS_REGION_OVERRIDE = originalEnv;
      } else {
        delete process.env.AWS_REGION_OVERRIDE;
      }
    });

    test('should handle whitespace in AWS_REGION_OVERRIDE', () => {
      const originalEnv = process.env.AWS_REGION_OVERRIDE;
      process.env.AWS_REGION_OVERRIDE = '  ap-southeast-1  ';
      
      stack = new TapStack(app, 'test-stack');
      
      expect(stack).toBeInstanceOf(TerraformStack);
      
      // Restore original environment
      if (originalEnv) {
        process.env.AWS_REGION_OVERRIDE = originalEnv;
      } else {
        delete process.env.AWS_REGION_OVERRIDE;
      }
    });

    test('should work without any props', () => {
      expect(() => {
        stack = new TapStack(app, 'test-stack');
      }).not.toThrow();
      
      expect(stack).toBeInstanceOf(TerraformStack);
    });
  });

  describe('Resource Dependencies', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'test-stack', {
        environmentSuffix: 'test',
      });
    });

    test('should pass KMS key to S3 modules', () => {
      const { S3Module } = require('../../src/modules');
      
      const s3Calls = S3Module.mock.calls;
      s3Calls.forEach(call => {
        const props = call[2];
        expect(props).toHaveProperty('kmsKey');
        expect(props.kmsKey).toHaveProperty('keyId', 'mock-kms-key-id');
      });
    });

    test('should pass VPC resources to security groups', () => {
      const { SecurityGroupModule } = require('../../src/modules');
      
      const sgCalls = SecurityGroupModule.mock.calls;
      sgCalls.forEach(call => {
        const props = call[2];
        expect(props).toHaveProperty('vpcId', 'vpc-mock123');
      });
    });

    test('should pass security group references correctly', () => {
      const { SecurityGroupModule } = require('../../src/modules');
      
      // Find the private EC2 security group call
      const privateEc2SgCall = SecurityGroupModule.mock.calls.find(
        call => call[1] === 'private-ec2-sg'
      );
      
      expect(privateEc2SgCall).toBeDefined();
      const rules = privateEc2SgCall[2].rules;
      const sshRule = rules.find(rule => rule.fromPort === 22);
      expect(sshRule).toHaveProperty('sourceSecurityGroupId');
    });

    test('should pass IAM instance profile to EC2 modules', () => {
      const { Ec2Module } = require('../../src/modules');
      
      const ec2Calls = Ec2Module.mock.calls;
      ec2Calls.forEach(call => {
        const props = call[2];
        expect(props).toHaveProperty('instanceProfile');
        expect(props.instanceProfile).toHaveProperty('name');
      });
    });
  });

  describe('Synthesis Validation', () => {
    test('should synthesize without errors', () => {
      stack = new TapStack(app, 'test-stack');
      
      expect(() => {
        Testing.synth(stack);
      }).not.toThrow();
    });

    test('should produce valid Terraform configuration', () => {
      stack = new TapStack(app, 'test-stack', {
        environmentSuffix: 'test',
      });
      
      const synthesized = Testing.synth(stack);
      
      // Check that essential Terraform blocks are present
      expect(synthesized).toHaveProperty('terraform');
      expect(synthesized).toHaveProperty('provider');
      expect(synthesized).toHaveProperty('output');
      expect(synthesized.terraform).toHaveProperty('backend');
    });
  });
});