import { App, Testing } from 'cdktf';
import { DataPipelineStack } from '../lib/data-pipeline-stack';

describe('DataPipelineStack Unit Tests', () => {
  let app: App;
  let stack: DataPipelineStack;
  let synthesized: any;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new App();
  });

  describe('Stack Instantiation', () => {
    test('should instantiate successfully with dev environment', () => {
      stack = new DataPipelineStack(app, 'TestDataPipelineDev', {
        environment: 'dev',
        environmentSuffix: 'test',
        region: 'ap-southeast-1',
        lambdaMemory: 512,
        dynamodbReadCapacity: 5,
        dynamodbWriteCapacity: 5,
        dynamodbBillingMode: 'PAY_PER_REQUEST',
        s3LifecycleDays: 30,
        enableXrayTracing: false,
        snsEmail: 'dev-alerts@example.com',
        costCenter: 'development',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('should instantiate successfully with staging environment', () => {
      stack = new DataPipelineStack(app, 'TestDataPipelineStaging', {
        environment: 'staging',
        environmentSuffix: 'test',
        region: 'ap-southeast-1',
        lambdaMemory: 1024,
        dynamodbReadCapacity: 10,
        dynamodbWriteCapacity: 10,
        dynamodbBillingMode: 'PROVISIONED',
        s3LifecycleDays: 90,
        enableXrayTracing: true,
        snsEmail: 'staging-alerts@example.com',
        costCenter: 'staging',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('should instantiate successfully with prod environment', () => {
      stack = new DataPipelineStack(app, 'TestDataPipelineProd', {
        environment: 'prod',
        environmentSuffix: 'test',
        region: 'ap-southeast-1',
        lambdaMemory: 2048,
        dynamodbReadCapacity: 25,
        dynamodbWriteCapacity: 25,
        dynamodbBillingMode: 'PROVISIONED',
        s3LifecycleDays: 365,
        enableXrayTracing: true,
        snsEmail: 'prod-alerts@example.com',
        costCenter: 'production',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });
  });

  describe('AWS Provider Configuration', () => {
    beforeEach(() => {
      stack = new DataPipelineStack(app, 'TestProviderStack', {
        environment: 'dev',
        environmentSuffix: 'test',
        region: 'ap-southeast-1',
        lambdaMemory: 512,
        dynamodbReadCapacity: 5,
        dynamodbWriteCapacity: 5,
        dynamodbBillingMode: 'PAY_PER_REQUEST',
        s3LifecycleDays: 30,
        enableXrayTracing: false,
        snsEmail: 'dev-alerts@example.com',
        costCenter: 'development',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should configure AWS provider with correct region', () => {
      expect(synthesized.provider.aws).toBeDefined();
      expect(synthesized.provider.aws[0].region).toBe('ap-southeast-1');
    });

    test('should configure default tags correctly', () => {
      expect(synthesized.provider.aws[0].default_tags).toBeDefined();
      expect(synthesized.provider.aws[0].default_tags[0].tags).toEqual({
        Environment: 'dev',
        CostCenter: 'development',
        ManagedBy: 'CDKTF',
        EnvironmentSuffix: 'test',
      });
    });
  });

  describe('S3 Bucket Resources', () => {
    beforeEach(() => {
      stack = new DataPipelineStack(app, 'TestS3Stack', {
        environment: 'dev',
        environmentSuffix: 'test123',
        region: 'ap-southeast-1',
        lambdaMemory: 512,
        dynamodbReadCapacity: 5,
        dynamodbWriteCapacity: 5,
        dynamodbBillingMode: 'PAY_PER_REQUEST',
        s3LifecycleDays: 30,
        enableXrayTracing: false,
        snsEmail: 'dev-alerts@example.com',
        costCenter: 'development',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create S3 bucket with correct name including environmentSuffix', () => {
      const s3Buckets = synthesized.resource.aws_s3_bucket;
      expect(s3Buckets).toBeDefined();

      const bucketKeys = Object.keys(s3Buckets);
      expect(bucketKeys.length).toBeGreaterThan(0);

      const bucket = s3Buckets[bucketKeys[0]];
      expect(bucket.bucket).toBe('myapp-dev-data-test123');
    });

    test('should enable force_destroy on S3 bucket', () => {
      const s3Buckets = synthesized.resource.aws_s3_bucket;
      const bucketKeys = Object.keys(s3Buckets);
      const bucket = s3Buckets[bucketKeys[0]];
      expect(bucket.force_destroy).toBe(true);
    });

    test('should enable S3 bucket versioning', () => {
      const versioning = synthesized.resource.aws_s3_bucket_versioning;
      expect(versioning).toBeDefined();

      const versioningKeys = Object.keys(versioning);
      expect(versioningKeys.length).toBeGreaterThan(0);

      const config = versioning[versioningKeys[0]];
      expect(config.versioning_configuration).toBeDefined();
      // Check both array and object formats
      const versioningConfig = Array.isArray(config.versioning_configuration)
        ? config.versioning_configuration[0]
        : config.versioning_configuration;
      expect(versioningConfig.status).toBe('Enabled');
    });

    test('should configure S3 bucket encryption', () => {
      const encryption =
        synthesized.resource.aws_s3_bucket_server_side_encryption_configuration;
      expect(encryption).toBeDefined();

      const encryptionKeys = Object.keys(encryption);
      const config = encryption[encryptionKeys[0]];
      expect(config.rule).toBeDefined();
      expect(
        config.rule[0].apply_server_side_encryption_by_default.sse_algorithm
      ).toBe('AES256');
      expect(config.rule[0].bucket_key_enabled).toBe(true);
    });

    test('should block all public access to S3 bucket', () => {
      const publicAccessBlock =
        synthesized.resource.aws_s3_bucket_public_access_block;
      expect(publicAccessBlock).toBeDefined();

      const blockKeys = Object.keys(publicAccessBlock);
      const block = publicAccessBlock[blockKeys[0]];
      expect(block.block_public_acls).toBe(true);
      expect(block.block_public_policy).toBe(true);
      expect(block.ignore_public_acls).toBe(true);
      expect(block.restrict_public_buckets).toBe(true);
    });

    test('should configure lifecycle policy with correct expiration days', () => {
      const lifecycle = synthesized.resource.aws_s3_bucket_lifecycle_configuration;
      expect(lifecycle).toBeDefined();

      const lifecycleKeys = Object.keys(lifecycle);
      const config = lifecycle[lifecycleKeys[0]];
      expect(config.rule).toBeDefined();
      expect(config.rule[0].status).toBe('Enabled');
      expect(config.rule[0].expiration[0].days).toBe(30);
      expect(config.rule[0].id).toBe('expire-after-30-days');
    });

    test('should enable EventBridge notifications on S3 bucket', () => {
      const notification = synthesized.resource.aws_s3_bucket_notification;
      expect(notification).toBeDefined();

      const notificationKeys = Object.keys(notification);
      const config = notification[notificationKeys[0]];
      expect(config.eventbridge).toBe(true);
    });
  });

  describe('DynamoDB Table Resources', () => {
    test('should create DynamoDB table with PAY_PER_REQUEST billing mode', () => {
      stack = new DataPipelineStack(app, 'TestDynamoDBPAYStack', {
        environment: 'dev',
        environmentSuffix: 'test',
        region: 'ap-southeast-1',
        lambdaMemory: 512,
        dynamodbReadCapacity: 5,
        dynamodbWriteCapacity: 5,
        dynamodbBillingMode: 'PAY_PER_REQUEST',
        s3LifecycleDays: 30,
        enableXrayTracing: false,
        snsEmail: 'dev-alerts@example.com',
        costCenter: 'development',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      const dynamodb = synthesized.resource.aws_dynamodb_table;
      expect(dynamodb).toBeDefined();

      const tableKeys = Object.keys(dynamodb);
      const table = dynamodb[tableKeys[0]];
      expect(table.name).toBe('myapp-dev-metadata-test');
      expect(table.billing_mode).toBe('PAY_PER_REQUEST');
      expect(table.read_capacity).toBeUndefined();
      expect(table.write_capacity).toBeUndefined();
    });

    test('should create DynamoDB table with PROVISIONED billing mode', () => {
      stack = new DataPipelineStack(app, 'TestDynamoDBProvisionedStack', {
        environment: 'staging',
        environmentSuffix: 'test',
        region: 'ap-southeast-1',
        lambdaMemory: 1024,
        dynamodbReadCapacity: 10,
        dynamodbWriteCapacity: 10,
        dynamodbBillingMode: 'PROVISIONED',
        s3LifecycleDays: 90,
        enableXrayTracing: true,
        snsEmail: 'staging-alerts@example.com',
        costCenter: 'staging',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      const dynamodb = synthesized.resource.aws_dynamodb_table;
      const tableKeys = Object.keys(dynamodb);
      const table = dynamodb[tableKeys[0]];
      expect(table.billing_mode).toBe('PROVISIONED');
      expect(table.read_capacity).toBe(10);
      expect(table.write_capacity).toBe(10);
    });

    test('should configure DynamoDB table with correct schema', () => {
      stack = new DataPipelineStack(app, 'TestDynamoDBSchemaStack', {
        environment: 'dev',
        environmentSuffix: 'test',
        region: 'ap-southeast-1',
        lambdaMemory: 512,
        dynamodbReadCapacity: 5,
        dynamodbWriteCapacity: 5,
        dynamodbBillingMode: 'PAY_PER_REQUEST',
        s3LifecycleDays: 30,
        enableXrayTracing: false,
        snsEmail: 'dev-alerts@example.com',
        costCenter: 'development',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      const dynamodb = synthesized.resource.aws_dynamodb_table;
      const tableKeys = Object.keys(dynamodb);
      const table = dynamodb[tableKeys[0]];
      expect(table.hash_key).toBe('id');
      expect(table.range_key).toBe('timestamp');
      expect(table.attribute).toHaveLength(2);
      expect(table.attribute[0]).toEqual({ name: 'id', type: 'S' });
      expect(table.attribute[1]).toEqual({ name: 'timestamp', type: 'N' });
    });

    test('should enable encryption and point-in-time recovery', () => {
      stack = new DataPipelineStack(app, 'TestDynamoDBSecurityStack', {
        environment: 'dev',
        environmentSuffix: 'test',
        region: 'ap-southeast-1',
        lambdaMemory: 512,
        dynamodbReadCapacity: 5,
        dynamodbWriteCapacity: 5,
        dynamodbBillingMode: 'PAY_PER_REQUEST',
        s3LifecycleDays: 30,
        enableXrayTracing: false,
        snsEmail: 'dev-alerts@example.com',
        costCenter: 'development',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      const dynamodb = synthesized.resource.aws_dynamodb_table;
      const tableKeys = Object.keys(dynamodb);
      const table = dynamodb[tableKeys[0]];
      expect(table.server_side_encryption).toBeDefined();
      // Check both array and object formats
      const encryption = Array.isArray(table.server_side_encryption)
        ? table.server_side_encryption[0]
        : table.server_side_encryption;
      expect(encryption.enabled).toBe(true);
      expect(table.point_in_time_recovery).toBeDefined();
      const pitr = Array.isArray(table.point_in_time_recovery)
        ? table.point_in_time_recovery[0]
        : table.point_in_time_recovery;
      expect(pitr.enabled).toBe(true);
    });
  });

  describe('SNS Topic Resources', () => {
    beforeEach(() => {
      stack = new DataPipelineStack(app, 'TestSNSStack', {
        environment: 'dev',
        environmentSuffix: 'test456',
        region: 'ap-southeast-1',
        lambdaMemory: 512,
        dynamodbReadCapacity: 5,
        dynamodbWriteCapacity: 5,
        dynamodbBillingMode: 'PAY_PER_REQUEST',
        s3LifecycleDays: 30,
        enableXrayTracing: false,
        snsEmail: 'test@example.com',
        costCenter: 'development',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create SNS topic with correct name', () => {
      const sns = synthesized.resource.aws_sns_topic;
      expect(sns).toBeDefined();

      const topicKeys = Object.keys(sns);
      const topic = sns[topicKeys[0]];
      expect(topic.name).toBe('myapp-dev-alerts-test456');
      expect(topic.display_name).toBe('Data Pipeline Alerts - dev');
    });

    test('should create email subscription to SNS topic', () => {
      const subscription = synthesized.resource.aws_sns_topic_subscription;
      expect(subscription).toBeDefined();

      const subscriptionKeys = Object.keys(subscription);
      const sub = subscription[subscriptionKeys[0]];
      expect(sub.protocol).toBe('email');
      expect(sub.endpoint).toBe('test@example.com');
    });
  });

  describe('IAM Role and Policy Resources', () => {
    beforeEach(() => {
      stack = new DataPipelineStack(app, 'TestIAMStack', {
        environment: 'dev',
        environmentSuffix: 'test',
        region: 'ap-southeast-1',
        lambdaMemory: 512,
        dynamodbReadCapacity: 5,
        dynamodbWriteCapacity: 5,
        dynamodbBillingMode: 'PAY_PER_REQUEST',
        s3LifecycleDays: 30,
        enableXrayTracing: false,
        snsEmail: 'dev-alerts@example.com',
        costCenter: 'development',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create IAM role for Lambda with correct assume role policy', () => {
      const iamRole = synthesized.resource.aws_iam_role;
      expect(iamRole).toBeDefined();

      const roleKeys = Object.keys(iamRole);
      const role = iamRole[roleKeys[0]];
      expect(role.name).toBe('myapp-dev-lambda-role-test');

      const assumePolicy = JSON.parse(role.assume_role_policy);
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe(
        'lambda.amazonaws.com'
      );
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should attach AWS managed policy for Lambda basic execution', () => {
      const policyAttachment =
        synthesized.resource.aws_iam_role_policy_attachment;
      expect(policyAttachment).toBeDefined();

      const attachmentKeys = Object.keys(policyAttachment);
      const basicExecAttachment = Object.values(policyAttachment).find(
        (att: any) =>
          att.policy_arn ===
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
      expect(basicExecAttachment).toBeDefined();
    });

    test('should create custom IAM policy with S3, DynamoDB, and SNS permissions', () => {
      const iamPolicy = synthesized.resource.aws_iam_policy;
      expect(iamPolicy).toBeDefined();

      const policyKeys = Object.keys(iamPolicy);
      const policy = iamPolicy[policyKeys[0]];
      expect(policy.name).toBe('myapp-dev-lambda-policy-test');
      expect(policy.description).toBe('Custom policy for Lambda data processor');

      const policyDoc = JSON.parse(policy.policy);
      expect(policyDoc.Statement).toHaveLength(3); // S3, DynamoDB, SNS (no X-Ray for dev)

      // Check S3 permissions
      const s3Statement = policyDoc.Statement.find((s: any) =>
        s.Action.includes('s3:GetObject')
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Action).toContain('s3:ListBucket');
      expect(s3Statement.Action).toContain('s3:GetBucketLocation');

      // Check DynamoDB permissions
      const dynamoStatement = policyDoc.Statement.find((s: any) =>
        s.Action.includes('dynamodb:PutItem')
      );
      expect(dynamoStatement).toBeDefined();
      expect(dynamoStatement.Action).toContain('dynamodb:GetItem');
      expect(dynamoStatement.Action).toContain('dynamodb:UpdateItem');

      // Check SNS permissions
      const snsStatement = policyDoc.Statement.find((s: any) =>
        s.Action.includes('sns:Publish')
      );
      expect(snsStatement).toBeDefined();
    });

    test('should include X-Ray permissions when tracing is enabled', () => {
      stack = new DataPipelineStack(app, 'TestXRayStack', {
        environment: 'prod',
        environmentSuffix: 'test',
        region: 'ap-southeast-1',
        lambdaMemory: 2048,
        dynamodbReadCapacity: 25,
        dynamodbWriteCapacity: 25,
        dynamodbBillingMode: 'PROVISIONED',
        s3LifecycleDays: 365,
        enableXrayTracing: true,
        snsEmail: 'prod-alerts@example.com',
        costCenter: 'production',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      const iamPolicy = synthesized.resource.aws_iam_policy;
      const policyKeys = Object.keys(iamPolicy);
      const policy = iamPolicy[policyKeys[0]];

      const policyDoc = JSON.parse(policy.policy);
      const xrayStatement = policyDoc.Statement.find((s: any) =>
        s.Action.includes('xray:PutTraceSegments')
      );
      expect(xrayStatement).toBeDefined();
      expect(xrayStatement.Action).toContain('xray:PutTelemetryRecords');
    });

    test('should not include X-Ray permissions when tracing is disabled', () => {
      const iamPolicy = synthesized.resource.aws_iam_policy;
      const policyKeys = Object.keys(iamPolicy);
      const policy = iamPolicy[policyKeys[0]];

      const policyDoc = JSON.parse(policy.policy);
      const xrayStatement = policyDoc.Statement.find((s: any) =>
        s.Action?.includes('xray:PutTraceSegments')
      );
      expect(xrayStatement).toBeUndefined();
    });
  });

  describe('Lambda Function Resources', () => {
    test('should create Lambda function with dev configuration', () => {
      stack = new DataPipelineStack(app, 'TestLambdaDevStack', {
        environment: 'dev',
        environmentSuffix: 'test',
        region: 'ap-southeast-1',
        lambdaMemory: 512,
        dynamodbReadCapacity: 5,
        dynamodbWriteCapacity: 5,
        dynamodbBillingMode: 'PAY_PER_REQUEST',
        s3LifecycleDays: 30,
        enableXrayTracing: false,
        snsEmail: 'dev-alerts@example.com',
        costCenter: 'development',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      const lambda = synthesized.resource.aws_lambda_function;
      expect(lambda).toBeDefined();

      const functionKeys = Object.keys(lambda);
      const func = lambda[functionKeys[0]];
      expect(func.function_name).toBe('myapp-dev-processor-test');
      expect(func.runtime).toBe('nodejs18.x');
      expect(func.handler).toBe('index.handler');
      expect(func.memory_size).toBe(512);
      expect(func.timeout).toBe(300);
      // Check both array and object formats
      const tracingConfig = Array.isArray(func.tracing_config)
        ? func.tracing_config[0]
        : func.tracing_config;
      expect(tracingConfig.mode).toBe('PassThrough');
    });

    test('should create Lambda function with staging configuration and X-Ray', () => {
      stack = new DataPipelineStack(app, 'TestLambdaStagingStack', {
        environment: 'staging',
        environmentSuffix: 'test',
        region: 'ap-southeast-1',
        lambdaMemory: 1024,
        dynamodbReadCapacity: 10,
        dynamodbWriteCapacity: 10,
        dynamodbBillingMode: 'PROVISIONED',
        s3LifecycleDays: 90,
        enableXrayTracing: true,
        snsEmail: 'staging-alerts@example.com',
        costCenter: 'staging',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      const lambda = synthesized.resource.aws_lambda_function;
      const functionKeys = Object.keys(lambda);
      const func = lambda[functionKeys[0]];
      expect(func.memory_size).toBe(1024);
      // Check both array and object formats
      const tracingConfig = Array.isArray(func.tracing_config)
        ? func.tracing_config[0]
        : func.tracing_config;
      expect(tracingConfig.mode).toBe('Active');
    });

    test('should configure Lambda environment variables correctly', () => {
      stack = new DataPipelineStack(app, 'TestLambdaEnvStack', {
        environment: 'dev',
        environmentSuffix: 'test',
        region: 'ap-southeast-1',
        lambdaMemory: 512,
        dynamodbReadCapacity: 5,
        dynamodbWriteCapacity: 5,
        dynamodbBillingMode: 'PAY_PER_REQUEST',
        s3LifecycleDays: 30,
        enableXrayTracing: false,
        snsEmail: 'dev-alerts@example.com',
        costCenter: 'development',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      const lambda = synthesized.resource.aws_lambda_function;
      const functionKeys = Object.keys(lambda);
      const func = lambda[functionKeys[0]];
      // Check both array and object formats
      const environment = Array.isArray(func.environment)
        ? func.environment[0]
        : func.environment;
      expect(environment.variables.ENVIRONMENT).toBe('dev');
      expect(environment.variables.DYNAMODB_TABLE).toBeDefined();
      expect(environment.variables.SNS_TOPIC_ARN).toBeDefined();
      expect(environment.variables.S3_BUCKET).toBeDefined();
    });
  });

  describe('EventBridge Resources', () => {
    beforeEach(() => {
      stack = new DataPipelineStack(app, 'TestEventBridgeStack', {
        environment: 'dev',
        environmentSuffix: 'test',
        region: 'ap-southeast-1',
        lambdaMemory: 512,
        dynamodbReadCapacity: 5,
        dynamodbWriteCapacity: 5,
        dynamodbBillingMode: 'PAY_PER_REQUEST',
        s3LifecycleDays: 30,
        enableXrayTracing: false,
        snsEmail: 'dev-alerts@example.com',
        costCenter: 'development',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should create EventBridge rule for S3 events', () => {
      const eventRule = synthesized.resource.aws_cloudwatch_event_rule;
      expect(eventRule).toBeDefined();

      const ruleKeys = Object.keys(eventRule);
      const rule = eventRule[ruleKeys[0]];
      expect(rule.name).toBe('myapp-dev-s3-events-test');
      expect(rule.description).toBe(
        'Trigger Lambda on S3 object creation in dev'
      );

      const eventPattern = JSON.parse(rule.event_pattern);
      expect(eventPattern.source).toEqual(['aws.s3']);
      expect(eventPattern['detail-type']).toEqual(['Object Created']);
    });

    test('should create EventBridge target for Lambda function', () => {
      const eventTarget = synthesized.resource.aws_cloudwatch_event_target;
      expect(eventTarget).toBeDefined();

      const targetKeys = Object.keys(eventTarget);
      expect(targetKeys.length).toBeGreaterThan(0);
    });

    test('should grant EventBridge permission to invoke Lambda', () => {
      const lambdaPermission = synthesized.resource.aws_lambda_permission;
      expect(lambdaPermission).toBeDefined();

      const permissionKeys = Object.keys(lambdaPermission);
      const permission = lambdaPermission[permissionKeys[0]];
      expect(permission.statement_id).toBe('AllowEventBridgeInvoke');
      expect(permission.action).toBe('lambda:InvokeFunction');
      expect(permission.principal).toBe('events.amazonaws.com');
    });
  });

  describe('Terraform Outputs', () => {
    beforeEach(() => {
      stack = new DataPipelineStack(app, 'TestOutputStack', {
        environment: 'dev',
        environmentSuffix: 'test',
        region: 'ap-southeast-1',
        lambdaMemory: 512,
        dynamodbReadCapacity: 5,
        dynamodbWriteCapacity: 5,
        dynamodbBillingMode: 'PAY_PER_REQUEST',
        s3LifecycleDays: 30,
        enableXrayTracing: false,
        snsEmail: 'dev-alerts@example.com',
        costCenter: 'development',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should export all required stack outputs', () => {
      expect(synthesized.output).toBeDefined();
      expect(synthesized.output.S3BucketName).toBeDefined();
      expect(synthesized.output.S3BucketArn).toBeDefined();
      expect(synthesized.output.DynamoDBTableName).toBeDefined();
      expect(synthesized.output.DynamoDBTableArn).toBeDefined();
      expect(synthesized.output.LambdaFunctionName).toBeDefined();
      expect(synthesized.output.LambdaFunctionArn).toBeDefined();
      expect(synthesized.output.SNSTopicArn).toBeDefined();
      expect(synthesized.output.EventBridgeRuleName).toBeDefined();
    });

    test('should have output descriptions', () => {
      expect(synthesized.output.S3BucketName.description).toBe(
        'Name of the S3 data ingestion bucket'
      );
      expect(synthesized.output.DynamoDBTableName.description).toBe(
        'Name of the DynamoDB metadata table'
      );
      expect(synthesized.output.LambdaFunctionName.description).toBe(
        'Name of the Lambda processor function'
      );
      expect(synthesized.output.SNSTopicArn.description).toBe(
        'ARN of the SNS alert topic'
      );
    });
  });

  describe('Environment-Specific Configurations', () => {
    test('should apply different S3 lifecycle days for each environment', () => {
      const environments = [
        { name: 'dev', days: 30 },
        { name: 'staging', days: 90 },
        { name: 'prod', days: 365 },
      ];

      environments.forEach(({ name, days }) => {
        const tempStack = new DataPipelineStack(app, `Test-${name}-Lifecycle`, {
          environment: name,
          environmentSuffix: 'test',
          region: 'ap-southeast-1',
          lambdaMemory: 512,
          dynamodbReadCapacity: 5,
          dynamodbWriteCapacity: 5,
          dynamodbBillingMode: 'PAY_PER_REQUEST',
          s3LifecycleDays: days,
          enableXrayTracing: false,
          snsEmail: `${name}-alerts@example.com`,
          costCenter: name,
        });
        const tempSynthesized = JSON.parse(Testing.synth(tempStack));

        const lifecycle =
          tempSynthesized.resource.aws_s3_bucket_lifecycle_configuration;
        const lifecycleKeys = Object.keys(lifecycle);
        const config = lifecycle[lifecycleKeys[0]];
        expect(config.rule[0].expiration[0].days).toBe(days);
      });
    });

    test('should apply different Lambda memory sizes for each environment', () => {
      const environments = [
        { name: 'dev', memory: 512 },
        { name: 'staging', memory: 1024 },
        { name: 'prod', memory: 2048 },
      ];

      environments.forEach(({ name, memory }) => {
        const tempStack = new DataPipelineStack(app, `Test-${name}-Memory`, {
          environment: name,
          environmentSuffix: 'test',
          region: 'ap-southeast-1',
          lambdaMemory: memory,
          dynamodbReadCapacity: 5,
          dynamodbWriteCapacity: 5,
          dynamodbBillingMode: 'PAY_PER_REQUEST',
          s3LifecycleDays: 30,
          enableXrayTracing: false,
          snsEmail: `${name}-alerts@example.com`,
          costCenter: name,
        });
        const tempSynthesized = JSON.parse(Testing.synth(tempStack));

        const lambda = tempSynthesized.resource.aws_lambda_function;
        const functionKeys = Object.keys(lambda);
        const func = lambda[functionKeys[0]];
        expect(func.memory_size).toBe(memory);
      });
    });
  });

  describe('Resource Tagging', () => {
    beforeEach(() => {
      stack = new DataPipelineStack(app, 'TestTaggingStack', {
        environment: 'dev',
        environmentSuffix: 'test',
        region: 'ap-southeast-1',
        lambdaMemory: 512,
        dynamodbReadCapacity: 5,
        dynamodbWriteCapacity: 5,
        dynamodbBillingMode: 'PAY_PER_REQUEST',
        s3LifecycleDays: 30,
        enableXrayTracing: false,
        snsEmail: 'dev-alerts@example.com',
        costCenter: 'development',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('should apply tags to S3 bucket', () => {
      const s3Bucket = synthesized.resource.aws_s3_bucket;
      const bucketKeys = Object.keys(s3Bucket);
      const bucket = s3Bucket[bucketKeys[0]];
      expect(bucket.tags).toBeDefined();
      expect(bucket.tags.Purpose).toBe('Data Ingestion');
    });

    test('should apply tags to DynamoDB table', () => {
      const dynamodb = synthesized.resource.aws_dynamodb_table;
      const tableKeys = Object.keys(dynamodb);
      const table = dynamodb[tableKeys[0]];
      expect(table.tags).toBeDefined();
      expect(table.tags.Purpose).toBe('Metadata Storage');
    });

    test('should apply tags to SNS topic', () => {
      const sns = synthesized.resource.aws_sns_topic;
      const topicKeys = Object.keys(sns);
      const topic = sns[topicKeys[0]];
      expect(topic.tags).toBeDefined();
      expect(topic.tags.Purpose).toBe('Alert Notifications');
    });
  });

  describe('S3 Backend Configuration', () => {
    test('should use custom stateBucket and stateBucketRegion from props', () => {
      stack = new DataPipelineStack(app, 'TestCustomBackendStack', {
        environment: 'dev',
        environmentSuffix: 'test',
        region: 'ap-southeast-1',
        lambdaMemory: 512,
        dynamodbReadCapacity: 5,
        dynamodbWriteCapacity: 5,
        dynamodbBillingMode: 'PAY_PER_REQUEST',
        s3LifecycleDays: 30,
        enableXrayTracing: false,
        snsEmail: 'dev-alerts@example.com',
        costCenter: 'development',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'eu-west-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.terraform.backend.s3).toBeDefined();
      expect(synthesized.terraform.backend.s3.bucket).toBe(
        'custom-state-bucket'
      );
      expect(synthesized.terraform.backend.s3.region).toBe('eu-west-1');
      expect(synthesized.terraform.backend.s3.key).toBe(
        'test/TestCustomBackendStack.tfstate'
      );
      expect(synthesized.terraform.backend.s3.encrypt).toBe(true);
    });

    test('should use environment variables for backend configuration when props not provided', () => {
      const originalStateBucket = process.env.TERRAFORM_STATE_BUCKET;
      const originalStateBucketRegion =
        process.env.TERRAFORM_STATE_BUCKET_REGION;
      const originalEnvironmentSuffix = process.env.ENVIRONMENT_SUFFIX;

      process.env.TERRAFORM_STATE_BUCKET = 'env-state-bucket';
      process.env.TERRAFORM_STATE_BUCKET_REGION = 'ap-northeast-1';
      process.env.ENVIRONMENT_SUFFIX = 'envtest';

      stack = new DataPipelineStack(app, 'TestEnvBackendStack', {
        environment: 'dev',
        environmentSuffix: 'envtest',
        region: 'ap-southeast-1',
        lambdaMemory: 512,
        dynamodbReadCapacity: 5,
        dynamodbWriteCapacity: 5,
        dynamodbBillingMode: 'PAY_PER_REQUEST',
        s3LifecycleDays: 30,
        enableXrayTracing: false,
        snsEmail: 'dev-alerts@example.com',
        costCenter: 'development',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.terraform.backend.s3.bucket).toBe('env-state-bucket');
      expect(synthesized.terraform.backend.s3.region).toBe('ap-northeast-1');
      expect(synthesized.terraform.backend.s3.key).toBe(
        'envtest/TestEnvBackendStack.tfstate'
      );

      if (originalStateBucket) {
        process.env.TERRAFORM_STATE_BUCKET = originalStateBucket;
      } else {
        delete process.env.TERRAFORM_STATE_BUCKET;
      }
      if (originalStateBucketRegion) {
        process.env.TERRAFORM_STATE_BUCKET_REGION = originalStateBucketRegion;
      } else {
        delete process.env.TERRAFORM_STATE_BUCKET_REGION;
      }
      if (originalEnvironmentSuffix) {
        process.env.ENVIRONMENT_SUFFIX = originalEnvironmentSuffix;
      } else {
        delete process.env.ENVIRONMENT_SUFFIX;
      }
    });

    test('should use default values when neither props nor environment variables provided', () => {
      const originalStateBucket = process.env.TERRAFORM_STATE_BUCKET;
      const originalStateBucketRegion =
        process.env.TERRAFORM_STATE_BUCKET_REGION;
      const originalEnvironmentSuffix = process.env.ENVIRONMENT_SUFFIX;

      delete process.env.TERRAFORM_STATE_BUCKET;
      delete process.env.TERRAFORM_STATE_BUCKET_REGION;
      delete process.env.ENVIRONMENT_SUFFIX;

      stack = new DataPipelineStack(app, 'TestDefaultBackendStack', {
        environment: 'dev',
        environmentSuffix: 'test',
        region: 'ap-southeast-1',
        lambdaMemory: 512,
        dynamodbReadCapacity: 5,
        dynamodbWriteCapacity: 5,
        dynamodbBillingMode: 'PAY_PER_REQUEST',
        s3LifecycleDays: 30,
        enableXrayTracing: false,
        snsEmail: 'dev-alerts@example.com',
        costCenter: 'development',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.terraform.backend.s3.bucket).toBe(
        'iac-rlhf-tf-states'
      );
      expect(synthesized.terraform.backend.s3.region).toBe('us-east-1');
      expect(synthesized.terraform.backend.s3.key).toBe(
        'test/TestDefaultBackendStack.tfstate'
      );

      if (originalStateBucket) {
        process.env.TERRAFORM_STATE_BUCKET = originalStateBucket;
      }
      if (originalStateBucketRegion) {
        process.env.TERRAFORM_STATE_BUCKET_REGION = originalStateBucketRegion;
      }
      if (originalEnvironmentSuffix) {
        process.env.ENVIRONMENT_SUFFIX = originalEnvironmentSuffix;
      }
    });

    test('should use environmentSuffix from environment variable when not in props', () => {
      const originalEnvironmentSuffix = process.env.ENVIRONMENT_SUFFIX;

      process.env.ENVIRONMENT_SUFFIX = 'fromenv';

      stack = new DataPipelineStack(app, 'TestEnvSuffixStack', {
        environment: 'dev',
        environmentSuffix: undefined as any,
        region: 'ap-southeast-1',
        lambdaMemory: 512,
        dynamodbReadCapacity: 5,
        dynamodbWriteCapacity: 5,
        dynamodbBillingMode: 'PAY_PER_REQUEST',
        s3LifecycleDays: 30,
        enableXrayTracing: false,
        snsEmail: 'dev-alerts@example.com',
        costCenter: 'development',
      } as any);
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.terraform.backend.s3.key).toBe(
        'fromenv/TestEnvSuffixStack.tfstate'
      );

      if (originalEnvironmentSuffix) {
        process.env.ENVIRONMENT_SUFFIX = originalEnvironmentSuffix;
      } else {
        delete process.env.ENVIRONMENT_SUFFIX;
      }
    });

    test('should use default environmentSuffix when not provided anywhere', () => {
      const originalEnvironmentSuffix = process.env.ENVIRONMENT_SUFFIX;

      delete process.env.ENVIRONMENT_SUFFIX;

      stack = new DataPipelineStack(app, 'TestDefaultEnvSuffixStack', {
        environment: 'dev',
        environmentSuffix: undefined as any,
        region: 'ap-southeast-1',
        lambdaMemory: 512,
        dynamodbReadCapacity: 5,
        dynamodbWriteCapacity: 5,
        dynamodbBillingMode: 'PAY_PER_REQUEST',
        s3LifecycleDays: 30,
        enableXrayTracing: false,
        snsEmail: 'dev-alerts@example.com',
        costCenter: 'development',
      } as any);
      synthesized = JSON.parse(Testing.synth(stack));

      expect(synthesized.terraform.backend.s3.key).toBe(
        'dev/TestDefaultEnvSuffixStack.tfstate'
      );

      if (originalEnvironmentSuffix) {
        process.env.ENVIRONMENT_SUFFIX = originalEnvironmentSuffix;
      }
    });
  });
});
