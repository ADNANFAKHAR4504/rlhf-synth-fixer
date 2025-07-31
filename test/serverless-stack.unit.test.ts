import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { ServerlessStack } from '../lib/serverless-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('ServerlessStack Unit Tests', () => {
  let app: cdk.App;
  let stack: ServerlessStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new ServerlessStack(app, 'TestServerlessStack', {
      environmentSuffix: 'dev',
    });
    template = Template.fromStack(stack);
  });

  describe('DynamoDB Tables', () => {
    test('should create orders table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `${environmentSuffix}-orders-table-backend`,
        AttributeDefinitions: [
          {
            AttributeName: 'orderId',
            AttributeType: 'S',
          },
        ],
        KeySchema: [
          {
            AttributeName: 'orderId',
            KeyType: 'HASH',
          },
        ],
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('should create audit logs table with correct schema', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `${environmentSuffix}-audit-logs-table-backend`,
        AttributeDefinitions: Match.arrayWith([
          {
            AttributeName: 'auditId',
            AttributeType: 'S',
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'S',
          },
          {
            AttributeName: 'failureType',
            AttributeType: 'S',
          },
        ]),
        KeySchema: [
          {
            AttributeName: 'auditId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'failure-type-index',
            KeySchema: [
              {
                AttributeName: 'failureType',
                KeyType: 'HASH',
              },
              {
                AttributeName: 'timestamp',
                KeyType: 'RANGE',
              },
            ],
            Projection: {
              ProjectionType: 'ALL',
            },
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should create private S3 bucket with correct security settings', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should create S3 bucket with correct naming pattern', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': Match.anyValue(),
        },
      });
    });
  });

  describe('SQS Queue', () => {
    test('should create DLQ with correct configuration', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `${environmentSuffix}-processing-dlq-backend`,
        MessageRetentionPeriod: 1209600, // 14 days in seconds
        VisibilityTimeout: 720, // 12 minutes
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create main processing Lambda with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `${environmentSuffix}-order-processor-lambda-backend`,
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        Timeout: 300, // 5 minutes
      });
    });

    test('should create audit Lambda with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `${environmentSuffix}-audit-lambda-backend`,
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        Timeout: 120, // 2 minutes
      });
    });

    test('main processing Lambda should have correct code structure', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `${environmentSuffix}-order-processor-lambda-backend`,
        Code: {
          ZipFile: Match.stringLikeRegexp('.*S3Client.*PutObjectCommand.*'),
        },
      });
    });

    test('audit Lambda should have correct code structure', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `${environmentSuffix}-audit-lambda-backend`,
        Code: {
          ZipFile: Match.stringLikeRegexp('.*DynamoDBClient.*PutItemCommand.*'),
        },
      });
    });
  });

  describe('IAM Roles and Permissions', () => {
    test('should create main Lambda IAM role with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `${environmentSuffix}-order-processor-lambda-role-backend`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        },
      });

      // Check for DynamoDB stream permissions
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:DescribeStream',
                'dynamodb:GetRecords',
                'dynamodb:GetShardIterator',
                'dynamodb:ListStreams',
              ],
              Resource: Match.anyValue(),
            },
          ]),
        },
      });

      // Check for S3 permissions
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: ['s3:PutObject', 's3:PutObjectAcl'],
              Resource: Match.anyValue(),
            },
          ]),
        },
      });
    });

    test('should create audit Lambda IAM role with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `${environmentSuffix}-audit-lambda-role-backend`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        },
      });

      // Check for DynamoDB audit table permissions
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:GetItem',
              ],
              Resource: Match.anyValue(),
            },
          ]),
        },
      });

      // Check for SQS DLQ permissions
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: [
                'sqs:ReceiveMessage',
                'sqs:DeleteMessage',
                'sqs:GetQueueAttributes',
              ],
              Resource: Match.anyValue(),
            },
          ]),
        },
      });
    });
  });

  describe('Event Source Mappings', () => {
    test('should create DynamoDB stream event source mapping', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        EventSourceArn: Match.anyValue(),
        FunctionName: Match.anyValue(),
        StartingPosition: 'TRIM_HORIZON',
        BatchSize: 10,
        MaximumRetryAttempts: 3,
      });
    });

    test('should create SQS event source mapping for audit Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        EventSourceArn: Match.anyValue(),
        FunctionName: Match.anyValue(),
        BatchSize: 10,
        MaximumBatchingWindowInSeconds: 5,
      });
    });
  });

  describe('CloudWatch Monitoring Suite', () => {
    test('should create Lambda error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `${environmentSuffix}-lambda-error-alarm-backend`,
        AlarmDescription: 'Alarm for Lambda function errors',
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Statistic: 'Sum',
        Period: 300,
        EvaluationPeriods: 1,
        Threshold: 5,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('should create Lambda duration alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `${environmentSuffix}-lambda-duration-alarm-backend`,
        AlarmDescription:
          'Alarm for Lambda function duration approaching timeout',
        MetricName: 'Duration',
        Namespace: 'AWS/Lambda',
        ExtendedStatistic: 'p95',
        Period: 300,
        EvaluationPeriods: 2,
        Threshold: 240000,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('should create Lambda memory alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `${environmentSuffix}-lambda-memory-alarm-backend`,
        AlarmDescription: 'Alarm for Lambda function memory usage',
        MetricName: 'UsedMemory',
        Namespace: 'AWS/Lambda',
        ExtendedStatistic: 'p95',
        Period: 300,
        EvaluationPeriods: 2,
        Threshold: 200,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('should create DLQ message alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `${environmentSuffix}-dlq-message-alarm-backend`,
        AlarmDescription: 'Alarm for messages in Dead Letter Queue',
        MetricName: 'ApproximateNumberOfVisibleMessages',
        Namespace: 'AWS/SQS',
        Statistic: 'Sum',
        Period: 300,
        EvaluationPeriods: 1,
        Threshold: 10,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('should create SQS message age alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `${environmentSuffix}-sqs-age-alarm-backend`,
        AlarmDescription: 'Alarm for old messages in SQS queue',
        MetricName: 'ApproximateAgeOfOldestMessage',
        Namespace: 'AWS/SQS',
        Statistic: 'Maximum',
        Period: 300,
        EvaluationPeriods: 2,
        Threshold: 300,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('should create DynamoDB stream iterator age alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `${environmentSuffix}-stream-iterator-age-alarm-backend`,
        AlarmDescription: 'Alarm for DynamoDB stream iterator age',
        MetricName: 'GetRecords.IteratorAgeMilliseconds',
        Namespace: 'AWS/DynamoDBStreams',
        ExtendedStatistic: 'p95',
        Period: 300,
        EvaluationPeriods: 2,
        Threshold: 60000,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('should create Lambda throttle alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `${environmentSuffix}-lambda-throttle-alarm-backend`,
        AlarmDescription: 'Alarm for Lambda function throttles',
        MetricName: 'Throttles',
        Namespace: 'AWS/Lambda',
        Statistic: 'Sum',
        Period: 300,
        EvaluationPeriods: 1,
        Threshold: 1,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('should create S3 error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `${environmentSuffix}-s3-error-alarm-backend`,
        AlarmDescription: 'Alarm for S3 operation errors',
        MetricName: '5xxError',
        Namespace: 'AWS/S3',
        Statistic: 'Sum',
        Period: 300,
        EvaluationPeriods: 1,
        Threshold: 1,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('should create DynamoDB read throttle alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `${environmentSuffix}-dynamo-read-alarm-backend`,
        AlarmDescription: 'Alarm for DynamoDB read capacity throttling',
        MetricName: 'ReadThrottleEvents',
        Namespace: 'AWS/DynamoDB',
        Statistic: 'Sum',
        Period: 300,
        EvaluationPeriods: 1,
        Threshold: 1,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('should create DynamoDB write throttle alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `${environmentSuffix}-dynamo-write-alarm-backend`,
        AlarmDescription: 'Alarm for DynamoDB write capacity throttling',
        MetricName: 'WriteThrottleEvents',
        Namespace: 'AWS/DynamoDB',
        Statistic: 'Sum',
        Period: 300,
        EvaluationPeriods: 1,
        Threshold: 1,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should export all required outputs', () => {
      template.hasOutput('DynamoDBTableName', {
        Description: 'DynamoDB Table Name for orders',
        Export: {
          Name: `DynamoDBTableName-${environmentSuffix}`,
        },
      });

      template.hasOutput('LambdaFunctionName', {
        Description: 'Lambda function name for order processing',
        Export: {
          Name: `LambdaFunctionName-${environmentSuffix}`,
        },
      });

      template.hasOutput('S3BucketName', {
        Description: 'S3 bucket name for processed data',
        Export: {
          Name: `S3BucketName-${environmentSuffix}`,
        },
      });

      template.hasOutput('DLQUrl', {
        Description: 'Dead Letter Queue URL',
        Export: {
          Name: `DLQUrl-${environmentSuffix}`,
        },
      });

      template.hasOutput('CloudWatchAlarmName', {
        Description: 'CloudWatch Alarm name for Lambda errors',
        Export: {
          Name: `CloudWatchAlarmName-${environmentSuffix}`,
        },
      });

      template.hasOutput('AuditTableName', {
        Description: 'DynamoDB table name for audit logs',
        Export: {
          Name: `AuditTableName-${environmentSuffix}`,
        },
      });

      template.hasOutput('AuditLambdaName', {
        Description: 'Lambda function name for audit processing',
        Export: {
          Name: `AuditLambdaName-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should create expected number of resources', () => {
      const resourceCounts = template.toJSON().Resources;
      const resourceTypes: Record<string, number> = Object.values(
        resourceCounts
      ).reduce((acc: Record<string, number>, resource: any) => {
        acc[resource.Type] = (acc[resource.Type] || 0) + 1;
        return acc;
      }, {});

      // Expected resource counts
      expect(resourceTypes['AWS::DynamoDB::Table']).toBe(2); // orders + audit tables
      expect(resourceTypes['AWS::S3::Bucket']).toBe(1);
      expect(resourceTypes['AWS::SQS::Queue']).toBe(1);
      expect(resourceTypes['AWS::Lambda::Function']).toBeGreaterThanOrEqual(2); // main + audit lambdas (may include custom resource functions)
      expect(resourceTypes['AWS::IAM::Role']).toBeGreaterThanOrEqual(2); // main + audit lambda roles (may include custom resource roles)
      expect(resourceTypes['AWS::Lambda::EventSourceMapping']).toBe(2); // DynamoDB + SQS mappings
      expect(resourceTypes['AWS::CloudWatch::Alarm']).toBe(10); // Enhanced monitoring suite
    });
  });

  describe('Tagging', () => {
    test('should apply consistent tags to all resources', () => {
      // Check that stack-level tags are applied
      expect(stack.tags.tagValues()).toEqual(
        expect.objectContaining({
          Environment: environmentSuffix,
          ManagedBy: 'CDK',
          Project: 'ServerlessDataProcessing',
        })
      );
    });
  });
});
