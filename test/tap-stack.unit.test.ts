import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('DynamoDB Table', () => {
    test('should create TransactionTable with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `TransactionTable-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });

    test('should have partition key and sort key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'transactionId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
      });
    });

    test('should have correct attribute definitions', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        AttributeDefinitions: [
          {
            AttributeName: 'transactionId',
            AttributeType: 'S',
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'N',
          },
        ],
      });
    });
  });

  describe('SQS Queues', () => {
    test('should create main TransactionQueue with correct configuration', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `transaction-queue-${environmentSuffix}`,
        VisibilityTimeout: 300,
      });
    });

    test('should create dead letter queue with 14-day retention', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `transaction-dlq-${environmentSuffix}`,
        MessageRetentionPeriod: 1209600, // 14 days in seconds
      });
    });

    test('should configure dead letter queue in main queue', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `transaction-queue-${environmentSuffix}`,
        RedrivePolicy: {
          deadLetterTargetArn: Match.anyValue(),
          maxReceiveCount: 3,
        },
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should create ReportsBucket with correct name and encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `transaction-reports-${environmentSuffix}`,
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

    test('should have lifecycle rule for Glacier transition', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'archive-old-reports',
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
  });

  describe('Lambda Layer', () => {
    test('should create SharedLayer with correct runtime', () => {
      template.hasResourceProperties('AWS::Lambda::LayerVersion', {
        CompatibleRuntimes: ['nodejs18.x'],
        Description: 'AWS SDK v3 and validation libraries',
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create ProcessTransaction function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `processTransaction-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        ReservedConcurrentExecutions: 100,
        Architectures: ['arm64'],
      });
    });

    test('should create AuditTransaction function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `auditTransaction-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 60,
        ReservedConcurrentExecutions: 100,
        Architectures: ['arm64'],
      });
    });

    test('should create DailySummary function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `dailySummary-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 300,
        Architectures: ['arm64'],
      });
    });

    test('should configure environment variables for ProcessTransaction', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `processTransaction-${environmentSuffix}`,
        Environment: {
          Variables: {
            TABLE_NAME: Match.anyValue(),
            QUEUE_URL: Match.anyValue(),
          },
        },
      });
    });

    test('should configure environment variables for AuditTransaction', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `auditTransaction-${environmentSuffix}`,
        Environment: {
          Variables: {
            BUCKET_NAME: Match.anyValue(),
          },
        },
      });
    });

    test('should configure environment variables for DailySummary', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `dailySummary-${environmentSuffix}`,
        Environment: {
          Variables: {
            TABLE_NAME: Match.anyValue(),
            BUCKET_NAME: Match.anyValue(),
          },
        },
      });
    });

    test('should attach SharedLayer to Lambda functions', () => {
      // Verify SharedLayer is referenced in Lambda functions
      const functions = template.findResources('AWS::Lambda::Function');
      const functionsWithLayers = Object.values(functions).filter(
        (fn: any) => fn.Properties.Layers && fn.Properties.Layers.length > 0
      );
      expect(functionsWithLayers.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('API Gateway', () => {
    test('should create REST API with correct name and endpoint type', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `transaction-api-${environmentSuffix}`,
        Description: 'Transaction Processing API',
        EndpointConfiguration: {
          Types: ['EDGE'],
        },
      });
    });

    test('should configure throttling limits in deployment options', () => {
      // Throttling is configured via deployOptions on RestApi
      const stages = template.findResources('AWS::ApiGateway::Stage');
      expect(Object.keys(stages).length).toBeGreaterThan(0);

      // Verify throttling is set in method settings
      const stageValues = Object.values(stages);
      const hasThrottling = stageValues.some((stage: any) =>
        stage.Properties.MethodSettings &&
        stage.Properties.MethodSettings.some((ms: any) =>
          ms.ThrottlingBurstLimit !== undefined || ms.ThrottlingRateLimit !== undefined
        )
      );
      expect(hasThrottling).toBe(true);
    });

    test('should create /transactions resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'transactions',
      });
    });

    test('should create POST method with Lambda integration', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        Integration: {
          Type: 'AWS_PROXY',
        },
      });
    });

    test('should create request validator', () => {
      template.hasResourceProperties('AWS::ApiGateway::RequestValidator', {
        ValidateRequestBody: true,
        ValidateRequestParameters: false,
      });
    });

    test('should create request model for validation', () => {
      template.hasResourceProperties('AWS::ApiGateway::Model', {
        Name: 'TransactionRequest',
        ContentType: 'application/json',
        Schema: {
          type: 'object',
          required: ['transactionId', 'amount', 'currency'],
          properties: {
            transactionId: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string' },
            timestamp: { type: 'number' },
            customerId: { type: 'string' },
          },
        },
      });
    });
  });

  describe('EventBridge Rule', () => {
    test('should create DailySummaryRule with correct schedule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `daily-summary-${environmentSuffix}`,
        ScheduleExpression: 'cron(0 2 * * ? *)',
      });
    });

    test('should target DailySummary Lambda function', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `daily-summary-${environmentSuffix}`,
        Targets: Match.arrayWith([
          Match.objectLike({
            Arn: Match.anyValue(),
          }),
        ]),
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create alarm for ProcessTransaction errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `processTransaction-errors-${environmentSuffix}`,
        Threshold: 0.01,
        EvaluationPeriods: 1,
        ComparisonOperator: 'GreaterThanThreshold',
        TreatMissingData: 'notBreaching',
      });
    });

    test('should create alarm for AuditTransaction errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `auditTransaction-errors-${environmentSuffix}`,
        Threshold: 0.01,
        EvaluationPeriods: 1,
        ComparisonOperator: 'GreaterThanThreshold',
        TreatMissingData: 'notBreaching',
      });
    });

    test('should monitor Lambda errors with correct metric', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm', {
        Properties: {
          MetricName: 'Errors',
          Namespace: 'AWS/Lambda',
          Statistic: 'Average',
        },
      });
      expect(Object.keys(alarms).length).toBe(2);
    });
  });

  describe('IAM Permissions', () => {
    test('should grant DynamoDB write permissions to ProcessTransaction', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['dynamodb:PutItem']),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should grant SQS send permissions to ProcessTransaction', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['sqs:SendMessage']),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should grant S3 write permissions to AuditTransaction', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['s3:PutObject']),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should grant DynamoDB read permissions to DailySummary', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                Match.stringLikeRegexp('dynamodb:.*Scan.*'),
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('Event Source Mapping', () => {
    test('should create SQS event source for AuditTransaction', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        BatchSize: 10,
        EventSourceArn: Match.anyValue(),
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have Lambda functions that will create log groups', () => {
      // Log groups are automatically created by Lambda functions
      // Verify Lambda functions exist which will create their own log groups
      const functions = template.findResources('AWS::Lambda::Function');
      const functionNames = Object.values(functions).map(
        (fn: any) => fn.Properties.FunctionName
      );

      expect(functionNames).toContain(`processTransaction-${environmentSuffix}`);
      expect(functionNames).toContain(`auditTransaction-${environmentSuffix}`);
      expect(functionNames).toContain(`dailySummary-${environmentSuffix}`);
    });
  });

  describe('Stack Outputs', () => {
    test('should export API URL', () => {
      template.hasOutput('ApiUrl', {
        Description: 'Transaction API URL',
      });
    });

    test('should export Table Name', () => {
      template.hasOutput('TableName', {
        Description: 'DynamoDB Table Name',
      });
    });

    test('should export Queue URL', () => {
      template.hasOutput('QueueUrl', {
        Description: 'SQS Queue URL',
      });
    });

    test('should export Bucket Name', () => {
      template.hasOutput('BucketName', {
        Description: 'S3 Bucket for Reports',
      });
    });
  });

  describe('Resource Count', () => {
    test('should create all required resources', () => {
      // Verify minimum resource counts
      const resources = template.toJSON().Resources;
      const resourceTypes = Object.values(resources).map(
        (r: any) => r.Type
      );

      expect(
        resourceTypes.filter((t) => t === 'AWS::DynamoDB::Table').length
      ).toBe(1);
      expect(
        resourceTypes.filter((t) => t === 'AWS::SQS::Queue').length
      ).toBe(2);
      expect(
        resourceTypes.filter((t) => t === 'AWS::S3::Bucket').length
      ).toBe(1);
      expect(
        resourceTypes.filter((t) => t === 'AWS::Lambda::Function').length
      ).toBeGreaterThanOrEqual(3);
      expect(
        resourceTypes.filter((t) => t === 'AWS::ApiGateway::RestApi').length
      ).toBe(1);
      expect(
        resourceTypes.filter((t) => t === 'AWS::Events::Rule').length
      ).toBe(1);
      expect(
        resourceTypes.filter((t) => t === 'AWS::CloudWatch::Alarm').length
      ).toBe(2);
    });
  });
});
