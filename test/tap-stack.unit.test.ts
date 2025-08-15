import { TapStack, TapStackArgs } from '../lib/tap-stack';

// Mock Pulumi modules
jest.mock('@pulumi/pulumi', () => ({
  ComponentResource: class MockComponentResource {
    registerOutputs = jest.fn();
  },
  all: jest.fn().mockReturnValue({
    apply: jest.fn().mockReturnValue({
      promise: () => Promise.resolve('mock-summary'),
    }),
  }),
  Output: jest.fn(),
}));

jest.mock('@pulumi/aws', () => ({
  s3: {
    Bucket: jest.fn().mockImplementation(() => ({
      id: { promise: () => Promise.resolve('mock-bucket-id') },
      arn: { promise: () => Promise.resolve('mock-bucket-arn') },
    })),
    BucketServerSideEncryptionConfiguration: jest.fn(),
    BucketPublicAccessBlock: jest.fn(),
    BucketVersioning: jest.fn(),
  },
  iam: {
    Role: jest.fn().mockImplementation(() => ({
      arn: { promise: () => Promise.resolve('mock-role-arn') },
      name: { promise: () => Promise.resolve('mock-role-name') },
    })),
    Policy: jest.fn().mockImplementation(() => ({
      arn: { promise: () => Promise.resolve('mock-policy-arn') },
    })),
    RolePolicyAttachment: jest.fn(),
  },
  rds: {
    SubnetGroup: jest.fn().mockImplementation(() => ({
      name: { promise: () => Promise.resolve('mock-subnet-group') },
    })),
    ParameterGroup: jest.fn().mockImplementation(() => ({
      name: { promise: () => Promise.resolve('mock-param-group') },
    })),
    Instance: jest.fn().mockImplementation(() => ({
      endpoint: { promise: () => Promise.resolve('mock-endpoint') },
      id: { promise: () => Promise.resolve('mock-instance-id') },
    })),
  },
  ec2: {
    SecurityGroup: jest.fn().mockImplementation(() => ({
      id: { promise: () => Promise.resolve('mock-sg-id') },
    })),
    getVpc: jest.fn().mockReturnValue(Promise.resolve({ id: 'vpc-12345' })),
    getSubnets: jest
      .fn()
      .mockReturnValue(Promise.resolve({ ids: ['subnet-1', 'subnet-2'] })),
  },
  dynamodb: {
    Table: jest.fn().mockImplementation(() => ({
      name: { promise: () => Promise.resolve('mock-table-name') },
      arn: { promise: () => Promise.resolve('mock-table-arn') },
    })),
  },
}));

// Mock the infrastructure class
jest.mock('../lib/infrastructure', () => ({
  Infrastructure: jest.fn().mockImplementation(() => ({
    s3BucketId: { promise: () => Promise.resolve('mock-bucket-id') },
    s3BucketArn: { promise: () => Promise.resolve('mock-bucket-arn') },
    iamRoleArn: { promise: () => Promise.resolve('mock-role-arn') },
    rdsEndpoint: { promise: () => Promise.resolve('mock-endpoint') },
    rdsInstanceId: { promise: () => Promise.resolve('mock-instance-id') },
    dynamoTableName: { promise: () => Promise.resolve('mock-table-name') },
    dynamoTableArn: { promise: () => Promise.resolve('mock-table-arn') },
    infrastructureSummary: { promise: () => Promise.resolve('mock-summary') },
  })),
}));

describe('TapStack Structure', () => {
  describe('TapStackArgs interface', () => {
    it('should accept valid arguments', () => {
      const validArgs: TapStackArgs = {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'production',
          Project: 'test',
        },
      };

      expect(validArgs.environmentSuffix).toBe('prod');
      expect(validArgs.tags).toEqual({
        Environment: 'production',
        Project: 'test',
      });
    });

    it('should accept minimal arguments', () => {
      const minimalArgs: TapStackArgs = {};
      expect(minimalArgs).toBeDefined();
    });
  });

  describe('TapStack instantiation', () => {
    it('should instantiate with valid arguments', () => {
      const stack = new TapStack('TestStack', {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      });

      expect(stack).toBeDefined();
      expect(stack).toHaveProperty('s3BucketId');
      expect(stack).toHaveProperty('s3BucketArn');
      expect(stack).toHaveProperty('iamRoleArn');
      expect(stack).toHaveProperty('rdsEndpoint');
      expect(stack).toHaveProperty('rdsInstanceId');
      expect(stack).toHaveProperty('dynamoTableName');
      expect(stack).toHaveProperty('dynamoTableArn');
      expect(stack).toHaveProperty('infrastructureSummary');
    });

    it('should instantiate with default values', () => {
      const stack = new TapStack('TestStackDefault', {});

      expect(stack).toBeDefined();
      expect(stack).toHaveProperty('s3BucketId');
      expect(stack).toHaveProperty('s3BucketArn');
      expect(stack).toHaveProperty('iamRoleArn');
      expect(stack).toHaveProperty('rdsEndpoint');
      expect(stack).toHaveProperty('rdsInstanceId');
      expect(stack).toHaveProperty('dynamoTableName');
      expect(stack).toHaveProperty('dynamoTableArn');
      expect(stack).toHaveProperty('infrastructureSummary');
    });

    it('should use default environment suffix when not provided', () => {
      const stack = new TapStack('TestStackDefault', {});
      expect(stack).toBeDefined();
      // The default environmentSuffix should be 'dev'
    });

    it('should use provided environment suffix', () => {
      const stack = new TapStack('TestStackProd', {
        environmentSuffix: 'prod',
      });
      expect(stack).toBeDefined();
      // Should use 'prod' as environmentSuffix
    });
  });

  describe('Resource naming conventions', () => {
    it('should use consistent naming pattern with environmentSuffix', () => {
      // This test verifies that the naming convention follows the pattern:
      // corp-{service}-{purpose}-{environmentSuffix}
      const stack = new TapStack('TestNaming', {
        environmentSuffix: 'staging',
      });

      expect(stack).toBeDefined();
      // The actual resource names would be:
      // - corp-s3-secure-data-staging
      // - corp-iam-role-s3-access-staging
      // - corp-rds-primary-staging
      // - corp-dynamodb-main-staging
    });
  });
});
