import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('Stack Structure', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('TapStack instantiates successfully via props', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackWithProps', {
      environmentSuffix: 'prod',
      stateBucket: 'custom-state-bucket',
      stateBucketRegion: 'us-west-2',
      awsRegion: 'us-west-2',
    });
    synthesized = Testing.synth(stack);

    // Verify that TapStack instantiates without errors via props
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('TapStack uses default values when no props provided', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackDefault');
    synthesized = Testing.synth(stack);

    // Verify that TapStack instantiates without errors when no props are provided
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });
});

describe('Resource Configuration Tests', () => {
  let app: App;
  let stack: TapStack;
  let manifest: any;

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      awsRegion: 'ap-southeast-1',
    });
    const synthesized = Testing.synth(stack);
    manifest = JSON.parse(synthesized);
  });

  describe('S3 Configuration', () => {
    test('S3 bucket versioning is enabled', () => {
      const versioning = manifest.resource['aws_s3_bucket_versioning'];
      expect(versioning).toBeDefined();
      const versioningConfig = Object.values(versioning)[0] as any;
      expect(versioningConfig.versioning_configuration.status).toBe('Enabled');
    });

    test('S3 bucket has correct tags', () => {
      const buckets = manifest.resource['aws_s3_bucket'];
      const bucket = Object.values(buckets)[0] as any;
      expect(bucket.tags.Environment).toBe('Production');
      expect(bucket.tags.Team).toBe('Platform');
    });
  });

  describe('DynamoDB Configuration', () => {
    test('DynamoDB uses on-demand billing', () => {
      const tables = manifest.resource['aws_dynamodb_table'];
      const table = Object.values(tables)[0] as any;
      expect(table.billing_mode).toBe('PAY_PER_REQUEST');
    });

    test('DynamoDB has webhookId as hash key', () => {
      const tables = manifest.resource['aws_dynamodb_table'];
      const table = Object.values(tables)[0] as any;
      expect(table.hash_key).toBe('webhookId');
      expect(table.attribute[0]).toEqual({ name: 'webhookId', type: 'S' });
    });

    test('DynamoDB TTL is enabled', () => {
      const tables = manifest.resource['aws_dynamodb_table'];
      const table = Object.values(tables)[0] as any;
      expect(table.ttl.enabled).toBe(true);
      expect(table.ttl.attribute_name).toBe('expiryTime');
    });
  });

  describe('SQS Configuration', () => {
    test('Main queue has correct visibility timeout (6x Lambda timeout)', () => {
      const queues = manifest.resource['aws_sqs_queue'];
      const mainQueue = Object.values(queues).find((q: any) => !q.name.includes('dlq')) as any;
      expect(mainQueue.visibility_timeout_seconds).toBe(180);
    });

    test('DLQ has 14 days retention', () => {
      const queues = manifest.resource['aws_sqs_queue'];
      const dlq = Object.values(queues).find((q: any) => q.name.includes('dlq')) as any;
      expect(dlq.message_retention_seconds).toBe(1209600);
    });

    test('Main queue has redrive policy with 3 retries', () => {
      const queues = manifest.resource['aws_sqs_queue'];
      const mainQueue = Object.values(queues).find((q: any) => !q.name.includes('dlq')) as any;
      const redrivePolicy = JSON.parse(mainQueue.redrive_policy);
      expect(redrivePolicy.maxReceiveCount).toBe(3);
    });
  });

  describe('Lambda Configuration', () => {
    test('Validator Lambda has correct runtime and memory', () => {
      const functions = manifest.resource['aws_lambda_function'];
      const validator = Object.values(functions).find((f: any) => f.function_name.includes('validator')) as any;
      expect(validator.runtime).toBe('nodejs18.x');
      expect(validator.memory_size).toBe(512);
      expect(validator.timeout).toBe(30);
    });

    test('Processor Lambda has correct runtime and memory', () => {
      const functions = manifest.resource['aws_lambda_function'];
      const processor = Object.values(functions).find((f: any) => f.function_name.includes('processor')) as any;
      expect(processor.runtime).toBe('nodejs18.x');
      expect(processor.memory_size).toBe(512);
      expect(processor.timeout).toBe(30);
    });

    test('All Lambda functions have X-Ray tracing enabled', () => {
      const functions = manifest.resource['aws_lambda_function'];
      Object.values(functions).forEach((func: any) => {
        expect(func.tracing_config.mode).toBe('Active');
      });
    });

    test('Validator Lambda has required environment variables', () => {
      const functions = manifest.resource['aws_lambda_function'];
      const validator = Object.values(functions).find((f: any) => f.function_name.includes('validator')) as any;
      expect(validator.environment.variables.TABLE_NAME).toBeDefined();
      expect(validator.environment.variables.QUEUE_URL).toBeDefined();
    });

    test('Processor Lambda has required environment variables', () => {
      const functions = manifest.resource['aws_lambda_function'];
      const processor = Object.values(functions).find((f: any) => f.function_name.includes('processor')) as any;
      expect(processor.environment.variables.BUCKET_NAME).toBeDefined();
      expect(processor.environment.variables.TABLE_NAME).toBeDefined();
    });
  });

  describe('IAM Configuration', () => {
    test('Lambda roles are created', () => {
      const roles = manifest.resource['aws_iam_role'];
      const roleNames = Object.values(roles).map((r: any) => r.name);
      expect(roleNames.some(name => name.includes('validator'))).toBe(true);
      expect(roleNames.some(name => name.includes('processor'))).toBe(true);
    });

    test('Basic execution policy is attached to Lambda roles', () => {
      const attachments = manifest.resource['aws_iam_role_policy_attachment'];
      const basicExecAttachments = Object.values(attachments).filter((a: any) =>
        a.policy_arn === 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
      expect(basicExecAttachments.length).toBeGreaterThanOrEqual(2);
    });

    test('X-Ray write access is attached to Lambda roles', () => {
      const attachments = manifest.resource['aws_iam_role_policy_attachment'];
      const xrayAttachments = Object.values(attachments).filter((a: any) =>
        a.policy_arn === 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess'
      );
      expect(xrayAttachments.length).toBeGreaterThanOrEqual(2);
    });

    test('Custom policies are created for Lambda functions', () => {
      const policies = manifest.resource['aws_iam_policy'];
      expect(Object.keys(policies).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('API Gateway Configuration', () => {
    test('API Gateway uses Regional endpoint', () => {
      const apis = manifest.resource['aws_api_gateway_rest_api'];
      const api = Object.values(apis)[0] as any;
      expect(api.endpoint_configuration.types).toContain('REGIONAL');
    });

    test('Webhooks resource is created', () => {
      const resources = manifest.resource['aws_api_gateway_resource'];
      const webhooksResource = Object.values(resources).find((r: any) => r.path_part === 'webhooks');
      expect(webhooksResource).toBeDefined();
    });

    test('POST and GET methods are created', () => {
      const methods = manifest.resource['aws_api_gateway_method'];
      const methodTypes = Object.values(methods).map((m: any) => m.http_method);
      expect(methodTypes).toContain('POST');
      expect(methodTypes).toContain('GET');
    });

    test('Throttling is configured at 100 req/sec', () => {
      const settings = manifest.resource['aws_api_gateway_method_settings'];
      const setting = Object.values(settings)[0] as any;
      expect(setting.settings.throttling_burst_limit).toBe(100);
      expect(setting.settings.throttling_rate_limit).toBe(100);
    });

    test('API stage has X-Ray tracing enabled', () => {
      const stages = manifest.resource['aws_api_gateway_stage'];
      const stage = Object.values(stages)[0] as any;
      expect(stage.xray_tracing_enabled).toBe(true);
      expect(stage.stage_name).toBe('prod');
    });
  });

  describe('CloudWatch Alarms', () => {
    test('Alarms are created for both Lambda functions', () => {
      const alarms = manifest.resource['aws_cloudwatch_metric_alarm'];
      expect(Object.keys(alarms).length).toBe(2);
    });

    test('Alarms monitor Lambda error rate using metric queries', () => {
      const alarms = manifest.resource['aws_cloudwatch_metric_alarm'];
      Object.values(alarms).forEach((alarm: any) => {
        expect(alarm.threshold).toBe(1.0);
        expect(alarm.comparison_operator).toBe('GreaterThanThreshold');
        // Verify metric queries are used for error rate calculation
        expect(alarm.metric_query).toBeDefined();
        expect(Array.isArray(alarm.metric_query)).toBe(true);
        expect(alarm.metric_query.length).toBeGreaterThanOrEqual(3);
        // Verify error rate calculation expression exists
        const errorRateQuery = alarm.metric_query.find((q: any) => q.id === 'error_rate');
        expect(errorRateQuery).toBeDefined();
        expect(errorRateQuery.expression).toContain('errors / invocations');
      });
    });
  });

  describe('Lambda Permissions', () => {
    test('API Gateway can invoke validator Lambda', () => {
      const permissions = manifest.resource['aws_lambda_permission'];
      const permission = Object.values(permissions)[0] as any;
      expect(permission.action).toBe('lambda:InvokeFunction');
      expect(permission.principal).toBe('apigateway.amazonaws.com');
    });
  });

  describe('Event Source Mapping', () => {
    test('SQS trigger is configured for processor Lambda', () => {
      const mappings = manifest.resource['aws_lambda_event_source_mapping'];
      expect(Object.keys(mappings).length).toBe(1);
      const mapping = Object.values(mappings)[0] as any;
      expect(mapping.batch_size).toBe(10);
    });
  });

  describe('Stack Outputs', () => {
    test('All required outputs are defined', () => {
      const outputs = manifest.output;
      expect(outputs['api-endpoint']).toBeDefined();
      expect(outputs['webhook-table-name']).toBeDefined();
      expect(outputs['results-bucket-name']).toBeDefined();
      expect(outputs['queue-url']).toBeDefined();
      expect(outputs['validator-lambda-arn']).toBeDefined();
      expect(outputs['processor-lambda-arn']).toBeDefined();
      expect(outputs['aws-account-id']).toBeDefined();
    });
  });
});

describe('Environment Suffix Tests', () => {
  test('Resources include custom environmentSuffix', () => {
    const app = new App();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'custom123',
    });
    const synthesized = Testing.synth(stack);
    const manifest = JSON.parse(synthesized);

    // Check various resources include the suffix
    const buckets = manifest.resource['aws_s3_bucket'];
    expect(Object.keys(buckets).some(key => key.includes('custom123'))).toBe(true);

    const tables = manifest.resource['aws_dynamodb_table'];
    expect(Object.keys(tables).some(key => key.includes('custom123'))).toBe(true);

    const queues = manifest.resource['aws_sqs_queue'];
    expect(Object.keys(queues).some(key => key.includes('custom123'))).toBe(true);
  });
});

describe('Regional Configuration Tests', () => {
  test('Uses ap-southeast-1 as default region', () => {
    const app = new App();
    const stack = new TapStack(app, 'TestStack');
    const synthesized = Testing.synth(stack);
    const manifest = JSON.parse(synthesized);

    expect(manifest.provider.aws[0].region).toBe('ap-southeast-1');
  });

  test('Accepts custom region configuration', () => {
    const app = new App();
    const stack = new TapStack(app, 'TestStack', {
      awsRegion: 'us-west-2',
    });
    const synthesized = Testing.synth(stack);
    const manifest = JSON.parse(synthesized);

    expect(manifest.provider.aws[0].region).toBe('us-west-2');
  });
});

describe('Backend Configuration Tests', () => {
  test('S3 backend is configured with encryption', () => {
    const app = new App();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      stateBucket: 'test-tfstate-bucket',
      stateBucketRegion: 'us-east-1',
    });
    const synthesized = Testing.synth(stack);
    const manifest = JSON.parse(synthesized);

    const backend = manifest.terraform.backend.s3;
    expect(backend.bucket).toBe('test-tfstate-bucket');
    expect(backend.region).toBe('us-east-1');
    expect(backend.encrypt).toBe(true);
  });
});

describe('Edge Cases and Default Handling', () => {
  test('Uses AWS_REGION_OVERRIDE environment variable when set', () => {
    const originalRegion = process.env.AWS_REGION_OVERRIDE;
    process.env.AWS_REGION_OVERRIDE = 'eu-west-1';

    const app = new App();
    const stack = new TapStack(app, 'TestStack', {
      awsRegion: 'us-west-2', // Should be overridden
    });
    const synthesized = Testing.synth(stack);
    const manifest = JSON.parse(synthesized);

    expect(manifest.provider.aws[0].region).toBe('eu-west-1');

    // Cleanup
    if (originalRegion) {
      process.env.AWS_REGION_OVERRIDE = originalRegion;
    } else {
      delete process.env.AWS_REGION_OVERRIDE;
    }
  });

  test('Uses default values when props are undefined', () => {
    const app = new App();
    const stack = new TapStack(app, 'TestStack', {});
    const synthesized = Testing.synth(stack);
    const manifest = JSON.parse(synthesized);

    expect(manifest.provider.aws[0].region).toBe('ap-southeast-1');
    expect(manifest.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
    expect(manifest.terraform.backend.s3.region).toBe('us-east-1');
  });

  test('Handles empty default tags array', () => {
    const app = new App();
    const stack = new TapStack(app, 'TestStack', {
      defaultTags: undefined,
    });
    const synthesized = Testing.synth(stack);
    expect(synthesized).toBeDefined();
  });
});
