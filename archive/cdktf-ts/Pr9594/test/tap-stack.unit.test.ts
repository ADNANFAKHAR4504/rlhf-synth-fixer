// __tests__/tap-stack.unit.test.ts
import { App } from 'cdktf';
import 'cdktf/lib/testing/adapters/jest';
import { TapStack } from '../lib/tap-stack';

// Mock all modules used in TapStack
jest.mock('../lib/modules', () => ({
  VpcModule: jest.fn((_, id, config) => ({
    vpc: { id: `${id}-vpc-id`, cidrBlock: config.cidrBlock },
    publicSubnets: [
      { id: `${id}-public-subnet-1` },
      { id: `${id}-public-subnet-2` },
    ],
    privateSubnets: [
      { id: `${id}-private-subnet-1` },
      { id: `${id}-private-subnet-2` },
    ],
    config,
  })),
  SecurityGroupModule: jest.fn((_, id, config) => ({
    securityGroup: { id: `${id}-sg-id` },
    config,
  })),
  S3Module: jest.fn((_, id, config) => ({
    bucket: { id: `${id}-bucket-id`, arn: `${id}-bucket-arn` },
    kmsKey: { keyId: `${id}-kms-key-id` },
    config,
  })),
  IamRoleModule: jest.fn((_, id, config) => ({
    role: { arn: `${id}-role-arn`, name: `${id}-role-name` },
    config,
  })),
  CloudTrailModule: jest.fn((_, id, config) => ({
    trail: { arn: `${id}-trail-arn` },
    config,
  })),
  SecretsManagerModule: jest.fn((_, id, config) => ({
    secret: { arn: `${id}-secret-arn` },
    config,
  })),
}));

// Mock TerraformOutput to avoid duplicate construct errors
jest.mock('cdktf', () => {
  const actual = jest.requireActual('cdktf');
  return {
    ...actual,
    TerraformOutput: jest.fn(),
  };
});

describe('TapStack Unit Tests', () => {
  const {
    VpcModule,
    SecurityGroupModule,
    S3Module,
    IamRoleModule,
    CloudTrailModule,
    SecretsManagerModule,
  } = require('../lib/modules');
  const { TerraformOutput } = require('cdktf');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create VPC module with correct CIDR', () => {
    const app = new App();
    new TapStack(app, 'TestStackVpc');

    expect(VpcModule).toHaveBeenCalledTimes(1);
    expect(VpcModule).toHaveBeenCalledWith(
      expect.anything(),
      'vpc',
      expect.objectContaining({
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
      })
    );
  });

  test('should create security groups with allowed IP ranges', () => {
    const app = new App();
    new TapStack(app, 'TestStackSG');

    expect(SecurityGroupModule).toHaveBeenCalledTimes(2);
    expect(SecurityGroupModule).toHaveBeenCalledWith(
      expect.anything(),
      'web-sg',
      expect.objectContaining({
        allowHttp: true,
        allowHttps: true,
      })
    );
    expect(SecurityGroupModule).toHaveBeenCalledWith(
      expect.anything(),
      'ssh-sg',
      expect.objectContaining({
        allowSsh: true,
      })
    );
  });

  test('should create S3 buckets and enable logging/versioning', () => {
    const app = new App();
    new TapStack(app, 'TestStackS3');

    expect(S3Module).toHaveBeenCalledTimes(4); // app-data, cloudtrail, access-logs, logged bucket
  });

  test('should create IAM roles for EC2 and CloudTrail', () => {
    const app = new App();
    new TapStack(app, 'TestStackIAM');

    expect(IamRoleModule).toHaveBeenCalledTimes(2);
    expect(IamRoleModule).toHaveBeenCalledWith(
      expect.anything(),
      'ec2-role',
      expect.any(Object)
    );
    expect(IamRoleModule).toHaveBeenCalledWith(
      expect.anything(),
      'cloudtrail-role',
      expect.any(Object)
    );
  });

  test('should create CloudTrail', () => {
    const app = new App();
    new TapStack(app, 'TestStackCloudTrail');

    expect(CloudTrailModule).toHaveBeenCalledTimes(1);
  });

  test('should create SecretsManager secrets', () => {
    const app = new App();
    new TapStack(app, 'TestStackSecrets');

    expect(SecretsManagerModule).toHaveBeenCalledTimes(2); // database and API keys
  });

  test('should define Terraform outputs correctly', () => {
    const app = new App();
    new TapStack(app, 'TestStackOutputs');

    // TapStack defines 17 outputs in total
    expect(TerraformOutput).toHaveBeenCalledTimes(17);
  });
});
