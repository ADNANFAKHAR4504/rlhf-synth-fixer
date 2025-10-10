import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = 'test';

describe('TapStack - Payment API Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeAll(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Initialization and Configuration', () => {
    test('should create stack with correct region', () => {
      expect(stack.region).toBe('us-west-2');
    });

    test('should use default suffix if none is provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'DefaultSuffixStack');
      const testTemplate = Template.fromStack(testStack);
      testTemplate.hasResourceProperties('AWS::ApiGateway::ApiKey', {
        Name: 'payment-api-key-dev',
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create Payments and Transactions handlers', () => {
      template.resourceCountIs('AWS::Lambda::Function', 2);
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Architectures: ['arm64'],
        Handler: 'index.handler',
      });
    });

    test('should apply Destroy removal policy to Lambda functions', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      for (const logicalId in functions) {
        // CDK's RemovalPolicy.DESTROY translates to a DeletionPolicy of "Delete"
        expect(functions[logicalId].DeletionPolicy).toBe('Delete');
      }
    });

    test('should have ENVIRONMENT variable set', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            ENVIRONMENT: environmentSuffix,
          },
        },
      });
    });
  });

  describe('API Gateway REST API', () => {
    test('should create REST API with a suffixed name', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `PaymentProcessingApi-${environmentSuffix}`,
      });
    });

    test('should configure the prod stage with logging', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            DataTraceEnabled: true,
            LoggingLevel: 'INFO',
            HttpMethod: '*',
            ResourcePath: '/*',
          }),
        ]),
      });
    });

    test('should have CORS configured for all origins', () => {
      const corsMethod = template.findResources('AWS::ApiGateway::Method', {
        Properties: {
          HttpMethod: 'OPTIONS',
        },
      });
      expect(Object.keys(corsMethod).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('API Endpoints', () => {
    test('should create /payments and /transactions resources', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'payments',
      });
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'transactions',
      });
    });

    test('should create POST on /payments and GET on /transactions', () => {
      // Test for POST /payments
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        ResourceId: { Ref: Match.stringLikeRegexp('PaymentProcessingApipayments*') },
      });
      // Test for GET /transactions
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        ResourceId: { Ref: Match.stringLikeRegexp('PaymentProcessingApitransactions*') },
      });
    });

    test('should require an API key for both methods', () => {
      const methods = template.findResources('AWS::ApiGateway::Method', {
        Properties: {
          ApiKeyRequired: true,
        },
      });
      // Expect the GET and POST methods to require a key
      expect(Object.keys(methods).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('API Key and Usage Plan', () => {
    test('should create an enabled API Key', () => {
      template.resourceCountIs('AWS::ApiGateway::ApiKey', 1);
      template.hasResourceProperties('AWS::ApiGateway::ApiKey', {
        Name: `payment-api-key-${environmentSuffix}`,
        Enabled: true,
      });
    });

    test('should create a Usage Plan with throttling and quota', () => {
      template.resourceCountIs('AWS::ApiGateway::UsagePlan', 1);
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        Throttle: { RateLimit: 10, BurstLimit: 20 },
        Quota: { Limit: 1000, Period: 'DAY' },
      });
    });

    test('should associate the API Key with the Usage Plan', () => {
      template.resourceCountIs('AWS::ApiGateway::UsagePlanKey', 1);
    });

    test('should associate the prod stage with the Usage Plan', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        ApiStages: Match.arrayWith([
          Match.objectLike({
            Stage: {
              Ref: Match.stringLikeRegexp('PaymentProcessingApiDeploymentStageprod*'),
            },
          }),
        ]),
      });
    });
  });

  describe('IAM Roles and Permissions', () => {
    test('should create IAM Roles for Lambdas and API Gateway', () => {
      // Expect 3 roles: 2 for Lambdas, 1 for APIGW CloudWatch logging
      template.resourceCountIs('AWS::IAM::Role', 3);
    });

    test('should grant API Gateway permission to invoke Lambda functions', () => {
      const permissions = template.findResources('AWS::Lambda::Permission');
      expect(Object.keys(permissions).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Stack Outputs', () => {
    test('should have the required ApiInvokeUrl and ApiKeyId outputs', () => {
      template.hasOutput('ApiInvokeUrl', {});
      template.hasOutput('ApiKeyId', {});
    });

    test('should export the API Invoke URL', () => {
      template.hasOutput('ApiInvokeUrl', {
        Export: { Name: `PaymentApiInvokeUrl-${environmentSuffix}` },
      });
    });

    test('should export the API Key ID', () => {
      template.hasOutput('ApiKeyId', {
        Export: { Name: `PaymentApiKeyId-${environmentSuffix}` },
      });
    });
  });
});
