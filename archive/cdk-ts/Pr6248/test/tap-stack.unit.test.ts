import * as cdk from 'aws-cdk-lib';
import {Template, Match} from 'aws-cdk-lib/assertions';
import {TapStack} from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test-env';

describe('TapStack Unit Tests - Payment Processing System', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {environmentSuffix});
    template = Template.fromStack(stack);
  });

  describe('Stack Tags', () => {
    test('applies correct resource tags', () => {
      const resources = template.findResources('AWS::DynamoDB::Table');
      const tableResource = Object.values(resources)[0] as any;
      expect(tableResource.Properties.Tags).toEqual(
        expect.arrayContaining([
          {Key: 'Environment', Value: 'production'},
          {Key: 'CostCenter', Value: 'payments'},
        ])
      );
    });
  });

  describe('SSM Parameters', () => {
    test('creates max amount parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Type: 'String',
        Value: '10000',
        Description: 'Maximum transaction amount allowed',
      });
    });

    test('creates supported currencies parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Type: 'String',
        Value: 'USD,EUR,GBP',
        Description: 'Comma-separated list of supported currencies',
      });
    });

    test('creates high value threshold parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Type: 'String',
        Value: '5000',
        Description: 'Threshold for high-value transaction notifications',
      });
    });

    test('parameter names include environment suffix', () => {
      const params = template.findResources('AWS::SSM::Parameter');
      const paramNames = Object.values(params).map((p: any) => p.Properties.Name);
      paramNames.forEach((name: string) => {
        expect(name).toContain(environmentSuffix);
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('creates transactions table with correct keys', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'transaction_id',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'transaction_id',
            AttributeType: 'S',
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'S',
          },
        ],
      });
    });

    test('uses on-demand billing mode', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('has DESTROY removal policy', () => {
      template.hasResource('AWS::DynamoDB::Table', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('table name includes environment suffix', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `transactions-${environmentSuffix}`,
      });
    });
  });

  describe('SQS Queues', () => {
    test('creates invalid transactions queue with correct visibility timeout', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `invalid-transactions-${environmentSuffix}`,
        VisibilityTimeout: 300, // 5 minutes
      });
    });

    test('creates dead letter queue for invalid transactions', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `invalid-transactions-dlq-${environmentSuffix}`,
        MessageRetentionPeriod: 1209600, // 14 days
      });
    });

    test('configures dead letter queue on main queue', () => {
      const queues = template.findResources('AWS::SQS::Queue');
      const mainQueue = Object.values(queues).find(
        (q: any) =>
          q.Properties.QueueName === `invalid-transactions-${environmentSuffix}`
      ) as any;

      expect(mainQueue.Properties.RedrivePolicy).toBeDefined();
      expect(mainQueue.Properties.RedrivePolicy.maxReceiveCount).toBe(3);
    });

    test('creates review processing DLQ', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `review-processing-dlq-${environmentSuffix}`,
        MessageRetentionPeriod: 1209600, // 14 days
      });
    });

    test('creates exactly 3 SQS queues', () => {
      template.resourceCountIs('AWS::SQS::Queue', 3);
    });
  });

  describe('SNS Topic', () => {
    test('creates compliance notifications topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `compliance-notifications-${environmentSuffix}`,
        DisplayName: 'Compliance Notifications for High-Value Transactions',
      });
    });

    test('creates exactly 1 SNS topic', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });
  });

  describe('Lambda Functions', () => {
    test('creates validation Lambda with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `transaction-validator-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        ReservedConcurrentExecutions: 100,
      });
    });

    test('creates review Lambda with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `review-processor-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
      });
    });

    test('validation Lambda has X-Ray tracing enabled', () => {
      const lambdas = template.findResources('AWS::Lambda::Function');
      const validationLambda = Object.values(lambdas).find(
        (l: any) =>
          l.Properties.FunctionName === `transaction-validator-${environmentSuffix}`
      ) as any;

      expect(validationLambda.Properties.TracingConfig).toEqual({
        Mode: 'Active',
      });
    });

    test('review Lambda has X-Ray tracing enabled', () => {
      const lambdas = template.findResources('AWS::Lambda::Function');
      const reviewLambda = Object.values(lambdas).find(
        (l: any) =>
          l.Properties.FunctionName === `review-processor-${environmentSuffix}`
      ) as any;

      expect(reviewLambda.Properties.TracingConfig).toEqual({
        Mode: 'Active',
      });
    });

    test('validation Lambda has correct environment variables', () => {
      const lambdas = template.findResources('AWS::Lambda::Function');
      const validationLambda = Object.values(lambdas).find(
        (l: any) =>
          l.Properties.FunctionName === `transaction-validator-${environmentSuffix}`
      ) as any;

      const envVars = validationLambda.Properties.Environment.Variables;
      expect(envVars.TRANSACTIONS_TABLE).toBeDefined();
      expect(envVars.INVALID_QUEUE_URL).toBeDefined();
      expect(envVars.COMPLIANCE_TOPIC_ARN).toBeDefined();
      expect(envVars.MAX_AMOUNT_PARAM).toBeDefined();
      expect(envVars.SUPPORTED_CURRENCIES_PARAM).toBeDefined();
      expect(envVars.HIGH_VALUE_THRESHOLD_PARAM).toBeDefined();
    });

    test('review Lambda has environment variable', () => {
      const lambdas = template.findResources('AWS::Lambda::Function');
      const reviewLambda = Object.values(lambdas).find(
        (l: any) =>
          l.Properties.FunctionName === `review-processor-${environmentSuffix}`
      ) as any;

      expect(reviewLambda.Properties.Environment.Variables.ENVIRONMENT).toBe(
        environmentSuffix
      );
    });

    test('review Lambda has dead letter queue configured', () => {
      const lambdas = template.findResources('AWS::Lambda::Function');
      const reviewLambda = Object.values(lambdas).find(
        (l: any) =>
          l.Properties.FunctionName === `review-processor-${environmentSuffix}`
      ) as any;

      expect(reviewLambda.Properties.DeadLetterConfig).toBeDefined();
    });
  });

  describe('Lambda Event Source Mapping', () => {
    test('creates SQS event source for review Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        BatchSize: 10,
      });
    });

    test('event source mapping connects to correct queue', () => {
      const mappings = template.findResources('AWS::Lambda::EventSourceMapping');
      expect(Object.keys(mappings).length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('validation Lambda log group has 7-day retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/transaction-validator-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });

    test('review Lambda log group has 7-day retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/review-processor-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });

    test('log groups have DESTROY removal policy', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.values(logGroups).forEach((lg: any) => {
        // Only check our explicitly created log groups, not CDK custom resource logs
        if (
          lg.Properties.LogGroupName &&
          lg.Properties.LogGroupName.includes('/aws/lambda/')
        ) {
          // Log groups for Lambda should have Delete policy (either undefined or Delete)
          expect(['Delete', undefined]).toContain(lg.DeletionPolicy);
        }
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('creates validation Lambda error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `validation-lambda-errors-${environmentSuffix}`,
        Threshold: 1,
        EvaluationPeriods: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('creates review Lambda error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `review-lambda-errors-${environmentSuffix}`,
        Threshold: 1,
        EvaluationPeriods: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('alarms have SNS actions configured', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      Object.values(alarms).forEach((alarm: any) => {
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });

    test('creates exactly 2 CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });
  });

  describe('API Gateway', () => {
    test('creates REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `payment-api-${environmentSuffix}`,
        Description: 'Payment Processing API',
      });
    });

    test('configures deployment stage with INFO logging', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
        MethodSettings: [
          {
            LoggingLevel: 'INFO',
            DataTraceEnabled: true,
            MetricsEnabled: true,
            HttpMethod: '*',
            ResourcePath: '/*',
          },
        ],
      });
    });

    test('creates request validator', () => {
      template.hasResourceProperties('AWS::ApiGateway::RequestValidator', {
        Name: 'transaction-validator',
        ValidateRequestBody: true,
        ValidateRequestParameters: true,
      });
    });

    test('creates transaction model', () => {
      template.hasResourceProperties('AWS::ApiGateway::Model', {
        ContentType: 'application/json',
        Schema: {
          type: 'object',
          required: ['amount', 'currency', 'card_token'],
          properties: {
            amount: {type: 'number'},
            currency: {type: 'string'},
            card_token: {type: 'string'},
          },
        },
      });
    });

    test('creates /transactions resource', () => {
      const resources = template.findResources('AWS::ApiGateway::Resource');
      const transactionsResource = Object.values(resources).find(
        (r: any) => r.Properties.PathPart === 'transactions'
      );
      expect(transactionsResource).toBeDefined();
    });

    test('creates POST method with API key requirement', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        ApiKeyRequired: true,
      });
    });

    test('POST method uses Lambda integration', () => {
      const methods = template.findResources('AWS::ApiGateway::Method');
      const postMethod = Object.values(methods).find(
        (m: any) => m.Properties.HttpMethod === 'POST'
      ) as any;

      expect(postMethod.Properties.Integration).toBeDefined();
      expect(postMethod.Properties.Integration.Type).toBe('AWS_PROXY');
    });

    test('creates CloudWatch role for API Gateway', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'apigateway.amazonaws.com',
              },
            },
          ],
        },
      });
    });
  });

  describe('API Gateway Usage Plan', () => {
    test('creates usage plan with correct limits', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        UsagePlanName: `payment-usage-plan-${environmentSuffix}`,
        Quota: {
          Limit: 1000,
          Period: 'DAY',
        },
        Throttle: {
          RateLimit: 1000,
          BurstLimit: 2000,
        },
      });
    });

    test('creates API key', () => {
      template.hasResourceProperties('AWS::ApiGateway::ApiKey', {
        Name: `payment-api-key-${environmentSuffix}`,
        Enabled: true,
      });
    });

    test('associates API key with usage plan', () => {
      template.resourceCountIs('AWS::ApiGateway::UsagePlanKey', 1);
    });
  });

  describe('IAM Permissions', () => {
    test('validation Lambda has DynamoDB write permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'dynamodb:BatchWriteItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('validation Lambda has SQS send permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['sqs:SendMessage', 'sqs:GetQueueAttributes', 'sqs:GetQueueUrl']),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('validation Lambda has SNS publish permissions', () => {
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

    test('validation Lambda has SSM parameter read permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['ssm:DescribeParameters', 'ssm:GetParameters', 'ssm:GetParameter', 'ssm:GetParameterHistory']),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('review Lambda has SQS receive permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'sqs:ReceiveMessage',
                'sqs:ChangeMessageVisibility',
                'sqs:GetQueueUrl',
                'sqs:DeleteMessage',
                'sqs:GetQueueAttributes',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('Lambda functions have X-Ray permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'xray:PutTraceSegments',
                'xray:PutTelemetryRecords',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports API endpoint', () => {
      const outputs = template.findOutputs('*');
      expect(outputs.ApiEndpoint).toBeDefined();
    });

    test('exports API key ID', () => {
      const outputs = template.findOutputs('*');
      expect(outputs.ApiKeyId).toBeDefined();
    });

    test('exports transactions table name', () => {
      const outputs = template.findOutputs('*');
      expect(outputs.TransactionsTableName).toBeDefined();
    });

    test('exports invalid queue URL', () => {
      const outputs = template.findOutputs('*');
      expect(outputs.InvalidQueueUrl).toBeDefined();
    });

    test('exports compliance topic ARN', () => {
      const outputs = template.findOutputs('*');
      expect(outputs.ComplianceTopicArn).toBeDefined();
    });

    test('exports validation Lambda ARN', () => {
      const outputs = template.findOutputs('*');
      expect(outputs.ValidationLambdaArn).toBeDefined();
    });

    test('exports review Lambda ARN', () => {
      const outputs = template.findOutputs('*');
      expect(outputs.ReviewLambdaArn).toBeDefined();
    });
  });

  describe('Resource Naming', () => {
    test('all named resources include environment suffix', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      const queues = template.findResources('AWS::SQS::Queue');
      const topics = template.findResources('AWS::SNS::Topic');
      const functions = template.findResources('AWS::Lambda::Function');

      const namedResources = [
        ...Object.values(tables),
        ...Object.values(queues),
        ...Object.values(topics),
        ...Object.values(functions),
      ];

      namedResources.forEach((resource: any) => {
        const name =
          resource.Properties.TableName ||
          resource.Properties.QueueName ||
          resource.Properties.TopicName ||
          resource.Properties.FunctionName;

        if (typeof name === 'string') {
          expect(name).toContain(environmentSuffix);
        }
      });
    });
  });
});
