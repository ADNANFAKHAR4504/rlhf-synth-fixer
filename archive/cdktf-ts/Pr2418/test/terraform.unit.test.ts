// __tests__/tap-stack.unit.test.ts
import { App } from 'cdktf';
import 'cdktf/lib/testing/adapters/jest';
import { TapStack } from '../lib/tap-stack';

// Import the mocked functions
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformOutput } from 'cdktf';
import {
  CloudTrailModule,
  Ec2Module,
  IamModule,
  KmsModule,
  RdsModule,
  S3Module,
  SecurityGroupModule,
  VpcModule,
} from '../lib/modules';

// Mock all the modules used in TapStack
jest.mock('../lib/modules', () => ({
  VpcModule: jest.fn((_, id, config) => ({
    vpc: {
      id: `${id}-vpc-id`,
      arn: `arn:aws:ec2:us-west-2:123456789012:vpc/${id}-vpc-id`,
    },
    publicSubnets: [
      {
        id: 'subnet-public-1',
        arn: 'arn:aws:ec2:us-west-2:123456789012:subnet/subnet-public-1',
      },
      {
        id: 'subnet-public-2',
        arn: 'arn:aws:ec2:us-west-2:123456789012:subnet/subnet-public-2',
      },
    ],
    privateSubnets: [
      {
        id: 'subnet-private-1',
        arn: 'arn:aws:ec2:us-west-2:123456789012:subnet/subnet-private-1',
      },
      {
        id: 'subnet-private-2',
        arn: 'arn:aws:ec2:us-west-2:123456789012:subnet/subnet-private-2',
      },
    ],
    config,
  })),
  KmsModule: jest.fn((_, id, config) => ({
    key: {
      keyId: `${id}-key-id`,
      arn: `arn:aws:kms:us-west-2:123456789012:key/${id}-key-id`,
    },
    config,
  })),
  SecurityGroupModule: jest.fn((_, id, config) => ({
    securityGroup: {
      id: `${id}-sg-id`,
      arn: `arn:aws:ec2:us-west-2:123456789012:security-group/${id}-sg-id`,
    },
    config,
  })),
  S3Module: jest.fn((_, id, config) => ({
    bucket: {
      bucket: `${id}-bucket-name`,
      arn: `arn:aws:s3:::${id}-bucket-name`,
    },
    config,
  })),
  RdsModule: jest.fn((_, id, config) => ({
    dbInstance: {
      id: `${id}-db-id`,
      endpoint: `${id}-db.cluster-xyz.us-west-2.rds.amazonaws.com:3306`,
      arn: `arn:aws:rds:us-west-2:123456789012:db:${id}-db-id`,
    },
    config,
  })),
  Ec2Module: jest.fn((_, id, config) => ({
    instance: {
      id: `${id}-instance-id`,
      arn: `arn:aws:ec2:us-west-2:123456789012:instance/${id}-instance-id`,
    },
    config,
  })),
  IamModule: jest.fn((_, id, config) => ({
    instanceProfile: {
      name: `${id}-instance-profile`,
      arn: `arn:aws:iam::123456789012:instance-profile/${id}-instance-profile`,
    },
    config,
  })),
  CloudTrailModule: jest.fn((_, id, config) => ({
    trail: {
      id: `${id}-cloudtrail-id`,
      arn: `arn:aws:cloudtrail:us-west-2:123456789012:trail/${id}-cloudtrail`,
    },
    logsBucket: {
      bucket: `${id}-logs-bucket-name`,
      arn: `arn:aws:s3:::${id}-logs-bucket-name`,
    },
    config,
  })),
}));

// Mock TerraformOutput and S3Backend to prevent duplicate construct errors
jest.mock('cdktf', () => {
  const actual = jest.requireActual('cdktf');
  return {
    ...actual,
    TerraformOutput: jest.fn(),
    S3Backend: jest.fn(),
  };
});

// Mock AWS provider
jest.mock('@cdktf/provider-aws/lib/provider', () => ({
  AwsProvider: jest.fn(),
}));

// Mock DataAwsCallerIdentity
jest.mock('@cdktf/provider-aws/lib/data-aws-caller-identity', () => ({
  DataAwsCallerIdentity: jest.fn((_, id) => ({
    accountId: '123456789012',
  })),
}));

// Mock DataAwsSecretsmanagerSecretVersion with a valid (<=41-char) password
jest.mock(
  '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version',
  () => ({
    DataAwsSecretsmanagerSecretVersion: jest.fn((_, id, config) => ({
      // 31 chars: valid for RDS MySQL (8–41)
      secretString: 'Tp_Dev$rds_P@ssw0rd_2025_ABC123',
      secretId: config.secretId,
    })),
  })
);

// Mock RandomProvider (kept; harmless if unused)
jest.mock('@cdktf/provider-random/lib/provider', () => ({
  RandomProvider: jest.fn(),
}));

describe('TapStack Unit Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('should create TapStack with default props', () => {
    const app = new App();
    new TapStack(app, 'TestStack');

    expect(AwsProvider).toHaveBeenCalledTimes(1);
  });

  test('should create AWS Provider with correct default configuration', () => {
    const app = new App();
    new TapStack(app, 'TestStackProvider');

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'us-west-2',
        defaultTags: [],
      })
    );
  });

  // renamed for clarity (no awsRegion provided)
  test('should fall back to default region when override is disabled', () => {
    const app = new App();
    new TapStack(app, 'TestStackNoOverride', {
      _regionOverrideForTesting: null, // Disable the override
    });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'us-west-2', // Should fallback to default us-west-2
      })
    );
  });

  test('should use default us-west-2 when no override and no props.awsRegion', () => {
    const app = new App();
    new TapStack(app, 'TestStackDefaultFallback', {
      _regionOverrideForTesting: null, // Disable the override
      // No awsRegion prop provided
    });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'us-west-2', // Should fallback to default us-west-2
      })
    );
  });

  // NEW TEST: Cover when override is empty string (falsy)
  test('should use props.awsRegion when region override is empty string', () => {
    const app = new App();
    new TapStack(app, 'TestStackEmptyOverride', {
      awsRegion: 'us-west-2',
      _regionOverrideForTesting: '', // Empty string (falsy)
    });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'us-west-2',
      })
    );
  });

  test('should create AWS Provider with custom props', () => {
    const customTags = {
      Environment: 'prod',
      Owner: 'DevOps Team',
      Project: 'TapProject',
    };

    const app = new App();
    new TapStack(app, 'TestStackCustom', {
      environmentSuffix: 'prod',
      awsRegion: 'us-west-2',
      defaultTags: { tags: customTags },
    });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'us-west-2', // Override is set to us-west-2
        defaultTags: [{ tags: customTags }],
      })
    );
  });

  test('should create S3Backend with correct configuration', () => {
    const app = new App();
    new TapStack(app, 'TestStackBackend', {
      environmentSuffix: 'staging',
      stateBucket: 'custom-tf-states',
      stateBucketRegion: 'us-west-1',
    });

    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        bucket: 'custom-tf-states',
        key: 'staging/TestStackBackend.tfstate',
        region: 'us-west-1',
        encrypt: true,
      })
    );
  });

  test('should create S3Backend with default configuration', () => {
    const app = new App();
    new TapStack(app, 'TestStackDefaultBackend');

    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        bucket: 'prod-config-logs-us-west-2-a8e48bba',
        key: 'dev/TestStackDefaultBackend.tfstate',
        region: 'us-west-2',
        encrypt: true,
      })
    );
  });

  test('should create AWS data sources', () => {
    const app = new App();
    new TapStack(app, 'TestStackDataSources', {
      dbPassword: 'cZWeLY7LbVcTsFK',
    });

    expect(DataAwsCallerIdentity).toHaveBeenCalledTimes(1);
    expect(DataAwsCallerIdentity).toHaveBeenCalledWith(
      expect.anything(),
      'current'
    );

    // When providing direct password, Secrets Manager should not be called
    expect(DataAwsSecretsmanagerSecretVersion).toHaveBeenCalledTimes(0);
  });

  test('should use AWS Secrets Manager when no direct password provided', () => {
    const app = new App();
    new TapStack(app, 'TestStackSecretsManager');

    expect(DataAwsCallerIdentity).toHaveBeenCalledTimes(1);
    expect(DataAwsSecretsmanagerSecretVersion).toHaveBeenCalledTimes(1);
    expect(DataAwsSecretsmanagerSecretVersion).toHaveBeenCalledWith(
      expect.anything(),
      'db-password-secret',
      expect.objectContaining({
        secretId: 'my-new-secret',
      })
    );
  });

  test('should create KMS module with correct configuration', () => {
    const app = new App();
    new TapStack(app, 'TestStackKMS');

    expect(KmsModule).toHaveBeenCalledTimes(1);
    expect(KmsModule).toHaveBeenCalledWith(
      expect.anything(),
      'kms',
      expect.objectContaining({
        project: 'tap-project',
        environment: 'dev',
        description: 'KMS key for tap-project dev environment',
        accountId: '123456789012',
      })
    );
  });

  test('should create S3 module with correct configuration', () => {
    const app = new App();
    new TapStack(app, 'TestStackS3');

    expect(S3Module).toHaveBeenCalledTimes(1);
    expect(S3Module).toHaveBeenCalledWith(
      expect.anything(),
      's3-app-data',
      expect.objectContaining({
        project: 'tap-project',
        environment: 'dev',
        bucketName: expect.stringContaining('tap-project-dev-app-'),
        kmsKey: expect.objectContaining({
          keyId: 'kms-key-id',
          arn: 'arn:aws:kms:us-west-2:123456789012:key/kms-key-id',
        }),
      })
    );
  });

  test('should create CloudTrail module with correct configuration', () => {
    const app = new App();
    new TapStack(app, 'TestStackCloudTrail');

    expect(CloudTrailModule).toHaveBeenCalledTimes(1);
    expect(CloudTrailModule).toHaveBeenCalledWith(
      expect.anything(),
      'cloudtrail',
      expect.objectContaining({
        project: 'tap-project',
        environment: 'dev',
        accountId: '123456789012',
        region: 'us-west-2',
        kmsKey: expect.objectContaining({
          keyId: 'kms-key-id',
          arn: 'arn:aws:kms:us-west-2:123456789012:key/kms-key-id',
        }),
      })
    );
  });

  test('should create IAM module with correct configuration', () => {
    const app = new App();
    new TapStack(app, 'TestStackIAM');

    expect(IamModule).toHaveBeenCalledTimes(1);
    expect(IamModule).toHaveBeenCalledWith(
      expect.anything(),
      'iam',
      expect.objectContaining({
        project: 'tap-project',
        environment: 'dev',
        appDataBucketArn: 'arn:aws:s3:::s3-app-data-bucket-name',
      })
    );
  });

  test('should create VPC module with correct configuration', () => {
    const app = new App();
    new TapStack(app, 'TestStackVPC');

    expect(VpcModule).toHaveBeenCalledTimes(1);
    expect(VpcModule).toHaveBeenCalledWith(
      expect.anything(),
      'vpc',
      expect.objectContaining({
        project: 'tap-project',
        environment: 'dev',
        cidrBlock: '10.0.0.0/16',
        availabilityZones: ['us-west-2a', 'us-west-2b'],
      })
    );
  });

  test('should create security group modules with correct configuration', () => {
    const app = new App();
    new TapStack(app, 'TestStackSG');

    expect(SecurityGroupModule).toHaveBeenCalledTimes(2);
  });

  test('should create EC2 module with correct configuration', () => {
    const app = new App();
    new TapStack(app, 'TestStackEC2');

    expect(Ec2Module).toHaveBeenCalledTimes(1);
    expect(Ec2Module).toHaveBeenCalledWith(
      expect.anything(),
      'ec2',
      expect.objectContaining({
        project: 'tap-project',
        environment: 'dev',
        instanceType: 't3.micro',
        keyName: undefined,
      })
    );
  });

  test('should create RDS module with correct configuration', () => {
    const app = new App();
    new TapStack(app, 'TestStackRDS', {
      dbPassword: 'cZWeLY7LbVcTsFK',
    });

    expect(RdsModule).toHaveBeenCalledTimes(1);
    expect(RdsModule).toHaveBeenCalledWith(
      expect.anything(),
      'rds',
      expect.objectContaining({
        project: 'tap-project',
        environment: 'dev',
        engine: 'mysql',
        engineVersion: '8.0',
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        dbName: 'appdb',
        username: 'admin',
        password: 'cZWeLY7LbVcTsFK', // updated: new password for dev-tap-database
        subnetIds: ['subnet-private-1', 'subnet-private-2'],
        securityGroupIds: ['rds-sg-sg-id'],
        kmsKey: expect.objectContaining({
          keyId: 'kms-key-id',
          arn: 'arn:aws:kms:us-west-2:123456789012:key/kms-key-id',
        }),
      })
    );

    // Guard: ensure we never exceed the RDS 41-char limit
    const rdsArgs = (RdsModule as unknown as jest.Mock).mock.calls[0][2];
    expect(rdsArgs.password.length).toBeLessThanOrEqual(41);
    expect(rdsArgs.password.length).toBeGreaterThanOrEqual(8);
  });

  test('should handle custom environment suffix', () => {
    const app = new App();
    new TapStack(app, 'TestStackCustomEnv', {
      environmentSuffix: 'staging',
    });

    expect(S3Module).toHaveBeenCalledWith(
      expect.anything(),
      's3-app-data',
      expect.objectContaining({
        project: 'tap-project',
        environment: 'staging',
        bucketName: expect.stringContaining('tap-project-staging-app-'),
      })
    );
  });

  test('should handle custom AWS region with availability zones', () => {
    const app = new App();
    new TapStack(app, 'TestStackCustomRegion', {
      awsRegion: 'us-west-2',
    });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'us-west-2', // Override is set to us-west-2
      })
    );

    expect(VpcModule).toHaveBeenCalledWith(
      expect.anything(),
      'vpc',
      expect.objectContaining({
        availabilityZones: ['us-west-2a', 'us-west-2b'], // Based on override
      })
    );
  });

  test('should create all terraform outputs', () => {
    const app = new App();
    new TapStack(app, 'TestStackOutputs');

    expect(TerraformOutput).toHaveBeenCalledTimes(13);
  });

  test('should create stack with all components integrated', () => {
    const app = new App();
    new TapStack(app, 'TestStackIntegrated');

    expect(AwsProvider).toHaveBeenCalledTimes(1);
    expect(S3Backend).toHaveBeenCalledTimes(1);
    expect(DataAwsCallerIdentity).toHaveBeenCalledTimes(1);
    expect(DataAwsSecretsmanagerSecretVersion).toHaveBeenCalledTimes(1);
    expect(KmsModule).toHaveBeenCalledTimes(1);
    expect(S3Module).toHaveBeenCalledTimes(1);
    expect(CloudTrailModule).toHaveBeenCalledTimes(1);
    expect(IamModule).toHaveBeenCalledTimes(1);
    expect(VpcModule).toHaveBeenCalledTimes(1);
    expect(SecurityGroupModule).toHaveBeenCalledTimes(2);
    expect(Ec2Module).toHaveBeenCalledTimes(1);
    expect(RdsModule).toHaveBeenCalledTimes(1);
  });

  test('should handle all custom props', () => {
    const customTags = {
      CostCenter: '12345',
      Environment: 'production',
      Owner: 'Platform Team',
      Project: 'TapProject',
    };

    const app = new App();
    new TapStack(app, 'TestStackAllCustom', {
      environmentSuffix: 'production',
      stateBucket: 'my-custom-tf-states',
      stateBucketRegion: 'eu-west-1',
      awsRegion: 'eu-west-1',
      defaultTags: { tags: customTags },
    });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'us-west-2', // Override is set to us-west-2
        defaultTags: [{ tags: customTags }],
      })
    );

    expect(VpcModule).toHaveBeenCalledWith(
      expect.anything(),
      'vpc',
      expect.objectContaining({
        project: 'tap-project',
        environment: 'production',
        availabilityZones: ['us-west-2a', 'us-west-2b'], // Based on override
      })
    );
  });

  test('should verify stack addOverride is called for S3 backend lockfile', () => {
    const app = new App();

    // Spy on the TerraformStack addOverride method before creating the stack
    const addOverrideSpy = jest.spyOn(
      require('cdktf').TerraformStack.prototype,
      'addOverride'
    );

    new TapStack(app, 'TestStackOverride');

    expect(addOverrideSpy).toHaveBeenCalledWith(
      'terraform.backend.s3.use_lockfile',
      true
    );

    // Clean up the spy
    addOverrideSpy.mockRestore();
  });
});
