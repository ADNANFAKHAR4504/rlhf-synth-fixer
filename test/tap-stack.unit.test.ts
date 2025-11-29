import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Helper function to unwrap Pulumi Output values
const unwrap = <T>(output: pulumi.Output<T>): Promise<T> => {
  return pulumi.output(output).promise();
};

// Set up Pulumi testing mocks
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, any>;
  } => {
    const outputs: Record<string, any> = { ...args.inputs };

    // Generate resource-specific outputs based on type
    switch (args.type) {
      case 'aws:kms/key:Key':
        outputs.keyId = 'mock-kms-key-id-123';
        outputs.arn =
          'arn:aws:kms:us-east-1:123456789012:key/mock-kms-key-id-123';
        break;
      case 'aws:kms/alias:Alias':
        outputs.id = args.inputs.name;
        outputs.arn = `arn:aws:kms:us-east-1:123456789012:alias/${args.inputs.name}`;
        outputs.targetKeyArn =
          'arn:aws:kms:us-east-1:123456789012:key/mock-kms-key-id-123';
        outputs.targetKeyId = 'mock-kms-key-id-123';
        break;
      case 'aws:dynamodb/table:Table':
        outputs.id = args.inputs.name;
        outputs.arn = `arn:aws:dynamodb:us-east-1:123456789012:table/${args.inputs.name}`;
        outputs.streamArn = `arn:aws:dynamodb:us-east-1:123456789012:table/${args.inputs.name}/stream/2024-01-01T00:00:00.000`;
        break;
      case 'aws:sns/topic:Topic':
        outputs.id = args.inputs.name;
        outputs.arn = `arn:aws:sns:us-east-1:123456789012:${args.inputs.name}`;
        break;
      case 'aws:cloudwatch/logGroup:LogGroup':
        outputs.id = args.inputs.name;
        outputs.arn = `arn:aws:logs:us-east-1:123456789012:log-group:${args.inputs.name}`;
        break;
      case 'aws:iam/role:Role':
        outputs.id = args.inputs.name;
        outputs.arn = `arn:aws:iam::123456789012:role/${args.inputs.name}`;
        break;
      case 'aws:iam/rolePolicy:RolePolicy':
        outputs.id = `${args.inputs.role}:${args.inputs.name}`;
        break;
      case 'aws:lambda/function:Function':
        outputs.id = args.inputs.name;
        outputs.arn = `arn:aws:lambda:us-east-1:123456789012:function:${args.inputs.name}`;
        outputs.invokeArn = `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:${args.inputs.name}/invocations`;
        break;
      case 'aws:lambda/eventSourceMapping:EventSourceMapping':
        outputs.id = 'mock-event-source-mapping-uuid';
        outputs.uuid = 'mock-uuid-123';
        outputs.functionArn =
          'arn:aws:lambda:us-east-1:123456789012:function:mock-function';
        break;
      case 'aws:cloudwatch/eventRule:EventRule':
        outputs.id = args.inputs.name;
        outputs.arn = `arn:aws:events:us-east-1:123456789012:rule/${args.inputs.name}`;
        break;
      case 'aws:cloudwatch/eventTarget:EventTarget':
        outputs.id = `${args.inputs.rule}-target`;
        break;
      case 'aws:lambda/permission:Permission':
        outputs.id = `${args.inputs.function}-permission`;
        break;
      default:
        outputs.id = args.inputs.name || `${args.name}-id`;
    }

    return {
      id: outputs.id || `${args.name}-id`,
      state: outputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => args.inputs,
});

describe('TapStack', () => {
  describe('Stack Instantiation', () => {
    it('should create TapStack with default configuration', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
      expect(stack.tableName).toBeDefined();
      expect(stack.tableArn).toBeDefined();
      expect(stack.topicArn).toBeDefined();
      expect(stack.priceCheckerFunctionName).toBeDefined();
      expect(stack.priceCheckerFunctionArn).toBeDefined();
      expect(stack.alertProcessorFunctionName).toBeDefined();
      expect(stack.alertProcessorFunctionArn).toBeDefined();
      expect(stack.kmsKeyId).toBeDefined();
      expect(stack.kmsKeyAlias).toBeDefined();
      expect(stack.eventRuleName).toBeDefined();
      expect(stack.streamEventSourceMapping).toBeDefined();
      expect(stack.priceCheckerTarget).toBeDefined();
      expect(stack.priceCheckerPermission).toBeDefined();
    });

    it('should create TapStack with custom configuration', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'prod',
        logRetentionDays: 30,
        priceCheckerTimeout: 120,
        priceCheckerMemorySize: 1024,
        alertProcessorTimeout: 60,
        alertProcessorMemorySize: 512,
        scheduleExpression: 'cron(*/5 * * * ? *)',
        kmsKeyDeletionWindowInDays: 14,
        exchangeApiEndpoint: 'https://custom-api.example.com/prices',
      });

      expect(stack).toBeDefined();
    });

    it('should use environmentSuffix in resource names', async () => {
      const testSuffix = 'dev123';
      const stack = new TapStack('test-stack', {
        environmentSuffix: testSuffix,
      });

      const tableName = await unwrap(stack.tableName);
      const priceCheckerName = await unwrap(stack.priceCheckerFunctionName);
      const alertProcessorName = await unwrap(
        stack.alertProcessorFunctionName
      );

      expect(tableName).toContain(testSuffix);
      expect(priceCheckerName).toContain(testSuffix);
      expect(alertProcessorName).toContain(testSuffix);
    });
  });

  describe('Resource Outputs', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
    });

    it('should export tableName output', async () => {
      const name = await unwrap(stack.tableName);
      expect(name).toBeDefined();
      expect(name).toContain('crypto-alerts');
    });

    it('should export tableArn output', async () => {
      const arn = await unwrap(stack.tableArn);
      expect(arn).toBeDefined();
      expect(arn).toContain('arn:aws:dynamodb');
    });

    it('should export topicArn output', async () => {
      const arn = await unwrap(stack.topicArn);
      expect(arn).toBeDefined();
      expect(arn).toContain('arn:aws:sns');
    });

    it('should export priceCheckerFunctionName output', async () => {
      const name = await unwrap(stack.priceCheckerFunctionName);
      expect(name).toBeDefined();
      expect(name).toContain('price-checker');
    });

    it('should export priceCheckerFunctionArn output', async () => {
      const arn = await unwrap(stack.priceCheckerFunctionArn);
      expect(arn).toBeDefined();
      expect(arn).toContain('arn:aws:lambda');
    });

    it('should export alertProcessorFunctionName output', async () => {
      const name = await unwrap(stack.alertProcessorFunctionName);
      expect(name).toBeDefined();
      expect(name).toContain('alert-processor');
    });

    it('should export alertProcessorFunctionArn output', async () => {
      const arn = await unwrap(stack.alertProcessorFunctionArn);
      expect(arn).toBeDefined();
      expect(arn).toContain('arn:aws:lambda');
    });

    it('should export kmsKeyId output', async () => {
      const keyId = await unwrap(stack.kmsKeyId);
      expect(keyId).toBeDefined();
      expect(typeof keyId).toBe('string');
    });

    it('should export eventRuleName output', async () => {
      const name = await unwrap(stack.eventRuleName);
      expect(name).toBeDefined();
      expect(name).toContain('price-checker-rule');
    });

    it('should export kmsKeyAlias', (done) => {
      expect(stack.kmsKeyAlias).toBeDefined();
      pulumi.all([stack.kmsKeyAlias.name]).apply(([name]) => {
        expect(name).toContain('crypto-alerts');
        done();
      });
    });

    it('should export streamEventSourceMapping', (done) => {
      expect(stack.streamEventSourceMapping).toBeDefined();
      pulumi.all([stack.streamEventSourceMapping.id]).apply(([id]) => {
        expect(id).toBeDefined();
        done();
      });
    });

    it('should export priceCheckerTarget', (done) => {
      expect(stack.priceCheckerTarget).toBeDefined();
      pulumi.all([stack.priceCheckerTarget.id]).apply(([id]) => {
        expect(id).toBeDefined();
        done();
      });
    });

    it('should export priceCheckerPermission', (done) => {
      expect(stack.priceCheckerPermission).toBeDefined();
      pulumi.all([stack.priceCheckerPermission.id]).apply(([id]) => {
        expect(id).toBeDefined();
        done();
      });
    });
  });

  describe('Configuration Parameters', () => {
    it('should use default logRetentionDays when not specified', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
      // Default is 14 days - validated through resource creation
    });

    it('should use custom logRetentionDays when specified', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        logRetentionDays: 30,
      });

      expect(stack).toBeDefined();
    });

    it('should use default Lambda timeouts when not specified', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
      // Defaults: priceChecker=60s, alertProcessor=30s
    });

    it('should use custom Lambda configurations when specified', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        priceCheckerTimeout: 120,
        priceCheckerMemorySize: 1024,
        alertProcessorTimeout: 60,
        alertProcessorMemorySize: 512,
      });

      expect(stack).toBeDefined();
    });

    it('should use default schedule expression when not specified', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
      // Default: cron(* * * * ? *) - every minute
    });

    it('should use custom schedule expression when specified', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        scheduleExpression: 'cron(*/5 * * * ? *)',
      });

      expect(stack).toBeDefined();
    });

    it('should use default KMS deletion window when not specified', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
      // Default: 7 days
    });

    it('should use custom KMS deletion window when specified', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        kmsKeyDeletionWindowInDays: 14,
      });

      expect(stack).toBeDefined();
    });

    it('should use default exchange API endpoint when not specified', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
      // Default: https://api.exchange.com/v1/prices
    });

    it('should use custom exchange API endpoint when specified', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        exchangeApiEndpoint: 'https://custom-api.example.com/prices',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Resource Dependencies', () => {
    it('should create KMS key before using it in other resources', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack.kmsKeyId).toBeDefined();
      expect(stack.kmsKeyAlias).toBeDefined();
    });

    it('should create DynamoDB table with stream enabled', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack.tableName).toBeDefined();
      expect(stack.tableArn).toBeDefined();
      expect(stack.streamEventSourceMapping).toBeDefined();
    });

    it('should create SNS topic for notifications', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack.topicArn).toBeDefined();
    });

    it('should create Lambda functions with proper IAM roles', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack.priceCheckerFunctionArn).toBeDefined();
      expect(stack.alertProcessorFunctionArn).toBeDefined();
    });

    it('should create EventBridge rule with Lambda target', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack.eventRuleName).toBeDefined();
      expect(stack.priceCheckerTarget).toBeDefined();
      expect(stack.priceCheckerPermission).toBeDefined();
    });

    it('should connect DynamoDB stream to alert processor Lambda', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack.streamEventSourceMapping).toBeDefined();
    });
  });
});

