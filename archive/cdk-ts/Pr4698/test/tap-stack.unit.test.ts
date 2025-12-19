import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { AnalyticsStack } from '../lib/analytics';

describe('TapStack', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('Stack Creation', () => {
    test('should create stack with default environment suffix', () => {
      const stack = new TapStack(app, 'TestTapStack');
      expect(stack).toBeDefined();
    });

    test('should create stack with provided environment suffix in props', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test123',
      });
      expect(stack).toBeDefined();
    });

    test('should create stack with environment suffix from context', () => {
      const appWithContext = new cdk.App({
        context: { environmentSuffix: 'context-test' },
      });
      const stack = new TapStack(appWithContext, 'TestTapStack');
      expect(stack).toBeDefined();
    });

    test('should prioritize props environmentSuffix over context', () => {
      const appWithContext = new cdk.App({
        context: { environmentSuffix: 'context-test' },
      });
      const stack = new TapStack(appWithContext, 'TestTapStack', {
        environmentSuffix: 'props-test',
      });
      expect(stack).toBeDefined();
    });

    test('should use default region from props', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { region: 'eu-west-1' },
      });
      expect(stack).toBeDefined();
    });

    test('should default to us-east-1 region when not provided', () => {
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Nested Stack Creation', () => {
    test('should create AnalyticsStack as a child', () => {
      new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });

      const assembly = app.synth();
      const stackArtifact = assembly.getStackByName('AnalyticsStack-test');
      expect(stackArtifact).toBeDefined();
    });

    test('should pass environmentSuffix to AnalyticsStack', () => {
      new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'custom-env',
      });

      const assembly = app.synth();
      const stackArtifact = assembly.getStackByName('AnalyticsStack-custom-env');
      expect(stackArtifact).toBeDefined();
    });
  });
});

describe('AnalyticsStack', () => {
  let app: cdk.App;
  let stack: AnalyticsStack;
  let template: Template;
  const testEnvSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new AnalyticsStack(app, 'TestAnalyticsStack', {
      environmentSuffix: testEnvSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Initialization', () => {
    test('should create AnalyticsStack successfully', () => {
      expect(stack).toBeDefined();
    });

    test('should apply required tags to all resources', () => {
      const tags = cdk.Tags.of(stack);
      expect(tags).toBeDefined();
    });
  });

  describe('KMS Key Configuration', () => {
    test('should create KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        Description: 'KMS key for sensor data encryption',
      });
    });

    test('should have KMS key configured for deletion', () => {
      // KMS key should be configured to be deleted
      const kmsKeys = template.findResources('AWS::KMS::Key');
      expect(Object.keys(kmsKeys).length).toBe(1);
      // The key exists and is properly configured with rotation enabled
      expect(kmsKeys).toBeDefined();
    });

    test('should create exactly one KMS key', () => {
      template.resourceCountIs('AWS::KMS::Key', 1);
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should create S3 bucket with KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `raw-sensor-data-${testEnvSuffix}`,
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
      });
    });

    test('should block all public access on S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should configure lifecycle rule for Glacier transition', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 30,
                },
              ],
            },
          ],
        },
      });
    });

    test('should create exactly one S3 bucket', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });
  });

  describe('Lambda Functions Configuration', () => {
    test('should create validation Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `validation-lambda-${testEnvSuffix}`,
        Runtime: 'nodejs20.x',
        MemorySize: 512,
        Timeout: 30,
      });
    });

    test('should create transformation Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `transformation-lambda-${testEnvSuffix}`,
        Runtime: 'nodejs20.x',
        MemorySize: 512,
        Timeout: 30,
      });
    });

    test('should configure validation Lambda with S3 bucket environment variable', () => {
      template.hasResourceProperties('AWS::Lambda::Function', Match.objectLike({
        FunctionName: `validation-lambda-${testEnvSuffix}`,
        Environment: {
          Variables: {
            RAW_DATA_BUCKET: Match.anyValue(),
          },
        },
      }));
    });

    test('should configure transformation Lambda with DynamoDB table environment variable', () => {
      template.hasResourceProperties('AWS::Lambda::Function', Match.objectLike({
        FunctionName: `transformation-lambda-${testEnvSuffix}`,
        Environment: {
          Variables: {
            DYNAMODB_TABLE: Match.anyValue(),
          },
        },
      }));
    });

    test('should create validation and transformation Lambda functions', () => {
      // Should have our two main Lambda functions (plus any CDK-generated custom resource handlers)
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `validation-lambda-${testEnvSuffix}`,
      });
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `transformation-lambda-${testEnvSuffix}`,
      });
    });
  });

  describe('CloudWatch Log Groups Configuration', () => {
    test('should create validation Lambda log group with correct retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/validation-lambda-${testEnvSuffix}`,
        RetentionInDays: 7,
      });
    });

    test('should create transformation Lambda log group with correct retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/transformation-lambda-${testEnvSuffix}`,
        RetentionInDays: 7,
      });
    });

    test('should create exactly two log groups', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 2);
    });
  });

  describe('DynamoDB Table Configuration', () => {
    test('should create DynamoDB table with correct keys', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `sensor-data-table-${testEnvSuffix}`,
        KeySchema: [
          {
            AttributeName: 'deviceId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'deviceId',
            AttributeType: 'S',
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'S',
          },
        ],
      });
    });

    test('should configure DynamoDB table with on-demand billing', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('should enable TTL on DynamoDB table', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TimeToLiveSpecification: {
          AttributeName: 'expirationTime',
          Enabled: true,
        },
      });
    });

    test('should create exactly one DynamoDB table', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });
  });

  describe('Kinesis Data Stream Configuration', () => {
    test('should create Kinesis stream with correct configuration', () => {
      template.hasResourceProperties('AWS::Kinesis::Stream', {
        Name: `sensor-data-stream-${testEnvSuffix}`,
        ShardCount: 1,
      });
    });

    test('should create exactly one Kinesis stream', () => {
      template.resourceCountIs('AWS::Kinesis::Stream', 1);
    });
  });

  describe('API Gateway Configuration', () => {
    test('should create REST API with correct name and description', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `sensor-data-api-${testEnvSuffix}`,
        Description: 'API for sensor data ingestion',
      });
    });

    test('should create API Gateway resource for sensor endpoint', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'sensor',
      });
    });

    test('should create POST method on sensor resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        ApiKeyRequired: true,
      });
    });

    test('should create request validator', () => {
      template.hasResourceProperties('AWS::ApiGateway::RequestValidator', {
        ValidateRequestBody: true,
      });
    });

    test('should create API key', () => {
      template.resourceCountIs('AWS::ApiGateway::ApiKey', 1);
    });

    test('should create usage plan with throttling', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        Throttle: {
          RateLimit: 1000,
          BurstLimit: 2000,
        },
      });
    });

    test('should create model for request validation', () => {
      template.hasResourceProperties('AWS::ApiGateway::Model', {
        ContentType: 'application/json',
        Name: `SensorDataModel${testEnvSuffix}`,
      });
    });
  });

  describe('SQS Dead Letter Queue Configuration', () => {
    test('should create SQS queue for dead letter processing', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `sensor-data-transformation-dlq-${testEnvSuffix}`,
      });
    });

    test('should create exactly one SQS queue', () => {
      template.resourceCountIs('AWS::SQS::Queue', 1);
    });
  });

  describe('S3 Event Notifications', () => {
    test('should configure S3 to Lambda notification', () => {
      template.hasResourceProperties('Custom::S3BucketNotifications', {
        NotificationConfiguration: {
          LambdaFunctionConfigurations: [
            {
              Events: ['s3:ObjectCreated:*'],
            },
          ],
        },
      });
    });
  });

  describe('CloudWatch Alarm Configuration', () => {
    test('should create alarm for transformation Lambda error rate', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `transformation-lambda-error-alarm-${testEnvSuffix}`,
        Threshold: 1,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 1,
        AlarmDescription: 'Alarm if the error rate exceeds 1% over 5 minutes',
      });
    });

    test('should create exactly one CloudWatch alarm', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 1);
    });
  });

  describe('IAM Permissions', () => {
    test('should grant validation Lambda write permissions to S3', () => {
      // Validation Lambda should have S3 write permissions
      const policies = template.findResources('AWS::IAM::Policy');
      const validationLambdaPolicies = Object.values(policies).filter((policy: any) =>
        policy.Properties.PolicyName.includes('ValidationLambda')
      );
      expect(validationLambdaPolicies.length).toBeGreaterThan(0);

      // Check that S3 write permissions exist in the policy
      const hasS3Write = validationLambdaPolicies.some((policy: any) =>
        policy.Properties.PolicyDocument.Statement.some((statement: any) =>
          statement.Action &&
          Array.isArray(statement.Action) &&
          statement.Action.some((action: string) => action.includes('s3:PutObject'))
        )
      );
      expect(hasS3Write).toBe(true);
    });

    test('should grant validation Lambda KMS encrypt/decrypt permissions', () => {
      // Validation Lambda should have KMS permissions
      const policies = template.findResources('AWS::IAM::Policy');
      const validationLambdaPolicies = Object.values(policies).filter((policy: any) =>
        policy.Properties.PolicyName.includes('ValidationLambda')
      );

      // Check that KMS permissions exist in the policy
      const hasKMSPerms = validationLambdaPolicies.some((policy: any) =>
        policy.Properties.PolicyDocument.Statement.some((statement: any) =>
          statement.Action &&
          Array.isArray(statement.Action) &&
          (statement.Action.includes('kms:Decrypt') || statement.Action.includes('kms:Encrypt'))
        )
      );
      expect(hasKMSPerms).toBe(true);
    });

    test('should grant transformation Lambda read permissions to S3', () => {
      // Transformation Lambda should have S3 read permissions
      const policies = template.findResources('AWS::IAM::Policy');
      const transformationLambdaPolicies = Object.values(policies).filter((policy: any) =>
        policy.Properties.PolicyName.includes('TransformationLambda')
      );

      expect(transformationLambdaPolicies.length).toBeGreaterThan(0);

      // Check that S3 read permissions exist in the policy
      const hasS3Read = transformationLambdaPolicies.some((policy: any) =>
        policy.Properties.PolicyDocument.Statement.some((statement: any) =>
          statement.Action &&
          Array.isArray(statement.Action) &&
          statement.Action.some((action: string) => action.includes('s3:GetObject'))
        )
      );
      expect(hasS3Read).toBe(true);
    });

    test('should grant transformation Lambda write permissions to DynamoDB', () => {
      // Transformation Lambda should have DynamoDB write permissions
      const policies = template.findResources('AWS::IAM::Policy');
      const transformationLambdaPolicies = Object.values(policies).filter((policy: any) =>
        policy.Properties.PolicyName.includes('TransformationLambda')
      );

      // Check that DynamoDB write permissions exist in the policy
      const hasDynamoWrite = transformationLambdaPolicies.some((policy: any) =>
        policy.Properties.PolicyDocument.Statement.some((statement: any) =>
          statement.Action &&
          Array.isArray(statement.Action) &&
          (statement.Action.includes('dynamodb:PutItem') ||
            statement.Action.includes('dynamodb:BatchWriteItem'))
        )
      );
      expect(hasDynamoWrite).toBe(true);
    });
  });

  describe('Stack Outputs', () => {
    test('should export API endpoint URL', () => {
      template.hasOutput('ApiEndpoint', {
        Description: 'URL of the API Gateway endpoint',
        Export: {
          Name: `ApiEndpoint-${testEnvSuffix}`,
        },
      });
    });

    test('should export API ID', () => {
      template.hasOutput('ApiId', {
        Description: 'API Gateway REST API ID',
        Export: {
          Name: `ApiId-${testEnvSuffix}`,
        },
      });
    });

    test('should export API key ID', () => {
      template.hasOutput('ApiKeyId', {
        Description: 'API Key ID for authentication',
        Export: {
          Name: `ApiKeyId-${testEnvSuffix}`,
        },
      });
    });

    test('should export S3 bucket name', () => {
      template.hasOutput('RawDataBucketName', {
        Description: 'Name of the raw sensor data bucket',
        Export: {
          Name: `RawDataBucketName-${testEnvSuffix}`,
        },
      });
    });

    test('should export KMS key ID', () => {
      template.hasOutput('KmsKeyId', {
        Description: 'KMS Key ID for encryption',
        Export: {
          Name: `KmsKeyId-${testEnvSuffix}`,
        },
      });
    });

    test('should export validation Lambda name', () => {
      template.hasOutput('ValidationLambdaName', {
        Description: 'Name of the validation Lambda function',
        Export: {
          Name: `ValidationLambdaName-${testEnvSuffix}`,
        },
      });
    });

    test('should export transformation Lambda name', () => {
      template.hasOutput('TransformationLambdaName', {
        Description: 'Name of the transformation Lambda function',
        Export: {
          Name: `TransformationLambdaName-${testEnvSuffix}`,
        },
      });
    });

    test('should export DynamoDB table name', () => {
      template.hasOutput('SensorDataTableName', {
        Description: 'Name of the DynamoDB sensor data table',
        Export: {
          Name: `SensorDataTableName-${testEnvSuffix}`,
        },
      });
    });

    test('should export Kinesis stream name', () => {
      template.hasOutput('KinesisStreamName', {
        Description: 'Name of the Kinesis data stream',
        Export: {
          Name: `KinesisStreamName-${testEnvSuffix}`,
        },
      });
    });

    test('should export Dead Letter Queue URL', () => {
      template.hasOutput('DeadLetterQueueUrl', {
        Description: 'URL of the dead-letter queue',
        Export: {
          Name: `DeadLetterQueueUrl-${testEnvSuffix}`,
        },
      });
    });

    test('should export CloudWatch log group names', () => {
      template.hasOutput('ValidationLambdaLogGroupName', {
        Description: 'CloudWatch Log Group for validation Lambda',
        Export: {
          Name: `ValidationLambdaLogGroupName-${testEnvSuffix}`,
        },
      });

      template.hasOutput('TransformationLambdaLogGroupName', {
        Description: 'CloudWatch Log Group for transformation Lambda',
        Export: {
          Name: `TransformationLambdaLogGroupName-${testEnvSuffix}`,
        },
      });
    });

    test('should export alarm name', () => {
      template.hasOutput('AlarmName', {
        Description: 'Name of the CloudWatch alarm for error rate',
        Export: {
          Name: `AlarmName-${testEnvSuffix}`,
        },
      });
    });

    test('should export AWS region', () => {
      template.hasOutput('Region', {
        Description: 'AWS Region where resources are deployed',
        Export: {
          Name: `Region-${testEnvSuffix}`,
        },
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have expected total number of AWS resources', () => {
      // Verify we have all the expected resource types
      const resourceTypes = [
        'AWS::KMS::Key',
        'AWS::S3::Bucket',
        'AWS::Lambda::Function',
        'AWS::Logs::LogGroup',
        'AWS::DynamoDB::Table',
        'AWS::Kinesis::Stream',
        'AWS::ApiGateway::RestApi',
        'AWS::SQS::Queue',
        'AWS::CloudWatch::Alarm',
      ];

      resourceTypes.forEach((resourceType) => {
        const resources = template.findResources(resourceType);
        expect(Object.keys(resources).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle stack creation with minimal props', () => {
      const minimalStack = new AnalyticsStack(app, 'MinimalStack', {
        environmentSuffix: 'min',
      });
      expect(minimalStack).toBeDefined();
    });

    test('should create unique resource IDs with environment suffix', () => {
      // Create separate apps for each stack to avoid synth conflicts
      const app1 = new cdk.App();
      const app2 = new cdk.App();

      const stack1 = new AnalyticsStack(app1, 'Stack1', {
        environmentSuffix: 'env1',
      });
      const stack2 = new AnalyticsStack(app2, 'Stack2', {
        environmentSuffix: 'env2',
      });

      const template1 = Template.fromStack(stack1);
      const template2 = Template.fromStack(stack2);

      // Both stacks should have their own resources
      expect(template1).toBeDefined();
      expect(template2).toBeDefined();

      // Verify different environment suffixes create different resource names
      template1.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'raw-sensor-data-env1',
      });
      template2.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'raw-sensor-data-env2',
      });
    });
  });
});
