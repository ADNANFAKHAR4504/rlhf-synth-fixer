import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    app.node.setContext('environmentSuffix', environmentSuffix);
    stack = new TapStack(app, 'TestTapStack', {
      env: { region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  describe('Environment Suffix Handling', () => {
    test('uses environment variable when set', () => {
      const originalEnv = process.env.ENVIRONMENT_SUFFIX;
      process.env.ENVIRONMENT_SUFFIX = 'envtest';
      
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'EnvTestStack', {
        env: { region: 'us-east-1' },
      });
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('.*-envtest$'),
      });
      
      process.env.ENVIRONMENT_SUFFIX = originalEnv;
    });

    test('uses context when environment variable not set', () => {
      const originalEnv = process.env.ENVIRONMENT_SUFFIX;
      delete process.env.ENVIRONMENT_SUFFIX;
      
      const testApp = new cdk.App();
      testApp.node.setContext('environmentSuffix', 'ctxtest');
      const testStack = new TapStack(testApp, 'CtxTestStack', {
        env: { region: 'us-east-1' },
      });
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('.*-ctxtest$'),
      });
      
      process.env.ENVIRONMENT_SUFFIX = originalEnv;
    });

    test('uses default when neither env nor context set', () => {
      const originalEnv = process.env.ENVIRONMENT_SUFFIX;
      delete process.env.ENVIRONMENT_SUFFIX;
      
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'DefaultTestStack', {
        env: { region: 'us-east-1' },
      });
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('.*-dev$'),
      });
      
      process.env.ENVIRONMENT_SUFFIX = originalEnv;
    });
  });

  describe('KMS Encryption', () => {
    test('creates KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for healthcare application encryption',
        EnableKeyRotation: true,
      });
    });

    test('KMS key has destroy removal policy', () => {
      template.hasResource('AWS::KMS::Key', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('DynamoDB Tables', () => {
    test('creates patients table with correct schema', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('patients-.*'),
        AttributeDefinitions: Match.arrayWith([
          { AttributeName: 'patientId', AttributeType: 'S' },
          { AttributeName: 'recordDate', AttributeType: 'S' },
        ]),
        KeySchema: Match.arrayWith([
          { AttributeName: 'patientId', KeyType: 'HASH' },
          { AttributeName: 'recordDate', KeyType: 'RANGE' },
        ]),
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
        DeletionProtectionEnabled: false,
      });
    });

    test('creates analytics table with correct schema', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('analytics-.*'),
        AttributeDefinitions: Match.arrayWith([
          { AttributeName: 'analyticsId', AttributeType: 'S' },
          { AttributeName: 'timestamp', AttributeType: 'S' },
        ]),
        KeySchema: Match.arrayWith([
          { AttributeName: 'analyticsId', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' },
        ]),
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('tables have KMS encryption enabled', () => {
      template.allResourcesProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
          SSEType: 'KMS',
          KMSMasterKeyId: Match.anyValue(),
        },
      });
    });

    test('tables have destroy removal policy', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      Object.values(tables).forEach((table) => {
        expect(table.DeletionPolicy).toBe('Delete');
        expect(table.UpdateReplacePolicy).toBe('Delete');
      });
    });
  });

  describe('SNS Topics', () => {
    test('creates notifications topic with KMS encryption', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.stringLikeRegexp('healthcare-notifications-.*'),
        DisplayName: 'Healthcare Application Notifications',
        KmsMasterKeyId: Match.anyValue(),
      });
    });

    test('creates alerts topic with KMS encryption', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.stringLikeRegexp('healthcare-alerts-.*'),
        DisplayName: 'Healthcare Critical Alerts',
        KmsMasterKeyId: Match.anyValue(),
      });
    });
  });

  describe('SQS Queues', () => {
    test('creates processing queue with DLQ', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: Match.stringLikeRegexp('patient-processing-.*'),
        VisibilityTimeout: 900,
        MessageRetentionPeriod: 1209600,
        RedrivePolicy: {
          deadLetterTargetArn: Match.anyValue(),
          maxReceiveCount: 3,
        },
      });
    });

    test('creates analytics queue with DLQ', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: Match.stringLikeRegexp('analytics-processing-.*'),
        VisibilityTimeout: 600,
        MessageRetentionPeriod: 604800,
        RedrivePolicy: {
          deadLetterTargetArn: Match.anyValue(),
          maxReceiveCount: 3,
        },
      });
    });

    test('creates DLQs with proper configuration', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: Match.stringLikeRegexp('patient-processing-dlq-.*'),
        KmsMasterKeyId: Match.anyValue(),
      });

      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: Match.stringLikeRegexp('analytics-processing-dlq-.*'),
        KmsMasterKeyId: Match.anyValue(),
      });
    });

    test('queues have KMS encryption', () => {
      const queues = template.findResources('AWS::SQS::Queue');
      Object.values(queues).forEach((queue) => {
        expect(queue.Properties).toHaveProperty('KmsMasterKeyId');
      });
    });
  });

  describe('Lambda Functions', () => {
    test('creates patient processor function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('patient-processor-.*'),
        Runtime: 'nodejs20.x',
        Handler: 'patient-processor.handler',
        MemorySize: 512,
        Timeout: 300,
        Architectures: ['x86_64'], // LocalStack compatible architecture
        Environment: {
          Variables: Match.objectLike({
            PATIENTS_TABLE: Match.anyValue(),
            NOTIFICATIONS_TOPIC: Match.anyValue(),
            ALERTS_TOPIC: Match.anyValue(),
            ANALYTICS_QUEUE: Match.anyValue(),
          }),
        },
      });
    });

    test('creates notification processor function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('notification-processor-.*'),
        Runtime: 'nodejs20.x',
        Handler: 'notification-processor.handler',
        MemorySize: 256,
        Timeout: 180,
        Architectures: ['x86_64'], // LocalStack compatible architecture
      });
    });

    test('creates analytics processor function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('analytics-processor-.*'),
        Runtime: 'nodejs20.x',
        Handler: 'analytics-processor.handler',
        MemorySize: 1024,
        Timeout: 600,
        Architectures: ['x86_64'], // LocalStack compatible architecture
      });
    });

    test('creates streaming API function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('streaming-api-.*'),
        Runtime: 'nodejs20.x',
        Handler: 'streaming-api.handler',
        MemorySize: 512,
        Timeout: 300,
        Architectures: ['x86_64'], // LocalStack compatible architecture
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('patient processor role has correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
            },
          ],
        },
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'PatientDataAccess',
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Action: Match.arrayWith([
                    'dynamodb:GetItem',
                    'dynamodb:PutItem',
                    'dynamodb:UpdateItem',
                    'dynamodb:Query',
                  ]),
                  Effect: 'Allow',
                }),
                Match.objectLike({
                  Action: 'sns:Publish',
                  Effect: 'Allow',
                }),
                Match.objectLike({
                  Action: 'sqs:SendMessage',
                  Effect: 'Allow',
                }),
                Match.objectLike({
                  Action: Match.arrayWith(['kms:Decrypt', 'kms:GenerateDataKey']),
                  Effect: 'Allow',
                }),
              ]),
            },
          }),
        ]),
      });
    });

    test('notification processor role has correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'NotificationAccess',
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Action: 'sns:Publish',
                  Effect: 'Allow',
                }),
                Match.objectLike({
                  Action: Match.arrayWith([
                    'sqs:ReceiveMessage',
                    'sqs:DeleteMessage',
                    'sqs:GetQueueAttributes',
                  ]),
                  Effect: 'Allow',
                }),
              ]),
            },
          }),
        ]),
      });
    });

    test('analytics processor role has correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'AnalyticsAccess',
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Action: Match.arrayWith([
                    'dynamodb:GetItem',
                    'dynamodb:PutItem',
                    'dynamodb:Query',
                    'dynamodb:Scan',
                  ]),
                  Effect: 'Allow',
                }),
              ]),
            },
          }),
        ]),
      });
    });
  });

  describe('Event Sources', () => {
    test('notification processor has SQS event source', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        BatchSize: 10,
        MaximumBatchingWindowInSeconds: 30,
        EventSourceArn: Match.anyValue(),
        FunctionName: Match.anyValue(),
      });
    });

    test('analytics processor has SQS event source', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        BatchSize: 5,
        MaximumBatchingWindowInSeconds: 60,
        EventSourceArn: Match.anyValue(),
        FunctionName: Match.anyValue(),
      });
    });
  });

  describe('EventBridge Rules', () => {
    test('creates daily analytics rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Description: 'Run daily analytics processing for healthcare data',
        ScheduleExpression: 'rate(1 day)',
      });
    });

    test('creates hourly health check rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Description: 'Hourly health check for patient processing system',
        ScheduleExpression: 'rate(1 hour)',
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('creates healthcare dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('healthcare-dashboard-.*'),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('has all required outputs', () => {
      const outputs = template.findOutputs('*');
      expect(outputs).toHaveProperty('PatientsTableName');
      expect(outputs).toHaveProperty('AnalyticsTableName');
      expect(outputs).toHaveProperty('NotificationsTopicArn');
      expect(outputs).toHaveProperty('AlertsTopicArn');
      expect(outputs).toHaveProperty('PatientProcessorFunctionArn');
      expect(outputs).toHaveProperty('StreamingApiFunctionArn');
    });
  });

  describe('Resource Naming', () => {
    test('all resource names include environment suffix', () => {
      // Set environment variable for this test
      const originalEnv = process.env.ENVIRONMENT_SUFFIX;
      const testSuffix = 'test';
      process.env.ENVIRONMENT_SUFFIX = testSuffix;
      
      // Create a new stack with the environment variable set
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestNamingStack', {
        env: { region: 'us-east-1' },
      });
      const testTemplate = Template.fromStack(testStack);
      
      // Restore original environment variable
      if (originalEnv === undefined) {
        delete process.env.ENVIRONMENT_SUFFIX;
      } else {
        process.env.ENVIRONMENT_SUFFIX = originalEnv;
      }
      
      // Check DynamoDB tables
      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp(`.*-${testSuffix}$`),
      });

      // Check SNS topics
      testTemplate.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.stringLikeRegexp(`.*-${testSuffix}$`),
      });

      // Check SQS queues
      testTemplate.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: Match.stringLikeRegexp(`.*-${testSuffix}$`),
      });

      // Check Lambda functions
      testTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp(`.*-${testSuffix}$`),
      });
    });
  });
});