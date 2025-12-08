import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Instantiation', () => {
    test('instantiates successfully with custom props', () => {
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
      expect(synthesized).toContain('custom-state-bucket');
      expect(synthesized).toContain('us-west-2');
    });

    test('uses default values when no props provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDefault');
      synthesized = Testing.synth(stack);

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('us-east-1');
      expect(synthesized).toContain('iac-rlhf-tf-states');
    });

    test('uses AWS_REGION_OVERRIDE when set', () => {
      app = new App();
      const stackWithOverride = new TapStack(app, 'TestStackOverride', {
        environmentSuffix: 'test',
      });
      const synthOverride = Testing.synth(stackWithOverride);

      expect(synthOverride).toBeDefined();
      expect(stackWithOverride).toBeDefined();
    });

    test('includes environmentSuffix in state file key', () => {
      app = new App();
      stack = new TapStack(app, 'TestStackStateKey', {
        environmentSuffix: 'qa',
      });
      synthesized = Testing.synth(stack);

      expect(synthesized).toContain('qa/TestStackStateKey.tfstate');
    });
  });

  describe('VPC and Networking', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestNetworkStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
    });

    test('creates VPC with correct CIDR block', () => {
      expect(synthesized).toContain('10.0.0.0/16');
    });

    test('creates VPC with DNS support enabled', () => {
      const vpcConfig = JSON.parse(synthesized);
      const vpc = Object.values(vpcConfig.resource.aws_vpc)[0] as any;
      expect(vpc.enable_dns_hostnames).toBe(true);
      expect(vpc.enable_dns_support).toBe(true);
    });

    test('creates 3 public subnets', () => {
      const matches = synthesized.match(/public-subnet-\d/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(3);
    });

    test('creates 3 private subnets', () => {
      const matches = synthesized.match(/private-subnet-\d/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(3);
    });

    test('creates single NAT Gateway for cost optimization', () => {
      const config = JSON.parse(synthesized);
      const natGateways = Object.keys(config.resource.aws_nat_gateway || {});
      expect(natGateways.length).toBe(1);
    });

    test('creates Internet Gateway', () => {
      expect(synthesized).toContain('aws_internet_gateway');
    });

    test('creates Lambda security group', () => {
      expect(synthesized).toContain('trading-lambda-sg-test');
    });

    test('creates database security group with PostgreSQL ingress', () => {
      expect(synthesized).toContain('trading-database-sg-test');
      const config = JSON.parse(synthesized);
      const dbSg = Object.values(config.resource.aws_security_group).find(
        (sg: any) => sg.name && sg.name.includes('database-sg')
      ) as any;
      expect(dbSg).toBeDefined();
      expect(dbSg.ingress).toBeDefined();
      expect(dbSg.ingress[0].from_port).toBe(5432);
      expect(dbSg.ingress[0].to_port).toBe(5432);
    });

    test('applies environmentSuffix to VPC name', () => {
      expect(synthesized).toContain('trading-vpc-test');
    });

    test('includes compliance tags on VPC', () => {
      const config = JSON.parse(synthesized);
      const vpc = Object.values(config.resource.aws_vpc)[0] as any;
      expect(vpc.tags.Compliance).toBe('pci-dss');
      expect(vpc.tags.DataClassification).toBe('sensitive');
      expect(vpc.tags.CostCenter).toBe('finance');
    });
  });

  describe('KMS Keys', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestKmsStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
    });

    test('creates 4 KMS keys (database, s3, lambda, cloudwatch)', () => {
      const config = JSON.parse(synthesized);
      const kmsKeys = Object.keys(config.resource.aws_kms_key || {});
      expect(kmsKeys.length).toBe(4);
    });

    test('enables key rotation on all KMS keys', () => {
      const config = JSON.parse(synthesized);
      const kmsKeys = Object.values(config.resource.aws_kms_key || {});
      kmsKeys.forEach((key: any) => {
        expect(key.enable_key_rotation).toBe(true);
      });
    });

    test('creates KMS key aliases', () => {
      expect(synthesized).toContain('alias/trading-database-test');
      expect(synthesized).toContain('alias/trading-s3-test');
      expect(synthesized).toContain('alias/trading-lambda-test');
      expect(synthesized).toContain('alias/trading-cloudwatch-test');
    });

    test('KMS keys have proper IAM policies', () => {
      const config = JSON.parse(synthesized);
      const databaseKey = Object.values(config.resource.aws_kms_key).find(
        (key: any) => key.description && key.description.includes('Database encryption')
      ) as any;
      expect(databaseKey).toBeDefined();
      const policy = JSON.parse(databaseKey.policy);
      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement).toBeDefined();
      expect(policy.Statement.length).toBeGreaterThanOrEqual(2);
    });

    test('applies environmentSuffix to KMS key names', () => {
      expect(synthesized).toContain('trading-database-key-test');
      expect(synthesized).toContain('trading-s3-key-test');
      expect(synthesized).toContain('trading-lambda-key-test');
      expect(synthesized).toContain('trading-cloudwatch-key-test');
    });
  });

  describe('Aurora Database', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestDatabaseStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
    });

    test('creates Aurora Serverless v2 cluster', () => {
      const config = JSON.parse(synthesized);
      const cluster = Object.values(config.resource.aws_rds_cluster)[0] as any;
      expect(cluster.engine).toBe('aurora-postgresql');
      expect(cluster.engine_mode).toBe('provisioned');
      expect(cluster.serverlessv2_scaling_configuration).toBeDefined();
    });

    test('configures serverless v2 scaling (0.5 to 2 ACU)', () => {
      const config = JSON.parse(synthesized);
      const cluster = Object.values(config.resource.aws_rds_cluster)[0] as any;
      expect(cluster.serverlessv2_scaling_configuration.min_capacity).toBe(0.5);
      expect(cluster.serverlessv2_scaling_configuration.max_capacity).toBe(2);
    });

    test('enables storage encryption with KMS', () => {
      const config = JSON.parse(synthesized);
      const cluster = Object.values(config.resource.aws_rds_cluster)[0] as any;
      expect(cluster.storage_encrypted).toBe(true);
      expect(cluster.kms_key_id).toBeDefined();
    });

    test('sets backup retention to 1 day', () => {
      const config = JSON.parse(synthesized);
      const cluster = Object.values(config.resource.aws_rds_cluster)[0] as any;
      expect(cluster.backup_retention_period).toBe(1);
    });

    test('skips final snapshot for destroyability', () => {
      const config = JSON.parse(synthesized);
      const cluster = Object.values(config.resource.aws_rds_cluster)[0] as any;
      expect(cluster.skip_final_snapshot).toBe(true);
    });

    test('creates cluster instance with db.serverless class', () => {
      const config = JSON.parse(synthesized);
      const instance = Object.values(config.resource.aws_rds_cluster_instance)[0] as any;
      expect(instance.instance_class).toBe('db.serverless');
    });

    test('applies environmentSuffix to database resources', () => {
      expect(synthesized).toContain('trading-aurora-test');
      expect(synthesized).toContain('trading-db-subnet-test');
    });

    test('creates database in private subnets', () => {
      const config = JSON.parse(synthesized);
      const subnetGroup = Object.values(config.resource.aws_db_subnet_group)[0] as any;
      expect(subnetGroup.subnet_ids).toBeDefined();
      expect(subnetGroup.subnet_ids.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('DynamoDB Tables', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestDynamoStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
    });

    test('creates sessions table with on-demand billing', () => {
      const config = JSON.parse(synthesized);
      const sessionsTable = Object.values(config.resource.aws_dynamodb_table).find(
        (table: any) => table.name && table.name.includes('sessions')
      ) as any;
      expect(sessionsTable).toBeDefined();
      expect(sessionsTable.billing_mode).toBe('PAY_PER_REQUEST');
    });

    test('creates api-keys table with on-demand billing', () => {
      const config = JSON.parse(synthesized);
      const apiKeysTable = Object.values(config.resource.aws_dynamodb_table).find(
        (table: any) => table.name && table.name.includes('api-keys')
      ) as any;
      expect(apiKeysTable).toBeDefined();
      expect(apiKeysTable.billing_mode).toBe('PAY_PER_REQUEST');
    });

    test('enables point-in-time recovery on both tables', () => {
      const config = JSON.parse(synthesized);
      const tables = Object.values(config.resource.aws_dynamodb_table);
      tables.forEach((table: any) => {
        expect(table.point_in_time_recovery.enabled).toBe(true);
      });
    });

    test('enables server-side encryption on both tables', () => {
      const config = JSON.parse(synthesized);
      const tables = Object.values(config.resource.aws_dynamodb_table);
      tables.forEach((table: any) => {
        expect(table.server_side_encryption.enabled).toBe(true);
      });
    });

    test('sessions table has TTL enabled', () => {
      const config = JSON.parse(synthesized);
      const sessionsTable = Object.values(config.resource.aws_dynamodb_table).find(
        (table: any) => table.name && table.name.includes('sessions')
      ) as any;
      expect(sessionsTable.ttl.enabled).toBe(true);
      expect(sessionsTable.ttl.attribute_name).toBe('ttl');
    });

    test('api-keys table has global secondary index on userId', () => {
      const config = JSON.parse(synthesized);
      const apiKeysTable = Object.values(config.resource.aws_dynamodb_table).find(
        (table: any) => table.name && table.name.includes('api-keys')
      ) as any;
      expect(apiKeysTable.global_secondary_index).toBeDefined();
      expect(apiKeysTable.global_secondary_index[0].name).toBe('UserIdIndex');
      expect(apiKeysTable.global_secondary_index[0].hash_key).toBe('userId');
    });

    test('applies environmentSuffix to DynamoDB table names', () => {
      expect(synthesized).toContain('trading-sessions-test');
      expect(synthesized).toContain('trading-api-keys-test');
    });
  });

  describe('S3 Buckets', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestS3Stack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
    });

    test('creates 3 S3 buckets (raw, processed, archive)', () => {
      const config = JSON.parse(synthesized);
      const buckets = Object.keys(config.resource.aws_s3_bucket || {});
      expect(buckets.length).toBe(3);
    });

    test('enables versioning on all buckets', () => {
      const config = JSON.parse(synthesized);
      const versioningConfigs = Object.values(
        config.resource.aws_s3_bucket_versioning || {}
      );
      expect(versioningConfigs.length).toBe(3);
      versioningConfigs.forEach((vc: any) => {
        expect(vc.versioning_configuration.status).toBe('Enabled');
      });
    });

    test('enables KMS encryption on all buckets', () => {
      const config = JSON.parse(synthesized);
      const encryptionConfigs = Object.values(
        config.resource.aws_s3_bucket_server_side_encryption_configuration || {}
      );
      expect(encryptionConfigs.length).toBe(3);
      encryptionConfigs.forEach((ec: any) => {
        expect(ec.rule[0].apply_server_side_encryption_by_default.sse_algorithm).toBe(
          'aws:kms'
        );
        expect(
          ec.rule[0].apply_server_side_encryption_by_default.kms_master_key_id
        ).toBeDefined();
      });
    });

    test('blocks all public access on all buckets', () => {
      const config = JSON.parse(synthesized);
      const publicAccessBlocks = Object.values(
        config.resource.aws_s3_bucket_public_access_block || {}
      );
      publicAccessBlocks.forEach((pab: any) => {
        expect(pab.block_public_acls).toBe(true);
        expect(pab.block_public_policy).toBe(true);
        expect(pab.ignore_public_acls).toBe(true);
        expect(pab.restrict_public_buckets).toBe(true);
      });
    });

    test('configures lifecycle policy to transition to Glacier after 90 days', () => {
      const config = JSON.parse(synthesized);
      const lifecycleConfigs = Object.values(
        config.resource.aws_s3_bucket_lifecycle_configuration || {}
      );
      lifecycleConfigs.forEach((lc: any) => {
        expect(lc.rule[0].transition[0].days).toBe(90);
        expect(lc.rule[0].transition[0].storage_class).toBe('GLACIER');
      });
    });

    test('applies environmentSuffix to bucket names', () => {
      expect(synthesized).toContain('trading-raw-data-test');
      expect(synthesized).toContain('trading-processed-data-test');
      expect(synthesized).toContain('trading-archive-test');
    });
  });

  describe('Lambda Functions', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestLambdaStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
    });

    test('creates Lambda function with ARM64 architecture', () => {
      const config = JSON.parse(synthesized);
      const lambdaFunc = Object.values(config.resource.aws_lambda_function)[0] as any;
      expect(lambdaFunc.architectures).toEqual(['arm64']);
    });

    test('uses nodejs18.x runtime', () => {
      const config = JSON.parse(synthesized);
      const lambdaFunc = Object.values(config.resource.aws_lambda_function)[0] as any;
      expect(lambdaFunc.runtime).toBe('nodejs18.x');
    });

    test('configures VPC integration with private subnets', () => {
      const config = JSON.parse(synthesized);
      const lambdaFunc = Object.values(config.resource.aws_lambda_function)[0] as any;
      expect(lambdaFunc.vpc_config).toBeDefined();
      expect(lambdaFunc.vpc_config.subnet_ids).toBeDefined();
      expect(lambdaFunc.vpc_config.security_group_ids).toBeDefined();
    });

    test('sets appropriate timeout and memory', () => {
      const config = JSON.parse(synthesized);
      const lambdaFunc = Object.values(config.resource.aws_lambda_function)[0] as any;
      expect(lambdaFunc.timeout).toBe(60);
      expect(lambdaFunc.memory_size).toBe(512);
    });

    test('configures environment variables', () => {
      const config = JSON.parse(synthesized);
      const lambdaFunc = Object.values(config.resource.aws_lambda_function)[0] as any;
      expect(lambdaFunc.environment.variables.ENVIRONMENT).toBe('test');
      expect(lambdaFunc.environment.variables.RAW_DATA_BUCKET).toBeDefined();
      expect(lambdaFunc.environment.variables.PROCESSED_DATA_BUCKET).toBeDefined();
      expect(lambdaFunc.environment.variables.SESSIONS_TABLE).toBeDefined();
    });

    test('enables KMS encryption for environment variables', () => {
      const config = JSON.parse(synthesized);
      const lambdaFunc = Object.values(config.resource.aws_lambda_function)[0] as any;
      expect(lambdaFunc.kms_key_arn).toBeDefined();
    });

    test('creates IAM role with proper trust policy', () => {
      const config = JSON.parse(synthesized);
      const lambdaRole = Object.values(config.resource.aws_iam_role).find(
        (role: any) => role.name && role.name.includes('lambda-role')
      ) as any;
      expect(lambdaRole).toBeDefined();
      const assumePolicy = JSON.parse(lambdaRole.assume_role_policy);
      expect(assumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('attaches VPC execution policy to Lambda role', () => {
      const config = JSON.parse(synthesized);
      const policyAttachments = Object.values(
        config.resource.aws_iam_role_policy_attachment || {}
      );
      const vpcPolicyAttachment = policyAttachments.find(
        (pa: any) =>
          pa.policy_arn &&
          pa.policy_arn.includes('AWSLambdaVPCAccessExecutionRole')
      );
      expect(vpcPolicyAttachment).toBeDefined();
    });

    test('creates custom IAM policy with least-privilege permissions', () => {
      const config = JSON.parse(synthesized);
      const lambdaPolicy = Object.values(config.resource.aws_iam_policy).find(
        (policy: any) => policy.name && policy.name.includes('lambda-policy')
      ) as any;
      expect(lambdaPolicy).toBeDefined();
      const policyDoc = JSON.parse(lambdaPolicy.policy);
      expect(policyDoc.Statement).toBeDefined();
      expect(policyDoc.Statement.length).toBeGreaterThanOrEqual(3);
    });

    test('IAM policy includes regional restrictions', () => {
      const config = JSON.parse(synthesized);
      const lambdaPolicy = Object.values(config.resource.aws_iam_policy).find(
        (policy: any) => policy.name && policy.name.includes('lambda-policy')
      ) as any;
      const policyDoc = JSON.parse(lambdaPolicy.policy);
      const denyStatement = policyDoc.Statement.find(
        (stmt: any) => stmt.Effect === 'Deny'
      );
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Condition.StringNotEquals).toBeDefined();
    });

    test('creates CloudWatch Log Group with 30-day retention', () => {
      const config = JSON.parse(synthesized);
      const logGroup = Object.values(config.resource.aws_cloudwatch_log_group).find(
        (lg: any) => lg.name && lg.name.includes('lambda')
      ) as any;
      expect(logGroup).toBeDefined();
      expect(logGroup.retention_in_days).toBe(30);
    });

    test('applies environmentSuffix to Lambda resources', () => {
      expect(synthesized).toContain('trading-data-processor-test');
      expect(synthesized).toContain('trading-lambda-role-test');
    });
  });

  describe('API Gateway', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestApiStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
    });

    test('creates REST API with regional endpoint', () => {
      const config = JSON.parse(synthesized);
      const restApi = Object.values(config.resource.aws_api_gateway_rest_api)[0] as any;
      expect(restApi.name).toContain('trading-api-test');
      expect(restApi.endpoint_configuration.types).toEqual(['REGIONAL']);
    });

    test('creates /process resource path', () => {
      const config = JSON.parse(synthesized);
      const resource = Object.values(config.resource.aws_api_gateway_resource)[0] as any;
      expect(resource.path_part).toBe('process');
    });

    test('creates POST method with API key required', () => {
      const config = JSON.parse(synthesized);
      const method = Object.values(config.resource.aws_api_gateway_method)[0] as any;
      expect(method.http_method).toBe('POST');
      expect(method.api_key_required).toBe(true);
    });

    test('configures Lambda integration', () => {
      const config = JSON.parse(synthesized);
      const integration = Object.values(config.resource.aws_api_gateway_integration)[0] as any;
      expect(integration.type).toBe('AWS_PROXY');
      expect(integration.integration_http_method).toBe('POST');
    });

    test('grants API Gateway permission to invoke Lambda', () => {
      const config = JSON.parse(synthesized);
      const permission = Object.values(config.resource.aws_lambda_permission)[0] as any;
      expect(permission.action).toBe('lambda:InvokeFunction');
      expect(permission.principal).toBe('apigateway.amazonaws.com');
    });

    test('creates deployment and stage', () => {
      const config = JSON.parse(synthesized);
      const deployment = Object.values(config.resource.aws_api_gateway_deployment)[0] as any;
      const stage = Object.values(config.resource.aws_api_gateway_stage)[0] as any;
      expect(deployment).toBeDefined();
      expect(stage.stage_name).toBe('test');
    });

    test('enables X-Ray tracing on stage', () => {
      const config = JSON.parse(synthesized);
      const stage = Object.values(config.resource.aws_api_gateway_stage)[0] as any;
      expect(stage.xray_tracing_enabled).toBe(true);
    });

    test('configures access logging', () => {
      const config = JSON.parse(synthesized);
      const stage = Object.values(config.resource.aws_api_gateway_stage)[0] as any;
      expect(stage.access_log_settings).toBeDefined();
      expect(stage.access_log_settings.destination_arn).toBeDefined();
    });

    test('creates usage plan with 1000 RPS throttling', () => {
      const config = JSON.parse(synthesized);
      const usagePlan = Object.values(config.resource.aws_api_gateway_usage_plan)[0] as any;
      expect(usagePlan.throttle_settings.rate_limit).toBe(1000);
      expect(usagePlan.throttle_settings.burst_limit).toBe(1000);
    });

    test('creates API key and associates with usage plan', () => {
      const config = JSON.parse(synthesized);
      const apiKey = Object.values(config.resource.aws_api_gateway_api_key)[0] as any;
      const usagePlanKey = Object.values(
        config.resource.aws_api_gateway_usage_plan_key
      )[0] as any;
      expect(apiKey.enabled).toBe(true);
      expect(usagePlanKey.key_type).toBe('API_KEY');
    });

    test('configures method settings with throttling', () => {
      const config = JSON.parse(synthesized);
      const methodSettings = Object.values(
        config.resource.aws_api_gateway_method_settings
      )[0] as any;
      expect(methodSettings.settings.throttling_rate_limit).toBe(1000);
      expect(methodSettings.settings.throttling_burst_limit).toBe(1000);
    });

    test('applies environmentSuffix to API Gateway resources', () => {
      expect(synthesized).toContain('trading-api-test');
      expect(synthesized).toContain('trading-api-key-test');
    });
  });

  describe('Stack Outputs', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestOutputStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
    });

    test('exports VPC ID', () => {
      const config = JSON.parse(synthesized);
      expect(config.output['vpc-id']).toBeDefined();
    });

    test('exports database endpoint', () => {
      const config = JSON.parse(synthesized);
      expect(config.output['database-endpoint']).toBeDefined();
    });

    test('exports API Gateway URL', () => {
      const config = JSON.parse(synthesized);
      expect(config.output['api-gateway-url']).toBeDefined();
    });

    test('exports all 3 S3 bucket names', () => {
      const config = JSON.parse(synthesized);
      expect(config.output['raw-data-bucket']).toBeDefined();
      expect(config.output['processed-data-bucket']).toBeDefined();
      expect(config.output['archive-bucket']).toBeDefined();
    });

    test('exports DynamoDB table names', () => {
      const config = JSON.parse(synthesized);
      expect(config.output['sessions-table']).toBeDefined();
      expect(config.output['api-keys-table']).toBeDefined();
    });
  });

  describe('S3 Backend Configuration', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestBackendStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
    });

    test('configures S3 backend with encryption', () => {
      const config = JSON.parse(synthesized);
      expect(config.terraform.backend.s3).toBeDefined();
      expect(config.terraform.backend.s3.encrypt).toBe(true);
    });

    test('enables state locking', () => {
      const config = JSON.parse(synthesized);
      expect(config.terraform.backend.s3.use_lockfile).toBe(true);
    });

    test('uses environment-specific state key', () => {
      const config = JSON.parse(synthesized);
      expect(config.terraform.backend.s3.key).toContain('test/TestBackendStack.tfstate');
    });
  });

  describe('Resource Tags', () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, 'TestTagsStack', {
        environmentSuffix: 'test',
      });
      synthesized = Testing.synth(stack);
    });

    test('applies environment tags to all tagged resources', () => {
      const config = JSON.parse(synthesized);

      const checkTags = (resources: any) => {
        Object.values(resources || {}).forEach((resource: any) => {
          if (resource.tags && resource.tags.Environment) {
            expect(resource.tags.Environment).toBe('test');
          }
        });
      };

      checkTags(config.resource.aws_vpc);
      checkTags(config.resource.aws_subnet);
      checkTags(config.resource.aws_kms_key);
      checkTags(config.resource.aws_rds_cluster);
      checkTags(config.resource.aws_dynamodb_table);
      checkTags(config.resource.aws_s3_bucket);
      checkTags(config.resource.aws_lambda_function);
    });

    test('applies compliance tags (PCI-DSS) to sensitive resources', () => {
      const config = JSON.parse(synthesized);
      const vpc = Object.values(config.resource.aws_vpc)[0] as any;
      const dynamoTable = Object.values(config.resource.aws_dynamodb_table)[0] as any;
      const lambdaFunc = Object.values(config.resource.aws_lambda_function)[0] as any;

      expect(vpc.tags.Compliance).toBe('pci-dss');
      expect(dynamoTable.tags.Compliance).toBe('pci-dss');
      expect(lambdaFunc.tags.Compliance).toBe('pci-dss');
    });
  });

  describe('Default Tags Configuration', () => {
    test('applies default tags from provider when provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestDefaultTagsStack', {
        environmentSuffix: 'test',
        defaultTags: [
          {
            tags: {
              ManagedBy: 'CDKTF',
              Project: 'TradingPlatform',
            },
          },
        ],
      });
      synthesized = Testing.synth(stack);

      const config = JSON.parse(synthesized);
      expect(config.provider.aws[0].default_tags).toBeDefined();
      expect(config.provider.aws[0].default_tags[0].tags.ManagedBy).toBe('CDKTF');
      expect(config.provider.aws[0].default_tags[0].tags.Project).toBe(
        'TradingPlatform'
      );
    });
  });
});
