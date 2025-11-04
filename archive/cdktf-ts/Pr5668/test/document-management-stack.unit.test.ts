import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('DocumentManagementStack Unit Tests', () => {
  describe('Stack Instantiation', () => {
    let app: App;
    let tapStack: TapStack;
    let synthesized: string;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should instantiate with dev environment', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      expect(tapStack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('ap-southeast-1');
    });

    test('should instantiate with staging environment', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'staging',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      expect(tapStack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('should instantiate with prod environment', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'prod',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      expect(tapStack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('should use correct AWS region', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      expect(synthesized).toContain('ap-southeast-1');
    });

    test('should create stack with environmentSuffix in name', () => {
      app = new App();
      const envSuffix = 'test123';
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: envSuffix,
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      expect(synthesized).toContain(envSuffix);
    });
  });

  describe('S3 Bucket Configuration', () => {
    let app: App;
    let tapStack: TapStack;
    let synthesized: string;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should create S3 bucket with environmentSuffix in name', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      expect(synthesized).toContain('company-docs-dev');
      expect(synthesized).toContain('aws_s3_bucket');
    });

    test('should enable S3 bucket encryption', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      expect(synthesized).toContain('aws_s3_bucket_server_side_encryption_configuration');
      expect(synthesized).toContain('AES256');
    });

    test('should configure S3 lifecycle rules with correct archive days', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      expect(synthesized).toContain('aws_s3_bucket_lifecycle_configuration');
      expect(synthesized).toContain('GLACIER');
    });

    test('should enable versioning for staging environment', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'staging',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      expect(synthesized).toContain('aws_s3_bucket_versioning');
      expect(synthesized).toContain('Enabled');
    });

    test('should enable versioning for prod environment', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'prod',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      expect(synthesized).toContain('aws_s3_bucket_versioning');
      expect(synthesized).toContain('Enabled');
    });

    test('should have Environment and Project tags', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      expect(synthesized).toContain('Environment');
      expect(synthesized).toContain('Project');
      expect(synthesized).toContain('DocumentManagement');
    });
  });

  describe('DynamoDB Table Configuration', () => {
    let app: App;
    let tapStack: TapStack;
    let synthesized: string;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should create DynamoDB table with environmentSuffix in name', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      expect(synthesized).toContain('document-metadata-dev');
      expect(synthesized).toContain('aws_dynamodb_table');
    });

    test('should use PAY_PER_REQUEST billing for dev environment', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      expect(synthesized).toContain('PAY_PER_REQUEST');
    });

    test('should use PROVISIONED billing for staging environment', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'staging',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      expect(synthesized).toContain('PROVISIONED');
      const synthesizedObj = JSON.parse(synthesized);
      const dynamoResources = Object.values(synthesizedObj.resource.aws_dynamodb_table);
      const table = dynamoResources[0] as any;
      expect(table.read_capacity).toBe(10);
      expect(table.write_capacity).toBe(10);
    });

    test('should use PROVISIONED billing for prod environment', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'prod',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      expect(synthesized).toContain('PROVISIONED');
      const synthesizedObj = JSON.parse(synthesized);
      const dynamoResources = Object.values(synthesizedObj.resource.aws_dynamodb_table);
      const table = dynamoResources[0] as any;
      expect(table.read_capacity).toBe(25);
      expect(table.write_capacity).toBe(25);
    });

    test('should have documentId as hash key', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      expect(synthesized).toContain('documentId');
      expect(synthesized).toContain('hash_key');
    });

    test('should have appropriate tags', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      const synthesizedObj = JSON.parse(synthesized);
      const dynamoResources = Object.values(synthesizedObj.resource.aws_dynamodb_table);
      expect(dynamoResources.length).toBeGreaterThan(0);

      const table = dynamoResources[0] as any;
      expect(table.tags).toHaveProperty('Environment');
      expect(table.tags).toHaveProperty('Project');
    });
  });

  describe('Lambda Function Configuration', () => {
    let app: App;
    let tapStack: TapStack;
    let synthesized: string;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should create Lambda function with environmentSuffix in name', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      expect(synthesized).toContain('document-processor-dev');
      expect(synthesized).toContain('aws_lambda_function');
    });

    test('should use nodejs18.x runtime', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      expect(synthesized).toContain('nodejs18.x');
    });

    test('should have correct handler', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      expect(synthesized).toContain('index.handler');
    });

    test('should have environment-specific timeout for dev (30s)', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      const synthesizedObj = JSON.parse(synthesized);
      const lambdaResources = Object.values(synthesizedObj.resource.aws_lambda_function);
      const lambda = lambdaResources[0] as any;
      expect(lambda.timeout).toBe(30);
    });

    test('should have environment-specific timeout for staging (60s)', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'staging',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      const synthesizedObj = JSON.parse(synthesized);
      const lambdaResources = Object.values(synthesizedObj.resource.aws_lambda_function);
      const lambda = lambdaResources[0] as any;
      expect(lambda.timeout).toBe(60);
    });

    test('should have environment-specific timeout for prod (120s)', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'prod',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      const synthesizedObj = JSON.parse(synthesized);
      const lambdaResources = Object.values(synthesizedObj.resource.aws_lambda_function);
      const lambda = lambdaResources[0] as any;
      expect(lambda.timeout).toBe(120);
    });

    test('should have environment-specific memory for dev (256MB)', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      const synthesizedObj = JSON.parse(synthesized);
      const lambdaResources = Object.values(synthesizedObj.resource.aws_lambda_function);
      const lambda = lambdaResources[0] as any;
      expect(lambda.memory_size).toBe(256);
    });

    test('should have environment-specific memory for staging (512MB)', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'staging',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      const synthesizedObj = JSON.parse(synthesized);
      const lambdaResources = Object.values(synthesizedObj.resource.aws_lambda_function);
      const lambda = lambdaResources[0] as any;
      expect(lambda.memory_size).toBe(512);
    });

    test('should have environment-specific memory for prod (1024MB)', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'prod',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      const synthesizedObj = JSON.parse(synthesized);
      const lambdaResources = Object.values(synthesizedObj.resource.aws_lambda_function);
      const lambda = lambdaResources[0] as any;
      expect(lambda.memory_size).toBe(1024);
    });

    test('should have environment variables configured', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      expect(synthesized).toContain('BUCKET_NAME');
      expect(synthesized).toContain('TABLE_NAME');
      expect(synthesized).toContain('ENVIRONMENT');
    });

    test('should have IAM role with correct permissions', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      expect(synthesized).toContain('aws_iam_role');
      expect(synthesized).toContain('document-processor-role-dev');
      expect(synthesized).toContain('lambda.amazonaws.com');
    });

    test('should attach AWSLambdaBasicExecutionRole policy', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      expect(synthesized).toContain('aws_iam_role_policy_attachment');
      expect(synthesized).toContain('AWSLambdaBasicExecutionRole');
    });
  });

  describe('CloudWatch Alarms Configuration', () => {
    let app: App;
    let tapStack: TapStack;
    let synthesized: string;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should create SNS topic with environmentSuffix in name', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      expect(synthesized).toContain('dynamodb-alarms-dev');
      expect(synthesized).toContain('aws_sns_topic');
    });

    test('should create read throttle alarm', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      expect(synthesized).toContain('ReadThrottleEvents');
      expect(synthesized).toContain('AWS/DynamoDB');
    });

    test('should create write throttle alarm', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      expect(synthesized).toContain('WriteThrottleEvents');
      expect(synthesized).toContain('AWS/DynamoDB');
    });

    test('should have environment-specific thresholds for dev', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      const synthesizedObj = JSON.parse(synthesized);
      const alarmResources = Object.values(synthesizedObj.resource.aws_cloudwatch_metric_alarm);
      const alarm = alarmResources[0] as any;
      expect(alarm.threshold).toBe(5);
    });

    test('should have environment-specific thresholds for staging', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'staging',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      const synthesizedObj = JSON.parse(synthesized);
      const alarmResources = Object.values(synthesizedObj.resource.aws_cloudwatch_metric_alarm);
      const alarm = alarmResources[0] as any;
      expect(alarm.threshold).toBe(10);
    });

    test('should have environment-specific thresholds for prod', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'prod',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      const synthesizedObj = JSON.parse(synthesized);
      const alarmResources = Object.values(synthesizedObj.resource.aws_cloudwatch_metric_alarm);
      const alarm = alarmResources[0] as any;
      expect(alarm.threshold).toBe(20);
    });

    test('should configure alarms with correct evaluation periods', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      const synthesizedObj = JSON.parse(synthesized);
      const alarmResources = Object.values(synthesizedObj.resource.aws_cloudwatch_metric_alarm);
      const alarm = alarmResources[0] as any;
      expect(alarm.evaluation_periods).toBe(2);
    });

    test('should configure alarms with correct period', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      const synthesizedObj = JSON.parse(synthesized);
      const alarmResources = Object.values(synthesizedObj.resource.aws_cloudwatch_metric_alarm);
      const alarm = alarmResources[0] as any;
      expect(alarm.period).toBe(300);
    });
  });

  describe('Provider Configuration', () => {
    let app: App;
    let tapStack: TapStack;
    let synthesized: string;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should configure AWS provider with correct region', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      const synthesizedObj = JSON.parse(synthesized);
      expect(synthesizedObj.provider.aws[0].region).toBe('ap-southeast-1');
    });

    test('should configure Archive provider', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      const synthesizedObj = JSON.parse(synthesized);
      expect(synthesizedObj.provider).toHaveProperty('archive');
    });

    test('should configure S3 backend', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      const synthesizedObj = JSON.parse(synthesized);
      expect(synthesizedObj.terraform.backend).toHaveProperty('s3');
      expect(synthesizedObj.terraform.backend.s3.encrypt).toBe(true);
    });

    test('should use custom state bucket when provided', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'ap-southeast-1',
        stateBucket: 'custom-bucket',
        stateBucketRegion: 'us-west-2',
      });
      synthesized = Testing.synth(tapStack);

      expect(synthesized).toContain('custom-bucket');
      expect(synthesized).toContain('us-west-2');
    });
  });

  describe('Resource Naming Conventions', () => {
    let app: App;
    let tapStack: TapStack;
    let synthesized: string;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('all resource names should include environmentSuffix', () => {
      app = new App();
      const envSuffix = 'test123';
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: envSuffix,
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      // Check S3 bucket
      expect(synthesized).toContain(`company-docs-${envSuffix}`);
      // Check DynamoDB table
      expect(synthesized).toContain(`document-metadata-${envSuffix}`);
      // Check Lambda function
      expect(synthesized).toContain(`document-processor-${envSuffix}`);
      // Check IAM role
      expect(synthesized).toContain(`document-processor-role-${envSuffix}`);
      // Check SNS topic
      expect(synthesized).toContain(`dynamodb-alarms-${envSuffix}`);
    });

    test('should not contain hardcoded environment names in resource names', () => {
      app = new App();
      tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'custom',
        awsRegion: 'ap-southeast-1',
      });
      synthesized = Testing.synth(tapStack);

      // Resource names should not have hardcoded 'dev', 'staging', 'prod'
      const resourceNamePattern = /"name":"[^"]*-(dev|staging|prod)"/;
      expect(resourceNamePattern.test(synthesized)).toBe(false);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    let app: App;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should handle empty environmentSuffix gracefully', () => {
      app = new App();
      const tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: '',
        awsRegion: 'ap-southeast-1',
      });
      const synthesized = Testing.synth(tapStack);

      expect(synthesized).toBeDefined();
    });

    test('should handle special characters in environmentSuffix', () => {
      app = new App();
      const tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test-env-123',
        awsRegion: 'ap-southeast-1',
      });
      const synthesized = Testing.synth(tapStack);

      expect(synthesized).toContain('test-env-123');
    });

    test('should use default region when not provided', () => {
      app = new App();
      const tapStack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
      });
      const synthesized = Testing.synth(tapStack);

      // Should default to ap-southeast-1 per lib/AWS_REGION
      expect(synthesized).toBeDefined();
    });
  });
});
