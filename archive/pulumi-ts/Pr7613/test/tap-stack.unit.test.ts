import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

/**
 * Unit tests for TapStack
 * Tests the main stack component that orchestrates Lambda ETL infrastructure
 */

// Set up Pulumi mocks (shared with other tests)
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

describe('TapStack', () => {
  describe('Stack Instantiation', () => {
    it('should create stack with custom environmentSuffix', async () => {
      const stack = new TapStack('test-tap-stack', {
        environmentSuffix: 'prod123',
      });
      expect(stack).toBeDefined();
      expect(stack.apiHandlerFunctionArn).toBeDefined();
      expect(stack.batchProcessorFunctionArn).toBeDefined();
      expect(stack.transformFunctionArn).toBeDefined();
      expect(stack.dlqUrl).toBeDefined();
      expect(stack.layerArn).toBeDefined();
    });

    it('should create stack with default environmentSuffix', async () => {
      const stack = new TapStack('test-tap-default', {});
      expect(stack).toBeDefined();
    });

    it('should create stack with tags', async () => {
      const tags = {
        Project: 'ETL',
        Team: 'DataEngineering',
      };
      const stack = new TapStack('test-tap-tags', {
        environmentSuffix: 'staging',
        tags: tags,
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Stack Outputs', () => {
    it('should expose all Lambda function ARNs', (done) => {
      const stack = new TapStack('output-test-tap', {
        environmentSuffix: 'output123',
      });

      pulumi
        .all([
          stack.apiHandlerFunctionArn,
          stack.batchProcessorFunctionArn,
          stack.transformFunctionArn,
        ])
        .apply(([api, batch, transform]) => {
          expect(api).toBeDefined();
          expect(batch).toBeDefined();
          expect(transform).toBeDefined();
          done();
        });
    });

    it('should expose DLQ URL', (done) => {
      const stack = new TapStack('dlq-test-tap', {
        environmentSuffix: 'dlq456',
      });

      stack.dlqUrl.apply((url) => {
        expect(url).toBeDefined();
        expect(url).toContain('sqs');
        done();
      });
    });

    it('should expose Lambda layer ARN', (done) => {
      const stack = new TapStack('layer-test-tap', {
        environmentSuffix: 'layer789',
      });

      stack.layerArn.apply((arn) => {
        expect(arn).toBeDefined();
        expect(arn).toContain('layer');
        done();
      });
    });
  });

  describe('Environment Configuration', () => {
    it('should pass environmentSuffix to child stack', async () => {
      const suffix = 'env-test-123';
      const stack = new TapStack('env-config-test', {
        environmentSuffix: suffix,
      });
      expect(stack).toBeDefined();
    });
  });
});
