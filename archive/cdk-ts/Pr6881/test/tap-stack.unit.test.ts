import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

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
    test('should create stack with provided environment suffix', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {
        environmentSuffix: 'test',
      });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'TradingPatterns-test',
      });
    });

    test('should create stack with default environment suffix when not provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {});
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'TradingPatterns-dev',
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create PatternDetector Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `PatternDetector-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: 512,
        Timeout: 30,
        // ReservedConcurrentExecutions removed due to AWS account limits
        TracingConfig: {
          Mode: 'Active',
        },
        Architectures: ['arm64'],
      });
    });

    test('should create AlertProcessor Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `AlertProcessor-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: 256,
        Timeout: 60,
        TracingConfig: {
          Mode: 'Active',
        },
        Architectures: ['arm64'],
      });
    });

    test('should create ThresholdChecker Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `ThresholdChecker-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: 256,
        Timeout: 30,
        TracingConfig: {
          Mode: 'Active',
        },
        Architectures: ['arm64'],
      });
    });

    test('should have log retention set to 7 days', () => {
      template.hasResourceProperties('Custom::LogRetention', {
        RetentionInDays: 7,
      });
    });

    test('should configure Lambda Layer', () => {
      template.hasResourceProperties('AWS::Lambda::LayerVersion', {
        CompatibleRuntimes: ['nodejs18.x'],
        Description: 'Shared dependencies for stock pattern detection',
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('should create TradingPatterns table', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `TradingPatterns-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        KeySchema: [
          {
            AttributeName: 'patternId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
      });
    });
  });

  describe('SQS Queues', () => {
    test('should create AlertQueue with correct configuration', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `AlertQueue-${environmentSuffix}`,
        MessageRetentionPeriod: 345600, // 4 days in seconds
        VisibilityTimeout: 300,
        RedrivePolicy: {
          maxReceiveCount: 3,
        },
      });
    });

    test('should create Dead Letter Queue', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `alert-dlq-${environmentSuffix}`,
        MessageRetentionPeriod: 345600, // 4 days in seconds
      });
    });

    test('should configure SQS event source with batch size 10', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        BatchSize: 10,
      });
    });
  });

  describe('SNS Topic', () => {
    test('should create Trading Alerts topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `TradingAlerts-${environmentSuffix}`,
        DisplayName: 'Trading Pattern Alerts',
      });
    });
  });

  describe('API Gateway', () => {
    test('should create REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `stock-patterns-api-${environmentSuffix}`,
        Description: 'API for stock pattern detection system',
      });
    });

    test('should configure throttling limits', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            ThrottlingRateLimit: 1000,
            ThrottlingBurstLimit: 2000,
          }),
        ]),
      });
    });

    test('should create request validator', () => {
      template.hasResourceProperties('AWS::ApiGateway::RequestValidator', {
        ValidateRequestBody: true,
        ValidateRequestParameters: true,
      });
    });

    test('should create patterns resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'patterns',
      });
    });

    test('should create alerts resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'alerts',
      });
    });

    test('should configure CORS', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
      });
    });
  });

  describe('EventBridge Rule', () => {
    test('should create threshold check rule with 5-minute schedule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `threshold-check-${environmentSuffix}`,
        Description: 'Triggers threshold checker every 5 minutes',
        ScheduleExpression: 'rate(5 minutes)',
        State: 'ENABLED',
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create alarm for PatternDetector errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `PatternDetector-errors-${environmentSuffix}`,
        Threshold: 1,
        EvaluationPeriods: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        TreatMissingData: 'notBreaching',
      });
    });

    test('should create alarm for AlertProcessor errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `AlertProcessor-errors-${environmentSuffix}`,
        Threshold: 1,
        EvaluationPeriods: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        TreatMissingData: 'notBreaching',
      });
    });

    test('should create alarm for ThresholdChecker errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `ThresholdChecker-errors-${environmentSuffix}`,
        Threshold: 1,
        EvaluationPeriods: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        TreatMissingData: 'notBreaching',
      });
    });

    test('should configure alarm actions to SNS topic', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const alarmKeys = Object.keys(alarms);
      expect(alarmKeys.length).toBeGreaterThanOrEqual(3);

      alarmKeys.forEach((key) => {
        expect(alarms[key].Properties.AlarmActions).toBeDefined();
        expect(alarms[key].Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('IAM Permissions', () => {
    test('should grant PatternDetector permissions to DynamoDB table', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'dynamodb:BatchGetItem',
                'dynamodb:GetRecords',
                'dynamodb:GetShardIterator',
                'dynamodb:Query',
                'dynamodb:GetItem',
                'dynamodb:Scan',
                'dynamodb:ConditionCheckItem',
                'dynamodb:BatchWriteItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:DescribeTable',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should grant PatternDetector permissions to SQS', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'sqs:SendMessage',
                'sqs:GetQueueAttributes',
                'sqs:GetQueueUrl',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should grant AlertProcessor permissions to SNS', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sns:Publish',
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should grant ThresholdChecker permissions to read from DynamoDB', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'dynamodb:BatchGetItem',
                'dynamodb:GetRecords',
                'dynamodb:GetShardIterator',
                'dynamodb:Query',
                'dynamodb:GetItem',
                'dynamodb:Scan',
                'dynamodb:ConditionCheckItem',
                'dynamodb:DescribeTable',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should export API Gateway URL', () => {
      template.hasOutput('ApiGatewayUrl', {
        Description: 'API Gateway URL for stock patterns API',
        Export: {
          Name: `ApiGatewayUrl-${environmentSuffix}`,
        },
      });
    });

    test('should export Alert Queue URL', () => {
      template.hasOutput('AlertQueueUrl', {
        Description: 'SQS Alert Queue URL',
        Export: {
          Name: `AlertQueueUrl-${environmentSuffix}`,
        },
      });
    });

    test('should export DLQ URL', () => {
      template.hasOutput('DLQUrl', {
        Description: 'Dead Letter Queue URL',
        Export: {
          Name: `DLQUrl-${environmentSuffix}`,
        },
      });
    });

    test('should export DynamoDB table name', () => {
      template.hasOutput('PatternsTableName', {
        Description: 'DynamoDB Trading Patterns table name',
        Export: {
          Name: `PatternsTableName-${environmentSuffix}`,
        },
      });
    });

    test('should export SNS topic ARN', () => {
      template.hasOutput('AlertTopicArn', {
        Description: 'SNS Trading Alerts topic ARN',
        Export: {
          Name: `AlertTopicArn-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Resource Count', () => {
    test('should create expected number of Lambda functions', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      const functionKeys = Object.keys(functions).filter(
        (key) => !key.includes('LogRetention')
      );
      expect(functionKeys.length).toBe(3);
    });

    test('should create expected number of CloudWatch alarms', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      expect(Object.keys(alarms).length).toBe(3);
    });

    test('should create expected number of SQS queues', () => {
      const queues = template.findResources('AWS::SQS::Queue');
      expect(Object.keys(queues).length).toBe(2);
    });
  });

  describe('Removal Policies', () => {
    test('should set removal policy for DynamoDB table', () => {
      template.hasResource('AWS::DynamoDB::Table', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('should set removal policy for SQS queues', () => {
      template.hasResource('AWS::SQS::Queue', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('should set removal policy for Lambda Layer', () => {
      template.hasResource('AWS::Lambda::LayerVersion', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('Environment Variables', () => {
    test('should configure PatternDetector environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `PatternDetector-${environmentSuffix}`,
        Environment: {
          Variables: {
            TABLE_NAME: Match.anyValue(),
            QUEUE_URL: Match.anyValue(),
          },
        },
      });
    });

    test('should configure AlertProcessor environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `AlertProcessor-${environmentSuffix}`,
        Environment: {
          Variables: {
            TOPIC_ARN: Match.anyValue(),
          },
        },
      });
    });

    test('should configure ThresholdChecker environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `ThresholdChecker-${environmentSuffix}`,
        Environment: {
          Variables: {
            TABLE_NAME: Match.anyValue(),
            QUEUE_URL: Match.anyValue(),
            THRESHOLD_PERCENTAGE: '5',
            THRESHOLD_VOLUME: '10000',
            THRESHOLD_PRICE: '100',
          },
        },
      });
    });
  });
});
