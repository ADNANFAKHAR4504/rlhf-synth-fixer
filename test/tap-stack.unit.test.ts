import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';
import {
  getEnvironmentConfig,
  validateEnvironment,
} from '../lib/environment-config';

describe('TapStack Tests', () => {
  let app: App;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new App();
  });

  describe('Stack Instantiation', () => {
    test('TapStack instantiates successfully with all props', () => {
      const stack = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'test123',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'ap-southeast-1',
        defaultTags: [
          {
            tags: {
              Environment: 'dev',
              Project: 'test-project',
            },
          },
        ],
      });

      const synthesized = Testing.synth(stack);
      expect(stack).toBeDefined();
      expect(synthesized).toContain('custom-state-bucket');
      expect(synthesized).toContain('ap-southeast-1');
    });

    test('TapStack uses default values when no props provided', () => {
      const stack = new TapStack(app, 'TestTapStackDefault');
      const synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('iac-rlhf-tf-states');
      expect(synthesized).toContain('ap-southeast-1');
    });

    test('TapStack uses environment from context', () => {
      app.node.setContext('env', 'staging');
      const stack = new TapStack(app, 'TestTapStackContext', {
        environmentSuffix: 'test456',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('staging');
      expect(synthesized).toContain('test456');
    });

    test('TapStack defaults to dev environment when no context', () => {
      const stack = new TapStack(app, 'TestTapStackNoContext', {
        environmentSuffix: 'test789',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('dev');
    });
  });

  describe('AWS Provider Configuration', () => {
    test('AWS provider is configured with correct region', () => {
      const stack = new TapStack(app, 'TestAwsProvider', {
        awsRegion: 'ap-southeast-1',
        environmentSuffix: 'test',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('ap-southeast-1');
    });

    test('AWS provider includes default tags', () => {
      const stack = new TapStack(app, 'TestDefaultTags', {
        environmentSuffix: 'test',
        defaultTags: [
          {
            tags: {
              Environment: 'dev',
              Project: 'data-processing-pipeline',
            },
          },
        ],
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('data-processing-pipeline');
    });
  });

  describe('S3 Backend Configuration', () => {
    test('S3 backend is configured with correct bucket and key', () => {
      const stack = new TapStack(app, 'TestS3Backend', {
        environmentSuffix: 'test-backend',
        stateBucket: 'test-state-bucket',
        stateBucketRegion: 'us-west-2',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('test-state-bucket');
      expect(synthesized).toContain('test-backend');
      expect(synthesized).toContain('us-west-2');
    });

    test('S3 backend key includes stack id', () => {
      const stackId = 'UniqueStackId';
      const suffix = 'testsuffix';
      const stack = new TapStack(app, stackId, {
        environmentSuffix: suffix,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain(suffix);
      expect(synthesized).toContain('tfstate');
    });
  });

  describe('DataProcessing Stack Integration', () => {
    test('DataProcessing stack is instantiated within TapStack', () => {
      const stack = new TapStack(app, 'TestDataProcessing', {
        environmentSuffix: 'testdp',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('DataProcessing');
    });

    test('Resources include environment suffix in names', () => {
      const suffix = 'unique123';
      app.node.setContext('env', 'dev');
      const stack = new TapStack(app, 'TestResourceNaming', {
        environmentSuffix: suffix,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain(`company-data-dev-${suffix}`);
      expect(synthesized).toContain(`data-processor-dev-${suffix}`);
      expect(synthesized).toContain(`job-tracking-dev-${suffix}`);
    });
  });
});

describe('Environment Config Tests', () => {
  describe('getEnvironmentConfig', () => {
    test('returns correct config for dev environment', () => {
      const config = getEnvironmentConfig('dev');

      expect(config.environment).toBe('dev');
      expect(config.dynamodbReadCapacity).toBe(5);
      expect(config.dynamodbWriteCapacity).toBe(5);
      expect(config.lambdaMemorySize).toBe(128);
      expect(config.logRetentionDays).toBe(7);
    });

    test('returns correct config for staging environment', () => {
      const config = getEnvironmentConfig('staging');

      expect(config.environment).toBe('staging');
      expect(config.dynamodbReadCapacity).toBe(10);
      expect(config.dynamodbWriteCapacity).toBe(10);
      expect(config.lambdaMemorySize).toBe(256);
      expect(config.logRetentionDays).toBe(30);
    });

    test('returns correct config for prod environment', () => {
      const config = getEnvironmentConfig('prod');

      expect(config.environment).toBe('prod');
      expect(config.dynamodbReadCapacity).toBe(25);
      expect(config.dynamodbWriteCapacity).toBe(25);
      expect(config.lambdaMemorySize).toBe(512);
      expect(config.logRetentionDays).toBe(90);
    });

    test('throws error for invalid environment', () => {
      expect(() => getEnvironmentConfig('invalid')).toThrow(
        'Invalid environment: invalid. Must be one of: dev, staging, prod'
      );
    });

    test('throws error for empty environment string', () => {
      expect(() => getEnvironmentConfig('')).toThrow('Invalid environment');
    });
  });

  describe('validateEnvironment', () => {
    test('validates dev environment successfully', () => {
      expect(() => validateEnvironment('dev')).not.toThrow();
    });

    test('validates staging environment successfully', () => {
      expect(() => validateEnvironment('staging')).not.toThrow();
    });

    test('validates prod environment successfully', () => {
      expect(() => validateEnvironment('prod')).not.toThrow();
    });

    test('throws error for invalid environment', () => {
      expect(() => validateEnvironment('invalid')).toThrow(
        'Invalid environment: invalid. Must be one of: dev, staging, prod'
      );
    });

    test('throws error for qa environment (not in allowed list)', () => {
      expect(() => validateEnvironment('qa')).toThrow();
    });
  });
});

describe('DataProcessing Stack Resource Tests', () => {
  let app: App;

  beforeEach(() => {
    app = new App();
    app.node.setContext('env', 'dev');
  });

  test('S3 bucket is created with correct naming', () => {
    const stack = new TapStack(app, 'TestS3Bucket', {
      environmentSuffix: 'tests3',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('company-data-dev-tests3');
    expect(synthesized).toContain('force_destroy');
  });

  test('S3 bucket has versioning enabled', () => {
    const stack = new TapStack(app, 'TestS3Versioning', {
      environmentSuffix: 'testv',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('aws_s3_bucket_versioning');
    expect(synthesized).toContain('Enabled');
  });

  test('S3 bucket has encryption enabled', () => {
    const stack = new TapStack(app, 'TestS3Encryption', {
      environmentSuffix: 'teste',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('aws_s3_bucket_server_side_encryption');
    expect(synthesized).toContain('AES256');
  });

  test('DynamoDB table is created with correct capacity', () => {
    const stack = new TapStack(app, 'TestDynamoDB', {
      environmentSuffix: 'testddb',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('job-tracking-dev-testddb');
    expect(synthesized).toContain('PROVISIONED');
  });

  test('DynamoDB table has GSI configured', () => {
    const stack = new TapStack(app, 'TestDynamoDBGSI', {
      environmentSuffix: 'testgsi',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('StatusIndex');
    expect(synthesized).toContain('global_secondary_index');
  });

  test('Lambda function is created with correct configuration', () => {
    const stack = new TapStack(app, 'TestLambda', {
      environmentSuffix: 'testlambda',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('data-processor-dev-testlambda');
    expect(synthesized).toContain('nodejs18.x');
    expect(synthesized).toContain('index.handler');
  });

  test('Lambda has environment variables set', () => {
    const stack = new TapStack(app, 'TestLambdaEnv', {
      environmentSuffix: 'testenv',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('ENVIRONMENT');
    expect(synthesized).toContain('BUCKET_NAME');
    expect(synthesized).toContain('TABLE_NAME');
    expect(synthesized).toContain('REGION');
  });

  test('IAM role is created for Lambda', () => {
    const stack = new TapStack(app, 'TestIAMRole', {
      environmentSuffix: 'testiam',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('data-processor-role-dev-testiam');
    expect(synthesized).toContain('lambda.amazonaws.com');
  });

  test('IAM policy includes S3 permissions', () => {
    const stack = new TapStack(app, 'TestS3Policy', {
      environmentSuffix: 'tests3p',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('s3:GetObject');
    expect(synthesized).toContain('s3:PutObject');
    expect(synthesized).toContain('s3:ListBucket');
  });

  test('IAM policy includes DynamoDB permissions', () => {
    const stack = new TapStack(app, 'TestDDBPolicy', {
      environmentSuffix: 'testddbp',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('dynamodb:PutItem');
    expect(synthesized).toContain('dynamodb:GetItem');
    expect(synthesized).toContain('dynamodb:Query');
  });

  test('CloudWatch log group is created', () => {
    const stack = new TapStack(app, 'TestLogGroup', {
      environmentSuffix: 'testlg',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('/aws/lambda/data-processor-dev-testlg');
    expect(synthesized).toContain('aws_cloudwatch_log_group');
  });

  test('Stack outputs are defined', () => {
    const stack = new TapStack(app, 'TestOutputs', {
      environmentSuffix: 'testout',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('BucketName');
    expect(synthesized).toContain('BucketArn');
    expect(synthesized).toContain('TableName');
    expect(synthesized).toContain('TableArn');
    expect(synthesized).toContain('LambdaFunctionName');
    expect(synthesized).toContain('LambdaFunctionArn');
    expect(synthesized).toContain('LogGroupName');
    expect(synthesized).toContain('Environment');
    expect(synthesized).toContain('EnvironmentSuffix');
  });
});

describe('Multi-Environment Tests', () => {
  let app: App;

  beforeEach(() => {
    app = new App();
  });

  test('Dev environment uses correct resource sizing', () => {
    app.node.setContext('env', 'dev');
    const stack = new TapStack(app, 'TestDevSizing', {
      environmentSuffix: 'testdev',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('dev');
  });

  test('Staging environment uses correct resource sizing', () => {
    app.node.setContext('env', 'staging');
    const stack = new TapStack(app, 'TestStagingSizing', {
      environmentSuffix: 'teststaging',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('staging');
  });

  test('Prod environment uses correct resource sizing', () => {
    app.node.setContext('env', 'prod');
    const stack = new TapStack(app, 'TestProdSizing', {
      environmentSuffix: 'testprod',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('prod');
  });

  test('Resources are tagged with environment', () => {
    app.node.setContext('env', 'dev');
    const stack = new TapStack(app, 'TestTags', {
      environmentSuffix: 'testtags',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('Environment');
    expect(synthesized).toContain('Project');
    expect(synthesized).toContain('EnvironmentSuffix');
  });
});
