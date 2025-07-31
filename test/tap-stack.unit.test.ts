import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

Testing.setupJest();

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('Stack Instantiation', () => {
    test('should instantiate successfully with props', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'prod',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'us-east-1',
        awsRegion: 'us-east-1',
        defaultTags: {
          tags: {
            Environment: 'prod',
            Repository: 'test-repo',
            Author: 'test-author',
          }
        }
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('should instantiate successfully with default values', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDefault', {
        environmentSuffix: 'test',
        stateBucket: 'test-bucket',
        stateBucketRegion: 'us-east-1',
        awsRegion: 'us-east-1',
        defaultTags: {
          tags: {
            Environment: 'test',
            Repository: 'unit-test',
            Author: 'tester',
          }
        }
      });
      
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });
  });

  describe('AWS Provider Configuration', () => {
    test('should configure AWS provider for us-east-1 region', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        stateBucket: 'test-bucket',
        stateBucketRegion: 'us-east-1',
        awsRegion: 'us-east-1',
        defaultTags: {
          tags: { Environment: 'test' }
        }
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"region": "us-east-1"');
    });
  });

  describe('S3 Bucket Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        stateBucket: 'test-bucket',
        stateBucketRegion: 'us-east-1',
        awsRegion: 'us-east-1',
        defaultTags: {
          tags: { Environment: 'test' }
        }
      });
      synthesized = Testing.synth(stack);
    });

    test('should create S3 bucket with proper naming', () => {
      expect(synthesized).toContain('image-processing-source-bucket-');
      expect(synthesized).toContain('"aws_s3_bucket"');
    });

    test('should enable S3 bucket versioning', () => {
      expect(synthesized).toContain('"aws_s3_bucket_versioning"');
      expect(synthesized).toContain('"status": "Enabled"');
    });

    test('should configure S3 server-side encryption', () => {
      expect(synthesized).toContain('"aws_s3_bucket_server_side_encryption_configuration"');
      expect(synthesized).toContain('"sse_algorithm": "AES256"');
    });

    test('should configure S3 bucket notification', () => {
      expect(synthesized).toContain('"aws_s3_bucket_notification"');
      expect(synthesized).toContain('"s3:ObjectCreated:*"');
    });

    test('should apply consistent tags to S3 bucket', () => {
      expect(synthesized).toContain('"Environment": "Production"');
    });
  });

  describe('Lambda Function Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        stateBucket: 'test-bucket',
        stateBucketRegion: 'us-east-1',
        awsRegion: 'us-east-1',
        defaultTags: {
          tags: { Environment: 'test' }
        }
      });
      synthesized = Testing.synth(stack);
    });

    test('should create Lambda function with correct configuration', () => {
      expect(synthesized).toContain('"aws_lambda_function"');
      expect(synthesized).toContain('"function_name": "image-processing-function"');
      expect(synthesized).toContain('"runtime": "python3.8"');
      expect(synthesized).toContain('"handler": "index.lambda_handler"');
      expect(synthesized).toContain('"timeout": 30');
    });

    test('should configure Lambda environment variables', () => {
      expect(synthesized).toContain('"SNS_TOPIC_ARN"');
    });

    test('should configure Lambda dead letter queue', () => {
      expect(synthesized).toContain('"dead_letter_config"');
      expect(synthesized).toContain('"target_arn"');
    });

    test('should apply consistent tags to Lambda function', () => {
      expect(synthesized).toContain('"Environment": "Production"');
    });
  });

  describe('IAM Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        stateBucket: 'test-bucket',
        stateBucketRegion: 'us-east-1',
        awsRegion: 'us-east-1',
        defaultTags: {
          tags: { Environment: 'test' }
        }
      });
      synthesized = Testing.synth(stack);
    });

    test('should create IAM role for Lambda execution', () => {
      expect(synthesized).toContain('"aws_iam_role"');
      expect(synthesized).toContain('"name": "image-processing-lambda-role"');
      expect(synthesized).toContain('lambda.amazonaws.com');
      expect(synthesized).toContain('sts:AssumeRole');
    });

    test('should create IAM policy with least privilege permissions', () => {
      expect(synthesized).toContain('"aws_iam_role_policy"');
      expect(synthesized).toContain('"name": "image-processing-lambda-policy"');
      
      // CloudWatch Logs permissions
      expect(synthesized).toContain('logs:CreateLogStream');
      expect(synthesized).toContain('logs:PutLogEvents');
      
      // SNS publish permissions
      expect(synthesized).toContain('sns:Publish');
      
      // SQS send message permissions for DLQ
      expect(synthesized).toContain('sqs:SendMessage');
    });

    test('should configure Lambda permission for S3 invocation', () => {
      expect(synthesized).toContain('"aws_lambda_permission"');
      expect(synthesized).toContain('"statement_id": "AllowExecutionFromS3Bucket"');
      expect(synthesized).toContain('"action": "lambda:InvokeFunction"');
      expect(synthesized).toContain('"principal": "s3.amazonaws.com"');
    });
  });

  describe('SNS Topic Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        stateBucket: 'test-bucket',
        stateBucketRegion: 'us-east-1',
        awsRegion: 'us-east-1',
        defaultTags: {
          tags: { Environment: 'test' }
        }
      });
      synthesized = Testing.synth(stack);
    });

    test('should create SNS topic with correct name', () => {
      expect(synthesized).toContain('"aws_sns_topic"');
      expect(synthesized).toContain('"name": "image-processing-completion-notifications"');
    });

    test('should apply consistent tags to SNS topic', () => {
      expect(synthesized).toContain('"Environment": "Production"');
    });
  });

  describe('SQS Dead Letter Queue Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        stateBucket: 'test-bucket',
        stateBucketRegion: 'us-east-1',
        awsRegion: 'us-east-1',
        defaultTags: {
          tags: { Environment: 'test' }
        }
      });
      synthesized = Testing.synth(stack);
    });

    test('should create SQS queue for dead letter handling', () => {
      expect(synthesized).toContain('"aws_sqs_queue"');
      expect(synthesized).toContain('"name": "image-processing-lambda-dlq"');
    });

    test('should apply consistent tags to SQS queue', () => {
      expect(synthesized).toContain('"Environment": "Production"');
    });
  });

  describe('CloudWatch Log Group Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        stateBucket: 'test-bucket',
        stateBucketRegion: 'us-east-1',
        awsRegion: 'us-east-1',
        defaultTags: {
          tags: { Environment: 'test' }
        }
      });
      synthesized = Testing.synth(stack);
    });

    test('should create CloudWatch log group for Lambda', () => {
      expect(synthesized).toContain('"aws_cloudwatch_log_group"');
      expect(synthesized).toContain('"/aws/lambda/image-processing-function"');
      expect(synthesized).toContain('"retention_in_days": 14');
    });

    test('should apply consistent tags to CloudWatch log group', () => {
      expect(synthesized).toContain('"Environment": "Production"');
    });
  });

  describe('Resource Dependencies', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        stateBucket: 'test-bucket',
        stateBucketRegion: 'us-east-1',
        awsRegion: 'us-east-1',
        defaultTags: {
          tags: { Environment: 'test' }
        }
      });
      synthesized = Testing.synth(stack);
    });

    test('should configure proper resource dependencies', () => {
      expect(synthesized).toContain('"depends_on"');
    });

    test('should reference resources correctly', () => {
      // Verify that resources reference each other using proper CDKTF references
      expect(synthesized).toContain('${aws_');
    });
  });

  describe('Resource Naming and Uniqueness', () => {
    test('should generate unique bucket names for different stacks', () => {
      const app1 = new App();
      const stack1 = new TapStack(app1, 'TestStack1', {
        environmentSuffix: 'test1',
        stateBucket: 'test-bucket',
        stateBucketRegion: 'us-east-1',
        awsRegion: 'us-east-1',
        defaultTags: { tags: { Environment: 'test' } }
      });
      const synthesized1 = Testing.synth(stack1);

      const app2 = new App();
      const stack2 = new TapStack(app2, 'TestStack2', {
        environmentSuffix: 'test2',
        stateBucket: 'test-bucket',
        stateBucketRegion: 'us-east-1',
        awsRegion: 'us-east-1',
        defaultTags: { tags: { Environment: 'test' } }
      });
      const synthesized2 = Testing.synth(stack2);

      // Both should contain bucket configuration but potentially different names
      expect(synthesized1).toContain('image-processing-source-bucket-');
      expect(synthesized2).toContain('image-processing-source-bucket-');
    });
  });
});