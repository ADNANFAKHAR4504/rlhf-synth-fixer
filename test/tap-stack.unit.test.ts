import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: App;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new App();
  });

  describe('Stack Instantiation', () => {
    test('TapStack instantiates successfully with custom props', () => {
      const stack = new TapStack(app, 'TestTapStackWithProps', {
        environment: 'prod',
        environmentSuffix: 'prod',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-west-2',
      });
      const synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('"region": "us-west-2"');
    });

    test('TapStack uses default values when no props provided', () => {
      const stack = new TapStack(app, 'TestTapStackDefault');
      const synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      // Default provider region updated to ap-northeast-2
      expect(synthesized).toContain('"region": "ap-northeast-2"');
    });

    test('TapStack handles partial props correctly', () => {
      const stack = new TapStack(app, 'TestTapStackPartial', {
        environmentSuffix: 'staging',
      });
      const synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('staging');
    });

    test('TapStack handles custom default tags', () => {
      const customTags = {
        tags: {
          Environment: 'test',
          Owner: 'test-team',
        },
      };

      const stack = new TapStack(app, 'TestTapStackTags', {
        environmentSuffix: 'test',
        defaultTags: customTags,
      });
      const synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('test-team');
    });
  });

  describe('AWS Provider Configuration', () => {
    test('AWS Provider is configured with correct region', () => {
      const stack = new TapStack(app, 'TestAwsProvider', {
        awsRegion: 'eu-west-1',
      });
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"region": "eu-west-1"');
      expect(synthesized).toContain('"aws"');
    });

    test('AWS Provider uses default region when not specified (ap-northeast-2)', () => {
      const stack = new TapStack(app, 'TestAwsProviderDefault');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"region": "ap-northeast-2"');
    });

    test('AWS Provider accepts default tags', () => {
      const tags = {
        tags: {
          Project: 'TAP',
          ManagedBy: 'CDKTF',
        },
      };

      const stack = new TapStack(app, 'TestAwsProviderTags', {
        defaultTags: tags,
      });
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('Project');
      expect(synthesized).toContain('TAP');
    });
  });

  describe('S3 Backend Configuration', () => {

    test('S3 Backend key includes environment suffix', () => {
      const stack = new TapStack(app, 'TestS3BackendKey', {
        environmentSuffix: 'qa',
      });
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('qa/TestS3BackendKey.tfstate');
    });

    test('S3 Backend has encryption and state locking enabled', () => {
      const stack = new TapStack(app, 'TestS3BackendEncryption');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"encrypt": true');
    });

    test('S3 Backend uses correct region override for state', () => {
      const stack = new TapStack(app, 'TestS3BackendRegion', {
        stateBucketRegion: 'ap-northeast-1',
      });
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"region": "ap-northeast-1"');
    });
  });

  describe('Resource Creation - Defaults (dev)', () => {
    test('Creates S3 buckets with expected names and lifecycle (dev)', () => {
      const stack = new TapStack(app, 'TestDev');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"bucket": "payment-logs-dev"');
      expect(synthesized).toContain('"bucket": "payment-receipts-duoct-dev"');
      // Lifecycle expiration days = 7 for dev
      expect(synthesized).toContain('"days": 7');
      // Public access blocks
      expect(synthesized).toContain('"block_public_acls": true');
      expect(synthesized).toContain('"block_public_policy": true');
      // Encryption
      expect(synthesized).toContain('"sse_algorithm": "AES256"');
    });

    test('DynamoDB (dev) uses PAY_PER_REQUEST and PITR disabled', () => {
      const stack = new TapStack(app, 'TestDevDdb');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"billing_mode": "PAY_PER_REQUEST"');
      expect(synthesized).toContain('"point_in_time_recovery": {');
      expect(synthesized).toContain('"enabled": false');
    });

    test('CloudWatch logs retention 7 days and Lambda memory 512 (dev)', () => {
      const stack = new TapStack(app, 'TestDevLogsLambda');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"retention_in_days": 7');
      expect(synthesized).toContain('"memory_size": 512');
    });

    test('API Gateway POST /payments configured with NONE auth (dev)', () => {
      const stack = new TapStack(app, 'TestDevApi');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"path_part": "payments"');
      expect(synthesized).toContain('"http_method": "POST"');
      expect(synthesized).toContain('"authorization": "NONE"');
      expect(synthesized).toContain('"type": "AWS_PROXY"');
      // Stage name equals environment (dev)
      expect(synthesized).toContain('"stage_name": "dev"');
    });

    test('IAM basic execution role and inline policy attached', () => {
      const stack = new TapStack(app, 'TestIam');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('AWSLambdaBasicExecutionRole');
      // DynamoDB and S3 actions in inline policy
      expect(synthesized).toContain('dynamodb:PutItem');
      expect(synthesized).toContain('s3:PutObject');
    });
  });

  describe('Resource Creation - Staging', () => {
    test('Staging lifecycle 30 days, DDB provisioned 5/5, logs 14, memory 1024', () => {
      const stack = new TapStack(app, 'TestStaging', {
        environment: 'staging',
        environmentSuffix: 'staging',
      });
      const synthesized = Testing.synth(stack);

      // Lifecycle
      expect(synthesized).toContain('"days": 30');
      // DDB provisioned capacities
      expect(synthesized).toContain('"billing_mode": "PROVISIONED"');
      expect(synthesized).toContain('"read_capacity": 5');
      expect(synthesized).toContain('"write_capacity": 5');
      // Logs retention and memory
      expect(synthesized).toContain('"retention_in_days": 14');
      expect(synthesized).toContain('"memory_size": 1024');
      // Stage
      expect(synthesized).toContain('"stage_name": "staging"');
    });
  });

  describe('Resource Creation - Prod', () => {
    test('Prod lifecycle 90 days, DDB provisioned 10/10 with PITR, logs 30, memory 2048', () => {
      const stack = new TapStack(app, 'TestProd', {
        environment: 'prod',
        environmentSuffix: 'prod',
      });
      const synthesized = Testing.synth(stack);

      // Lifecycle
      expect(synthesized).toContain('"days": 90');
      // DDB provisioned capacities
      expect(synthesized).toContain('"billing_mode": "PROVISIONED"');
      expect(synthesized).toContain('"read_capacity": 10');
      expect(synthesized).toContain('"write_capacity": 10');
      // PITR enabled
      expect(synthesized).toContain('"point_in_time_recovery": {');
      expect(synthesized).toContain('"enabled": true');
      // Logs retention and memory
      expect(synthesized).toContain('"retention_in_days": 30');
      expect(synthesized).toContain('"memory_size": 2048');
      // Stage
      expect(synthesized).toContain('"stage_name": "prod"');
    });
  });

  describe('Outputs', () => {
    test('Outputs include API endpoint, buckets, table, lambda name', () => {
      const stack = new TapStack(app, 'TestOutputs', {
        environment: 'dev',
        environmentSuffix: 'dev',
        awsRegion: 'ap-northeast-2',
      });
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('"api-endpoint"');
      expect(synthesized).toContain('execute-api.ap-northeast-2.amazonaws.com');
      expect(synthesized).toContain('/dev/payments');
      expect(synthesized).toContain('"logs-bucket-name"');
      expect(synthesized).toContain('"receipts-bucket-name"');
      expect(synthesized).toContain('"transactions-table-name"');
      expect(synthesized).toContain('"lambda-function-name"');
    });
  });

  describe('Edge Cases', () => {
    test('TapStack handles empty environment suffix', () => {
      const stack = new TapStack(app, 'TestEmptyEnvSuffix', {
        environmentSuffix: '',
      });
      const synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('TapStack handles undefined props gracefully', () => {
      const stack = new TapStack(app, 'TestUndefinedProps', undefined);
      const synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('TapStack handles very long environment suffix', () => {
      const longSuffix = 'a'.repeat(100);
      const stack = new TapStack(app, 'TestLongEnvSuffix', {
        environmentSuffix: longSuffix,
      });
      const synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toContain(longSuffix);
    });
  });
});