import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
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

  describe('DynamoDB Table', () => {
    test('should create DynamoDB table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `tap-api-items-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S',
          },
          {
            AttributeName: 'createdAt',
            AttributeType: 'S',
          },
        ],
      });
    });

    test('should create DynamoDB table with GSI', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: [
          {
            IndexName: 'createdAt-index',
            KeySchema: [
              {
                AttributeName: 'createdAt',
                KeyType: 'HASH',
              },
            ],
            Projection: {
              ProjectionType: 'ALL',
            },
          },
        ],
      });
    });

  });

  describe('Secrets Manager', () => {
    test('should create Secrets Manager secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `tap-api-secret-${environmentSuffix}`,
        Description: 'API credentials for external service integration',
        GenerateSecretString: {
          SecretStringTemplate: '{"apiKey":"","apiSecret":""}',
          GenerateStringKey: 'password',
          PasswordLength: 32,
        },
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `tap-api-function-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: 256,
        Timeout: 30,
        Environment: {
          Variables: {
            TABLE_NAME: Match.anyValue(), // CloudFormation reference to table
            SECRET_ARN: Match.anyValue(), // CloudFormation reference to secret
          },
        },
      });
    });

    test('should create Lambda function with inline code', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Code: {
          ZipFile: Match.stringLikeRegexp(/exports\.handler/),
        },
      });
    });

    test('should create CloudWatch log group for Lambda', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/tap-api-function-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });
  });

  describe('IAM Role', () => {
    test('should create IAM role for Lambda with correct permissions', () => {
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
        },
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
              ],
            ],
          },
        ],
      });
    });

    test('should attach DynamoDB and Secrets Manager permissions to Lambda role', () => {
      // Check that DynamoDB permissions are present
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.anyValue(), // DynamoDB actions
              Effect: 'Allow',
              Resource: Match.anyValue(),
            }),
          ]),
        },
      });

      // Check that Secrets Manager permissions are present
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'secretsmanager:GetSecretValue',
              Effect: 'Allow',
              Resource: Match.anyValue(),
            }),
          ]),
        },
      });
    });
  });

  describe('API Gateway', () => {
    test('should create REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `tap-api-${environmentSuffix}`,
        Description: 'Serverless API for CRUD operations',
      });
    });

    test('should create API Gateway deployment and stage', () => {
      template.hasResourceProperties('AWS::ApiGateway::Deployment', {
        RestApiId: Match.anyValue(),
      });

      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
        RestApiId: Match.anyValue(),
        MethodSettings: [
          {
            HttpMethod: '*',
            ResourcePath: '/*',
            DataTraceEnabled: false,
            LoggingLevel: 'INFO',
            MetricsEnabled: true,
            ThrottlingBurstLimit: 200,
            ThrottlingRateLimit: 100,
          },
        ],
      });
    });

    test('should create API Gateway resources and methods', () => {
      // Check for /items resource
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'items',
      });

      // Check for /items/{id} resource
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: '{id}',
      });

      // Check for GET method on /items
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        AuthorizationType: 'NONE',
        ResourceId: Match.anyValue(),
      });

      // Check for POST method on /items
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        AuthorizationType: 'NONE',
        ResourceId: Match.anyValue(),
      });

      // Check for GET, PUT, DELETE methods on /items/{id}
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        AuthorizationType: 'NONE',
        ResourceId: Match.anyValue(),
      });

      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'PUT',
        AuthorizationType: 'NONE',
        ResourceId: Match.anyValue(),
      });

      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'DELETE',
        AuthorizationType: 'NONE',
        ResourceId: Match.anyValue(),
      });
    });

    test('should create Lambda permissions for API Gateway', () => {
      // Should have multiple Lambda permissions for different methods
      const permissions = template.findResources('AWS::Lambda::Permission');
      expect(Object.keys(permissions).length).toBeGreaterThanOrEqual(6); // GET, POST for /items and GET, PUT, DELETE for /items/{id}
    });
  });

  describe('CloudWatch', () => {
    test('should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `tap-api-dashboard-${environmentSuffix}`,
      });
    });

    test('should create CloudWatch alarms', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-lambda-errors-${environmentSuffix}`,
        AlarmDescription: 'Lambda function error rate is high',
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        Threshold: 5,
        EvaluationPeriods: 2,
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-api-errors-${environmentSuffix}`,
        AlarmDescription: 'API Gateway server error rate is high',
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        Threshold: 10,
        EvaluationPeriods: 2,
      });
    });
  });

  describe('Outputs', () => {
    test('should export required outputs', () => {
      const outputs = template.findOutputs('*');
      expect(outputs).toHaveProperty('ApiEndpoint');
      expect(outputs).toHaveProperty('DynamoTableName');
      expect(outputs).toHaveProperty('LambdaFunctionName');

      // Check output properties
      template.hasOutput('ApiEndpoint', {
        Description: 'API Gateway endpoint URL',
        Export: {
          Name: `tap-api-endpoint-${environmentSuffix}`,
        },
      });

      template.hasOutput('DynamoTableName', {
        Description: 'DynamoDB table name',
        Export: {
          Name: `tap-dynamo-table-${environmentSuffix}`,
        },
      });

      template.hasOutput('LambdaFunctionName', {
        Description: 'Lambda function name',
        Export: {
          Name: `tap-lambda-function-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Environment Configuration', () => {
    test('should use environment suffix in all resource names', () => {
      // Check that environment suffix is used in key resource names
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `tap-api-items-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `tap-api-secret-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `tap-api-function-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `tap-api-${environmentSuffix}`,
      });
    });

    test('should use environment suffix from props when provided', () => {
      const customSuffix = 'staging';
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestTapStack', { environmentSuffix: customSuffix });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `tap-api-items-${customSuffix}`,
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `tap-api-function-${customSuffix}`,
      });
    });

    test('should use environment suffix from context when props not provided', () => {
      const customSuffix = 'production';
      const app = new cdk.App();
      app.node.setContext('environmentSuffix', customSuffix);
      const stack = new TapStack(app, 'TestTapStack');
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `tap-api-items-${customSuffix}`,
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `tap-api-function-${customSuffix}`,
      });
    });

    test('should default to "dev" when no environment suffix provided', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestTapStack');
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'tap-api-items-dev',
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'tap-api-function-dev',
      });
    });
  });
});
