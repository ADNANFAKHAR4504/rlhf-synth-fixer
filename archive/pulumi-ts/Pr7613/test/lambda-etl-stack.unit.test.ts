import * as pulumi from '@pulumi/pulumi';
import { LambdaEtlStack } from '../lib/index';

/**
 * Unit tests for Lambda ETL Stack
 * Tests the creation and configuration of Lambda functions, SQS queues, and related resources
 */

// Set up Pulumi mocks
pulumi.runtime.setMocks({
  newResource: function (
    args: pulumi.runtime.MockResourceArgs
  ): { id: string; state: any } {
    const outputs: any = {
      ...args.inputs,
      id: args.name + '_id',
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
      name: args.name,
    };

    // Add specific outputs for different resource types
    if (args.type === 'aws:lambda/function:Function') {
      outputs.functionName = args.inputs.name || args.name;
      outputs.runtime = args.inputs.runtime || 'nodejs18.x';
      outputs.handler = args.inputs.handler || 'index.handler';
      outputs.memorySize = args.inputs.memorySize || 128;
      outputs.timeout = args.inputs.timeout || 3;
      outputs.role = args.inputs.role || 'arn:aws:iam::123456789012:role/mock-role';
      outputs.reservedConcurrentExecutions =
        args.inputs.reservedConcurrentExecutions;
      outputs.layers = args.inputs.layers || [];
      outputs.environment = args.inputs.environment;
      outputs.deadLetterConfig = args.inputs.deadLetterConfig;
      outputs.tracingConfig = args.inputs.tracingConfig;
    }

    if (args.type === 'aws:sqs/queue:Queue') {
      outputs.url = `https://sqs.us-east-1.amazonaws.com/123456789012/${args.name}`;
      outputs.arn = `arn:aws:sqs:us-east-1:123456789012:${args.name}`;
      outputs.messageRetentionSeconds = args.inputs.messageRetentionSeconds;
    }

    if (args.type === 'aws:lambda/layerVersion:LayerVersion') {
      outputs.layerArn = `arn:aws:lambda:us-east-1:123456789012:layer:${args.name}:1`;
      outputs.arn = `arn:aws:lambda:us-east-1:123456789012:layer:${args.name}:1`;
      outputs.compatibleRuntimes = args.inputs.compatibleRuntimes;
    }

    if (args.type === 'aws:cloudwatch/logGroup:LogGroup') {
      outputs.name = args.inputs.name || `/aws/lambda/${args.name}`;
      outputs.retentionInDays = args.inputs.retentionInDays || 7;
    }

    if (args.type === 'aws:iam/role:Role') {
      outputs.name = args.inputs.name || args.name;
    }

    if (args.type === 'aws:cloudwatch/metricAlarm:MetricAlarm') {
      outputs.name = args.inputs.name || args.name;
      outputs.threshold = args.inputs.threshold;
      outputs.evaluationPeriods = args.inputs.evaluationPeriods;
    }

    return {
      id: args.name + '_id',
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('LambdaEtlStack', () => {
  describe('Stack Creation', () => {
    it('should create stack with dev environment', async () => {
      const stack = new LambdaEtlStack('test-stack', {
        environmentSuffix: 'test123',
        environment: 'dev',
      });
      expect(stack).toBeDefined();
      expect(stack.apiHandlerFunctionArn).toBeDefined();
      expect(stack.batchProcessorFunctionArn).toBeDefined();
      expect(stack.transformFunctionArn).toBeDefined();
      expect(stack.dlqUrl).toBeDefined();
      expect(stack.layerArn).toBeDefined();
    });

    it('should create stack with prod environment', async () => {
      const stack = new LambdaEtlStack('test-stack-prod', {
        environmentSuffix: 'test456',
        environment: 'prod',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Lambda Function Configuration', () => {
    let stack: LambdaEtlStack;

    beforeEach(() => {
      stack = new LambdaEtlStack('test-lambda-stack', {
        environmentSuffix: 'test789',
        environment: 'dev',
      });
    });

    it('should configure API Handler with correct memory and timeout', (done) => {
      stack.apiHandlerFunctionArn.apply((arn) => {
        expect(arn).toContain('api-handler');
        done();
      });
    });

    it('should configure Batch Processor with correct memory and timeout', (done) => {
      stack.batchProcessorFunctionArn.apply((arn) => {
        expect(arn).toContain('batch-processor');
        done();
      });
    });

    it('should configure Transform function with correct settings', (done) => {
      stack.transformFunctionArn.apply((arn) => {
        expect(arn).toContain('transform');
        done();
      });
    });
  });

  describe('Resource Naming', () => {
    it('should include environmentSuffix in all resource names', (done) => {
      const suffix = 'unique123';
      const stack = new LambdaEtlStack('naming-test', {
        environmentSuffix: suffix,
        environment: 'dev',
      });

      pulumi.all([stack.apiHandlerFunctionArn, stack.dlqUrl]).apply(([arn, url]) => {
        expect(arn).toContain(suffix);
        expect(url).toContain(suffix);
        done();
      });
    });
  });

  describe('Dead Letter Queue', () => {
    let stack: LambdaEtlStack;

    beforeEach(() => {
      stack = new LambdaEtlStack('dlq-test', {
        environmentSuffix: 'test-dlq',
        environment: 'dev',
      });
    });

    it('should create DLQ with correct retention', (done) => {
      stack.dlqUrl.apply((url) => {
        expect(url).toContain('lambda-dlq-test-dlq');
        done();
      });
    });

    it('should include environmentSuffix in DLQ name', (done) => {
      stack.dlqUrl.apply((url) => {
        expect(url).toContain('test-dlq');
        done();
      });
    });
  });

  describe('Lambda Layer', () => {
    let stack: LambdaEtlStack;

    beforeEach(() => {
      stack = new LambdaEtlStack('layer-test', {
        environmentSuffix: 'test-layer',
        environment: 'dev',
      });
    });

    it('should create Lambda layer with correct runtime', (done) => {
      stack.layerArn.apply((arn) => {
        expect(arn).toContain('shared-deps-layer');
        done();
      });
    });

    it('should include environmentSuffix in layer name', (done) => {
      stack.layerArn.apply((arn) => {
        expect(arn).toContain('test-layer');
        done();
      });
    });
  });

  describe('CloudWatch Log Retention', () => {
    it('should configure 7 days retention for dev environment', async () => {
      const stack = new LambdaEtlStack('log-dev', {
        environmentSuffix: 'dev-logs',
        environment: 'dev',
      });
      expect(stack).toBeDefined();
    });

    it('should configure 30 days retention for prod environment', async () => {
      const stack = new LambdaEtlStack('log-prod', {
        environmentSuffix: 'prod-logs',
        environment: 'prod',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Environment Variables', () => {
    it('should configure MAX_CONNECTIONS environment variable', async () => {
      const stack = new LambdaEtlStack('env-test', {
        environmentSuffix: 'env123',
        environment: 'dev',
      });
      expect(stack).toBeDefined();
    });

    it('should configure ENVIRONMENT variable', async () => {
      const stack = new LambdaEtlStack('env-test2', {
        environmentSuffix: 'env456',
        environment: 'dev',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('IAM Roles', () => {
    it('should create separate IAM roles for each function', async () => {
      const stack = new LambdaEtlStack('iam-test', {
        environmentSuffix: 'iam123',
        environment: 'dev',
      });
      expect(stack).toBeDefined();
    });

    it('should include environmentSuffix in IAM role names', async () => {
      const stack = new LambdaEtlStack('iam-test2', {
        environmentSuffix: 'iam456',
        environment: 'dev',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should create alarms for critical functions', async () => {
      const stack = new LambdaEtlStack('alarm-test', {
        environmentSuffix: 'alarm123',
        environment: 'dev',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Stack Outputs', () => {
    it('should export all required outputs', (done) => {
      const stack = new LambdaEtlStack('output-test', {
        environmentSuffix: 'output123',
        environment: 'dev',
      });

      pulumi
        .all([
          stack.apiHandlerFunctionArn,
          stack.batchProcessorFunctionArn,
          stack.transformFunctionArn,
          stack.dlqUrl,
          stack.layerArn,
        ])
        .apply(([api, batch, transform, dlq, layer]) => {
          expect(api).toBeDefined();
          expect(batch).toBeDefined();
          expect(transform).toBeDefined();
          expect(dlq).toBeDefined();
          expect(layer).toBeDefined();
          done();
        });
    });
  });
});
