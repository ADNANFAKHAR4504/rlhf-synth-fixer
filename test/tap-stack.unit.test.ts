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

    test('should create VPC stack with proper configuration', () => {
      // VPC stack creates its own resources, referenced by other stacks
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: [
          {
            Key: 'Name',
            Value: `payment-processing-vpc-${environmentSuffix}`,
          },
        ],
      });

      // Should have subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true, // Public subnet
      });

      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false, // Private subnet
      });
    });

    test('should create API Gateway stack resources', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `payment-processing-api-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        ThrottleSettings: {
          BurstLimit: 2000,
          RateLimit: 1000,
        },
      });

      template.hasResourceProperties('AWS::ApiGateway::ApiKey', {});
    });

    test('should create Database stack with Aurora PostgreSQL', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        DatabaseName: 'paymentdb',
        MasterUsername: 'paymentuser',
        BackupRetentionPeriod: 7,
        StorageEncrypted: true,
      });

      // Should have read replica
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        ReplicationSourceIdentifier: {
          Ref: expect.stringMatching(/PaymentDatabase.*Cluster/),
        },
      });
    });

    test('should create Processing stack with Lambda and SQS', () => {
      // Lambda functions
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `payment-validation-${environmentSuffix}`,
        Architectures: ['arm64'],
        Runtime: 'nodejs18.x',
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `payment-processor-${environmentSuffix}`,
        Architectures: ['arm64'],
        Runtime: 'nodejs18.x',
      });

      // SQS FIFO queue
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `payment-processing-queue-${environmentSuffix}.fifo`,
        FifoQueue: true,
        ContentBasedDeduplication: true,
      });

      // DLQ
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `payment-processing-dlq-${environmentSuffix}.fifo`,
        FifoQueue: true,
      });
    });

    test('should create Step Functions state machine', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        StateMachineName: `payment-processing-workflow-${environmentSuffix}`,
        StateMachineType: 'EXPRESS',
      });
    });

    test('should create EventBridge custom event bus', () => {
      template.hasResourceProperties('AWS::Events::EventBus', {
        Name: `payment-events-${environmentSuffix}`,
      });
    });

    test('should create Monitoring stack with CloudWatch resources', () => {
      // API Gateway alarms
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `payment-api-4xx-errors-${environmentSuffix}`,
        MetricName: '4XXError',
        Namespace: 'AWS/ApiGateway',
      });

      // Lambda function errors
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `payment-validation-errors-${environmentSuffix}`,
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
      });

      // SQS queue depth alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `payment-queue-depth-${environmentSuffix}`,
        MetricName: 'ApproximateNumberOfMessagesVisible',
        Namespace: 'AWS/SQS',
      });
    });

    test('should create SNS topics for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `payment-critical-alerts-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `payment-system-alerts-${environmentSuffix}`,
      });
    });

    test('should have proper cross-stack outputs', () => {
      // Check that outputs exist for integration testing
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs)).toContain(
        `EnvironmentSuffix${environmentSuffix}`
      );
      expect(Object.keys(outputs)).toContain(`ApiUrl${environmentSuffix}`);
      expect(Object.keys(outputs)).toContain(`VpcId${environmentSuffix}`);
      expect(Object.keys(outputs)).toContain(
        `DatabaseEndpoint${environmentSuffix}`
      );
      expect(Object.keys(outputs)).toContain(
        `PaymentQueueUrl${environmentSuffix}`
      );
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

    test('should have CloudWatch log groups for Lambda functions', () => {
      // Lambda functions create log groups automatically
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      expect(Object.keys(logGroups).length).toBeGreaterThanOrEqual(2); // At least validation and processor
    });
  });

  describe('Resource Counts and Architecture Validation', () => {
    test('should maintain reasonable resource counts per stack concept', () => {
      const resources = template.toJSON().Resources;

      // Should have substantial resources for payment processing
      expect(Object.keys(resources).length).toBeGreaterThan(40);

      // Validate key resource types exist
      const resourceTypes = Object.values(resources).map((r: any) => r.Type);
      const typeCounts: { [key: string]: number } = {};

      resourceTypes.forEach(type => {
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });

      // Should have multiple Lambda functions
      expect(typeCounts['AWS::Lambda::Function']).toBeGreaterThanOrEqual(2);

      // Should have multiple CloudWatch alarms
      expect(typeCounts['AWS::CloudWatch::Alarm']).toBeGreaterThanOrEqual(5);

      // Should have SQS queues
      expect(typeCounts['AWS::SQS::Queue']).toBeGreaterThanOrEqual(2);
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
      expect(databases.length).toBeGreaterThanOrEqual(2); // Cluster + replica
    });
  });
});
