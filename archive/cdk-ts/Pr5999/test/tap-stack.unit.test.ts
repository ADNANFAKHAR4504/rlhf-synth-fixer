import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      env: { account: '123456789012', region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  describe('Infrastructure Resources', () => {
    test('Should create DynamoDB table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'TransactionHistory-test',
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });

    test('Should create SNS topic with environment suffix', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'FraudAlerts-test',
      });
    });

    test('Should create SQS FIFO queue with correct configuration', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'TransactionQueue-test.fifo',
        FifoQueue: true,
        ContentBasedDeduplication: true,
      });
    });

    test('Should create four dead letter queues', () => {
      const queues = template.findResources('AWS::SQS::Queue');
      const dlqCount = Object.values(queues).filter((queue: any) =>
        ['validator-dlq', 'processor-dlq', 'handler-dlq', 'batch-processor-dlq'].some(
          (dlq) => queue.Properties?.QueueName?.includes(dlq)
        )
      ).length;
      expect(dlqCount).toBe(4);
    });

    test('Should create four Lambda functions', () => {
      template.resourceCountIs('AWS::Lambda::Function', 5); // 4 + 1 LogRetention custom resource function
    });

    test('Should create transaction validator Lambda with correct config', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'transaction-validator-test',
        Runtime: 'nodejs18.x',
        MemorySize: 1024,
        Timeout: 300,
        Architectures: ['arm64'],
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('Should create FIFO processor Lambda with correct config', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'fifo-processor-test',
        Runtime: 'nodejs18.x',
        MemorySize: 512,
        Timeout: 300,
        Architectures: ['arm64'],
      });
    });

    test('Should create alert handler Lambda with correct config', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'fraud-alert-handler-test',
        Runtime: 'nodejs18.x',
        MemorySize: 256,
        Timeout: 300,
        Architectures: ['arm64'],
      });
    });

    test('Should create batch processor Lambda with correct config', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'batch-processor-test',
        Runtime: 'nodejs18.x',
        MemorySize: 512,
        Timeout: 300,
      });
    });

    test('Should create API Gateway REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'fraud-detection-api-test',
      });
    });

    test('Should create API key and usage plan', () => {
      template.resourceCountIs('AWS::ApiGateway::ApiKey', 1);
      template.resourceCountIs('AWS::ApiGateway::UsagePlan', 1);
    });

    test('Should create EventBridge rule for hourly batch processing', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'cron(0 * * * ? *)',
      });
    });

    test('Should create CloudWatch alarms for all Lambda functions', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 4);
    });

    test('Should create SSM parameters', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/fraud-detection/test/fraud-threshold',
      });
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/fraud-detection/test/alert-email',
      });
    });

    test('Should create SQS event source mapping for FIFO processor', () => {
      template.resourceCountIs('AWS::Lambda::EventSourceMapping', 1);
    });

    test('Should create SNS subscription for alert handler', () => {
      template.resourceCountIs('AWS::SNS::Subscription', 1);
    });
  });

  describe('IAM Permissions', () => {
    test('Should create IAM policies for Lambda functions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      expect(Object.keys(policies).length).toBeGreaterThan(0);
    });

    test('Should create IAM roles for Lambda functions', () => {
      const roles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeGreaterThan(0);
    });

    test('Should grant permissions to AWS services', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      let hasServicePermissions = false;
      Object.values(policies).forEach((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        statements.forEach((stmt: any) => {
          if (stmt.Action && stmt.Effect === 'Allow') {
            hasServicePermissions = true;
          }
        });
      });
      expect(hasServicePermissions).toBe(true);
    });

    test('Should enable X-Ray tracing permissions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const xrayPolicyCount = Object.values(policies).filter((policy: any) =>
        policy.Properties?.PolicyDocument?.Statement?.some(
          (stmt: any) =>
            stmt.Action?.includes('xray:PutTraceSegments') ||
            (Array.isArray(stmt.Action) &&
              stmt.Action.some((action: string) => action.includes('xray:')))
        )
      ).length;
      expect(xrayPolicyCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Stack Outputs', () => {
    test('Should have stack outputs defined', () => {
      const outputs = template.toJSON().Outputs;
      expect(outputs).toBeDefined();
      // Outputs are created programmatically with environmentSuffix
      // so we check that outputs exist
      expect(Object.keys(outputs || {}).length).toBeGreaterThan(0);
    });
  });

  describe('Resource Naming with environmentSuffix', () => {
    test('All resources should include environmentSuffix in names', () => {
      const resources = template.toJSON().Resources;
      const resourceNames = Object.values(resources)
        .map(
          (r: any) =>
            r.Properties?.FunctionName ||
            r.Properties?.TableName ||
            r.Properties?.QueueName ||
            r.Properties?.TopicName ||
            r.Properties?.Name
        )
        .filter(Boolean);

      resourceNames.forEach((name: any) => {
        if (
          typeof name === 'string' &&
          name &&
          !name.includes('LogRetention') &&
          !name.includes('Custom')
        ) {
          expect(name).toMatch(/test/);
        }
      });
    });
  });

  describe('Security and Compliance', () => {
    test('DynamoDB table should have encryption enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });

    test('API Gateway should have CloudWatch logging enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        TracingEnabled: true,
        MethodSettings: [
          {
            LoggingLevel: 'INFO',
            DataTraceEnabled: true,
            MetricsEnabled: true,
          },
        ],
      });
    });

    test('Lambda functions should have X-Ray tracing enabled', () => {
      const functions = template.findResources('AWS::Lambda::Function', {
        Properties: {
          TracingConfig: {
            Mode: 'Active',
          },
        },
      });
      expect(Object.keys(functions).length).toBeGreaterThanOrEqual(4);
    });

    test('API Gateway should require API key', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        ApiKeyRequired: true,
      });
    });
  });

  describe('Error Handling', () => {
    test('All Lambda functions should have dead letter queues', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      let dlqCount = 0;
      Object.values(functions).forEach((func: any) => {
        if (func.Properties?.DeadLetterConfig) {
          dlqCount++;
        }
      });
      expect(dlqCount).toBeGreaterThanOrEqual(4);
    });

    test('CloudWatch alarms should monitor error rates', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ComparisonOperator: 'GreaterThanThreshold',
        Threshold: 1,
      });
    });
  });

  describe('Environment Suffix Context', () => {
    test('Should use environment suffix from context', () => {
      const appWithContext = new cdk.App({
        context: { environmentSuffix: 'ctx-test' },
      });
      const stackWithContext = new TapStack(appWithContext, 'CtxTestStack');
      const ctxTemplate = Template.fromStack(stackWithContext);

      ctxTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'TransactionHistory-ctx-test',
      });
    });

    test('Should use default environment suffix when not provided', () => {
      const appNoSuffix = new cdk.App();
      const stackNoSuffix = new TapStack(appNoSuffix, 'DefaultStack');
      const defaultTemplate = Template.fromStack(stackNoSuffix);

      defaultTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'TransactionHistory-dev',
      });
    });
  });

  describe('Resource Relationships', () => {
    test('FIFO processor should be subscribed to transaction queue', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        BatchSize: 10,
      });
    });

    test('Alert handler should be subscribed to SNS topic', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'lambda',
      });
    });

    test('Batch processor should have EventBridge trigger', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Principal: 'events.amazonaws.com',
      });
    });
  });
});
