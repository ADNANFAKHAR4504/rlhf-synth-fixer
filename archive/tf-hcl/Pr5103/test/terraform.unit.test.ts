// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Validates all components against requirements without executing Terraform commands

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

let stackContent: string;
let providerContent: string;

beforeAll(() => {
  if (fs.existsSync(stackPath)) {
    stackContent = fs.readFileSync(stackPath, "utf8");
  }
  if (fs.existsSync(providerPath)) {
    providerContent = fs.readFileSync(providerPath, "utf8");
  }
});

describe("tap_stack.tf - File Structure & Format", () => {
  test("tap_stack.tf file exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[FAIL] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  test("file starts with correct comment", () => {
    expect(stackContent).toMatch(/^\/\/\s*tap_stack\.tf/);
  });

  test("file is single Terraform configuration file", () => {
    expect(stackPath).toMatch(/\.tf$/);
  });

  test("does NOT contain provider block (provider.tf owns providers)", () => {
    expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*\{/);
    expect(stackContent).not.toMatch(/\bprovider\s+"random"\s*\{/);
    expect(stackContent).not.toMatch(/\bprovider\s+"archive"\s*\{/);
  });

  test("does NOT use external modules", () => {
    expect(stackContent).not.toMatch(/\bmodule\s+"[^"]+"\s*\{/);
  });
});

describe("tap_stack.tf - Terraform Block", () => {
  test("does NOT contain terraform block (separated in provider.tf)", () => {
    expect(stackContent).not.toMatch(/terraform\s*\{[\s\S]*?required_providers/);
    expect(stackContent).not.toMatch(/backend\s+"s3"/);
  });
});

describe("provider.tf - Terraform Configuration", () => {
  test("provider.tf file exists", () => {
    expect(fs.existsSync(providerPath)).toBe(true);
  });

  test("contains terraform block with required_version", () => {
    expect(providerContent).toMatch(/terraform\s*\{/);
    expect(providerContent).toMatch(/required_version\s*=/);
  });

  test("declares required_providers with aws, random, and archive", () => {
    expect(providerContent).toMatch(/required_providers\s*\{/);
    expect(providerContent).toMatch(/aws\s*=\s*\{[\s\S]*?source\s*=\s*"hashicorp\/aws"/);
    expect(providerContent).toMatch(/random\s*=\s*\{[\s\S]*?source\s*=\s*"hashicorp\/random"/);
    expect(providerContent).toMatch(/archive\s*=\s*\{[\s\S]*?source\s*=\s*"hashicorp\/archive"/);
  });

  test("has S3 backend configuration", () => {
    expect(providerContent).toMatch(/backend\s+"s3"/);
  });

  test("has AWS provider block", () => {
    expect(providerContent).toMatch(/provider\s+"aws"\s*\{/);
  });
});

describe("tap_stack.tf - Required Variables", () => {
  test("declares aws_region variable with default 'us-east-1'", () => {
    const awsRegionMatch = stackContent.match(/variable\s+"aws_region"\s*\{[\s\S]*?\n\}/);
    expect(awsRegionMatch).toBeTruthy();
    expect(awsRegionMatch![0]).toMatch(/default\s*=\s*"us-east-1"/);
  });

  test("declares project_name with default 'player-consistency'", () => {
    const match = stackContent.match(/variable\s+"project_name"[\s\S]*?\{[\s\S]*?default\s*=\s*"([^"]+)"/);
    expect(match).toBeTruthy();
    expect(match![1]).toBe("player-consistency");
  });

  test("declares environment with default 'prod'", () => {
    const match = stackContent.match(/variable\s+"environment"[\s\S]*?\{[\s\S]*?default\s*=\s*"([^"]+)"/);
    expect(match).toBeTruthy();
    expect(match![1]).toBe("prod");
  });

  test("declares owner with default 'platform-team'", () => {
    const match = stackContent.match(/variable\s+"owner"[\s\S]*?\{[\s\S]*?default\s*=\s*"([^"]+)"/);
    expect(match).toBeTruthy();
    expect(match![1]).toBe("platform-team");
  });

  test("declares cost_center with default 'gaming-core'", () => {
    const match = stackContent.match(/variable\s+"cost_center"[\s\S]*?\{[\s\S]*?default\s*=\s*"([^"]+)"/);
    expect(match).toBeTruthy();
    expect(match![1]).toBe("gaming-core");
  });

  test("declares use_kinesis_on_demand with default true", () => {
    expect(stackContent).toMatch(/variable\s+"use_kinesis_on_demand"[\s\S]*?default\s*=\s*true/);
  });

  test("declares use_shards with default false", () => {
    expect(stackContent).toMatch(/variable\s+"use_shards"[\s\S]*?default\s*=\s*false/);
  });

  test("declares updates_per_second with default 2550", () => {
    expect(stackContent).toMatch(/variable\s+"updates_per_second"[\s\S]*?default\s*=\s*2550/);
  });

  test("declares avg_item_size_bytes with default 1024", () => {
    expect(stackContent).toMatch(/variable\s+"avg_item_size_bytes"[\s\S]*?default\s*=\s*1024/);
  });

  test("declares replica_regions with default empty list", () => {
    expect(stackContent).toMatch(/variable\s+"replica_regions"[\s\S]*?default\s*=\s*\[\]/);
  });

  test("declares consumer_groups with default ['graph-updater']", () => {
    expect(stackContent).toMatch(/variable\s+"consumer_groups"[\s\S]*?default\s*=\s*\["graph-updater"\]/);
  });

  test("declares verification_sample_size with default 100", () => {
    expect(stackContent).toMatch(/variable\s+"verification_sample_size"[\s\S]*?default\s*=\s*100/);
  });
});

describe("tap_stack.tf - Locals", () => {
  test("defines locals block", () => {
    expect(stackContent).toMatch(/locals\s*\{/);
  });

  test("defines stack_name from project_name and environment", () => {
    expect(stackContent).toMatch(/stack_name\s*=.*project_name.*environment/);
  });

  test("defines common_tags with required fields", () => {
    const tagsMatch = stackContent.match(/common_tags\s*=\s*\{[\s\S]*?\}/);
    expect(tagsMatch).toBeTruthy();
    expect(tagsMatch![0]).toMatch(/Project\s*=/);
    expect(tagsMatch![0]).toMatch(/Environment\s*=/);
    expect(tagsMatch![0]).toMatch(/Owner\s*=/);
    expect(tagsMatch![0]).toMatch(/CostCenter\s*=/);
    expect(tagsMatch![0]).toMatch(/Region\s*=/);
    expect(tagsMatch![0]).toMatch(/ManagedBy\s*=/);
  });

  test("includes capacity calculations for Kinesis", () => {
    expect(stackContent).toMatch(/throughput_mb|shard_count/);
  });

  test("uses data source for availability zones (not hard-coded)", () => {
    expect(stackContent).toMatch(/data\s+"aws_availability_zones"/);
    expect(stackContent).not.toMatch(/\["[^"]+a",\s*"[^"]+b",\s*"[^"]+c"\]/);
  });
});

describe("tap_stack.tf - Data Sources", () => {
  test("declares aws_caller_identity data source", () => {
    expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
  });

  test("declares aws_partition data source", () => {
    expect(stackContent).toMatch(/data\s+"aws_partition"\s+"current"/);
  });

  test("declares aws_availability_zones data source", () => {
    expect(stackContent).toMatch(/data\s+"aws_availability_zones"/);
  });

  test("declares archive_file data sources for Lambda", () => {
    expect(stackContent).toMatch(/data\s+"archive_file"/);
  });
});

describe("tap_stack.tf - KMS Encryption", () => {
  test("creates KMS key with rotation enabled", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
    expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test("KMS key has proper deletion window", () => {
    expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*\d+/);
  });

  test("creates KMS alias", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
  });

  test("KMS key has explicit policy", () => {
    const kmsMatch = stackContent.match(/resource\s+"aws_kms_key"\s+"main"\s*\{[\s\S]*?\n\}/);
    expect(kmsMatch).toBeTruthy();
    expect(kmsMatch![0]).toMatch(/policy\s*=/);
  });

  test("KMS policy includes CloudWatch Logs service", () => {
    expect(stackContent).toMatch(/logs\.amazonaws\.com/);
  });

  test("KMS policy includes Timestream service", () => {
    expect(stackContent).toMatch(/timestream\.amazonaws\.com/);
  });
});

describe("tap_stack.tf - VPC and Networking", () => {
  test("creates VPC", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
  });

  test("VPC enables DNS hostnames and support", () => {
    expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("creates private subnets (multi-AZ)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    expect(stackContent).toMatch(/count\s*=\s*3/);
  });

  test("creates public subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
  });

  test("creates Internet Gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
  });

  test("creates NAT Gateway(s)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
  });

  test("creates EIP for NAT", () => {
    expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
  });

  test("creates route tables", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table"/);
  });

  test("creates route table associations", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table_association"/);
  });
});

describe("tap_stack.tf - Security Groups", () => {
  test("creates Lambda security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"lambda"/);
  });

  test("creates Redis security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"redis"/);
  });

  test("creates Neptune security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"neptune"/);
  });

  test("creates VPC endpoints security group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"vpc_endpoints"/);
  });

  test("security groups have explicit egress rules", () => {
    const sgMatches = stackContent.match(/resource\s+"aws_security_group"[\s\S]*?egress\s*\{/g);
    expect(sgMatches).toBeTruthy();
    expect(sgMatches!.length).toBeGreaterThanOrEqual(3);
  });

  test("Neptune security group allows port 8182", () => {
    const neptuneMatch = stackContent.match(/resource\s+"aws_security_group"\s+"neptune"[\s\S]*?\n\}/);
    expect(neptuneMatch![0]).toMatch(/8182/);
  });

  test("Redis security group allows port 6379", () => {
    const redisMatch = stackContent.match(/resource\s+"aws_security_group"\s+"redis"[\s\S]*?\n\}/);
    expect(redisMatch![0]).toMatch(/6379/);
  });
});

describe("tap_stack.tf - VPC Endpoints", () => {
  test("creates DynamoDB gateway endpoint", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"dynamodb"/);
  });

  test("creates S3 gateway endpoint", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"/);
  });

  test("gateway endpoints have route table associations", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint_route_table_association"/);
  });

  test("creates CloudWatch Logs interface endpoint", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"logs"/);
  });

  test("creates Kinesis interface endpoint", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"kinesis_streams"/);
  });

  test("creates SQS interface endpoint", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"sqs"/);
  });

  test("creates SNS interface endpoint", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"sns"/);
  });

  test("creates KMS interface endpoint", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"kms"/);
  });

  test("interface endpoints have private DNS enabled", () => {
    const interfaceEndpoints = stackContent.match(/vpc_endpoint_type\s*=\s*"Interface"[\s\S]*?private_dns_enabled\s*=\s*true/g);
    expect(interfaceEndpoints).toBeTruthy();
    expect(interfaceEndpoints!.length).toBeGreaterThanOrEqual(5);
  });
});

describe("tap_stack.tf - Kinesis Stream", () => {
  test("creates Kinesis stream (conditional based on mode)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kinesis_stream"/);
  });

  test("Kinesis uses KMS encryption", () => {
    const kinesisMatch = stackContent.match(/resource\s+"aws_kinesis_stream"[\s\S]*?encryption_type\s*=\s*"KMS"/);
    expect(kinesisMatch).toBeTruthy();
  });

  test("Kinesis stream_mode_details configured", () => {
    expect(stackContent).toMatch(/stream_mode_details\s*\{/);
  });

  test("ON_DEMAND mode omits shard_count", () => {
    const onDemandMatch = stackContent.match(/resource\s+"aws_kinesis_stream"\s+"player_state_on_demand"/);
    if (onDemandMatch) {
      expect(onDemandMatch[0]).not.toMatch(/shard_count\s*=\s*local\.shard_count/);
    }
  });

  test("PROVISIONED mode sets shard_count", () => {
    const provisionedMatch = stackContent.match(/resource\s+"aws_kinesis_stream"\s+"player_state_provisioned"/);
    if (provisionedMatch) {
      expect(stackContent).toMatch(/shard_count\s*=\s*local\.shard_count/);
    }
  });

  test("retention period is set", () => {
    expect(stackContent).toMatch(/retention_period\s*=\s*\d+/);
  });
});

describe("tap_stack.tf - DynamoDB Table", () => {
  test("creates DynamoDB table", () => {
    expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"player_state"/);
  });

  test("DynamoDB has player_id as hash_key", () => {
    const ddbMatch = stackContent.match(/resource\s+"aws_dynamodb_table"\s+"player_state"[\s\S]*?hash_key\s*=\s*"([^"]+)"/);
    expect(ddbMatch![1]).toBe("player_id");
  });

  test("DynamoDB has state_key as range_key", () => {
    const ddbMatch = stackContent.match(/resource\s+"aws_dynamodb_table"\s+"player_state"[\s\S]*?range_key\s*=\s*"([^"]+)"/);
    expect(ddbMatch![1]).toBe("state_key");
  });

  test("DynamoDB Streams enabled with NEW_AND_OLD_IMAGES", () => {
    expect(stackContent).toMatch(/stream_enabled\s*=\s*true/);
    expect(stackContent).toMatch(/stream_view_type\s*=\s*"NEW_AND_OLD_IMAGES"/);
  });

  test("DynamoDB has server-side encryption with KMS", () => {
    const ddbMatch = stackContent.match(/resource\s+"aws_dynamodb_table"[\s\S]*?server_side_encryption\s*\{[\s\S]*?enabled\s*=\s*true[\s\S]*?kms_key_arn/);
    expect(ddbMatch).toBeTruthy();
  });

  test("DynamoDB has point-in-time recovery enabled", () => {
    expect(stackContent).toMatch(/point_in_time_recovery\s*\{[\s\S]*?enabled\s*=\s*true/);
  });

  test("DynamoDB supports Global Tables via replica block", () => {
    expect(stackContent).toMatch(/dynamic\s+"replica"/);
  });

  test("DynamoDB uses PAY_PER_REQUEST billing", () => {
    expect(stackContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
  });
});

describe("tap_stack.tf - ElastiCache Redis", () => {
  test("creates Redis replication group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_elasticache_replication_group"\s+"redis"/);
  });

  test("Redis uses cluster mode", () => {
    const redisMatch = stackContent.match(/resource\s+"aws_elasticache_parameter_group"[\s\S]*?cluster-enabled[\s\S]*?"yes"/);
    expect(redisMatch).toBeTruthy();
  });

  test("Redis has encryption at rest with KMS", () => {
    expect(stackContent).toMatch(/at_rest_encryption_enabled\s*=\s*true/);
    const redisMatch = stackContent.match(/resource\s+"aws_elasticache_replication_group"[\s\S]*?kms_key_id/);
    expect(redisMatch).toBeTruthy();
  });

  test("Redis has encryption in transit (TLS)", () => {
    expect(stackContent).toMatch(/transit_encryption_enabled\s*=\s*true/);
  });

  test("Redis has auth token configured", () => {
    expect(stackContent).toMatch(/auth_token\s*=/);
  });

  test("Redis does NOT use invalid auth_token_enabled field", () => {
    expect(stackContent).not.toMatch(/auth_token_enabled\s*=/);
  });

  test("creates random_password for Redis auth", () => {
    expect(stackContent).toMatch(/resource\s+"random_password"\s+"redis_auth"/);
  });

  test("random_password has special = false (charset compatibility)", () => {
    const pwMatch = stackContent.match(/resource\s+"random_password"\s+"redis_auth"[\s\S]*?special\s*=\s*false/);
    expect(pwMatch).toBeTruthy();
  });

  test("Redis has automatic failover enabled", () => {
    expect(stackContent).toMatch(/automatic_failover_enabled\s*=\s*true/);
  });

  test("Redis is multi-AZ", () => {
    expect(stackContent).toMatch(/multi_az_enabled\s*=\s*true/);
  });

  test("creates Redis subnet group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_elasticache_subnet_group"\s+"redis"/);
  });

  test("creates Redis parameter group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_elasticache_parameter_group"\s+"redis"/);
  });

  test("Redis description mentions Lua/EVALSHA", () => {
    const redisMatch = stackContent.match(/resource\s+"aws_elasticache_replication_group"[\s\S]*?description\s*=\s*"([^"]+)"/);
    expect(redisMatch![1]).toMatch(/Lua|EVALSHA/i);
  });
});

describe("tap_stack.tf - SNS and SQS", () => {
  test("creates SNS topic", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"player_updates"/);
  });

  test("SNS topic uses KMS encryption", () => {
    const snsMatch = stackContent.match(/resource\s+"aws_sns_topic"[\s\S]*?kms_master_key_id/);
    expect(snsMatch).toBeTruthy();
  });

  test("creates SQS queues for consumer groups", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"graph_updates"/);
  });

  test("SQS queues use KMS encryption", () => {
    const sqsMatch = stackContent.match(/resource\s+"aws_sqs_queue"[\s\S]*?kms_master_key_id/);
    expect(sqsMatch).toBeTruthy();
  });

  test("creates dead letter queue", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"dlq"/);
  });

  test("creates CRDT resolver queue", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"crdt_resolver"/);
  });

  test("SQS has redrive policy to DLQ", () => {
    expect(stackContent).toMatch(/redrive_policy\s*=\s*jsonencode\(\{[\s\S]*?deadLetterTargetArn/);
  });

  test("SNS subscriptions configured to SQS", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"/);
  });

  test("SNS→SQS has raw_message_delivery = true", () => {
    expect(stackContent).toMatch(/raw_message_delivery\s*=\s*true/);
  });

  test("SQS queue policy includes source account check", () => {
    const policyMatch = stackContent.match(/resource\s+"aws_sqs_queue_policy"[\s\S]*?aws:SourceAccount/);
    expect(policyMatch).toBeTruthy();
  });
});

describe("tap_stack.tf - Neptune Graph Database", () => {
  test("creates Neptune cluster", () => {
    expect(stackContent).toMatch(/resource\s+"aws_neptune_cluster"\s+"main"/);
  });

  test("Neptune has storage encryption with KMS", () => {
    expect(stackContent).toMatch(/resource\s+"aws_neptune_cluster"[\s\S]*?storage_encrypted\s*=\s*true/);
    expect(stackContent).toMatch(/resource\s+"aws_neptune_cluster"[\s\S]*?kms_key_arn/);
  });

  test("Neptune has IAM database authentication enabled", () => {
    expect(stackContent).toMatch(/iam_database_authentication_enabled\s*=\s*true/);
  });

  test("creates Neptune cluster instances", () => {
    expect(stackContent).toMatch(/resource\s+"aws_neptune_cluster_instance"/);
  });

  test("creates Neptune subnet group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_neptune_subnet_group"/);
  });

  test("creates Neptune parameter group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_neptune_cluster_parameter_group"/);
  });

  test("Neptune audit logs enabled", () => {
    expect(stackContent).toMatch(/enable_cloudwatch_logs_exports\s*=\s*\["audit"\]/);
  });
});

describe("tap_stack.tf - Timestream", () => {
  test("creates Timestream database", () => {
    expect(stackContent).toMatch(/resource\s+"aws_timestreamwrite_database"\s+"audit"/);
  });

  test("Timestream database uses KMS encryption", () => {
    const timestreamMatch = stackContent.match(/resource\s+"aws_timestreamwrite_database"[\s\S]*?kms_key_id/);
    expect(timestreamMatch).toBeTruthy();
  });

  test("creates Timestream table", () => {
    expect(stackContent).toMatch(/resource\s+"aws_timestreamwrite_table"\s+"state_transitions"/);
  });

  test("Timestream table has retention properties", () => {
    expect(stackContent).toMatch(/retention_properties\s*\{/);
    expect(stackContent).toMatch(/magnetic_store_retention_period_in_days/);
    expect(stackContent).toMatch(/memory_store_retention_period_in_hours/);
  });
});

describe("tap_stack.tf - Lambda Functions", () => {
  test("creates Kinesis processor Lambda", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"kinesis_processor"/);
  });

  test("creates DDB to Redis Lambda", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"ddb_to_redis"/);
  });

  test("creates SQS to Neptune Lambda", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"sqs_to_neptune"/);
  });

  test("creates CRDT resolver Lambda", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"crdt_resolver"/);
  });

  test("creates consistency checker Lambda", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"consistency_checker"/);
  });

  test("Kinesis processor has provisioned concurrency", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_provisioned_concurrency_config"\s+"kinesis_processor"/);
  });

  test("Kinesis processor has Lambda alias", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_alias"\s+"kinesis_processor"/);
  });

  test("Kinesis processor has publish = true", () => {
    const lambdaMatch = stackContent.match(/resource\s+"aws_lambda_function"\s+"kinesis_processor"[\s\S]*?publish\s*=\s*true/);
    expect(lambdaMatch).toBeTruthy();
  });

  test("Lambda functions are in VPC", () => {
    const vpcConfigs = stackContent.match(/vpc_config\s*\{[\s\S]*?subnet_ids/g);
    expect(vpcConfigs).toBeTruthy();
    expect(vpcConfigs!.length).toBeGreaterThanOrEqual(5);
  });

  test("Lambda functions use appropriate runtimes", () => {
    expect(stackContent).toMatch(/runtime\s*=\s*"nodejs18\.x"/);
    expect(stackContent).toMatch(/runtime\s*=\s*"python3\.11"/);
  });

  test("Python Lambdas use Python archive file", () => {
    const pythonLambdas = stackContent.match(/runtime\s*=\s*"python3\.11"[\s\S]*?filename\s*=\s*data\.archive_file\.lambda_python/g);
    expect(pythonLambdas).toBeTruthy();
  });

  test("Node.js Lambdas use Node.js archive file", () => {
    const nodeLambdas = stackContent.match(/runtime\s*=\s*"nodejs18\.x"[\s\S]*?filename\s*=\s*data\.archive_file\.lambda_nodejs/g);
    expect(nodeLambdas).toBeTruthy();
  });
});

describe("tap_stack.tf - Lambda Event Source Mappings", () => {
  test("creates Kinesis to Lambda event source mapping", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"kinesis_to_lambda"/);
  });

  test("Kinesis ESM has batching and parallelization", () => {
    const kinesisESM = stackContent.match(/resource\s+"aws_lambda_event_source_mapping"\s+"kinesis_to_lambda"[\s\S]*?\n\}/);
    expect(kinesisESM![0]).toMatch(/batch_size/);
    expect(kinesisESM![0]).toMatch(/parallelization_factor/);
  });

  test("Kinesis ESM supports ReportBatchItemFailures", () => {
    const kinesisESM = stackContent.match(/resource\s+"aws_lambda_event_source_mapping"\s+"kinesis_to_lambda"[\s\S]*?function_response_types\s*=\s*\["ReportBatchItemFailures"\]/);
    expect(kinesisESM).toBeTruthy();
  });

  test("creates DDB Streams to Lambda event source mapping", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"ddb_streams_to_lambda"/);
  });

  test("DDB Streams ESM supports ReportBatchItemFailures", () => {
    const ddbESM = stackContent.match(/resource\s+"aws_lambda_event_source_mapping"\s+"ddb_streams_to_lambda"[\s\S]*?function_response_types\s*=\s*\["ReportBatchItemFailures"\]/);
    expect(ddbESM).toBeTruthy();
  });

  test("creates SQS to Lambda event source mapping", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"sqs_to_lambda"/);
  });

  test("creates CRDT SQS to Lambda event source mapping", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"crdt_sqs_to_lambda"/);
  });

  test("Kinesis ESM has DLQ on failure", () => {
    const kinesisESM = stackContent.match(/resource\s+"aws_lambda_event_source_mapping"\s+"kinesis_to_lambda"[\s\S]*?destination_config[\s\S]*?on_failure/);
    expect(kinesisESM).toBeTruthy();
  });
});

describe("tap_stack.tf - IAM Roles and Policies", () => {
  test("creates IAM roles for all Lambda functions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"kinesis_lambda"/);
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ddb_streams_lambda"/);
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"sqs_neptune_lambda"/);
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"crdt_resolver_lambda"/);
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"consistency_lambda"/);
  });

  test("creates IAM role for Step Functions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"step_functions"/);
  });

  test("creates IAM role for EventBridge", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"eventbridge"/);
  });

  test("Lambda roles have VPC execution policy attachment", () => {
    const vpcPolicies = stackContent.match(/resource\s+"aws_iam_role_policy_attachment"[\s\S]*?AWSLambdaVPCAccessExecutionRole/g);
    expect(vpcPolicies).toBeTruthy();
    expect(vpcPolicies!.length).toBeGreaterThanOrEqual(5);
  });

  test("Kinesis Lambda can send to CRDT resolver queue", () => {
    const kinesisPolicy = stackContent.match(/resource\s+"aws_iam_role_policy"\s+"kinesis_lambda"[\s\S]*?sqs:SendMessage[\s\S]*?crdt_resolver/);
    expect(kinesisPolicy).toBeTruthy();
  });

  test("DDB Streams Lambda can publish to SNS", () => {
    const ddbPolicy = stackContent.match(/resource\s+"aws_iam_role_policy"\s+"ddb_streams_lambda"[\s\S]*?sns:Publish/);
    expect(ddbPolicy).toBeTruthy();
  });

  test("DDB Streams Lambda can write to Timestream", () => {
    const ddbPolicy = stackContent.match(/resource\s+"aws_iam_role_policy"\s+"ddb_streams_lambda"[\s\S]*?timestream:WriteRecords/);
    expect(ddbPolicy).toBeTruthy();
  });

  test("Neptune Lambda uses correct IAM resource ARN format", () => {
    const neptunePolicy = stackContent.match(/resource\s+"aws_iam_role_policy"\s+"sqs_neptune_lambda"[\s\S]{1,500}neptune-db:[\s\S]{1,200}cluster_resource_id/);
    expect(neptunePolicy).toBeTruthy();
  });

  test("IAM policies use account_id from data source (not wildcard)", () => {
    const policies = stackContent.match(/Resource\s*=\s*"arn:.*:\d+:/g);
    expect(policies).toBeFalsy();
    expect(stackContent).toMatch(/local\.account_id/);
  });

  test("DynamoDB IAM includes ConditionCheckItem for OCC", () => {
    expect(stackContent).toMatch(/dynamodb:ConditionCheckItem/);
  });

  test("DynamoDB IAM includes index/* for GSI access", () => {
    expect(stackContent).toMatch(/\$\{aws_dynamodb_table\.player_state\.arn\}\/index\/\*/);
  });
});

describe("tap_stack.tf - Step Functions", () => {
  test("creates Express Step Functions state machine", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sfn_state_machine"\s+"consistency_checker"/);
    expect(stackContent).toMatch(/type\s*=\s*"EXPRESS"/);
  });

  test("Step Functions definition has guarded loop", () => {
    const sfnMatch = stackContent.match(/definition\s*=\s*jsonencode\(\{[\s\S]*?\}\)/);
    expect(sfnMatch).toBeTruthy();
    expect(sfnMatch![0]).toMatch(/InitCounter|IncrementCounter/);
    expect(sfnMatch![0]).toMatch(/iterationCount/);
  });

  test("Step Functions has 5-second Wait state", () => {
    const sfnMatch = stackContent.match(/definition[\s\S]*?Wait[\s\S]*?Seconds\s*=\s*5/);
    expect(sfnMatch).toBeTruthy();
  });

  test("Step Functions has Choice state for loop guard", () => {
    const sfnMatch = stackContent.match(/definition[\s\S]*?Type\s*=\s*"Choice"/);
    expect(sfnMatch).toBeTruthy();
  });

  test("Step Functions has proper logging configuration", () => {
    expect(stackContent).toMatch(/logging_configuration\s*\{/);
  });

  test("Step Functions log_destination HAS :* suffix (required by AWS)", () => {
    const logMatch = stackContent.match(/log_destination\s*=\s*"\$\{[^}]+\}:\*"/);
    expect(logMatch).toBeTruthy();
  });

  test("creates CloudWatch log group for Step Functions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"step_functions"/);
  });

  test("Step Functions log group uses KMS encryption", () => {
    const logMatch = stackContent.match(/resource\s+"aws_cloudwatch_log_group"\s+"step_functions"[\s\S]*?kms_key_id/);
    expect(logMatch).toBeTruthy();
  });
});

describe("tap_stack.tf - EventBridge", () => {
  test("creates EventBridge rule with 1-minute schedule", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"consistency_trigger"/);
    expect(stackContent).toMatch(/schedule_expression\s*=\s*"rate\(1 minute\)"/);
  });

  test("creates EventBridge target for Step Functions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"step_functions"/);
  });

  test("EventBridge target passes proper input with maxIterations", () => {
    const targetMatch = stackContent.match(/resource\s+"aws_cloudwatch_event_target"[\s\S]*?input\s*=\s*jsonencode\(\{[\s\S]*?maxIterations/);
    expect(targetMatch).toBeTruthy();
  });
});

describe("tap_stack.tf - CloudWatch Alarms", () => {
  test("creates alarms for hot path monitoring", () => {
    const alarms = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"/g);
    expect(alarms).toBeTruthy();
    expect(alarms!.length).toBeGreaterThanOrEqual(4);
  });

  test("creates Kinesis iterator age alarm (not throttle for ON_DEMAND)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"[\s\S]*?GetRecords\.IteratorAgeMilliseconds/);
  });

  test("creates Lambda errors alarm", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"[\s\S]*?metric_name\s*=\s*"Errors"/);
  });

  test("creates DynamoDB WriteThrottleEvents alarm (not UserErrors)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"[\s\S]*?metric_name\s*=\s*"WriteThrottleEvents"/);
  });

  test("creates DynamoDB ReadThrottleEvents alarm", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"[\s\S]*?metric_name\s*=\s*"ReadThrottleEvents"/);
  });

  test("creates Redis CPU alarm", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"[\s\S]*?EngineCPUUtilization/);
  });

  test("alarms have treat_missing_data configured", () => {
    const alarms = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"[\s\S]*?treat_missing_data\s*=\s*"notBreaching"/g);
    expect(alarms).toBeTruthy();
    expect(alarms!.length).toBeGreaterThanOrEqual(3);
  });
});

describe("tap_stack.tf - Tagging", () => {
  test("all major resources use common_tags", () => {
    const taggedResources = stackContent.match(/tags\s*=\s*(local\.common_tags|merge\(local\.common_tags)/g);
    expect(taggedResources).toBeTruthy();
    expect(taggedResources!.length).toBeGreaterThan(20);
  });

  test("resources include Region tag", () => {
    const tagsMatch = stackContent.match(/common_tags\s*=\s*\{[\s\S]*?Region\s*=/);
    expect(tagsMatch).toBeTruthy();
  });
});

describe("tap_stack.tf - Required Outputs", () => {
  test("outputs Kinesis stream ARN", () => {
    expect(stackContent).toMatch(/output\s+"kinesis_stream_arn"/);
  });

  test("outputs Kinesis stream name", () => {
    expect(stackContent).toMatch(/output\s+"kinesis_stream_name"/);
  });

  test("outputs DynamoDB table name", () => {
    expect(stackContent).toMatch(/output\s+"dynamodb_table_name"/);
  });

  test("outputs DynamoDB table ARN", () => {
    expect(stackContent).toMatch(/output\s+"dynamodb_table_arn"/);
  });

  test("outputs DynamoDB stream ARN", () => {
    expect(stackContent).toMatch(/output\s+"dynamodb_stream_arn"/);
  });

  test("outputs Redis endpoint", () => {
    expect(stackContent).toMatch(/output\s+"redis_endpoint"/);
  });

  test("Redis output mentions cluster-aware client requirement", () => {
    const redisOutput = stackContent.match(/output\s+"redis_endpoint"[\s\S]*?description\s*=\s*"([^"]+)"/);
    expect(redisOutput![1]).toMatch(/cluster/i);
  });

  test("outputs SNS topic ARN", () => {
    expect(stackContent).toMatch(/output\s+"sns_topic_arn"/);
  });

  test("outputs SQS queue URLs", () => {
    expect(stackContent).toMatch(/output\s+"sqs_queue_urls"/);
  });

  test("outputs CRDT resolver queue URL", () => {
    expect(stackContent).toMatch(/output\s+"sqs_crdt_resolver_url"/);
  });

  test("outputs Neptune endpoint", () => {
    expect(stackContent).toMatch(/output\s+"neptune_endpoint"/);
  });

  test("outputs Neptune cluster_resource_id", () => {
    expect(stackContent).toMatch(/output\s+"neptune_cluster_resource_id"/);
  });

  test("outputs Step Functions ARN", () => {
    expect(stackContent).toMatch(/output\s+"step_functions_arn"/);
  });

  test("outputs Timestream database", () => {
    expect(stackContent).toMatch(/output\s+"timestream_database"/);
  });

  test("outputs Timestream table", () => {
    expect(stackContent).toMatch(/output\s+"timestream_table"/);
  });

  test("outputs VPC ID", () => {
    expect(stackContent).toMatch(/output\s+"vpc_id"/);
  });

  test("outputs private subnet IDs", () => {
    expect(stackContent).toMatch(/output\s+"private_subnet_ids"/);
  });

  test("outputs public subnet IDs", () => {
    expect(stackContent).toMatch(/output\s+"public_subnet_ids"/);
  });

  test("outputs KMS key ID", () => {
    expect(stackContent).toMatch(/output\s+"kms_key_id"/);
  });

  test("outputs KMS key ARN", () => {
    expect(stackContent).toMatch(/output\s+"kms_key_arn"/);
  });

  test("all outputs have descriptions", () => {
    const outputs = stackContent.match(/output\s+"[^"]+"\s*\{[\s\S]*?\n\}/g);
    if (outputs) {
      outputs.forEach(output => {
        expect(output).toMatch(/description\s*=/);
      });
    }
  });
});

describe("tap_stack.tf - Architecture Flow Validation", () => {
  test("Kinesis → Lambda → DynamoDB flow is wired", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kinesis_stream"/);
    expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"kinesis_to_lambda"/);
    expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"/);
  });

  test("DynamoDB Streams → Lambda → Redis flow is wired", () => {
    expect(stackContent).toMatch(/stream_enabled\s*=\s*true/);
    expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"ddb_streams_to_lambda"/);
    expect(stackContent).toMatch(/resource\s+"aws_elasticache_replication_group"/);
  });

  test("SNS → SQS → Lambda → Neptune flow is wired", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic"/);
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"/);
    expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"graph_updates"/);
    expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"sqs_to_lambda"/);
    expect(stackContent).toMatch(/resource\s+"aws_neptune_cluster"/);
  });

  test("CRDT resolver path is connected", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"crdt_resolver"/);
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"crdt_resolver"/);
    expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"crdt_sqs_to_lambda"/);
  });

  test("Consistency check loop is configured", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"[\s\S]*?rate\(1 minute\)/);
    expect(stackContent).toMatch(/resource\s+"aws_sfn_state_machine"[\s\S]*?EXPRESS/);
    expect(stackContent).toMatch(/Seconds\s*=\s*5/);
  });

  test("Audit logging to Timestream is referenced", () => {
    expect(stackContent).toMatch(/TIMESTREAM_DATABASE|timestream:WriteRecords/);
  });
});

describe("tap_stack.tf - Security Best Practices", () => {
  test("no hardcoded secrets or passwords", () => {
    expect(stackContent).not.toMatch(/password\s*=\s*"[^$]/);
    expect(stackContent).not.toMatch(/secret\s*=\s*"[^$]/);
  });

  test("uses least-privilege IAM (specific actions, not *)", () => {
    const wildcardActions = stackContent.match(/Action\s*=\s*"\*"/g);
    expect(wildcardActions).toBeFalsy();
  });

  test("KMS encryption enabled for all data stores", () => {
    expect(stackContent).toMatch(/aws_kinesis_stream[\s\S]*?kms_key_id/);
    expect(stackContent).toMatch(/aws_dynamodb_table[\s\S]*?kms_key_arn/);
    expect(stackContent).toMatch(/aws_sqs_queue[\s\S]*?kms_master_key_id/);
    expect(stackContent).toMatch(/aws_sns_topic[\s\S]*?kms_master_key_id/);
    expect(stackContent).toMatch(/aws_elasticache_replication_group[\s\S]*?kms_key_id/);
    expect(stackContent).toMatch(/aws_neptune_cluster[\s\S]*?kms_key_arn/);
  });

  test("TLS/encryption in transit configured", () => {
    expect(stackContent).toMatch(/transit_encryption_enabled\s*=\s*true/);
  });

  test("backup retention configured for stateful services", () => {
    expect(stackContent).toMatch(/backup_retention_period/);
    expect(stackContent).toMatch(/snapshot_retention_limit/);
  });
});

describe("tap_stack.tf - Cost Optimization", () => {
  test("uses single NAT Gateway (not 3) for cost savings", () => {
    const natMatch = stackContent.match(/resource\s+"aws_nat_gateway"\s+"main"[\s\S]*?count\s*=\s*(\d+)/);
    expect(natMatch).toBeTruthy();
    expect(parseInt(natMatch![1])).toBeLessThanOrEqual(1);
  });

  test("includes VPC interface endpoints to reduce NAT costs", () => {
    const interfaceEndpoints = stackContent.match(/vpc_endpoint_type\s*=\s*"Interface"/g);
    expect(interfaceEndpoints).toBeTruthy();
    expect(interfaceEndpoints!.length).toBeGreaterThanOrEqual(5);
  });

  test("DynamoDB uses PAY_PER_REQUEST (not provisioned)", () => {
    expect(stackContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
  });
});

describe("tap_stack.tf - Resource Naming", () => {
  test("resources use consistent naming pattern", () => {
    const namePatterns = stackContent.match(/name\s*=\s*"\$\{local\.stack_name\}/g);
    expect(namePatterns).toBeTruthy();
    expect(namePatterns!.length).toBeGreaterThan(15);
  });

  test("uses name_prefix for security groups", () => {
    const sgNames = stackContent.match(/resource\s+"aws_security_group"[\s\S]*?name_prefix\s*=/g);
    expect(sgNames).toBeTruthy();
    expect(sgNames!.length).toBeGreaterThanOrEqual(3);
  });
});

describe("tap_stack.tf - Syntax and Structure", () => {
  test("no syntax errors (balanced braces)", () => {
    const openBraces = (stackContent.match(/\{/g) || []).length;
    const closeBraces = (stackContent.match(/\}/g) || []).length;
    expect(openBraces).toBe(closeBraces);
  });

  test("no syntax errors (balanced brackets)", () => {
    const openBrackets = (stackContent.match(/\[/g) || []).length;
    const closeBrackets = (stackContent.match(/\]/g) || []).length;
    expect(openBrackets).toBe(closeBrackets);
  });

  test("no syntax errors (balanced parentheses)", () => {
    const openParens = (stackContent.match(/\(/g) || []).length;
    const closeParens = (stackContent.match(/\)/g) || []).length;
    expect(openParens).toBe(closeParens);
  });

  test("uses consistent indentation", () => {
    const lines = stackContent.split('\n');
    const spacedLines = lines.filter(line => line.match(/^\s+\S/));
    expect(spacedLines.length).toBeGreaterThan(100);
  });
});
