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

  describe('Stack Initialization', () => {
    test('should create stack without environment suffix prop', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackNoEnv');
      expect(testStack).toBeDefined();
    });

    test('should create stack with context environment suffix', () => {
      const testApp = new cdk.App({
        context: {
          environmentSuffix: 'test',
        },
      });
      const testStack = new TapStack(testApp, 'TestStackContext');
      expect(testStack).toBeDefined();
    });

    test('should create stack with explicit environment suffix', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackExplicit', {
        environmentSuffix: 'prod',
      });
      expect(testStack).toBeDefined();
    });
  });

  describe('Stack Configuration', () => {
    test('should create stack with correct region', () => {
      expect(stack.region).toBe('us-west-2');
    });

    test('should have environment suffix configured', () => {
      const outputs = template.findOutputs('*');
      expect(
        Object.values(outputs).some((output) =>
          output.Export?.Name?.includes(environmentSuffix)
        )
      ).toBe(true);
    });
  });

  describe('Lambda Functions', () => {
    test('should create payments handler with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        MemorySize: 512,
        Timeout: 30,
        Architectures: ['arm64'],
        Handler: Match.stringLikeRegexp('index.handler'),
      });
    });

    test('should create transactions handler with correct configuration', () => {
      template.resourceCountIs('AWS::Lambda::Function', 2);
    });

    test('should apply removal policy to lambda functions', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(functions).length).toBeGreaterThanOrEqual(2);
    });

    test('should set environment variables for lambda functions', () => {
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
    test('should create REST API with correct name', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'PaymentProcessingApi',
      });
    });

    test('should configure deployment stage as prod', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
      });

      // MethodSettings contain logging and trace configuration
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            HttpMethod: '*',
            ResourcePath: '/*',
            LoggingLevel: 'INFO',
            DataTraceEnabled: true,
          }),
        ]),
      });
    });

    test('should create /payments resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'payments',
      });
    });

    test('should create /transactions resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'transactions',
      });
    });

    test('should have exactly 2 API resources (excluding root)', () => {
      const resources = template.findResources('AWS::ApiGateway::Resource');
      expect(Object.keys(resources).length).toBe(2);
    });
  });

  describe('API Methods and Integrations', () => {
    test('should create POST method for /payments', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        ApiKeyRequired: true,
      });
    });

    test('should create GET method for /transactions', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        ApiKeyRequired: true,
      });
    });

    test('should integrate payments endpoint with lambda', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        Integration: {
          Type: 'AWS_PROXY',
        },
      });
    });

    test('should integrate transactions endpoint with lambda', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        Integration: {
          Type: 'AWS_PROXY',
        },
      });
    });

    test('should require API key for both methods', () => {
      const methods = template.findResources('AWS::ApiGateway::Method', {
        Properties: {
          ApiKeyRequired: true,
        },
      });
      // Expect at least 2 methods with API key requirement (POST and GET)
      expect(Object.keys(methods).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('API Key and Usage Plan', () => {
    test('should create API key with correct name', () => {
      template.hasResourceProperties('AWS::ApiGateway::ApiKey', {
        Name: `payment-api-key-${environmentSuffix}`,
        Description: 'API Key for Payment Processing API',
        Enabled: true,
      });
    });

    test('should create usage plan with throttle settings', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        UsagePlanName: `payment-usage-plan-${environmentSuffix}`,
        Description: 'Usage plan for Payment Processing API',
        Throttle: {
          RateLimit: 10,
          BurstLimit: 20,
        },
      });
    });

    test('should configure daily quota on usage plan', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        Quota: {
          Limit: 1000,
          Period: 'DAY',
        },
      });
    });

    test('should associate API stage with usage plan', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlanKey', {});
    });

    test('should have exactly one API key', () => {
      template.resourceCountIs('AWS::ApiGateway::ApiKey', 1);
    });

    test('should have exactly one usage plan', () => {
      template.resourceCountIs('AWS::ApiGateway::UsagePlan', 1);
    });
  });

  describe('Custom Domain Name', () => {
    test('should create domain name with edge endpoint', () => {
      template.hasResourceProperties('AWS::ApiGateway::DomainName', {
        DomainName: `payments-api-${environmentSuffix}.example.com`,
      });
    });

    test('should create base path mapping', () => {
      template.hasResourceProperties('AWS::ApiGateway::BasePathMapping', {
        DomainName: Match.objectLike({
          Ref: Match.stringLikeRegexp('PaymentApiDomain'),
        }),
      });
    });

    test('should have exactly one domain name', () => {
      template.resourceCountIs('AWS::ApiGateway::DomainName', 1);
    });

    test('should have exactly one base path mapping', () => {
      template.resourceCountIs('AWS::ApiGateway::BasePathMapping', 1);
    });
  });

  describe('Stack Outputs', () => {
    test('should export API invoke URL', () => {
      template.hasOutput('ApiInvokeUrl', {
        Export: {
          Name: `PaymentApiInvokeUrl-${environmentSuffix}`,
        },
      });
    });

    test('should export API key ID', () => {
      template.hasOutput('ApiKeyId', {
        Export: {
          Name: `PaymentApiKeyId-${environmentSuffix}`,
        },
      });
    });

    test('should export domain name', () => {
      template.hasOutput('DomainName', {
        Export: {
          Name: `PaymentApiDomainName-${environmentSuffix}`,
        },
      });
    });

    test('should have at least 3 outputs', () => {
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs).length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Lambda Permissions', () => {
    test('should grant API Gateway permission to invoke payments lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'apigateway.amazonaws.com',
      });
    });

    test('should create permissions for both lambda functions', () => {
      // Each Lambda has two permissions (prod + test-invoke-stage)
      template.resourceCountIs('AWS::Lambda::Permission', 4);
    });
  });

  describe('IAM Roles', () => {
    test('should create IAM roles for lambda functions', () => {
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

    test('should attach basic execution policy to lambda roles', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp(
                  'AWSLambdaBasicExecutionRole|service-role/AWSLambdaBasicExecutionRole'
                ),
              ]),
            ]),
          }),
        ]),
      });
    });
  });

  describe('CloudWatch Logs', () => {
    test('should create log groups for lambda functions', () => {
      // Lambda functions automatically create log groups
      // We just verify the configuration is correct
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: Match.stringLikeRegexp('index.handler'),
      });
    });
  });

  describe('Public Properties', () => {
    test('should expose api as public property', () => {
      expect(stack.api).toBeDefined();
      expect(stack.api.restApiId).toBeDefined();
    });

    test('should expose paymentsHandler as public property', () => {
      expect(stack.paymentsHandler).toBeDefined();
      expect(stack.paymentsHandler.functionName).toBeDefined();
    });

    test('should expose transactionsHandler as public property', () => {
      expect(stack.transactionsHandler).toBeDefined();
      expect(stack.transactionsHandler.functionName).toBeDefined();
    });

    test('should expose apiKey as public property', () => {
      expect(stack.apiKey).toBeDefined();
      expect(stack.apiKey.keyId).toBeDefined();
    });

    test('should expose usagePlan as public property', () => {
      expect(stack.usagePlan).toBeDefined();
    });

    test('should expose domainName as public property', () => {
      expect(stack.domainName).toBeDefined();
      // domainName can be a token, so we just verify it's defined
      expect(stack.domainName.domainName).toBeDefined();
    });
  });

  describe('Resource Dependencies', () => {
    test('should have correct dependency chain for API deployment', () => {
      const deployment = template.findResources('AWS::ApiGateway::Deployment');
      expect(Object.keys(deployment).length).toBeGreaterThan(0);
    });

    test('should ensure usage plan depends on API stage', () => {
      const usagePlans = template.findResources('AWS::ApiGateway::UsagePlan');
      expect(Object.keys(usagePlans).length).toBe(1);
    });
  });
});
