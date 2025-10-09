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

  describe('Stack Creation', () => {
    test('Stack should be created successfully', () => {
      expect(stack).toBeDefined();
      expect(template).toBeDefined();
    });

    test('Stack should be created with correct stack ID', () => {
      expect(stack.artifactId).toBe('TestTapStack');
    });

    test('Stack with custom environment suffix', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: 'custom',
      });
      const customTemplate = Template.fromStack(customStack);
      customTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'user-profiles-custom',
      });
    });

    test('Stack with context environment suffix', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context',
        },
      });
      const contextStack = new TapStack(contextApp, 'ContextStack', {});
      const contextTemplate = Template.fromStack(contextStack);
      contextTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'user-profiles-context',
      });
    });

    test('Stack with default environment suffix when none provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack', {});
      const defaultTemplate = Template.fromStack(defaultStack);
      defaultTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'user-profiles-dev',
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('Should create DynamoDB table with correct properties', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `user-profiles-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });

    test('Should have userId as partition key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'userId',
            KeyType: 'HASH',
          },
        ],
      });
    });

    test('Should have Global Secondary Index on username', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'username-index',
            KeySchema: [
              {
                AttributeName: 'username',
                KeyType: 'HASH',
              },
            ],
          }),
        ]),
      });
    });
  });

  describe('Lambda Function', () => {
    test('Should create Lambda function with correct runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        FunctionName: `user-profile-handler-${environmentSuffix}`,
      });
    });

    test('Should have correct timeout and memory', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: 30,
        MemorySize: 512,
      });
    });

    test('Should have environment variables configured', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            TABLE_NAME: Match.anyValue(),
            USERNAME_INDEX: 'username-index',
            NODE_ENV: 'production',
            LOG_LEVEL: 'INFO',
          },
        },
      });
    });

    test('Should have X-Ray tracing enabled', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });
  });

  describe('IAM Roles and Permissions', () => {
    test('Should create IAM role for Lambda function', () => {
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

    test('Should have DynamoDB permissions policy', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const policyKeys = Object.keys(policies);
      const hasDDBPolicy = policyKeys.some((key) => {
        const policy = policies[key];
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some(
          (stmt: any) =>
            stmt.Action &&
            Array.isArray(stmt.Action) &&
            stmt.Action.includes('dynamodb:PutItem')
        );
      });
      expect(hasDDBPolicy).toBe(true);
    });

    test('Should have GSI Query permissions', () => {
      // GSI Query permissions are included in the grantReadWriteData policy
      // which grants dynamodb:Query on both table and indices
      const policies = template.findResources('AWS::IAM::Policy');
      const policyKeys = Object.keys(policies);
      const hasQueryPermission = policyKeys.some((key) => {
        const policy = policies[key];
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some((stmt: any) => {
          if (!stmt.Action || !Array.isArray(stmt.Action)) return false;
          return stmt.Action.includes('dynamodb:Query');
        });
      });
      expect(hasQueryPermission).toBe(true);
    });
  });

  describe('API Gateway', () => {
    test('Should create REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `user-profile-api-${environmentSuffix}`,
        Description: 'User Profile Management API',
      });
    });

    test('Should have API Key created', () => {
      template.resourceCountIs('AWS::ApiGateway::ApiKey', 1);
      template.hasResourceProperties('AWS::ApiGateway::ApiKey', {
        Name: `user-profile-api-key-${environmentSuffix}`,
        Description: 'API Key for User Profile API',
      });
    });

    test('Should have Usage Plan with rate limiting', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        UsagePlanName: `user-profile-usage-plan-${environmentSuffix}`,
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

    test('Should create API resources for users endpoints', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'users',
      });
    });

    test('Should create API resource for userId parameter', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: '{userId}',
      });
    });

    test('Should create API resource for username parameter', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: '{username}',
      });
    });

    test('Should have POST method for creating users', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        ApiKeyRequired: true,
      });
    });

    test('Should have GET method for retrieving users', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        ApiKeyRequired: true,
      });
    });

    test('Should have PUT method for updating users', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'PUT',
        ApiKeyRequired: true,
      });
    });

    test('Should have DELETE method for deleting users', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'DELETE',
        ApiKeyRequired: true,
      });
    });

    test('Should have OPTIONS methods for CORS', () => {
      const methods = template.findResources('AWS::ApiGateway::Method', {
        Properties: {
          HttpMethod: 'OPTIONS',
        },
      });
      expect(Object.keys(methods).length).toBeGreaterThan(0);
    });

    test('Should have request validator for POST endpoint', () => {
      template.hasResourceProperties('AWS::ApiGateway::RequestValidator', {
        Name: 'create-user-validator',
        ValidateRequestBody: true,
        ValidateRequestParameters: false,
      });
    });

    test('Should have request model for user creation', () => {
      template.hasResourceProperties('AWS::ApiGateway::Model', {
        Name: 'CreateUserModel',
        ContentType: 'application/json',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Should have API Endpoint output', () => {
      template.hasOutput('ApiEndpoint', {
        Description: 'API Gateway endpoint URL',
        Export: {
          Name: Match.stringLikeRegexp('.*-ApiEndpoint'),
        },
      });
    });

    test('Should have API Key ID output', () => {
      template.hasOutput('ApiKeyId', {
        Description:
          'API Key ID - retrieve the actual key value from AWS Console',
        Export: {
          Name: Match.stringLikeRegexp('.*-ApiKeyId'),
        },
      });
    });

    test('Should have UserTableName output', () => {
      template.hasOutput('UserTableName', {
        Description: 'DynamoDB User Table Name',
        Export: {
          Name: Match.stringLikeRegexp('.*-UserTableName'),
        },
      });
    });
  });

  describe('Resource Tags', () => {
    test('Should have iac-rlhf-amazon tag on resources', () => {
      const resources = template.findResources('AWS::DynamoDB::Table');
      const tableKey = Object.keys(resources)[0];
      const table = resources[tableKey];
      expect(table.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ])
      );
    });

    test('Should have Environment tag set to Production', () => {
      const resources = template.findResources('AWS::DynamoDB::Table');
      const tableKey = Object.keys(resources)[0];
      const table = resources[tableKey];
      expect(table.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Key: 'Environment',
            Value: 'Production',
          }),
        ])
      );
    });
  });

  describe('Resource Count', () => {
    test('Should create expected number of core resources', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
      // Lambda function count should be at least 1 (may include log retention function)
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdaFunctions).length).toBeGreaterThanOrEqual(1);
      // Note: No Lambda Layer when using NodejsFunction (bundles dependencies automatically)
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      template.resourceCountIs('AWS::ApiGateway::ApiKey', 1);
      template.resourceCountIs('AWS::ApiGateway::UsagePlan', 1);
    });
  });
});
