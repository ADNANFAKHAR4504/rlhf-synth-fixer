// Mock Pulumi before importing
jest.mock('@pulumi/pulumi', () => ({
  runtime: {
    setMocks: jest.fn(),
  },
  ComponentResource: class MockComponentResource {
    constructor(type: string, name: string, args: any, opts?: any) {
      // Mock implementation
    }
    registerOutputs(outputs: any) {
      // Mock implementation
    }
  },
  all: jest.fn().mockImplementation(values => Promise.resolve(values)),
  Output: jest.fn().mockImplementation(value => ({
    promise: () => Promise.resolve(value),
    apply: (fn: any) => fn(value),
  })),
  Config: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    require: jest.fn(),
    getBoolean: jest.fn(),
  })),
  interpolate: jest.fn((template: string) => template),
  secret: jest.fn((value: string) => value),
  output: jest.fn().mockImplementation(value => ({
    apply: (fn: any) => fn(value),
  })),
}));

// Mock the stack components that TapStack creates
jest.mock('../lib/stacks/kms-stack', () => ({
  KmsStack: jest.fn().mockImplementation(() => ({
    mainKeyId: 'mock-main-key-id',
    mainKeyArn: 'arn:aws:kms:us-east-1:123456789012:key/mock-main-key',
    rdsKeyId: 'mock-rds-key-id',
    rdsKeyArn: 'arn:aws:kms:us-east-1:123456789012:key/mock-rds-key',
  })),
}));

jest.mock('../lib/stacks/vpc-stack', () => ({
  VpcStack: jest.fn().mockImplementation(() => ({
    vpcId: 'mock-vpc-id',
    privateSubnetIds: ['mock-private-subnet-1', 'mock-private-subnet-2'],
    publicSubnetIds: ['mock-public-subnet-1', 'mock-public-subnet-2'],
    internetGatewayId: 'mock-igw-id',
  })),
}));

jest.mock('../lib/stacks/iam-stack', () => ({
  IamStack: jest.fn().mockImplementation(() => ({
    ec2RoleArn: 'arn:aws:iam::123456789012:role/mock-ec2-role',
    ec2InstanceProfileName: 'mock-ec2-profile',
  })),
}));

jest.mock('../lib/stacks/s3-stack', () => ({
  S3Stack: jest.fn().mockImplementation(() => ({
    dataBucketName: 'mock-data-bucket',
    dataBucketArn: 'arn:aws:s3:::mock-data-bucket',
    logsBucketName: 'mock-logs-bucket',
    logsBucketArn: 'arn:aws:s3:::mock-logs-bucket',
  })),
}));

jest.mock('../lib/stacks/security-group-stack', () => ({
  SecurityGroupStack: jest.fn().mockImplementation(() => ({
    webSecurityGroupId: 'mock-web-sg-id',
    appSecurityGroupId: 'mock-app-sg-id',
    dbSecurityGroupId: 'mock-db-sg-id',
  })),
}));

jest.mock('../lib/stacks/rds-stack', () => ({
  RdsStack: jest.fn().mockImplementation(() => ({
    dbInstanceId: 'mock-db-instance',
    dbInstanceArn: 'arn:aws:rds:us-east-1:123456789012:db:mock-db-instance',
    dbInstanceEndpoint: 'mock-db-instance.cluster-xyz.us-east-1.rds.amazonaws.com',
    dbInstancePort: 3306,
  })),
}));

jest.mock('../lib/stacks/ec2-stack', () => ({
  Ec2Stack: jest.fn().mockImplementation(() => ({
    instanceId: 'mock-instance-id',
    instanceArn: 'arn:aws:ec2:us-east-1:123456789012:instance/mock-instance-id',
    privateIp: '10.0.1.100',
    publicIp: '',
  })),
}));

import { TapStack } from '../lib/tap-stack';
import { KmsStack } from '../lib/stacks/kms-stack';
import { VpcStack } from '../lib/stacks/vpc-stack';
import { IamStack } from '../lib/stacks/iam-stack';
import { S3Stack } from '../lib/stacks/s3-stack';
import { SecurityGroupStack } from '../lib/stacks/security-group-stack';
import { RdsStack } from '../lib/stacks/rds-stack';
import { Ec2Stack } from '../lib/stacks/ec2-stack';

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('Stack Instantiation', () => {
    it('should instantiate successfully with default values', () => {
      stack = new TapStack('test-stack', {});
      expect(stack).toBeDefined();
    });

    it('should instantiate successfully with custom values', () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'prod',
        vpcCidr: '172.16.0.0/16',
        instanceType: 't3.small',
        dbInstanceClass: 'db.t3.small',
        enableKeyPairs: true,
        tags: {
          Environment: 'prod',
          Owner: 'test-team',
          Project: 'test-project',
        },
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Stack Component Creation', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      });
    });

    it('should create KMS stack with correct parameters', () => {
      expect(KmsStack).toHaveBeenCalledWith(
        'tap-kms-test',
        {
          environmentSuffix: 'test',
          tags: { Environment: 'test' },
        },
        { parent: expect.any(Object) }
      );
    });

    it('should create VPC stack with correct parameters', () => {
      expect(VpcStack).toHaveBeenCalledWith(
        'tap-vpc-test',
        {
          environmentSuffix: 'test',
          vpcCidr: undefined,
          tags: { Environment: 'test' },
        },
        { parent: expect.any(Object) }
      );
    });

    it('should create IAM stack with correct parameters', () => {
      expect(IamStack).toHaveBeenCalledWith(
        'tap-iam-test',
        {
          environmentSuffix: 'test',
          tags: { Environment: 'test' },
        },
        { parent: expect.any(Object) }
      );
    });

    it('should create S3 stack with correct parameters', () => {
      expect(S3Stack).toHaveBeenCalledWith(
        'tap-s3-test',
        {
          environmentSuffix: 'test',
          mainKmsKeyArn: 'arn:aws:kms:us-east-1:123456789012:key/mock-main-key',
          tags: { Environment: 'test' },
        },
        { parent: expect.any(Object) }
      );
    });

    it('should create Security Group stack with correct parameters', () => {
      expect(SecurityGroupStack).toHaveBeenCalledWith(
        'tap-security-group-test',
        {
          environmentSuffix: 'test',
          vpcId: 'mock-vpc-id',
          tags: { Environment: 'test' },
        },
        { parent: expect.any(Object) }
      );
    });

    it('should create RDS stack with correct parameters', () => {
      expect(RdsStack).toHaveBeenCalledWith(
        'tap-rds-test',
        {
          environmentSuffix: 'test',
          privateSubnetIds: expect.any(Array), // This will be a pulumi.all() result
          dbSecurityGroupId: 'mock-db-sg-id',
          rdsKmsKeyArn: 'arn:aws:kms:us-east-1:123456789012:key/mock-rds-key',
          instanceClass: undefined,
          tags: { Environment: 'test' },
        },
        { parent: expect.any(Object) }
      );
    });

    it('should create EC2 stack with correct parameters', () => {
      expect(Ec2Stack).toHaveBeenCalledWith(
        'tap-ec2-test',
        {
          environmentSuffix: 'test',
          privateSubnetIds: expect.any(Array), // This will be a pulumi.all() result
          webSecurityGroupId: 'mock-web-sg-id',
          ec2InstanceProfileName: 'mock-ec2-profile',
          mainKmsKeyArn: 'arn:aws:kms:us-east-1:123456789012:key/mock-main-key',
          instanceType: undefined,
          enableKeyPairs: undefined,
          tags: { Environment: 'test' },
        },
        { parent: expect.any(Object) }
      );
    });
  });

  describe('Stack Outputs', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
    });

    it('should expose VPC ID output', () => {
      expect(stack.vpcId).toBe('mock-vpc-id');
    });

    it('should expose data bucket name output', () => {
      expect(stack.dataBucketName).toBe('mock-data-bucket');
    });

    it('should expose logs bucket name output', () => {
      expect(stack.logsBucketName).toBe('mock-logs-bucket');
    });

    it('should expose database endpoint output', () => {
      expect(stack.databaseEndpoint).toBe('mock-db-instance.cluster-xyz.us-east-1.rds.amazonaws.com');
    });

    it('should expose web instance ID output', () => {
      expect(stack.webInstanceId).toBe('mock-instance-id');
    });

    it('should expose web instance private IP output', () => {
      expect(stack.webInstancePrivateIp).toBe('10.0.1.100');
    });
  });

  describe('Environment Suffix Usage', () => {
    it('should use default environment suffix when not provided', () => {
      stack = new TapStack('test-stack', {});
      
      expect(KmsStack).toHaveBeenCalledWith(
        'tap-kms-dev',
        expect.objectContaining({
          environmentSuffix: 'dev',
        }),
        expect.any(Object)
      );
    });

    it('should use custom environment suffix when provided', () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'staging',
      });
      
      expect(KmsStack).toHaveBeenCalledWith(
        'tap-kms-staging',
        expect.objectContaining({
          environmentSuffix: 'staging',
        }),
        expect.any(Object)
      );
    });

    it('should pass environment suffix to all stacks', () => {
      const environmentSuffix = 'production';
      stack = new TapStack('test-stack', { environmentSuffix });

      // Verify all stacks receive the environment suffix
      expect(KmsStack).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ environmentSuffix }), expect.any(Object));
      expect(VpcStack).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ environmentSuffix }), expect.any(Object));
      expect(IamStack).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ environmentSuffix }), expect.any(Object));
      expect(S3Stack).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ environmentSuffix }), expect.any(Object));
      expect(SecurityGroupStack).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ environmentSuffix }), expect.any(Object));
      expect(RdsStack).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ environmentSuffix }), expect.any(Object));
      expect(Ec2Stack).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ environmentSuffix }), expect.any(Object));
    });
  });

  describe('Configuration Parameters', () => {
    it('should use custom VPC CIDR when provided', () => {
      const customCidr = '172.16.0.0/16';
      stack = new TapStack('test-stack', { vpcCidr: customCidr });

      expect(VpcStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ vpcCidr: customCidr }),
        expect.any(Object)
      );
    });

    it('should use custom instance type when provided', () => {
      const customInstanceType = 't3.large';
      stack = new TapStack('test-stack', { instanceType: customInstanceType });

      expect(Ec2Stack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ instanceType: customInstanceType }),
        expect.any(Object)
      );
    });

    it('should use custom DB instance class when provided', () => {
      const customDbClass = 'db.t3.large';
      stack = new TapStack('test-stack', { dbInstanceClass: customDbClass });

      expect(RdsStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ instanceClass: customDbClass }),
        expect.any(Object)
      );
    });

    it('should enable key pairs when specified', () => {
      stack = new TapStack('test-stack', { enableKeyPairs: true });

      expect(Ec2Stack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ enableKeyPairs: true }),
        expect.any(Object)
      );
    });
  });
});
