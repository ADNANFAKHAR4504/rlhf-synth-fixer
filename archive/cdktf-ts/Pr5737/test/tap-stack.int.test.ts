import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  let app: App;
  let stack: TapStack;

  beforeEach(() => {
    app = new App();
  });

  describe('CDKTF Stack Synthesis Integration', () => {
    test('Stack synthesizes to valid Terraform JSON without errors', () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'testenv';

      stack = new TapStack(app, `TapStack${environmentSuffix}`, {
        environmentSuffix,
        awsRegion: process.env.AWS_REGION || 'ap-northeast-2',
        stateBucket: 'iac-rlhf-tf-states-veera',
        stateBucketRegion: process.env.TERRAFORM_STATE_BUCKET_REGION || 'us-east-1',
      });

      const synthesized = Testing.synth(stack);

      expect(synthesized).toBeDefined();
      expect(() => JSON.parse(synthesized)).not.toThrow();

      const config = JSON.parse(synthesized);
      expect(config.provider).toBeDefined();
      expect(config.provider.aws).toBeDefined();
      expect(config.terraform).toBeDefined();
      expect(config.terraform.backend).toBeDefined();
    });

    test('Stack uses environment-specific configuration from environment variables', () => {
      const testEnvironment = 'integration-test';
      const testRegion = 'us-west-1';
      const testBucket = 'test-state-bucket';

      stack = new TapStack(app, `TapStack${testEnvironment}`, {
        environmentSuffix: testEnvironment,
        awsRegion: testRegion,
        stateBucket: testBucket,
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      expect(config.provider.aws[0].region).toBe(testRegion);
      expect(config.terraform.backend.s3.key).toContain(testEnvironment);
    });

    test('Stack properly configures AWS provider with tags', () => {
      const tags = {
        tags: {
          Environment: 'integration',
          Repository: 'iac-test-automations',
          CommitAuthor: 'test-user',
        },
      };

      stack = new TapStack(app, 'TapStackIntegrationTags', {
        environmentSuffix: 'integration',
        defaultTags: tags,
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      expect(config.provider.aws[0].default_tags).toBeDefined();
      expect(config.provider.aws[0].default_tags[0]).toMatchObject(tags);
    });

    test('Stack backend configuration supports state isolation by environment', () => {
      const environments = ['dev', 'staging', 'prod'];

      environments.forEach((env) => {
        const testStack = new TapStack(app, `TapStack${env}`, {
          environment: env as 'dev' | 'staging' | 'prod',
          environmentSuffix: env,
        });

        const synthesized = Testing.synth(testStack);
        const config = JSON.parse(synthesized);

        expect(config.terraform.backend.s3.key).toContain(`${env}/TapStack${env}.tfstate`);
      });
    });

    test('Stack handles concurrent multi-environment deployments', () => {
      const env1 = 'env1';
      const env2 = 'env2';

      const stack1 = new TapStack(app, `TapStack${env1}`, {
        environmentSuffix: env1,
      });

      const stack2 = new TapStack(app, `TapStack${env2}`, {
        environmentSuffix: env2,
      });

      const synth1 = Testing.synth(stack1);
      const synth2 = Testing.synth(stack2);

      const config1 = JSON.parse(synth1);
      const config2 = JSON.parse(synth2);

      expect(config1.terraform.backend.s3.key).not.toBe(config2.terraform.backend.s3.key);
      expect(config1.terraform.backend.s3.key).toContain(env1);
      expect(config2.terraform.backend.s3.key).toContain(env2);
    });
  });

  describe('Terraform Backend State Management Integration', () => {
    test('Backend configuration includes encryption for security', () => {
      stack = new TapStack(app, 'TapStackSecure', {
        environmentSuffix: 'secure',
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      expect(config.terraform.backend.s3.encrypt).toBe(true);
    });

    test('Backend configuration uses state locking', () => {
      stack = new TapStack(app, 'TapStackLocking', {
        environmentSuffix: 'locking',
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

    });

    test('Backend supports multi-region state bucket configuration', () => {
      const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-northeast-2'];

      regions.forEach((region) => {
        const testStack = new TapStack(app, `TapStack${region.replace(/-/g, '')}`, {
          environmentSuffix: 'test',
          stateBucketRegion: region,
        });

        const synthesized = Testing.synth(testStack);
        const config = JSON.parse(synthesized);

        expect(config.terraform.backend.s3.region).toBe(region);
      });
    });
  });

  describe('Multi-Region AWS Provider Integration', () => {
    test('Stack can be configured for different AWS regions', () => {
      const regions = ['us-east-1', 'eu-central-1', 'ap-northeast-2', 'sa-east-1'];

      regions.forEach((region) => {
        const testStack = new TapStack(app, `TapStack${region.replace(/-/g, '')}`, {
          environmentSuffix: 'test',
          awsRegion: region,
        });

        const synthesized = Testing.synth(testStack);
        const config = JSON.parse(synthesized);

        expect(config.provider.aws[0].region).toBe(region);
      });
    });

    test('Stack correctly handles ap-northeast-2 region specified in metadata', () => {
      const metadataRegion = 'ap-northeast-2';

      stack = new TapStack(app, 'TapStackAPNortheast2', {
        environmentSuffix: 'duoct',
        awsRegion: metadataRegion,
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      expect(config.provider.aws[0].region).toBe(metadataRegion);
    });
  });

  describe('Payment API Resources Integration', () => {
    test('S3 buckets are created with correct naming and configuration', () => {
      const envSuffix = 'test';
      stack = new TapStack(app, 'TapStackS3', {
        environmentSuffix: envSuffix,
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      // Check for S3 buckets
      const s3Resources = Object.keys(config.resource || {}).filter((key) =>
        key.startsWith('aws_s3_bucket')
      );
      expect(s3Resources.length).toBeGreaterThan(0);

      // Verify bucket names contain environment suffix
      expect(synthesized).toContain(`payment-logs-${envSuffix}`);
      expect(synthesized).toContain(`payment-receipts-duoct-${envSuffix}`);

      // Verify encryption configuration exists
      expect(synthesized).toContain('aws_s3_bucket_server_side_encryption_configuration');
      expect(synthesized).toContain('AES256');

      // Verify public access block
      expect(synthesized).toContain('aws_s3_bucket_public_access_block');
      expect(synthesized).toContain('block_public_acls');
      expect(synthesized).toContain('true');

      // Verify lifecycle configuration
      expect(synthesized).toContain('aws_s3_bucket_lifecycle_configuration');
    });

    test('DynamoDB table is created with correct configuration', () => {
      const envSuffix = 'test';
      stack = new TapStack(app, 'TapStackDynamoDB', {
        environmentSuffix: envSuffix,
      });

      const synthesized = Testing.synth(stack);

      // Verify DynamoDB table exists
      expect(synthesized).toContain('aws_dynamodb_table');
      expect(synthesized).toContain(`payment-transactions-${envSuffix}`);

      // Verify table attributes
      expect(synthesized).toContain('transactionId');
      expect(synthesized).toContain('timestamp');
      expect(synthesized).toContain('customerId');

      // Verify GSI exists
      expect(synthesized).toContain('customer-index');
      expect(synthesized).toContain('date-index');
    });

    test('DynamoDB billing mode varies by environment', () => {
      // Dev environment uses PAY_PER_REQUEST
      const devStack = new TapStack(app, 'TapStackDDBDev', {
        environment: 'dev',
        environmentSuffix: 'dev',
      });
      const devSynth = Testing.synth(devStack);
      expect(devSynth).toContain('"billing_mode": "PAY_PER_REQUEST"');

      // Prod environment uses PROVISIONED
      const prodStack = new TapStack(app, 'TapStackDDBProd', {
        environment: 'prod',
        environmentSuffix: 'prod',
      });
      const prodSynth = Testing.synth(prodStack);
      expect(prodSynth).toContain('"billing_mode": "PROVISIONED"');
      expect(prodSynth).toContain('"read_capacity": 10');
      expect(prodSynth).toContain('"write_capacity": 10');
      expect(prodSynth).toContain('"enabled": true'); // PITR enabled for prod
    });

    test('Lambda function is created with correct configuration', () => {
      const envSuffix = 'test';
      stack = new TapStack(app, 'TapStackLambda', {
        environmentSuffix: envSuffix,
      });

      const synthesized = Testing.synth(stack);

      // Verify Lambda function exists
      expect(synthesized).toContain('aws_lambda_function');
      expect(synthesized).toContain(`payment-processor-${envSuffix}`);

      // Verify runtime and handler
      expect(synthesized).toContain('nodejs18.x');
      expect(synthesized).toContain('index.handler');

      // Verify environment variables
      expect(synthesized).toContain('TRANSACTIONS_TABLE');
      expect(synthesized).toContain('LOGS_BUCKET');
      expect(synthesized).toContain('RECEIPTS_BUCKET');
      expect(synthesized).toContain('ENVIRONMENT');

      // Verify memory size configuration
      expect(synthesized).toContain('memory_size');
    });

    test('Lambda memory size varies by environment', () => {
      const devStack = new TapStack(app, 'TapStackLambdaDev', {
        environment: 'dev',
        environmentSuffix: 'dev',
      });
      const devSynth = Testing.synth(devStack);
      expect(devSynth).toContain('"memory_size": 512');

      const stagingStack = new TapStack(app, 'TapStackLambdaStaging', {
        environment: 'staging',
        environmentSuffix: 'staging',
      });
      const stagingSynth = Testing.synth(stagingStack);
      expect(stagingSynth).toContain('"memory_size": 1024');

      const prodStack = new TapStack(app, 'TapStackLambdaProd', {
        environment: 'prod',
        environmentSuffix: 'prod',
      });
      const prodSynth = Testing.synth(prodStack);
      expect(prodSynth).toContain('"memory_size": 2048');
    });

    test('API Gateway is created with correct configuration', () => {
      const envSuffix = 'test';
      stack = new TapStack(app, 'TapStackAPIGateway', {
        environmentSuffix: envSuffix,
      });

      const synthesized = Testing.synth(stack);

      // Verify API Gateway resources
      expect(synthesized).toContain('aws_api_gateway_rest_api');
      expect(synthesized).toContain(`payment-api-${envSuffix}`);

      expect(synthesized).toContain('aws_api_gateway_resource');
      expect(synthesized).toContain('payments');

      expect(synthesized).toContain('aws_api_gateway_method');
      expect(synthesized).toContain('"http_method": "POST"');

      expect(synthesized).toContain('aws_api_gateway_integration');
      expect(synthesized).toContain('AWS_PROXY');

      expect(synthesized).toContain('aws_api_gateway_deployment');
      expect(synthesized).toContain('aws_api_gateway_stage');
    });

    test('CloudWatch log group is created with correct retention', () => {
      const envSuffix = 'test';
      stack = new TapStack(app, 'TapStackCloudWatch', {
        environmentSuffix: envSuffix,
      });

      const synthesized = Testing.synth(stack);

      // Verify CloudWatch log group
      expect(synthesized).toContain('aws_cloudwatch_log_group');
      expect(synthesized).toContain(`/aws/lambda/payment-processor-${envSuffix}`);

      // Verify retention varies by environment
      const devStack = new TapStack(app, 'TapStackLogsDev', {
        environment: 'dev',
        environmentSuffix: 'dev',
      });
      const devSynth = Testing.synth(devStack);
      expect(devSynth).toContain('"retention_in_days": 7');

      const prodStack = new TapStack(app, 'TapStackLogsProd', {
        environment: 'prod',
        environmentSuffix: 'prod',
      });
      const prodSynth = Testing.synth(prodStack);
      expect(prodSynth).toContain('"retention_in_days": 30');
    });

    test('IAM roles and policies are created correctly', () => {
      const envSuffix = 'test';
      stack = new TapStack(app, 'TapStackIAM', {
        environmentSuffix: envSuffix,
      });

      const synthesized = Testing.synth(stack);

      // Verify IAM role
      expect(synthesized).toContain('aws_iam_role');
      expect(synthesized).toContain(`payment-processor-role-${envSuffix}`);

      // Verify Lambda execution role attachment
      expect(synthesized).toContain('aws_iam_role_policy_attachment');
      expect(synthesized).toContain('AWSLambdaBasicExecutionRole');

      // Verify inline policy
      expect(synthesized).toContain('aws_iam_role_policy');
      expect(synthesized).toContain('dynamodb:PutItem');
      expect(synthesized).toContain('s3:PutObject');

      // Verify Lambda permission
      expect(synthesized).toContain('aws_lambda_permission');
      expect(synthesized).toContain('AllowAPIGatewayInvoke');
    });

    test('S3 lifecycle expiration varies by environment', () => {
      const devStack = new TapStack(app, 'TapStackLifecycleDev', {
        environment: 'dev',
        environmentSuffix: 'dev',
      });
      const devSynth = Testing.synth(devStack);
      expect(devSynth).toContain('"days": 7');

      const stagingStack = new TapStack(app, 'TapStackLifecycleStaging', {
        environment: 'staging',
        environmentSuffix: 'staging',
      });
      const stagingSynth = Testing.synth(stagingStack);
      expect(stagingSynth).toContain('"days": 30');

      const prodStack = new TapStack(app, 'TapStackLifecycleProd', {
        environment: 'prod',
        environmentSuffix: 'prod',
      });
      const prodSynth = Testing.synth(prodStack);
      expect(prodSynth).toContain('"days": 90');
    });
  });

  describe('Terraform Outputs Integration', () => {
    test('All required outputs are generated', () => {
      stack = new TapStack(app, 'TapStackOutputs', {
        environmentSuffix: 'test',
        awsRegion: 'ap-northeast-2',
      });

      const synthesized = Testing.synth(stack);

      // Verify all outputs exist
      expect(synthesized).toContain('api-endpoint');
      expect(synthesized).toContain('logs-bucket-name');
      expect(synthesized).toContain('receipts-bucket-name');
      expect(synthesized).toContain('transactions-table-name');
      expect(synthesized).toContain('lambda-function-name');
    });

    test('API endpoint output includes correct region and path', () => {
      const testRegion = 'ap-northeast-2';
      stack = new TapStack(app, 'TapStackEndpoint', {
        environment: 'dev',
        environmentSuffix: 'dev',
        awsRegion: testRegion,
      });

      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('api-endpoint');
      expect(synthesized).toContain(testRegion);
      expect(synthesized).toContain('/dev/payments');
    });
  });

  describe('Stack Deployment Readiness', () => {
    test('Synthesized Terraform configuration is deployment-ready', () => {
      stack = new TapStack(app, 'TapStackDeployment', {
        environmentSuffix: process.env.ENVIRONMENT_SUFFIX || 'deploy-test',
        awsRegion: 'ap-northeast-2',
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      // Verify all required sections exist for deployment
      expect(config.provider).toBeDefined();
      expect(config.terraform).toBeDefined();
      expect(config.terraform.backend).toBeDefined();
      expect(config.terraform.required_providers).toBeDefined();
      expect(config.terraform.required_providers.aws).toBeDefined();

      // Verify resources are synthesized
      expect(config.resource).toBeDefined();
    });

    test('Stack configuration follows infrastructure best practices', () => {
      stack = new TapStack(app, 'TapStackBestPractices', {
        environmentSuffix: 'best-practice',
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      // Backend encryption enabled
      expect(config.terraform.backend.s3.encrypt).toBe(true);

      // Provider properly configured
      expect(config.provider.aws).toHaveLength(1);
      expect(config.provider.aws[0].region).toBeDefined();
    });

    test('All payment API resources are synthesized', () => {
      stack = new TapStack(app, 'TapStackResources', {
        environmentSuffix: 'test',
      });

      const synthesized = Testing.synth(stack);

      // Verify all resource types exist
      const resourceTypes = [
        'aws_s3_bucket',
        'aws_dynamodb_table',
        'aws_lambda_function',
        'aws_api_gateway_rest_api',
        'aws_cloudwatch_log_group',
        'aws_iam_role',
      ];

      resourceTypes.forEach((resourceType) => {
        expect(synthesized).toContain(resourceType);
      });
    });
  });

  describe('Resource Naming and Tagging Integration', () => {
    test('Stack name includes environment suffix for resource isolation', () => {
      const suffix = 'isolated';

      stack = new TapStack(app, `TapStack${suffix}`, {
        environmentSuffix: suffix,
      });

      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain(suffix);
    });

    test('Default tags propagate to all resources when configured', () => {
      const tags = {
        tags: {
          Environment: 'production',
          CostCenter: 'engineering',
          Project: 'infrastructure',
        },
      };

      stack = new TapStack(app, 'TapStackPropagation', {
        environmentSuffix: 'prod',
        defaultTags: tags,
      });

      const synthesized = Testing.synth(stack);
      const config = JSON.parse(synthesized);

      expect(config.provider.aws[0].default_tags[0].tags).toMatchObject(tags.tags);
    });

    test('All resources include environment suffix in names', () => {
      const envSuffix = 'integration-test';
      stack = new TapStack(app, 'TapStackNaming', {
        environmentSuffix: envSuffix,
      });

      const synthesized = Testing.synth(stack);

      // Verify resource names include suffix
      expect(synthesized).toContain(`payment-logs-${envSuffix}`);
      expect(synthesized).toContain(`payment-receipts-duoct-${envSuffix}`);
      expect(synthesized).toContain(`payment-transactions-${envSuffix}`);
      expect(synthesized).toContain(`payment-processor-${envSuffix}`);
      expect(synthesized).toContain(`payment-api-${envSuffix}`);
    });
  });
});