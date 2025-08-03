import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { ServerlessStack } from '../lib/serverless-stack';

const environmentSuffix = 'dev'; // Use consistent environment suffix for tests

describe('ServerlessStack Unit Tests', () => {
  let app: cdk.App;
  let stack: ServerlessStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new ServerlessStack(app, 'TestServerlessStack', {
      environmentSuffix: environmentSuffix,
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
      // Find the order processor Lambda function
      const lambdaResources = template.findResources('AWS::Lambda::Function');
      const orderProcessorLambda = Object.values(lambdaResources).find(
        (resource: any) =>
          resource.Properties?.FunctionName ===
          `${environmentSuffix}-order-processor-lambda-backend`
      );
      expect(orderProcessorLambda).toBeDefined();
      expect(orderProcessorLambda?.Properties?.Runtime).toBe('nodejs20.x');
      expect(orderProcessorLambda?.Properties?.Handler).toBe('index.handler');
      expect(orderProcessorLambda?.Properties?.Timeout).toBe(300); // 5 minutes (300 seconds)
    });

    test('should create audit Lambda with correct configuration', () => {
      // Find the audit Lambda function
      const lambdaResources = template.findResources('AWS::Lambda::Function');
      const auditLambda = Object.values(lambdaResources).find(
        (resource: any) =>
          resource.Properties?.FunctionName ===
          `${environmentSuffix}-audit-lambda-backend`
      );
      expect(auditLambda).toBeDefined();
      expect(auditLambda?.Properties?.Runtime).toBe('nodejs20.x');
      expect(auditLambda?.Properties?.Handler).toBe('index.handler');
      expect(auditLambda?.Properties?.Timeout).toBe(120); // 2 minutes (120 seconds)
    });

    test('main processing Lambda should have correct code structure', () => {
      // Find the Lambda function with S3Client code
      const lambdaResources = template.findResources('AWS::Lambda::Function');
      const orderProcessorLambda = Object.values(lambdaResources).find(
        (resource: any) =>
          resource.Properties?.Code?.ZipFile?.includes('S3Client') &&
          resource.Properties?.Code?.ZipFile?.includes('PutObjectCommand')
      );
      expect(orderProcessorLambda).toBeDefined();
    });

    test('audit Lambda should have correct code structure', () => {
      // Find the Lambda function with DynamoDBClient code
      const lambdaResources = template.findResources('AWS::Lambda::Function');
      const auditLambda = Object.values(lambdaResources).find(
        (resource: any) =>
          resource.Properties?.Code?.ZipFile?.includes('DynamoDBClient') &&
          resource.Properties?.Code?.ZipFile?.includes('PutItemCommand')
      );
      expect(auditLambda).toBeDefined();
    });
  });

  describe('IAM Roles and Permissions', () => {
    test('should create main Lambda IAM role with correct permissions', () => {
      // Find the IAM role for the order processor Lambda
      const iamResources = template.findResources('AWS::IAM::Role');
      const orderProcessorRole = Object.values(iamResources).find(
        (resource: any) =>
          resource.Properties?.RoleName ===
          `${environmentSuffix}-order-processor-lambda-role-backend`
      );
      expect(orderProcessorRole).toBeDefined();
      expect(
        orderProcessorRole?.Properties?.AssumeRolePolicyDocument?.Statement
      ).toEqual([
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
        },
      ]);

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
      // Find the IAM role for the audit Lambda
      const iamResources = template.findResources('AWS::IAM::Role');
      const auditRole = Object.values(iamResources).find(
        (resource: any) =>
          resource.Properties?.RoleName ===
          `${environmentSuffix}-audit-lambda-role-backend`
      );
      expect(auditRole).toBeDefined();
      expect(
        auditRole?.Properties?.AssumeRolePolicyDocument?.Statement
      ).toEqual([
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
        },
      ]);

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
      // Find the Lambda error alarm
      const alarmResources = template.findResources('AWS::CloudWatch::Alarm');
      const errorAlarm = Object.values(alarmResources).find(
        (resource: any) =>
          resource.Properties?.AlarmDescription ===
            'Alarm for Lambda function errors' &&
          resource.Properties?.MetricName === 'Errors' &&
          resource.Properties?.Namespace === 'AWS/Lambda'
      );
      expect(errorAlarm).toBeDefined();
      expect(errorAlarm?.Properties?.Statistic).toBe('Sum');
      expect(errorAlarm?.Properties?.Period).toBe(300);
      expect(errorAlarm?.Properties?.EvaluationPeriods).toBe(1);
      expect(errorAlarm?.Properties?.Threshold).toBe(5);
      expect(errorAlarm?.Properties?.ComparisonOperator).toBe(
        'GreaterThanOrEqualToThreshold'
      );
    });

    test('should create Lambda duration alarm', () => {
      // Find the Lambda duration alarm
      const alarmResources = template.findResources('AWS::CloudWatch::Alarm');
      const durationAlarm = Object.values(alarmResources).find(
        (resource: any) =>
          resource.Properties?.AlarmDescription ===
            'Alarm for Lambda function duration approaching timeout' &&
          resource.Properties?.MetricName === 'Duration' &&
          resource.Properties?.Namespace === 'AWS/Lambda'
      );
      expect(durationAlarm).toBeDefined();
      expect(durationAlarm?.Properties?.ExtendedStatistic).toBe('p95');
      expect(durationAlarm?.Properties?.Period).toBe(300);
      expect(durationAlarm?.Properties?.EvaluationPeriods).toBe(2);
      expect(durationAlarm?.Properties?.Threshold).toBe(240000);
      expect(durationAlarm?.Properties?.ComparisonOperator).toBe(
        'GreaterThanThreshold'
      );
    });

    test('should create Lambda memory alarm', () => {
      // Find the Lambda memory alarm
      const alarmResources = template.findResources('AWS::CloudWatch::Alarm');
      const memoryAlarm = Object.values(alarmResources).find(
        (resource: any) =>
          resource.Properties?.AlarmDescription ===
            'Alarm for Lambda function memory usage' &&
          resource.Properties?.MetricName === 'UsedMemory' &&
          resource.Properties?.Namespace === 'AWS/Lambda'
      );
      expect(memoryAlarm).toBeDefined();
      expect(memoryAlarm?.Properties?.ExtendedStatistic).toBe('p95');
      expect(memoryAlarm?.Properties?.Period).toBe(300);
      expect(memoryAlarm?.Properties?.EvaluationPeriods).toBe(2);
      expect(memoryAlarm?.Properties?.Threshold).toBe(200);
      expect(memoryAlarm?.Properties?.ComparisonOperator).toBe(
        'GreaterThanThreshold'
      );
    });

    test('should create DLQ message alarm', () => {
      // Find the DLQ message alarm
      const alarmResources = template.findResources('AWS::CloudWatch::Alarm');
      const dlqAlarm = Object.values(alarmResources).find(
        (resource: any) =>
          resource.Properties?.AlarmDescription ===
            'Alarm for messages in Dead Letter Queue' &&
          resource.Properties?.MetricName ===
            'ApproximateNumberOfVisibleMessages' &&
          resource.Properties?.Namespace === 'AWS/SQS'
      );
      expect(dlqAlarm).toBeDefined();
      expect(dlqAlarm?.Properties?.Statistic).toBe('Sum');
      expect(dlqAlarm?.Properties?.Period).toBe(300);
      expect(dlqAlarm?.Properties?.EvaluationPeriods).toBe(1);
      expect(dlqAlarm?.Properties?.Threshold).toBe(10);
      expect(dlqAlarm?.Properties?.ComparisonOperator).toBe(
        'GreaterThanThreshold'
      );
    });

    test('should create SQS message age alarm', () => {
      // Find the SQS message age alarm
      const alarmResources = template.findResources('AWS::CloudWatch::Alarm');
      const sqsAgeAlarm = Object.values(alarmResources).find(
        (resource: any) =>
          resource.Properties?.AlarmDescription ===
            'Alarm for old messages in SQS queue' &&
          resource.Properties?.MetricName === 'ApproximateAgeOfOldestMessage' &&
          resource.Properties?.Namespace === 'AWS/SQS'
      );
      expect(sqsAgeAlarm).toBeDefined();
      expect(sqsAgeAlarm?.Properties?.Statistic).toBe('Maximum');
      expect(sqsAgeAlarm?.Properties?.Period).toBe(300);
      expect(sqsAgeAlarm?.Properties?.EvaluationPeriods).toBe(2);
      expect(sqsAgeAlarm?.Properties?.Threshold).toBe(300);
      expect(sqsAgeAlarm?.Properties?.ComparisonOperator).toBe(
        'GreaterThanThreshold'
      );
    });

    test('should create DynamoDB stream iterator age alarm', () => {
      // Find the DynamoDB stream iterator age alarm
      const alarmResources = template.findResources('AWS::CloudWatch::Alarm');
      const streamAlarm = Object.values(alarmResources).find(
        (resource: any) =>
          resource.Properties?.AlarmDescription ===
            'Alarm for DynamoDB stream iterator age' &&
          resource.Properties?.MetricName ===
            'GetRecords.IteratorAgeMilliseconds' &&
          resource.Properties?.Namespace === 'AWS/DynamoDBStreams'
      );
      expect(streamAlarm).toBeDefined();
      expect(streamAlarm?.Properties?.ExtendedStatistic).toBe('p95');
      expect(streamAlarm?.Properties?.Period).toBe(300);
      expect(streamAlarm?.Properties?.EvaluationPeriods).toBe(2);
      expect(streamAlarm?.Properties?.Threshold).toBe(60000);
      expect(streamAlarm?.Properties?.ComparisonOperator).toBe(
        'GreaterThanThreshold'
      );
    });

    test('should create Lambda throttle alarm', () => {
      // Find the Lambda throttle alarm
      const alarmResources = template.findResources('AWS::CloudWatch::Alarm');
      const throttleAlarm = Object.values(alarmResources).find(
        (resource: any) =>
          resource.Properties?.AlarmDescription ===
            'Alarm for Lambda function throttles' &&
          resource.Properties?.MetricName === 'Throttles' &&
          resource.Properties?.Namespace === 'AWS/Lambda'
      );
      expect(throttleAlarm).toBeDefined();
      expect(throttleAlarm?.Properties?.Statistic).toBe('Sum');
      expect(throttleAlarm?.Properties?.Period).toBe(300);
      expect(throttleAlarm?.Properties?.EvaluationPeriods).toBe(1);
      expect(throttleAlarm?.Properties?.Threshold).toBe(1);
      expect(throttleAlarm?.Properties?.ComparisonOperator).toBe(
        'GreaterThanThreshold'
      );
    });

    test('should create S3 error alarm', () => {
      // Find the S3 error alarm
      const alarmResources = template.findResources('AWS::CloudWatch::Alarm');
      const s3Alarm = Object.values(alarmResources).find(
        (resource: any) =>
          resource.Properties?.AlarmDescription ===
            'Alarm for S3 operation errors' &&
          resource.Properties?.MetricName === '5xxError' &&
          resource.Properties?.Namespace === 'AWS/S3'
      );
      expect(s3Alarm).toBeDefined();
      expect(s3Alarm?.Properties?.Statistic).toBe('Sum');
      expect(s3Alarm?.Properties?.Period).toBe(300);
      expect(s3Alarm?.Properties?.EvaluationPeriods).toBe(1);
      expect(s3Alarm?.Properties?.Threshold).toBe(1);
      expect(s3Alarm?.Properties?.ComparisonOperator).toBe(
        'GreaterThanThreshold'
      );
    });

    test('should create DynamoDB read throttle alarm', () => {
      // Find the DynamoDB read throttle alarm
      const alarmResources = template.findResources('AWS::CloudWatch::Alarm');
      const dynamoReadAlarm = Object.values(alarmResources).find(
        (resource: any) =>
          resource.Properties?.AlarmDescription ===
            'Alarm for DynamoDB read capacity throttling' &&
          resource.Properties?.MetricName === 'ReadThrottleEvents' &&
          resource.Properties?.Namespace === 'AWS/DynamoDB'
      );
      expect(dynamoReadAlarm).toBeDefined();
      expect(dynamoReadAlarm?.Properties?.Statistic).toBe('Sum');
      expect(dynamoReadAlarm?.Properties?.Period).toBe(300);
      expect(dynamoReadAlarm?.Properties?.EvaluationPeriods).toBe(1);
      expect(dynamoReadAlarm?.Properties?.Threshold).toBe(1);
      expect(dynamoReadAlarm?.Properties?.ComparisonOperator).toBe(
        'GreaterThanThreshold'
      );
    });

    test('should create DynamoDB write throttle alarm', () => {
      // Find the DynamoDB write throttle alarm
      const alarmResources = template.findResources('AWS::CloudWatch::Alarm');
      const dynamoWriteAlarm = Object.values(alarmResources).find(
        (resource: any) =>
          resource.Properties?.AlarmDescription ===
            'Alarm for DynamoDB write capacity throttling' &&
          resource.Properties?.MetricName === 'WriteThrottleEvents' &&
          resource.Properties?.Namespace === 'AWS/DynamoDB'
      );
      expect(dynamoWriteAlarm).toBeDefined();
      expect(dynamoWriteAlarm?.Properties?.Statistic).toBe('Sum');
      expect(dynamoWriteAlarm?.Properties?.Period).toBe(300);
      expect(dynamoWriteAlarm?.Properties?.EvaluationPeriods).toBe(1);
      expect(dynamoWriteAlarm?.Properties?.Threshold).toBe(1);
      expect(dynamoWriteAlarm?.Properties?.ComparisonOperator).toBe(
        'GreaterThanThreshold'
      );
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
