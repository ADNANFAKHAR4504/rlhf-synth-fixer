import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';
import {
  getEnvironmentConfig,
  validateEnvironmentConfig,
  EnvironmentConfig,
} from '../lib/environment-config';

describe('environment-config.ts', () => {
  describe('getEnvironmentConfig', () => {
    it('should return default config for any environment suffix', () => {
      const config = getEnvironmentConfig('test-env');
      expect(config).toEqual({
        environment: 'test-env',
        bucketLifecycleDays: 30,
        dynamodbBillingMode: 'PAY_PER_REQUEST',
        alarmThresholdMultiplier: 0.75,
        snsEmail: 'alerts-test-env@example.com',
        enableCrossRegionReplication: false,
        costCenter: 'engineering',
      });
    });

    it('should return config for empty string environment', () => {
      const config = getEnvironmentConfig('');
      expect(config.environment).toBe('');
      expect(config.snsEmail).toBe('alerts-@example.com');
    });

    it('should return config for synthaw2nm environment', () => {
      const config = getEnvironmentConfig('synthaw2nm');
      expect(config.environment).toBe('synthaw2nm');
      expect(config.snsEmail).toBe('alerts-synthaw2nm@example.com');
      expect(config.bucketLifecycleDays).toBe(30);
    });

    it('should return config for dev environment', () => {
      const config = getEnvironmentConfig('dev');
      expect(config.environment).toBe('dev');
      expect(config.dynamodbBillingMode).toBe('PAY_PER_REQUEST');
    });

    it('should return config with correct billing mode', () => {
      const config = getEnvironmentConfig('test');
      expect(config.dynamodbBillingMode).toBe('PAY_PER_REQUEST');
    });

    it('should return config without cross-region replication', () => {
      const config = getEnvironmentConfig('staging');
      expect(config.enableCrossRegionReplication).toBe(false);
    });
  });

  describe('validateEnvironmentConfig', () => {
    it('should not throw for valid PAY_PER_REQUEST config', () => {
      const config: EnvironmentConfig = {
        environment: 'test',
        bucketLifecycleDays: 30,
        dynamodbBillingMode: 'PAY_PER_REQUEST',
        alarmThresholdMultiplier: 0.75,
        snsEmail: 'test@example.com',
        enableCrossRegionReplication: false,
        costCenter: 'engineering',
      };
      expect(() => validateEnvironmentConfig(config)).not.toThrow();
    });

    it('should throw when PROVISIONED billing mode is missing read capacity', () => {
      const config: EnvironmentConfig = {
        environment: 'prod',
        bucketLifecycleDays: 90,
        dynamodbBillingMode: 'PROVISIONED',
        dynamodbWriteCapacity: 5,
        alarmThresholdMultiplier: 1.0,
        snsEmail: 'prod@example.com',
        enableCrossRegionReplication: false,
        costCenter: 'production',
      };
      expect(() => validateEnvironmentConfig(config)).toThrow(
        'PROVISIONED billing mode must specify read and write capacity'
      );
    });

    it('should throw when PROVISIONED billing mode is missing write capacity', () => {
      const config: EnvironmentConfig = {
        environment: 'prod',
        bucketLifecycleDays: 90,
        dynamodbBillingMode: 'PROVISIONED',
        dynamodbReadCapacity: 5,
        alarmThresholdMultiplier: 1.0,
        snsEmail: 'prod@example.com',
        enableCrossRegionReplication: false,
        costCenter: 'production',
      };
      expect(() => validateEnvironmentConfig(config)).toThrow(
        'PROVISIONED billing mode must specify read and write capacity'
      );
    });

    it('should throw when PROVISIONED billing mode is missing both capacity settings', () => {
      const config: EnvironmentConfig = {
        environment: 'prod',
        bucketLifecycleDays: 90,
        dynamodbBillingMode: 'PROVISIONED',
        alarmThresholdMultiplier: 1.0,
        snsEmail: 'prod@example.com',
        enableCrossRegionReplication: false,
        costCenter: 'production',
      };
      expect(() => validateEnvironmentConfig(config)).toThrow(
        'PROVISIONED billing mode must specify read and write capacity'
      );
    });

    it('should not throw when PROVISIONED billing has both capacities', () => {
      const config: EnvironmentConfig = {
        environment: 'prod',
        bucketLifecycleDays: 90,
        dynamodbBillingMode: 'PROVISIONED',
        dynamodbReadCapacity: 5,
        dynamodbWriteCapacity: 5,
        alarmThresholdMultiplier: 1.0,
        snsEmail: 'prod@example.com',
        enableCrossRegionReplication: false,
        costCenter: 'production',
      };
      expect(() => validateEnvironmentConfig(config)).not.toThrow();
    });

    it('should throw when cross-region replication enabled without region', () => {
      const config: EnvironmentConfig = {
        environment: 'prod',
        bucketLifecycleDays: 90,
        dynamodbBillingMode: 'PAY_PER_REQUEST',
        alarmThresholdMultiplier: 1.0,
        snsEmail: 'prod@example.com',
        enableCrossRegionReplication: true,
        costCenter: 'production',
      };
      expect(() => validateEnvironmentConfig(config)).toThrow(
        'Cross-region replication must specify replication region'
      );
    });

    it('should not throw when cross-region replication has region', () => {
      const config: EnvironmentConfig = {
        environment: 'prod',
        bucketLifecycleDays: 90,
        dynamodbBillingMode: 'PAY_PER_REQUEST',
        alarmThresholdMultiplier: 1.0,
        snsEmail: 'prod@example.com',
        enableCrossRegionReplication: true,
        replicationRegion: 'us-west-2',
        costCenter: 'production',
      };
      expect(() => validateEnvironmentConfig(config)).not.toThrow();
    });

    it('should not throw when cross-region replication is disabled', () => {
      const config: EnvironmentConfig = {
        environment: 'dev',
        bucketLifecycleDays: 30,
        dynamodbBillingMode: 'PAY_PER_REQUEST',
        alarmThresholdMultiplier: 0.5,
        snsEmail: 'dev@example.com',
        enableCrossRegionReplication: false,
        costCenter: 'development',
      };
      expect(() => validateEnvironmentConfig(config)).not.toThrow();
    });
  });
});

describe('getAwsRegion function', () => {
  let originalEnv: string | undefined;
  const fs = require('fs');
  const path = require('path');

  beforeEach(() => {
    // Save original AWS_REGION env var
    originalEnv = process.env.AWS_REGION;
    // Clear module cache to ensure fresh imports
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original AWS_REGION env var
    if (originalEnv !== undefined) {
      process.env.AWS_REGION = originalEnv;
    } else {
      delete process.env.AWS_REGION;
    }
    jest.restoreAllMocks();
  });

  test('should use AWS_REGION environment variable when set', () => {
    process.env.AWS_REGION = 'us-west-1';
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      awsRegion: 'eu-west-1',
    });
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('us-west-1');
  });

  test('should read from AWS_REGION file when env var not set', () => {
    delete process.env.AWS_REGION;
    // The file exists and contains 'ap-northeast-2'
    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack');
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('ap-northeast-2');
  });

  test('should use awsRegion from props when no AWS_REGION env var and file read fails', () => {
    delete process.env.AWS_REGION;
    // Mock fs.existsSync selectively for AWS_REGION file path
    const originalExistsSync = fs.existsSync;
    jest.spyOn(fs, 'existsSync').mockImplementation((filePath: string) => {
      if (typeof filePath === 'string' && filePath.endsWith('AWS_REGION')) {
        return false;
      }
      return originalExistsSync(filePath);
    });

    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      awsRegion: 'eu-central-1',
    });
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('eu-central-1');
  });

  test('should use default ap-northeast-2 when no env var, file, or props', () => {
    delete process.env.AWS_REGION;
    // Mock fs.existsSync selectively for AWS_REGION file path
    const originalExistsSync = fs.existsSync;
    jest.spyOn(fs, 'existsSync').mockImplementation((filePath: string) => {
      if (typeof filePath === 'string' && filePath.endsWith('AWS_REGION')) {
        return false;
      }
      return originalExistsSync(filePath);
    });

    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack');
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('ap-northeast-2');
  });

  test('should handle file read error and fall through to props', () => {
    delete process.env.AWS_REGION;
    // Mock fs.existsSync selectively and readFileSync to throw for AWS_REGION
    const originalExistsSync = fs.existsSync;
    const originalReadFileSync = fs.readFileSync;

    jest.spyOn(fs, 'existsSync').mockImplementation((filePath: string) => {
      if (typeof filePath === 'string' && filePath.endsWith('AWS_REGION')) {
        return true;
      }
      return originalExistsSync(filePath);
    });

    jest.spyOn(fs, 'readFileSync').mockImplementation((filePath: any, ...args: any[]) => {
      if (typeof filePath === 'string' && filePath.endsWith('AWS_REGION')) {
        throw new Error('File read error');
      }
      return originalReadFileSync(filePath, ...args);
    });

    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      awsRegion: 'us-east-2',
    });
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('us-east-2');
  });

  test('should handle empty AWS_REGION file and fall through to props', () => {
    delete process.env.AWS_REGION;
    // Mock fs.existsSync and readFileSync selectively for AWS_REGION
    const originalExistsSync = fs.existsSync;
    const originalReadFileSync = fs.readFileSync;

    jest.spyOn(fs, 'existsSync').mockImplementation((filePath: string) => {
      if (typeof filePath === 'string' && filePath.endsWith('AWS_REGION')) {
        return true;
      }
      return originalExistsSync(filePath);
    });

    jest.spyOn(fs, 'readFileSync').mockImplementation((filePath: any, ...args: any[]) => {
      if (typeof filePath === 'string' && filePath.endsWith('AWS_REGION')) {
        return '  \n  ';
      }
      return originalReadFileSync(filePath, ...args);
    });

    const app = Testing.app();
    const stack = new TapStack(app, 'TestStack', {
      awsRegion: 'ap-south-1',
    });
    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('ap-south-1');
  });
});

describe('Stack Structure', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.AWS_REGION; // Ensure clean state for tests
    app = Testing.app();
  });

  test('TapStack instantiates successfully via props', () => {
    stack = new TapStack(app, 'TestTapStackWithProps', {
      environmentSuffix: 'prod',
      stateBucket: 'custom-state-bucket',
      stateBucketRegion: 'us-west-2',
      awsRegion: 'us-west-2',
    });
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('TapStack uses default values when no props provided', () => {
    stack = new TapStack(app, 'TestTapStackDefault');
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('should create TapStack with custom environmentSuffix', () => {
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'synthaw2nm',
    });
    synthesized = Testing.synth(stack);
    expect(synthesized).toContain('synthaw2nm');
  });

  test('should use ap-northeast-2 region override', () => {
    stack = new TapStack(app, 'TestStack', {
      awsRegion: 'us-east-1',
    });
    synthesized = Testing.synth(stack);
    expect(synthesized).toContain('ap-northeast-2');
  });

  test('should use ap-northeast-2 region when no region provided', () => {
    stack = new TapStack(app, 'TestStack', {});
    synthesized = Testing.synth(stack);
    expect(synthesized).toContain('ap-northeast-2');
  });

  test('should always use ap-northeast-2 regardless of input', () => {
    stack = new TapStack(app, 'TestStack', {
      awsRegion: 'eu-west-1',
    });
    synthesized = Testing.synth(stack);
    expect(synthesized).toContain('ap-northeast-2');
    expect(synthesized).not.toContain('eu-west-1');
  });

  test('should apply default tags with Environment', () => {
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'dev',
    });
    synthesized = Testing.synth(stack);
    expect(synthesized).toContain('Environment');
    expect(synthesized).toContain('dev');
  });

  test('should apply default tags with CostCenter', () => {
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'staging',
    });
    synthesized = Testing.synth(stack);
    expect(synthesized).toContain('CostCenter');
    expect(synthesized).toContain('engineering');
  });

  test('should merge custom tags with default tags', () => {
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'prod',
      defaultTags: [
        {
          tags: {
            CustomTag: 'CustomValue',
            Team: 'DevOps',
          },
        },
      ],
    });
    synthesized = Testing.synth(stack);
    expect(synthesized).toContain('CustomTag');
    expect(synthesized).toContain('Team');
  });

  test('should create all infrastructure resources', () => {
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'synthaw2nm',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('data-bucket-synthaw2nm');
    expect(synthesized).toContain('data-table-synthaw2nm');
    expect(synthesized).toContain('infrastructure-alerts-synthaw2nm');
    expect(synthesized).toContain('data-access-role-synthaw2nm');
  });

  test('should create CloudWatch alarms', () => {
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('dynamodb-read-capacity-test');
    expect(synthesized).toContain('dynamodb-write-capacity-test');
    expect(synthesized).toContain('dynamodb-throttled-requests-test');
  });

  test('should create TerraformOutputs', () => {
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'prod',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('S3BucketName');
    expect(synthesized).toContain('S3BucketArn');
    expect(synthesized).toContain('DynamoDBTableName');
    expect(synthesized).toContain('DynamoDBTableArn');
    expect(synthesized).toContain('SNSTopicArn');
    expect(synthesized).toContain('DataAccessRoleArn');
    expect(synthesized).toContain('Environment');
    expect(synthesized).toContain('BillingMode');
  });

  test('should handle empty defaultTags array', () => {
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      defaultTags: [],
    });
    synthesized = Testing.synth(stack);
    expect(synthesized).toContain('Environment');
    expect(synthesized).toContain('test');
  });

  test('should create IAM policies for S3 access', () => {
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'iam-test',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('s3:GetObject');
    expect(synthesized).toContain('s3:PutObject');
    expect(synthesized).toContain('s3:DeleteObject');
    expect(synthesized).toContain('s3:ListBucket');
  });

  test('should create IAM policies for DynamoDB access', () => {
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'iam-test',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('dynamodb:GetItem');
    expect(synthesized).toContain('dynamodb:PutItem');
    expect(synthesized).toContain('dynamodb:UpdateItem');
    expect(synthesized).toContain('dynamodb:DeleteItem');
    expect(synthesized).toContain('dynamodb:Query');
    expect(synthesized).toContain('dynamodb:Scan');
  });

  test('should create IAM policies for CloudWatch Logs', () => {
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'iam-test',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('logs:CreateLogGroup');
    expect(synthesized).toContain('logs:CreateLogStream');
    expect(synthesized).toContain('logs:PutLogEvents');
  });

  test('should configure S3 bucket encryption', () => {
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'security-test',
    });
    synthesized = Testing.synth(stack);
    expect(synthesized).toContain('AES256');
  });

  test('should configure S3 bucket versioning', () => {
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'versioning-test',
    });
    synthesized = Testing.synth(stack);
    expect(synthesized).toContain('Enabled');
  });

  test('should configure S3 lifecycle rules', () => {
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'lifecycle-test',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('transition-to-ia');
    expect(synthesized).toContain('STANDARD_IA');
    expect(synthesized).toContain('expire-old-versions');
  });

  test('should configure DynamoDB with PAY_PER_REQUEST billing', () => {
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'billing-test',
    });
    synthesized = Testing.synth(stack);
    expect(synthesized).toContain('PAY_PER_REQUEST');
  });

  test('should configure DynamoDB table schema', () => {
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'schema-test',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('hash_key');
    expect(synthesized).toContain('range_key');
    expect(synthesized).toContain('StatusIndex');
  });

  test('should configure CloudWatch alarm thresholds', () => {
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'alarm-test',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('ConsumedReadCapacityUnits');
    expect(synthesized).toContain('ConsumedWriteCapacityUnits');
    expect(synthesized).toContain('UserErrors');
  });

  test('should configure SNS email subscription', () => {
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'sns-test',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('alerts-sns-test@example.com');
    expect(synthesized).toContain('email');
  });

  test('should create stack with all props specified', () => {
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'comprehensive-test',
      stateBucket: 'my-state-bucket',
      stateBucketRegion: 'eu-west-1',
      awsRegion: 'us-east-1',
      defaultTags: [
        {
          tags: {
            Project: 'TestProject',
            Owner: 'TestTeam',
          },
        },
      ],
    });
    synthesized = Testing.synth(stack);
    expect(synthesized).toContain('comprehensive-test');
  });

  test('should not create cross-region replication by default', () => {
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'no-replication',
    });
    synthesized = Testing.synth(stack);
    expect(synthesized).not.toContain('data-bucket-replica-no-replication');
    expect(synthesized).not.toContain('ReplicationProvider');
  });

  test('should handle PAY_PER_REQUEST billing mode without capacity settings', () => {
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'pay-per-request-test',
    });
    synthesized = Testing.synth(stack);
    expect(synthesized).toContain('PAY_PER_REQUEST');
    expect(synthesized).not.toContain('read_capacity');
    expect(synthesized).not.toContain('write_capacity');
  });

  test('should handle point in time recovery disabled', () => {
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'pitr-test',
    });
    synthesized = Testing.synth(stack);
    expect(synthesized).toContain('point_in_time_recovery');
    expect(synthesized).toContain('false');
  });

  test('should configure lifecycle with noncurrent version expiration', () => {
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'lifecycle-detail-test',
    });
    synthesized = Testing.synth(stack);
    expect(synthesized).toContain('noncurrent_version_expiration');
    expect(synthesized).toContain('noncurrent_days');
  });
});

describe('Construct-level Tests', () => {
  let app: App;

  beforeEach(() => {
    jest.clearAllMocks();
    app = Testing.app();
  });

  test('DynamodbTableConstruct with PROVISIONED billing mode', () => {
    const { DynamodbTableConstruct } = require('../lib/dynamodb-table-construct');
    const { TapStack } = require('../lib/tap-stack');
    const provisionedConfig: EnvironmentConfig = {
      environment: 'prod',
      bucketLifecycleDays: 90,
      dynamodbBillingMode: 'PROVISIONED',
      dynamodbReadCapacity: 10,
      dynamodbWriteCapacity: 5,
      alarmThresholdMultiplier: 1.0,
      snsEmail: 'prod@example.com',
      enableCrossRegionReplication: false,
      costCenter: 'production',
    };

    const stack = new TapStack(app, 'ProvisionedTestStack', {
      environmentSuffix: 'prov-test',
    });
    const table = new DynamodbTableConstruct(stack, 'TestTable', {
      environmentSuffix: 'provisioned-test',
      config: provisionedConfig,
    });

    expect(table.tableName).toBeDefined();
    expect(table.tableArn).toBeDefined();

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('PROVISIONED');
    expect(synthesized).toContain('read_capacity');
    expect(synthesized).toContain('write_capacity');
  });

  test('S3BucketConstruct with cross-region replication', () => {
    const { S3BucketConstruct } = require('../lib/s3-bucket-construct');
    const { TapStack } = require('../lib/tap-stack');
    const replicationConfig: EnvironmentConfig = {
      environment: 'prod',
      bucketLifecycleDays: 90,
      dynamodbBillingMode: 'PAY_PER_REQUEST',
      alarmThresholdMultiplier: 1.0,
      snsEmail: 'prod@example.com',
      enableCrossRegionReplication: true,
      replicationRegion: 'us-west-2',
      costCenter: 'production',
    };

    const stack = new TapStack(app, 'ReplicationTestStack', {
      environmentSuffix: 'repl-test',
    });
    const bucket = new S3BucketConstruct(stack, 'TestBucket', {
      environmentSuffix: 'replication-test',
      config: replicationConfig,
      region: 'us-east-1',
    });

    expect(bucket.bucketName).toBeDefined();
    expect(bucket.bucketArn).toBeDefined();

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('data-bucket-replica-replication-test');
    expect(synthesized).toContain('s3-replication-role-replication-test');
    expect(synthesized).toContain('s3:ReplicateObject');
    expect(synthesized).toContain('s3:GetReplicationConfiguration');
    expect(synthesized).toContain('replication_time');
  });

  test('S3BucketConstruct without cross-region replication', () => {
    const { S3BucketConstruct } = require('../lib/s3-bucket-construct');
    const { TapStack } = require('../lib/tap-stack');
    const noReplicationConfig: EnvironmentConfig = {
      environment: 'dev',
      bucketLifecycleDays: 30,
      dynamodbBillingMode: 'PAY_PER_REQUEST',
      alarmThresholdMultiplier: 0.5,
      snsEmail: 'dev@example.com',
      enableCrossRegionReplication: false,
      costCenter: 'development',
    };

    const stack = new TapStack(app, 'NoReplTestStack', {
      environmentSuffix: 'norepl-test',
    });
    const bucket = new S3BucketConstruct(stack, 'TestBucket', {
      environmentSuffix: 'no-repl-test',
      config: noReplicationConfig,
      region: 'us-east-1',
    });

    expect(bucket.bucketName).toBeDefined();

    const synthesized = Testing.synth(stack);
    expect(synthesized).not.toContain('data-bucket-replica-no-repl-test');
    expect(synthesized).not.toContain('s3-replication-role-no-repl-test');
  });

  test('MonitoringConstruct creates all alarms', () => {
    const { MonitoringConstruct } = require('../lib/monitoring-construct');
    const { TapStack } = require('../lib/tap-stack');
    const config = getEnvironmentConfig('monitoring-test');

    const stack = new TapStack(app, 'MonitoringTestStack', {
      environmentSuffix: 'mon-test',
    });
    const monitoring = new MonitoringConstruct(stack, 'TestMonitoring', {
      environmentSuffix: 'monitoring-test',
      config,
      tableName: 'test-table',
    });

    expect(monitoring.snsTopicArn).toBeDefined();

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('ConsumedReadCapacityUnits');
    expect(synthesized).toContain('ConsumedWriteCapacityUnits');
    expect(synthesized).toContain('UserErrors');
  });

  test('IamConstruct creates policies', () => {
    const { IamConstruct } = require('../lib/iam-construct');
    const { TapStack } = require('../lib/tap-stack');
    const config = getEnvironmentConfig('iam-construct-test');

    const stack = new TapStack(app, 'IamTestStack', {
      environmentSuffix: 'iam-test',
    });
    const iam = new IamConstruct(stack, 'TestIam', {
      environmentSuffix: 'iam-construct-test',
      config,
      bucketArn: 'arn:aws:s3:::test-bucket',
      tableArn: 'arn:aws:dynamodb:us-east-1:123456789012:table/test-table',
    });

    expect(iam.dataAccessRoleArn).toBeDefined();

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('data-access-role-iam-construct-test');
    expect(synthesized).toContain('s3:GetObject');
    expect(synthesized).toContain('dynamodb:PutItem');
  });
});
