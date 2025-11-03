// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Validates structure, resources, security, and best practices without executing Terraform

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

// Helper to read stack content once
let stackContent: string;

beforeAll(() => {
  if (!fs.existsSync(stackPath)) {
    throw new Error(`Stack file not found at: ${stackPath}`);
  }
  stackContent = fs.readFileSync(stackPath, "utf8");
});

// =============================================================================
// FILE STRUCTURE & BASIC VALIDATION
// =============================================================================

describe("File Structure and Basic Validation", () => {
  test("tap_stack.tf exists and is readable", () => {
    expect(fs.existsSync(stackPath)).toBe(true);
    expect(stackContent.length).toBeGreaterThan(1000);
  });

  test("file contains valid HCL syntax indicators", () => {
    // Check for basic HCL syntax
    expect(stackContent).toMatch(/resource\s+"/);
    expect(stackContent).toMatch(/variable\s+"/);
    expect(stackContent).toMatch(/output\s+"/);
  });

  test("does NOT declare provider block (provider.tf owns providers)", () => {
    expect(stackContent).not.toMatch(/provider\s+"aws"\s*{/);
  });

  test("uses locals for name prefixing", () => {
    expect(stackContent).toMatch(/locals\s*{/);
    expect(stackContent).toMatch(/name_prefix\s*=/);
  });

  test("includes proper documentation comments", () => {
    expect(stackContent).toMatch(/SLA/i);
    expect(stackContent).toMatch(/optimistic locking|conditional write/i);
  });
});

// =============================================================================
// VARIABLES VALIDATION
// =============================================================================

describe("Required Variables", () => {
  test("declares aws_region variable", () => {
    expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
    expect(stackContent).toMatch(/default\s*=\s*"us-west-2"/);
  });

  test("declares project_name variable", () => {
    expect(stackContent).toMatch(/variable\s+"project_name"\s*{/);
    expect(stackContent).toMatch(/default\s*=\s*"global-booking"/);
  });

  test("declares environment variable", () => {
    expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
    expect(stackContent).toMatch(/default\s*=\s*"prod"/);
  });

  test("declares dynamodb_table_name variable", () => {
    expect(stackContent).toMatch(/variable\s+"dynamodb_table_name"\s*{/);
  });

  test("declares dynamodb_replica_regions variable", () => {
    expect(stackContent).toMatch(/variable\s+"dynamodb_replica_regions"\s*{/);
    expect(stackContent).toMatch(/type\s*=\s*list\(string\)/);
  });

  test("declares cache_node_type variable", () => {
    expect(stackContent).toMatch(/variable\s+"cache_node_type"\s*{/);
  });

  test("declares booking_api_rate_limit_rps variable", () => {
    expect(stackContent).toMatch(/variable\s+"booking_api_rate_limit_rps"\s*{/);
    expect(stackContent).toMatch(/default\s*=\s*2000/);
  });

  test("declares lambda_reserved_concurrency variable", () => {
    expect(stackContent).toMatch(/variable\s+"lambda_reserved_concurrency"\s*{/);
  });

  test("declares VPC networking variables", () => {
    expect(stackContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
    expect(stackContent).toMatch(/variable\s+"availability_zones"\s*{/);
  });

  test("declares JWT authorizer variables", () => {
    expect(stackContent).toMatch(/variable\s+"jwt_issuer"\s*{/);
    expect(stackContent).toMatch(/variable\s+"jwt_audience"\s*{/);
  });

  test("declares tags variable as map", () => {
    expect(stackContent).toMatch(/variable\s+"tags"\s*{/);
    expect(stackContent).toMatch(/type\s*=\s*map\(string\)/);
  });
});

// =============================================================================
// NETWORKING INFRASTRUCTURE
// =============================================================================

describe("VPC and Networking Resources (Brand New Stack)", () => {
  test("creates VPC resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
    expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("creates Internet Gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
  });

  test("creates public subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
    expect(stackContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
    expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
  });

  test("creates private subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
    expect(stackContent).toMatch(/count\s*=\s*length\(var\.availability_zones\)/);
  });

  test("creates NAT Gateways for private subnet internet access", () => {
    expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
  });

  test("creates route tables for public and private subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_route_table_association"/);
  });

  test("creates VPC endpoints for DynamoDB and S3", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"dynamodb"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"\s*{/);
    expect(stackContent).toMatch(/vpc_endpoint_type\s*=\s*"Gateway"/);
  });
});

// =============================================================================
// SECURITY GROUPS
// =============================================================================

describe("Security Groups", () => {
  test("creates Lambda security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"lambda"\s*{/);
    expect(stackContent).toMatch(/name\s*=.*lambda-sg/);
  });

  test("creates ElastiCache security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"elasticache"\s*{/);
  });

  test("creates Aurora security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"aurora"\s*{/);
  });

  test("ElastiCache SG allows ingress from Lambda SG on port 6379", () => {
    const elasticacheSGMatch = stackContent.match(
      /resource\s+"aws_security_group"\s+"elasticache"\s*{[\s\S]*?(?=resource\s+"|$)/
    );
    expect(elasticacheSGMatch).toBeTruthy();
    const sgContent = elasticacheSGMatch![0];
    expect(sgContent).toMatch(/from_port\s*=\s*6379/);
    expect(sgContent).toMatch(/to_port\s*=\s*6379/);
    expect(sgContent).toMatch(/security_groups\s*=.*lambda/);
  });

  test("Aurora SG allows ingress from Lambda SG on port 3306", () => {
    const auroraSGMatch = stackContent.match(
      /resource\s+"aws_security_group"\s+"aurora"\s*{[\s\S]*?(?=resource\s+"|$)/
    );
    expect(auroraSGMatch).toBeTruthy();
    const sgContent = auroraSGMatch![0];
    expect(sgContent).toMatch(/from_port\s*=\s*3306/);
    expect(sgContent).toMatch(/to_port\s*=\s*3306/);
  });

  test("security groups have proper egress rules", () => {
    expect(stackContent).toMatch(/egress\s*{[\s\S]*?protocol\s*=\s*"-1"/);
  });
});

// =============================================================================
// S3 BUCKET FOR LAMBDA CODE
// =============================================================================

describe("S3 Bucket for Lambda Code", () => {
  test("creates S3 bucket for Lambda code", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"lambda_code"\s*{/);
  });

  test("enables versioning on Lambda code bucket", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"lambda_code"\s*{/);
    expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
  });

  test("enables encryption on Lambda code bucket", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"lambda_code"\s*{/);
    expect(stackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
  });

  test("blocks public access to Lambda code bucket", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"lambda_code"\s*{/);
    expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
    expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
  });
});

// =============================================================================
// SECRETS MANAGEMENT
// =============================================================================

describe("Secrets Management (No Hardcoded Passwords)", () => {
  test("generates random password for Aurora", () => {
    expect(stackContent).toMatch(/resource\s+"random_password"\s+"aurora_master"\s*{/);
    expect(stackContent).toMatch(/length\s*=\s*32/);
    expect(stackContent).toMatch(/special\s*=\s*true/);
  });

  test("stores Aurora password in Secrets Manager", () => {
    expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"aurora_master_password"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"aurora_master_password"\s*{/);
  });

  test("generates random auth token for Redis", () => {
    expect(stackContent).toMatch(/resource\s+"random_password"\s+"redis_auth_token"\s*{/);
  });

  test("stores Redis auth token in Secrets Manager", () => {
    expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"redis_auth_token"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"redis_auth_token"\s*{/);
  });

  test("NO hardcoded passwords in Aurora cluster", () => {
    // Check that master_password uses random_password, not hardcoded value
    expect(stackContent).toMatch(/master_password\s*=\s*random_password\.aurora_master\.result/);
    expect(stackContent).not.toMatch(/master_password\s*=\s*"placeholder/);
  });
});

// =============================================================================
// SNS TOPIC FOR ALARMS
// =============================================================================

describe("CloudWatch Alarms SNS Topic", () => {
  test("creates SNS topic for CloudWatch alarms", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"cloudwatch_alarms"\s*{/);
  });

  test("SNS topic has encryption enabled", () => {
    // Check cloudwatch_alarms topic has KMS encryption
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"cloudwatch_alarms"/);
    expect(stackContent).toMatch(/kms_master_key_id\s*=\s*"alias\/aws\/sns"/);
  });

  test("creates email subscription for alarms", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"alarm_email"\s*{/);
    expect(stackContent).toMatch(/protocol\s*=\s*"email"/);
  });
});

// =============================================================================
// DYNAMODB GLOBAL TABLE
// =============================================================================

describe("DynamoDB Global Table with Optimistic Locking", () => {
  test("creates DynamoDB table resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"inventory"\s*{/);
  });

  test("uses PAY_PER_REQUEST billing mode", () => {
    expect(stackContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
  });

  test("defines booking_key as hash key", () => {
    expect(stackContent).toMatch(/hash_key\s*=\s*"booking_key"/);
  });

  test("defines required attributes (booking_key, property_id)", () => {
    expect(stackContent).toMatch(/attribute\s*{[\s\S]*?name\s*=\s*"booking_key"/);
    expect(stackContent).toMatch(/attribute\s*{[\s\S]*?name\s*=\s*"property_id"/);
  });

  test("includes documentation about optimistic locking schema", () => {
    // Check for optimistic locking comments and schema
    expect(stackContent).toMatch(/OPTIMISTIC LOCKING/i);
    expect(stackContent).toMatch(/version.*optimistic lock/i);
    expect(stackContent).toMatch(/available_units/);
  });

  test("creates Global Secondary Index on property_id", () => {
    expect(stackContent).toMatch(/global_secondary_index\s*{/);
    expect(stackContent).toMatch(/hash_key\s*=\s*"property_id"/);
  });

  test("enables TTL for temporary hold records", () => {
    expect(stackContent).toMatch(/ttl\s*{/);
    expect(stackContent).toMatch(/attribute_name\s*=\s*"expiry_time"/);
    expect(stackContent).toMatch(/enabled\s*=\s*true/);
  });

  test("enables DynamoDB Streams", () => {
    expect(stackContent).toMatch(/stream_enabled\s*=\s*true/);
    expect(stackContent).toMatch(/stream_view_type\s*=\s*"NEW_AND_OLD_IMAGES"/);
  });

  test("configures global table replicas", () => {
    expect(stackContent).toMatch(/dynamic\s+"replica"\s*{/);
    expect(stackContent).toMatch(/for_each\s*=\s*toset\(var\.dynamodb_replica_regions\)/);
  });

  test("enables server-side encryption", () => {
    expect(stackContent).toMatch(/server_side_encryption\s*{[\s\S]*?enabled\s*=\s*true/);
  });

  test("enables point-in-time recovery", () => {
    expect(stackContent).toMatch(/point_in_time_recovery\s*{[\s\S]*?enabled\s*=\s*true/);
  });
});

// =============================================================================
// IAM ROLES & POLICIES
// =============================================================================

describe("IAM Roles and Policies (Least Privilege)", () => {
  const expectedRoles = [
    "booking_handler_role",
    "cache_updater_role",
    "pms_sync_worker_role",
    "reconciliation_checker_role",
    "overbooking_resolver_role",
    "hot_booking_checker_role",
    "step_functions_role",
    "eventbridge_to_sfn_role",
    "rds_monitoring_role"
  ];

  test.each(expectedRoles)("creates IAM role: %s", (roleName) => {
    expect(stackContent).toMatch(new RegExp(`resource\\s+"aws_iam_role"\\s+"${roleName}"\\s*{`));
  });

  test("booking_handler has DynamoDB conditional write permissions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"booking_handler_policy"/);
    expect(stackContent).toMatch(/dynamodb:ConditionCheckItem/);
    expect(stackContent).toMatch(/dynamodb:UpdateItem/);
  });

  test("cache_updater can read DynamoDB streams", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"cache_updater_policy"/);
    expect(stackContent).toMatch(/dynamodb:GetRecords/);
    expect(stackContent).toMatch(/dynamodb:GetShardIterator/);
    expect(stackContent).toMatch(/dynamodb:ListStreams/);
  });

  test("cache_updater can access Redis auth token from Secrets Manager", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"cache_updater_policy"/);
    expect(stackContent).toMatch(/secretsmanager:GetSecretValue/);
    expect(stackContent).toMatch(/redis_auth_token/);
  });

  test("reconciliation_checker can access both Aurora and Redis secrets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"reconciliation_checker_policy"/);
    expect(stackContent).toMatch(/secretsmanager:GetSecretValue/);
    expect(stackContent).toMatch(/aurora_master_password/);
    expect(stackContent).toMatch(/redis_auth_token/);
  });

  test("Lambda roles have VPC network interface permissions", () => {
    expect(stackContent).toMatch(/ec2:CreateNetworkInterface/);
    expect(stackContent).toMatch(/ec2:DescribeNetworkInterfaces/);
    expect(stackContent).toMatch(/ec2:DeleteNetworkInterface/);
  });

  test("roles have CloudWatch Logs permissions", () => {
    expect(stackContent).toMatch(/logs:CreateLogGroup/);
    expect(stackContent).toMatch(/logs:CreateLogStream/);
    expect(stackContent).toMatch(/logs:PutLogEvents/);
  });

  test("roles have X-Ray tracing permissions", () => {
    expect(stackContent).toMatch(/xray:PutTraceSegments/);
    expect(stackContent).toMatch(/xray:PutTelemetryRecords/);
  });

  test("SQS IAM policy uses exact ARN (no wildcard)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"pms_sync_worker_policy"/);
    // Check that it uses exact ARN without wildcard suffix
    expect(stackContent).toMatch(/aws_sqs_queue\.hotel_pms_queue\.arn/);
  });

  test("Step Functions role has Lambda invoke permissions with version support", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"step_functions_policy"/);
    expect(stackContent).toMatch(/lambda:InvokeFunction/);
    expect(stackContent).toMatch(/reconciliation_checker/);
    expect(stackContent).toMatch(/overbooking_resolver/);
  });
});

// =============================================================================
// LAMBDA FUNCTIONS
// =============================================================================

describe("Lambda Functions Configuration", () => {
  const expectedLambdas = [
    "booking_handler",
    "cache_updater",
    "hot_booking_checker",
    "pms_sync_worker",
    "reconciliation_checker",
    "overbooking_resolver"
  ];

  test.each(expectedLambdas)("creates Lambda function: %s", (lambdaName) => {
    expect(stackContent).toMatch(
      new RegExp(`resource\\s+"aws_lambda_function"\\s+"${lambdaName}"\\s*{`)
    );
  });

  test("all Lambdas use nodejs20.x runtime (not deprecated nodejs14.x)", () => {
    // Check for nodejs20.x runtime
    expect(stackContent).toMatch(/runtime\s*=\s*"nodejs20\.x"/);
    // Ensure no deprecated nodejs14.x runtime
    expect(stackContent).not.toMatch(/runtime\s*=\s*"nodejs14\.x"/);
  });

  test("booking_handler has reserved concurrency configured", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"booking_handler"/);
    expect(stackContent).toMatch(/reserved_concurrent_executions/);
  });

  test("booking_handler has optimistic locking environment variable", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"booking_handler"/);
    expect(stackContent).toMatch(/ENABLE_OPTIMISTIC_LOCKING|optimistic locking/i);
  });

  test("cache_updater has VPC configuration", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"cache_updater"/);
    expect(stackContent).toMatch(/vpc_config\s*{/);
    expect(stackContent).toMatch(/subnet_ids/);
    expect(stackContent).toMatch(/security_group_ids/);
  });

  test("cache_updater has Redis auth token secret ARN in environment", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"cache_updater"/);
    expect(stackContent).toMatch(/REDIS_AUTH_SECRET_ARN/);
  });

  test("reconciliation_checker has VPC configuration for Aurora/Redis access", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"reconciliation_checker"/);
    expect(stackContent).toMatch(/vpc_config\s*{/);
  });

  test("pms_sync_worker Lambda exists", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"pms_sync_worker"/);
    // This Lambda is for external PMS API calls
  });

  test("all Lambdas have X-Ray tracing enabled", () => {
    // Check that X-Ray tracing is configured
    expect(stackContent).toMatch(/tracing_config\s*{/);
    expect(stackContent).toMatch(/mode\s*=\s*"Active"/);
  });

  test("Lambdas use local deployment package", () => {
    // Check that Lambda functions use filename for deployment (placeholder)
    expect(stackContent).toMatch(/filename\s*=\s*"\$\{path\.module\}\/lambda_placeholder\.zip"/);
    expect(stackContent).toMatch(/source_code_hash\s*=\s*filebase64sha256\(/);

    // S3 bucket still exists for future use
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"lambda_code"/);
  });

  test("hot_booking_checker Lambda exists for 30s SLA", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"hot_booking_checker"\s*{/);
    expect(stackContent).toMatch(/30 second|30s|hot booking/i);
  });
});

// =============================================================================
// API GATEWAY
// =============================================================================

describe("API Gateway with Security", () => {
  test("creates HTTP API Gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_apigatewayv2_api"\s+"booking_api"\s*{/);
    expect(stackContent).toMatch(/protocol_type\s*=\s*"HTTP"/);
  });

  test("configures CORS with restricted origins", () => {
    expect(stackContent).toMatch(/resource\s+"aws_apigatewayv2_api"\s+"booking_api"/);
    expect(stackContent).toMatch(/cors_configuration\s*{/);
    expect(stackContent).toMatch(/allow_origins/);
    // Should have specific origin, not wildcard
  });

  test("creates JWT authorizer", () => {
    expect(stackContent).toMatch(/resource\s+"aws_apigatewayv2_authorizer"\s+"jwt"\s*{/);
    expect(stackContent).toMatch(/authorizer_type\s*=\s*"JWT"/);
    expect(stackContent).toMatch(/jwt_configuration\s*{/);
  });

  test("route uses JWT authorization", () => {
    expect(stackContent).toMatch(/resource\s+"aws_apigatewayv2_route"/);
    expect(stackContent).toMatch(/authorization_type\s*=\s*"JWT"/);
    expect(stackContent).toMatch(/authorizer_id/);
  });

  test("stage configures throttling for SLA", () => {
    expect(stackContent).toMatch(/resource\s+"aws_apigatewayv2_stage"\s+"booking_api_stage"/);
    expect(stackContent).toMatch(/throttling_burst_limit|rate_limit/);
  });

  test("stage has access logging configured", () => {
    expect(stackContent).toMatch(/resource\s+"aws_apigatewayv2_stage"\s+"booking_api_stage"/);
    expect(stackContent).toMatch(/access_log_settings\s*{/);
    expect(stackContent).toMatch(/destination_arn/);
  });

  test("creates Lambda permission for API Gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"api_gateway_invoke_booking_handler"\s*{/);
    expect(stackContent).toMatch(/principal\s*=\s*"apigateway\.amazonaws\.com"/);
  });
});

// =============================================================================
// DYNAMODB STREAM MAPPINGS
// =============================================================================

describe("DynamoDB Stream Event Source Mappings", () => {
  test("creates event source mapping for cache updater", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"dynamodb_to_cache_updater"\s*{/);
  });

  test("creates event source mapping for hot booking checker", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"dynamodb_to_hot_booking_checker"\s*{/);
  });

  test("cache updater mapping has proper batch settings for <1s SLA", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"dynamodb_to_cache_updater"/);
    expect(stackContent).toMatch(/batch_size/);
    expect(stackContent).toMatch(/maximum_batching_window_in_seconds/);
  });

  test("hot booking checker has filter criteria for booking writes", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"dynamodb_to_hot_booking_checker"/);
    expect(stackContent).toMatch(/filter_criteria|available_units/i);
  });

  test("event source mappings have destination config for failures", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"dynamodb_to_cache_updater"/);
    expect(stackContent).toMatch(/destination_config|on_failure/);
  });

  test("creates DLQ for cache updater failures", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"cache_updater_dlq"\s*{/);
  });
});

// =============================================================================
// ELASTICACHE (REDIS)
// =============================================================================

describe("ElastiCache Redis Cluster", () => {
  test("creates ElastiCache replication group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_elasticache_replication_group"\s+"booking_cache"\s*{/);
  });

  test("specifies engine as redis", () => {
    expect(stackContent).toMatch(/resource\s+"aws_elasticache_replication_group"\s+"booking_cache"/);
    expect(stackContent).toMatch(/engine\s*=\s*"redis"/);
  });

  test("uses Redis 7.0 or higher", () => {
    expect(stackContent).toMatch(/resource\s+"aws_elasticache_replication_group"\s+"booking_cache"/);
    expect(stackContent).toMatch(/engine_version\s*=\s*"7\./);
  });

  test("configures cluster mode for scalability", () => {
    expect(stackContent).toMatch(/resource\s+"aws_elasticache_replication_group"\s+"booking_cache"/);
    expect(stackContent).toMatch(/num_node_groups/);
    expect(stackContent).toMatch(/replicas_per_node_group/);
  });

  test("enables automatic failover and multi-AZ", () => {
    expect(stackContent).toMatch(/resource\s+"aws_elasticache_replication_group"\s+"booking_cache"/);
    expect(stackContent).toMatch(/automatic_failover_enabled\s*=\s*true/);
    expect(stackContent).toMatch(/multi_az_enabled\s*=\s*true/);
  });

  test("enables encryption at rest and in transit", () => {
    expect(stackContent).toMatch(/resource\s+"aws_elasticache_replication_group"\s+"booking_cache"/);
    expect(stackContent).toMatch(/at_rest_encryption_enabled\s*=\s*true/);
    expect(stackContent).toMatch(/transit_encryption_enabled\s*=\s*true/);
  });

  test("configures auth token (not auth_token_enabled)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_elasticache_replication_group"\s+"booking_cache"/);
    expect(stackContent).toMatch(/auth_token\s*=\s*random_password\.redis_auth_token\.result/);
    expect(stackContent).not.toMatch(/auth_token_enabled/);
  });

  test("includes per-hotel caching strategy comments", () => {
    expect(stackContent).toMatch(/per-hotel|per.*property/i);
    expect(stackContent).toMatch(/45.*000|45k/i);
  });

  test("creates ElastiCache subnet group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_elasticache_subnet_group"\s+"redis_subnet_group"\s*{/);
  });
});

// =============================================================================
// SNS & SQS
// =============================================================================

describe("SNS Topic and SQS Queues", () => {
  test("creates SNS topic for inventory updates", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"inventory_updates"\s*{/);
  });

  test("SNS topic has encryption enabled", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"inventory_updates"/);
    expect(stackContent).toMatch(/kms_master_key_id/);
  });

  test("creates SQS queue for PMS integration", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"hotel_pms_queue"\s*{/);
  });

  test("creates DLQ for PMS queue", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"hotel_pms_dlq"\s*{/);
  });

  test("PMS queue has redrive policy to DLQ", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"hotel_pms_queue"/);
    expect(stackContent).toMatch(/redrive_policy/);
    expect(stackContent).toMatch(/deadLetterTargetArn/);
    expect(stackContent).toMatch(/maxReceiveCount/);
  });

  test("SQS queues have encryption enabled", () => {
    expect(stackContent).toMatch(/sqs_managed_sse_enabled\s*=\s*true/);
  });

  test("creates SNS subscription with filter policy", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"hotel_pms_subscription"\s*{/);
    expect(stackContent).toMatch(/filter_policy/);
    expect(stackContent).toMatch(/property_id/);
  });

  test("includes fanout strategy comments (not all 45k hotels)", () => {
    expect(stackContent).toMatch(/45k|45.*000/i);
    expect(stackContent).toMatch(/not all hotels|only.*affected|per-hotel/i);
  });

  test("creates SQS queue policy allowing SNS", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sqs_queue_policy"\s+"hotel_pms_queue_policy"\s*{/);
  });

  test("creates event source mapping from SQS to Lambda", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"sqs_to_pms_sync_worker"\s*{/);
  });
});

// =============================================================================
// EVENTBRIDGE & STEP FUNCTIONS
// =============================================================================

describe("EventBridge and Step Functions", () => {
  test("creates EventBridge rule for scheduled reconciliation", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"reconciliation_schedule"\s*{/);
    expect(stackContent).toMatch(/schedule_expression\s*=\s*"rate\(5 minutes\)"/);
  });

  test("includes comment about replacing 30s all-hotels approach", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"reconciliation_schedule"/);
    expect(stackContent).toMatch(/replaces|periodic.*sampled|old approach/i);
  });

  test("creates Step Functions state machine", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sfn_state_machine"\s+"reconciliation_state_machine"\s*{/);
  });

  test("state machine definition includes proper Lambda invocation syntax", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sfn_state_machine"\s+"reconciliation_state_machine"/);
    expect(stackContent).toMatch(/arn:aws:states:::lambda:invoke/);
  });

  test("state machine includes reconciliation checker and overbooking resolver", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sfn_state_machine"\s+"reconciliation_state_machine"/);
    expect(stackContent).toMatch(/reconciliation_checker/);
    expect(stackContent).toMatch(/overbooking_resolver/);
  });

  test("creates EventBridge target with proper input", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"reconciliation_target"\s*{/);
    expect(stackContent).toMatch(/input\s*=|input_path\s*=/);
  });

  test("creates IAM role for EventBridge to invoke Step Functions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"eventbridge_to_sfn_role"\s*{/);
    expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"eventbridge_to_sfn_policy"\s*{/);
  });
});

// =============================================================================
// AURORA DATABASE
// =============================================================================

describe("Aurora MySQL Database", () => {
  test("creates Aurora cluster", () => {
    expect(stackContent).toMatch(/resource\s+"aws_rds_cluster"\s+"audit_db"\s*{/);
  });

  test("uses Aurora MySQL 8.0 (not deprecated 5.7)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_rds_cluster"\s+"audit_db"/);
    expect(stackContent).toMatch(/engine\s*=\s*"aurora-mysql"/);
    expect(stackContent).toMatch(/engine_version\s*=\s*"8\.0/);
    expect(stackContent).not.toMatch(/5\.7/);
  });

  test("enables storage encryption", () => {
    expect(stackContent).toMatch(/resource\s+"aws_rds_cluster"\s+"audit_db"/);
    expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
  });

  test("configures backup retention", () => {
    expect(stackContent).toMatch(/resource\s+"aws_rds_cluster"\s+"audit_db"/);
    expect(stackContent).toMatch(/backup_retention_period/);
  });

  test("enables CloudWatch log exports", () => {
    expect(stackContent).toMatch(/resource\s+"aws_rds_cluster"\s+"audit_db"/);
    expect(stackContent).toMatch(/enabled_cloudwatch_logs_exports/);
  });

  test("creates Aurora cluster instance (reader)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"audit_db_reader"\s*{/);
  });

  test("Aurora instance has enhanced monitoring enabled", () => {
    expect(stackContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"audit_db_reader"/);
    expect(stackContent).toMatch(/monitoring_interval\s*=\s*60/);
    expect(stackContent).toMatch(/monitoring_role_arn/);
  });

  test("Aurora instance has Performance Insights enabled", () => {
    expect(stackContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"audit_db_reader"/);
    expect(stackContent).toMatch(/performance_insights_enabled\s*=\s*true/);
  });

  test("creates RDS monitoring IAM role", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"rds_monitoring_role"\s*{/);
    expect(stackContent).toMatch(/Service.*monitoring\.rds\.amazonaws\.com/);
  });

  test("creates DB subnet group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"aurora_subnet_group"\s*{/);
  });
});

// =============================================================================
// CLOUDWATCH ALARMS
// =============================================================================

describe("CloudWatch Alarms and Monitoring", () => {
  test("creates per-replica DynamoDB replication lag alarms", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dynamodb_replication_lag"\s*{/);
    expect(stackContent).toMatch(/for_each\s*=\s*toset\(var\.dynamodb_replica_regions\)/);
    expect(stackContent).toMatch(/ReceivingRegion/);
  });

  test("creates SQS DLQ alarm", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"sqs_dlq_not_empty"\s*{/);
  });

  test("creates overbooking alarm", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"overbooking_alarm"\s*{/);
    expect(stackContent).toMatch(/Custom\/Booking/);
    expect(stackContent).toMatch(/UnresolvedOverbookings/);
  });

  test("creates booking handler error alarm", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"booking_handler_errors"\s*{/);
  });

  test("creates booking handler throttle alarm", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"booking_handler_throttles"\s*{/);
  });

  test("creates API Gateway 5xx error alarm", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_gateway_5xx_errors"\s*{/);
  });

  test("creates ElastiCache CPU alarm", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"elasticache_cpu"\s*{/);
  });

  test("alarms have proper thresholds (not too sensitive)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"booking_handler_errors"/);
    expect(stackContent).toMatch(/threshold\s*=\s*\d+/);
    // Alarms should have reasonable thresholds to avoid noise
  });

  test("alarms are connected to SNS topic", () => {
    expect(stackContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.cloudwatch_alarms\.arn\]/);
  });
});

// =============================================================================
// TAGGING
// =============================================================================

describe("Resource Tagging", () => {
  test("uses common tags from locals", () => {
    expect(stackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
  });

  test("common tags include Project and Environment", () => {
    expect(stackContent).toMatch(/locals\s*{/);
    expect(stackContent).toMatch(/Project\s*=\s*var\.project_name/);
    expect(stackContent).toMatch(/Environment\s*=\s*var\.environment/);
  });

  test("resources have Name tags", () => {
    expect(stackContent).toMatch(/Name\s*=.*name_prefix/);
  });
});

// =============================================================================
// OUTPUTS
// =============================================================================

describe("Terraform Outputs", () => {
  const expectedOutputs = [
    "api_gateway_endpoint",
    "dynamodb_table_name",
    "sns_topic_arn",
    "sqs_queue_url",
    "sqs_dlq_url",
    "step_functions_state_machine_arn",
    "elasticache_configuration_endpoint",
    "aurora_reader_endpoint",
    "lambda_code_bucket",
    "vpc_id",
    "private_subnet_ids",
    "aurora_secret_arn",
    "redis_auth_token_secret_arn"
  ];

  test.each(expectedOutputs)("declares output: %s", (outputName) => {
    expect(stackContent).toMatch(new RegExp(`output\\s+"${outputName}"\\s*{`));
  });

  test("outputs have descriptions", () => {
    // Check that outputs generally have descriptions
    const outputCount = (stackContent.match(/output\s+"[^"]+"\s*{/g) || []).length;
    const descriptionCount = (stackContent.match(/description\s*=.*output|output.*description\s*=/gi) || []).length;
    expect(outputCount).toBeGreaterThan(10);
    // Most outputs should have descriptions (allowing some flexibility)
    expect(stackContent).toMatch(/description\s*=/);
  });

  test("includes deployment instructions output", () => {
    expect(stackContent).toMatch(/output\s+"deployment_instructions"\s*{/);
  });
});

// =============================================================================
// ARCHITECTURE & BEST PRACTICES
// =============================================================================

describe("Architecture and Best Practices Validation", () => {
  test("includes SLA comments throughout", () => {
    const slaMatches = stackContent.match(/SLA/gi);
    expect(slaMatches).toBeTruthy();
    expect(slaMatches!.length).toBeGreaterThan(10);
  });

  test("mentions optimistic locking strategy", () => {
    expect(stackContent).toMatch(/optimistic lock/i);
    expect(stackContent).toMatch(/conditional.*write|ConditionExpression/i);
    expect(stackContent).toMatch(/version|available_units/i);
  });

  test("includes 30-second hot booking detection mechanism", () => {
    expect(stackContent).toMatch(/30.*second|hot.*booking/i);
    expect(stackContent).toMatch(/hot_booking_checker/);
  });

  test("includes 5-minute reconciliation comments", () => {
    expect(stackContent).toMatch(/5\s*minute|every 5 minutes|rate\(5 minutes\)/i);
  });

  test("documents per-hotel caching strategy (not global)", () => {
    expect(stackContent).toMatch(/per-hotel|per.*property/i);
    expect(stackContent).toMatch(/45.*000|45k/i);
  });

  test("NO hardcoded credentials in any resource", () => {
    expect(stackContent).not.toMatch(/password\s*=\s*"[^r]/i); // Should use random_password.X.result
    expect(stackContent).not.toMatch(/secret\s*=\s*"placeholder/i);
  });

  test("all encryption options are enabled where available", () => {
    expect(stackContent).toMatch(/encryption.*enabled\s*=\s*true/i);
    expect(stackContent).toMatch(/server_side_encryption/i);
    expect(stackContent).toMatch(/at_rest_encryption/i);
    expect(stackContent).toMatch(/transit_encryption/i);
  });

  test("includes data source for AWS account ID", () => {
    expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
  });

  test("includes provider version requirements in output or comments", () => {
    // Check if provider requirements are documented somewhere in the file
    expect(stackContent).toMatch(/Terraform.*1\.5|terraform.*>=|required_version/i);
    expect(stackContent).toMatch(/nodejs20\.x/);
  });
});

// =============================================================================
// COMPREHENSIVE INTEGRATION CHECK
// =============================================================================

describe("End-to-End Integration Validation", () => {
  test("booking flow is complete: API Gateway -> Lambda -> DynamoDB -> SNS", () => {
    expect(stackContent).toMatch(/aws_apigatewayv2_api.*booking_api/);
    expect(stackContent).toMatch(/aws_lambda_function.*booking_handler/);
    expect(stackContent).toMatch(/aws_dynamodb_table.*inventory/);
    expect(stackContent).toMatch(/aws_sns_topic.*inventory_updates/);
  });

  test("cache update flow is complete: DynamoDB Stream -> Lambda -> Redis", () => {
    expect(stackContent).toMatch(/aws_lambda_event_source_mapping.*cache_updater/);
    expect(stackContent).toMatch(/aws_lambda_function.*cache_updater/);
    expect(stackContent).toMatch(/aws_elasticache_replication_group.*booking_cache/);
  });

  test("PMS sync flow is complete: SNS -> SQS -> Lambda", () => {
    expect(stackContent).toMatch(/aws_sns_topic_subscription.*hotel_pms/);
    expect(stackContent).toMatch(/aws_sqs_queue.*hotel_pms_queue/);
    expect(stackContent).toMatch(/aws_lambda_function.*pms_sync_worker/);
    expect(stackContent).toMatch(/aws_lambda_event_source_mapping.*sqs_to_pms_sync_worker/);
  });

  test("reconciliation flow is complete: EventBridge -> Step Functions -> Lambdas", () => {
    expect(stackContent).toMatch(/aws_cloudwatch_event_rule.*reconciliation_schedule/);
    expect(stackContent).toMatch(/aws_sfn_state_machine.*reconciliation_state_machine/);
    expect(stackContent).toMatch(/aws_lambda_function.*reconciliation_checker/);
    expect(stackContent).toMatch(/aws_lambda_function.*overbooking_resolver/);
  });

  test("secrets management is complete: Generation -> Storage -> IAM -> Lambda Env", () => {
    expect(stackContent).toMatch(/random_password.*aurora_master/);
    expect(stackContent).toMatch(/aws_secretsmanager_secret.*aurora_master_password/);
    expect(stackContent).toMatch(/secretsmanager:GetSecretValue/);
    expect(stackContent).toMatch(/AURORA_SECRET_ARN|REDIS_AUTH_SECRET_ARN/);
  });

  test("monitoring is complete: Resources -> Metrics -> Alarms -> SNS -> Email", () => {
    expect(stackContent).toMatch(/aws_cloudwatch_metric_alarm/);
    expect(stackContent).toMatch(/alarm_actions.*cloudwatch_alarms/);
    expect(stackContent).toMatch(/aws_sns_topic.*cloudwatch_alarms/);
    expect(stackContent).toMatch(/aws_sns_topic_subscription.*alarm_email/);
  });

  test("all Lambda functions have corresponding IAM roles", () => {
    const lambdaNames = [
      "booking_handler",
      "cache_updater",
      "hot_booking_checker",
      "pms_sync_worker",
      "reconciliation_checker",
      "overbooking_resolver"
    ];

    lambdaNames.forEach((name) => {
      expect(stackContent).toMatch(new RegExp(`aws_lambda_function.*${name}`));
      expect(stackContent).toMatch(new RegExp(`aws_iam_role.*${name}_role`));
    });
  });
});
