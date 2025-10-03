import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { FoodDeliveryStack } from '../lib/food-delivery-stack';

describe('FoodDeliveryStack', () => {
  let app: cdk.App;
  let stack: FoodDeliveryStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';
    stack = new FoodDeliveryStack(app, `FoodDeliveryStack${environmentSuffix}`, {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('DynamoDB Table', () => {
    test('creates orders table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'orderId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
        AttributeDefinitions: Match.arrayWith([
          {
            AttributeName: 'orderId',
            AttributeType: 'S',
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'N',
          },
          {
            AttributeName: 'customerId',
            AttributeType: 'S',
          },
        ]),
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });

    test('creates global secondary index for customer queries', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: Match.arrayWith([
          {
            IndexName: 'customerIdIndex',
            KeySchema: [
              {
                AttributeName: 'customerId',
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
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5,
            },
          },
        ]),
      });
    });

    test('configures auto-scaling for read and write capacity', () => {
      template.hasResourceProperties(
        'AWS::ApplicationAutoScaling::ScalableTarget',
        {
          MinCapacity: 5,
          MaxCapacity: 100,
          ServiceNamespace: 'dynamodb',
          ScalableDimension: Match.anyValue(),
        }
      );

      template.hasResourceProperties(
        'AWS::ApplicationAutoScaling::ScalingPolicy',
        {
          PolicyType: 'TargetTrackingScaling',
          TargetTrackingScalingPolicyConfiguration: {
            TargetValue: 70,
          },
        }
      );
    });
  });

  describe('Lambda Functions', () => {
    test('creates order processing function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Timeout: 30,
        MemorySize: 1024,
        ReservedConcurrentExecutions: 100,
        TracingConfig: {
          Mode: 'Active',
        },
        Environment: {
          Variables: Match.objectLike({
            TABLE_NAME: Match.anyValue(),
            DLQ_URL: Match.anyValue(),
            POWERTOOLS_SERVICE_NAME: 'food-delivery-api',
            POWERTOOLS_METRICS_NAMESPACE: 'FoodDelivery',
            LOG_LEVEL: 'INFO',
          }),
        },
      });
    });

    test('creates query orders function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Timeout: 10,
        MemorySize: 512,
        TracingConfig: {
          Mode: 'Active',
        },
        Environment: {
          Variables: Match.objectLike({
            TABLE_NAME: Match.anyValue(),
            POWERTOOLS_SERVICE_NAME: 'food-delivery-api',
            POWERTOOLS_METRICS_NAMESPACE: 'FoodDelivery',
            LOG_LEVEL: 'INFO',
          }),
        },
      });
    });

    test('configures dead letter queue for order processing', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        DeadLetterConfig: {
          TargetArn: Match.anyValue(),
        },
      });
    });
  });

  describe('API Gateway', () => {
    test('creates REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: Match.stringLikeRegexp('food-delivery-api-.*'),
        Description: 'Food Delivery REST API',
      });
    });

    test('enables API Gateway tracing', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        TracingEnabled: true,
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            DataTraceEnabled: true,
            LoggingLevel: 'INFO',
            MetricsEnabled: true,
            ResourcePath: '/*',
            HttpMethod: '*',
          }),
        ]),
      });
    });

    test('creates API key for partner integrations', () => {
      template.hasResourceProperties('AWS::ApiGateway::ApiKey', {
        Name: Match.stringLikeRegexp('food-delivery-key-.*'),
        Description: 'API key for partner integrations',
      });
    });

    test('creates usage plan with throttling', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        UsagePlanName: Match.stringLikeRegexp('food-delivery-usage-.*'),
        Throttle: {
          RateLimit: 100,
          BurstLimit: 200,
        },
        Quota: {
          Limit: 10000,
          Period: 'DAY',
        },
      });
    });

    test('creates request validator', () => {
      template.hasResourceProperties('AWS::ApiGateway::RequestValidator', {
        Name: 'validate-request-body-and-params',
        ValidateRequestBody: true,
        ValidateRequestParameters: true,
      });
    });

    test('creates order model for validation', () => {
      template.hasResourceProperties('AWS::ApiGateway::Model', {
        Name: 'OrderModel',
        ContentType: 'application/json',
        Schema: Match.objectLike({
          type: 'object',
          required: ['customerId', 'items', 'deliveryAddress'],
        }),
      });
    });
  });

  describe('SQS Dead Letter Queue', () => {
    test('creates DLQ with correct configuration', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: Match.stringLikeRegexp('food-delivery-dlq-.*'),
        MessageRetentionPeriod: 1209600, // 14 days
      });
    });

    test('enables server-side encryption for DLQ', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: Match.stringLikeRegexp('food-delivery-dlq-.*'),
        KmsMasterKeyId: 'alias/aws/sqs',
      });
    });
  });

  describe('Parameter Store', () => {
    test('creates table name parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: Match.stringLikeRegexp('/food-delivery/.*/table-name'),
        Type: 'String',
        Description: 'DynamoDB table name for orders',
      });
    });

    test('creates API config parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: Match.stringLikeRegexp('/food-delivery/.*/api-config'),
        Type: 'String',
        Description: 'API configuration parameters',
        Value: Match.stringLikeRegexp('.*maxOrdersPerHour.*'),
      });
    });

    test('creates feature flags parameter as String', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: Match.stringLikeRegexp('/food-delivery/.*/feature-flags'),
        Type: 'String',
        Description: 'Feature flags for gradual rollouts',
      });
    });
  });

  describe('CloudWatch', () => {
    test('creates high error rate alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Errors',
        Threshold: 1,
        EvaluationPeriods: 2,
        Statistic: 'Average',
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('creates CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('food-delivery-dashboard-.*'),
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('creates Lambda execution role with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
        ManagedPolicyArns: Match.anyValue(),
      });
    });

    test('grants DynamoDB permissions to Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
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
            }),
          ]),
        },
      });
    });

    test('grants SSM parameter access to Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: ['ssm:GetParameter', 'ssm:GetParameters'],
            }),
          ]),
        },
      });
    });

    test('grants SQS DLQ send permissions to Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith(['sqs:SendMessage']),
            }),
          ]),
        },
      });
    });
  });

  describe('SNS Topic', () => {
    test('creates SNS topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Food Delivery API Alerts',
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('exports API URL', () => {
      template.hasOutput('ApiUrl', {
        Description: 'Food Delivery API URL',
      });
    });

    test('exports API Key ID', () => {
      template.hasOutput('ApiKeyId', {
        Description: 'API Key ID for partner integrations',
      });
    });

    test('exports Dashboard URL', () => {
      template.hasOutput('DashboardUrl', {
        Description: 'CloudWatch Dashboard URL',
      });
    });
  });

  describe('Resource Naming', () => {
    test('all resources include stack name for uniqueness', () => {
      // Check DynamoDB table
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('.*FoodDeliveryStack.*'),
      });

      // Check API Gateway
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: Match.stringLikeRegexp('.*food-delivery-api.*'),
      });

      // Check SQS Queue
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: Match.stringLikeRegexp('.*food-delivery-dlq.*'),
      });
    });
  });

  describe('Security Best Practices', () => {
    test('DynamoDB table has encryption enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });

    test('SQS queue has KMS encryption', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        KmsMasterKeyId: Match.anyValue(),
      });
    });

    test('Lambda functions have X-Ray tracing enabled', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('API Gateway requires API key for all endpoints', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        ApiKeyRequired: true,
      });
    });
  });
});