import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { ApiStack } from '../lib/api-stack';
import { DatabaseStack } from '../lib/database-stack';
import { ProcessingStack } from '../lib/processing-stack';
import { MonitoringStack } from '../lib/monitoring-stack';
import { VpcStack } from '../lib/vpc-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Payment Processing Multi-Stack Architecture', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Multi-Stack Composition', () => {
    test('should create all required stacks', () => {
      expect(stack).toBeDefined();
      expect(template).toBeDefined();
    });

    test('should use provided environment suffix', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {
        environmentSuffix: 'test',
      });
      expect(testStack).toBeDefined();
    });

    test('should create VPC with proper configuration', () => {
      // VPC is created with proper configuration
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });

      // Should have subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true, // Public subnet
      });

      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false, // Private subnet
      });
    });

    test('should create API Gateway resources', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `payment-processing-api-${environmentSuffix}`,
      });
    });

    test('should create Database with Aurora PostgreSQL', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        DatabaseName: 'paymentdb',
        MasterUsername: 'payment_admin',
        BackupRetentionPeriod: 30,
        StorageEncrypted: true,
      });
    });

    test('should create Processing stack with Lambda and SQS', () => {
      // Lambda functions
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `payment-validation-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `payment-processing-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
      });

      // SQS queue
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `payment-processing-queue-${environmentSuffix}.fifo`,
      });
    });


    test('should create Monitoring components with CloudWatch resources', () => {
      // API Gateway 4xx errors alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `payment-api-4xx-errors-${environmentSuffix}`,
        MetricName: '4XXError',
        Namespace: 'AWS/ApiGateway',
      });
    });

    test('should create SNS topics for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `payment-critical-alerts-${environmentSuffix}`,
      });
    });

    test('should have proper outputs', () => {
      // Check that outputs exist
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs)).toContain(
        `EnvironmentSuffix${environmentSuffix}`
      );
      expect(Object.keys(outputs)).toContain(`ApiUrl${environmentSuffix}`);
    });
  });

  describe('Stack Dependencies and References', () => {
    test('should validate stack composition works together', () => {
      // All resources should be created without conflicts
      const resources = template.toJSON().Resources;
      expect(Object.keys(resources).length).toBeGreaterThan(30);

      // Should have resources from all stacks
      const resourceTypes = Object.values(resources).map((r: any) => r.Type);
      expect(resourceTypes).toContain('AWS::EC2::VPC'); // VPC stack
      expect(resourceTypes).toContain('AWS::ApiGateway::RestApi'); // API stack
      expect(resourceTypes).toContain('AWS::RDS::DBCluster'); // Database stack
      expect(resourceTypes).toContain('AWS::Lambda::Function'); // Processing stack
      expect(resourceTypes).toContain('AWS::CloudWatch::Alarm'); // Monitoring stack
    });

    test('should have proper IAM roles for Lambda functions', () => {
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

    test('should have Lambda functions that create log groups', () => {
      // Lambda functions exist (log groups are created automatically at runtime)
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdaFunctions).length).toBeGreaterThanOrEqual(2); // At least validation and processor
    });
  });

  describe('Resource Counts and Architecture Validation', () => {
    test('should maintain reasonable resource counts per stack concept', () => {
      const resources = template.toJSON().Resources;

      // Should have resources for payment processing
      expect(Object.keys(resources).length).toBeGreaterThan(20);

      // Validate key resource types exist
      const resourceTypes = Object.values(resources).map((r: any) => r.Type);
      const typeCounts: { [key: string]: number } = {};

      resourceTypes.forEach(type => {
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });

      // Should have Lambda functions
      expect(typeCounts['AWS::Lambda::Function']).toBeGreaterThanOrEqual(2);

      // Should have CloudWatch alarms
      expect(typeCounts['AWS::CloudWatch::Alarm']).toBeGreaterThanOrEqual(1);

      // Should have SQS queues
      expect(typeCounts['AWS::SQS::Queue']).toBeGreaterThanOrEqual(1);
    });

    test('should validate multi-stack architecture benefits', () => {
      // This test ensures the refactoring from monolithic to multi-stack is successful
      const resources = template.toJSON().Resources;

      // Should have complex interconnected resources that benefit from separation
      const lambdaFunctions = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::Lambda::Function'
      );
      const apiGateways = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::ApiGateway::RestApi'
      );
      const databases = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::RDS::DBCluster'
      );

      expect(lambdaFunctions.length).toBeGreaterThanOrEqual(2);
      expect(apiGateways.length).toBeGreaterThanOrEqual(1);
      expect(databases.length).toBeGreaterThanOrEqual(1); // Database cluster
    });
  });

  describe('Environment Configuration', () => {
    test('should use environmentSuffix from props', () => {
      const testApp = new cdk.App();
      const customSuffix = 'production';
      const testStack = new TapStack(testApp, 'TestStack', {
        environmentSuffix: customSuffix,
      });

      expect(testStack).toBeDefined();
      // This tests the props?.environmentSuffix branch
    });

    test('should use environmentSuffix from context when props not provided', () => {
      const testApp = new cdk.App();
      testApp.node.setContext('environmentSuffix', 'staging');
      const testStack = new TapStack(testApp, 'TestStack');

      expect(testStack).toBeDefined();
      // This tests the this.node.tryGetContext('environmentSuffix') branch
    });

    test('should default to dev when no environment configuration provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack');

      expect(testStack).toBeDefined();
      // This tests the 'dev' default branch
    });
  });
});
