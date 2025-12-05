import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Instantiation', () => {
    test('TapStack instantiates successfully with custom props', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'prod',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-west-2',
      });
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('TapStack uses default values when no props provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDefault');
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('TapStack creates AWS provider with correct region', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        awsRegion: 'us-east-1',
      });
      synthesized = Testing.synth(stack);

      // Verify AWS provider is configured
      const config = JSON.parse(synthesized);
      expect(config.provider).toBeDefined();
      expect(config.provider.aws).toBeDefined();
      expect(config.provider.aws[0].region).toBe('us-east-1');
    });

    test('TapStack creates LocalBackend configuration', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);

      const config = JSON.parse(synthesized);
      expect(config.terraform).toBeDefined();
      expect(config.terraform.backend).toBeDefined();
      expect(config.terraform.backend.local).toBeDefined();
      expect(config.terraform.backend.local.path).toBe(
        'terraform.test.tfstate'
      );
    });
  });

  describe('Education Stack Resources', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
      });
      synthesized = Testing.synth(stack);
    });

    test('Creates S3 bucket for content storage', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource).toBeDefined();
      expect(config.resource.aws_s3_bucket).toBeDefined();

      const buckets = Object.values(config.resource.aws_s3_bucket) as any[];
      const contentBucket = buckets.find((b: any) =>
        b.bucket?.includes('education-content')
      );

      expect(contentBucket).toBeDefined();
      expect(contentBucket.bucket).toBe('education-content-dev');
      expect(contentBucket.tags).toEqual({
        Name: 'education-content-dev',
        Environment: 'dev',
      });
    });

    test('Creates CloudFront distribution', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_cloudfront_distribution).toBeDefined();

      const distributions = Object.values(
        config.resource.aws_cloudfront_distribution
      ) as any[];
      expect(distributions.length).toBeGreaterThan(0);

      const distribution = distributions[0];
      expect(distribution.enabled).toBe(true);
      expect(distribution.default_cache_behavior).toBeDefined();
      expect(
        distribution.default_cache_behavior[0].viewer_protocol_policy
      ).toBe('redirect-to-https');
    });

    test('Creates DynamoDB tables for user profiles and progress', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_dynamodb_table).toBeDefined();

      const tables = Object.values(config.resource.aws_dynamodb_table) as any[];
      expect(tables.length).toBeGreaterThanOrEqual(2);

      const userProfilesTable = tables.find((t: any) =>
        t.name?.includes('user-profiles')
      );
      const courseProgressTable = tables.find((t: any) =>
        t.name?.includes('course-progress')
      );

      expect(userProfilesTable).toBeDefined();
      expect(userProfilesTable.billing_mode).toBe('PAY_PER_REQUEST');
      expect(userProfilesTable.point_in_time_recovery).toEqual([
        { enabled: true },
      ]);
      expect(userProfilesTable.server_side_encryption).toEqual([
        { enabled: true },
      ]);

      expect(courseProgressTable).toBeDefined();
      expect(courseProgressTable.billing_mode).toBe('PAY_PER_REQUEST');
    });

    test('Creates Cognito User Pool with correct configuration', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_cognito_user_pool).toBeDefined();

      const userPools = Object.values(
        config.resource.aws_cognito_user_pool
      ) as any[];
      expect(userPools.length).toBeGreaterThan(0);

      const userPool = userPools[0];
      expect(userPool.name).toBe('education-users-dev');
      expect(userPool.auto_verified_attributes).toEqual(['email']);
      expect(userPool.mfa_configuration).toBe('OFF');
      expect(userPool.password_policy).toBeDefined();
      expect(userPool.password_policy[0].minimum_length).toBe(12);
      expect(userPool.password_policy[0].require_lowercase).toBe(true);
      expect(userPool.password_policy[0].require_uppercase).toBe(true);
      expect(userPool.password_policy[0].require_numbers).toBe(true);
      expect(userPool.password_policy[0].require_symbols).toBe(true);
    });

    test('Creates Cognito User Pool Client with correct token validity', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_cognito_user_pool_client).toBeDefined();

      const clients = Object.values(
        config.resource.aws_cognito_user_pool_client
      ) as any[];
      expect(clients.length).toBeGreaterThan(0);

      const client = clients[0];
      expect(client.name).toBe('education-client-dev');
      expect(client.generate_secret).toBe(false);
      expect(client.refresh_token_validity).toBe(30);
      expect(client.access_token_validity).toBe(60);
      expect(client.id_token_validity).toBe(60);
      expect(client.token_validity_units).toBeDefined();
      expect(Array.isArray(client.token_validity_units)).toBe(true);
      expect(client.token_validity_units[0]).toEqual({
        refresh_token: 'days',
        access_token: 'minutes',
        id_token: 'minutes',
      });
    });

    test('Creates Lambda functions for enrollment and progress', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_lambda_function).toBeDefined();

      const functions = Object.values(
        config.resource.aws_lambda_function
      ) as any[];
      expect(functions.length).toBeGreaterThanOrEqual(2);

      const enrollmentFunction = functions.find((f: any) =>
        f.function_name?.includes('enrollment')
      );
      const progressFunction = functions.find((f: any) =>
        f.function_name?.includes('progress')
      );

      expect(enrollmentFunction).toBeDefined();
      expect(enrollmentFunction.handler).toBe('index.handler');
      expect(enrollmentFunction.runtime).toBe('nodejs18.x');
      expect(enrollmentFunction.timeout).toBe(30);
      expect(enrollmentFunction.memory_size).toBe(256);

      expect(progressFunction).toBeDefined();
      expect(progressFunction.handler).toBe('index.handler');
      expect(progressFunction.runtime).toBe('nodejs18.x');
    });

    test('Creates API Gateway REST API', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_api_gateway_rest_api).toBeDefined();

      const apis = Object.values(
        config.resource.aws_api_gateway_rest_api
      ) as any[];
      expect(apis.length).toBeGreaterThan(0);

      const api = apis[0];
      expect(api.name).toBe('education-api-dev');
      expect(api.description).toBe('Education platform API');
      expect(api.endpoint_configuration).toBeDefined();
      expect(api.endpoint_configuration[0].types).toEqual(['REGIONAL']);
    });

    test('Creates API Gateway resources for enrollment and progress', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_api_gateway_resource).toBeDefined();

      const resources = Object.values(
        config.resource.aws_api_gateway_resource
      ) as any[];
      expect(resources.length).toBeGreaterThanOrEqual(2);

      const enrollmentResource = resources.find(
        (r: any) => r.path_part === 'enrollment'
      );
      const progressResource = resources.find(
        (r: any) => r.path_part === 'progress'
      );

      expect(enrollmentResource).toBeDefined();
      expect(progressResource).toBeDefined();
    });

    test('Creates CloudWatch log groups with correct retention', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_cloudwatch_log_group).toBeDefined();

      const logGroups = Object.values(
        config.resource.aws_cloudwatch_log_group
      ) as any[];
      expect(logGroups.length).toBeGreaterThanOrEqual(2);

      logGroups.forEach((lg: any) => {
        expect(lg.retention_in_days).toBe(30);
        expect(lg.name).toMatch(/^\/aws\/lambda\/education-/);
      });
    });

    test('Creates CloudWatch alarms for Lambda functions', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_cloudwatch_metric_alarm).toBeDefined();

      const alarms = Object.values(
        config.resource.aws_cloudwatch_metric_alarm
      ) as any[];
      expect(alarms.length).toBeGreaterThanOrEqual(2);

      alarms.forEach((alarm: any) => {
        expect(alarm.metric_name).toBe('Errors');
        expect(alarm.namespace).toBe('AWS/Lambda');
        expect(alarm.statistic).toBe('Sum');
        expect(alarm.comparison_operator).toBe('GreaterThanThreshold');
        expect(alarm.threshold).toBe(10);
        expect(alarm.evaluation_periods).toBe(2);
        expect(alarm.period).toBe(300);
      });
    });

    test('Creates SNS topic for alerts', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_sns_topic).toBeDefined();

      const topics = Object.values(config.resource.aws_sns_topic) as any[];
      expect(topics.length).toBeGreaterThan(0);

      const alertTopic = topics.find((t: any) =>
        t.name?.includes('education-alerts')
      );

      expect(alertTopic).toBeDefined();
      expect(alertTopic.name).toBe('education-alerts-dev');
    });

    test('Creates IAM role for Lambda with correct assume role policy', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_iam_role).toBeDefined();

      const roles = Object.values(config.resource.aws_iam_role) as any[];
      const lambdaRole = roles.find((r: any) =>
        r.name?.includes('lambda-role')
      );

      expect(lambdaRole).toBeDefined();
      expect(lambdaRole.assume_role_policy).toBeDefined();

      const policy = JSON.parse(lambdaRole.assume_role_policy);
      expect(policy.Statement[0].Effect).toBe('Allow');
      expect(policy.Statement[0].Principal.Service).toBe(
        'lambda.amazonaws.com'
      );
      expect(policy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('Creates IAM policy for Lambda with DynamoDB and S3 permissions', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_iam_policy).toBeDefined();

      const policies = Object.values(config.resource.aws_iam_policy) as any[];
      const lambdaPolicy = policies.find((p: any) =>
        p.name?.includes('lambda-policy')
      );

      expect(lambdaPolicy).toBeDefined();
      expect(lambdaPolicy.policy).toBeDefined();

      const policyDoc = JSON.parse(lambdaPolicy.policy);
      expect(policyDoc.Statement.length).toBeGreaterThanOrEqual(3);

      const dynamoStatement = policyDoc.Statement.find((s: any) =>
        s.Action.some((a: any) => a.includes('dynamodb'))
      );
      const s3Statement = policyDoc.Statement.find((s: any) =>
        s.Action.some((a: any) => a.includes('s3'))
      );
      const snsStatement = policyDoc.Statement.find((s: any) =>
        s.Action.some((a: any) => a.includes('sns'))
      );

      expect(dynamoStatement).toBeDefined();
      expect(s3Statement).toBeDefined();
      expect(snsStatement).toBeDefined();
    });

    test('Creates Terraform outputs for key resources', () => {
      const config = JSON.parse(synthesized);
      expect(config.output).toBeDefined();

      expect(config.output['content-bucket-name']).toBeDefined();
      expect(config.output['cloudfront-url']).toBeDefined();
      expect(config.output['api-endpoint']).toBeDefined();
      expect(config.output['user-pool-id']).toBeDefined();
      expect(config.output['user-pool-client-id']).toBeDefined();
      expect(config.output['enrollment-function-name']).toBeDefined();
      expect(config.output['progress-function-name']).toBeDefined();
    });
  });

  describe('Resource Naming with Environment Suffix', () => {
    test('All resources include environmentSuffix in naming', () => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'staging',
      });
      synthesized = Testing.synth(stack);

      const config = JSON.parse(synthesized);

      // Check S3 bucket
      const buckets = Object.values(
        config.resource.aws_s3_bucket || {}
      ) as any[];
      buckets.forEach((b: any) => {
        if (b.bucket) {
          expect(b.bucket).toContain('staging');
        }
      });

      // Check DynamoDB tables
      const tables = Object.values(
        config.resource.aws_dynamodb_table || {}
      ) as any[];
      tables.forEach((t: any) => {
        if (t.name) {
          expect(t.name).toContain('staging');
        }
      });

      // Check Lambda functions
      const functions = Object.values(
        config.resource.aws_lambda_function || {}
      ) as any[];
      functions.forEach((f: any) => {
        if (f.function_name) {
          expect(f.function_name).toContain('staging');
        }
      });
    });
  });

  describe('Security Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'prod',
      });
      synthesized = Testing.synth(stack);
    });

    test('S3 bucket has public access blocked', () => {
      const config = JSON.parse(synthesized);
      expect(config.resource.aws_s3_bucket_public_access_block).toBeDefined();

      const blocks = Object.values(
        config.resource.aws_s3_bucket_public_access_block
      ) as any[];
      expect(blocks.length).toBeGreaterThan(0);

      blocks.forEach((block: any) => {
        expect(block.block_public_acls).toBe(true);
        expect(block.block_public_policy).toBe(true);
        expect(block.ignore_public_acls).toBe(true);
        expect(block.restrict_public_buckets).toBe(true);
      });
    });

    test('S3 bucket has encryption enabled', () => {
      const config = JSON.parse(synthesized);
      expect(
        config.resource.aws_s3_bucket_server_side_encryption_configuration
      ).toBeDefined();

      const encryptions = Object.values(
        config.resource.aws_s3_bucket_server_side_encryption_configuration
      ) as any[];
      expect(encryptions.length).toBeGreaterThan(0);

      encryptions.forEach((enc: any) => {
        expect(
          enc.rule[0].apply_server_side_encryption_by_default.sse_algorithm
        ).toBe('AES256');
      });
    });

    test('DynamoDB tables have encryption and point-in-time recovery enabled', () => {
      const config = JSON.parse(synthesized);
      const tables = Object.values(config.resource.aws_dynamodb_table) as any[];

      tables.forEach((table: any) => {
        expect(table.server_side_encryption[0].enabled).toBe(true);
        expect(table.point_in_time_recovery[0].enabled).toBe(true);
      });
    });

    test('API Gateway uses HTTPS only via CloudFront', () => {
      const config = JSON.parse(synthesized);
      const distributions = Object.values(
        config.resource.aws_cloudfront_distribution
      ) as any[];

      distributions.forEach((dist: any) => {
        expect(dist.default_cache_behavior[0].viewer_protocol_policy).toBe(
          'redirect-to-https'
        );
      });
    });
  });
});
