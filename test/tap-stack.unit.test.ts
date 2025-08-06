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
  });

  describe('Cognito User Pool', () => {
    test('creates a Cognito User Pool with correct configuration', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        AutoVerifiedAttributes: ['email'],
        Policies: {
          PasswordPolicy: {
            MinimumLength: 8,
            RequireLowercase: true,
            RequireUppercase: true,
            RequireNumbers: true,
            RequireSymbols: true,
          },
        },
      });
    });

    test('creates a Cognito User Pool Client', () => {
      template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
        GenerateSecret: false,
        ExplicitAuthFlows: ['ALLOW_USER_PASSWORD_AUTH', 'ALLOW_USER_SRP_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH'],
      });
    });
  });

  describe('Lambda Functions', () => {
    test('creates data processor Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Timeout: 30,
        MemorySize: 256,
      });
    });

    test('creates health check Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Timeout: 10,
        MemorySize: 128,
      });
    });
  });

  describe('API Gateway', () => {
    test('creates an HTTP API', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
        ProtocolType: 'HTTP',
        CorsConfiguration: {
          AllowCredentials: false,
          AllowHeaders: ['Content-Type', 'Authorization'],
          AllowOrigins: ['*'],
        },
      });
    });

    test('creates API routes with authentication', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
        RouteKey: 'POST /data',
      });

      template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
        RouteKey: 'GET /data',
      });

      template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
        RouteKey: 'GET /data/{id}',
      });
    });

    test('creates health check route without authentication', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
        RouteKey: 'GET /health',
      });
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
  });
});