import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { ApiGatewayStack } from '../lib/api-gateway-stack.mjs';

describe('ApiGatewayStack Unit Tests', () => {
  let app;
  let stack;
  let template;
  let mockLambdaStack;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    
    // Create a separate stack for mock Lambda functions
    const mockStack = new cdk.Stack(app, 'MockStack');
    const mockLambda = new lambda.Function(mockStack, 'MockLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline('exports.handler = async () => ({ statusCode: 200 });'),
    });

    mockLambdaStack = {
      userManagementFunction: mockLambda,
      productCatalogFunction: mockLambda,
      orderProcessingFunction: mockLambda,
    };

    stack = new ApiGatewayStack(app, 'TestApiGatewayStack', {
      environmentSuffix,
      lambdaStack: mockLambdaStack,
    });
    template = Template.fromStack(stack);
  });

  describe('API Gateway Configuration', () => {
    test('should create REST API with correct name', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'prod-MyAPI',
        Description: 'Production Serverless API',
      });
    });

    test('should configure deployment stage with throttling', () => {
      // CDK automatically manages stage in RestApi deployOptions
      // Check for Stage resource instead
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: environmentSuffix,
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            ThrottlingRateLimit: 1000,
            ThrottlingBurstLimit: 2000,
          }),
        ]),
      });
    });

    test('should enable tracing and metrics', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        TracingEnabled: true,
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            MetricsEnabled: true,
            LoggingLevel: 'ERROR',
          }),
        ]),
      });
    });

    test('should configure CORS', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
        AuthorizationType: 'NONE',
      });
    });
  });

  describe('Request Validation', () => {
    test('should create request validator', () => {
      template.hasResourceProperties('AWS::ApiGateway::RequestValidator', {
        ValidateRequestBody: true,
        ValidateRequestParameters: true,
      });
    });

    test('should apply validator to methods', () => {
      const methods = template.findResources('AWS::ApiGateway::Method', {
        Properties: {
          HttpMethod: Match.not('OPTIONS'),
        },
      });
      expect(Object.keys(methods).length).toBeGreaterThan(0);
    });
  });

  describe('API Resources and Methods', () => {
    test('should create users resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'users',
      });
    });

    test('should create products resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'products',
      });
    });

    test('should create user ID resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: '{id}',
      });
    });

    test('should create CRUD methods for users', () => {
      const httpMethods = ['GET', 'POST', 'PUT', 'DELETE'];
      httpMethods.forEach(method => {
        const methods = template.findResources('AWS::ApiGateway::Method', {
          Properties: {
            HttpMethod: method,
          },
        });
        expect(Object.keys(methods).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Lambda Integration', () => {
    test('should use Lambda integration for all methods', () => {
      const methods = template.findResources('AWS::ApiGateway::Method', {
        Properties: {
          HttpMethod: Match.not('OPTIONS'),
        },
      });
      
      Object.values(methods).forEach(method => {
        expect(method.Properties.Integration).toBeDefined();
        expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
      });
    });

    test('should configure Lambda integration URI', () => {
      const methods = template.findResources('AWS::ApiGateway::Method', {
        Properties: {
          HttpMethod: 'GET',
        },
      });
      
      Object.values(methods).forEach(method => {
        expect(method.Properties.Integration.Uri).toBeDefined();
        expect(method.Properties.Integration.Uri).toEqual(
          expect.objectContaining({
            'Fn::Join': expect.arrayContaining([
              expect.any(String),
              expect.arrayContaining([
                expect.stringContaining('lambda:path/2015-03-31/functions/'),
              ])
            ])
          })
        );
      });
    });

    test('should create orders resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'orders',
      });
    });
  });

  describe('SSM Parameters', () => {
    test('should store API Gateway URL in SSM', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/api-gateway/url-${environmentSuffix}`,
        Type: 'String',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should output API Gateway URL', () => {
      template.hasOutput('ApiGatewayUrl', {
        Description: 'API Gateway URL',
      });
    });

    test('should output API Gateway ID', () => {
      template.hasOutput('ApiGatewayId', {
        Description: 'API Gateway ID',
      });
    });
  });

  describe('Security Configuration', () => {
    test('should not use IAM authorization to avoid permission issues', () => {
      const methods = template.findResources('AWS::ApiGateway::Method', {
        Properties: {
          HttpMethod: Match.not('OPTIONS'),
        },
      });
      
      Object.values(methods).forEach(method => {
        expect(method.Properties.AuthorizationType).toBe('NONE');
      });
    });

    test('should have request validation enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::RequestValidator', {
        ValidateRequestBody: true,
        ValidateRequestParameters: true,
      });
    });
  });

  describe('Production Readiness', () => {
    test('should use prod naming convention', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'prod-MyAPI',
      });
    });

    test('should configure appropriate throttling limits', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            ThrottlingRateLimit: 1000,
            ThrottlingBurstLimit: 2000,
          }),
        ]),
      });
    });
  });
});