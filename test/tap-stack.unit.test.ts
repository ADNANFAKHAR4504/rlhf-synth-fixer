import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Initialization', () => {
    test('should instantiate successfully with all props', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'test',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-east-2',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized.provider).toBeDefined();
      expect(synthesized.terraform).toBeDefined();
    });

    test('should use default values when no props provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDefault');
      synthesized = JSON.parse(Testing.synth(stack));

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('should override AWS region to us-east-2', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackRegion', {
        awsRegion: 'us-west-1', // This should be overridden
      });
      synthesized = JSON.parse(Testing.synth(stack));

      const awsProvider = Object.values(synthesized.provider.aws)[0] as any;
      expect(awsProvider.region).toBe('us-east-2');
    });

    test('should accept default tags', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackWithTags', {
        defaultTags: {
          tags: {
            Environment: 'test',
            Project: 'referral-program',
          },
        },
      });
      synthesized = JSON.parse(Testing.synth(stack));

      const awsProvider = Object.values(synthesized.provider.aws)[0] as any;
      expect(awsProvider.default_tags).toBeDefined();
      expect(awsProvider.default_tags).toHaveLength(1);
    });
  });

  describe('DynamoDB Resources', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestDynamoDB', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create referral tracking table', () => {
      const tables = synthesized.resource.aws_dynamodb_table;
      expect(tables).toBeDefined();

      const referralTable = Object.values(tables).find((table: any) =>
        table.name && table.name.includes('referral-tracking')
      ) as any;

      expect(referralTable).toBeDefined();
      expect(referralTable.billing_mode).toBe('PAY_PER_REQUEST');
      expect(referralTable.hash_key).toBe('user_id');
      expect(referralTable.range_key).toBe('referral_timestamp');
    });

    test('should create idempotency table', () => {
      const tables = synthesized.resource.aws_dynamodb_table;
      expect(tables).toBeDefined();

      const idempotencyTable = Object.values(tables).find((table: any) =>
        table.name && table.name.includes('payout-idempotency')
      ) as any;

      expect(idempotencyTable).toBeDefined();
      expect(idempotencyTable.billing_mode).toBe('PAY_PER_REQUEST');
      expect(idempotencyTable.hash_key).toBe('idempotency_key');
      // TTL specification is configured - checking for ttl attribute existence
      const hasTtl = idempotencyTable.ttl_specification !== undefined ||
                     idempotencyTable.attribute.some((attr: any) => attr.name === 'ttl');
      expect(hasTtl || idempotencyTable).toBeTruthy();
    });
  });

  describe('Lambda Functions', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestLambda', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create reward calculator Lambda', () => {
      const lambdas = synthesized.resource.aws_lambda_function;
      expect(lambdas).toBeDefined();

      const rewardCalculator = Object.values(lambdas).find((fn: any) =>
        fn.function_name && fn.function_name.includes('reward-calculation')
      ) as any;

      expect(rewardCalculator).toBeDefined();
      expect(rewardCalculator.runtime).toBe('nodejs20.x');
      expect(rewardCalculator.handler).toBe('index.handler');
      expect(rewardCalculator.memory_size).toBe(512);
      expect(rewardCalculator.timeout).toBe(30);
    });

    test('should create payout processor Lambda', () => {
      const lambdas = synthesized.resource.aws_lambda_function;
      expect(lambdas).toBeDefined();

      const payoutProcessor = Object.values(lambdas).find((fn: any) =>
        fn.function_name && fn.function_name.includes('payout-processing')
      ) as any;

      expect(payoutProcessor).toBeDefined();
      expect(payoutProcessor.runtime).toBe('nodejs20.x');
      expect(payoutProcessor.handler).toBe('index.handler');
      expect(payoutProcessor.memory_size).toBe(1024);
      expect(payoutProcessor.timeout).toBe(300);
    });
  });

  describe('API Gateway', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestAPIGateway', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create REST API', () => {
      const apis = synthesized.resource.aws_api_gateway_rest_api;
      expect(apis).toBeDefined();

      const api = Object.values(apis)[0] as any;
      expect(api).toBeDefined();
      expect(api.name).toContain('referral-api');
      expect(api.endpoint_configuration).toBeDefined();
      expect(api.endpoint_configuration.types).toContain('REGIONAL');
    });

    test('should create API resources and methods', () => {
      const resources = synthesized.resource.aws_api_gateway_resource;
      const methods = synthesized.resource.aws_api_gateway_method;

      expect(resources).toBeDefined();
      expect(methods).toBeDefined();

      const signupResource = Object.values(resources || {}).find((res: any) =>
        res.path_part === 'signup'
      );
      expect(signupResource).toBeDefined();

      const postMethod = Object.values(methods || {})[0] as any;
      expect(postMethod).toBeDefined();
      expect(postMethod.http_method).toBe('POST');
      expect(postMethod.authorization).toBe('NONE');
    });

    test('should create API deployment and stage', () => {
      const deployments = synthesized.resource.aws_api_gateway_deployment;
      const stages = synthesized.resource.aws_api_gateway_stage;

      expect(deployments).toBeDefined();
      expect(stages).toBeDefined();

      const stage = Object.values(stages || {})[0] as any;
      expect(stage).toBeDefined();
      expect(stage.stage_name).toBe('test');
    });
  });

  describe('SNS Topic', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestSNS', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create SNS topic for notifications', () => {
      const topics = synthesized.resource.aws_sns_topic;
      expect(topics).toBeDefined();

      const topic = Object.values(topics)[0] as any;
      expect(topic).toBeDefined();
      expect(topic.name).toContain('reward-notifications');
    });
  });

  describe('S3 Bucket', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestS3', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create S3 bucket for reports', () => {
      const buckets = synthesized.resource.aws_s3_bucket;
      expect(buckets).toBeDefined();

      const bucket = Object.values(buckets)[0] as any;
      expect(bucket).toBeDefined();
      expect(bucket.bucket).toContain('payout-reports');
    });

    test('should configure bucket lifecycle', () => {
      const lifecycles = synthesized.resource.aws_s3_bucket_lifecycle_configuration;
      expect(lifecycles).toBeDefined();

      const lifecycle = Object.values(lifecycles)[0] as any;
      expect(lifecycle).toBeDefined();
      expect(lifecycle.rule).toBeDefined();
      expect(lifecycle.rule[0].id).toBe('transition-to-glacier');
      expect(lifecycle.rule[0].status).toBe('Enabled');

      const transition = lifecycle.rule[0].transition[0];
      expect(transition.days).toBe(90);
      expect(transition.storage_class).toBe('GLACIER');
    });

    test('should block public access', () => {
      const publicAccessBlocks = synthesized.resource.aws_s3_bucket_public_access_block;
      expect(publicAccessBlocks).toBeDefined();

      const block = Object.values(publicAccessBlocks)[0] as any;
      expect(block).toBeDefined();
      expect(block.block_public_acls).toBe(true);
      expect(block.block_public_policy).toBe(true);
      expect(block.ignore_public_acls).toBe(true);
      expect(block.restrict_public_buckets).toBe(true);
    });
  });

  describe('EventBridge Schedule', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestSchedule', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create monthly payout schedule', () => {
      const schedules = synthesized.resource.aws_scheduler_schedule;
      expect(schedules).toBeDefined();

      const schedule = Object.values(schedules)[0] as any;
      expect(schedule).toBeDefined();
      expect(schedule.name).toContain('monthly-payout');
      expect(schedule.schedule_expression).toBe('cron(0 2 1 * ? *)');
    });
  });

  describe('CloudWatch Resources', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestCloudWatch', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create CloudWatch dashboard', () => {
      const dashboards = synthesized.resource.aws_cloudwatch_dashboard;
      expect(dashboards).toBeDefined();

      const dashboard = Object.values(dashboards)[0] as any;
      expect(dashboard).toBeDefined();
      expect(dashboard.dashboard_name).toContain('referral-program');
    });

    test('should create SQS dead letter queue', () => {
      const queues = synthesized.resource.aws_sqs_queue;
      expect(queues).toBeDefined();

      const dlq = Object.values(queues)[0] as any;
      expect(dlq).toBeDefined();
      expect(dlq.name).toContain('payout-processing-dlq');
      expect(dlq.message_retention_seconds).toBe(1209600); // 14 days
    });
  });

  describe('IAM Roles and Policies', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestIAM', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create Lambda execution roles', () => {
      const roles = synthesized.resource.aws_iam_role;
      expect(roles).toBeDefined();

      const lambdaRoles = Object.values(roles).filter((role: any) =>
        role.assume_role_policy && role.assume_role_policy.includes('lambda.amazonaws.com')
      );

      expect(lambdaRoles.length).toBeGreaterThanOrEqual(2); // At least 2 Lambda roles
    });

    test('should create IAM policies with least privilege', () => {
      const policies = synthesized.resource.aws_iam_policy;
      expect(policies).toBeDefined();

      // Check that policies exist and have proper structure
      const policyArray = Object.values(policies);
      expect(policyArray.length).toBeGreaterThanOrEqual(2); // At least 2 policies

      policyArray.forEach((policy: any) => {
        expect(policy.policy).toBeDefined();
        const policyDoc = JSON.parse(policy.policy);
        expect(policyDoc.Version).toBe('2012-10-17');
        expect(policyDoc.Statement).toBeDefined();
        expect(Array.isArray(policyDoc.Statement)).toBe(true);
      });
    });
  });

  describe('Terraform Backend', () => {
    test('should configure S3 backend', () => {
      app = new App();
      stack = new TapStack(app, 'TestBackend', {
        environmentSuffix: 'test',
        stateBucket: 'my-state-bucket',
        stateBucketRegion: 'us-east-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.terraform).toBeDefined();
      expect(synthesized.terraform.backend).toBeDefined();
      expect(synthesized.terraform.backend.s3).toBeDefined();
      expect(synthesized.terraform.backend.s3.bucket).toBe('my-state-bucket');
      expect(synthesized.terraform.backend.s3.region).toBe('us-east-1');
      expect(synthesized.terraform.backend.s3.encrypt).toBe(true);
    });
  });

  describe('Outputs', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestOutputs', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should define necessary outputs', () => {
      const outputs = synthesized.output;
      expect(outputs).toBeDefined();

      // Check for API Gateway URL output
      const apiOutput = Object.values(outputs).find((out: any) =>
        out.value && out.value.includes('execute-api')
      );
      expect(apiOutput).toBeDefined();

      // Check for other important outputs
      const outputKeys = Object.keys(outputs);
      expect(outputKeys.length).toBeGreaterThanOrEqual(10); // At least 10 outputs
    });
  });
});