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
    getSubnets: jest.fn().mockReturnValue(Promise.resolve({ ids: ['subnet-1', 'subnet-2'] })),
  },
  dynamodb: {
    Table: jest.fn().mockImplementation(() => ({
      name: { promise: () => Promise.resolve('mock-table-name') },
      arn: { promise: () => Promise.resolve('mock-table-arn') },
    })),
  },
}));

// Mock the component stacks
jest.mock('../lib/s3-stack', () => ({
  S3Stack: jest.fn().mockImplementation(() => ({
    bucketId: { promise: () => Promise.resolve('mock-bucket-id') },
    bucketArn: { promise: () => Promise.resolve('mock-bucket-arn') },
  })),
}));

jest.mock('../lib/iam-stack', () => ({
  IAMStack: jest.fn().mockImplementation(() => ({
    roleArn: { promise: () => Promise.resolve('mock-role-arn') },
  })),
}));

jest.mock('../lib/rds-stack', () => ({
  RDSStack: jest.fn().mockImplementation(() => ({
    endpoint: { promise: () => Promise.resolve('mock-endpoint') },
    instanceId: { promise: () => Promise.resolve('mock-instance-id') },
  })),
}));

jest.mock('../lib/dynamodb-stack', () => ({
  DynamoDBStack: jest.fn().mockImplementation(() => ({
    tableName: { promise: () => Promise.resolve('mock-table-name') },
    tableArn: { promise: () => Promise.resolve('mock-table-arn') },
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
  });
});
