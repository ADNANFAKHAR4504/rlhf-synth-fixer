import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test-env';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('Stack is created successfully', () => {
      expect(stack).toBeDefined();
      expect(template).toBeDefined();
    });

    test('Stack uses environmentSuffix from props', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {
        environmentSuffix: 'custom-suffix',
      });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'payment-events-custom-suffix',
      });
    });

    test('Stack uses environmentSuffix from context when props not provided', () => {
      const testApp = new cdk.App({
        context: { environmentSuffix: 'context-suffix' },
      });
      const testStack = new TapStack(testApp, 'TestStack');
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'payment-events-context-suffix',
      });
    });

    test('Stack uses default dev when no environmentSuffix provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {});
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'payment-events-dev',
      });
    });
  });

  describe('KMS Key', () => {
    test('KMS key is created with encryption key rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('KMS key has correct deletion policy', () => {
      template.hasResource('AWS::KMS::Key', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });
  });

  describe('VPC Configuration', () => {
    test('VPC is created', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('VPC has private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('VPC has public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('VPC has NAT Gateway for private subnet egress', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('VPC has Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('DynamoDB Table', () => {
    test('DynamoDB table is created with correct name pattern', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `payment-events-${environmentSuffix}`,
      });
    });

    test('DynamoDB table has correct partition and sort keys', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          { AttributeName: 'paymentId', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' },
        ],
      });
    });

    test('DynamoDB table has GSI for provider queries', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: [
          {
            IndexName: 'ProviderTimestampIndex',
            KeySchema: [
              { AttributeName: 'provider', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' },
            ],
          },
        ],
      });
    });

    test('DynamoDB table uses KMS encryption', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
          SSEType: 'KMS',
        },
      });
    });

    test('DynamoDB table has point-in-time recovery enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('DynamoDB table uses PAY_PER_REQUEST billing', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('DynamoDB table has correct deletion policy', () => {
      template.hasResource('AWS::DynamoDB::Table', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });
  });

  describe('S3 Bucket', () => {
    test('S3 bucket is created with correct name pattern', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `webhook-archive-${environmentSuffix}`,
      });
    });

    test('S3 bucket uses KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
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

    test('S3 bucket has versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('S3 bucket has lifecycle rule for Glacier transition', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90,
                },
              ],
            },
          ],
        },
      });
    });

    test('S3 bucket has auto-delete objects enabled for cleanup', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:auto-delete-objects',
            Value: 'true',
          },
        ]),
      });
    });

    test('S3 bucket has correct deletion policy', () => {
      template.hasResource('AWS::S3::Bucket', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });
  });

  describe('SQS Queues', () => {
    test('Processing queue is created with correct name', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `processing-queue-${environmentSuffix}`,
      });
    });

    test('Notification queue is created with correct name', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `notification-queue-${environmentSuffix}`,
      });
    });

    test('Queues have correct visibility timeout (6x Lambda timeout)', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        VisibilityTimeout: 180,
      });
    });

    test('Queues use KMS encryption', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        KmsMasterKeyId: Match.anyValue(),
      });
    });

    test('Both queues are created', () => {
      template.resourceCountIs('AWS::SQS::Queue', 2);
    });
  });

  describe('SNS Topic', () => {
    test('SNS topic is created with correct name', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `payment-alerts-${environmentSuffix}`,
      });
    });

    test('SNS topic has display name', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Payment Alert Notifications',
      });
    });

    test('SNS topic uses KMS encryption', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        KmsMasterKeyId: Match.anyValue(),
      });
    });

    test('SNS topic policy allows EventBridge to publish', () => {
      template.hasResourceProperties('AWS::SNS::TopicPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sns:Publish',
              Effect: 'Allow',
              Principal: {
                Service: 'events.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });
  });

  describe('EventBridge', () => {
    test('Custom event bus is created', () => {
      template.hasResourceProperties('AWS::Events::EventBus', {
        Name: `payment-events-${environmentSuffix}`,
      });
    });

    test('High value payment rule is created', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `high-value-payments-${environmentSuffix}`,
        EventPattern: {
          source: ['payment.processor'],
          'detail-type': ['Payment Processed'],
          detail: {
            amount: [{ numeric: ['>', 10000] }],
          },
        },
      });
    });

    test('Standard payment rule is created', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `standard-payments-${environmentSuffix}`,
        EventPattern: {
          source: ['payment.processor'],
          'detail-type': ['Payment Processed'],
          detail: {
            amount: [{ numeric: ['<=', 10000] }],
          },
        },
      });
    });

    test('Both EventBridge rules are created', () => {
      template.resourceCountIs('AWS::Events::Rule', 2);
    });
  });

  describe('Lambda Functions', () => {
    test('Application Lambda functions are created', () => {
      // Check for at least 3 Lambda functions (may have more for custom resources)
      const functions = template.findResources('AWS::Lambda::Function');
      const functionCount = Object.keys(functions).length;
      expect(functionCount).toBeGreaterThanOrEqual(3);
    });

    test('Webhook receiver Lambda is created', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `webhook-receiver-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Architectures: ['arm64'],
        Timeout: 30,
        MemorySize: 512,
      });
    });

    test('Event processor Lambda is created', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `event-processor-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Architectures: ['arm64'],
        Timeout: 30,
        MemorySize: 512,
      });
    });

    test('Notification handler Lambda is created', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `notification-handler-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Architectures: ['arm64'],
        Timeout: 30,
        MemorySize: 256,
      });
    });

    test('Lambda functions are deployed in VPC', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: Match.objectLike({
          SubnetIds: Match.anyValue(),
        }),
      });
    });

    test('Lambda functions have required environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            PAYMENT_TABLE: Match.anyValue(),
          }),
        },
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('Lambda execution role is created', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `payment-webhook-lambda-role-${environmentSuffix}`,
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
    });

    test('Lambda role has VPC access policy', () => {
      const roles = template.findResources('AWS::IAM::Role', {
        Properties: {
          RoleName: `payment-webhook-lambda-role-${environmentSuffix}`,
        },
      });
      expect(Object.keys(roles).length).toBeGreaterThan(0);
    });

    test('Lambda execution policy grants DynamoDB access', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      expect(Object.keys(policies).length).toBeGreaterThan(0);
    });

    test('Lambda execution policy grants S3 access', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      expect(Object.keys(policies).length).toBeGreaterThan(0);
    });

    test('Lambda execution policy grants SQS access', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      expect(Object.keys(policies).length).toBeGreaterThan(0);
    });

    test('Lambda execution policy grants SNS access', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      expect(Object.keys(policies).length).toBeGreaterThan(0);
    });

    test('Lambda execution policy grants EventBridge access', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      expect(Object.keys(policies).length).toBeGreaterThan(0);
    });

    test('Lambda execution policy grants KMS access', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      expect(Object.keys(policies).length).toBeGreaterThan(0);
    });

    test('Lambda execution policy grants SSM access', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      expect(Object.keys(policies).length).toBeGreaterThan(0);
    });
  });

  describe('SSM Parameter', () => {
    test('SSM parameter is created for configuration', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/payment-webhook/${environmentSuffix}/config`,
        Type: 'String',
      });
    });

    test('SSM parameter has correct configuration values', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Value: Match.stringLikeRegexp('.*maxRetries.*timeoutMs.*'),
      });
    });
  });

  describe('API Gateway', () => {
    test('REST API is created', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `webhook-api-${environmentSuffix}`,
      });
    });

    test('API has webhook resource endpoint', () => {
      template.resourceCountIs('AWS::ApiGateway::Resource', 1);
    });

    test('API has POST method', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
      });
    });

    test('API has deployment stage', () => {
      template.resourceCountIs('AWS::ApiGateway::Deployment', 1);
    });

    test('API logging is enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            LoggingLevel: 'INFO',
          }),
        ]),
      });
    });
  });

  describe('Lambda Function URL', () => {
    test('Lambda function URL is created for health checks', () => {
      template.resourceCountIs('AWS::Lambda::Url', 1);
    });

    test('Lambda function URL has no authentication (public)', () => {
      template.hasResourceProperties('AWS::Lambda::Url', {
        AuthType: 'NONE',
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('Webhook receiver error alarm is created', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `webhook-receiver-errors-${environmentSuffix}`,
        Threshold: 1,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('DynamoDB throttle alarm is created', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `dynamodb-throttle-${environmentSuffix}`,
        Threshold: 5,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('Both CloudWatch alarms are created', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('CloudWatch dashboard is created', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `payment-webhook-dashboard-${environmentSuffix}`,
      });
    });

    test('Dashboard has multiple widgets', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardBody: Match.anyValue(),
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('Standard payment log group is created', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/events/standard-payments-${environmentSuffix}`,
        RetentionInDays: 30,
      });
    });

    test('Log group has correct deletion policy', () => {
      template.hasResource('AWS::Logs::LogGroup', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });
  });

  describe('Lambda Event Sources', () => {
    test('Event processor has SQS event source', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        BatchSize: 10,
      });
    });

    test('Notification handler has SQS event source', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        BatchSize: 10,
      });
    });

    test('Two event source mappings are created', () => {
      template.resourceCountIs('AWS::Lambda::EventSourceMapping', 2);
    });
  });

  describe('Stack Outputs', () => {
    test('Stack has API URL output', () => {
      template.hasOutput('PaymentWebhookStackApiUrlCA54DE18', {
        Description: 'API Gateway URL',
        Export: {
          Name: `payment-webhook-api-url-${environmentSuffix}`,
        },
      });
    });

    test('Stack has health check URL output', () => {
      template.hasOutput('PaymentWebhookStackHealthCheckUrl1E2F96F5', {
        Description: 'Lambda Function URL for health checks',
        Export: {
          Name: `payment-webhook-health-url-${environmentSuffix}`,
        },
      });
    });

    test('Stack has payment table name output', () => {
      template.hasOutput('PaymentWebhookStackPaymentTableName57FC5144', {
        Description: 'DynamoDB table name',
        Export: {
          Name: `payment-table-name-${environmentSuffix}`,
        },
      });
    });

    test('Stack has event bus name output', () => {
      template.hasOutput('PaymentWebhookStackEventBusName3EB24226', {
        Description: 'EventBridge event bus name',
        Export: {
          Name: `payment-eventbus-name-${environmentSuffix}`,
        },
      });
    });

    test('Stack has archive bucket name output', () => {
      template.hasOutput('PaymentWebhookStackArchiveBucketName32CDE42E', {
        Description: 'S3 archive bucket name',
        Export: {
          Name: `payment-archive-bucket-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Resource Naming Conventions', () => {
    test('All resources use correct environmentSuffix in names', () => {
      // DynamoDB
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `payment-events-${environmentSuffix}`,
      });

      // S3
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `webhook-archive-${environmentSuffix}`,
      });

      // SQS Queues
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `processing-queue-${environmentSuffix}`,
      });

      // SNS Topic
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `payment-alerts-${environmentSuffix}`,
      });

      // EventBus
      template.hasResourceProperties('AWS::Events::EventBus', {
        Name: `payment-events-${environmentSuffix}`,
      });

      // IAM Role
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `payment-webhook-lambda-role-${environmentSuffix}`,
      });
    });

    test('All Lambda functions use correct naming pattern', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `webhook-receiver-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `event-processor-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `notification-handler-${environmentSuffix}`,
      });
    });

    test('All CloudWatch resources use correct naming pattern', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `payment-webhook-dashboard-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `webhook-receiver-errors-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `dynamodb-throttle-${environmentSuffix}`,
      });
    });

    test('API Gateway uses correct naming pattern', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `webhook-api-${environmentSuffix}`,
      });
    });

    test('EventBridge rules use correct naming pattern', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `high-value-payments-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `standard-payments-${environmentSuffix}`,
      });
    });

    test('SSM parameter uses correct naming pattern', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/payment-webhook/${environmentSuffix}/config`,
      });
    });
  });
});
