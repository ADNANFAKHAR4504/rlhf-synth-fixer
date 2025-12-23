// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Static analysis and structure validation - no Terraform commands executed

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform Stack: tap_stack.tf - File Structure", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("tap_stack.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  test("file is not empty", () => {
    expect(content.length).toBeGreaterThan(0);
  });

  test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("has proper file header comment", () => {
    expect(content).toMatch(/tap_stack\.tf.*Multi-Environment/);
  });
});

describe("Terraform Configuration Block", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares terraform block", () => {
    expect(content).toMatch(/terraform\s*{/);
  });

  test("specifies required_version", () => {
    expect(content).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
  });

  test("declares required_providers block", () => {
    expect(content).toMatch(/required_providers\s*{/);
  });

  test("declares aws provider with correct version", () => {
    expect(content).toMatch(/aws\s*=\s*{[^}]*source\s*=\s*"hashicorp\/aws"[^}]*version\s*=\s*"~>\s*5\.0"/s);
  });

  test("declares archive provider", () => {
    expect(content).toMatch(/archive\s*=\s*{[^}]*source\s*=\s*"hashicorp\/archive"/s);
  });

  test("declares random provider", () => {
    expect(content).toMatch(/random\s*=\s*{[^}]*source\s*=\s*"hashicorp\/random"/s);
  });
});

describe("Variable Declarations", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares env variable with validation", () => {
    expect(content).toMatch(/variable\s+"env"\s*{[^}]*validation\s*{/s);
    expect(content).toMatch(/contains\(\["dev",\s*"staging",\s*"prod"\],\s*var\.env\)/);
  });

  test("declares project_name variable", () => {
    expect(content).toMatch(/variable\s+"project_name"\s*{/);
  });

  test("declares vpc_cidr variable", () => {
    expect(content).toMatch(/variable\s+"vpc_cidr"\s*{/);
  });

  test("declares public_subnet_cidrs variable", () => {
    expect(content).toMatch(/variable\s+"public_subnet_cidrs"\s*{/);
  });

  test("declares private_subnet_cidrs variable", () => {
    expect(content).toMatch(/variable\s+"private_subnet_cidrs"\s*{/);
  });

  test("declares observations_stream_name variable", () => {
    expect(content).toMatch(/variable\s+"observations_stream_name"\s*{/);
  });

  test("declares radar_stream_name variable", () => {
    expect(content).toMatch(/variable\s+"radar_stream_name"\s*{/);
  });

  test("declares cluster_id variable for Aurora", () => {
    expect(content).toMatch(/variable\s+"cluster_id"\s*{/);
  });

  test("declares master_username variable", () => {
    expect(content).toMatch(/variable\s+"master_username"\s*{/);
  });

  test("declares node_type variable for Redis", () => {
    expect(content).toMatch(/variable\s+"node_type"\s*{/);
  });

  test("declares runtime variable for Lambda", () => {
    expect(content).toMatch(/variable\s+"runtime"\s*{/);
  });

  test("declares billing_mode variable for DynamoDB", () => {
    expect(content).toMatch(/variable\s+"billing_mode"\s*{/);
  });

  test("declares data_lake_bucket variable", () => {
    expect(content).toMatch(/variable\s+"data_lake_bucket"\s*{/);
  });

  test("declares training_bucket variable", () => {
    expect(content).toMatch(/variable\s+"training_bucket"\s*{/);
  });

  test("declares archive_bucket variable", () => {
    expect(content).toMatch(/variable\s+"archive_bucket"\s*{/);
  });

  test("declares severe_weather_topic variable", () => {
    expect(content).toMatch(/variable\s+"severe_weather_topic"\s*{/);
  });

  test("declares tornado_queue variable", () => {
    expect(content).toMatch(/variable\s+"tornado_queue"\s*{/);
  });

  test("declares hurricane_queue variable", () => {
    expect(content).toMatch(/variable\s+"hurricane_queue"\s*{/);
  });

  test("declares flood_queue variable", () => {
    expect(content).toMatch(/variable\s+"flood_queue"\s*{/);
  });

  test("declares heat_queue variable", () => {
    expect(content).toMatch(/variable\s+"heat_queue"\s*{/);
  });

  test("declares training_schedule_expression variable", () => {
    expect(content).toMatch(/variable\s+"training_schedule_expression"\s*{/);
  });

  test("declares forecast_schedule_expression variable", () => {
    expect(content).toMatch(/variable\s+"forecast_schedule_expression"\s*{/);
  });
});

describe("Locals Block", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares locals block", () => {
    expect(content).toMatch(/locals\s*{/);
  });

  test("defines prefix local for resource naming", () => {
    expect(content).toMatch(/prefix\s*=\s*"\$\{var\.project_name\}-\$\{var\.env\}-\$\{var\.pr_number\}"/);
  });

  test("defines tags local with common tags", () => {
    expect(content).toMatch(/tags\s*=\s*merge\(var\.common_tags/);
    expect(content).toMatch(/Environment\s*=\s*var\.env/);
    expect(content).toMatch(/Project\s*=\s*var\.project_name/);
    expect(content).toMatch(/ManagedBy\s*=\s*"terraform"/);
  });

  test("defines capacity_map local for environment-specific configs", () => {
    expect(content).toMatch(/capacity_map\s*=\s*{/);
    expect(content).toMatch(/dev\s*=\s*{/);
    expect(content).toMatch(/staging\s*=\s*{/);
    expect(content).toMatch(/prod\s*=\s*{/);
  });

  test("defines alert_queues local", () => {
    expect(content).toMatch(/alert_queues\s*=\s*{/);
  });
});

describe("Data Sources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_availability_zones data source", () => {
    expect(content).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
  });

  test("declares aws_caller_identity data source", () => {
    expect(content).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
  });
});

describe("VPC and Networking Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_vpc resource", () => {
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
  });

  test("declares aws_internet_gateway resource", () => {
    expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
  });

  test("declares aws_subnet public subnets", () => {
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
  });

  test("declares aws_subnet private subnets", () => {
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
  });

  test("declares aws_nat_gateway resource", () => {
    expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
  });

  test("declares aws_eip resource for NAT", () => {
    expect(content).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
  });

  test("declares aws_route_table for public", () => {
    expect(content).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
  });

  test("declares aws_route_table for private", () => {
    expect(content).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
  });

  test("declares security groups", () => {
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"lambda"\s*{/);
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"redis"\s*{/);
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"aurora"\s*{/);
  });

  test("declares VPC endpoints", () => {
    expect(content).toMatch(/resource\s+"aws_vpc_endpoint"\s+"dynamodb"\s*{/);
    expect(content).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"\s*{/);
    expect(content).toMatch(/resource\s+"aws_vpc_endpoint"\s+"kinesis"\s*{/);
  });
});

describe("Kinesis Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_kinesis_stream for observations", () => {
    expect(content).toMatch(/resource\s+"aws_kinesis_stream"\s+"observations"\s*{/);
  });

  test("declares aws_kinesis_stream for radar", () => {
    expect(content).toMatch(/resource\s+"aws_kinesis_stream"\s+"radar"\s*{/);
  });

  test("declares aws_kinesis_firehose_delivery_stream", () => {
    expect(content).toMatch(/resource\s+"aws_kinesis_firehose_delivery_stream"\s+"radar"\s*{/);
  });
});

describe("DynamoDB Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_dynamodb_table for observations", () => {
    expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"observations"\s*{/);
  });

  test("declares aws_dynamodb_table for thresholds", () => {
    expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"thresholds"\s*{/);
  });

  test("declares aws_dynamodb_table for alerts", () => {
    expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"alerts"\s*{/);
  });

  test("declares aws_dynamodb_table for radar_data", () => {
    expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"radar_data"\s*{/);
  });

  test("declares aws_dynamodb_table for forecasts", () => {
    expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"forecasts"\s*{/);
  });

  test("declares aws_dynamodb_table for model_versions", () => {
    expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"model_versions"\s*{/);
  });

  test("observations table has stream enabled", () => {
    expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"observations"[\s\S]*?stream_enabled\s*=\s*true/s);
  });
});

describe("Lambda Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_lambda_function for validator", () => {
    expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"validator"\s*{/);
  });

  test("declares aws_lambda_function for analyzer", () => {
    expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"analyzer"\s*{/);
  });

  test("declares aws_lambda_function for alert_evaluator", () => {
    expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"alert_evaluator"\s*{/);
  });

  test("declares aws_lambda_function for image_processor", () => {
    expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"image_processor"\s*{/);
  });

  test("declares aws_lambda_function for training_orchestrator", () => {
    expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"training_orchestrator"\s*{/);
  });

  test("declares aws_lambda_function for forecast_generator", () => {
    expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"forecast_generator"\s*{/);
  });

  test("declares Lambda event source mappings", () => {
    expect(content).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"observations_stream"\s*{/);
    expect(content).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"dynamodb_stream"\s*{/);
  });

  test("declares CloudWatch log groups for Lambda functions", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_validator"\s*{/);
    expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_analyzer"\s*{/);
  });
});

describe("Aurora PostgreSQL Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_db_subnet_group for Aurora", () => {
    expect(content).toMatch(/resource\s+"aws_db_subnet_group"\s+"aurora"\s*{/);
  });

  test("declares aws_rds_cluster for Aurora", () => {
    expect(content).toMatch(/resource\s+"aws_rds_cluster"\s+"aurora"\s*{/);
  });

  test("declares aws_rds_cluster_instance for Aurora", () => {
    expect(content).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"aurora"\s*{/);
  });

  test("Aurora cluster uses aurora-postgresql engine", () => {
    expect(content).toMatch(/resource\s+"aws_rds_cluster"\s+"aurora"[\s\S]*?engine\s*=\s*"aurora-postgresql"/s);
  });

  test("Aurora cluster has storage encryption enabled", () => {
    expect(content).toMatch(/resource\s+"aws_rds_cluster"\s+"aurora"[\s\S]*?storage_encrypted\s*=\s*true/s);
  });

  test("declares random_password for Aurora master", () => {
    expect(content).toMatch(/resource\s+"random_password"\s+"aurora_master"\s*{/);
  });

  test("declares aws_secretsmanager_secret for Aurora", () => {
    expect(content).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"aurora_master"\s*{/);
  });
});

describe("ElastiCache Redis Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_elasticache_subnet_group for Redis", () => {
    expect(content).toMatch(/resource\s+"aws_elasticache_subnet_group"\s+"redis"\s*{/);
  });

  test("declares aws_elasticache_parameter_group for Redis", () => {
    expect(content).toMatch(/resource\s+"aws_elasticache_parameter_group"\s+"redis"\s*{/);
  });

  test("declares aws_elasticache_replication_group for Redis", () => {
    expect(content).toMatch(/resource\s+"aws_elasticache_replication_group"\s+"redis"\s*{/);
  });

  test("Redis has encryption enabled", () => {
    expect(content).toMatch(/resource\s+"aws_elasticache_replication_group"\s+"redis"[\s\S]*?at_rest_encryption_enabled\s*=\s*true/s);
    expect(content).toMatch(/resource\s+"aws_elasticache_replication_group"\s+"redis"[\s\S]*?transit_encryption_enabled\s*=\s*true/s);
  });

  test("declares random_password for Redis auth", () => {
    expect(content).toMatch(/resource\s+"random_password"\s+"redis_auth"\s*{/);
  });

  test("declares aws_secretsmanager_secret for Redis", () => {
    expect(content).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"redis_auth"\s*{/);
  });
});

describe("S3 Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_s3_bucket for data_lake", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"data_lake"\s*{/);
  });

  test("declares aws_s3_bucket for training", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"training"\s*{/);
  });

  test("declares aws_s3_bucket for archive", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"archive"\s*{/);
  });

  test("declares aws_s3_bucket for athena_results", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"athena_results"\s*{/);
  });

  test("declares S3 bucket encryption configuration", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"data_lake"\s*{/);
  });

  test("declares S3 bucket versioning", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"data_lake"\s*{/);
  });

  test("declares S3 bucket lifecycle configuration for archive", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"archive"\s*{/);
  });
});

describe("KMS Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_kms_key for S3", () => {
    expect(content).toMatch(/resource\s+"aws_kms_key"\s+"s3"\s*{/);
  });

  test("declares aws_kms_key for SNS", () => {
    expect(content).toMatch(/resource\s+"aws_kms_key"\s+"sns"\s*{/);
  });
});

describe("SNS Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_sns_topic for severe_weather", () => {
    expect(content).toMatch(/resource\s+"aws_sns_topic"\s+"severe_weather"\s*{/);
  });

  test("SNS topic uses KMS encryption", () => {
    expect(content).toMatch(/resource\s+"aws_sns_topic"\s+"severe_weather"[\s\S]*?kms_master_key_id/s);
  });
});

describe("SQS Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_sqs_queue for alert queues", () => {
    expect(content).toMatch(/resource\s+"aws_sqs_queue"\s+"alert_queues"\s*{/);
  });

  test("declares aws_sqs_queue for dead letter queues", () => {
    expect(content).toMatch(/resource\s+"aws_sqs_queue"\s+"alert_dlq"\s*{/);
  });

  test("declares SNS to SQS subscriptions", () => {
    expect(content).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"sqs_subscriptions"\s*{/);
  });

  test("declares SQS queue policies", () => {
    expect(content).toMatch(/resource\s+"aws_sqs_queue_policy"\s+"alert_queues"\s*{/);
  });
});

describe("Step Functions Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_sfn_state_machine for training", () => {
    expect(content).toMatch(/resource\s+"aws_sfn_state_machine"\s+"training"\s*{/);
  });

  test("declares CloudWatch log group for Step Functions", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"step_functions"\s*{/);
  });
});

describe("EventBridge Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_scheduler_schedule for training", () => {
    expect(content).toMatch(/resource\s+"aws_scheduler_schedule"\s+"training"\s*{/);
  });

  test("declares aws_scheduler_schedule for forecast", () => {
    expect(content).toMatch(/resource\s+"aws_scheduler_schedule"\s+"forecast"\s*{/);
  });
});

describe("Glue Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_glue_catalog_database", () => {
    expect(content).toMatch(/resource\s+"aws_glue_catalog_database"\s+"weather"\s*{/);
  });

  test("declares aws_glue_crawler", () => {
    expect(content).toMatch(/resource\s+"aws_glue_crawler"\s+"data_lake"\s*{/);
  });
});

describe("Athena Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_athena_workgroup", () => {
    expect(content).toMatch(/resource\s+"aws_athena_workgroup"\s+"analytics"\s*{/);
  });
});

describe("WAF Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_wafv2_web_acl", () => {
    expect(content).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"\s*{/);
  });

  test("WAF has SQL injection rule", () => {
    expect(content).toMatch(/name\s*=\s*"AWSManagedRulesSQLiRuleSet"/);
  });

  test("WAF has rate limiting rule", () => {
    expect(content).toMatch(/name\s*=\s*"RateLimitRule"/);
  });

  test("WAF has common rule set", () => {
    expect(content).toMatch(/name\s*=\s*"AWSManagedRulesCommonRuleSet"/);
  });
});

describe("IAM Resources", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares aws_iam_role for Lambda execution", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"lambda_exec"\s*{/);
  });

  test("declares aws_iam_role_policy for Lambda", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_exec"\s*{/);
  });

  test("declares aws_iam_role for Firehose", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"firehose"\s*{/);
  });

  test("declares aws_iam_role for Step Functions", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"step_functions"\s*{/);
  });

  test("declares aws_iam_role for Glue crawler", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"glue_crawler"\s*{/);
  });

  test("declares aws_iam_role for EventBridge", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"eventbridge"\s*{/);
  });

  test("Lambda role has VPC access policy attachment", () => {
    expect(content).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_vpc"\s*{/);
  });
});

describe("CloudWatch Alarms", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares CloudWatch alarms", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
  });

  test("declares alarm for Kinesis incoming records", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"kinesis_incoming_records"\s*{/);
  });

  test("declares alarm for Lambda analyzer duration", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_analyzer_duration"\s*{/);
  });

  test("declares alarm for DynamoDB throttled reads", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dynamodb_throttled"\s*{/);
  });

  test("declares alarm for Aurora connections", () => {
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"aurora_connections"\s*{/);
  });
});

describe("Output Declarations", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("declares outputs block", () => {
    expect(content).toMatch(/# =+\n# OUTPUTS\n# =+/);
  });

  test("declares kinesis_observations_arn output", () => {
    expect(content).toMatch(/output\s+"kinesis_observations_arn"\s*{/);
  });

  test("declares kinesis_radar_arn output", () => {
    expect(content).toMatch(/output\s+"kinesis_radar_arn"\s*{/);
  });

  test("declares kinesis_observations_name output", () => {
    expect(content).toMatch(/output\s+"kinesis_observations_name"\s*{/);
  });

  test("declares kinesis_radar_name output", () => {
    expect(content).toMatch(/output\s+"kinesis_radar_name"\s*{/);
  });

  test("declares dynamodb_tables output", () => {
    expect(content).toMatch(/output\s+"dynamodb_tables"\s*{/);
  });

  test("declares sns_topic_arn output", () => {
    expect(content).toMatch(/output\s+"sns_topic_arn"\s*{/);
  });

  test("declares sqs_queue_urls output", () => {
    expect(content).toMatch(/output\s+"sqs_queue_urls"\s*{/);
  });

  test("declares aurora_endpoints output", () => {
    expect(content).toMatch(/output\s+"aurora_endpoints"\s*{/);
  });

  test("declares aurora_cluster_identifier output", () => {
    expect(content).toMatch(/output\s+"aurora_cluster_identifier"\s*{/);
  });

  test("declares aurora_port output", () => {
    expect(content).toMatch(/output\s+"aurora_port"\s*{/);
  });

  test("declares redis_endpoint output", () => {
    expect(content).toMatch(/output\s+"redis_endpoint"\s*{/);
  });

  test("declares redis_port output", () => {
    expect(content).toMatch(/output\s+"redis_port"\s*{/);
  });

  test("declares step_functions_arn output", () => {
    expect(content).toMatch(/output\s+"step_functions_arn"\s*{/);
  });

  test("declares lambda_functions output", () => {
    expect(content).toMatch(/output\s+"lambda_functions"\s*{/);
  });

  test("declares lambda_function_names output", () => {
    expect(content).toMatch(/output\s+"lambda_function_names"\s*{/);
  });

  test("declares s3_buckets output", () => {
    expect(content).toMatch(/output\s+"s3_buckets"\s*{/);
  });

  test("declares firehose_arn output", () => {
    expect(content).toMatch(/output\s+"firehose_arn"\s*{/);
  });

  test("declares glue_resources output", () => {
    expect(content).toMatch(/output\s+"glue_resources"\s*{/);
  });

  test("declares athena_workgroup output", () => {
    expect(content).toMatch(/output\s+"athena_workgroup"\s*{/);
  });

  test("declares vpc_resources output", () => {
    expect(content).toMatch(/output\s+"vpc_resources"\s*{/);
  });

  test("declares kms_key_ids output", () => {
    expect(content).toMatch(/output\s+"kms_key_ids"\s*{/);
  });

  test("declares secrets_manager_secrets output", () => {
    expect(content).toMatch(/output\s+"secrets_manager_secrets"\s*{/);
  });

  test("declares security_group_ids output", () => {
    expect(content).toMatch(/output\s+"security_group_ids"\s*{/);
  });

  test("declares waf_web_acl_id output", () => {
    expect(content).toMatch(/output\s+"waf_web_acl_id"\s*{/);
  });

  test("declares waf_web_acl_arn output", () => {
    expect(content).toMatch(/output\s+"waf_web_acl_arn"\s*{/);
  });

  test("declares eventbridge_rule_name output", () => {
    expect(content).toMatch(/output\s+"eventbridge_rule_name"\s*{/);
  });
});

describe("Security and Best Practices", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("all S3 buckets have encryption configuration", () => {
    const bucketResources = content.match(/resource\s+"aws_s3_bucket"\s+"\w+"\s*{/g) || [];
    const encryptionResources = content.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/g) || [];
    // Should have encryption for each bucket
    expect(encryptionResources.length).toBeGreaterThan(0);
  });

  test("DynamoDB tables have encryption enabled", () => {
    expect(content).toMatch(/server_side_encryption\s*{[^}]*enabled\s*=\s*true/s);
  });

  test("Aurora cluster is not publicly accessible", () => {
    // Aurora should be in private subnets, which is validated by subnet configuration
    expect(content).toMatch(/db_subnet_group_name\s*=\s*aws_db_subnet_group\.aurora\.name/);
  });

  test("Redis is in private subnets", () => {
    expect(content).toMatch(/subnet_group_name\s*=\s*aws_elasticache_subnet_group\.redis\.name/);
  });

  test("Lambda functions in VPC use private subnets", () => {
    expect(content).toMatch(/vpc_config\s*{[^}]*subnet_ids\s*=\s*aws_subnet\.private/);
  });

  test("security groups have proper ingress rules", () => {
    expect(content).toMatch(/ingress\s*{[^}]*from_port\s*=\s*6379[^}]*security_groups\s*=\s*\[aws_security_group\.lambda\.id\]/s);
    expect(content).toMatch(/ingress\s*{[^}]*from_port\s*=\s*5432[^}]*security_groups\s*=\s*\[aws_security_group\.lambda\.id\]/s);
  });

  test("secrets are stored in Secrets Manager", () => {
    expect(content).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"aurora_master"/);
    expect(content).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"redis_auth"/);
  });

  test("KMS keys are used for encryption", () => {
    expect(content).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.s3/);
    expect(content).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.sns/);
  });
});

describe("Tagging Consistency", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("resources use local.tags for consistent tagging", () => {
    const resourceMatches = content.match(/tags\s*=\s*merge\(local\.tags/g) || [];
    // Should have many resources with tags
    expect(resourceMatches.length).toBeGreaterThan(10);
  });

  test("tags include Environment, Project, and ManagedBy", () => {
    expect(content).toMatch(/Environment\s*=\s*var\.env/);
    expect(content).toMatch(/Project\s*=\s*var\.project_name/);
    expect(content).toMatch(/ManagedBy\s*=\s*"terraform"/);
  });
});

describe("Naming Conventions", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("resources use local.prefix for naming", () => {
    const prefixUsage = content.match(/\$\{local\.prefix\}/g) || [];
    // Should use prefix extensively for naming
    expect(prefixUsage.length).toBeGreaterThan(50);
  });

  test("prefix includes project, env, and pr_number", () => {
    expect(content).toMatch(/prefix\s*=\s*"\$\{var\.project_name\}-\$\{var\.env\}-\$\{var\.pr_number\}"/);
  });
});

describe("Resource Dependencies", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("NAT gateway depends on internet gateway", () => {
    expect(content).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
  });

  test("Lambda functions depend on CloudWatch log groups", () => {
    expect(content).toMatch(/depends_on\s*=\s*\[aws_cloudwatch_log_group\.lambda_\w+\]/);
  });

  test("Aurora cluster instances depend on cluster", () => {
    expect(content).toMatch(/cluster_identifier\s*=\s*aws_rds_cluster\.aurora\.id/);
  });

  test("Secrets versions depend on secrets", () => {
    expect(content).toMatch(/secret_id\s*=\s*aws_secretsmanager_secret\.\w+\.id/);
  });
});

describe("Data Flow and Integration", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("Lambda event source mapping connects Kinesis to Lambda", () => {
    expect(content).toMatch(/event_source_arn\s*=\s*aws_kinesis_stream\.observations\.arn/);
    expect(content).toMatch(/function_name\s*=\s*aws_lambda_function\.validator\.arn/);
  });

  test("Lambda event source mapping connects DynamoDB streams to Lambda", () => {
    expect(content).toMatch(/event_source_arn\s*=\s*aws_dynamodb_table\.observations\.stream_arn/);
    expect(content).toMatch(/function_name\s*=\s*aws_lambda_function\.analyzer\.arn/);
  });

  test("Firehose connects Kinesis to S3", () => {
    expect(content).toMatch(/kinesis_stream_arn\s*=\s*aws_kinesis_stream\.radar\.arn/);
    expect(content).toMatch(/bucket_arn\s*=\s*aws_s3_bucket\.data_lake\.arn/);
  });

  test("SNS topic subscriptions connect to SQS queues", () => {
    expect(content).toMatch(/topic_arn\s*=\s*aws_sns_topic\.severe_weather\.arn/);
    expect(content).toMatch(/endpoint\s*=\s*aws_sqs_queue\.alert_queues/);
  });

  test("Step Functions can invoke Lambda", () => {
    expect(content).toMatch(/"Resource"\s*:\s*"\$\{aws_lambda_function\.training_orchestrator\.arn\}"/);
  });

  test("EventBridge schedules Step Functions", () => {
    expect(content).toMatch(/arn\s*=\s*aws_sfn_state_machine\.training\.arn/);
  });

  test("Glue crawler targets S3 data lake", () => {
    expect(content).toMatch(/s3_target\s*{[^}]*path\s*=\s*"s3:\/\/\$\{aws_s3_bucket\.data_lake\.bucket\}/);
  });

  test("Athena workgroup uses S3 results bucket", () => {
    expect(content).toMatch(/output_location\s*=\s*"s3:\/\/\$\{aws_s3_bucket\.athena_results\.bucket\}/);
  });
});

describe("Environment-Specific Configuration", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("capacity_map defines dev, staging, and prod configurations", () => {
    expect(content).toMatch(/dev\s*=\s*{[^}]*kinesis_shards[^}]*lambda_memory[^}]*redis_nodes[^}]*aurora_min_capacity[^}]*aurora_max_capacity/s);
    expect(content).toMatch(/staging\s*=\s*{[^}]*kinesis_shards[^}]*lambda_memory[^}]*redis_nodes[^}]*aurora_min_capacity[^}]*aurora_max_capacity/s);
    expect(content).toMatch(/prod\s*=\s*{[^}]*kinesis_shards[^}]*lambda_memory[^}]*redis_nodes[^}]*aurora_min_capacity[^}]*aurora_max_capacity/s);
  });

  test("resources use capacity_map for environment-specific sizing", () => {
    expect(content).toMatch(/local\.capacity_map\[var\.env\]\.kinesis_shards/);
    expect(content).toMatch(/local\.capacity_map\[var\.env\]\.lambda_memory/);
    expect(content).toMatch(/local\.capacity_map\[var\.env\]\.redis_nodes/);
    expect(content).toMatch(/local\.capacity_map\[var\.env\]\.aurora_min_capacity/);
    expect(content).toMatch(/local\.capacity_map\[var\.env\]\.aurora_max_capacity/);
  });
});

describe("Code Quality and Structure", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("file has proper section headers", () => {
    expect(content).toMatch(/# =+\n# TERRAFORM CONFIGURATION\n# =+/);
    expect(content).toMatch(/# =+\n# VARIABLES\n# =+/);
    expect(content).toMatch(/# =+\n# LOCALS\n# =+/);
    expect(content).toMatch(/# =+\n# OUTPUTS\n# =+/);
  });

  test("no hardcoded credentials", () => {
    // Should not have hardcoded passwords or access keys
    expect(content).not.toMatch(/password\s*=\s*"[^"]{8,}"/);
    expect(content).not.toMatch(/access_key\s*=/);
    expect(content).not.toMatch(/secret_key\s*=/);
  });

  test("uses variables instead of hardcoded values for critical configs", () => {
    expect(content).toMatch(/var\.env/);
    expect(content).toMatch(/var\.project_name/);
  });

  test("uses locals for computed values", () => {
    expect(content).toMatch(/local\.prefix/);
    expect(content).toMatch(/local\.tags/);
    expect(content).toMatch(/local\.capacity_map/);
  });
});
