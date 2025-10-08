import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('Stack should be created successfully', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('Stack should have environment suffix', () => {
      expect(environmentSuffix).toBeDefined();
      expect(environmentSuffix).toBe('test');
    });

    test('Should use provided environmentSuffix in stack name', () => {
      expect(stack.stackName).toContain('Test');
    });

    test('Should use environmentSuffix from context when props not provided', () => {
      const testApp = new cdk.App({ context: { environmentSuffix: 'context-env' } });
      const contextStack = new TapStack(testApp, 'ContextTestStack');
      const contextTemplate = Template.fromStack(contextStack);
      
      // Verify that resources use the context environmentSuffix
      contextTemplate.hasResourceProperties('AWS::Kinesis::Stream', {
        Name: 'recommendation-context-env-user-events',
      });
    });

    test('Should default to "dev" when no environmentSuffix provided', () => {
      const testApp = new cdk.App();
      const defaultStack = new TapStack(testApp, 'DefaultTestStack');
      const defaultTemplate = Template.fromStack(defaultStack);
      
      // Verify that resources use the default 'dev' environmentSuffix
      defaultTemplate.hasResourceProperties('AWS::Kinesis::Stream', {
        Name: 'recommendation-dev-user-events',
      });
    });
  });

  describe('Kinesis Stream', () => {
    test('Should create Kinesis stream with correct configuration', () => {
      template.hasResourceProperties('AWS::Kinesis::Stream', {
        Name: `recommendation-${environmentSuffix}-user-events`,
        ShardCount: 4,
        RetentionPeriodHours: 24,
      });
    });

    test('Should have 4 shards for throughput', () => {
      template.hasResourceProperties('AWS::Kinesis::Stream', {
        ShardCount: 4,
      });
    });

    test('Kinesis stream should have proper retention', () => {
      template.hasResourceProperties('AWS::Kinesis::Stream', {
        RetentionPeriodHours: 24,
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('Should create DynamoDB table', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });

    test('Table should have userId as partition key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'userId',
            KeyType: 'HASH',
          },
        ],
      });
    });

    test('Table should use provisioned billing', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      });
    });

    test('Should have auto-scaling configured', () => {
      template.resourceCountIs('AWS::ApplicationAutoScaling::ScalableTarget', 2);
      template.resourceCountIs('AWS::ApplicationAutoScaling::ScalingPolicy', 2);
    });

    test('Read scaling should target 70% utilization', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        TargetTrackingScalingPolicyConfiguration: {
          TargetValue: 70,
        },
      });
    });
  });

  describe('S3 Bucket', () => {
    test('Should create S3 bucket for model artifacts', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('Bucket should have encryption enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
    });

    test('Bucket should have versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });
  });

  describe('Lambda Functions', () => {
    test('Should create stream processor Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `recommendation-${environmentSuffix}-stream-processor`,
        Runtime: 'python3.11',
        Handler: 'index.lambda_handler',
        ReservedConcurrentExecutions: 50,
      });
    });

    test('Should create batch processor Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `recommendation-${environmentSuffix}-batch-processor`,
        Runtime: 'python3.11',
        Handler: 'index.lambda_handler',
      });
    });

    test('Stream processor should have 60 second timeout', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `recommendation-${environmentSuffix}-stream-processor`,
        Timeout: 60,
      });
    });

    test('Batch processor should have 15 minute timeout', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `recommendation-${environmentSuffix}-batch-processor`,
        Timeout: 900,
      });
    });

    test('Lambda functions should have environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            TABLE_NAME: Match.anyValue(),
            ENDPOINT_NAME: Match.anyValue(),
          },
        },
      });
    });
  });

  describe('IAM Roles and Permissions', () => {
    test('Should create Lambda execution roles', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            }),
          ]),
        }),
      });
    });

    test('Lambda should have permissions for SageMaker', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sagemaker:InvokeEndpoint',
              Effect: 'Allow',
            }),
          ]),
        }),
      });
    });

    test('Lambda should have DynamoDB write permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                Match.stringLikeRegexp('dynamodb:.*'),
              ]),
            }),
          ]),
        }),
      });
    });

    test('Lambda should have Kinesis read permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                Match.stringLikeRegexp('kinesis:.*'),
              ]),
            }),
          ]),
        }),
      });
    });
  });

  describe('EventBridge Rule', () => {
    test('Should create EventBridge rule for batch processing', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `recommendation-${environmentSuffix}-batch-processing`,
        ScheduleExpression: 'cron(0 2 * * ? *)',
      });
    });

    test('EventBridge rule should target batch processor', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Targets: Match.arrayWith([
          Match.objectLike({
            Arn: Match.anyValue(),
          }),
        ]),
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('Should create Lambda latency alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `recommendation-${environmentSuffix}-lambda-latency`,
        Threshold: 30000,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('Should create Lambda error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `recommendation-${environmentSuffix}-lambda-errors`,
        Threshold: 5,
      });
    });

    test('Should create Kinesis iterator age alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `recommendation-${environmentSuffix}-kinesis-iterator-age`,
        Threshold: 60000,
      });
    });

    test('Should create DynamoDB throttle alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `recommendation-${environmentSuffix}-dynamo-read-throttle`,
        Threshold: 10,
      });
    });
  });

  describe('Event Source Mapping', () => {
    test('Should create Kinesis event source for Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        BatchSize: 100,
        MaximumRetryAttempts: 3,
        StartingPosition: 'LATEST',
      });
    });

    test('Event source mapping should connect Kinesis to Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        FunctionName: Match.anyValue(),
        EventSourceArn: Match.anyValue(),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Should output Kinesis stream name', () => {
      template.hasOutput('RecommendationEngineStreamName7538BE53', {
        Value: Match.anyValue(),
      });
    });

    test('Should output DynamoDB table name', () => {
      template.hasOutput('RecommendationEngineTableNameFCA08599', {
        Value: Match.anyValue(),
      });
    });

    test('Should output S3 bucket name', () => {
      template.hasOutput('RecommendationEngineBucketName661DC7B5', {
        Value: Match.anyValue(),
      });
    });

    test('Should output endpoint name', () => {
      template.hasOutput('RecommendationEngineEndpointNameB3BBCE89', {
        Value: Match.anyValue(),
      });
    });

    test('Should output Lambda function names', () => {
      template.hasOutput('RecommendationEngineStreamProcessorFunctionName18D3AFAA', {
        Value: Match.anyValue(),
      });
      template.hasOutput('RecommendationEngineBatchProcessorFunctionNameFC477A05', {
        Value: Match.anyValue(),
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('Should have correct number of CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 4);
    });

    test('Should have Lambda functions', () => {
      // 2 main functions + 2 custom resource handlers
      const lambdaCount = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdaCount).length).toBeGreaterThanOrEqual(2);
    });

    test('Should have IAM roles', () => {
      // Multiple roles: Lambda, SageMaker, Custom Resources
      const rolesCount = template.findResources('AWS::IAM::Role');
      expect(Object.keys(rolesCount).length).toBeGreaterThanOrEqual(3);
    });
  });
});
