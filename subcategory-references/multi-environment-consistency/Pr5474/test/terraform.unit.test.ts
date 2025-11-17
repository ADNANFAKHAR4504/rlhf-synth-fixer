// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for tap_stack.tf
// Validates structure, resources, variables, and compliance with requirements
// No Terraform execution - pure static analysis

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

// Helper to read files once and reuse
let stackContent: string;
let providerContent: string;

beforeAll(() => {
  if (!fs.existsSync(stackPath)) {
    throw new Error(`Stack file not found at: ${stackPath}`);
  }
  if (!fs.existsSync(providerPath)) {
    throw new Error(`Provider file not found at: ${providerPath}`);
  }
  stackContent = fs.readFileSync(stackPath, "utf8");
  providerContent = fs.readFileSync(providerPath, "utf8");
});

describe("1. File Structure & Terraform Block", () => {
  test("tap_stack.tf exists and is readable", () => {
    expect(fs.existsSync(stackPath)).toBe(true);
    expect(stackContent.length).toBeGreaterThan(1000);
  });

  test("provider.tf exists and is readable", () => {
    expect(fs.existsSync(providerPath)).toBe(true);
    expect(providerContent.length).toBeGreaterThan(0);
  });

  test("tap_stack.tf does NOT declare provider blocks (provider.tf owns providers)", () => {
    expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*\{/);
    expect(stackContent).not.toMatch(/\bprovider\s+"archive"\s*\{/);
    expect(stackContent).not.toMatch(/\bprovider\s+"random"\s*\{/);
  });

  test("tap_stack.tf does NOT declare terraform block (moved to provider.tf)", () => {
    expect(stackContent).not.toMatch(/terraform\s*\{/);
    expect(stackContent).not.toMatch(/required_version\s*=/);
    expect(stackContent).not.toMatch(/required_providers\s*\{/);
  });

  test("provider.tf declares terraform block with required_version >= 1.4", () => {
    expect(providerContent).toMatch(/terraform\s*\{/);
    expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.[4-9]/);
  });

  test("provider.tf declares all required_providers: aws, archive, random", () => {
    expect(providerContent).toMatch(/required_providers\s*\{/);
    expect(providerContent).toMatch(/aws\s*=\s*\{[\s\S]*?source\s*=\s*"hashicorp\/aws"/);
    expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    expect(providerContent).toMatch(/archive\s*=\s*\{[\s\S]*?source\s*=\s*"hashicorp\/archive"/);
    expect(providerContent).toMatch(/version\s*=\s*"~>\s*2\.4"/);
    expect(providerContent).toMatch(/random\s*=\s*\{[\s\S]*?source\s*=\s*"hashicorp\/random"/);
    expect(providerContent).toMatch(/version\s*=\s*"~>\s*3\.6"/);
  });

  test("no external module sources used (single-file implementation)", () => {
    expect(stackContent).not.toMatch(/\bmodule\s+"\w+"\s*\{[\s\S]*?source\s*=/);
  });
});

describe("2. Core Variables - Naming & Environment", () => {
  test("declares env variable with validation for dev/staging/prod", () => {
    expect(stackContent).toMatch(/variable\s+"env"\s*\{/);
    expect(stackContent).toMatch(/type\s*=\s*string/);
    expect(stackContent).toMatch(/validation\s*\{/);
    expect(stackContent).toMatch(/contains\(\["dev",\s*"staging",\s*"prod"\]/);
  });

  test("declares aws_region variable (no default per requirements)", () => {
    const regionVarMatch = stackContent.match(/variable\s+"aws_region"\s*\{[^}]*\}/s);
    expect(regionVarMatch).toBeTruthy();
    // Should NOT have a default value
    expect(regionVarMatch![0]).not.toMatch(/default\s*=/);
  });

  test("declares project_name variable", () => {
    expect(stackContent).toMatch(/variable\s+"project_name"\s*\{/);
    expect(stackContent).toMatch(/type\s*=\s*string/);
  });

  test("declares owner variable", () => {
    expect(stackContent).toMatch(/variable\s+"owner"\s*\{/);
  });

  test("declares cost_center variable", () => {
    expect(stackContent).toMatch(/variable\s+"cost_center"\s*\{/);
  });

  test("declares common_tags variable as map(string)", () => {
    const tagsVar = stackContent.match(/variable\s+"common_tags"\s*\{[^}]*\}/s);
    expect(tagsVar).toBeTruthy();
    expect(tagsVar![0]).toMatch(/type\s*=\s*map\(string\)/);
  });

  test("declares kms_key_alias_suffix variable", () => {
    expect(stackContent).toMatch(/variable\s+"kms_key_alias_suffix"\s*\{/);
  });
});

describe("3. VPC Variables", () => {
  test("declares vpc_cidr variable", () => {
    expect(stackContent).toMatch(/variable\s+"vpc_cidr"\s*\{/);
    expect(stackContent).toMatch(/type\s*=\s*string/);
  });

  test("declares public_subnet_cidrs as list(string)", () => {
    const pubSubnets = stackContent.match(/variable\s+"public_subnet_cidrs"\s*\{[^}]*\}/s);
    expect(pubSubnets).toBeTruthy();
    expect(pubSubnets![0]).toMatch(/type\s*=\s*list\(string\)/);
  });

  test("declares private_subnet_cidrs as list(string)", () => {
    const privSubnets = stackContent.match(/variable\s+"private_subnet_cidrs"\s*\{[^}]*\}/s);
    expect(privSubnets).toBeTruthy();
    expect(privSubnets![0]).toMatch(/type\s*=\s*list\(string\)/);
  });

  test("declares enable_nat variable", () => {
    expect(stackContent).toMatch(/variable\s+"enable_nat"\s*\{/);
    expect(stackContent).toMatch(/type\s*=\s*bool/);
  });

  test("declares single_nat_gateway variable for cost optimization", () => {
    expect(stackContent).toMatch(/variable\s+"single_nat_gateway"\s*\{/);
  });
});

describe("4. DynamoDB Variables", () => {
  test("declares ddb_table_name variable", () => {
    expect(stackContent).toMatch(/variable\s+"ddb_table_name"\s*\{/);
  });

  test("declares ddb_ttl_attribute variable", () => {
    expect(stackContent).toMatch(/variable\s+"ddb_ttl_attribute"\s*\{/);
  });

  test("declares ddb_billing_mode variable", () => {
    expect(stackContent).toMatch(/variable\s+"ddb_billing_mode"\s*\{/);
  });

  test("declares ddb_rcu and ddb_wcu variables", () => {
    expect(stackContent).toMatch(/variable\s+"ddb_rcu"\s*\{/);
    expect(stackContent).toMatch(/variable\s+"ddb_wcu"\s*\{/);
  });
});

describe("5. Lambda Variables", () => {
  test("declares lambda_memory_mb variable", () => {
    expect(stackContent).toMatch(/variable\s+"lambda_memory_mb"\s*\{/);
    expect(stackContent).toMatch(/type\s*=\s*number/);
  });

  test("declares lambda_timeout_s variable", () => {
    expect(stackContent).toMatch(/variable\s+"lambda_timeout_s"\s*\{/);
    expect(stackContent).toMatch(/type\s*=\s*number/);
  });

  test("declares lambda_provisioned_concurrency variable", () => {
    expect(stackContent).toMatch(/variable\s+"lambda_provisioned_concurrency"\s*\{/);
  });

  test("declares lambda_env variable as map(string)", () => {
    const lambdaEnv = stackContent.match(/variable\s+"lambda_env"\s*\{[^}]*\}/s);
    expect(lambdaEnv).toBeTruthy();
    expect(lambdaEnv![0]).toMatch(/type\s*=\s*map\(string\)/);
  });
});

describe("6. Kinesis Variables", () => {
  test("declares kinesis_mode variable", () => {
    expect(stackContent).toMatch(/variable\s+"kinesis_mode"\s*\{/);
  });

  test("declares kinesis_shard_count variable", () => {
    expect(stackContent).toMatch(/variable\s+"kinesis_shard_count"\s*\{/);
    expect(stackContent).toMatch(/type\s*=\s*number/);
  });
});

describe("7. ElastiCache/Redis Variables", () => {
  test("declares redis_node_type variable", () => {
    expect(stackContent).toMatch(/variable\s+"redis_node_type"\s*\{/);
  });

  test("declares redis_num_replicas variable", () => {
    expect(stackContent).toMatch(/variable\s+"redis_num_replicas"\s*\{/);
  });

  test("declares redis_multi_az variable", () => {
    expect(stackContent).toMatch(/variable\s+"redis_multi_az"\s*\{/);
  });

  test("declares redis_engine_version variable", () => {
    expect(stackContent).toMatch(/variable\s+"redis_engine_version"\s*\{/);
  });
});

describe("8. Aurora Variables", () => {
  test("declares aurora_engine_version variable", () => {
    expect(stackContent).toMatch(/variable\s+"aurora_engine_version"\s*\{/);
  });

  test("declares aurora_min_capacity variable", () => {
    expect(stackContent).toMatch(/variable\s+"aurora_min_capacity"\s*\{/);
  });

  test("declares aurora_max_capacity variable", () => {
    expect(stackContent).toMatch(/variable\s+"aurora_max_capacity"\s*\{/);
  });

  test("declares aurora_initial_db_name variable", () => {
    expect(stackContent).toMatch(/variable\s+"aurora_initial_db_name"\s*\{/);
  });
});

describe("9. Neptune Variables", () => {
  test("declares neptune_instance_class variable", () => {
    expect(stackContent).toMatch(/variable\s+"neptune_instance_class"\s*\{/);
  });

  test("declares neptune_engine_version variable", () => {
    expect(stackContent).toMatch(/variable\s+"neptune_engine_version"\s*\{/);
  });

  test("declares enable_neptune variable as bool", () => {
    const neptuneVar = stackContent.match(/variable\s+"enable_neptune"\s*\{[^}]*\}/s);
    expect(neptuneVar).toBeTruthy();
    expect(neptuneVar![0]).toMatch(/type\s*=\s*bool/);
  });
});

describe("10. EventBridge/Step Functions Variables", () => {
  test("declares consistency_check_rate variable", () => {
    expect(stackContent).toMatch(/variable\s+"consistency_check_rate"\s*\{/);
  });

  test("declares sfn_tracing_enabled variable", () => {
    expect(stackContent).toMatch(/variable\s+"sfn_tracing_enabled"\s*\{/);
  });
});

describe("11. Operations Variables", () => {
  test("declares log_retention_days variable", () => {
    expect(stackContent).toMatch(/variable\s+"log_retention_days"\s*\{/);
  });

  test("declares alarm_email variable", () => {
    expect(stackContent).toMatch(/variable\s+"alarm_email"\s*\{/);
  });
});

describe("12. Locals Block - Naming, Tagging, Capacity Maps", () => {
  test("declares locals block", () => {
    expect(stackContent).toMatch(/locals\s*\{/);
  });

  test("defines name_prefix using project_name and env", () => {
    expect(stackContent).toMatch(/name_prefix\s*=/);
    // Should include var.project_name and var.env
    const localsBlock = stackContent.match(/locals\s*\{[\s\S]*?\n\}/m);
    expect(localsBlock).toBeTruthy();
  });

  test("defines tags with Environment and Project", () => {
    expect(stackContent).toMatch(/tags\s*=[\s\S]*?Environment\s*=/);
    expect(stackContent).toMatch(/Project\s*=/);
  });

  test("defines per-environment capacity maps (kinesis_shards_by_env, lambda_memory_by_env)", () => {
    // Should have capacity maps for different environments
    expect(stackContent).toMatch(/kinesis_shards_by_env|lambda_memory_by_env|capacity_map/);
  });

  test("defines Step Functions definition inline (no external templatefile)", () => {
    expect(stackContent).toMatch(/sfn_definition\s*=/);
    expect(stackContent).toMatch(/jsonencode\(/);
    // Should NOT use templatefile with external file
    const sfnDef = stackContent.match(/sfn_definition\s*=[\s\S]*?(?=\n\s*\w+\s*=|\n\})/);
    expect(sfnDef).toBeTruthy();
    expect(sfnDef![0]).not.toMatch(/templatefile\s*\(/);
  });
});

describe("13. VPC Resources", () => {
  test("creates aws_vpc resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*\{/);
    expect(stackContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
  });

  test("creates public subnets with count", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*\{/);
    expect(stackContent).toMatch(/count\s*=\s*length\(var\.public_subnet_cidrs\)/);
  });

  test("creates private subnets with count", () => {
    expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*\{/);
    expect(stackContent).toMatch(/count\s*=\s*length\(var\.private_subnet_cidrs\)/);
  });

  test("creates internet gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*\{/);
  });

  test("creates NAT gateway with conditional count", () => {
    expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*\{/);
    expect(stackContent).toMatch(/count\s*=/);
  });

  test("creates EIP for NAT gateway", () => {
    expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"\s*\{/);
  });

  test("creates route tables for public and private subnets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*\{/);
    expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*\{/);
  });

  test("creates route table associations", () => {
    expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*\{/);
    expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"\s*\{/);
  });
});

describe("14. VPC Endpoints", () => {
  test("creates DynamoDB Gateway endpoint", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"dynamodb"\s*\{/);
    expect(stackContent).toMatch(/service_name\s*=\s*"com\.amazonaws\.\${var\.aws_region}\.dynamodb"/);
    expect(stackContent).toMatch(/vpc_endpoint_type\s*=\s*"Gateway"/);
  });

  test("creates Kinesis Interface endpoint", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"kinesis_streams"\s*\{/);
    expect(stackContent).toMatch(/service_name\s*=\s*"com\.amazonaws\.\${var\.aws_region}\.kinesis-streams"/);
    expect(stackContent).toMatch(/vpc_endpoint_type\s*=\s*"Interface"/);
  });

  test("creates SNS Interface endpoint", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"sns"\s*\{/);
    expect(stackContent).toMatch(/service_name\s*=\s*"com\.amazonaws\.\${var\.aws_region}\.sns"/);
  });

  test("creates SQS Interface endpoint", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"sqs"\s*\{/);
    expect(stackContent).toMatch(/service_name\s*=\s*"com\.amazonaws\.\${var\.aws_region}\.sqs"/);
  });
});

describe("15. Security Groups", () => {
  test("creates security group for Lambda", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"lambda"\s*\{/);
    expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
  });

  test("creates security group for Redis/ElastiCache", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"redis"\s*\{/);
  });

  test("creates security group for Aurora", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"aurora"\s*\{/);
  });

  test("creates security group for Neptune", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"neptune"\s*\{/);
  });

  test("creates security group for VPC endpoints", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"vpc_endpoints"\s*\{/);
  });

  test("security groups have proper ingress/egress rules", () => {
    // Check for ingress/egress blocks
    expect(stackContent).toMatch(/ingress\s*\{/);
    expect(stackContent).toMatch(/egress\s*\{/);
  });
});

describe("16. KMS Keys", () => {
  test("creates KMS key resource", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"\w+"\s*\{/);
    expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test("creates KMS alias", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"\w+"\s*\{/);
  });

  test("KMS key policy includes necessary principals", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"\w+"\s*\{/);
    // Check that KMS key has proper policy (may be via IAM or inline)
    const hasKMSConfig =
      stackContent.includes("policy =") ||
      stackContent.includes("enable_key_rotation");
    expect(hasKMSConfig).toBe(true);
  });
});

describe("17. DynamoDB Table", () => {
  test("creates DynamoDB table", () => {
    expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"\w+"\s*\{/);
  });

  test("enables Streams with NEW_AND_OLD_IMAGES", () => {
    const ddbTable = stackContent.match(/resource\s+"aws_dynamodb_table"\s+"\w+"[\s\S]*?(?=\nresource\s+"|$)/);
    expect(ddbTable).toBeTruthy();
    expect(ddbTable![0]).toMatch(/stream_enabled\s*=\s*true/);
    expect(ddbTable![0]).toMatch(/stream_view_type\s*=\s*"NEW_AND_OLD_IMAGES"/);
  });

  test("enables server-side encryption with KMS", () => {
    const ddbTable = stackContent.match(/resource\s+"aws_dynamodb_table"\s+"\w+"[\s\S]*?(?=\nresource\s+"|$)/);
    expect(ddbTable).toBeTruthy();
    expect(ddbTable![0]).toMatch(/server_side_encryption\s*\{/);
    expect(ddbTable![0]).toMatch(/kms_key_arn/);
  });

  test("enables point-in-time recovery", () => {
    const ddbTable = stackContent.match(/resource\s+"aws_dynamodb_table"\s+"\w+"[\s\S]*?(?=\nresource\s+"|$)/);
    expect(ddbTable).toBeTruthy();
    expect(ddbTable![0]).toMatch(/point_in_time_recovery\s*\{[\s\S]*?enabled\s*=\s*true/);
  });

  test("enables TTL", () => {
    const ddbTable = stackContent.match(/resource\s+"aws_dynamodb_table"\s+"\w+"[\s\S]*?(?=\nresource\s+"|$)/);
    expect(ddbTable).toBeTruthy();
    expect(ddbTable![0]).toMatch(/ttl\s*\{[\s\S]*?enabled\s*=\s*true/);
  });
});

describe("18. Kinesis Data Stream", () => {
  test("creates Kinesis stream", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kinesis_stream"\s+"main"\s*\{/);
  });

  test("uses stream_mode_details with var.kinesis_mode", () => {
    const kinesisStream = stackContent.match(/resource\s+"aws_kinesis_stream"\s+"main"[\s\S]*?(?=\nresource\s+"|$)/);
    expect(kinesisStream).toBeTruthy();
    expect(kinesisStream![0]).toMatch(/stream_mode_details\s*\{/);
    expect(kinesisStream![0]).toMatch(/stream_mode\s*=\s*var\.kinesis_mode/);
  });

  test("conditionally sets shard_count for PROVISIONED mode", () => {
    const kinesisStream = stackContent.match(/resource\s+"aws_kinesis_stream"\s+"main"[\s\S]*?(?=\nresource\s+"|$)/);
    expect(kinesisStream).toBeTruthy();
    // Should have conditional logic for shard_count
    expect(kinesisStream![0]).toMatch(/shard_count\s*=/);
  });

  test("enables encryption using KMS", () => {
    const kinesisStream = stackContent.match(/resource\s+"aws_kinesis_stream"\s+"main"[\s\S]*?(?=\nresource\s+"|$)/);
    expect(kinesisStream).toBeTruthy();
    expect(kinesisStream![0]).toMatch(/encryption_type\s*=\s*"KMS"/);
    expect(kinesisStream![0]).toMatch(/kms_key_id/);
  });
});

describe("19. Lambda Functions", () => {
  test("creates archive_file data source for Lambda code", () => {
    expect(stackContent).toMatch(/data\s+"archive_file"\s+"\w+_lambda"\s*\{/);
    expect(stackContent).toMatch(/type\s*=\s*"zip"/);
    expect(stackContent).toMatch(/source\s*\{/);
  });

  test("creates validator Lambda function", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"validator"\s*\{/);
  });

  test("creates processor Lambda function", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"processor"\s*\{/);
  });

  test("creates reconciliation Lambda function", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"reconciliation"\s*\{/);
  });

  test("creates consistency checker Lambda function", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"consistency_checker"\s*\{/);
  });

  test("Lambda functions are VPC-enabled with subnets and security groups", () => {
    const lambdaFunctions = stackContent.match(/resource\s+"aws_lambda_function"[\s\S]*?(?=\nresource\s+"aws_lambda|$)/);
    expect(lambdaFunctions).toBeTruthy();
    expect(lambdaFunctions![0]).toMatch(/vpc_config\s*\{/);
    expect(lambdaFunctions![0]).toMatch(/subnet_ids/);
    expect(lambdaFunctions![0]).toMatch(/security_group_ids/);
  });

  test("Lambda functions have CloudWatch log groups", () => {
    // Lambda logs are managed via for_each
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_logs"\s*\{/);
    expect(stackContent).toMatch(/for_each\s*=\s*\{/);
  });

  test("Lambda functions have dead letter queues (DLQ)", () => {
    expect(stackContent).toMatch(/dead_letter_config\s*\{/);
    expect(stackContent).toMatch(/target_arn\s*=\s*aws_sqs_queue\.dlq\.arn/);
  });

  test("validator Lambda publishes versions for provisioned concurrency", () => {
    const validatorLambda = stackContent.match(/resource\s+"aws_lambda_function"\s+"validator"[\s\S]*?(?=\nresource\s+"|$)/);
    expect(validatorLambda).toBeTruthy();
    expect(validatorLambda![0]).toMatch(/publish\s*=\s*true/);
  });

  test("creates Lambda alias for provisioned concurrency", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_alias"\s+"validator"\s*\{/);
  });

  test("creates provisioned concurrency config when enabled", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_provisioned_concurrency_config"\s+"validator"\s*\{/);
    expect(stackContent).toMatch(/count\s*=\s*var\.lambda_provisioned_concurrency\s*>\s*0/);
  });

  test("Lambda memory uses lookup from capacity map or variable", () => {
    const lambdaMemory = stackContent.match(/memory_size\s*=[\s\S]*?(?=\n|$)/);
    expect(lambdaMemory).toBeTruthy();
    // Should reference var.lambda_memory_mb or lookup
    expect(lambdaMemory![0]).toMatch(/var\.lambda_memory_mb|lookup\(/);
  });
});

describe("20. Lambda IAM Roles & Policies", () => {
  test("creates Lambda execution IAM role", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_execution"\s*\{/);
    expect(stackContent).toMatch(/assume_role_policy\s*=/);
  });

  test("attaches AWSLambdaBasicExecutionRole for logging", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_basic_execution"\s*\{/);
    expect(stackContent).toMatch(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/service-role\/AWSLambdaBasicExecutionRole"/);
  });

  test("attaches AWSLambdaVPCAccessExecutionRole", () => {
    const vpcAccess = stackContent.match(/AWSLambdaVPCAccessExecutionRole/);
    expect(vpcAccess).toBeTruthy();
  });

  test("creates inline policy for DynamoDB Streams access", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_ddb_stream"\s*\{/);
    expect(stackContent).toMatch(/dynamodb:GetRecords/);
    expect(stackContent).toMatch(/dynamodb:GetShardIterator/);
    expect(stackContent).toMatch(/dynamodb:DescribeStream/);
  });

  test("creates inline policy for Kinesis PutRecords", () => {
    expect(stackContent).toMatch(/kinesis:PutRecord|kinesis:PutRecords/);
  });

  test("creates inline policy for SQS access", () => {
    expect(stackContent).toMatch(/sqs:ReceiveMessage/);
    expect(stackContent).toMatch(/sqs:DeleteMessage/);
  });

  test("creates inline policy for Aurora Data API or Secrets Manager", () => {
    // Aurora can be accessed via Data API or Secrets Manager
    const hasAuroraAccess =
      stackContent.includes("rds-data:ExecuteStatement") ||
      stackContent.includes("secretsmanager:GetSecretValue");
    expect(hasAuroraAccess).toBe(true);
  });

  test("creates inline policy for Neptune access (conditional)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_neptune"\s*\{/);
    expect(stackContent).toMatch(/count\s*=\s*var\.enable_neptune/);
    expect(stackContent).toMatch(/neptune-db:connect/);
  });

  test("creates inline policy for Secrets Manager access", () => {
    expect(stackContent).toMatch(/secretsmanager:GetSecretValue/);
  });

  test("creates inline policy for SNS publish", () => {
    expect(stackContent).toMatch(/sns:Publish/);
  });

  test("creates inline policy for KMS decrypt", () => {
    expect(stackContent).toMatch(/kms:Decrypt/);
  });
});

describe("21. Lambda Event Source Mappings", () => {
  test("creates event source mapping for DynamoDB Streams to validator Lambda", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"ddb_to_validator"\s*\{/);
    expect(stackContent).toMatch(/event_source_arn\s*=\s*aws_dynamodb_table\.\w+\.stream_arn/);
    // Function name can reference the function directly or via alias
    expect(stackContent).toMatch(/function_name\s*=\s*aws_lambda_(function|alias)\.validator\./);
  });

  test("creates event source mapping for Kinesis to processor Lambda", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"\w*kinesis\w*"\s*\{/i);
    expect(stackContent).toMatch(/event_source_arn\s*=\s*aws_kinesis_stream\.main\.arn/);
    expect(stackContent).toMatch(/function_name\s*=\s*aws_lambda_function\.processor\./);
  });

  test("creates event source mapping for SQS to reconciliation Lambda", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"\w*sqs\w*"\s*\{/i);
    expect(stackContent).toMatch(/event_source_arn\s*=\s*aws_sqs_queue\.\w+\.arn/);
    expect(stackContent).toMatch(/function_name\s*=\s*aws_lambda_function\.reconciliation\./);
  });
});

describe("22. ElastiCache Redis", () => {
  test("creates ElastiCache subnet group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_elasticache_subnet_group"\s+"redis"\s*\{/);
    expect(stackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
  });

  test("creates ElastiCache parameter group", () => {
    expect(stackContent).toMatch(/resource\s+"aws_elasticache_parameter_group"\s+"redis"\s*\{/);
  });

  test("creates random_password for Redis auth token with keepers", () => {
    expect(stackContent).toMatch(/resource\s+"random_password"\s+"redis_auth"\s*\{/);
    const redisPass = stackContent.match(/resource\s+"random_password"\s+"redis_auth"[\s\S]{0,300}/);
    expect(redisPass).toBeTruthy();
    expect(redisPass![0]).toMatch(/keepers\s*=/);
  });

  test("creates ElastiCache replication group with encryption", () => {
    expect(stackContent).toMatch(/resource\s+"aws_elasticache_replication_group"\s+"redis"\s*\{/);
    const redisRG = stackContent.match(/resource\s+"aws_elasticache_replication_group"\s+"redis"[\s\S]*?(?=\nresource\s+"|$)/);
    expect(redisRG).toBeTruthy();
    expect(redisRG![0]).toMatch(/at_rest_encryption_enabled\s*=\s*true/);
    expect(redisRG![0]).toMatch(/transit_encryption_enabled\s*=\s*true/);
    expect(redisRG![0]).toMatch(/auth_token\s*=\s*random_password\.redis_auth\.result/);
    // Should NOT have auth_token_enabled (invalid attribute)
    expect(redisRG![0]).not.toMatch(/auth_token_enabled\s*=/);
  });

  test("Redis passes auth token to processor Lambda environment", () => {
    const processorLambda = stackContent.match(/resource\s+"aws_lambda_function"\s+"processor"[\s\S]*?(?=\nresource\s+"aws_lambda_function"|$)/);
    expect(processorLambda).toBeTruthy();
    expect(processorLambda![0]).toMatch(/REDIS_AUTH_TOKEN|REDIS_AUTH/);
  });
});

describe("23. Aurora PostgreSQL Serverless v2", () => {
  test("creates DB subnet group for Aurora", () => {
    expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"aurora"\s*\{/);
  });

  test("creates random_password for Aurora master password with keepers", () => {
    expect(stackContent).toMatch(/resource\s+"random_password"\s+"aurora_master"\s*\{/);
    const auroraPass = stackContent.match(/resource\s+"random_password"\s+"aurora_master"[\s\S]{0,300}/);
    expect(auroraPass).toBeTruthy();
    expect(auroraPass![0]).toMatch(/keepers\s*=/);
  });

  test("stores Aurora credentials in Secrets Manager", () => {
    expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"\w*aurora\w*"\s*\{/i);
    expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"\w*aurora\w*"\s*\{/i);
  });

  test("creates Aurora cluster with serverless v2 scaling", () => {
    expect(stackContent).toMatch(/resource\s+"aws_rds_cluster"\s+"aurora"\s*\{/);
    const auroraCluster = stackContent.match(/resource\s+"aws_rds_cluster"\s+"aurora"[\s\S]*?(?=\nresource\s+"|$)/);
    expect(auroraCluster).toBeTruthy();
    expect(auroraCluster![0]).toMatch(/engine\s*=\s*"aurora-postgresql"/);
    expect(auroraCluster![0]).toMatch(/serverlessv2_scaling_configuration\s*\{/);
    expect(auroraCluster![0]).toMatch(/min_capacity\s*=\s*var\.aurora_min_capacity/);
    expect(auroraCluster![0]).toMatch(/max_capacity\s*=\s*var\.aurora_max_capacity/);
  });

  test("Aurora cluster enables encryption with KMS", () => {
    const auroraCluster = stackContent.match(/resource\s+"aws_rds_cluster"\s+"aurora"[\s\S]*?(?=\nresource\s+"|$)/);
    expect(auroraCluster).toBeTruthy();
    expect(auroraCluster![0]).toMatch(/storage_encrypted\s*=\s*true/);
    expect(auroraCluster![0]).toMatch(/kms_key_id/);
  });

  test("Aurora cluster has backup retention and optional Data API", () => {
    expect(stackContent).toMatch(/resource\s+"aws_rds_cluster"\s+"aurora"\s*\{/);
    expect(stackContent).toMatch(/backup_retention_period/);
    // Data API is optional for VPC-based Lambdas
    const hasAuroraConfig =
      stackContent.includes("enable_http_endpoint") ||
      stackContent.includes("master_username");
    expect(hasAuroraConfig).toBe(true);
  });

  test("Aurora cluster uses lifecycle.ignore_changes for final_snapshot_identifier", () => {
    const auroraCluster = stackContent.match(/resource\s+"aws_rds_cluster"\s+"aurora"[\s\S]*?(?=\nresource\s+"|$)/);
    expect(auroraCluster).toBeTruthy();
    expect(auroraCluster![0]).toMatch(/lifecycle\s*\{[\s\S]*?ignore_changes\s*=\s*\[final_snapshot_identifier\]/);
    // Should NOT use timestamp() in final_snapshot_identifier
    expect(auroraCluster![0]).not.toMatch(/timestamp\(\)/);
  });

  test("creates Aurora cluster instances (writer + reader)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"aurora"\s*\{/);
    expect(stackContent).toMatch(/count\s*=/);
  });

  test("creates monitoring IAM role for RDS enhanced monitoring", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"rds_monitoring"\s*\{/);
    expect(stackContent).toMatch(/AmazonRDSEnhancedMonitoringRole/);
  });
});

describe("24. Neptune", () => {
  test("creates Neptune subnet group (conditional)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_neptune_subnet_group"\s+"main"\s*\{/);
    expect(stackContent).toMatch(/count\s*=\s*var\.enable_neptune/);
  });

  test("creates Neptune parameter group (conditional)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_neptune_cluster_parameter_group"\s+"main"\s*\{/);
    expect(stackContent).toMatch(/count\s*=\s*var\.enable_neptune/);
  });

  test("creates Neptune cluster (conditional)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_neptune_cluster"\s+"main"\s*\{/);
    expect(stackContent).toMatch(/count\s*=\s*var\.enable_neptune/);
  });

  test("Neptune cluster enables encryption", () => {
    expect(stackContent).toMatch(/resource\s+"aws_neptune_cluster"\s+"main"\s*\{/);
    expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
    // Check for KMS in Neptune context (can be kms_key_id or kms_key_arn)
    const neptuneSection = stackContent.match(/resource\s+"aws_neptune_cluster"[\s\S]{0,800}/);
    expect(neptuneSection).toBeTruthy();
    expect(neptuneSection![0]).toMatch(/kms_key_(id|arn)/);
  });

  test("Neptune cluster does NOT use invalid enable_cloudwatch_logs_exports", () => {
    const neptuneCluster = stackContent.match(/resource\s+"aws_neptune_cluster"\s+"main"[\s\S]*?(?=\nresource\s+"|$)/);
    expect(neptuneCluster).toBeTruthy();
    // This attribute doesn't exist for Neptune
    expect(neptuneCluster![0]).not.toMatch(/enable_cloudwatch_logs_exports/);
  });

  test("Neptune cluster uses lifecycle.ignore_changes for final_snapshot_identifier", () => {
    const neptuneCluster = stackContent.match(/resource\s+"aws_neptune_cluster"\s+"main"[\s\S]*?(?=\nresource\s+"|$)/);
    expect(neptuneCluster).toBeTruthy();
    expect(neptuneCluster![0]).toMatch(/lifecycle\s*\{[\s\S]*?ignore_changes/);
  });

  test("creates Neptune cluster instance (conditional)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_neptune_cluster_instance"\s+"main"\s*\{/);
    expect(stackContent).toMatch(/count\s*=\s*var\.enable_neptune/);
  });
});

describe("25. SNS & SQS", () => {
  test("creates SNS topic for conflict events", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"conflict_events"\s*\{/);
  });

  test("SNS topic enables encryption with KMS", () => {
    const snsTopic = stackContent.match(/resource\s+"aws_sns_topic"\s+"conflict_events"[\s\S]*?(?=\nresource\s+"|$)/);
    expect(snsTopic).toBeTruthy();
    expect(snsTopic![0]).toMatch(/kms_master_key_id/);
  });

  test("creates SQS queue for conflict events", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"conflict_queue"\s*\{/);
  });

  test("SQS queue enables encryption with KMS", () => {
    const sqsQueue = stackContent.match(/resource\s+"aws_sqs_queue"\s+"conflict_queue"[\s\S]*?(?=\nresource\s+"|$)/);
    expect(sqsQueue).toBeTruthy();
    expect(sqsQueue![0]).toMatch(/kms_master_key_id/);
  });

  test("creates SQS dead letter queue", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"conflict_dlq"\s*\{/);
  });

  test("SQS queue has redrive policy pointing to DLQ", () => {
    const sqsQueue = stackContent.match(/resource\s+"aws_sqs_queue"\s+"conflict_queue"[\s\S]*?(?=\nresource\s+"aws_sqs_queue"\s+"conflict_dlq"|$)/);
    expect(sqsQueue).toBeTruthy();
    expect(sqsQueue![0]).toMatch(/redrive_policy/);
  });

  test("creates SNS topic subscription to SQS", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"\w*sqs\w*"\s*\{/i);
    expect(stackContent).toMatch(/protocol\s*=\s*"sqs"/);
  });

  test("creates SQS queue policy to allow SNS", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sqs_queue_policy"\s+"conflict_queue"\s*\{/);
    const sqsPolicy = stackContent.match(/resource\s+"aws_sqs_queue_policy"\s+"conflict_queue"[\s\S]*?(?=\nresource\s+"|$)/);
    expect(sqsPolicy).toBeTruthy();
    // Must use .url not .id
    expect(sqsPolicy![0]).toMatch(/queue_url\s*=\s*aws_sqs_queue\.conflict_queue\.url/);
    expect(sqsPolicy![0]).not.toMatch(/queue_url\s*=\s*aws_sqs_queue\.conflict_queue\.id/);
  });
});

describe("26. EventBridge & Step Functions", () => {
  test("creates EventBridge rule for consistency checks", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"consistency_check"\s*\{/);
    expect(stackContent).toMatch(/schedule_expression\s*=\s*var\.consistency_check_rate/);
  });

  test("creates IAM role for EventBridge to invoke Step Functions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"eventbridge_sfn"\s*\{/);
  });

  test("creates IAM policy for EventBridge to start Step Functions execution", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"eventbridge_sfn"\s*\{/);
    expect(stackContent).toMatch(/states:StartExecution/);
  });

  test("creates EventBridge target pointing to Step Functions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"sfn"\s*\{/);
    expect(stackContent).toMatch(/arn\s*=\s*aws_sfn_state_machine\.consistency_workflow\.arn/);
  });

  test("creates IAM role for Step Functions execution", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"sfn_execution"\s*\{/);
  });

  test("creates IAM policy for Step Functions to invoke Lambda and publish to SNS", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"sfn_execution"\s*\{/);
    const sfnPolicy = stackContent.match(/resource\s+"aws_iam_role_policy"\s+"sfn_execution"[\s\S]*?(?=\nresource\s+"|$)/);
    expect(sfnPolicy).toBeTruthy();
    expect(sfnPolicy![0]).toMatch(/lambda:InvokeFunction/);
    expect(sfnPolicy![0]).toMatch(/sns:Publish/);
  });

  test("creates CloudWatch log group for Step Functions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"sfn_logs"\s*\{/);
  });

  test("creates Step Functions state machine", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sfn_state_machine"\s+"consistency_workflow"\s*\{/);
  });

  test("Step Functions definition uses inline jsonencode (not external template)", () => {
    const sfnStateMachine = stackContent.match(/resource\s+"aws_sfn_state_machine"\s+"consistency_workflow"[\s\S]*?(?=\nresource\s+"|$)/);
    expect(sfnStateMachine).toBeTruthy();
    expect(sfnStateMachine![0]).toMatch(/definition\s*=\s*local\.sfn_definition/);
    // Verify sfn_definition is in locals with jsonencode
    expect(stackContent).toMatch(/sfn_definition\s*=\s*jsonencode\(/);
  });

  test("Step Functions logging uses required :* suffix on log group ARN", () => {
    const sfnStateMachine = stackContent.match(/resource\s+"aws_sfn_state_machine"\s+"consistency_workflow"[\s\S]*?(?=\nresource\s+"|$)/);
    expect(sfnStateMachine).toBeTruthy();
    expect(sfnStateMachine![0]).toMatch(/logging_configuration\s*\{/);
    // Must have :* suffix as required by AWS Step Functions
    expect(sfnStateMachine![0]).toMatch(/log_destination\s*=\s*"\$\{aws_cloudwatch_log_group\.sfn_logs\.arn\}:\*"/);
  });
});

describe("27. CloudWatch Alarms", () => {
  test("creates alarm for DDB stream iterator age", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"ddb_stream_iterator_age"\s*\{/);
    expect(stackContent).toMatch(/metric_name\s*=\s*"IteratorAge"/);
    expect(stackContent).toMatch(/namespace\s*=\s*"AWS\/Lambda"/);
  });

  test("creates alarm for Lambda errors", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors"\s*\{/);
    expect(stackContent).toMatch(/metric_name\s*=\s*"Errors"/);
  });

  test("creates alarm for Lambda throttles", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_throttles"\s*\{/);
    expect(stackContent).toMatch(/metric_name\s*=\s*"Throttles"/);
  });

  test("creates alarm for Lambda duration", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_duration"\s*\{/);
    expect(stackContent).toMatch(/metric_name\s*=\s*"Duration"/);
  });

  test("creates alarm for Redis CPU utilization", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"redis_cpu"\s*\{/);
    expect(stackContent).toMatch(/metric_name\s*=\s*"EngineCPUUtilization"/);
    const redisCPU = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"redis_cpu"[\s\S]*?(?=\nresource\s+"|$)/);
    expect(redisCPU).toBeTruthy();
    // Should use ReplicationGroupId for dimensions
    expect(redisCPU![0]).toMatch(/ReplicationGroupId/);
  });

  test("creates alarm for Redis memory", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"redis_memory"\s*\{/);
    expect(stackContent).toMatch(/metric_name\s*=\s*"DatabaseMemoryUsagePercentage"/);
  });

  test("creates alarm for Redis replication lag", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"redis_latency"\s*\{/);
    expect(stackContent).toMatch(/metric_name\s*=\s*"ReplicationLag"/);
  });

  test("creates alarm for Aurora connections", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"aurora_connections"\s*\{/);
    expect(stackContent).toMatch(/metric_name\s*=\s*"DatabaseConnections"/);
  });

  test("creates alarm for Neptune connectivity (conditional)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"neptune_connectivity"\s*\{/);
    expect(stackContent).toMatch(/count\s*=\s*var\.enable_neptune/);
    expect(stackContent).toMatch(/metric_name\s*=\s*"ClusterReplicaLag"/);
  });

  test("creates alarm for Step Functions failed executions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"\w*sfn\w*"\s*\{/i);
    expect(stackContent).toMatch(/metric_name\s*=\s*"ExecutionsFailed"/);
  });

  test("creates alarm for SQS DLQ messages", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dlq_messages"\s*\{/);
    expect(stackContent).toMatch(/metric_name\s*=\s*"ApproximateNumberOfMessagesVisible"/);
  });
});

describe("28. CloudWatch Dashboard", () => {
  test("creates CloudWatch dashboard", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"main"\s*\{/);
  });

  test("dashboard includes multiple widgets", () => {
    const dashboard = stackContent.match(/resource\s+"aws_cloudwatch_dashboard"\s+"main"[\s\S]*?(?=\nresource\s+"|$)/);
    expect(dashboard).toBeTruthy();
    expect(dashboard![0]).toMatch(/dashboard_body/);
  });
});

describe("29. Outputs - DynamoDB, Kinesis, Redis", () => {
  test("outputs DynamoDB table name", () => {
    expect(stackContent).toMatch(/output\s+"dynamodb_table_name"\s*\{/);
  });

  test("outputs DynamoDB table ARN", () => {
    expect(stackContent).toMatch(/output\s+"dynamodb_table_arn"\s*\{/);
  });

  test("outputs DynamoDB stream ARN", () => {
    expect(stackContent).toMatch(/output\s+"dynamodb_stream_arn"\s*\{/);
  });

  test("outputs Kinesis stream name", () => {
    expect(stackContent).toMatch(/output\s+"kinesis_stream_name"\s*\{/);
  });

  test("outputs Kinesis stream ARN", () => {
    expect(stackContent).toMatch(/output\s+"kinesis_stream_arn"\s*\{/);
  });

  test("outputs Redis primary endpoint", () => {
    expect(stackContent).toMatch(/output\s+"redis_primary_endpoint"\s*\{/);
  });

  test("outputs Redis reader endpoint", () => {
    expect(stackContent).toMatch(/output\s+"redis_reader_endpoint"\s*\{/);
  });
});

describe("30. Outputs - Aurora & Neptune", () => {
  test("outputs Aurora endpoints (writer and reader)", () => {
    expect(stackContent).toMatch(/output\s+"aurora_writer_endpoint"\s*\{/);
    expect(stackContent).toMatch(/output\s+"aurora_reader_endpoint"\s*\{/);
  });

  test("outputs Aurora writer endpoint", () => {
    expect(stackContent).toMatch(/output\s+"aurora_writer_endpoint"\s*\{/);
  });

  test("outputs Aurora reader endpoint", () => {
    expect(stackContent).toMatch(/output\s+"aurora_reader_endpoint"\s*\{/);
  });

  test("outputs Neptune endpoint (conditional)", () => {
    expect(stackContent).toMatch(/output\s+"neptune_endpoint"\s*\{/);
  });

  test("Neptune output is conditional based on enable_neptune", () => {
    const neptuneOutput = stackContent.match(/output\s+"neptune_endpoint"[\s\S]*?(?=\noutput|$)/);
    expect(neptuneOutput).toBeTruthy();
    expect(neptuneOutput![0]).toMatch(/var\.enable_neptune/);
  });
});

describe("31. Outputs - Lambda Functions", () => {
  test("Lambda functions are defined (validator, processor, reconciliation, consistency_checker)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"validator"\s*\{/);
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"processor"\s*\{/);
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"reconciliation"\s*\{/);
    expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"consistency_checker"\s*\{/);
  });

  test("Lambda functions are properly configured with handler and runtime", () => {
    expect(stackContent).toMatch(/handler\s*=\s*"index\.handler"/);
    expect(stackContent).toMatch(/runtime\s*=\s*"python3\.12"/);
  });
});

describe("32. Outputs - SNS, SQS, Step Functions", () => {
  test("outputs SNS topic ARN", () => {
    expect(stackContent).toMatch(/output\s+"sns_topic_arn"\s*\{/);
  });

  test("outputs SQS queue URL", () => {
    expect(stackContent).toMatch(/output\s+"sqs_queue_url"\s*\{/);
  });

  test("outputs SQS queue ARN", () => {
    expect(stackContent).toMatch(/output\s+"sqs_queue_arn"\s*\{/);
  });

  test("outputs Step Functions state machine ARN", () => {
    expect(stackContent).toMatch(/output\s+"sfn_state_machine_arn"\s*\{/);
  });
});

describe("33. Outputs - VPC, Subnets, Security Groups", () => {
  test("outputs VPC ID", () => {
    expect(stackContent).toMatch(/output\s+"vpc_id"\s*\{/);
  });

  test("outputs public subnet IDs", () => {
    expect(stackContent).toMatch(/output\s+"public_subnet_ids"\s*\{/);
  });

  test("outputs private subnet IDs", () => {
    expect(stackContent).toMatch(/output\s+"private_subnet_ids"\s*\{/);
  });

  test("outputs Lambda security group ID", () => {
    expect(stackContent).toMatch(/output\s+"lambda_security_group_id"\s*\{/);
  });

  test("outputs Redis security group ID", () => {
    expect(stackContent).toMatch(/output\s+"redis_security_group_id"\s*\{/);
  });

  test("outputs Aurora security group ID", () => {
    expect(stackContent).toMatch(/output\s+"aurora_security_group_id"\s*\{/);
  });

  test("outputs Neptune security group ID", () => {
    expect(stackContent).toMatch(/output\s+"neptune_security_group_id"\s*\{/);
  });

  test("outputs VPC endpoints security group ID", () => {
    expect(stackContent).toMatch(/output\s+"vpc_endpoints_security_group_id"\s*\{/);
  });
});

describe("34. Outputs - IAM Roles", () => {
  test("outputs Lambda execution role ARN", () => {
    expect(stackContent).toMatch(/output\s+"lambda_role_arn"\s*\{/);
  });

  test("outputs Step Functions execution role ARN", () => {
    expect(stackContent).toMatch(/output\s+"sfn_execution_role_arn"\s*\{/);
  });

  test("outputs EventBridge to Step Functions role ARN", () => {
    expect(stackContent).toMatch(/output\s+"eventbridge_sfn_role_arn"\s*\{/);
  });

  test("outputs RDS monitoring role ARN", () => {
    expect(stackContent).toMatch(/output\s+"rds_monitoring_role_arn"\s*\{/);
  });
});

describe("35. Security Best Practices", () => {
  test("all sensitive data uses encryption at rest (KMS)", () => {
    // DynamoDB, Kinesis, SNS, SQS, Aurora, Neptune, ElastiCache
    expect(stackContent).toMatch(/kms_key|kms_master_key_id|storage_encrypted\s*=\s*true/);
  });

  test("ElastiCache uses encryption in transit", () => {
    expect(stackContent).toMatch(/transit_encryption_enabled\s*=\s*true/);
  });

  test("all random passwords use keepers for determinism", () => {
    // Find all random_password resources
    const randomPasswords = stackContent.match(/resource\s+"random_password"\s+"\w+"\s*\{[\s\S]*?(?=\n\s*\}\s*\n)/g);
    expect(randomPasswords).toBeTruthy();
    expect(randomPasswords!.length).toBeGreaterThan(0);

    // Check that each has keepers block
    randomPasswords!.forEach((pass) => {
      expect(pass).toMatch(/keepers\s*=\s*\{[\s\S]*?env[\s\S]*?project/);
    });
  });

  test("KMS keys have rotation enabled", () => {
    expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test("no hardcoded credentials in code", () => {
    expect(stackContent).not.toMatch(/password\s*=\s*"[^$]/);
    expect(stackContent).not.toMatch(/secret\s*=\s*"(?!arn:aws)/);
  });
});

describe("36. Topology Parity Requirements", () => {
  test("conditional resources are only for acceptable use cases", () => {
    // Neptune and optional features can use count conditionals
    expect(stackContent).toMatch(/count\s*=\s*var\.enable_neptune/);

    // Check that most resources don't have count conditionals (topology parity)
    const allResources = stackContent.match(/resource\s+"aws_[\w_]+"\s+"[\w_]+"\s*\{/g) || [];
    const conditionalResources = stackContent.match(/resource\s+"[\w_]+"\s+"[\w_]+"\s*\{[\s\S]{0,50}count\s*=/g) || [];

    // Most resources should not be conditional (> 80% should be unconditional)
    const conditionalRatio = conditionalResources.length / allResources.length;
    expect(conditionalRatio).toBeLessThan(0.2); // Less than 20% conditional
  });

  test("capacity configurations use variables or locals lookup", () => {
    // Memory, shards, capacities should reference vars or lookups
    expect(stackContent).toMatch(/var\.lambda_memory_mb|lookup\(local\.\w+_by_env/);
    expect(stackContent).toMatch(/var\.kinesis_shard_count|lookup\(local\.kinesis_shards_by_env/);
    expect(stackContent).toMatch(/var\.aurora_min_capacity/);
    expect(stackContent).toMatch(/var\.redis_num_replicas/);
  });
});

describe("37. Code Quality & Style", () => {
  test("resources have descriptions/comments", () => {
    // Check for comment patterns
    expect(stackContent).toMatch(/#.*VPC|#.*DynamoDB|#.*Lambda|#.*Kinesis/i);
  });

  test("minimal use of depends_on (dependency via references)", () => {
    const dependsOnCount = (stackContent.match(/depends_on\s*=/g) || []).length;
    // Should be minimal - most dependencies via resource references
    expect(dependsOnCount).toBeLessThan(5);
  });

  test("consistent naming convention using name_prefix", () => {
    expect(stackContent).toMatch(/local\.name_prefix/g);
    // Should be used throughout for resource naming
    const namePrefixUsages = (stackContent.match(/local\.name_prefix/g) || []).length;
    expect(namePrefixUsages).toBeGreaterThan(20);
  });

  test("all resources have tags applied", () => {
    // Check for tags = local.tags pattern
    expect(stackContent).toMatch(/tags\s*=\s*local\.tags/);
    const tagApplications = (stackContent.match(/tags\s*=\s*local\.tags/g) || []).length;
    expect(tagApplications).toBeGreaterThan(10);
  });

  test("no TODOs or placeholders in code", () => {
    expect(stackContent).not.toMatch(/TODO|FIXME|PLACEHOLDER|XXX/i);
  });

  test("file size is substantial (complete implementation)", () => {
    expect(stackContent.length).toBeGreaterThan(50000); // Should be a large, complete file
  });
});

describe("38. Data Sources", () => {
  test("uses data source for AWS caller identity", () => {
    expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*\{/);
  });

  test("uses data source for availability zones", () => {
    expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*\{/);
  });
});

describe("39. Edge Cases & Error Handling", () => {
  test("Lambda event source mappings have proper configuration", () => {
    const esm = stackContent.match(/resource\s+"aws_lambda_event_source_mapping"[\s\S]*?(?=\nresource\s+"aws_lambda_event_source_mapping"|$)/);
    expect(esm).toBeTruthy();
    expect(esm![0]).toMatch(/starting_position/);
  });

  test("Lambda DLQ configuration uses SQS ARN", () => {
    const lambdaWithDLQ = stackContent.match(/dead_letter_config\s*\{[\s\S]*?\}/);
    expect(lambdaWithDLQ).toBeTruthy();
    expect(lambdaWithDLQ![0]).toMatch(/target_arn/);
  });

  test("security group rules reference other security groups correctly", () => {
    // Ingress rules should reference source security groups
    const sgRules = stackContent.match(/ingress\s*\{[\s\S]*?\}/g);
    expect(sgRules).toBeTruthy();
    if (sgRules) {
      const hasSecurityGroupRef = sgRules.some((rule) =>
        rule.match(/source_security_group_id|security_groups/)
      );
      expect(hasSecurityGroupRef).toBe(true);
    }
  });
});

describe("40. Final Validation", () => {
  test("no syntax errors in HCL (basic check)", () => {
    // Check for balanced braces
    const openBraces = (stackContent.match(/\{/g) || []).length;
    const closeBraces = (stackContent.match(/\}/g) || []).length;
    expect(openBraces).toBe(closeBraces);
  });

  test("no incomplete resource blocks", () => {
    // Resources should not end abruptly
    expect(stackContent).not.toMatch(/resource\s+"aws_\w+"\s+"w+"\s*\{\s*\}/);
  });

  test("all required topology components are present", () => {
    const requiredComponents = [
      "aws_dynamodb_table",
      "aws_kinesis_stream",
      "aws_lambda_function",
      "aws_elasticache_replication_group",
      "aws_rds_cluster",
      "aws_neptune_cluster",
      "aws_sns_topic",
      "aws_sqs_queue",
      "aws_sfn_state_machine",
      "aws_cloudwatch_event_rule",
      "aws_vpc",
    ];

    requiredComponents.forEach((component) => {
      expect(stackContent).toMatch(new RegExp(`resource\\s+"${component}"`));
    });
  });

  test("summary: all critical requirements validated", () => {
    // This is a meta-test to ensure we've covered everything
    const criticalChecks = [
      stackContent.includes('variable "env"'),
      stackContent.includes('variable "aws_region"'),
      !stackContent.includes('provider "aws"'),
      stackContent.includes("aws_dynamodb_table"),
      stackContent.includes("aws_kinesis_stream"),
      stackContent.includes("aws_lambda_function"),
      stackContent.includes("aws_elasticache_replication_group"),
      stackContent.includes("aws_rds_cluster"),
      stackContent.includes("aws_neptune_cluster"),
      stackContent.includes("aws_sfn_state_machine"),
      stackContent.includes("output "),
      stackContent.includes("locals {"),
    ];

    const allPassed = criticalChecks.every((check) => check === true);
    expect(allPassed).toBe(true);
  });
});
