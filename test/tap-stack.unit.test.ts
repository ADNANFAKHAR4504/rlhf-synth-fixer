import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Environment Suffix Configuration', () => {
    test('uses environmentSuffix from props when provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', { environmentSuffix: 'test' });
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'tap-data-table-test',
      });
    });

    test('uses environmentSuffix from context when props not provided', () => {
      const testApp = new cdk.App({
        context: {
          environmentSuffix: 'staging',
        },
      });
      const testStack = new TapStack(testApp, 'TestStack', {});
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'tap-data-table-staging',
      });
    });

    test('defaults to dev when no environmentSuffix provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {});
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'tap-data-table-dev',
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('creates DynamoDB table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `tap-data-table-${environmentSuffix}`,
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S',
          },
          {
            AttributeName: 'createdAt',
            AttributeType: 'N',
          },
        ],
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'createdAt',
            KeyType: 'RANGE',
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('has exactly one DynamoDB table', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });
  });

  describe('Lambda Functions', () => {
    test('creates API Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `tap-api-lambda-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: 128,
        Timeout: 10,
        TracingConfig: {
          Mode: 'Active',
        },
        Environment: {
          Variables: Match.objectLike({
            ENVIRONMENT: environmentSuffix,
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
          }),
        },
      });
    });

    test('creates Stream Processor Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `tap-stream-processor-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: 128,
        Timeout: 10,
        TracingConfig: {
          Mode: 'Active',
        },
        Environment: {
          Variables: {
            ENVIRONMENT: environmentSuffix,
          },
        },
      });
    });

    test('creates exactly two Lambda functions', () => {
      template.resourceCountIs('AWS::Lambda::Function', 2);
    });

    test('creates Lambda event source mapping for DynamoDB stream', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        BatchSize: 10,
        MaximumBatchingWindowInSeconds: 5,
        MaximumRetryAttempts: 3,
        StartingPosition: 'LATEST',
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('creates API Lambda IAM role with correct basic properties', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-api-lambda-role-${environmentSuffix}`,
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
          Version: '2012-10-17',
        },
      });
    });

    test('creates Stream Lambda IAM role with correct basic properties', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-stream-lambda-role-${environmentSuffix}`,
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
          Version: '2012-10-17',
        },
      });
    });

    test('creates inline policies for IAM roles', () => {
      // Check that API Lambda role has inline DynamoDB policy
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-api-lambda-role-${environmentSuffix}`,
        Policies: Match.arrayWith([
          {
            PolicyName: 'DynamoDBAccess',
            PolicyDocument: Match.objectLike({
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    'dynamodb:GetItem',
                    'dynamodb:PutItem',
                    'dynamodb:UpdateItem',
                    'dynamodb:DeleteItem',
                  ]),
                }),
              ]),
            }),
          },
        ]),
      });
    });

    test('creates exactly three IAM roles', () => {
      template.resourceCountIs('AWS::IAM::Role', 3); // 2 Lambda roles + 1 API Gateway CloudWatch role
    });
  });

  describe('API Gateway', () => {
    test('creates REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `tap-rest-api-${environmentSuffix}`,
        Description: `TAP REST API for ${environmentSuffix} environment`,
      });
    });

    test('creates API Gateway deployment stage', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: environmentSuffix,
        TracingEnabled: true,
        MethodSettings: [
          {
            DataTraceEnabled: true,
            HttpMethod: '*',
            LoggingLevel: 'INFO',
            MetricsEnabled: true,
            ResourcePath: '/*',
          },
        ],
      });
    });

    test('creates correct API Gateway resources and methods', () => {
      // Check for items resource
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'items',
      });

      // Check for GET method on items
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
      });

      // Check for POST method on items
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
      });

      // Check for PUT method
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'PUT',
      });

      // Check for DELETE method
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'DELETE',
      });
    });

    test('creates exactly one REST API', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    });
  });

  describe('CloudWatch Components', () => {
    test('creates CloudWatch log groups', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/tap-api-lambda-${environmentSuffix}`,
        RetentionInDays: 7,
      });

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/tap-stream-processor-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });

    test('creates CloudWatch alarms for monitoring', () => {
      // API Lambda Error Alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-api-lambda-errors-${environmentSuffix}`,
        AlarmDescription: 'Alarm for API Lambda function errors',
        Threshold: 1,
        EvaluationPeriods: 1,
      });

      // Stream Processor Error Alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-stream-processor-errors-${environmentSuffix}`,
        AlarmDescription: 'Alarm for Stream Processor Lambda function errors',
        Threshold: 1,
        EvaluationPeriods: 1,
      });

      // API Gateway 4XX Error Alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-api-gateway-4xx-errors-${environmentSuffix}`,
        AlarmDescription: 'Alarm for API Gateway 4XX errors',
        Threshold: 10,
        EvaluationPeriods: 2,
      });

      // API Gateway 5XX Error Alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-api-gateway-5xx-errors-${environmentSuffix}`,
        AlarmDescription: 'Alarm for API Gateway 5XX errors',
        Threshold: 5,
        EvaluationPeriods: 1,
      });
    });

    test('creates exactly two log groups', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 2);
    });

    test('creates exactly four CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 4);
    });
  });

  describe('Stack Outputs', () => {
    test('creates stack outputs with correct properties', () => {
      const outputs = template.findOutputs('*');
      
      expect(outputs).toHaveProperty('ApiGatewayUrl');
      expect(outputs).toHaveProperty('DynamoDBTableName');
      expect(outputs).toHaveProperty('ApiLambdaFunctionName');
      expect(outputs).toHaveProperty('StreamProcessorFunctionName');

      expect(outputs.ApiGatewayUrl.Description).toBe('API Gateway URL');
      expect(outputs.DynamoDBTableName.Description).toBe('DynamoDB Table Name');
      expect(outputs.ApiLambdaFunctionName.Description).toBe('API Lambda Function Name');
      expect(outputs.StreamProcessorFunctionName.Description).toBe('Stream Processor Lambda Function Name');
    });
  });

  describe('X-Ray Tracing', () => {
    test('enables X-Ray tracing for Lambda functions', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('enables X-Ray tracing for API Gateway', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        TracingEnabled: true,
      });
    });
  });

  describe('CORS Configuration', () => {
    test('configures CORS for API Gateway methods', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
        Integration: {
          Type: 'MOCK',
          IntegrationResponses: [
            {
              StatusCode: '204',
              ResponseParameters: {
                'method.response.header.Access-Control-Allow-Headers':
                  "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
                'method.response.header.Access-Control-Allow-Origin': "'https://localhost:3000'",
                'method.response.header.Access-Control-Allow-Methods':
                  "'GET,POST,PUT,DELETE,OPTIONS'",
                'method.response.header.Vary': "'Origin'",
              },
            },
          ],
        },
      });
    });
  });
});
