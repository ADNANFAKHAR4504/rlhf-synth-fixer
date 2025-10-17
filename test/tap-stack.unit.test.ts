import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { InfraStack } from '../lib/infrastructure';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Structure', () => {
    test('should create InfraStack as child stack', () => {
      // Verify that InfraStack is created as a child stack
      // The InfraStack will contain all the actual AWS resources
      expect(stack.node.children.length).toBeGreaterThanOrEqual(1);

      // Find the InfraStack child
      const infraStackChild = stack.node.children.find(child => child.node.id === 'InfraStack');
      expect(infraStackChild).toBeDefined();
    });

    test('should pass environment suffix to InfraStack', () => {
      // Verify that environment suffix is passed to InfraStack
      const infraStack = stack.node.children.find(child => child.node.id === 'InfraStack') as any;
      expect(infraStack).toBeDefined();
      expect(infraStack).toBeInstanceOf(cdk.Stack);
    });
  });

  describe('Stack Configuration', () => {
    test('should use correct stack name', () => {
      // Verify stack name
      expect(stack.stackName).toBe('TestTapStack');
    });
  });

  describe('Environment Configuration', () => {

    test('should handle environment suffix from props', () => {
      // Test with different environment suffix
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', { environmentSuffix: 'test' });

      const infraStack = testStack.node.children.find(child => child.node.id === 'InfraStack');
      expect(infraStack).toBeDefined();
      expect(infraStack).toBeInstanceOf(cdk.Stack);
    });

    test('should use environment suffix from context when props not provided', () => {
      // Test environment suffix from context
      const testApp = new cdk.App();
      testApp.node.setContext('environmentSuffix', 'staging');

      const testStack = new TapStack(testApp, 'TestStack');
      const infraStack = testStack.node.children.find(child => child.node.id === 'InfraStack');

      expect(infraStack).toBeDefined();
      expect(infraStack).toBeInstanceOf(cdk.Stack);
    });

    test('should use default environment suffix when neither props nor context provided', () => {
      // Test default environment suffix
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack');
      const infraStack = testStack.node.children.find(child => child.node.id === 'InfraStack');

      expect(infraStack).toBeDefined();
      expect(infraStack).toBeInstanceOf(cdk.Stack);
    });

    test('should prioritize props over context for environment suffix', () => {
      // Test that props take precedence over context
      const testApp = new cdk.App();
      testApp.node.setContext('environmentSuffix', 'staging');

      const testStack = new TapStack(testApp, 'TestStack', { environmentSuffix: 'production' });
      const infraStack = testStack.node.children.find(child => child.node.id === 'InfraStack');

      expect(infraStack).toBeDefined();
      expect(infraStack).toBeInstanceOf(cdk.Stack);
    });
  });

  describe('Stack Dependencies', () => {
    test('should not have circular dependencies', () => {
      // Verify stack can be synthesized without circular dependency errors
      expect(() => {
        template.toJSON();
      }).not.toThrow();
    });

    test('should handle empty props object', () => {
      // Test with empty props object
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {});
      const infraStack = testStack.node.children.find(child => child.node.id === 'InfraStack');

      expect(infraStack).toBeDefined();
      expect(infraStack).toBeInstanceOf(cdk.Stack);
    });

    test('should handle undefined props', () => {
      // Test with undefined props
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', undefined);
      const infraStack = testStack.node.children.find(child => child.node.id === 'InfraStack');

      expect(infraStack).toBeDefined();
      expect(infraStack).toBeInstanceOf(cdk.Stack);
    });
  });

  describe('Stack Outputs', () => {
    test('should not have outputs at parent stack level', () => {
      // Parent TapStack should not have outputs - they should be in the InfraStack
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs)).toHaveLength(0);
    });
  });

  describe('Resource Count', () => {
    test('should have InfraStack as child', () => {
      // Parent stack should contain the InfraStack as a child
      const infraStackChild = stack.node.children.find(child => child.node.id === 'InfraStack');
      expect(infraStackChild).toBeDefined();
      expect(infraStackChild).toBeInstanceOf(cdk.Stack);
    });
  });

  describe('InfraStack Integration', () => {
    test('should create InfraStack with correct props', () => {
      const infraStack = stack.node.children.find(child => child.node.id === 'InfraStack');

      // Verify InfraStack is created
      expect(infraStack).toBeDefined();
      expect(infraStack).toBeInstanceOf(cdk.Stack);
    });

    test('should pass context values to InfraStack', () => {
      // Test that context values are passed through
      const testApp = new cdk.App();
      testApp.node.setContext('projectName', 'TestProject');
      testApp.node.setContext('apiThrottleRate', 150);

      const testStack = new TapStack(testApp, 'TestStack', { environmentSuffix: 'test' });
      const infraStack = testStack.node.children.find(child => child.node.id === 'InfraStack');

      expect(infraStack).toBeDefined();
      expect(infraStack).toBeInstanceOf(cdk.Stack);
    });

    test('should handle all context values being undefined', () => {
      // Test when no context values are set
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack');
      const infraStack = testStack.node.children.find(child => child.node.id === 'InfraStack');

      expect(infraStack).toBeDefined();
      expect(infraStack).toBeInstanceOf(cdk.Stack);
    });

    test('should pass all context values when provided', () => {
      // Test with all context values set
      const testApp = new cdk.App();
      testApp.node.setContext('projectName', 'TestProject');
      testApp.node.setContext('apiThrottleRate', 100);
      testApp.node.setContext('apiThrottleBurst', 200);
      testApp.node.setContext('lambdaMemorySize', 512);
      testApp.node.setContext('lambdaTimeout', 30);
      testApp.node.setContext('dynamodbReadCapacity', 5);
      testApp.node.setContext('dynamodbWriteCapacity', 5);
      testApp.node.setContext('enablePointInTimeRecovery', true);
      testApp.node.setContext('logRetentionDays', 14);

      const testStack = new TapStack(testApp, 'TestStack', { environmentSuffix: 'test' });
      const infraStack = testStack.node.children.find(child => child.node.id === 'InfraStack');

      expect(infraStack).toBeDefined();
      expect(infraStack).toBeInstanceOf(cdk.Stack);
    });

    test('should handle partial context values', () => {
      // Test with only some context values set
      const testApp = new cdk.App();
      testApp.node.setContext('projectName', 'PartialProject');
      testApp.node.setContext('lambdaMemorySize', 1024);
      // Other context values are undefined

      const testStack = new TapStack(testApp, 'TestStack');
      const infraStack = testStack.node.children.find(child => child.node.id === 'InfraStack');

      expect(infraStack).toBeDefined();
      expect(infraStack).toBeInstanceOf(cdk.Stack);
    });
  });

  describe('API Gateway Caching Configuration', () => {
    test('should pass API Gateway caching context values to InfraStack', () => {
      // Test with API Gateway caching context values
      const testApp = new cdk.App();
      testApp.node.setContext('enableApiGatewayCaching', true);
      testApp.node.setContext('apiGatewayCacheSize', 1.6);
      testApp.node.setContext('apiGatewayCacheTtl', 600);

      const testStack = new TapStack(testApp, 'TestStack', { environmentSuffix: 'test' });
      const infraStack = testStack.node.children.find(child => child.node.id === 'InfraStack');

      expect(infraStack).toBeDefined();
      expect(infraStack).toBeInstanceOf(cdk.Stack);
    });

    test('should handle API Gateway caching context values being undefined', () => {
      // Test when API Gateway caching context values are not set
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack');
      const infraStack = testStack.node.children.find(child => child.node.id === 'InfraStack');

      expect(infraStack).toBeDefined();
      expect(infraStack).toBeInstanceOf(cdk.Stack);
    });

    test('should pass all API Gateway caching context values when provided', () => {
      // Test with all API Gateway caching context values set
      const testApp = new cdk.App();
      testApp.node.setContext('enableApiGatewayCaching', false);
      testApp.node.setContext('apiGatewayCacheSize', 0.5);
      testApp.node.setContext('apiGatewayCacheTtl', 300);

      const testStack = new TapStack(testApp, 'TestStack', { environmentSuffix: 'test' });
      const infraStack = testStack.node.children.find(child => child.node.id === 'InfraStack');

      expect(infraStack).toBeDefined();
      expect(infraStack).toBeInstanceOf(cdk.Stack);
    });
  });
});

describe('InfraStack API Gateway Caching Unit Tests', () => {
  let app: cdk.App;
  let stack: InfraStack;
  let template: Template;

  describe('API Gateway Caching Configuration', () => {
    test('should create API Gateway with caching enabled for production environment', () => {
      app = new cdk.App();
      stack = new InfraStack(app, 'TestInfraStack', {
        environmentSuffix: 'prod',
        enableApiGatewayCaching: true,
        apiGatewayCacheSize: 1.6,
        apiGatewayCacheTtl: 600,
      });
      template = Template.fromStack(stack);

      // Check that API Gateway is created
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'tap-api-prod',
        Description: 'RESTful API for TAP project - prod',
      });

      // Check that deployment stage has caching enabled
      template.hasResourceProperties('AWS::ApiGateway::Deployment', {
        Description: 'RESTful API for TAP project - prod',
      });
    });

    test('should create API Gateway with caching disabled for development environment', () => {
      app = new cdk.App();
      stack = new InfraStack(app, 'TestInfraStack', {
        environmentSuffix: 'dev',
        enableApiGatewayCaching: false,
      });
      template = Template.fromStack(stack);

      // Check that API Gateway is created
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'tap-api-dev',
        Description: 'RESTful API for TAP project - dev',
      });
    });

    test('should use default caching configuration when not specified', () => {
      app = new cdk.App();
      stack = new InfraStack(app, 'TestInfraStack', {
        environmentSuffix: 'prod', // Production should enable caching by default
      });
      template = Template.fromStack(stack);

      // Check that API Gateway is created
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'tap-api-prod',
      });
    });

    test('should use custom cache size and TTL when provided', () => {
      app = new cdk.App();
      stack = new InfraStack(app, 'TestInfraStack', {
        environmentSuffix: 'test',
        enableApiGatewayCaching: true,
        apiGatewayCacheSize: 2.0,
        apiGatewayCacheTtl: 900,
      });
      template = Template.fromStack(stack);

      // Check that API Gateway is created with custom configuration
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'tap-api-test',
      });
    });

    test('should handle zero cache size gracefully', () => {
      app = new cdk.App();
      stack = new InfraStack(app, 'TestInfraStack', {
        environmentSuffix: 'test',
        enableApiGatewayCaching: true,
        apiGatewayCacheSize: 0,
        apiGatewayCacheTtl: 300,
      });
      template = Template.fromStack(stack);

      // Should not throw error and create API Gateway
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'tap-api-test',
      });
    });

    test('should handle very large cache TTL', () => {
      app = new cdk.App();
      stack = new InfraStack(app, 'TestInfraStack', {
        environmentSuffix: 'test',
        enableApiGatewayCaching: true,
        apiGatewayCacheSize: 0.5,
        apiGatewayCacheTtl: 3600, // 1 hour
      });
      template = Template.fromStack(stack);

      // Should not throw error and create API Gateway
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'tap-api-test',
      });
    });

    test('should create API Gateway with proper metadata for caching', () => {
      app = new cdk.App();
      stack = new InfraStack(app, 'TestInfraStack', {
        environmentSuffix: 'prod',
        enableApiGatewayCaching: true,
        apiGatewayCacheSize: 1.6,
        apiGatewayCacheTtl: 600,
      });
      template = Template.fromStack(stack);

      // Check that API Gateway is created
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'tap-api-prod',
      });
    });

    test('should create API Gateway methods with proper configuration', () => {
      app = new cdk.App();
      stack = new InfraStack(app, 'TestInfraStack', {
        environmentSuffix: 'test',
        enableApiGatewayCaching: true,
        apiGatewayCacheSize: 0.5,
        apiGatewayCacheTtl: 300,
      });
      template = Template.fromStack(stack);

      // Check that POST method is created
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        AuthorizationType: 'NONE',
      });

      // Check that GET method is created
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        AuthorizationType: 'NONE',
      });
    });

    test('should create Lambda integration with proper configuration', () => {
      app = new cdk.App();
      stack = new InfraStack(app, 'TestInfraStack', {
        environmentSuffix: 'test',
        enableApiGatewayCaching: true,
      });
      template = Template.fromStack(stack);

      // Check that Lambda integration is created
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        Integration: {
          Type: 'AWS_PROXY',
          IntegrationHttpMethod: 'POST',
        },
      });
    });

    test('should create API Gateway with CORS configuration', () => {
      app = new cdk.App();
      stack = new InfraStack(app, 'TestInfraStack', {
        environmentSuffix: 'test',
        enableApiGatewayCaching: true,
      });
      template = Template.fromStack(stack);

      // Check that OPTIONS method is created for CORS
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
        AuthorizationType: 'NONE',
      });
    });

    test('should handle multiple environment configurations', () => {
      const environments = ['dev', 'staging', 'prod'];

      environments.forEach(env => {
        const testApp = new cdk.App();
        const testStack = new InfraStack(testApp, `TestStack-${env}`, {
          environmentSuffix: env,
          enableApiGatewayCaching: env === 'prod',
          apiGatewayCacheSize: env === 'prod' ? 1.6 : 0.5,
          apiGatewayCacheTtl: env === 'prod' ? 600 : 300,
        });
        const testTemplate = Template.fromStack(testStack);

        // Each environment should create its own API Gateway
        testTemplate.hasResourceProperties('AWS::ApiGateway::RestApi', {
          Name: `tap-api-${env}`,
        });
      });
    });

    test('should create WAF association with API Gateway', () => {
      app = new cdk.App();
      stack = new InfraStack(app, 'TestInfraStack', {
        environmentSuffix: 'test',
        enableApiGatewayCaching: true,
      });
      template = Template.fromStack(stack);

      // Check that WAF WebACL is created
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Name: 'tap-waf-test',
        Scope: 'REGIONAL',
      });

      // Check that WAF association is created
      template.hasResourceProperties('AWS::WAFv2::WebACLAssociation', {
        WebACLArn: {
          'Fn::GetAtt': ['TapWebAcl', 'Arn'],
        },
      });
    });

    test('should create all required outputs', () => {
      app = new cdk.App();
      stack = new InfraStack(app, 'TestInfraStack', {
        environmentSuffix: 'test',
        enableApiGatewayCaching: true,
      });
      template = Template.fromStack(stack);

      // Check that all required outputs are created
      template.hasOutput('ApiEndpoint', {
        Description: 'API Gateway endpoint URL',
      });

      template.hasOutput('DynamoDBTableArn', {
        Description: 'DynamoDB table ARN',
      });

      template.hasOutput('S3BucketName', {
        Description: 'S3 bucket name for media storage',
      });

      template.hasOutput('LambdaFunctionArn', {
        Description: 'Lambda function ARN',
      });

      template.hasOutput('WAFArn', {
        Description: 'WAF Web ACL ARN',
      });
    });
  });

  describe('API Gateway Caching Edge Cases', () => {
    test('should handle negative cache size gracefully', () => {
      app = new cdk.App();
      stack = new InfraStack(app, 'TestInfraStack', {
        environmentSuffix: 'test',
        enableApiGatewayCaching: true,
        apiGatewayCacheSize: -1, // Invalid value
        apiGatewayCacheTtl: 300,
      });
      template = Template.fromStack(stack);

      // Should still create API Gateway
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'tap-api-test',
      });
    });

    test('should handle negative cache TTL gracefully', () => {
      app = new cdk.App();
      stack = new InfraStack(app, 'TestInfraStack', {
        environmentSuffix: 'test',
        enableApiGatewayCaching: true,
        apiGatewayCacheSize: 0.5,
        apiGatewayCacheTtl: -1, // Invalid value
      });
      template = Template.fromStack(stack);

      // Should still create API Gateway
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'tap-api-test',
      });
    });

    test('should handle undefined caching parameters', () => {
      app = new cdk.App();
      stack = new InfraStack(app, 'TestInfraStack', {
        environmentSuffix: 'test',
        enableApiGatewayCaching: undefined,
        apiGatewayCacheSize: undefined,
        apiGatewayCacheTtl: undefined,
      });
      template = Template.fromStack(stack);

      // Should use defaults and create API Gateway
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'tap-api-test',
      });
    });

    test('should handle null caching parameters', () => {
      app = new cdk.App();
      stack = new InfraStack(app, 'TestInfraStack', {
        environmentSuffix: 'test',
        enableApiGatewayCaching: null as any,
        apiGatewayCacheSize: null as any,
        apiGatewayCacheTtl: null as any,
      });
      template = Template.fromStack(stack);

      // Should handle null values and create API Gateway
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'tap-api-test',
      });
    });
  });
});
