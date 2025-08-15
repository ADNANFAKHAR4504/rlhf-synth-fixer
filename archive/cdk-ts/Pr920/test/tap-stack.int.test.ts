import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { ServerlessStack } from '../lib/serverless-stack';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('ServerlessStack Integration Tests', () => {
  let app: cdk.App;
  let stack: ServerlessStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new ServerlessStack(app, 'TestServerlessStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('creates stack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toContain('TestServerlessStack');
    });

    test('has correct environment suffix', () => {
      expect(environmentSuffix).toBeDefined();
      expect(typeof environmentSuffix).toBe('string');
    });

    test('can synthesize without errors', () => {
      expect(() => {
        app.synth();
      }).not.toThrow();
    });
  });

  describe('Lambda Functions', () => {
    test('creates required Lambda functions', () => {
      template.resourceCountIs('AWS::Lambda::Function', 4);
    });

    test('creates cold start optimized function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.9',
        Handler: 'coldstart_optimized_handler.handler',
        MemorySize: 1024,
        ReservedConcurrentExecutions: 25,
      });
    });

    test('creates Lambda version and alias for optimization', () => {
      template.resourceCountIs('AWS::Lambda::Version', 1);
      template.resourceCountIs('AWS::Lambda::Alias', 1);
    });
  });

  describe('API Gateway', () => {
    test('creates REST API', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: Match.stringLikeRegexp('serverless-api-'),
        Description: 'High-traffic serverless API',
      });
    });

    test('creates API endpoints', () => {
      template.resourceCountIs('AWS::ApiGateway::Resource', 3);
    });
  });

  describe('Monitoring and Logging', () => {
    test('creates CloudWatch log groups', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 2);
    });

    test('creates CloudWatch dashboard', () => {
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });

    test('creates SNS topics', () => {
      template.resourceCountIs('AWS::SNS::Topic', 2);
    });

    test('creates EventBridge rule', () => {
      template.resourceCountIs('AWS::Events::Rule', 1);
    });
  });

  describe('IAM and Security', () => {
    test('creates IAM roles', () => {
      template.resourceCountIs('AWS::IAM::Role', 5);
    });

    test('creates CloudWatch alarms', () => {
      const alarmCount = template.toJSON().Resources
        ? Object.keys(template.toJSON().Resources).filter(
            key => template.toJSON().Resources[key].Type === 'AWS::CloudWatch::Alarm'
          ).length
        : 0;
      expect(alarmCount).toBeGreaterThanOrEqual(9);
    });
  });

  describe('Stack Outputs', () => {
    test('creates required outputs', () => {
      const outputs = template.findOutputs('*');
      expect(outputs).toHaveProperty('ApiEndpoint');
      expect(outputs).toHaveProperty('ColdStartOptimizedFunctionArn');
    });
  });
});
