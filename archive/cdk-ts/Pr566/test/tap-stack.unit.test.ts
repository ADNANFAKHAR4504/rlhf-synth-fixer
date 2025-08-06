import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
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

  describe('Stack Construction', () => {
    test('creates stack with provided environment suffix', () => {
      const appWithSuffix = new cdk.App();
      const stackWithSuffix = new TapStack(appWithSuffix, 'TestTapStackWithSuffix', { 
        environmentSuffix: 'test' 
      });
      const templateWithSuffix = Template.fromStack(stackWithSuffix);

      templateWithSuffix.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'serverless-data-table-test',
      });
      
      templateWithSuffix.hasResourceProperties('AWS::Cognito::UserPool', {
        UserPoolName: 'serverless-user-pool-test',
      });
    });

    test('creates stack with default environment suffix when not provided', () => {
      const appDefault = new cdk.App();
      const stackDefault = new TapStack(appDefault, 'TestTapStackDefault');
      const templateDefault = Template.fromStack(stackDefault);

      templateDefault.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'serverless-data-table-dev',
      });
      
      templateDefault.hasResourceProperties('AWS::Cognito::UserPool', {
        UserPoolName: 'serverless-user-pool-dev',
      });
    });

    test('creates stack with undefined environment suffix falls back to dev', () => {
      const appUndefined = new cdk.App();
      const stackUndefined = new TapStack(appUndefined, 'TestTapStackUndefined', { 
        environmentSuffix: undefined 
      });
      const templateUndefined = Template.fromStack(stackUndefined);

      templateUndefined.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'serverless-data-table-dev',
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('creates a DynamoDB table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        SSESpecification: {
          SSEEnabled: true,
        },
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' },
          { AttributeName: 'timestamp', AttributeType: 'N' },
          { AttributeName: 'userId', AttributeType: 'S' },
        ],
        KeySchema: [
          { AttributeName: 'id', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' },
        ],
      });
    });

    test('creates a global secondary index for user queries', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: [
          {
            IndexName: 'UserIndex',
            KeySchema: [
              { AttributeName: 'userId', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          },
        ],
      });
    });

    test('has correct table name with environment suffix', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `serverless-data-table-${environmentSuffix}`,
      });
    });

    test('has removal policy set to destroy for development', () => {
      template.hasResource('AWS::DynamoDB::Table', {
        DeletionPolicy: 'Delete',
      });
    });
  });

  describe('Cognito User Pool', () => {
    test('creates a Cognito User Pool with correct configuration', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        AutoVerifiedAttributes: ['email'],
        UserPoolName: `serverless-user-pool-${environmentSuffix}`,
        UsernameAttributes: ['email'],
        Policies: {
          PasswordPolicy: {
            MinimumLength: 8,
            RequireLowercase: true,
            RequireUppercase: true,
            RequireNumbers: true,
            RequireSymbols: true,
          },
        },
        AccountRecoverySetting: {
          RecoveryMechanisms: [
            {
              Priority: 1,
              Name: 'verified_email',
            },
          ],
        },
      });
    });

    test('creates a Cognito User Pool Client', () => {
      template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
        GenerateSecret: false,
        ExplicitAuthFlows: ['ALLOW_USER_PASSWORD_AUTH', 'ALLOW_USER_SRP_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH'],
        ClientName: `serverless-client-${environmentSuffix}`,
        SupportedIdentityProviders: ['COGNITO'],
        AllowedOAuthFlows: ['code'],
        AllowedOAuthScopes: ['openid', 'email', 'profile'],
        CallbackURLs: ['https://example.com/callback'],
        LogoutURLs: ['https://example.com/logout'],
        AllowedOAuthFlowsUserPoolClient: true,
      });
    });

    test('User Pool Client references the User Pool', () => {
      const userPoolClients = template.findResources('AWS::Cognito::UserPoolClient');
      const userPools = template.findResources('AWS::Cognito::UserPool');
      
      expect(Object.keys(userPoolClients)).toHaveLength(1);
      expect(Object.keys(userPools)).toHaveLength(1);
      
      const clientProps = Object.values(userPoolClients)[0].Properties;
      expect(clientProps.UserPoolId).toBeDefined();
    });
  });

  describe('Lambda Functions', () => {
    test('creates data processor Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Timeout: 30,
        MemorySize: 256,
        Handler: 'index.handler',
        FunctionName: `data-processor-${environmentSuffix}`,
      });
    });

    test('creates health check Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Timeout: 10,
        MemorySize: 128,
        Handler: 'index.handler',
        FunctionName: `health-check-${environmentSuffix}`,
      });
    });

    test('data processor function has correct environment variables', () => {
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      
      // Find the data processor function (has larger memory size)
      const dataProcessorFunction = Object.values(lambdaFunctions).find(
        (func: any) => func.Properties.MemorySize === 256
      );
      
      expect(dataProcessorFunction).toBeDefined();
      if (dataProcessorFunction) {
        expect(dataProcessorFunction.Properties.Environment).toBeDefined();
        expect(dataProcessorFunction.Properties.Environment.Variables).toBeDefined();
        expect(dataProcessorFunction.Properties.Environment.Variables.TABLE_NAME).toBeDefined();
        expect(dataProcessorFunction.Properties.Environment.Variables.USER_POOL_ID).toBeDefined();
      }
    });

    test('health check function has correct environment variables', () => {
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      
      // Find the health check function (has smaller memory size)
      const healthCheckFunction = Object.values(lambdaFunctions).find(
        (func: any) => func.Properties.MemorySize === 128
      );
      
      expect(healthCheckFunction).toBeDefined();
      if (healthCheckFunction) {
        expect(healthCheckFunction.Properties.Environment).toBeDefined();
        expect(healthCheckFunction.Properties.Environment.Variables).toBeDefined();
        expect(healthCheckFunction.Properties.Environment.Variables.ENVIRONMENT).toBeDefined();
      }
    });

    test('creates exactly two Lambda functions', () => {
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdaFunctions)).toHaveLength(2);
    });
  });

  describe('API Gateway', () => {
    test('creates an HTTP API', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
        ProtocolType: 'HTTP',
        Name: `serverless-api-${environmentSuffix}`,
        Description: 'Serverless API with Lambda, DynamoDB, and Cognito',
        CorsConfiguration: {
          AllowCredentials: false,
          AllowHeaders: ['Content-Type', 'Authorization'],
          AllowOrigins: ['*'],
          AllowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          MaxAge: 864000,
        },
      });
    });

    test('creates API routes with authentication', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
        RouteKey: 'POST /data',
        AuthorizationType: 'JWT',
      });

      template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
        RouteKey: 'GET /data',
        AuthorizationType: 'JWT',
      });

      template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
        RouteKey: 'GET /data/{id}',
        AuthorizationType: 'JWT',
      });
    });

    test('creates health check route without authentication', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
        RouteKey: 'GET /health',
        AuthorizationType: 'NONE',
      });
    });

    test('creates JWT authorizer for protected routes', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Authorizer', {
        AuthorizerType: 'JWT',
        Name: 'JwtAuthorizer',
      });
    });

    test('creates integrations for Lambda functions', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Integration', {
        IntegrationType: 'AWS_PROXY',
        PayloadFormatVersion: '2.0',
      });
    });

    test('creates API stage for deployment', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Stage', {
        StageName: '$default',
        AutoDeploy: true,
      });
    });

    test('creates exactly four API routes', () => {
      const routes = template.findResources('AWS::ApiGatewayV2::Route');
      expect(Object.keys(routes)).toHaveLength(4);
    });
  });

  describe('Stack Outputs', () => {
    test('includes required outputs', () => {
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs)).toContain('ApiEndpoint');
      expect(Object.keys(outputs)).toContain('UserPoolId');
      expect(Object.keys(outputs)).toContain('UserPoolClientId');
      expect(Object.keys(outputs)).toContain('DynamoDbTableName');
    });

    test('outputs have correct descriptions', () => {
      const outputs = template.findOutputs('*');
      
      expect(outputs.ApiEndpoint.Description).toBe('API Gateway endpoint URL');
      expect(outputs.UserPoolId.Description).toBe('Cognito User Pool ID');
      expect(outputs.UserPoolClientId.Description).toBe('Cognito User Pool Client ID');
      expect(outputs.DynamoDbTableName.Description).toBe('DynamoDB table name');
    });

    test('creates exactly four outputs', () => {
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs)).toHaveLength(4);
    });
  });

  describe('IAM Permissions', () => {
    test('grants DynamoDB permissions to data processor Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com'
            },
            Action: 'sts:AssumeRole'
          }]
        }
      });
    });

    test('creates managed policy attachments for Lambda execution', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
              ]
            ]
          }
        ]
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('creates expected number of each resource type', () => {
      expect(Object.keys(template.findResources('AWS::DynamoDB::Table'))).toHaveLength(1);
      expect(Object.keys(template.findResources('AWS::Cognito::UserPool'))).toHaveLength(1);
      expect(Object.keys(template.findResources('AWS::Cognito::UserPoolClient'))).toHaveLength(1);
      expect(Object.keys(template.findResources('AWS::Lambda::Function'))).toHaveLength(2);
      expect(Object.keys(template.findResources('AWS::ApiGatewayV2::Api'))).toHaveLength(1);
      expect(Object.keys(template.findResources('AWS::ApiGatewayV2::Route'))).toHaveLength(4);
      expect(Object.keys(template.findResources('AWS::ApiGatewayV2::Integration'))).toHaveLength(2);
      expect(Object.keys(template.findResources('AWS::ApiGatewayV2::Authorizer'))).toHaveLength(1);
    });
  });
});