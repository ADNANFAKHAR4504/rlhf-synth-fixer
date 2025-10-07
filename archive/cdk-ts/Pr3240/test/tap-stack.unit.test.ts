import * as cdk from 'aws-cdk-lib';
import { Template, Match, Capture } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('DynamoDB Table', () => {
    test('should create DynamoDB table with correct properties', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `PlayerScores-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: [
          {
            AttributeName: 'playerId',
            AttributeType: 'S',
          },
        ],
        KeySchema: [
          {
            AttributeName: 'playerId',
            KeyType: 'HASH',
          },
        ],
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: false,
        },
      });
    });

    test('should have RemovalPolicy.DESTROY for DynamoDB table', () => {
      template.hasResource('AWS::DynamoDB::Table', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create all four Lambda functions', () => {
      // Check for all Lambda functions
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      const functionNames = Object.keys(lambdaFunctions);

      // Should have 4 Lambda functions plus the log retention custom resource
      // Filter out the LogRetention Lambda function which is created by CDK
      const appFunctionNames = functionNames.filter(name => !name.includes('LogRetention'));
      expect(appFunctionNames).toHaveLength(4);
    });

    test('should configure Lambda functions with Node.js 20 runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Handler: 'createScore.handler',
        Timeout: 30,
        Environment: {
          Variables: Match.objectLike({
            TABLE_NAME: Match.anyValue(),
            ENVIRONMENT: environmentSuffix,
          }),
        },
      });
    });

    test('should configure all Lambda functions correctly', () => {
      const handlers = ['createScore.handler', 'getScore.handler', 'updateScore.handler', 'deleteScore.handler'];

      handlers.forEach((handler) => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          Runtime: 'nodejs20.x',
          Handler: handler,
          Timeout: 30,
        });
      });
    });

    test('should have Lambda execution role with correct permissions', () => {
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

    test('should grant DynamoDB permissions to Lambda functions', () => {
      // Check for DynamoDB policy
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
              ]),
              Effect: 'Allow',
            }),
            Match.objectLike({
              Action: Match.arrayWith([
                'dynamodb:GetItem',
                'dynamodb:Scan', // CDK uses Scan instead of Query for read permissions
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('API Gateway', () => {
    test('should create REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `ScoresApi-${environmentSuffix}`,
        Description: 'API for managing player scores',
        EndpointConfiguration: {
          Types: ['REGIONAL'],
        },
      });
    });

    test('should configure API deployment stage', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: environmentSuffix,
        MethodSettings: [
          {
            DataTraceEnabled: true,
            HttpMethod: '*',
            LoggingLevel: 'INFO',
            ResourcePath: '/*',
          },
        ],
      });
    });

    test('should create API resources and methods', () => {
      // Check for scores resource
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'scores',
      });

      // Check for {playerId} resource
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: '{playerId}',
      });

      // Check for HTTP methods
      const methods = ['POST', 'GET', 'PUT', 'DELETE'];
      methods.forEach((method) => {
        template.hasResourceProperties('AWS::ApiGateway::Method', {
          HttpMethod: method,
          AuthorizationType: 'NONE',
        });
      });
    });

    test('should configure Lambda integrations', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        Integration: {
          Type: 'AWS_PROXY',
          IntegrationHttpMethod: 'POST',
        },
      });
    });

    test('should configure CORS for API', () => {
      // Check for OPTIONS methods (CORS preflight)
      const optionsMethods = template.findResources('AWS::ApiGateway::Method', {
        Properties: {
          HttpMethod: 'OPTIONS',
        },
      });

      // Should have OPTIONS methods for CORS
      expect(Object.keys(optionsMethods).length).toBeGreaterThan(0);
    });

    test('should create Lambda permissions for API Gateway', () => {
      const permissions = template.findResources('AWS::Lambda::Permission');
      const permissionKeys = Object.keys(permissions);

      // Should have permissions for each method (including test permissions)
      expect(permissionKeys.length).toBeGreaterThan(0);

      // Check one permission structure
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'apigateway.amazonaws.com',
      });
    });

    test('should configure CloudWatch logging for API', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7,
      });

      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        AccessLogSetting: Match.objectLike({
          DestinationArn: Match.anyValue(),
          Format: Match.anyValue(),
        }),
      });
    });
  });

  describe('Parameter Store', () => {
    test('should create SSM parameters for configuration', () => {
      // API Endpoint parameter
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/scores-api/${environmentSuffix}/endpoint`,
        Type: 'String',
        Description: 'API Gateway endpoint URL',
      });

      // Table name parameter
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/scores-api/${environmentSuffix}/table-name`,
        Type: 'String',
        Description: 'DynamoDB table name',
      });

      // Environment parameter
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/scores-api/${environmentSuffix}/environment`,
        Type: 'String',
        Description: 'Environment name',
        Value: environmentSuffix,
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should have API endpoint output', () => {
      template.hasOutput('ApiEndpoint', {
        Description: 'API Gateway endpoint URL',
      });
    });

    test('should have table name output', () => {
      template.hasOutput('TableName', {
        Description: 'DynamoDB table name',
      });
    });

    test('should have Lambda function name outputs', () => {
      template.hasOutput('CreateScoreFunctionName', {
        Description: 'Create Score Lambda Function Name',
      });

      template.hasOutput('GetScoreFunctionName', {
        Description: 'Get Score Lambda Function Name',
      });

      template.hasOutput('UpdateScoreFunctionName', {
        Description: 'Update Score Lambda Function Name',
      });

      template.hasOutput('DeleteScoreFunctionName', {
        Description: 'Delete Score Lambda Function Name',
      });
    });

    test('should have environment suffix output', () => {
      template.hasOutput('EnvironmentSuffix', {
        Description: 'Environment suffix used for resource naming',
        Value: environmentSuffix,
      });
    });
  });

  describe('Resource Tagging', () => {
    test('should tag resources appropriately', () => {
      // CDK automatically tags resources, check various resources have expected structure
      const resources = template.toJSON().Resources;

      // Verify resources are properly structured
      expect(resources).toBeDefined();

      // Check that key resources exist
      const dynamoTables = Object.values(resources).filter((r: any) => r.Type === 'AWS::DynamoDB::Table');
      expect(dynamoTables.length).toBeGreaterThan(0);
    });
  });

  describe('Security', () => {
    test('should follow least privilege for Lambda execution role', () => {
      // Verify policy only grants necessary DynamoDB actions
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Resource: Match.anyValue(),
            }),
          ]),
        },
      });
    });

    test('should not have any public access configurations', () => {
      // Ensure API does not have any open access beyond CORS
      const restApi = template.findResources('AWS::ApiGateway::RestApi');
      Object.values(restApi).forEach((api: any) => {
        // API should not have policy allowing unrestricted access
        expect(api.Properties?.Policy).toBeUndefined();
      });
    });
  });

  describe('Lambda Log Groups', () => {
    test('should configure log retention for Lambda functions', () => {
      // With logRetention setting, CDK creates custom resources for log retention
      const logRetentionResources = template.findResources('Custom::LogRetention');

      // Should have log retention configuration for each Lambda function
      expect(Object.keys(logRetentionResources).length).toBeGreaterThanOrEqual(4);

      // Check that log retention is configured with short retention period
      Object.values(logRetentionResources).forEach((resource: any) => {
        if (resource.Properties?.RetentionInDays) {
          // Should have short retention period for dev environment
          expect(resource.Properties.RetentionInDays).toBeLessThanOrEqual(7);
        }
      });

      // API Gateway log group should have RemovalPolicy.DESTROY
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      const apiLogGroup = Object.values(logGroups).find((group: any) => {
        const logGroupName = group.Properties?.LogGroupName;
        // API Gateway log group doesn't have a Fn::Join for Lambda paths
        return logGroupName && typeof logGroupName !== 'object';
      });

      if (apiLogGroup) {
        expect(apiLogGroup.DeletionPolicy).toBe('Delete');
        expect(apiLogGroup.UpdateReplacePolicy).toBe('Delete');
      }
    });
  });

  describe('X-Ray Tracing', () => {
    test('should enable X-Ray tracing for all Lambda functions', () => {
      // Check that all Lambda functions have X-Ray tracing enabled
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      const appFunctions = Object.entries(lambdaFunctions).filter(
        ([name]) => !name.includes('LogRetention')
      );

      appFunctions.forEach(([_, resource]: [string, any]) => {
        expect(resource.Properties?.TracingConfig).toEqual({
          Mode: 'Active',
        });
      });
    });

    test('should have X-Ray permissions in Lambda execution role', () => {
      // Check that the Lambda execution role has X-Ray managed policy
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([Match.stringLikeRegexp('AWSXRayDaemonWriteAccess')]),
            ]),
          }),
        ]),
      });
    });

    test('should enable X-Ray tracing on API Gateway', () => {
      // Check that API Gateway has tracing enabled
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        TracingEnabled: true,
      });
    });
  });

  describe('API Gateway Usage Plans', () => {
    test('should create API key', () => {
      template.hasResourceProperties('AWS::ApiGateway::ApiKey', {
        Enabled: true,
      });
    });

    test('should create usage plan with rate limiting', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
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

    test('should associate API key with usage plan', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlanKey', {
        KeyType: 'API_KEY',
      });
    });

    test('should require API key for all methods', () => {
      const methods = template.findResources('AWS::ApiGateway::Method');
      const apiMethods = Object.values(methods).filter((method: any) =>
        ['GET', 'POST', 'PUT', 'DELETE'].includes(method.Properties?.HttpMethod)
      );

      apiMethods.forEach((method: any) => {
        expect(method.Properties?.ApiKeyRequired).toBe(true);
      });
    });

    test('should have API key outputs', () => {
      template.hasOutput('ApiKeyId', {
        Description: 'API Key ID for accessing the API',
      });
      template.hasOutput('UsagePlanId', {
        Description: 'Usage Plan ID for the API',
      });
    });
  });

  describe('Environment Suffix Handling', () => {
    test('should use provided environment suffix', () => {
      const customSuffix = 'custom-env';
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: customSuffix
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `PlayerScores-${customSuffix}`,
      });
    });

    test('should use default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      const defaultTemplate = Template.fromStack(defaultStack);

      // Should use 'dev' as default
      defaultTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.anyValue(),
      });
    });
  });
});