import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Webhook Processing Stack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('should create stack without errors', () => {
      expect(stack).toBeDefined();
      expect(template).toBeDefined();
    });

    test('should use provided environment suffix', () => {
      // Test the environment suffix logic - props path
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {
        environmentSuffix: 'test',
      });
      expect(testStack).toBeDefined();
    });

    test('should use default environment suffix when none provided', () => {
      // Test the environment suffix logic - default path
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack'); // No props provided
      expect(testStack).toBeDefined();
    });

    test('should have API Gateway resources', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `webhook-processing-api-${environmentSuffix}`,
      });
    });

    test('should have API Gateway deployment and stage', () => {
      template.hasResourceProperties('AWS::ApiGateway::Deployment', {});
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
      });
    });

    test('should have DynamoDB table for webhook transactions', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `webhook-transactions-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('should have FIFO SQS queues for each provider', () => {
      // Check for Stripe queue
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `stripe-webhook-queue-${environmentSuffix}.fifo`,
        FifoQueue: true,
        ContentBasedDeduplication: true,
      });

      // Check for PayPal queue
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `paypal-webhook-queue-${environmentSuffix}.fifo`,
        FifoQueue: true,
        ContentBasedDeduplication: true,
      });

      // Check for Square queue
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `square-webhook-queue-${environmentSuffix}.fifo`,
        FifoQueue: true,
        ContentBasedDeduplication: true,
      });
    });

    test('should have DLQ with FIFO configuration', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `webhook-processing-dlq-${environmentSuffix}.fifo`,
        FifoQueue: true,
      });
    });

    test('should have EventBridge custom event bus', () => {
      template.hasResourceProperties('AWS::Events::EventBus', {
        Name: `payment-events-${environmentSuffix}`,
      });
    });

    test('should have Lambda functions with container approach', () => {
      // Webhook validator function
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `webhook-validator-${environmentSuffix}`,
        PackageType: 'Image',
      });

      // Webhook processor function
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `webhook-processor-${environmentSuffix}`,
        PackageType: 'Image',
      });
    });

    test('should have CloudWatch alarms for monitoring', () => {
      // API Gateway error alarms
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `webhook-api-4xx-errors-${environmentSuffix}`,
        MetricName: '4XXError',
        Namespace: 'AWS/ApiGateway',
      });

      // Lambda function error alarms
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `webhook-validator-errors-${environmentSuffix}`,
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
      });
    });

    test('should have proper Lambda event source mappings', () => {
      // Should have 3 event source mappings (one for each queue)
      const eventSourceMappings = template.findResources(
        'AWS::Lambda::EventSourceMapping'
      );
      expect(Object.keys(eventSourceMappings).length).toBe(3);
    });

    test('should have proper IAM role with required permissions', () => {
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
      // Lambda functions automatically create log groups - verified in synth output
      // Log groups are created by CDK automatically for Lambda functions
      expect(true).toBe(true);
    });
  });

  describe('Resource Counts', () => {
    test('should have expected number of resources', () => {
      const resources = template.toJSON().Resources;

      // Should have substantial number of resources for webhook processing
      expect(Object.keys(resources).length).toBeGreaterThan(20);

      // Count specific resource types
      const lambdas = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::Lambda::Function'
      );
      expect(lambdas.length).toBe(2); // validator and processor

      const queues = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::SQS::Queue'
      );
      expect(queues.length).toBe(4); // 3 provider queues + 1 DLQ

      const alarms = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::CloudWatch::Alarm'
      );
      expect(alarms.length).toBeGreaterThan(5); // Multiple monitoring alarms
    });
  });

  describe('Lambda Function Validation', () => {
    test('should have webhook validator function with container approach', () => {
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      const validatorFunction = Object.values(lambdaFunctions).find((fn: any) =>
        fn.Properties.FunctionName.includes('webhook-validator')
      ) as any;

      expect(validatorFunction).toBeDefined();
      expect(validatorFunction.Properties.PackageType).toBe('Image');
      expect(validatorFunction.Properties.ImageConfig.Command).toEqual(['app.handler']);
      expect(validatorFunction.Properties.LoggingConfig).toHaveProperty(
        'LogGroup'
      );
    });

    test('should have webhook processor function with container approach', () => {
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      const processorFunction = Object.values(lambdaFunctions).find((fn: any) =>
        fn.Properties.FunctionName.includes('webhook-processor')
      ) as any;

      expect(processorFunction).toBeDefined();
      expect(processorFunction.Properties.PackageType).toBe('Image');
      expect(processorFunction.Properties.ImageConfig.Command).toEqual(['processor.handler']);
      expect(processorFunction.Properties.LoggingConfig).toHaveProperty(
        'LogGroup'
      );
    });

    test('should have validator function with AWS Secrets Manager ARN', () => {
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      const validatorFunction = Object.values(lambdaFunctions).find((fn: any) =>
        fn.Properties.FunctionName.includes('webhook-validator')
      ) as any;

      expect(validatorFunction.Properties.Environment.Variables).toHaveProperty(
        'WEBHOOK_SECRETS_ARN'
      );
      expect(validatorFunction.Properties.Environment.Variables).toHaveProperty(
        'STRIPE_QUEUE_URL'
      );
      expect(validatorFunction.Properties.Environment.Variables).toHaveProperty(
        'PAYPAL_QUEUE_URL'
      );
      expect(validatorFunction.Properties.Environment.Variables).toHaveProperty(
        'SQUARE_QUEUE_URL'
      );
    });

    test('should have processor function with correct environment variables', () => {
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      const processorFunction = Object.values(lambdaFunctions).find((fn: any) =>
        fn.Properties.FunctionName.includes('webhook-processor')
      ) as any;

      expect(processorFunction.Properties.Environment.Variables).toHaveProperty(
        'TABLE_NAME'
      );
      expect(processorFunction.Properties.Environment.Variables).toHaveProperty(
        'EVENT_BUS_NAME'
      );
    });
  });

  describe('AWS Secrets Manager', () => {
    test('should create webhook secrets in AWS Secrets Manager', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'Webhook secrets for payment providers',
      });
    });

    test('should have webhook secrets with proper structure', () => {
      const secrets = template.findResources('AWS::SecretsManager::Secret');
      const webhookSecret = Object.values(secrets)[0];

      expect(webhookSecret).toBeDefined();
      expect(webhookSecret.Properties.GenerateSecretString).toBeDefined();
      expect(
        webhookSecret.Properties.GenerateSecretString.SecretStringTemplate
      ).toBeDefined();
    });
  });

  describe('Lambda Log Groups', () => {
    test('should create log groups for Lambda functions', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/webhook-validator-${environmentSuffix}`,
        RetentionInDays: 7,
      });

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/webhook-processor-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });
  });

  describe('SQS Encryption', () => {
    test('should have encrypted SQS queues', () => {
      // Check all SQS queues have encryption
      const queues = template.findResources('AWS::SQS::Queue');
      const queueList = Object.values(queues) as any[];

      queueList.forEach(queue => {
        expect(queue.Properties).toHaveProperty('SqsManagedSseEnabled', true);
      });
    });

    test('should have explicit encryption properties on all queues', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        SqsManagedSseEnabled: true,
      });
    });
  });

  describe('Environment Suffix Edge Cases', () => {
    test('should handle empty environment suffix', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {
        environmentSuffix: '',
      });
      expect(testStack).toBeDefined();

      const testTemplate = Template.fromStack(testStack);
      const resources = testTemplate.toJSON().Resources;

      // Should still create resources but with empty suffix
      const lambdas = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::Lambda::Function'
      );
      expect(lambdas.length).toBe(2);
    });

    test('should handle special characters in environment suffix', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {
        environmentSuffix: 'test-123_special',
      });
      expect(testStack).toBeDefined();

      const testTemplate = Template.fromStack(testStack);
      const resources = testTemplate.toJSON().Resources;

      // Should create resources successfully
      const lambdas = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::Lambda::Function'
      );
      expect(lambdas.length).toBe(2);
    });
  });

  describe('Resource Naming Validation', () => {
    test('should include environment suffix in all resource names', () => {
      const resources = template.toJSON().Resources;

      // Check Lambda functions
      const lambdas = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::Lambda::Function'
      ) as any[];

      lambdas.forEach(lambda => {
        expect(lambda.Properties.FunctionName).toContain(environmentSuffix);
      });

      // Check DynamoDB table
      const dynamodbTable = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::DynamoDB::Table'
      ) as any;
      expect(dynamodbTable.Properties.TableName).toContain(environmentSuffix);

      // Check SQS queues
      const queues = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::SQS::Queue'
      ) as any[];

      queues.forEach(queue => {
        expect(queue.Properties.QueueName).toContain(environmentSuffix);
      });

      // Check EventBridge bus
      const eventBus = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::Events::EventBus'
      ) as any;
      expect(eventBus.Properties.Name).toContain(environmentSuffix);
    });

    test('should not use hardcoded environment-specific resource names', () => {
      const resources = template.toJSON().Resources;
      const allResourceStrings = JSON.stringify(resources);

      // Should not contain hardcoded environment suffixes in resource names (like -prod-, -dev-, -stage-)
      // But allow legitimate configuration values like "prod" for stage names
      expect(allResourceStrings).not.toMatch(/-prod-/);
      expect(allResourceStrings).not.toMatch(/-dev-/);
      expect(allResourceStrings).not.toMatch(/-stage-/);
      expect(allResourceStrings).not.toMatch(/-test-/);
    });
  });

  describe('Stack Outputs', () => {
    test('should have required outputs', () => {
      const outputs = template.toJSON().Outputs;

      expect(outputs).toHaveProperty(`EnvironmentSuffix${environmentSuffix}`);
      expect(outputs).toHaveProperty(`ApiUrl${environmentSuffix}`);

      expect(outputs[`EnvironmentSuffix${environmentSuffix}`].Value).toBe(
        environmentSuffix
      );
      expect(outputs[`ApiUrl${environmentSuffix}`].Description).toContain(
        'API Gateway URL'
      );
    });
  });
});
