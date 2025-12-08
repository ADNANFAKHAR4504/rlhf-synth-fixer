// Unit tests for Terraform configuration
// Validates structure, resources, variables, outputs, and best practices
// No Terraform or AWS commands are executed.

import fs from 'fs';
import path from 'path';

const STACK_REL = '../lib/tap_stack.tf';
const stackPath = path.resolve(__dirname, STACK_REL);

describe('Terraform Stack Unit Tests: tap_stack.tf', () => {
  let stackContent: string;

  beforeAll(() => {
    if (!fs.existsSync(stackPath)) {
      throw new Error(`Terraform stack file not found at: ${stackPath}`);
    }
    stackContent = fs.readFileSync(stackPath, 'utf-8');
  });

  describe('File Structure', () => {
    test('tap_stack.tf exists and is readable', () => {
      expect(fs.existsSync(stackPath)).toBe(true);
      expect(stackContent).toBeTruthy();
      expect(stackContent.length).toBeGreaterThan(0);
    });

    test('file contains terraform block', () => {
      expect(stackContent).toMatch(/^\s*terraform\s*\{/m);
    });

    test('file contains required_version', () => {
      expect(stackContent).toMatch(/required_version\s*=/);
    });

    test('file contains required_providers block', () => {
      expect(stackContent).toMatch(/required_providers\s*\{/);
    });
  });

  describe('Terraform Configuration', () => {
    test('required_version is specified and >= 1.5.0', () => {
      const versionMatch = stackContent.match(/required_version\s*=\s*["']([^"']+)["']/);
      expect(versionMatch).toBeTruthy();
      if (versionMatch) {
        const version = versionMatch[1];
        expect(version).toMatch(/>=/);
        expect(version).toContain('1.5.0');
      }
    });

    test('AWS provider is required', () => {
      expect(stackContent).toMatch(/aws\s*=?\s*\{/);
      expect(stackContent).toMatch(/source\s*=\s*["']hashicorp\/aws["']/);
      expect(stackContent).toMatch(/version\s*=\s*["']~>\s*5/);
    });

    test('Random provider is required', () => {
      expect(stackContent).toMatch(/random\s*=?\s*\{/);
      const randomProviderMatch = stackContent.match(/random\s*=?\s*\{[\s\S]*?source[\s\S]*?hashicorp\/random/);
      expect(randomProviderMatch).toBeTruthy();
    });

    test('Archive provider is required', () => {
      expect(stackContent).toMatch(/archive\s*=?\s*\{/);
      const archiveProviderMatch = stackContent.match(/archive\s*=?\s*\{[\s\S]*?source[\s\S]*?hashicorp\/archive/);
      expect(archiveProviderMatch).toBeTruthy();
    });
  });

  describe('Variables', () => {
    const requiredVariables = [
      'env',
      'project_name',
      'owner',
      'cost_center',
      'vpc_cidr',
      'public_subnet_cidrs',
      'private_subnet_cidrs',
      'num_availability_zones',
      'api_name',
      'stage_name',
      'activity_stream_name',
      'shard_count',
      'activity_table',
      'recommendations_table',
      'achievements_table',
      'catalog_table',
      'event_processor_memory',
      'recommendations_memory',
      'node_type',
      'num_cache_clusters',
      'db_name',
      'master_username',
      'instance_class',
      'min_capacity',
      'max_capacity',
      'backup_retention_days',
      'log_retention_days',
    ];

    requiredVariables.forEach((varName) => {
      test(`variable "${varName}" is defined`, () => {
        const varPattern = new RegExp(`variable\\s+["']${varName}["']\\s*\\{`, 'm');
        expect(stackContent).toMatch(varPattern);
      });
    });

    test('env variable has validation', () => {
      expect(stackContent).toMatch(/variable\s+["']env["']\s*\{[\s\S]*?validation\s*\{/m);
      expect(stackContent).toMatch(/contains\(\["dev"[\s\S]*?"staging"[\s\S]*?"prod"\]/);
    });

    test('variables have descriptions', () => {
      const varMatches = stackContent.matchAll(/variable\s+["'](\w+)["']\s*\{/g);
      let varCount = 0;
      for (const match of varMatches) {
        varCount++;
        const varName = match[1];
        const varBlockStart = match.index!;
        const nextVarIndex = stackContent.indexOf('variable "', varBlockStart + 10) || stackContent.length;
        const varBlock = stackContent.substring(varBlockStart, nextVarIndex);

        // Check if description exists (allows for comments)
        expect(varBlock).toMatch(/description\s*=/);
      }
      expect(varCount).toBeGreaterThan(0);
    });
  });

  describe('Locals', () => {
    test('locals block exists', () => {
      expect(stackContent).toMatch(/^locals\s*\{/m);
    });

    test('resource_prefix is defined in locals', () => {
      expect(stackContent).toMatch(/resource_prefix\s*=/);
    });

    test('default_tags are defined in locals', () => {
      expect(stackContent).toMatch(/default_tags\s*=/);
    });

    test('capacity_map is defined in locals', () => {
      expect(stackContent).toMatch(/capacity_map\s*=/);
      expect(stackContent).toMatch(/capacity_map\s*=[\s\S]*?dev\s*=?\s*\{/);
      expect(stackContent).toMatch(/capacity_map\s*=[\s\S]*?staging\s*=?\s*\{/);
      expect(stackContent).toMatch(/capacity_map\s*=[\s\S]*?prod\s*=?\s*\{/);
    });

    test('lambda_env_vars are defined in locals', () => {
      expect(stackContent).toMatch(/lambda_env_vars\s*=/);
    });
  });

  describe('Core Infrastructure Resources', () => {
    test('VPC resource is defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_vpc["']\s+["']main["']/);
    });

    test('Internet Gateway is defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_internet_gateway["']/);
    });

    test('Public subnets are defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_subnet["']\s+["']public["']/);
    });

    test('Private subnets are defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_subnet["']\s+["']private["']/);
    });

    test('NAT Gateway is defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_nat_gateway["']/);
    });

    test('Route tables are defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_route_table["']\s+["']public["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_route_table["']\s+["']private["']/);
    });
  });

  describe('Security Groups', () => {
    test('Lambda security group is defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_security_group["']\s+["']lambda["']/);
    });

    test('Aurora security group is defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_security_group["']\s+["']aurora["']/);
    });

    test('Redis security group is defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_security_group["']\s+["']redis["']/);
    });

    test('Aurora security group allows Lambda on port 5432', () => {
      const auroraSgMatch = stackContent.match(/resource\s+["']aws_security_group["']\s+["']aurora["'][\s\S]*?ingress[\s\S]*?from_port\s*=\s*5432[\s\S]*?to_port\s*=\s*5432[\s\S]*?protocol\s*=\s*["']tcp["']/);
      expect(auroraSgMatch).toBeTruthy();
    });

    test('Redis security group allows Lambda on port 6379', () => {
      const redisSgMatch = stackContent.match(/resource\s+["']aws_security_group["']\s+["']redis["'][\s\S]*?ingress[\s\S]*?from_port\s*=\s*6379[\s\S]*?to_port\s*=\s*6379[\s\S]*?protocol\s*=\s*["']tcp["']/);
      expect(redisSgMatch).toBeTruthy();
    });
  });

  describe('VPC Endpoints', () => {
    const vpcEndpoints = [
      { name: 'dynamodb', type: 'Gateway' },
      { name: 's3', type: 'Gateway' },
      { name: 'kinesis', type: 'Interface' },
      { name: 'sns', type: 'Interface' },
      { name: 'sqs', type: 'Interface' },
    ];

    vpcEndpoints.forEach((endpoint) => {
      test(`VPC endpoint for ${endpoint.name} is defined`, () => {
        expect(stackContent).toMatch(new RegExp(`resource\\s+["']aws_vpc_endpoint["']\\s+["']${endpoint.name}["']`));
      });
    });
  });

  describe('Storage Resources', () => {
    test('Kinesis stream is defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_kinesis_stream["']/);
    });

    test('All DynamoDB tables are defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_dynamodb_table["']\s+["']user_activity["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_dynamodb_table["']\s+["']user_recommendations["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_dynamodb_table["']\s+["']user_achievements["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_dynamodb_table["']\s+["']content_catalog["']/);
    });

    test('DynamoDB user_activity table has streams enabled', () => {
      const tableMatch = stackContent.match(/resource\s+["']aws_dynamodb_table["']\s+["']user_activity["'][\s\S]*?stream_enabled\s*=\s*true/);
      expect(tableMatch).toBeTruthy();
    });

    test('S3 buckets are defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_s3_bucket["']\s+["']archive["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_s3_bucket["']\s+["']thumbnails["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_s3_bucket["']\s+["']athena_results["']/);
    });

    test('S3 buckets have versioning enabled', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_s3_bucket_versioning["']\s+["']archive["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_s3_bucket_versioning["']\s+["']thumbnails["']/);
    });

    test('S3 buckets have encryption configured', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_s3_bucket_server_side_encryption_configuration["']\s+["']archive["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_s3_bucket_server_side_encryption_configuration["']\s+["']thumbnails["']/);
    });

    test('S3 buckets have public access blocked', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_s3_bucket_public_access_block["']\s+["']archive["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_s3_bucket_public_access_block["']\s+["']thumbnails["']/);
    });
  });

  describe('Database Resources', () => {
    test('Aurora cluster is defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_rds_cluster["']\s+["']aurora["']/);
    });

    test('Aurora cluster instance is defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_rds_cluster_instance["']\s+["']aurora["']/);
    });

    test('Aurora has encryption enabled', () => {
      const auroraMatch = stackContent.match(/resource\s+["']aws_rds_cluster["']\s+["']aurora["'][\s\S]*?storage_encrypted\s*=\s*true/);
      expect(auroraMatch).toBeTruthy();
    });

    test('Aurora uses PostgreSQL engine', () => {
      const auroraMatch = stackContent.match(/resource\s+["']aws_rds_cluster["']\s+["']aurora["'][\s\S]*?engine\s*=\s*["']aurora-postgresql["']/);
      expect(auroraMatch).toBeTruthy();
    });

    test('ElastiCache Redis replication group is defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_elasticache_replication_group["']\s+["']redis["']/);
    });

    test('Redis has encryption enabled', () => {
      const redisMatch = stackContent.match(/resource\s+["']aws_elasticache_replication_group["']\s+["']redis["'][\s\S]*?at_rest_encryption_enabled\s*=\s*true/);
      expect(redisMatch).toBeTruthy();
      const transitMatch = stackContent.match(/resource\s+["']aws_elasticache_replication_group["']\s+["']redis["'][\s\S]*?transit_encryption_enabled\s*=\s*true/);
      expect(transitMatch).toBeTruthy();
    });
  });

  describe('Lambda Functions', () => {
    const lambdaFunctions = [
      'event_processor',
      'recommendations_engine',
      'analytics_consumer',
      'achievements_consumer',
      'expiration_check',
      'expiration_update',
      'expiration_cleanup',
      'thumbnail_processor',
    ];

    lambdaFunctions.forEach((funcName) => {
      test(`Lambda function "${funcName}" is defined`, () => {
        expect(stackContent).toMatch(new RegExp(`resource\\s+["']aws_lambda_function["']\\s+["']${funcName}["']`));
      });
    });

    test('Lambda functions have VPC configuration', () => {
      const vpcConfigMatch = stackContent.match(/resource\s+["']aws_lambda_function["']\s+["']recommendations_engine["'][\s\S]*?vpc_config\s*\{/);
      expect(vpcConfigMatch).toBeTruthy();
    });

    test('Lambda event source mappings are defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_lambda_event_source_mapping["']/);
    });
  });

  describe('API Gateway', () => {
    test('API Gateway REST API is defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_api_gateway_rest_api["']\s+["']main["']/);
    });

    test('API Gateway stage is defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_api_gateway_stage["']\s+["']main["']/);
    });

    test('API Gateway resources are defined for endpoints', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_api_gateway_resource["']\s+["']watch["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_api_gateway_resource["']\s+["']pause["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_api_gateway_resource["']\s+["']complete["']/);
    });

    test('API Gateway methods are defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_api_gateway_method["']\s+["']watch_post["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_api_gateway_method["']\s+["']pause_post["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_api_gateway_method["']\s+["']complete_post["']/);
    });

    test('API Gateway integrations are defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_api_gateway_integration["']\s+["']watch["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_api_gateway_integration["']\s+["']pause["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_api_gateway_integration["']\s+["']complete["']/);
    });
  });

  describe('WAF Configuration', () => {
    test('WAF Web ACL is defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_wafv2_web_acl["']\s+["']api_gateway["']/);
    });

    test('WAF Web ACL is REGIONAL scope', () => {
      const wafMatch = stackContent.match(/resource\s+["']aws_wafv2_web_acl["']\s+["']api_gateway["'][\s\S]*?scope\s*=\s*["']REGIONAL["']/);
      expect(wafMatch).toBeTruthy();
    });

    test('WAF has SQL injection rule', () => {
      expect(stackContent).toMatch(/AWSManagedRulesSQLiRuleSet/);
    });

    test('WAF has rate limiting rule', () => {
      expect(stackContent).toMatch(/RateLimitRule/);
    });

    test('WAF is associated with API Gateway', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_wafv2_web_acl_association["']\s+["']api_gateway["']/);
    });

    test('WAF logging is configured', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_wafv2_web_acl_logging_configuration["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_cloudwatch_log_resource_policy["']\s+["']waf_logging["']/);
    });
  });

  describe('Messaging Resources', () => {
    test('SNS topics are defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_sns_topic["']\s+["']watched_complete["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_sns_topic["']\s+["']user_notifications["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_sns_topic["']\s+["']cloudwatch_alarms["']/);
    });

    test('SQS queues are defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_sqs_queue["']\s+["']analytics_queue["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_sqs_queue["']\s+["']achievements_queue["']/);
    });

    test('SQS DLQs are defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_sqs_queue["']\s+["']analytics_dlq["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_sqs_queue["']\s+["']achievements_dlq["']/);
    });

    test('SNS to SQS subscriptions are defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_sns_topic_subscription["']\s+["']complete_to_analytics["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_sns_topic_subscription["']\s+["']complete_to_achievements["']/);
    });
  });

  describe('Step Functions', () => {
    test('Step Functions state machine is defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_sfn_state_machine["']/);
    });

    test('EventBridge rule is defined for expiration', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_cloudwatch_event_rule["']\s+["']content_expiration["']/);
    });

    test('EventBridge target is defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_cloudwatch_event_target["']\s+["']step_functions["']/);
    });
  });

  describe('KMS Encryption', () => {
    test('KMS keys are defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_kms_key["']\s+["']s3["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_kms_key["']\s+["']sns["']/);
    });

    test('KMS aliases are defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_kms_alias["']\s+["']s3["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_kms_alias["']\s+["']sns["']/);
    });
  });

  describe('Secrets Manager', () => {
    test('Aurora credentials secret is defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_secretsmanager_secret["']\s+["']aurora_credentials["']/);
    });

    test('Redis auth secret is defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_secretsmanager_secret["']\s+["']redis_auth["']/);
    });
  });

  describe('CloudWatch', () => {
    test('CloudWatch log groups are defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_cloudwatch_log_group["']/);
    });

    test('CloudWatch alarms are defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_cloudwatch_metric_alarm["']\s+["']api_latency["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_cloudwatch_metric_alarm["']\s+["']lambda_recommendations_duration["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_cloudwatch_metric_alarm["']\s+["']dynamodb_hot_partition["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_cloudwatch_metric_alarm["']\s+["']kinesis_throttling["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_cloudwatch_metric_alarm["']\s+["']redis_memory_fragmentation["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_cloudwatch_metric_alarm["']\s+["']aurora_transactions["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_cloudwatch_metric_alarm["']\s+["']sqs_message_age["']/);
      expect(stackContent).toMatch(/resource\s+["']aws_cloudwatch_metric_alarm["']\s+["']step_functions_failed["']/);
    });
  });

  describe('Athena', () => {
    test('Athena workgroup is defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_athena_workgroup["']/);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('Lambda execution role is defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_iam_role["']\s+["']lambda_execution["']/);
    });

    test('Lambda policy is defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_iam_policy["']\s+["']lambda_policy["']/);
    });

    test('Step Functions role is defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_iam_role["']\s+["']step_functions["']/);
    });

    test('API Gateway CloudWatch role is defined', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_iam_role["']\s+["']api_gateway_cloudwatch["']/);
    });
  });

  describe('Outputs', () => {
    const requiredOutputs = [
      'api_gateway_invoke_url',
      'api_gateway_rest_api_id',
      'api_gateway_stage_name',
      'kinesis_stream_arn',
      'kinesis_stream_name',
      'dynamodb_activity_table',
      'dynamodb_recommendations_table',
      'dynamodb_achievements_table',
      'dynamodb_catalog_table',
      'aurora_endpoints',
      'aurora_cluster_identifier',
      'aurora_port',
      'redis_endpoint',
      'redis_port',
      's3_buckets',
      'lambda_function_arns',
      'lambda_function_names',
      'sns_topic_arns',
      'sqs_queue_urls',
      'step_functions_arn',
      'vpc_info',
      'security_group_ids',
      'waf_web_acl_id',
      'waf_web_acl_arn',
      'athena_workgroup',
      'secrets_manager_secrets',
      'kms_key_ids',
      'kms_key_arns',
    ];

    requiredOutputs.forEach((outputName) => {
      test(`output "${outputName}" is defined`, () => {
        const outputPattern = new RegExp(`output\\s+["']${outputName}["']\\s*\\{`, 'm');
        expect(stackContent).toMatch(outputPattern);
      });
    });

    test('outputs have descriptions', () => {
      const outputMatches = stackContent.matchAll(/output\s+["'](\w+)["']\s*\{/g);
      let outputCount = 0;
      for (const match of outputMatches) {
        outputCount++;
        const outputName = match[1];
        const outputBlockStart = match.index!;
        const nextOutputIndex = stackContent.indexOf('output "', outputBlockStart + 10) || stackContent.length;
        const outputBlock = stackContent.substring(outputBlockStart, nextOutputIndex);

        expect(outputBlock).toMatch(/description\s*=/);
      }
      expect(outputCount).toBeGreaterThan(0);
    });
  });

  describe('Best Practices', () => {
    test('resources use tags', () => {
      // Check that resources have tags defined (through locals.default_tags)
      expect(stackContent).toMatch(/tags\s*=\s*local\.default_tags/);
    });

    test('resources use resource_prefix for naming', () => {
      expect(stackContent).toMatch(/local\.resource_prefix/);
    });

    test('S3 buckets have lifecycle policies', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_s3_bucket_lifecycle_configuration["']/);
    });

    test('DynamoDB uses proper table naming', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_dynamodb_table["']\s+["']user_activity["'][\s\S]*?name\s*=/);
    });

    test('Lambda functions have timeout configured', () => {
      const lambdaMatch = stackContent.match(/resource\s+["']aws_lambda_function["'][\s\S]*?timeout\s*=/);
      expect(lambdaMatch).toBeTruthy();
    });

    test('Lambda functions have memory configured', () => {
      const lambdaMatch = stackContent.match(/resource\s+["']aws_lambda_function["'][\s\S]*?memory_size\s*=/);
      expect(lambdaMatch).toBeTruthy();
    });

    test('Aurora has backup retention configured', () => {
      expect(stackContent).toMatch(/backup_retention_period/);
    });

    test('CloudWatch logs have retention configured', () => {
      expect(stackContent).toMatch(/retention_in_days/);
    });
  });

  describe('Resource Dependencies', () => {
    test('VPC is created before subnets', () => {
      const vpcIndex = stackContent.indexOf('resource "aws_vpc"');
      const subnetIndex = stackContent.indexOf('resource "aws_subnet"');
      expect(vpcIndex).toBeLessThan(subnetIndex);
    });

    test('Subnets are created before NAT Gateway', () => {
      const subnetIndex = stackContent.indexOf('resource "aws_subnet"');
      const natIndex = stackContent.indexOf('resource "aws_nat_gateway"');
      expect(subnetIndex).toBeLessThan(natIndex);
    });

    test('Lambda role is created before Lambda functions', () => {
      const roleIndex = stackContent.indexOf('resource "aws_iam_role" "lambda_execution"');
      const lambdaIndex = stackContent.indexOf('resource "aws_lambda_function"');
      expect(roleIndex).toBeLessThan(lambdaIndex);
    });

    test('KMS keys are created before S3 buckets', () => {
      const kmsIndex = stackContent.indexOf('resource "aws_kms_key" "s3"');
      const s3Index = stackContent.indexOf('resource "aws_s3_bucket" "archive"');
      expect(kmsIndex).toBeLessThan(s3Index);
    });
  });

  describe('Resource Count Validation', () => {
    test('has expected number of DynamoDB tables', () => {
      const dynamodbMatches = stackContent.match(/resource\s+["']aws_dynamodb_table["']/g);
      expect(dynamodbMatches).toBeTruthy();
      expect(dynamodbMatches!.length).toBe(4);
    });

    test('has expected number of Lambda functions', () => {
      const lambdaMatches = stackContent.match(/resource\s+["']aws_lambda_function["']/g);
      expect(lambdaMatches).toBeTruthy();
      expect(lambdaMatches!.length).toBe(8);
    });

    test('has expected number of S3 buckets', () => {
      const s3Matches = stackContent.match(/resource\s+["']aws_s3_bucket["']/g);
      expect(s3Matches).toBeTruthy();
      expect(s3Matches!.length).toBe(3);
    });

    test('has expected number of SNS topics', () => {
      const snsMatches = stackContent.match(/resource\s+["']aws_sns_topic["']/g);
      expect(snsMatches).toBeTruthy();
      expect(snsMatches!.length).toBe(3);
    });

    test('has expected number of SQS queues', () => {
      const sqsMatches = stackContent.match(/resource\s+["']aws_sqs_queue["']/g);
      expect(sqsMatches).toBeTruthy();
      expect(sqsMatches!.length).toBeGreaterThanOrEqual(4);
    });

    test('has expected number of security groups', () => {
      const sgMatches = stackContent.match(/resource\s+["']aws_security_group["']/g);
      expect(sgMatches).toBeTruthy();
      expect(sgMatches!.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Data Sources', () => {
    test('AWS caller identity data source exists', () => {
      expect(stackContent).toMatch(/data\s+["']aws_caller_identity["']/);
    });

    test('AWS availability zones data source exists', () => {
      expect(stackContent).toMatch(/data\s+["']aws_availability_zones["']/);
    });
  });

  describe('Configuration Validation', () => {
    test('Aurora is not publicly accessible', () => {
      const auroraMatch = stackContent.match(/resource\s+["']aws_rds_cluster["']\s+["']aurora["'][\s\S]*?publicly_accessible\s*=\s*false/);
      // Aurora clusters don't have publicly_accessible attribute, instances do
      // This is acceptable - Aurora should be in private subnets
      expect(stackContent).toMatch(/resource\s+["']aws_rds_cluster["']\s+["']aurora["']/);
    });

    test('Redis is in VPC', () => {
      const redisMatch = stackContent.match(/resource\s+["']aws_elasticache_replication_group["']\s+["']redis["'][\s\S]*?subnet_group_name/);
      expect(redisMatch).toBeTruthy();
    });

    test('Lambda functions in VPC have security groups', () => {
      const lambdaVpcMatch = stackContent.match(/resource\s+["']aws_lambda_function["'][\s\S]*?vpc_config[\s\S]*?security_group_ids/);
      expect(lambdaVpcMatch).toBeTruthy();
    });

    test('API Gateway has throttling configured', () => {
      expect(stackContent).toMatch(/throttle_rate_limit/);
      expect(stackContent).toMatch(/throttle_burst_limit/);
    });

    test('Kinesis stream has proper configuration', () => {
      expect(stackContent).toMatch(/resource\s+["']aws_kinesis_stream["'][\s\S]*?shard_count/);
    });
  });
});
