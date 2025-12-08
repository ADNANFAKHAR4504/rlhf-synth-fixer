import fs from 'fs';
import * as hcl from 'hcl2-parser';
import path from 'path';

const LIB_DIR = path.join(__dirname, '../lib');

function parseHcl(filename: string) {
  const filePath = path.join(LIB_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return hcl.parseToObject(content);
}

describe('Comprehensive Terraform Unit Tests', () => {
  let tapStack: any;
  let variables: any;
  let devVars: any;
  let prodVars: any;
  let stagingVars: any;

  // Helper to get resource map
  const getResources = (type: string) => {
    if (!tapStack[0].resource) return {};
    return tapStack[0].resource[type] || {};
  };

  // Helper to get variable map
  const getVariables = (source: any) => {
    if (!source[0].variable) return {};
    return source[0].variable;
  };

  beforeAll(() => {
    tapStack = parseHcl('tap_stack.tf');
    variables = parseHcl('variables.tf');
    devVars = parseHcl('dev.tfvars');
    prodVars = parseHcl('prod.tfvars');
    stagingVars = parseHcl('staging.tfvars');
  });

  describe('1. Global Variables (variables.tf)', () => {
    const expectedVars = [
      'aws_region',
      'environment_suffix',
      'repository',
      'commit_author',
      'pr_number',
      'team'
    ];

    test('should define all global variables', () => {
      const definedVars = getVariables(variables);
      expectedVars.forEach(varName => {
        expect(definedVars[varName]).toBeDefined();
      });
    });

    test('aws_region should have correct default', () => {
      expect(variables[0].variable.aws_region[0].default).toBe('us-east-1');
    });
  });

  describe('2. Stack Variables (tap_stack.tf)', () => {
    const expectedVars = [
      'env', 'project_name', 'owner', 'cost_center', 'common_tags',
      'vpc_cidr', 'public_subnet_cidrs', 'private_subnet_cidrs', 'availability_zones', 'enable_dns_hostnames',
      'websocket_api_name', 'rest_api_name', 'stage_name', 'throttle_burst_limit', 'throttle_rate_limit',
      'orders_stream_name', 'locations_stream_name', 'stream_mode', 'orders_shard_count', 'locations_shard_count', 'retention_hours',
      'connections_table', 'orders_table', 'driver_locations_table', 'driver_orders_table', 'driver_profiles_table',
      'billing_mode', 'rcu', 'wcu', 'ttl_enabled', 'ttl_attribute_name',
      'connection_handler_memory', 'validator_memory', 'consumer_memory', 'matcher_memory', 'restaurant_memory',
      'driver_memory', 'customer_memory', 'location_memory', 'earnings_memory', 'analytics_memory', 'image_memory',
      'timeout_s', 'runtime', 'reserved_concurrent_executions',
      'node_type', 'num_cache_clusters', 'engine_version', 'automatic_failover_enabled', 'multi_az_enabled',
      'cluster_identifier', 'database_name', 'master_username', 'instance_class', 'min_capacity', 'max_capacity',
      'backup_retention_days', 'preferred_backup_window',
      'order_events_topic', 'external_notifications_topic',
      'restaurant_queue_name', 'driver_queue_name', 'customer_queue_name', 'visibility_timeout_seconds', 'message_retention_seconds',
      'earnings_schedule_expression',
      'receipts_bucket_name', 'delivery_photos_bucket_name', 'lifecycle_expiration_days',
      'earnings_workflow_name', 'max_concurrency',
      'log_retention_days', 'alarm_p99_threshold_ms'
    ];

    test('should define all stack variables', () => {
      const definedVars = getVariables(tapStack);
      expectedVars.forEach(varName => {
        expect(definedVars[varName]).toBeDefined();
      });
    });
  });

  describe('3. Data Sources', () => {
    test('should define all data sources', () => {
      const data = tapStack[0].data;
      expect(data.aws_caller_identity.current).toBeDefined();
      expect(data.aws_availability_zones.available).toBeDefined();
      expect(data.archive_file.lambda_code).toBeDefined();
    });
  });

  describe('4. Resources', () => {
    describe('VPC & Networking', () => {
      test('should define VPC components', () => {
        const vpc = getResources('aws_vpc');
        expect(vpc.main).toBeDefined();
        expect(vpc.main[0].cidr_block).toBe('${var.vpc_cidr}');

        const igw = getResources('aws_internet_gateway');
        expect(igw.main).toBeDefined();

        const subnets = getResources('aws_subnet');
        expect(subnets.public).toBeDefined();
        expect(subnets.private).toBeDefined();

        const eip = getResources('aws_eip');
        expect(eip.nat).toBeDefined();

        const nat = getResources('aws_nat_gateway');
        expect(nat.main).toBeDefined();

        const rt = getResources('aws_route_table');
        expect(rt.public).toBeDefined();
        expect(rt.private).toBeDefined();

        const rta = getResources('aws_route_table_association');
        expect(rta.public).toBeDefined();
        expect(rta.private).toBeDefined();
      });

      test('should define Security Groups', () => {
        const sgs = getResources('aws_security_group');
        expect(sgs.lambda).toBeDefined();
        expect(sgs.redis).toBeDefined();
        expect(sgs.aurora).toBeDefined();
      });

      test('should define VPC Endpoints', () => {
        const vpce = getResources('aws_vpc_endpoint');
        expect(vpce.dynamodb).toBeDefined();
        expect(vpce.s3).toBeDefined();
      });
    });

    describe('KMS', () => {
      test('should define KMS keys', () => {
        const keys = getResources('aws_kms_key');
        expect(keys.main).toBeDefined();

        const aliases = getResources('aws_kms_alias');
        expect(aliases.main).toBeDefined();
      });
    });

    describe('S3 Buckets', () => {
      test('should define buckets and configs', () => {
        const buckets = getResources('aws_s3_bucket');
        expect(buckets.receipts).toBeDefined();
        expect(buckets.delivery_photos).toBeDefined();

        const enc = getResources('aws_s3_bucket_server_side_encryption_configuration');
        expect(enc.receipts).toBeDefined();
        expect(enc.delivery_photos).toBeDefined();

        const lifecycle = getResources('aws_s3_bucket_lifecycle_configuration');
        expect(lifecycle.receipts).toBeDefined();
        expect(lifecycle.delivery_photos).toBeDefined();

        const cors = getResources('aws_s3_bucket_cors_configuration');
        expect(cors.delivery_photos).toBeDefined();

        const notification = getResources('aws_s3_bucket_notification');
        expect(notification.image_upload).toBeDefined();
      });
    });

    describe('DynamoDB', () => {
      test('should define all tables', () => {
        const tables = getResources('aws_dynamodb_table');
        expect(tables.connections).toBeDefined();
        expect(tables.orders).toBeDefined();
        expect(tables.driver_locations).toBeDefined();
        expect(tables.driver_orders).toBeDefined();
        expect(tables.driver_profiles).toBeDefined();
      });

      test('orders table should have stream enabled', () => {
        const tables = getResources('aws_dynamodb_table');
        expect(tables.orders[0].stream_enabled).toBe(true);
        expect(tables.orders[0].stream_view_type).toBe('NEW_AND_OLD_IMAGES');
      });
    });

    describe('Kinesis', () => {
      test('should define streams', () => {
        const streams = getResources('aws_kinesis_stream');
        expect(streams.orders).toBeDefined();
        expect(streams.locations).toBeDefined();
      });
    });

    describe('Aurora Database', () => {
      test('should define Aurora cluster components', () => {
        const subnetGroup = getResources('aws_db_subnet_group');
        expect(subnetGroup.aurora).toBeDefined();

        const randomPwd = getResources('random_password');
        expect(randomPwd.aurora_master).toBeDefined();

        const secrets = getResources('aws_secretsmanager_secret');
        expect(secrets.aurora_master).toBeDefined();

        const secretVersions = getResources('aws_secretsmanager_secret_version');
        expect(secretVersions.aurora_master).toBeDefined();

        const cluster = getResources('aws_rds_cluster');
        expect(cluster.aurora).toBeDefined();

        const instances = getResources('aws_rds_cluster_instance');
        expect(instances.aurora).toBeDefined();
      });
    });

    describe('Redis', () => {
      test('should define Redis components', () => {
        const subnetGroup = getResources('aws_elasticache_subnet_group');
        expect(subnetGroup.redis).toBeDefined();

        const randomPwd = getResources('random_password');
        expect(randomPwd.redis_auth).toBeDefined();

        const secrets = getResources('aws_secretsmanager_secret');
        expect(secrets.redis_auth).toBeDefined();

        const secretVersions = getResources('aws_secretsmanager_secret_version');
        expect(secretVersions.redis_auth).toBeDefined();

        const replicationGroup = getResources('aws_elasticache_replication_group');
        expect(replicationGroup.redis).toBeDefined();
      });
    });

    describe('SNS & SQS', () => {
      test('should define SNS topics', () => {
        const topics = getResources('aws_sns_topic');
        expect(topics.order_events).toBeDefined();
        expect(topics.external_notifications).toBeDefined();
        expect(topics.alarms).toBeDefined();
      });

      test('should define SQS queues', () => {
        const queues = getResources('aws_sqs_queue');
        expect(queues.restaurant_orders).toBeDefined();
        expect(queues.restaurant_orders_dlq).toBeDefined();
        expect(queues.driver_assignments).toBeDefined();
        expect(queues.driver_assignments_dlq).toBeDefined();
        expect(queues.customer_notifications).toBeDefined();
        expect(queues.customer_notifications_dlq).toBeDefined();
      });

      test('should define SNS subscriptions', () => {
        const subs = getResources('aws_sns_topic_subscription');
        expect(subs.restaurant_orders).toBeDefined();
        expect(subs.driver_assignments).toBeDefined();
        expect(subs.customer_notifications).toBeDefined();
      });
    });

    describe('Lambda Functions & IAM', () => {
      test('should define IAM roles and policies', () => {
        const roles = getResources('aws_iam_role');
        expect(roles.lambda_execution).toBeDefined();
        expect(roles.rds_monitoring).toBeDefined();
        expect(roles.step_functions).toBeDefined();
        expect(roles.eventbridge).toBeDefined();

        const policies = getResources('aws_iam_role_policy');
        expect(policies.lambda_execution).toBeDefined();
        expect(policies.step_functions).toBeDefined();
        expect(policies.eventbridge).toBeDefined();
      });

      test('should define all Lambda functions', () => {
        const lambdas = getResources('aws_lambda_function');
        const expectedLambdas = [
          'connection_handler', 'disconnect_handler', 'order_validator',
          'order_consumer', 'matcher', 'restaurant_consumer',
          'driver_consumer', 'customer_consumer', 'location_tracker',
          'earnings_calculator', 'analytics_processor', 'image_processor'
        ];

        expectedLambdas.forEach(name => {
          expect(lambdas[name]).toBeDefined();
        });
      });

      test('should define Lambda permissions', () => {
        const perms = getResources('aws_lambda_permission');
        expect(perms.api_gateway_rest).toBeDefined();
        expect(perms.api_gateway_websocket_connect).toBeDefined();
        expect(perms.api_gateway_websocket_disconnect).toBeDefined();
        expect(perms.s3_image_processor).toBeDefined();
      });

      test('should define event source mappings', () => {
        const esm = getResources('aws_lambda_event_source_mapping');
        expect(esm.kinesis_orders).toBeDefined();
        expect(esm.kinesis_locations).toBeDefined();
        expect(esm.dynamodb_orders_stream).toBeDefined();
        expect(esm.sqs_restaurant).toBeDefined();
        expect(esm.sqs_driver).toBeDefined();
        expect(esm.sqs_customer).toBeDefined();
      });
    });

    describe('API Gateway', () => {
      test('should define REST API components', () => {
        const apis = getResources('aws_api_gateway_rest_api');
        expect(apis.orders).toBeDefined();

        const resources = getResources('aws_api_gateway_resource');
        expect(resources.orders).toBeDefined();

        const methods = getResources('aws_api_gateway_method');
        expect(methods.orders_post).toBeDefined();

        const integrations = getResources('aws_api_gateway_integration');
        expect(integrations.orders_post).toBeDefined();

        const deployments = getResources('aws_api_gateway_deployment');
        expect(deployments.orders).toBeDefined();

        const stages = getResources('aws_api_gateway_stage');
        expect(stages.orders).toBeDefined();
      });

      test('should define WebSocket API components', () => {
        const apis = getResources('aws_apigatewayv2_api');
        expect(apis.websocket).toBeDefined();

        const routes = getResources('aws_apigatewayv2_route');
        expect(routes.connect).toBeDefined();
        expect(routes.disconnect).toBeDefined();
        expect(routes.default).toBeDefined();

        const integrations = getResources('aws_apigatewayv2_integration');
        expect(integrations.connect).toBeDefined();
        expect(integrations.disconnect).toBeDefined();
        expect(integrations.default).toBeDefined();

        const deployments = getResources('aws_apigatewayv2_deployment');
        expect(deployments.websocket).toBeDefined();

        const stages = getResources('aws_apigatewayv2_stage');
        expect(stages.websocket).toBeDefined();
      });

      test('should define WAF components', () => {
        const waf = getResources('aws_wafv2_web_acl');
        expect(waf.api_gateway).toBeDefined();

        const assoc = getResources('aws_wafv2_web_acl_association');
        expect(assoc.rest_api).toBeDefined();
      });
    });

    describe('Step Functions & EventBridge', () => {
      test('should define Step Function state machine', () => {
        const sfn = getResources('aws_sfn_state_machine');
        expect(sfn.earnings_workflow).toBeDefined();
      });

      test('should define EventBridge rules', () => {
        const rules = getResources('aws_cloudwatch_event_rule');
        expect(rules.earnings_schedule).toBeDefined();

        const targets = getResources('aws_cloudwatch_event_target');
        expect(targets.earnings_workflow).toBeDefined();
      });
    });

    describe('CloudWatch Alarms', () => {
      test('should define all alarms', () => {
        const alarms = getResources('aws_cloudwatch_metric_alarm');
        expect(alarms.websocket_connections).toBeDefined();
        expect(alarms.kinesis_latency).toBeDefined();
        expect(alarms.lambda_duration).toBeDefined();
        expect(alarms.dynamodb_throttles).toBeDefined();
        expect(alarms.redis_memory).toBeDefined();
        expect(alarms.aurora_connections).toBeDefined();
        expect(alarms.sqs_backlog).toBeDefined();
        expect(alarms.step_functions_failures).toBeDefined();
      });
    });
  });

  describe('5. Outputs', () => {
    const expectedOutputs = [
      'websocket_api_invoke_url', 'rest_api_invoke_url',
      'kinesis_orders_stream_arn', 'kinesis_locations_stream_arn',
      'dynamodb_tables', 'sns_topic_arns', 'sqs_queue_urls',
      'aurora_endpoints', 'redis_configuration_endpoint',
      'step_functions_arn', 'lambda_function_arns', 's3_bucket_names',
      'vpc_id', 'public_subnet_ids', 'private_subnet_ids', 'security_group_ids',
      'rest_api_id', 'websocket_api_id',
      'aurora_cluster_identifier', 'aurora_port',
      'redis_endpoint', 'redis_port',
      'kinesis_orders_stream_name', 'kinesis_locations_stream_name',
      'lambda_function_names', 'secrets_manager_secrets', 'kms_key_ids',
      'waf_web_acl_id', 'waf_web_acl_arn', 'eventbridge_rule_name',
      'api_gateway_rest_api_id', 'api_gateway_stage_name', 'api_gateway_invoke_url'
    ];

    test('should define all outputs', () => {
      const outputs = tapStack[0].output;
      expectedOutputs.forEach(name => {
        expect(outputs[name]).toBeDefined();
      });
    });
  });

  describe('6. Environment Configurations (.tfvars)', () => {
    describe('Development (dev.tfvars)', () => {
      test('should have correct values', () => {
        const vars = devVars[0];
        expect(vars.env).toBe('dev');
        expect(vars.aws_region).toBe('us-east-1');
        expect(vars.project_name).toBe('tap-delivery');
        expect(vars.pr_number).toBe('pr7881');

        expect(vars.orders_shard_count).toBe(2);
        expect(vars.locations_shard_count).toBe(1);
        expect(vars.rcu).toBe(20);
        expect(vars.wcu).toBe(20);
        expect(vars.reserved_concurrent_executions).toBe(10);

        expect(vars.node_type).toBe('cache.t3.micro');
        expect(vars.num_cache_clusters).toBe(1);
        expect(vars.instance_class).toBe('db.t4g.small');
        expect(vars.min_capacity).toBe(0.5);
        expect(vars.max_capacity).toBe(1);

        expect(vars.log_retention_days).toBe(7);
        expect(vars.backup_retention_days).toBe(1);
        expect(vars.message_retention_seconds).toBe(43200);

        expect(vars.throttle_burst_limit).toBe(1000);
        expect(vars.throttle_rate_limit).toBe(2000);
        expect(vars.alarm_p99_threshold_ms).toBe(3000);

        expect(vars.earnings_schedule_expression).toBe('cron(0 */6 * * ? *)');
      });
    });

    describe('Staging (staging.tfvars)', () => {
      test('should have correct values', () => {
        const vars = stagingVars[0];
        expect(vars.env).toBe('staging');
        expect(vars.aws_region).toBe('us-east-1');
        expect(vars.project_name).toBe('tap-delivery');
        expect(vars.pr_number).toBe('pr7881');

        expect(vars.orders_shard_count).toBe(5);
        expect(vars.locations_shard_count).toBe(3);
        expect(vars.rcu).toBe(50);
        expect(vars.wcu).toBe(50);
        expect(vars.reserved_concurrent_executions).toBe(50);

        expect(vars.node_type).toBe('cache.t3.small');
        expect(vars.num_cache_clusters).toBe(2);
        expect(vars.instance_class).toBe('db.t4g.medium');
        expect(vars.min_capacity).toBe(0.5);
        expect(vars.max_capacity).toBe(2);

        expect(vars.log_retention_days).toBe(14);
        expect(vars.backup_retention_days).toBe(3);
        expect(vars.message_retention_seconds).toBe(86400);

        expect(vars.throttle_burst_limit).toBe(3000);
        expect(vars.throttle_rate_limit).toBe(5000);
        expect(vars.alarm_p99_threshold_ms).toBe(2000);

        expect(vars.earnings_schedule_expression).toBe('cron(0 2,14 * * ? *)');
      });
    });

    describe('Production (prod.tfvars)', () => {
      test('should have correct values', () => {
        const vars = prodVars[0];
        expect(vars.env).toBe('prod');
        expect(vars.aws_region).toBe('us-east-1');
        expect(vars.project_name).toBe('tap-delivery');
        expect(vars.pr_number).toBe('pr7881');

        expect(vars.orders_shard_count).toBe(10);
        expect(vars.locations_shard_count).toBe(5);
        expect(vars.rcu).toBe(100);
        expect(vars.wcu).toBe(100);
        expect(vars.reserved_concurrent_executions).toBe(100);

        expect(vars.node_type).toBe('cache.r7g.xlarge');
        expect(vars.num_cache_clusters).toBe(3);
        expect(vars.instance_class).toBe('db.r6g.2xlarge');
        expect(vars.min_capacity).toBe(1);
        expect(vars.max_capacity).toBe(4);

        expect(vars.log_retention_days).toBe(30);
        expect(vars.backup_retention_days).toBe(7);
        expect(vars.message_retention_seconds).toBe(345600);

        expect(vars.throttle_burst_limit).toBe(5000);
        expect(vars.throttle_rate_limit).toBe(10000);
        expect(vars.alarm_p99_threshold_ms).toBe(1000);

        expect(vars.earnings_schedule_expression).toBe('cron(0 2 * * ? *)');

        expect(vars.common_tags).toBeDefined();
      });
    });
  });
});
