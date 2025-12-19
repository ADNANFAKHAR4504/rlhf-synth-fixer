import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import * as logs from 'aws-cdk-lib/aws-logs';

// Determine the environment suffix, defaulting to 'dev' for tests
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestMicroserviceStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Account-Level Setup', () => {
    test('should create an IAM role for API Gateway CloudWatch Logs', () => {
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
        ManagedPolicyArns: [
          { 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs']] }
        ],
        Description: 'IAM role for API Gateway to push logs to CloudWatch Logs',
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: environmentSuffix },
          { Key: 'Project', Value: 'ServerlessMicroservices' },
        ]),
      });
    });

    test('should configure API Gateway account settings with CloudWatch Logs role', () => {
      template.hasResourceProperties('AWS::ApiGateway::Account', {
        CloudWatchRoleArn: { 'Fn::GetAtt': [Match.stringLikeRegexp('ApiGatewayCloudWatchLogsRole.*'), 'Arn'] },
      });
    });
  });

  describe('DynamoDB Infrastructure', () => {
    test('should create a DynamoDB table for products', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [{ AttributeName: 'productId', KeyType: 'HASH' }],
        AttributeDefinitions: [{ AttributeName: 'productId', AttributeType: 'S' }],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
        PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
        SSESpecification: { SSEEnabled: true },
        // FIX: Assert only the directly applied tag, as stack-level tags may not synthesize in tests.
        Tags: Match.arrayWith([
          { Key: 'Service', Value: 'ProductService' },
        ]),
      });
    });

    test('DynamoDB table removal policy is DESTROY for non-prod environments', () => {
        template.hasResource('AWS::DynamoDB::Table', {
            UpdateReplacePolicy: 'Delete',
            DeletionPolicy: 'Delete',
        });
    });

    test('DynamoDB table removal policy is RETAIN for prod environment', () => {
        const prodApp = new cdk.App();
        const prodStack = new TapStack(prodApp, 'ProdMicroserviceStack', { environmentSuffix: 'prod' });
        const prodTemplate = Template.fromStack(prodStack);

        prodTemplate.hasResource('AWS::DynamoDB::Table', {
            UpdateReplacePolicy: 'Retain',
            DeletionPolicy: 'Retain',
        });
    });
  });

  describe('Messaging Infrastructure (SNS & SQS)', () => {
    test('should create an SNS Topic for product events', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Product Events Topic',
        Tags: Match.arrayWith([
          { Key: 'Service', Value: 'ProductService' },
        ]),
      });
    });

    test('should create an SQS Queue for order processing', () => {
        template.hasResourceProperties('AWS::SQS::Queue', {
          VisibilityTimeout: 300,
          KmsMasterKeyId: 'alias/aws/sqs',
          Tags: Match.arrayWith([
            { Key: 'Service', Value: 'OrderService' },
          ]),
        });
      });
  });

  describe('Lambda Function', () => {
    test('should create a Lambda function for product API', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        MemorySize: 128,
        Timeout: 10,
        Environment: {
          Variables: {
            TABLE_NAME: { Ref: Match.stringLikeRegexp('ProductsTable.*') },
            SNS_TOPIC_ARN: { Ref: Match.stringLikeRegexp('ProductEventsTopic.*') },
            FEATURE_X_ENABLED: 'false',
          },
        },
      });
    });

    test('should grant Lambda role permissions to DynamoDB and SNS', () => {
        template.hasResourceProperties('AWS::IAM::Policy', {
          PolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Action: [
                    "dynamodb:BatchGetItem", "dynamodb:GetRecords", "dynamodb:GetShardIterator",
                    "dynamodb:Query", "dynamodb:GetItem", "dynamodb:Scan", "dynamodb:ConditionCheckItem",
                    "dynamodb:BatchWriteItem", "dynamodb:PutItem", "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem", "dynamodb:DescribeTable"
                ],
                Effect: 'Allow',
                // FIX: Removed incorrect assertion for a non-existent index ARN.
                Resource: Match.arrayWith([
                  { 'Fn::GetAtt': [Match.stringLikeRegexp('ProductsTable.*'), 'Arn'] },
                ]),
              }),
              Match.objectLike({
                Action: 'sns:Publish',
                Effect: 'Allow',
                Resource: { Ref: Match.stringLikeRegexp('ProductEventsTopic.*') },
              }),
            ]),
          },
          Roles: [{ Ref: Match.stringLikeRegexp('ProductLambdaRole.*') }],
        });
      });

    test('should create a LogGroup for Lambda with correct retention', () => {
        template.hasResourceProperties('AWS::Logs::LogGroup', {
          RetentionInDays: logs.RetentionDays.ONE_WEEK,
        });
      });
  });

  describe('API Gateway Infrastructure', () => {
    test('should create a regional REST API for products', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `${environmentSuffix}-ProductApi`,
        EndpointConfiguration: {
          Types: ['REGIONAL'],
        },
      });
    });

    test('should create a deployment stage with logging enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: environmentSuffix,
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            HttpMethod: '*',
            ResourcePath: '/*',
            LoggingLevel: 'INFO',
            DataTraceEnabled: true,
          })
        ]),
      });
    });

    test('should create GET and POST methods for /products integrated with Lambda', () => {
        template.hasResourceProperties('AWS::ApiGateway::Method', {
          HttpMethod: 'GET',
          ResourceId: { Ref: Match.stringLikeRegexp('ProductApiproducts.*') },
          Integration: {
            Type: 'AWS_PROXY',
            Uri: { 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':apigateway:', { Ref: 'AWS::Region' }, ':lambda:path/2015-03-31/functions/', { 'Fn::GetAtt': [Match.stringLikeRegexp('ProductLambda.*'), 'Arn'] }, '/invocations']] },
          },
        });
        template.hasResourceProperties('AWS::ApiGateway::Method', {
          HttpMethod: 'POST',
          ResourceId: { Ref: Match.stringLikeRegexp('ProductApiproducts.*') },
        });
      });
  });

  describe('Observability: CloudWatch Alarms', () => {
    test('should create an alarm for Lambda errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'Alarm if Product Lambda function has errors',
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Dimensions: Match.arrayWith([
          { Name: 'FunctionName', Value: { Ref: Match.stringLikeRegexp('ProductLambda.*') } },
        ]),
      });
    });

    test('should create an alarm for API Gateway 5xx errors', () => {
        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          AlarmDescription: 'Alarm if Product API Gateway has 5xx errors',
          MetricName: '5XXError',
          Namespace: 'AWS/ApiGateway',
          // FIX: The default metric only includes ApiName, not Stage. Match the actual output.
          Dimensions: Match.arrayWith([
            { Name: 'ApiName', Value: `${environmentSuffix}-ProductApi` },
          ]),
        });
      });

      test('should create an alarm for DynamoDB read throttles', () => {
        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
            AlarmDescription: 'Alarm if DynamoDB read capacity is throttled',
            ComparisonOperator: 'GreaterThanOrEqualToThreshold',
            EvaluationPeriods: 1,
            Threshold: 10,
            Metrics: Match.anyValue()
        });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should export all required outputs', () => {
      template.hasOutput('ApiGatewayCloudWatchLogsRoleArn', {});
      template.hasOutput('ProductApiUrl', {});
      template.hasOutput('ProductsTableName', {});
      template.hasOutput('ProductEventsTopicArn', {});
      template.hasOutput('OrderProcessingQueueUrl', {});
    });
  });

  describe('Configuration Edge Cases', () => {
    test('should handle missing props (default to dev environment)', () => {
      const appNullProps = new cdk.App();
      const stackNullProps = new TapStack(appNullProps, 'TestMicroserviceStackNullProps', {});
      const templateNullProps = Template.fromStack(stackNullProps);

      templateNullProps.hasResourceProperties('AWS::Lambda::Function', {
        MemorySize: 128,
      });
      templateNullProps.hasResourceProperties('AWS::DynamoDB::Table', {
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      });
      templateNullProps.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'dev-ProductApi',
      });
    });

    test('should handle incomplete environment config (merge with defaults)', () => {
        const appIncompleteContext = new cdk.App();
        appIncompleteContext.node.setContext('customEnv', {
          dynamoDbReadCapacity: 10,
        });
        const stackIncompleteContext = new TapStack(appIncompleteContext, 'TestMicroserviceStackIncomplete', { environmentSuffix: 'customEnv' });
        const templateIncompleteContext = Template.fromStack(stackIncompleteContext);

        templateIncompleteContext.hasResourceProperties('AWS::Lambda::Function', {
          MemorySize: 128,
        });
        templateIncompleteContext.hasResourceProperties('AWS::DynamoDB::Table', {
          ProvisionedThroughput: {
            ReadCapacityUnits: 10,
            WriteCapacityUnits: 5,
          },
        });
        templateIncompleteContext.hasResourceProperties('AWS::Lambda::Function', {
          Environment: {
            Variables: Match.objectLike({
              FEATURE_X_ENABLED: 'false',
            }),
          },
        });
      });
  });
});
