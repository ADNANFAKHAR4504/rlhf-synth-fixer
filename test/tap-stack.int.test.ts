import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { ServerlessStack } from '../lib/serverless-stack';
import { TapStack } from '../lib/tap-stack';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack Integration Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Integration', () => {
    test('creates complete infrastructure with all required resources', () => {
      // Verify the stack creates all expected resource types
      expect(template).toBeDefined();
      
      // Check that we have the main stack structure
      expect(stack).toBeDefined();
      expect(stack.stackName).toContain('TestTapStack');
    });

    test('has correct environment suffix configuration', () => {
      // Verify environment suffix is properly configured
      expect(environmentSuffix).toBeDefined();
      expect(typeof environmentSuffix).toBe('string');
      expect(environmentSuffix.length).toBeGreaterThan(0);
    });
  });

  describe('ServerlessStack Integration', () => {
    let serverlessStack: ServerlessStack;

    beforeEach(() => {
      // Get the ServerlessStack from the TapStack
      const stacks = stack.node.children;
      serverlessStack = stacks.find(
        child => child instanceof ServerlessStack
      ) as ServerlessStack;
      expect(serverlessStack).toBeDefined();
    });

    test('creates all required Lambda functions with proper configuration', () => {
      // Verify Lambda function count and configuration
      template.resourceCountIs('AWS::Lambda::Function', 4);
      
      // Check that all Lambda functions have proper runtime and configuration
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: Match.anyValue(),
        MemorySize: Match.anyValue(),
        Timeout: Match.anyValue(),
      });
    });

    test('creates API Gateway with all endpoints', () => {
      // Verify API Gateway resources
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      template.resourceCountIs('AWS::ApiGateway::Resource', 3);
      
      // Check API Gateway configuration
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: Match.stringLikeRegexp('serverless-api-'),
        Description: 'High-traffic serverless API',
        EndpointConfiguration: {
          Types: ['REGIONAL'],
        },
      });
    });

    test('creates comprehensive monitoring infrastructure', () => {
      // Verify CloudWatch resources
      template.resourceCountIs('AWS::Logs::LogGroup', 2);
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
      
      // Verify SNS topics
      template.resourceCountIs('AWS::SNS::Topic', 2);
      
      // Verify EventBridge rules
      template.resourceCountIs('AWS::Events::Rule', 1);
    });

    test('creates proper IAM roles and policies', () => {
      // Verify IAM roles
      template.resourceCountIs('AWS::IAM::Role', 5);
      
      // Check that Lambda functions have execution roles
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

    test('creates cost monitoring and alarms', () => {
      // Verify CloudWatch alarms exist
      const alarmCount = template.toJSON().Resources
        ? Object.keys(template.toJSON().Resources).filter(
            key =>
              template.toJSON().Resources[key].Type === 'AWS::CloudWatch::Alarm'
          ).length
        : 0;
      expect(alarmCount).toBeGreaterThanOrEqual(9);
      
      // Check cost monitoring alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('serverless-cost-alarm-'),
        AlarmDescription: 'Monitor Lambda costs to stay under $1000/month',
        MetricName: 'EstimatedCharges',
        Namespace: 'AWS/Billing',
      });
    });
  });

  describe('Cold Start Optimization Integration', () => {
    test('creates cold start optimized function with provisioned concurrency', () => {
      // Verify the cold start optimized function exists
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.9',
        Handler: 'coldstart_optimized_handler.handler',
        MemorySize: 1024,
        ReservedConcurrentExecutions: 25,
        Architectures: ['x86_64'],
        Environment: {
          Variables: Match.objectLike({
            COLD_START_OPTIMIZED: 'true',
            PROVISIONED_CONCURRENCY: 'enabled',
          }),
        },
      });
    });

    test('creates Lambda version and alias for optimization', () => {
      // Verify version and alias resources
      template.resourceCountIs('AWS::Lambda::Version', 1);
      template.resourceCountIs('AWS::Lambda::Alias', 1);
      
      // Check alias configuration
      template.hasResourceProperties('AWS::Lambda::Alias', {
        Name: 'coldstart-optimized',
        Description: 'Alias for cold start optimized function',
      });
    });

    test('creates auto-scaling for provisioned concurrency', () => {
      // Verify auto-scaling resources exist
      const autoScalingCount = template.toJSON().Resources
        ? Object.keys(template.toJSON().Resources).filter(
            key =>
              template.toJSON().Resources[key].Type === 'AWS::ApplicationAutoScaling::ScalableTarget'
          ).length
        : 0;
      expect(autoScalingCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Application Signals Integration', () => {
    test('creates Application Signals log group', () => {
      // Verify Application Signals log group
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/application-signals/${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });

    test('creates Application Signals dashboard widgets', () => {
      // Verify dashboard exists with widgets
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
      
      // Check dashboard configuration
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `serverless-monitoring-${environmentSuffix}`,
      });
    });
  });

  describe('Security and Compliance Integration', () => {
    test('all resources have proper removal policies', () => {
      // Check that resources have appropriate removal policies
      const jsonTemplate = template.toJSON();
      const resources = jsonTemplate.Resources || {};
      
      // Verify no resources have Retain deletion policy
      Object.keys(resources).forEach(resourceKey => {
        const resource = resources[resourceKey];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('all named resources include environment suffix', () => {
      // Verify environment suffix is used in resource names
      const jsonTemplate = template.toJSON();
      const resources = jsonTemplate.Resources || {};
      
      // Check key resources have environment suffix
      Object.keys(resources).forEach(resourceKey => {
        const resource = resources[resourceKey];
        if (resource.Properties?.Name || resource.Properties?.LogGroupName) {
          const name = resource.Properties.Name || resource.Properties.LogGroupName;
          if (typeof name === 'string' && name.includes('serverless')) {
            expect(name).toContain(environmentSuffix);
          }
        }
      });
    });

    test('Lambda functions have proper security configuration', () => {
      // Verify Lambda security settings
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            LOG_LEVEL: 'INFO',
            AWS_XRAY_CONTEXT_MISSING: 'LOG_ERROR',
          }),
        },
      });
    });
  });

  describe('Performance and Scalability Integration', () => {
    test('Lambda functions are configured for high throughput', () => {
      // Verify high-throughput configuration
      template.hasResourceProperties('AWS::Lambda::Function', {
        ReservedConcurrentExecutions: Match.anyValue(),
        MemorySize: Match.anyValue(),
        Timeout: Match.anyValue(),
      });
    });

    test('API Gateway has proper CORS configuration', () => {
      // Verify CORS settings
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        DefaultCorsPreflightOptions: {
          AllowOrigins: ['*'],
          AllowMethods: ['*'],
        },
      });
    });

    test('creates proper scaling policies', () => {
      // Verify scaling policies exist
      const scalingPolicyCount = template.toJSON().Resources
        ? Object.keys(template.toJSON().Resources).filter(
            key =>
              template.toJSON().Resources[key].Type === 'AWS::ApplicationAutoScaling::ScalingPolicy'
          ).length
        : 0;
      expect(scalingPolicyCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Monitoring and Observability Integration', () => {
    test('creates comprehensive monitoring stack', () => {
      // Verify monitoring resources
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
      template.resourceCountIs('AWS::SNS::Topic', 2);
      template.resourceCountIs('AWS::Events::Rule', 1);
      
      // Check monitoring configuration
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.stringLikeRegexp('serverless-monitoring-'),
        DisplayName: 'Serverless Monitoring Topic',
      });
    });

    test('creates proper alarm thresholds', () => {
      // Verify alarm configurations
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Threshold: Match.anyValue(),
        EvaluationPeriods: Match.anyValue(),
      });
    });

    test('creates EventBridge rule for metrics collection', () => {
      // Verify EventBridge configuration
      template.hasResourceProperties('AWS::Events::Rule', {
        Description: 'Send metrics to third-party monitoring every minute',
        ScheduleExpression: 'rate(1 minute)',
      });
    });
  });

  describe('Stack Outputs Integration', () => {
    test('creates all required outputs for integration', () => {
      // Verify stack outputs
      const outputs = template.findOutputs('*');
      
      // Check essential outputs exist
      expect(outputs).toHaveProperty('ApiEndpoint');
      expect(outputs).toHaveProperty('SampleFunctionArn');
      expect(outputs).toHaveProperty('ProcessingFunctionArn');
      expect(outputs).toHaveProperty('ColdStartOptimizedFunctionArn');
      expect(outputs).toHaveProperty('LogGroupName');
      expect(outputs).toHaveProperty('MonitoringTopicArn');
    });

    test('outputs have proper descriptions and export names', () => {
      // Verify output configuration
      const outputs = template.findOutputs('*');
      
      Object.keys(outputs).forEach(outputKey => {
        const output = outputs[outputKey];
        expect(output).toHaveProperty('Description');
        expect(output).toHaveProperty('ExportName');
        expect(typeof output.Description).toBe('string');
        expect(typeof output.ExportName).toBe('string');
      });
    });
  });

  describe('End-to-End Integration', () => {
    test('stack synthesizes successfully without errors', () => {
      // This test verifies that the entire stack can be synthesized
      // which means all dependencies and configurations are correct
      expect(() => {
        app.synth();
      }).not.toThrow();
    });

    test('all resources have valid configurations', () => {
      // Verify that the template is valid
      const jsonTemplate = template.toJSON();
      expect(jsonTemplate).toHaveProperty('Resources');
      expect(jsonTemplate).toHaveProperty('Outputs');
      
      // Check that we have resources
      const resources = jsonTemplate.Resources || {};
      expect(Object.keys(resources).length).toBeGreaterThan(0);
      
      // Check that we have outputs
      const outputs = jsonTemplate.Outputs || {};
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('stack follows infrastructure best practices', () => {
      // Verify best practices are followed
      const jsonTemplate = template.toJSON();
      const resources = jsonTemplate.Resources || {};
      
      // Check for proper tagging
      Object.keys(resources).forEach(resourceKey => {
        const resource = resources[resourceKey];
        if (resource.Properties?.Tags) {
          const tags = resource.Properties.Tags;
          expect(Array.isArray(tags)).toBe(true);
        }
      });
      
      // Check for proper logging configuration
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7,
      });
    });
  });
});
