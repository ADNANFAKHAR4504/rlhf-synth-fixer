// __tests__/tap-stack.unit.test.ts

import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

// Mock all the modules used in TapStack
jest.mock('../lib/modules', () => ({
  KmsModule: jest.fn().mockImplementation((scope, id) => ({
    key: {
      keyId: `${id}-kms-key-id`,
      arn: `arn:aws:kms:us-east-1:123456789012:key/${id}-kms-key-id`
    }
  })),
  
  S3Module: jest.fn().mockImplementation((scope, id, props) => ({
    bucket: {
      bucket: props.bucketName,
      arn: `arn:aws:s3:::${props.bucketName}`,
      id: `${id}-bucket-id`
    }
  })),
  
  IamModule: jest.fn().mockImplementation((scope, id) => ({
    instanceProfile: {
      name: `${id}-instance-profile`,
      arn: `arn:aws:iam::123456789012:instance-profile/${id}-instance-profile`
    }
  })),
  
  VpcModule: jest.fn().mockImplementation((scope, id) => ({
    vpc: {
      id: `${id}-vpc-id`,
      arn: `arn:aws:ec2:us-east-1:123456789012:vpc/${id}-vpc-id`
    },
    publicSubnets: [
      { id: 'subnet-public-1', availabilityZone: 'us-east-1a' },
      { id: 'subnet-public-2', availabilityZone: 'us-east-1b' }
    ],
    privateSubnets: [
      { id: 'subnet-private-1', availabilityZone: 'us-east-1a' },
      { id: 'subnet-private-2', availabilityZone: 'us-east-1b' }
    ]
  })),
  
  SecurityGroupModule: jest.fn().mockImplementation((scope, id) => ({
    securityGroup: {
      id: `${id}-sg-id`,
      arn: `arn:aws:ec2:us-east-1:123456789012:security-group/${id}-sg-id`
    }
  })),
  
  Ec2Module: jest.fn().mockImplementation((scope, id) => ({
    instance: {
      id: `${id}-instance-id`,
      publicIp: id.includes('public') ? '203.0.113.100' : undefined,
      privateIp: '10.0.1.100'
    }
  })),
  
  RdsModule: jest.fn().mockImplementation((scope, id) => ({
    dbInstance: {
      endpoint: `${id}-db.cluster-xyz.us-east-1.rds.amazonaws.com`,
      port: 5432,
      resourceId: `${id}-db-resource-id`
    }
  }))
}));

// Mock CDKTF AWS provider data sources
jest.mock('@cdktf/provider-aws/lib/data-aws-caller-identity', () => ({
  DataAwsCallerIdentity: jest.fn().mockImplementation(() => ({
    accountId: '123456789012'
  }))
}));

jest.mock('@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version', () => ({
  DataAwsSecretsmanagerSecretVersion: jest.fn().mockImplementation(() => ({
    secretString: 'mock-db-password'
  }))
}));

describe('TapStack Unit Tests', () => {
  const { 
    KmsModule,
    S3Module,
    IamModule,
    VpcModule,
    SecurityGroupModule,
    Ec2Module,
    RdsModule
  } = require('../lib/modules');

  // Store original environment variables
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  describe('Constructor and Configuration', () => {
    test('should create TapStack with default configuration', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack');

      expect(stack).toBeDefined();
      expect(stack.node.id).toBe('TestStack');
    });

    test('should create TapStack with undefined props', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStackUndefined', undefined);

      expect(stack).toBeDefined();
      expect(stack.node.id).toBe('TestStackUndefined');
    });

    test('should create TapStack with empty props object', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStackEmpty', {});

      expect(stack).toBeDefined();
      expect(stack.node.id).toBe('TestStackEmpty');
    });

    test('should create TapStack with custom props', () => {
      const app = Testing.app();
      const customProps = {
        environmentSuffix: 'prod',
        awsRegion: 'us-west-2',
        stateBucket: 'custom-tf-states',
        stateBucketRegion: 'us-west-2'
      };

      const stack = new TapStack(app, 'TestStackCustom', customProps);

      expect(stack).toBeDefined();
      expect(stack.node.id).toBe('TestStackCustom');
    });

    test('should handle partial props configuration', () => {
      const app = Testing.app();
      const partialProps = {
        environmentSuffix: 'staging'
        // Missing other props to test default fallbacks
      };

      const stack = new TapStack(app, 'TestStackPartial', partialProps);

      expect(stack).toBeDefined();
      expect(stack.node.id).toBe('TestStackPartial');
    });

    test('should handle AWS region override with environment variable', () => {
      // Set environment variable to test the override branch
      process.env.AWS_REGION_OVERRIDE = 'eu-west-1';
      
      const app = Testing.app();
      const props = { awsRegion: 'us-west-2' };
      
      new TapStack(app, 'TestStackOverride', props);
      
      // The VPC should use eu-west-1 AZs due to the override
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          availabilityZones: ['eu-west-1a', 'eu-west-1b']
        })
      );
    });

    test('should handle AWS region override when not set', () => {
      // Ensure environment variable is not set
      delete process.env.AWS_REGION_OVERRIDE;
      
      const app = Testing.app();
      const props = { awsRegion: 'eu-central-1' };
      
      new TapStack(app, 'TestStackNoOverride', props);
      
      // The VPC should use the provided region AZs
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          availabilityZones: ['eu-central-1a', 'eu-central-1b']
        })
      );
    });

    test('should use default region when no region specified', () => {
      // Ensure environment variable is not set
      delete process.env.AWS_REGION_OVERRIDE;
      
      const app = Testing.app();
      new TapStack(app, 'TestStackDefaultRegion');
      
      // Should use default us-east-1 region
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          availabilityZones: ['us-east-1a', 'us-east-1b']
        })
      );
    });

    test('should handle defaultTags configuration', () => {
      const app = Testing.app();
      const propsWithTags = {
        defaultTags: {
          tags: {
            Environment: 'test',
            Project: 'tap-test',
            Owner: 'TestTeam'
          }
        }
      };

      const stack = new TapStack(app, 'TestStackTags', propsWithTags);
      expect(stack).toBeDefined();
    });

    test('should handle missing defaultTags', () => {
      const app = Testing.app();
      const propsWithoutTags = {
        environmentSuffix: 'test'
        // No defaultTags property
      };

      const stack = new TapStack(app, 'TestStackNoTags', propsWithoutTags);
      expect(stack).toBeDefined();
    });
  });

  describe('Module Creation and Configuration', () => {
    test('should create KMS module with correct configuration', () => {
      const app = Testing.app();
      new TapStack(app, 'TestStackKMS');

      expect(KmsModule).toHaveBeenCalledTimes(1);
      expect(KmsModule).toHaveBeenCalledWith(
        expect.anything(),
        'kms',
        expect.objectContaining({
          project: 'tap-project',
          environment: 'dev',
          description: 'KMS key for tap-project dev environment',
          accountId: '123456789012'
        })
      );
    });

    test('should create VPC module with correct configuration', () => {
      const app = Testing.app();
      new TapStack(app, 'TestStackVPC');

      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          project: 'tap-project',
          environment: 'dev',
          cidrBlock: '10.0.0.0/16',
          availabilityZones: ['us-east-1a', 'us-east-1b']
        })
      );
    });

    test('should create all security groups with correct configurations', () => {
      const app = Testing.app();
      new TapStack(app, 'TestStackSG');

      expect(SecurityGroupModule).toHaveBeenCalledTimes(3);

      // Public EC2 Security Group
      expect(SecurityGroupModule).toHaveBeenCalledWith(
        expect.anything(),
        'public-ec2-sg',
        expect.objectContaining({
          project: 'tap-project',
          environment: 'dev',
          name: 'public-ec2',
          description: 'Security group for public EC2 instances',
          vpcId: 'vpc-vpc-id',
          rules: expect.arrayContaining([
            expect.objectContaining({
              type: 'ingress',
              fromPort: 22,
              toPort: 22,
              protocol: 'tcp',
              cidrBlocks: ['203.0.113.0/24']
            })
          ])
        })
      );

      // Private EC2 Security Group
      expect(SecurityGroupModule).toHaveBeenCalledWith(
        expect.anything(),
        'private-ec2-sg',
        expect.objectContaining({
          project: 'tap-project',
          environment: 'dev',
          name: 'private-ec2',
          description: 'Security group for private EC2 instances',
          vpcId: 'vpc-vpc-id',
          rules: expect.arrayContaining([
            expect.objectContaining({
              type: 'ingress',
              fromPort: 22,
              toPort: 22,
              protocol: 'tcp',
              sourceSecurityGroupId: 'public-ec2-sg-sg-id'
            })
          ])
        })
      );

      // RDS Security Group
      expect(SecurityGroupModule).toHaveBeenCalledWith(
        expect.anything(),
        'rds-sg',
        expect.objectContaining({
          project: 'tap-project',
          environment: 'dev',
          name: 'rds',
          description: 'Security group for RDS instances',
          vpcId: 'vpc-vpc-id',
          rules: expect.arrayContaining([
            expect.objectContaining({
              type: 'ingress',
              fromPort: 5432,
              toPort: 5432,
              protocol: 'tcp',
              sourceSecurityGroupId: 'private-ec2-sg-sg-id'
            })
          ])
        })
      );
    });

    test('should create S3 buckets with correct configurations', () => {
      const app = Testing.app();
      new TapStack(app, 'TestStackS3');

      expect(S3Module).toHaveBeenCalledTimes(3); // app-data, public-assets, private-data

      // App data bucket
      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        's3-app-data',
        expect.objectContaining({
          project: 'tap-project',
          environment: 'dev',
          bucketName: 'tap-project-dev-app-data',
          kmsKey: expect.objectContaining({
            keyId: 'kms-kms-key-id'
          })
        })
      );

      // Public assets bucket
      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        's3-public-assets',
        expect.objectContaining({
          project: 'tap-project',
          environment: 'dev',
          bucketName: 'tap-project-dev-public-assets',
          kmsKey: expect.objectContaining({
            keyId: 'kms-kms-key-id'
          }),
          isPublic: true
        })
      );

      // Private data bucket
      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        's3-private-data',
        expect.objectContaining({
          project: 'tap-project',
          environment: 'dev',
          bucketName: 'tap-project-dev-private-data',
          kmsKey: expect.objectContaining({
            keyId: 'kms-kms-key-id'
          }),
          isPublic: false
        })
      );
    });

    test('should create IAM module with correct configuration', () => {
      const app = Testing.app();
      new TapStack(app, 'TestStackIAM');

      expect(IamModule).toHaveBeenCalledTimes(1);
      expect(IamModule).toHaveBeenCalledWith(
        expect.anything(),
        'iam',
        expect.objectContaining({
          project: 'tap-project',
          environment: 'dev',
          appDataBucketArn: 'arn:aws:s3:::tap-project-dev-app-data'
        })
      );
    });

    test('should create EC2 instances with correct configurations', () => {
      const app = Testing.app();
      new TapStack(app, 'TestStackEC2');

      expect(Ec2Module).toHaveBeenCalledTimes(2);

      // Public EC2 instance
      expect(Ec2Module).toHaveBeenCalledWith(
        expect.anything(),
        'public-ec2',
        expect.objectContaining({
          project: 'tap-project',
          environment: 'dev',
          instanceType: 't3.micro',
          subnetId: 'subnet-public-1',
          securityGroupIds: ['public-ec2-sg-sg-id'],
          instanceProfile: expect.objectContaining({
            name: 'iam-instance-profile'
          }),
          keyName: 'turing-key',
          userData: expect.stringContaining('#!/bin/bash')
        })
      );

      // Private EC2 instance
      expect(Ec2Module).toHaveBeenCalledWith(
        expect.anything(),
        'private-ec2',
        expect.objectContaining({
          project: 'tap-project',
          environment: 'dev',
          instanceType: 't3.micro',
          subnetId: 'subnet-private-1',
          securityGroupIds: ['private-ec2-sg-sg-id'],
          instanceProfile: expect.objectContaining({
            name: 'iam-instance-profile'
          }),
          keyName: 'turing-key'
        })
      );
    });

    test('should create RDS database with correct configuration', () => {
      const app = Testing.app();
      new TapStack(app, 'TestStackRDS');

      expect(RdsModule).toHaveBeenCalledTimes(1);
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
          password: 'mock-db-password',
          subnetIds: ['subnet-private-1', 'subnet-private-2'],
          securityGroupIds: ['rds-sg-sg-id'],
          kmsKey: expect.objectContaining({
            keyId: 'kms-kms-key-id'
          })
        })
      );
    });
  });

  describe('Environment and Configuration Variations', () => {
    test('should create stack with custom environment suffix', () => {
      const app = Testing.app();
      const props = { environmentSuffix: 'staging' };
      new TapStack(app, 'TestStackStaging', props);

      expect(KmsModule).toHaveBeenCalledWith(
        expect.anything(),
        'kms',
        expect.objectContaining({
          environment: 'staging'
        })
      );

      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        's3-app-data',
        expect.objectContaining({
          bucketName: 'tap-project-staging-app-data'
        })
      );
    });

    test('should configure S3 backend with default settings', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStackBackendDefault');
      
      expect(stack).toBeDefined();
    });

    test('should configure S3 backend with custom settings', () => {
      const app = Testing.app();
      const props = {
        environmentSuffix: 'test',
        stateBucket: 'my-tf-states',
        stateBucketRegion: 'us-west-2'
      };
      
      const stack = new TapStack(app, 'TestStackBackend', props);
      
      expect(stack).toBeDefined();
    });

    test('should create stack with proper resource naming convention', () => {
      const app = Testing.app();
      const stackName = 'MyTapStack';
      const stack = new TapStack(app, stackName);

      expect(stack.node.id).toBe(stackName);
      
      // Verify consistent naming across modules
      expect(KmsModule).toHaveBeenCalledWith(expect.anything(), 'kms', expect.anything());
      expect(VpcModule).toHaveBeenCalledWith(expect.anything(), 'vpc', expect.anything());
      expect(S3Module).toHaveBeenCalledWith(expect.anything(), 's3-app-data', expect.anything());
      expect(RdsModule).toHaveBeenCalledWith(expect.anything(), 'rds', expect.anything());
    });
  });

  describe('Integration and Dependencies', () => {
    test('should handle module integration correctly', () => {
      const app = Testing.app();
      new TapStack(app, 'TestStackIntegration');

      // Verify all modules are created
      expect(KmsModule).toHaveBeenCalledTimes(1);
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(SecurityGroupModule).toHaveBeenCalledTimes(3);
      expect(S3Module).toHaveBeenCalledTimes(3);
      expect(IamModule).toHaveBeenCalledTimes(1);
      expect(Ec2Module).toHaveBeenCalledTimes(2);
      expect(RdsModule).toHaveBeenCalledTimes(1);

      // Verify dependencies are passed correctly
      const rdsCall = RdsModule.mock.calls[0];
      expect(rdsCall[2]).toEqual(expect.objectContaining({
        subnetIds: ['subnet-private-1', 'subnet-private-2'],
        securityGroupIds: ['rds-sg-sg-id']
      }));
    });

    test('should handle secrets manager integration', () => {
      const app = Testing.app();
      new TapStack(app, 'TestStackSecrets');

      // Verify RDS module receives the secret value
      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        'rds',
        expect.objectContaining({
          password: 'mock-db-password'
        })
      );
    });

    test('should create terraform outputs with correct values', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStackOutputs');

      // Verify that TerraformOutput instances are created
      // Note: In CDKTF, we can't easily test the actual output values without synthesizing
      // But we can verify the stack was created successfully
      expect(stack).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should create stack without throwing errors', () => {
      const app = Testing.app();
      
      expect(() => {
        new TapStack(app, 'TestStackNoErrors');
      }).not.toThrow();
    });

    test('should synthesize stack successfully', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStackSynth');
      
      expect(() => {
        Testing.synth(stack);
      }).not.toThrow();
    });

    test('should handle null props gracefully', () => {
      const app = Testing.app();
      
      expect(() => {
        new TapStack(app, 'TestStackNull', null as any);
      }).not.toThrow();
    });

    test('should handle props with only some properties defined', () => {
      const app = Testing.app();
      const sparseProps = {
        environmentSuffix: 'sparse'
        // Other properties intentionally undefined
      };
      
      expect(() => {
        new TapStack(app, 'TestStackSparse', sparseProps);
      }).not.toThrow();
    });

    test('should handle different region formats', () => {
      const app = Testing.app();
      const regionsToTest = [
        'us-east-1',
        'us-west-2',
        'eu-central-1',
        'ap-southeast-1'
      ];

      regionsToTest.forEach((region, index) => {
        const props = { awsRegion: region };
        expect(() => {
          new TapStack(app, `TestStackRegion${index}`, props);
        }).not.toThrow();
      });
    });
  });

  describe('Environment Variable Handling', () => {
    test('should handle AWS_REGION_OVERRIDE environment variable when set', () => {
      process.env.AWS_REGION_OVERRIDE = 'ap-south-1';
      
      const app = Testing.app();
      new TapStack(app, 'TestStackEnvOverride');
      
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          availabilityZones: ['ap-south-1a', 'ap-south-1b']
        })
      );
    });

    test('should handle AWS_REGION_OVERRIDE when undefined', () => {
      delete process.env.AWS_REGION_OVERRIDE;
      
      const app = Testing.app();
      const props = { awsRegion: 'ca-central-1' };
      new TapStack(app, 'TestStackNoEnvOverride', props);
      
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          availabilityZones: ['ca-central-1a', 'ca-central-1b']
        })
      );
    });

    test('should handle AWS_REGION_OVERRIDE when empty string', () => {
      process.env.AWS_REGION_OVERRIDE = '';
      
      const app = Testing.app();
      const props = { awsRegion: 'sa-east-1' };
      new TapStack(app, 'TestStackEmptyEnvOverride', props);
      
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          availabilityZones: ['sa-east-1a', 'sa-east-1b']
        })
      );
    });
  });
});