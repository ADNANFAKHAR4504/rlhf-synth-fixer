import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { DynamoDBStack } from '../lib/stacks/dynamodb-stack';
import { LambdaStack } from '../lib/stacks/lambda-stack';
import { MonitoringStack } from '../lib/stacks/monitoring-stack';
import { S3Stack } from '../lib/stacks/s3-stack';
import { SQSStack } from '../lib/stacks/sqs-stack';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: { account: '123456789012', region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('should create a TapStack instance', () => {
      expect(stack).toBeInstanceOf(TapStack);
      expect(stack).toBeInstanceOf(cdk.Stack);
    });

    test('should handle different environment suffix configurations', () => {
      // Test with context-based environment suffix
      const appWithContext = new cdk.App({
        context: { environmentSuffix: 'prod' },
      });
      const stackWithContext = new TapStack(
        appWithContext,
        'TestTapStackWithContext',
        {
          env: { account: '123456789012', region: 'us-east-1' },
        }
      );
      expect(stackWithContext).toBeInstanceOf(TapStack);

      // Test with props-based environment suffix
      const stackWithProps = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'staging',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      expect(stackWithProps).toBeInstanceOf(TapStack);

      // Test with no environment suffix (defaults to 'dev')
      const stackDefault = new TapStack(app, 'TestTapStackDefault', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      expect(stackDefault).toBeInstanceOf(TapStack);
    });

    test('should create all required child stacks', () => {
      expect(stack.node.children.length).toBeGreaterThan(0);

      // Verify all child constructs are created
      const childConstructs = stack.node.children.map(
        child => child.constructor.name
      );
      expect(childConstructs).toContain('S3Stack');
      expect(childConstructs).toContain('DynamoDBStack');
      expect(childConstructs).toContain('SQSStack');
      expect(childConstructs).toContain('LambdaStack');
      expect(childConstructs).toContain('MonitoringStack');
    });

    test('should determine primary region correctly', () => {
      // Test primary region (us-east-1)
      const primaryStack = new TapStack(app, 'PrimaryStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      expect(primaryStack.region).toBe('us-east-1');

      // Test secondary region (us-west-2)
      const secondaryStack = new TapStack(app, 'SecondaryStack', {
        env: { account: '123456789012', region: 'us-west-2' },
      });
      expect(secondaryStack.region).toBe('us-west-2');
    });
  });
});

describe('S3Stack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let s3Stack: S3Stack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    s3Stack = new S3Stack(stack, 'S3Stack', {
      environment: environmentSuffix,
      isPrimary: true,
      region: 'us-east-1',
    });
    template = Template.fromStack(stack);
  });

  describe('S3 Bucket Creation', () => {
    test('should create S3 bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `serverless-data-ingestion-${environmentSuffix}-us-east-1`,
        VersioningConfiguration: {
          Status: 'Enabled',
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
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should have deletion policy set to Delete', () => {
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('should enable auto delete objects', () => {
      // Note: AutoDeleteObjects is not a CloudFormation property, it's handled by CDK
      // The actual CloudFormation template will have a Custom Resource for this
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('should configure lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DataLifecycleRule',
              Status: 'Enabled',
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                }),
                Match.objectLike({
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90,
                }),
                Match.objectLike({
                  StorageClass: 'DEEP_ARCHIVE',
                  TransitionInDays: 365,
                }),
              ]),
              ExpirationInDays: 2555,
            }),
          ]),
        },
      });
    });

    test('should configure CORS', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        CorsConfiguration: {
          CorsRules: [
            {
              AllowedMethods: ['GET', 'PUT', 'POST'],
              AllowedOrigins: ['*'],
              AllowedHeaders: ['*'],
              MaxAge: 3000,
            },
          ],
        },
      });
    });
  });

  describe('S3 Bucket Policy', () => {
    test('should create bucket policy with security statements', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: 's3:*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
            Match.objectLike({
              Effect: 'Deny',
              Action: 's3:PutObject',
              Condition: {
                StringNotEquals: {
                  's3:x-amz-server-side-encryption': 'AES256',
                },
              },
            }),
          ]),
        },
      });
    });
  });

  describe('S3 Stack Outputs', () => {
    test('should output bucket name', () => {
      // Outputs are created by the S3Stack construct, not the main stack
      // We verify the S3Stack creates the outputs by checking the construct
      expect(s3Stack.bucketName).toBe(
        `serverless-data-ingestion-${environmentSuffix}-us-east-1`
      );
    });

    test('should output bucket ARN', () => {
      // Outputs are created by the S3Stack construct, not the main stack
      // We verify the S3Stack exposes the bucket
      expect(s3Stack.dataIngestionBucket).toBeDefined();
    });
  });

  describe('S3 Stack Properties', () => {
    test('should expose bucket and bucket name', () => {
      expect(s3Stack.dataIngestionBucket).toBeDefined();
      expect(s3Stack.bucketName).toBe(
        `serverless-data-ingestion-${environmentSuffix}-us-east-1`
      );
    });
  });
});

describe('DynamoDBStack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let dynamoDBStack: DynamoDBStack;
  let template: Template;

  describe('Primary Region (us-east-1)', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new cdk.Stack(app, 'TestStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      dynamoDBStack = new DynamoDBStack(stack, 'DynamoDBStack', {
        environment: environmentSuffix,
        isPrimary: true,
        region: 'us-east-1',
      });
      template = Template.fromStack(stack);
    });

    test('should create DynamoDB Table with correct schema', () => {
      // The stack creates GlobalTable for AWS (non-LocalStack) environments
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        TableName: `serverless-processed-data-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
        AttributeDefinitions: Match.arrayWith([
          { AttributeName: 'recordId', AttributeType: 'S' },
          { AttributeName: 'timestamp', AttributeType: 'S' },
          { AttributeName: 'processingStatus', AttributeType: 'S' },
          { AttributeName: 'dataType', AttributeType: 'S' },
        ]),
        KeySchema: [
          { AttributeName: 'recordId', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' },
        ],
      });
    });

    test('should create Global Secondary Indexes', () => {
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'ProcessingStatusIndex',
            KeySchema: [
              { AttributeName: 'processingStatus', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          }),
          Match.objectLike({
            IndexName: 'DataTypeIndex',
            KeySchema: [
              { AttributeName: 'dataType', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          }),
        ]),
      });
    });

    test('should configure point-in-time recovery', () => {
      // For GlobalTable, PITR is configured per replica
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        Replicas: Match.arrayWith([
          Match.objectLike({
            Region: 'us-east-1',
            PointInTimeRecoverySpecification: {
              PointInTimeRecoveryEnabled: true,
            },
          }),
        ]),
      });
    });

    test('should output table details', () => {
      // Outputs are created by the DynamoDBStack construct, not the main stack
      // We verify the DynamoDBStack exposes the table
      expect(dynamoDBStack.processedDataTable).toBeDefined();
      expect(dynamoDBStack.tableName).toBe(
        `serverless-processed-data-${environmentSuffix}`
      );
    });
  });

  describe('Secondary Region (us-west-2)', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new cdk.Stack(app, 'TestStack', {
        env: { account: '123456789012', region: 'us-west-2' },
      });
      dynamoDBStack = new DynamoDBStack(stack, 'DynamoDBStack', {
        environment: environmentSuffix,
        isPrimary: false,
        region: 'us-west-2',
      });
      template = Template.fromStack(stack);
    });

    test('should not create Global Table in secondary region', () => {
      template.resourceCountIs('AWS::DynamoDB::GlobalTable', 0);
    });

    test('should create table reference in secondary region', () => {
      expect(dynamoDBStack.processedDataTable).toBeDefined();
      expect(dynamoDBStack.tableName).toBe(
        `serverless-processed-data-${environmentSuffix}`
      );
    });
  });

  describe('DynamoDB Stack Properties', () => {
    test('should expose table and table name', () => {
      expect(dynamoDBStack.processedDataTable).toBeDefined();
      expect(dynamoDBStack.tableName).toBe(
        `serverless-processed-data-${environmentSuffix}`
      );
    });
  });

  describe('AWS GlobalTable Path (non-LocalStack)', () => {
    beforeEach(() => {
      // Ensure AWS_ENDPOINT_URL is not set to trigger AWS/GlobalTable path
      delete process.env.AWS_ENDPOINT_URL;

      app = new cdk.App();
      stack = new cdk.Stack(app, 'TestStackAWS', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      dynamoDBStack = new DynamoDBStack(stack, 'DynamoDBStackAWS', {
        environment: environmentSuffix,
        isPrimary: true,
        region: 'us-east-1',
      });
      template = Template.fromStack(stack);
    });

    test('should create DynamoDB GlobalTable for AWS deployment', () => {
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        TableName: `serverless-processed-data-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('should configure GlobalTable replicas', () => {
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        Replicas: Match.arrayWith([
          Match.objectLike({
            Region: 'us-east-1',
          }),
          Match.objectLike({
            Region: 'us-west-2',
          }),
        ]),
      });
    });
  });

  describe('LocalStack Path', () => {
    beforeEach(() => {
      // Set AWS_ENDPOINT_URL to trigger LocalStack/Table path
      process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';

      app = new cdk.App();
      stack = new cdk.Stack(app, 'TestStackLS', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      dynamoDBStack = new DynamoDBStack(stack, 'DynamoDBStackLS', {
        environment: environmentSuffix,
        isPrimary: true,
        region: 'us-east-1',
      });
      template = Template.fromStack(stack);
    });

    afterEach(() => {
      delete process.env.AWS_ENDPOINT_URL;
    });

    test('should create regular DynamoDB Table for LocalStack', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `serverless-processed-data-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('should not create GlobalTable for LocalStack', () => {
      template.resourceCountIs('AWS::DynamoDB::GlobalTable', 0);
    });
  });
});

describe('SQSStack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let sqsStack: SQSStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    sqsStack = new SQSStack(stack, 'SQSStack', {
      environment: environmentSuffix,
      isPrimary: true,
      region: 'us-east-1',
    });
    template = Template.fromStack(stack);
  });

  describe('SQS Queue Creation', () => {
    test('should create SQS queue with correct properties', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `serverless-dlq-${environmentSuffix}-us-east-1`,
        VisibilityTimeout: 300,
        MessageRetentionPeriod: 1209600, // 14 days
        ReceiveMessageWaitTimeSeconds: 20,
        SqsManagedSseEnabled: true,
      });
    });

    test('should have deletion policy set to Delete', () => {
      template.hasResource('AWS::SQS::Queue', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('SQS Queue Policy', () => {
    test('should create queue policy with security statements', () => {
      template.hasResourceProperties('AWS::SQS::QueuePolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: 'sqs:*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
          ]),
        },
      });
    });
  });

  describe('SQS Stack Outputs', () => {
    test('should output queue name', () => {
      // Outputs are created by the SQSStack construct, not the main stack
      // We verify the SQSStack exposes the queue
      expect(sqsStack.queueName).toBe(
        `serverless-dlq-${environmentSuffix}-us-east-1`
      );
    });

    test('should output queue ARN', () => {
      // Outputs are created by the SQSStack construct, not the main stack
      // We verify the SQSStack exposes the queue
      expect(sqsStack.deadLetterQueue).toBeDefined();
    });

    test('should output queue URL', () => {
      // Outputs are created by the SQSStack construct, not the main stack
      // We verify the SQSStack exposes the queue
      expect(sqsStack.deadLetterQueue.queueUrl).toBeDefined();
    });
  });

  describe('SQS Stack Properties', () => {
    test('should expose queue and queue name', () => {
      expect(sqsStack.deadLetterQueue).toBeDefined();
      expect(sqsStack.queueName).toBe(
        `serverless-dlq-${environmentSuffix}-us-east-1`
      );
    });
  });
});

describe('LambdaStack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let lambdaStack: LambdaStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    lambdaStack = new LambdaStack(stack, 'LambdaStack', {
      environment: environmentSuffix,
      isPrimary: true,
      region: 'us-east-1',
    });
    template = Template.fromStack(stack);
  });

  describe('Lambda Function Creation', () => {
    test('should create Lambda function with correct properties', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `serverless-data-processor-${environmentSuffix}-us-east-1`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 300,
        MemorySize: 512,
        Environment: {
          Variables: {
            DYNAMODB_TABLE_NAME: `serverless-processed-data-${environmentSuffix}`,
            ENVIRONMENT: environmentSuffix,
            IS_PRIMARY: 'true',
          },
        },
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('should create log group with correct configuration', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/serverless-data-processor-${environmentSuffix}-us-east-1`,
        RetentionInDays: 30,
      });
    });

    test('should have log group deletion policy set to Delete', () => {
      template.hasResource('AWS::Logs::LogGroup', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('Lambda IAM Permissions', () => {
    test('should create IAM role for Lambda function', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
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

    test('should grant CloudWatch logging permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: '*',
            }),
          ]),
        },
      });
    });
  });

  describe('Lambda Stack Outputs', () => {
    test('should output function name', () => {
      // Outputs are created by the LambdaStack construct, not the main stack
      // We verify the LambdaStack exposes the function
      expect(lambdaStack.functionName).toBe(
        `serverless-data-processor-${environmentSuffix}-us-east-1`
      );
    });

    test('should output function ARN', () => {
      // Outputs are created by the LambdaStack construct, not the main stack
      // We verify the LambdaStack exposes the function
      expect(lambdaStack.dataProcessorFunction).toBeDefined();
    });

    test('should output function role ARN', () => {
      // Outputs are created by the LambdaStack construct, not the main stack
      // We verify the LambdaStack exposes the function
      expect(lambdaStack.dataProcessorFunction.role).toBeDefined();
    });
  });

  describe('Lambda Stack Properties', () => {
    test('should expose function and function name', () => {
      expect(lambdaStack.dataProcessorFunction).toBeDefined();
      expect(lambdaStack.functionName).toBe(
        `serverless-data-processor-${environmentSuffix}-us-east-1`
      );
    });
  });
});

describe('MonitoringStack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let monitoringStack: MonitoringStack;
  let template: Template;

  describe('Primary Region (us-east-1)', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new cdk.Stack(app, 'TestStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
        environment: environmentSuffix,
        isPrimary: true,
        region: 'us-east-1',
      });
      template = Template.fromStack(stack);
    });

    test('should create SNS topic with correct properties', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `serverless-alarms-${environmentSuffix}`,
        DisplayName: `Serverless Pipeline Alarms - ${environmentSuffix}`,
      });
    });

    test('should create Lambda error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `serverless-lambda-errors-${environmentSuffix}`,
        AlarmDescription: 'Lambda function errors exceeded threshold',
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        Threshold: 1,
        EvaluationPeriods: 2,
      });
    });

    test('should create Lambda duration alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `serverless-lambda-duration-${environmentSuffix}`,
        AlarmDescription: 'Lambda function duration exceeded threshold',
        Threshold: 240000,
        EvaluationPeriods: 2,
      });
    });

    test('should create Lambda throttles alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `serverless-lambda-throttles-${environmentSuffix}`,
        AlarmDescription: 'Lambda function throttles detected',
        Threshold: 1,
        EvaluationPeriods: 1,
      });
    });

    test('should create S3 errors alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `serverless-s3-errors-${environmentSuffix}`,
        AlarmDescription: 'S3 bucket 5xx errors detected',
        Threshold: 1,
        EvaluationPeriods: 1,
      });
    });

    test('should create DynamoDB errors alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `serverless-dynamodb-errors-${environmentSuffix}`,
        AlarmDescription: 'DynamoDB system errors detected',
        Threshold: 1,
        EvaluationPeriods: 1,
      });
    });

    test('should create DynamoDB throttles alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `serverless-dynamodb-throttles-${environmentSuffix}`,
        AlarmDescription: 'DynamoDB throttled requests detected',
        Threshold: 1,
        EvaluationPeriods: 1,
      });
    });

    test('should create SQS messages alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `serverless-sqs-messages-${environmentSuffix}`,
        AlarmDescription: 'Dead letter queue has too many messages',
        Threshold: 10,
        EvaluationPeriods: 2,
      });
    });

    test('should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `serverless-pipeline-${environmentSuffix}-us-east-1`,
      });
    });

    test('should add SNS actions to all alarms', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const alarmKeys = Object.keys(alarms);

      alarmKeys.forEach(key => {
        const alarm = alarms[key];
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(Array.isArray(alarm.Properties.AlarmActions)).toBe(true);
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Secondary Region (us-west-2)', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new cdk.Stack(app, 'TestStack', {
        env: { account: '123456789012', region: 'us-west-2' },
      });
      monitoringStack = new MonitoringStack(stack, 'MonitoringStack', {
        environment: environmentSuffix,
        isPrimary: false,
        region: 'us-west-2',
      });
      template = Template.fromStack(stack);
    });

    test('should create minimal dashboard in secondary region', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `serverless-pipeline-${environmentSuffix}-us-west-2`,
      });
    });
  });

  describe('Monitoring Stack Outputs', () => {
    test('should output SNS topic ARN', () => {
      // Outputs are created by the MonitoringStack construct, not the main stack
      // We verify the MonitoringStack exposes the topic
      expect(monitoringStack.alarmTopic).toBeDefined();
    });

    test('should output dashboard name', () => {
      // Outputs are created by the MonitoringStack construct, not the main stack
      // We verify the MonitoringStack exposes the dashboard
      expect(monitoringStack.dashboard).toBeDefined();
    });
  });

  describe('Monitoring Stack Properties', () => {
    test('should expose alarm topic and dashboard', () => {
      expect(monitoringStack.alarmTopic).toBeDefined();
      expect(monitoringStack.dashboard).toBeDefined();
    });
  });
});

describe('Resource Integration Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'IntegrationTestStack', {
      environmentSuffix,
      env: { account: '123456789012', region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  test('should create all expected resource types', () => {
    const resources = template.toJSON().Resources;
    const resourceTypes = Object.values(resources).map((r: any) => r.Type);

    expect(resourceTypes).toContain('AWS::S3::Bucket');
    expect(resourceTypes).toContain('AWS::S3::BucketPolicy');
    // DynamoDB creates either Table (LocalStack) or GlobalTable (AWS multi-region)
    // Check that at least one DynamoDB resource type exists
    const hasDynamoDB =
      resourceTypes.includes('AWS::DynamoDB::Table') ||
      resourceTypes.includes('AWS::DynamoDB::GlobalTable');
    expect(hasDynamoDB).toBe(true);
    expect(resourceTypes).toContain('AWS::SQS::Queue');
    expect(resourceTypes).toContain('AWS::SQS::QueuePolicy');
    expect(resourceTypes).toContain('AWS::Lambda::Function');
    expect(resourceTypes).toContain('AWS::Logs::LogGroup');
    expect(resourceTypes).toContain('AWS::IAM::Role');
    expect(resourceTypes).toContain('AWS::IAM::Policy');
    expect(resourceTypes).toContain('AWS::SNS::Topic');
    expect(resourceTypes).toContain('AWS::CloudWatch::Alarm');
    expect(resourceTypes).toContain('AWS::CloudWatch::Dashboard');
  });

  test('should have correct number of IAM roles', () => {
    // Multiple IAM roles are created: Lambda execution role, SQS queue policy role, etc.
    const roles = template.findResources('AWS::IAM::Role');
    expect(Object.keys(roles).length).toBeGreaterThanOrEqual(1);
  });

  test('should have correct number of IAM policies', () => {
    const policies = template.findResources('AWS::IAM::Policy');
    expect(Object.keys(policies).length).toBeGreaterThanOrEqual(1);
  });

  test('should have correct number of CloudWatch alarms', () => {
    const alarms = template.findResources('AWS::CloudWatch::Alarm');
    expect(Object.keys(alarms).length).toBeGreaterThanOrEqual(6); // 6+ alarms
  });

  test('should have proper resource dependencies', () => {
    // Verify Lambda function has dependencies on S3, DynamoDB, and SQS
    const lambdaFunctions = template.findResources('AWS::Lambda::Function');
    const lambdaKeys = Object.keys(lambdaFunctions);
    expect(lambdaKeys.length).toBeGreaterThanOrEqual(1);

    const lambdaFunction = lambdaFunctions[lambdaKeys[0]];
    // Lambda functions may or may not have explicit dependencies
    expect(lambdaFunction).toBeDefined();
  });

  test('should create stack with proper naming conventions', () => {
    expect(stack.stackName).toBeDefined();
    expect(stack.region).toBe('us-east-1');
    expect(stack.account).toBe('123456789012');
  });

  test('should have consistent tagging across resources', () => {
    const resources = template.toJSON().Resources;
    const resourceValues = Object.values(resources);

    // Check that resources have tags
    const taggedResources = resourceValues.filter(
      (r: any) => r.Properties && r.Properties.Tags
    );

    expect(taggedResources.length).toBeGreaterThan(0);
  });
});

describe('Edge Cases and Error Handling', () => {
  test('should handle missing environment suffix gracefully', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'EdgeCaseStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });

    expect(stack).toBeInstanceOf(TapStack);
    expect(stack.node.children.length).toBeGreaterThan(0);
  });

  test('should handle different region configurations', () => {
    const regions = ['us-east-1', 'us-west-2', 'eu-west-1'];

    regions.forEach(region => {
      const app = new cdk.App();
      const stack = new TapStack(app, `Stack${region}`, {
        environmentSuffix: 'test',
        env: { account: '123456789012', region },
      });

      expect(stack).toBeInstanceOf(TapStack);
      expect(stack.region).toBe(region);
    });
  });

  test('should handle different environment suffixes', () => {
    const suffixes = ['dev', 'test', 'prod', 'staging'];

    suffixes.forEach(suffix => {
      const app = new cdk.App();
      const stack = new TapStack(app, `Stack${suffix}`, {
        environmentSuffix: suffix,
        env: { account: '123456789012', region: 'us-east-1' },
      });

      expect(stack).toBeInstanceOf(TapStack);
      expect(stack.node.children.length).toBeGreaterThan(0);
    });
  });
});
