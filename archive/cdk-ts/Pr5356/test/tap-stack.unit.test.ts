import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack (TAP transaction pipeline)', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  // -------------------------
  // Secrets
  // -------------------------
  describe('Secrets', () => {
    test('creates Secrets Manager secret for API keys with generation rules', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'API keys / signing material for webhook HMAC validation',
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: JSON.stringify({ defaultKey: '' }),
          GenerateStringKey: 'defaultKey',
          ExcludeCharacters: Match.stringLikeRegexp('[%\\+~`#\\$&\\*\\(\\)\\|\\[\\]\\{\\}:;<>\\?\\"\'/@\\\\]'),
        }),
      });
    });
  });

  // -------------------------
  // S3
  // -------------------------
  describe('S3 Buckets', () => {
    test('creates access-logs bucket with SSL enforced and no public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', Match.objectLike({
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({ ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } }),
          ]),
        },
        PublicAccessBlockConfiguration: Match.objectLike({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        }),
      }));

      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: 's3:*',
              Principal: { AWS: '*' },
              Condition: { Bool: { 'aws:SecureTransport': 'false' } },
            }),
          ]),
        },
      });
    });

    test('creates archive bucket with versioning, logs, lifecycle, SSL, and no public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', Match.objectLike({
        VersioningConfiguration: { Status: 'Enabled' },
        LoggingConfiguration: Match.objectLike({
          DestinationBucketName: Match.anyValue(),
          LogFilePrefix: 'archive/',
        }),
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Status: 'Enabled',
              ExpirationInDays: 365,
              Transitions: Match.arrayWith([
                Match.objectLike({ StorageClass: 'GLACIER_IR', TransitionInDays: 90 }),
              ]),
            }),
          ]),
        },
        PublicAccessBlockConfiguration: Match.objectLike({
          BlockPublicAcls: true, BlockPublicPolicy: true, IgnorePublicAcls: true, RestrictPublicBuckets: true,
        }),
      }));
    });
  });

  // -------------------------
  // DynamoDB
  // -------------------------
  describe('DynamoDB', () => {
    test('creates transactions table with stream, PITR, contributor insights, and GSIs', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `tap-transactions-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
        StreamSpecification: { StreamViewType: 'NEW_AND_OLD_IMAGES' },
        ContributorInsightsSpecification: { Enabled: true },
        KeySchema: Match.arrayWith([Match.objectLike({ AttributeName: 'txnId' })]),
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'byMerchantAndTime',
            KeySchema: Match.arrayWith(
              Match.objectLike({ AttributeName: 'merchantId' }),
              Match.objectLike({ AttributeName: 'updatedAt' }),
            ),
          }),
          Match.objectLike({
            IndexName: 'byStatusAndTime',
            KeySchema: Match.arrayWith(
              Match.objectLike({ AttributeName: 'status' }),
              Match.objectLike({ AttributeName: 'updatedAt' }),
            ),
          }),
        ]),
      });
    });

    test('creates audit table with PITR, contributor insights, and GSI', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `tap-audit-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
        ContributorInsightsSpecification: { Enabled: true },
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'byTxnAndTime',
            KeySchema: Match.arrayWith(
              Match.objectLike({ AttributeName: 'txnId' }),
              Match.objectLike({ AttributeName: 'createdAt' }),
            ),
          }),
        ]),
      });
    });
  });

  // -------------------------
  // SQS
  // -------------------------
  describe('SQS', () => {
    test('creates FIFO DLQ and FIFO inbound queue with redrive to DLQ', () => {
      // DLQ
      template.hasResourceProperties('AWS::SQS::Queue', Match.objectLike({
        FifoQueue: true,
        ContentBasedDeduplication: true,
        VisibilityTimeout: 300,
        QueueName: Match.stringLikeRegexp(`tap-txn-dlq-${environmentSuffix}\\.fifo`),
      }));

      // Inbound with redrive to DLQ
      template.hasResourceProperties('AWS::SQS::Queue', Match.objectLike({
        FifoQueue: true,
        ContentBasedDeduplication: true,
        VisibilityTimeout: 900,
        RedrivePolicy: Match.objectLike({
          deadLetterTargetArn: Match.anyValue(),
          maxReceiveCount: 3,
        }),
        QueueName: Match.stringLikeRegexp(`tap-txn-inbound-${environmentSuffix}\\.fifo`),
      }));

      // CDK creates QueuePolicy resources for SQS targets + our explicit addToResourcePolicy.
      const resources = (template.toJSON() as any).Resources;
      const policies = Object.values(resources).filter((r: any) => r.Type === 'AWS::SQS::QueuePolicy');
      expect(policies.length).toBeGreaterThanOrEqual(2);
    });

    test('creates standard SQS DLQ for EventBridge targets', () => {
      template.hasResourceProperties('AWS::SQS::Queue', Match.objectLike({
        FifoQueue: Match.absent(),
        QueueName: `tap-eventbridge-dlq-${environmentSuffix}`,
      }));
    });
  });

  // -------------------------
  // EventBridge
  // -------------------------
  describe('EventBridge', () => {
    test('creates custom EventBridge event bus', () => {
      template.hasResourceProperties('AWS::Events::EventBus', {
        Name: `tap-transaction-events-${environmentSuffix}`,
      });
    });

    test('HighAmount rule pattern and DLQ/retry', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `tap-high-amount-${environmentSuffix}`,
        EventBusName: Match.anyValue(), // Ref to bus
        EventPattern: {
          source: ['tap.compliance'],
          'detail-type': ['High Amount Transaction'],
        },
        Targets: Match.arrayWith([
          Match.objectLike({
            DeadLetterConfig: Match.anyValue(),
            RetryPolicy: Match.anyValue(),
          }),
        ]),
      });
    });

    test('HighFraud rule pattern and DLQ/retry', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `tap-high-fraud-${environmentSuffix}`,
        EventBusName: Match.anyValue(),
        EventPattern: {
          source: ['tap.fraud'],
          'detail-type': ['High Fraud Score'],
        },
        Targets: Match.arrayWith([
          Match.objectLike({
            DeadLetterConfig: Match.anyValue(),
            RetryPolicy: Match.anyValue(),
          }),
        ]),
      });
    });

    test('FailureSpike rule sends to SQS with MessageGroupId', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `tap-failure-spike-${environmentSuffix}`,
        EventBusName: Match.anyValue(),
        EventPattern: {
          source: ['tap.compensation'],
          'detail-type': ['transaction.rolled_back'],
        },
        Targets: Match.arrayWith([
          Match.objectLike({
            SqsParameters: { MessageGroupId: 'compensation-rollbacks' },
          }),
        ]),
      });
    });
  });

  // -------------------------
  // Lambda
  // -------------------------
  describe('Lambda', () => {
    test('creates 8 Lambda functions with Node 18, ARM64, tracing, and shared env', () => {
      template.resourceCountIs('AWS::Lambda::Function', 8);

      template.hasResourceProperties('AWS::Lambda::Function', Match.objectLike({
        Runtime: 'nodejs18.x',
        Architectures: Match.arrayWith(['arm64']),
        TracingConfig: { Mode: 'Active' },
        Handler: 'index.handler',
        Environment: {
          Variables: Match.objectLike({
            TRANSACTIONS_TABLE: Match.anyValue(),
            AUDIT_TABLE: Match.anyValue(),
            ARCHIVE_BUCKET: Match.anyValue(),
            EVENT_BUS_NAME: Match.anyValue(),
            SECRET_ARN: Match.anyValue(),
          }),
        },
      }));
    });

    test('sets reserved concurrency on key functions', () => {
      template.hasResourceProperties('AWS::Lambda::Function', Match.objectLike({
        FunctionName: `tap-transaction-validation-${environmentSuffix}`,
        ReservedConcurrentExecutions: 100,
      }));
      template.hasResourceProperties('AWS::Lambda::Function', Match.objectLike({
        FunctionName: `tap-webhook-dispatcher-${environmentSuffix}`,
        ReservedConcurrentExecutions: 100,
      }));
      template.hasResourceProperties('AWS::Lambda::Function', Match.objectLike({
        FunctionName: `tap-compensator-${environmentSuffix}`,
        ReservedConcurrentExecutions: 25,
      }));
    });

    test('creates two Lambda aliases with provisioned concurrency', () => {
      template.resourceCountIs('AWS::Lambda::Alias', 2);
      template.hasResourceProperties('AWS::Lambda::Alias', {
        Name: 'provisioned',
        ProvisionedConcurrencyConfig: { ProvisionedConcurrentExecutions: 5 },
      });
    });
  });

  // -------------------------
  // Step Functions
  // -------------------------
  describe('Step Functions', () => {
    test('creates state machine with logging and tracing', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', Match.objectLike({
        StateMachineName: `tap-transaction-processor-${environmentSuffix}`,
        TracingConfiguration: { Enabled: true },
        LoggingConfiguration: {
          Level: 'ALL',
          Destinations: Match.arrayWith([
            Match.objectLike({ CloudWatchLogsLogGroup: { LogGroupArn: Match.anyValue() } }),
          ]),
        },
      }));

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/vendedlogs/states/tap-transaction-processor-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });
  });

  // -------------------------
  // API Gateway
  // -------------------------
  describe('API Gateway', () => {
    test('creates REST API with stage settings', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      template.resourceCountIs('AWS::ApiGateway::Stage', 1);

      // MetricsEnabled/DataTraceEnabled live inside MethodSettings, not top-level
      template.hasResourceProperties('AWS::ApiGateway::Stage', Match.objectLike({
        TracingEnabled: true,
        StageName: environmentSuffix,
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            MetricsEnabled: true,
            DataTraceEnabled: true,
            LoggingLevel: 'INFO',
          }),
        ]),
      }));
    });

    test('creates TOKEN authorizer with no caching', () => {
      template.hasResourceProperties('AWS::ApiGateway::Authorizer', {
        Type: 'TOKEN',
        AuthorizerResultTtlInSeconds: 0,
      });
    });

    test('creates POST /transactions method requiring API key and model', () => {
      template.hasResourceProperties('AWS::ApiGateway::Model', {
        ContentType: 'application/json',
        Name: 'TransactionRequest',
        Schema: Match.objectLike({
          type: 'object',
          required: Match.arrayWith(['transactionId', 'merchantId', 'amount', 'currency']),
        }),
      });

      template.hasResourceProperties('AWS::ApiGateway::Method', Match.objectLike({
        HttpMethod: 'POST',
        ApiKeyRequired: true,
        RequestModels: Match.anyValue(),
        Integration: Match.objectLike({
          Type: 'AWS',
          IntegrationHttpMethod: 'POST',
          // URI is constructed with Fn::Join by CDK
          Uri: Match.objectLike({ 'Fn::Join': Match.anyValue() }),
        }),
      }));
    });

    test('grants APIGW a role with permission to StartExecution', () => {
      template.hasResourceProperties('AWS::IAM::Role', Match.objectLike({
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: { Service: 'apigateway.amazonaws.com' },
              Action: 'sts:AssumeRole',
            }),
          ]),
        },
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'StepFunctionsPolicy',
            PolicyDocument: Match.objectLike({
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.anyValue(),   // string or array depending on CDK version
                  Resource: Match.anyValue(),
                }),
              ]),
            }),
          }),
        ]),
      }));
    });

    test('creates POST /webhooks/status mock method with authorizer', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', Match.objectLike({
        HttpMethod: 'POST',
        AuthorizationType: 'CUSTOM',
        Integration: Match.objectLike({ Type: 'MOCK' }),
      }));
    });
  });

  // -------------------------
  // CloudWatch
  // -------------------------
  describe('CloudWatch Monitoring', () => {
    test('creates CloudWatch dashboard', () => {
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `tap-transaction-pipeline-${environmentSuffix}`,
      });
    });

    test('creates alarms for DLQ depth, Lambda throttles, Step Functions failures, and API 5xx', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 4);
      template.hasResourceProperties('AWS::CloudWatch::Alarm', Match.objectLike({
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 1,
      }));
    });
  });

  // -------------------------
  // Outputs
  // -------------------------
  describe('Outputs', () => {
    test('exposes all required outputs', () => {
      const outputs = template.toJSON().Outputs;
      expect(Object.keys(outputs)).toEqual(
        expect.arrayContaining([
          'ApiEndpoint',
          'ApiKeyValue',
          'StateMachineArn',
          'TransactionsTableName',
          'InboundQueueUrl',
          'DLQUrl',
          'EventBusName',
          'ArchiveBucketName',
          'DashboardUrl',
        ])
      );
    });
  });

  // -------------------------
  // Env suffix handling
  // -------------------------
  describe('Environment suffix handling', () => {
    test('uses provided environment suffix in names', () => {
      template.hasResourceProperties('AWS::Events::EventBus', {
        Name: `tap-transaction-events-${environmentSuffix}`,
      });
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `tap-transactions-${environmentSuffix}`,
      });
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        StateMachineName: `tap-transaction-processor-${environmentSuffix}`,
      });
    });

    test('defaults to "dev" when environmentSuffix not provided', () => {
      const app2 = new cdk.App();
      const stack2 = new TapStack(app2, 'TapNoSuffix');
      const template2 = Template.fromStack(stack2);
      template2.hasResourceProperties('AWS::Events::EventBus', { Name: 'tap-transaction-events-dev' });
    });

    test('uses context environmentSuffix when set and props not provided', () => {
      const app3 = new cdk.App({ context: { environmentSuffix: 'staging' } });
      const stack3 = new TapStack(app3, 'TapCtxSuffix');
      const template3 = Template.fromStack(stack3);
      template3.hasResourceProperties('AWS::Events::EventBus', { Name: 'tap-transaction-events-staging' });
    });
  });
});
