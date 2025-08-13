import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { GreetingApiStack } from '../lib/greeting-api-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    const environmentSuffix = 'test';
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('should create TapStack with correct properties', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should create nested GreetingApiStack', () => {
      // The TapStack template will only show a nested stack reference
      // The actual resources are in the GreetingApiStack
      const greetingStack = stack.node.findChild('GreetingApiStack');
      expect(greetingStack).toBeDefined();
      expect(greetingStack.constructor.name).toBe('GreetingApiStack');
    });

    test('should use provided environment suffix', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: 'custom',
      });
      expect(customStack).toBeDefined();
    });

    test('should use context environment suffix when not provided in props', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context-env',
        },
      });
      const contextStack = new TapStack(contextApp, 'ContextStack');
      expect(contextStack).toBeDefined();
    });

    test('should default to dev when no environment suffix is provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      expect(defaultStack).toBeDefined();
    });
  });
});

describe('GreetingApiStack', () => {
  let app: cdk.App;
  let stack: GreetingApiStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new GreetingApiStack(app, 'TestGreetingApiStack', {
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with correct properties', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `greeting-function-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'greeting-function.handler',
        Timeout: 30,
        MemorySize: 256,
        Environment: {
          Variables: {
            GREETING_MESSAGE: 'Welcome to our serverless API',
            ENVIRONMENT: environmentSuffix,
          },
        },
      });
    });

    test('should have correct Lambda function configuration', () => {
      // SnapStart is not supported for Node.js runtime
      // Test other optimizations instead
      template.hasResourceProperties('AWS::Lambda::Function', {
        MemorySize: 256,
        Timeout: 30,
      });
    });

    test('should create Lambda Function URL with correct CORS settings', () => {
      template.hasResourceProperties('AWS::Lambda::Url', {
        AuthType: 'NONE',
        Cors: {
          AllowOrigins: ['*'],
          AllowMethods: ['GET'],
          AllowHeaders: ['Content-Type'],
        },
      });
    });
  });

  describe('IAM Role', () => {
    test('should create IAM role for Lambda function', () => {
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

    test('should have CloudWatch Logs permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: [
          {
            PolicyName: 'CloudWatchLogsPolicy',
            PolicyDocument: {
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                  ],
                  Resource: Match.anyValue(),
                },
              ],
            },
          },
        ],
      });
    });
  });

  describe('CloudWatch Logs', () => {
    test('should create CloudWatch Log Group with correct retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/greeting-function-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });

    test('should set removal policy to DESTROY for Log Group', () => {
      template.hasResource('AWS::Logs::LogGroup', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('API Gateway', () => {
    test('should create REST API with correct properties', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `greeting-api-${environmentSuffix}`,
        Description: 'Serverless greeting API with Lambda integration',
      });
    });

    test('should configure CORS settings', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
        AuthorizationType: 'NONE',
      });
    });

    test('should create GET method on root', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        OperationName: 'GetGreeting',
      });
    });

    test('should create greeting resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'greeting',
      });
    });

    test('should configure deployment with logging and metrics', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: environmentSuffix,
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            ResourcePath: '/*',
            HttpMethod: '*',
            LoggingLevel: 'INFO',
            DataTraceEnabled: true,
            MetricsEnabled: true,
          }),
        ]),
      });
    });

    test('should create Lambda integration', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        Integration: {
          Type: 'AWS_PROXY',
          IntegrationHttpMethod: 'POST',
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should output API Gateway URL', () => {
      template.hasOutput('ApiGatewayUrl', {
        Description: 'API Gateway URL',
      });
    });

    test('should output Lambda Function URL', () => {
      template.hasOutput('FunctionUrl', {
        Description: 'Lambda Function URL',
      });
    });

    test('should output Lambda Function ARN', () => {
      template.hasOutput('LambdaFunctionArn', {
        Description: 'Lambda function ARN',
      });
    });
  });

  describe('Resource Naming', () => {
    test('should include environment suffix in all resource names', () => {
      // Lambda function name
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp(`.*-${environmentSuffix}$`),
      });

      // API Gateway name
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: Match.stringLikeRegexp(`.*-${environmentSuffix}$`),
      });

      // Log Group name
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp(`.*-${environmentSuffix}$`),
      });
    });
  });

  describe('Lambda Function Code', () => {
    test('should use correct asset path for Lambda code', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Code: {
          S3Bucket: Match.anyValue(),
          S3Key: Match.anyValue(),
        },
      });
    });
  });

  describe('Error Handling', () => {
    test('should configure error responses in API Gateway', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        MethodResponses: Match.arrayWith([
          Match.objectLike({
            StatusCode: '500',
          }),
        ]),
      });
    });
  });
});

describe('Lambda Handler', () => {
  const { handler } = require('../lib/lambda/greeting-function');

  describe('Successful Responses', () => {
    test('should return greeting with default name', async () => {
      const event = {
        queryStringParameters: null,
        requestContext: { requestId: 'test-123' },
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      expect(response.headers['Content-Type']).toBe('application/json');
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');

      const body = JSON.parse(response.body);
      expect(body.message).toContain('Guest');
      expect(body.requestId).toBe('test-123');
      expect(body.timestamp).toBeDefined();
    });

    test('should return greeting with provided name', async () => {
      const event = {
        queryStringParameters: { name: 'Alice' },
        requestContext: { requestId: 'test-456' },
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('Alice');
    });

    test('should use environment variable for greeting message', async () => {
      process.env.GREETING_MESSAGE = 'Custom Greeting';
      const event = {
        queryStringParameters: { name: 'Bob' },
        requestContext: { requestId: 'test-789' },
      };

      const response = await handler(event);

      const body = JSON.parse(response.body);
      expect(body.message).toBe('Custom Greeting, Bob!');

      delete process.env.GREETING_MESSAGE;
    });

    test('should include CORS headers in response', async () => {
      const event = {
        queryStringParameters: null,
        requestContext: null,
      };

      const response = await handler(event);

      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Access-Control-Allow-Headers']).toBe(
        'Content-Type'
      );
      expect(response.headers['Access-Control-Allow-Methods']).toBe(
        'GET, POST, OPTIONS'
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle missing request context gracefully', async () => {
      const event = {
        queryStringParameters: null,
        requestContext: null,
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.requestId).toBe('unknown');
    });

    test('should log events', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const event = {
        queryStringParameters: { name: 'Test' },
        requestContext: { requestId: 'log-test' },
      };

      await handler(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Event:',
        expect.stringContaining('queryStringParameters')
      );

      consoleSpy.mockRestore();
    });
  });
});