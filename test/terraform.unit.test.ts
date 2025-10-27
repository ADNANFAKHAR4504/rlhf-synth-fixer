// tests/unit/terraform-unit-tests.ts
// Comprehensive unit tests for Terraform HCL infrastructure code
// Tests resource configurations, variables, and inline Lambda code

import fs from "fs";
import path from "path";

const STACK_PATH = path.resolve(__dirname, "../lib/tap-stack.tf");
const PROVIDER_PATH = path.resolve(__dirname, "../lib/provider.tf");

describe("Terraform Infrastructure Unit Tests", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
    providerContent = fs.readFileSync(PROVIDER_PATH, "utf8");
  });

  describe("File Structure", () => {
    test("tap-stack.tf exists and is readable", () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
      expect(stackContent.length).toBeGreaterThan(0);
    });

    test("provider.tf exists and is readable", () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
      expect(providerContent.length).toBeGreaterThan(0);
    });
  });

  describe("Provider Configuration", () => {
    test("defines required Terraform version", () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
    });

    test("configures AWS provider with correct version", () => {
      expect(providerContent).toMatch(/required_providers\s*{[\s\S]*?aws\s*=\s*{/);
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test("configures S3 backend with partial configuration", () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*{}/);
      expect(providerContent).toContain("Partial backend config");
    });

    test("defines all 12 regional AWS providers", () => {
      const expectedProviders = [
        { alias: "primary", region: "us-east-1" },
        { alias: "secondary", region: "us-west-2" },
        { alias: "eu_west_1", region: "eu-west-1" },
        { alias: "ap_southeast_1", region: "ap-southeast-1" },
        { alias: "us_east_2", region: "us-east-2" },
        { alias: "us_west_1", region: "us-west-1" },
        { alias: "eu_central_1", region: "eu-central-1" },
        { alias: "ap_northeast_1", region: "ap-northeast-1" },
        { alias: "ca_central_1", region: "ca-central-1" },
        { alias: "sa_east_1", region: "sa-east-1" },
        { alias: "ap_south_1", region: "ap-south-1" },
        { alias: "eu_north_1", region: "eu-north-1" }
      ];

      expectedProviders.forEach(({ alias, region }) => {
        const providerRegex = new RegExp(
          `provider\\s+"aws"\\s*{[\\s\\S]*?alias\\s*=\\s*"${alias}"[\\s\\S]*?region\\s*=\\s*"${region}"[\\s\\S]*?}`,
          "m"
        );
        expect(providerContent).toMatch(providerRegex);
      });
    });
  });

  describe("Variables and Locals", () => {
    test("declares environment_suffix variable with proper attributes", () => {
      expect(stackContent).toMatch(/variable\s+"environment_suffix"\s*{/);
      expect(stackContent).toMatch(/description\s*=\s*"Environment suffix for resource naming"/);
      expect(stackContent).toMatch(/type\s*=\s*string/);
      expect(stackContent).toMatch(/default\s*=\s*"dev"/);
    });

    test("defines comprehensive locals block", () => {
      expect(stackContent).toMatch(/locals\s*{/);
      expect(stackContent).toMatch(/app_name\s*=\s*"tap-marketplace"/);
      expect(stackContent).toMatch(/primary_region\s*=\s*"us-east-1"/);
      expect(stackContent).toMatch(/secondary_region\s*=\s*"us-west-2"/);
    });
  });

  describe("DynamoDB Global Tables", () => {
    test("creates ticket inventory table with all required attributes", () => {
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"ticket_inventory"/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.primary/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{local\.app_name\}-ticket-inventory-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
      expect(stackContent).toMatch(/hash_key\s*=\s*"event_id"/);
      expect(stackContent).toMatch(/range_key\s*=\s*"seat_id"/);
      expect(stackContent).toMatch(/stream_enabled\s*=\s*true/);
      expect(stackContent).toMatch(/stream_view_type\s*=\s*"NEW_AND_OLD_IMAGES"/);
    });

    test("ticket inventory table has correct attributes defined", () => {
      const attributeRegex = /attribute\s*{[\s\S]*?name\s*=\s*"(event_id|seat_id|status)"[\s\S]*?type\s*=\s*"S"[\s\S]*?}/g;
      const matches = stackContent.match(attributeRegex);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(3);
    });

    test("ticket inventory table has global secondary index", () => {
      expect(stackContent).toMatch(/global_secondary_index\s*{/);
      expect(stackContent).toMatch(/name\s*=\s*"status-index"/);
      expect(stackContent).toMatch(/hash_key\s*=\s*"status"/);
      expect(stackContent).toMatch(/projection_type\s*=\s*"ALL"/);
    });

    test("ticket inventory table has replicas in all 11 additional regions", () => {
      const replicaRegions = [
        "us-west-2", "eu-west-1", "ap-southeast-1", "us-east-2",
        "us-west-1", "eu-central-1", "ap-northeast-1", "ca-central-1",
        "sa-east-1", "ap-south-1", "eu-north-1"
      ];
      replicaRegions.forEach(region => {
        expect(stackContent).toMatch(new RegExp(`replica\\s*{[\\s\\S]*?region_name\\s*=\\s*"${region}"`));
      });
    });

    test("creates distributed locks table with correct configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"distributed_locks"/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.primary/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{local\.app_name\}-distributed-locks-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
      expect(stackContent).toMatch(/hash_key\s*=\s*"lock_key"/);
      expect(stackContent).toMatch(/stream_enabled\s*=\s*true/);
      expect(stackContent).toMatch(/stream_view_type\s*=\s*"NEW_AND_OLD_IMAGES"/);
    });

    test("distributed locks table has TTL configuration", () => {
      expect(stackContent).toMatch(/ttl\s*{[\s\S]*?enabled\s*=\s*true[\s\S]*?attribute_name\s*=\s*"expiry_time"[\s\S]*?}/);
    });

    test("both tables have proper tags", () => {
      expect(stackContent).toMatch(/tags\s*=\s*{[\s\S]*?Name\s*=\s*"\$\{local\.app_name\}-ticket-inventory"[\s\S]*?}/);
      expect(stackContent).toMatch(/tags\s*=\s*{[\s\S]*?Name\s*=\s*"\$\{local\.app_name\}-distributed-locks"[\s\S]*?}/);
    });
  });

  describe("IAM Configuration", () => {
    test("creates Lambda execution role with correct configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_execution_role"/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.primary/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{local\.app_name\}-lambda-execution-role-\$\{var\.environment_suffix\}"/);
    });

    test("Lambda policy includes all DynamoDB permissions", () => {
      const dynamoPermissions = [
        "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem",
        "dynamodb:DeleteItem", "dynamodb:Query", "dynamodb:Scan",
        "dynamodb:BatchGetItem", "dynamodb:BatchWriteItem",
        "dynamodb:TransactWriteItems", "dynamodb:TransactGetItems"
      ];
      dynamoPermissions.forEach(permission => {
        expect(stackContent).toContain(`"${permission}"`);
      });
    });

    test("Lambda policy includes other service permissions", () => {
      const otherPermissions = [
        "elasticache:*", "kinesis:PutRecord", "kinesis:PutRecords",
        "logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents",
        "xray:PutTraceSegments", "xray:PutTelemetryRecords",
        "rds-data:ExecuteStatement", "rds-data:BatchExecuteStatement",
        "secretsmanager:GetSecretValue"
      ];
      otherPermissions.forEach(permission => {
        expect(stackContent).toContain(`"${permission}"`);
      });
    });

    test("attaches VPC execution policy to Lambda role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_vpc_execution"/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.primary/);
      expect(stackContent).toMatch(/role\s*=\s*aws_iam_role\.lambda_execution_role\.name/);
      expect(stackContent).toMatch(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/service-role\/AWSLambdaVPCAccessExecutionRole"/);
    });

    test("creates Step Functions IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"step_functions_role"/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{local\.app_name\}-step-functions-role"/);
      expect(stackContent).toContain("states.amazonaws.com");
    });

    test("creates EventBridge IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"eventbridge_role"/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{local\.app_name\}-eventbridge-role"/);
      expect(stackContent).toContain("events.amazonaws.com");
    });
  });

  describe("VPC and Networking", () => {
    test("creates main VPC with correct configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.primary/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("creates private subnets in different AZs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_a"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.1\.0\/24"/);
      expect(stackContent).toMatch(/availability_zone\s*=\s*"us-east-1a"/);

      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private_b"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.2\.0\/24"/);
      expect(stackContent).toMatch(/availability_zone\s*=\s*"us-east-1b"/);
    });

    test("creates security group for Lambda functions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"lambda_sg"/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{local\.app_name\}-lambda-sg"/);
      expect(stackContent).toMatch(/description\s*=\s*"Security group for Lambda functions"/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });


    test("creates security group for Redis", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"redis_sg"/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{local\.app_name\}-redis-sg"/);
      expect(stackContent).toMatch(/description\s*=\s*"Security group for ElastiCache Redis"/);
    });

    test("creates security group for Aurora", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"aurora_sg"/);
      expect(stackContent).toMatch(/ingress\s*{[\s\S]*?from_port\s*=\s*3306[\s\S]*?to_port\s*=\s*3306/);
    });
  });

  describe("ElastiCache Configuration", () => {

    test("creates ElastiCache replication group with correct configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_elasticache_replication_group"\s+"redis"/);
      expect(stackContent).toMatch(/replication_group_id\s*=\s*"\$\{local\.app_name\}-redis-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/engine\s*=\s*"redis"/);
      expect(stackContent).toMatch(/node_type\s*=\s*"cache\.r7g\.xlarge"/);
      expect(stackContent).toMatch(/port\s*=\s*6379/);
      expect(stackContent).toMatch(/parameter_group_name\s*=\s*"default\.redis7"/);
    });

    test("ElastiCache has high availability configuration", () => {
      expect(stackContent).toMatch(/automatic_failover_enabled\s*=\s*true/);
      expect(stackContent).toMatch(/multi_az_enabled\s*=\s*true/);
      expect(stackContent).toMatch(/num_cache_clusters\s*=\s*3/);
    });
  });

  describe("Lambda Functions", () => {
    test("creates data archive for ticket purchase Lambda", () => {
      expect(stackContent).toMatch(/data\s+"archive_file"\s+"ticket_purchase_zip"/);
      expect(stackContent).toMatch(/type\s*=\s*"zip"/);
      expect(stackContent).toMatch(/output_path\s*=\s*"\/tmp\/ticket_purchase\.zip"/);
    });

    test("ticket purchase Lambda has inline code with proper structure", () => {
      expect(stackContent).toMatch(/source\s*{[\s\S]*?content\s*=\s*<<-EOF[\s\S]*?exports\.ticketPurchaseHandler\s*=\s*async[\s\S]*?EOF/);
      expect(stackContent).toContain("const AWS = require('aws-sdk');");
      expect(stackContent).toContain("const Redis = require('ioredis');");
      expect(stackContent).toContain("exports.ticketPurchaseHandler = async (event)");
    });

    test("ticket purchase Lambda has environment variables", () => {
      expect(stackContent).toMatch(/environment\s*{[\s\S]*?variables\s*=\s*{[\s\S]*?INVENTORY_TABLE\s*=\s*aws_dynamodb_table\.ticket_inventory\.name/);
      expect(stackContent).toMatch(/LOCKS_TABLE\s*=\s*aws_dynamodb_table\.distributed_locks\.name/);
      expect(stackContent).toMatch(/REDIS_ENDPOINT\s*=\s*aws_elasticache_replication_group\.redis\.primary_endpoint_address/);
      expect(stackContent).toMatch(/KINESIS_STREAM\s*=\s*aws_kinesis_stream\.ticket_sales\.name/);
    });

    test("ticket purchase Lambda has X-Ray tracing enabled", () => {
      expect(stackContent).toMatch(/tracing_config\s*{[\s\S]*?mode\s*=\s*"Active"[\s\S]*?}/);
    });

    test("ticket purchase Lambda code includes distributed locking logic", () => {
      expect(stackContent).toContain("async function acquireDistributedLock");
      expect(stackContent).toContain("async function releaseDistributedLock");
      expect(stackContent).toContain("ConditionalCheckFailedException");
    });

    test("creates inventory verifier Lambda with correct configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"inventory_verifier"/);
      expect(stackContent).toMatch(/function_name\s*=\s*"\$\{local\.app_name\}-inventory-verifier-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/handler\s*=\s*"index\.inventoryVerifierHandler"/);
      expect(stackContent).toMatch(/timeout\s*=\s*60/);
      expect(stackContent).toMatch(/memory_size\s*=\s*1024/);
    });

    test("inventory verifier Lambda code includes verification logic", () => {
      expect(stackContent).toContain("exports.inventoryVerifierHandler = async (event)");
      expect(stackContent).toContain("function detectOverselling");
      expect(stackContent).toContain("async function correctOverselling");
      expect(stackContent).toContain("const axios = require('axios');");
    });

    test("creates kinesis processor Lambda with correct configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"kinesis_processor"/);
      expect(stackContent).toMatch(/function_name\s*=\s*"\$\{local\.app_name\}-kinesis-processor-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/handler\s*=\s*"index\.kinesisProcessorHandler"/);
      expect(stackContent).toMatch(/memory_size\s*=\s*512/);
    });

    test("kinesis processor Lambda has Aurora environment variables", () => {
      expect(stackContent).toMatch(/AURORA_CLUSTER_ARN\s*=\s*aws_rds_cluster\.analytics\.arn/);
      expect(stackContent).toMatch(/AURORA_SECRET_ARN\s*=\s*aws_secretsmanager_secret\.aurora_credentials\.arn/);
    });
  });

  describe("API Gateway", () => {

    test("creates API Gateway resource for tickets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_resource"\s+"tickets"/);
      expect(stackContent).toMatch(/rest_api_id\s*=\s*aws_api_gateway_rest_api\.main\.id/);
      expect(stackContent).toMatch(/parent_id\s*=\s*aws_api_gateway_rest_api\.main\.root_resource_id/);
      expect(stackContent).toMatch(/path_part\s*=\s*"tickets"/);
    });

    test("creates POST method for ticket purchase", () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_method"\s+"purchase"/);
      expect(stackContent).toMatch(/http_method\s*=\s*"POST"/);
      expect(stackContent).toMatch(/authorization\s*=\s*"NONE"/);
    });

    test("creates Lambda integration for API Gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_integration"\s+"lambda_integration"/);
      expect(stackContent).toMatch(/integration_http_method\s*=\s*"POST"/);
      expect(stackContent).toMatch(/type\s*=\s*"AWS_PROXY"/);
      expect(stackContent).toMatch(/uri\s*=\s*aws_lambda_function\.ticket_purchase\.invoke_arn/);
    });

    test("creates API Gateway stage with X-Ray tracing", () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_stage"\s+"prod"/);
      expect(stackContent).toMatch(/deployment_id\s*=\s*aws_api_gateway_deployment\.main\.id/);
      expect(stackContent).toMatch(/stage_name\s*=\s*"prod"/);
      expect(stackContent).toMatch(/xray_tracing_enabled\s*=\s*true/);
    });

    test("creates Lambda permission for API Gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"api_gateway"/);
      expect(stackContent).toMatch(/statement_id\s*=\s*"AllowAPIGatewayInvoke"/);
      expect(stackContent).toMatch(/action\s*=\s*"lambda:InvokeFunction"/);
      expect(stackContent).toMatch(/principal\s*=\s*"apigateway\.amazonaws\.com"/);
    });
  });

  describe("Kinesis Configuration", () => {
    test("creates Kinesis stream with correct configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kinesis_stream"\s+"ticket_sales"/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{local\.app_name\}-ticket-sales-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/shard_count\s*=\s*20/);
      expect(stackContent).toMatch(/retention_period\s*=\s*24/);
      expect(stackContent).toMatch(/encryption_type\s*=\s*"KMS"/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*"alias\/aws\/kinesis"/);
    });

    test("Kinesis stream uses provisioned mode", () => {
      expect(stackContent).toMatch(/stream_mode_details\s*{[\s\S]*?stream_mode\s*=\s*"PROVISIONED"[\s\S]*?}/);
    });

    test("creates Lambda event source mapping for Kinesis", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"kinesis_trigger"/);
      expect(stackContent).toMatch(/event_source_arn\s*=\s*aws_kinesis_stream\.ticket_sales\.arn/);
      expect(stackContent).toMatch(/function_name\s*=\s*aws_lambda_function\.kinesis_processor\.arn/);
      expect(stackContent).toMatch(/starting_position\s*=\s*"LATEST"/);
      expect(stackContent).toMatch(/parallelization_factor\s*=\s*10/);
      expect(stackContent).toMatch(/maximum_batching_window_in_seconds\s*=\s*1/);
    });
  });

  describe("Aurora Database Configuration", () => {

    test("creates Aurora cluster with correct configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster"\s+"analytics"/);
      expect(stackContent).toMatch(/cluster_identifier\s*=\s*"\$\{local\.app_name\}-analytics-\$\{var\.environment_suffix\}"/);
      expect(stackContent).toMatch(/engine\s*=\s*"aurora-mysql"/);
      expect(stackContent).toMatch(/engine_mode\s*=\s*"provisioned"/);
      expect(stackContent).toMatch(/engine_version\s*=\s*"8\.0\.mysql_aurora\.3\.10\.1"/);
      expect(stackContent).toMatch(/database_name\s*=\s*"analytics"/);
      expect(stackContent).toMatch(/master_username\s*=\s*"admin"/);
    });

    test("Aurora cluster has serverless v2 scaling configuration", () => {
      expect(stackContent).toMatch(/serverlessv2_scaling_configuration\s*{[\s\S]*?max_capacity\s*=\s*16[\s\S]*?min_capacity\s*=\s*0\.5[\s\S]*?}/);
    });

    test("creates Aurora cluster instances", () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster_instance"\s+"analytics"/);
      expect(stackContent).toMatch(/count\s*=\s*2/);
      expect(stackContent).toMatch(/identifier\s*=\s*"\$\{local\.app_name\}-analytics-\$\{var\.environment_suffix\}-\$\{count\.index\}"/);
      expect(stackContent).toMatch(/instance_class\s*=\s*"db\.serverless"/);
    });

    test("creates random password for Aurora", () => {
      expect(stackContent).toMatch(/resource\s+"random_password"\s+"aurora_password"/);
      expect(stackContent).toMatch(/length\s*=\s*32/);
      expect(stackContent).toMatch(/special\s*=\s*true/);
    });

    test("creates Secrets Manager secret for Aurora credentials", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"aurora_credentials"/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{local\.app_name\}-aurora-credentials"/);
    });

    test("creates Secrets Manager secret version with Aurora connection details", () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"aurora_credentials"/);
      expect(stackContent).toMatch(/secret_id\s*=\s*aws_secretsmanager_secret\.aurora_credentials\.id/);
      expect(stackContent).toContain("username");
      expect(stackContent).toContain("password");
      expect(stackContent).toContain("host");
      expect(stackContent).toContain("port");
      expect(stackContent).toContain("dbname");
    });
  });

  describe("Step Functions", () => {
    test("creates Step Functions state machine", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sfn_state_machine"\s+"inventory_verification"/);
      expect(stackContent).toMatch(/name\s*=\s*"\$\{local\.app_name\}-inventory-verification"/);
      expect(stackContent).toMatch(/role_arn\s*=\s*aws_iam_role\.step_functions_role\.arn/);
    });

    test("state machine includes choice state for overselling detection", () => {
      expect(stackContent).toContain("Type = \"Choice\"");
      expect(stackContent).toContain("$.overselling_detected");
      expect(stackContent).toContain("BooleanEquals = true");
    });
  });

  describe("EventBridge Configuration", () => {

    test("creates EventBridge target for Step Functions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"step_function"/);
      expect(stackContent).toMatch(/rule\s*=\s*aws_cloudwatch_event_rule\.inventory_check\.name/);
      expect(stackContent).toMatch(/target_id\s*=\s*"StepFunctionTarget"/);
      expect(stackContent).toMatch(/arn\s*=\s*aws_sfn_state_machine\.inventory_verification\.arn/);
      expect(stackContent).toMatch(/role_arn\s*=\s*aws_iam_role\.eventbridge_role\.arn/);
    });
  });

  describe("CloudWatch Logging", () => {
    test("creates log groups for all Lambda functions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_logs"/);
      expect(stackContent).toMatch(/for_each\s*=\s*{/);
      expect(stackContent).toContain("ticket_purchase");
      expect(stackContent).toContain("inventory_verifier");
      expect(stackContent).toContain("kinesis_processor");
      expect(stackContent).toMatch(/name\s*=\s*"\/aws\/lambda\/\$\{each\.value\}"/);
      expect(stackContent).toMatch(/retention_in_days\s*=\s*7/);
    });
  });

  describe("Secondary Region Resources", () => {
    test("creates secondary VPC in us-west-2", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"secondary"/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.secondary/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.1\.0\.0\/16"/);
    });

    test("creates secondary subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"secondary_private_a"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.1\.1\.0\/24"/);
      expect(stackContent).toMatch(/availability_zone\s*=\s*"us-west-2a"/);

      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"secondary_private_b"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.1\.2\.0\/24"/);
      expect(stackContent).toMatch(/availability_zone\s*=\s*"us-west-2b"/);
    });

    test("creates secondary ElastiCache subnet group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_elasticache_subnet_group"\s+"redis_secondary"/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.secondary/);
    });

    test("creates secondary Redis security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"redis_sg_secondary"/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.secondary/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.secondary\.id/);
    });

    test("creates secondary ElastiCache replication group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_elasticache_replication_group"\s+"redis_secondary"/);
      expect(stackContent).toMatch(/provider\s*=\s*aws\.secondary/);
      expect(stackContent).toMatch(/replication_group_id\s*=\s*"\$\{local\.app_name\}-redis"/);
    });
  });

  describe("Outputs", () => {
    test("exports all required outputs", () => {
      const expectedOutputs = [
        { name: "inventory_table_name", value: "aws_dynamodb_table.ticket_inventory.name" },
        { name: "locks_table_name", value: "aws_dynamodb_table.distributed_locks.name" },
        { name: "api_gateway_url", value: /execute-api.*amazonaws\.com\/prod/ },
        { name: "kinesis_stream_name", value: "aws_kinesis_stream.ticket_sales.name" },
        { name: "redis_endpoint", value: "aws_elasticache_replication_group.redis.primary_endpoint_address" },
        { name: "ticket_purchase_lambda_arn", value: "aws_lambda_function.ticket_purchase.arn" },
        { name: "inventory_verifier_lambda_arn", value: "aws_lambda_function.inventory_verifier.arn" },
        { name: "kinesis_processor_lambda_arn", value: "aws_lambda_function.kinesis_processor.arn" },
        { name: "aurora_cluster_arn", value: "aws_rds_cluster.analytics.arn" },
        { name: "region", value: "local.primary_region" },
        { name: "environment_suffix", value: "var.environment_suffix" }
      ];

      expectedOutputs.forEach(({ name, value }) => {
        expect(stackContent).toMatch(new RegExp(`output\\s+"${name}"\\s*{`));
        if (typeof value === 'string') {
          expect(stackContent).toContain(value);
        } else {
          expect(stackContent).toMatch(value);
        }
      });
    });

    test("outputs have descriptions", () => {
      expect(stackContent).toContain("description = \"DynamoDB ticket inventory table name\"");
      expect(stackContent).toContain("description = \"API Gateway invoke URL\"");
      expect(stackContent).toContain("description = \"Primary deployment region\"");
    });
  });

  describe("Resource Dependencies", () => {
    test("Lambda functions depend on IAM policies", () => {
      expect(stackContent).toContain("depends_on = [aws_iam_role_policy.lambda_policy, aws_iam_role_policy_attachment.lambda_vpc_execution]");
    });

    test("IAM policy depends on IAM role", () => {
      expect(stackContent).toContain("depends_on = [aws_iam_role.lambda_execution_role]");
    });
  });

  describe("Inline Lambda Code Validation", () => {
    test("ticket purchase Lambda code handles Redis cluster connection", () => {
      expect(stackContent).toContain("new Redis.Cluster");
      expect(stackContent).toContain("scaleReads: 'slave'");
      expect(stackContent).toContain("enableOfflineQueue: false");
    });

    test("ticket purchase Lambda code includes error handling", () => {
      expect(stackContent).toContain("try {");
      expect(stackContent).toContain("} catch (error) {");
      expect(stackContent).toContain("statusCode: 500");
    });

    test("inventory verifier code handles regional scanning", () => {
      expect(stackContent).toContain("const regionalDDB = new AWS.DynamoDB.DocumentClient({ region });");
      expect(stackContent).toContain("do {");
      expect(stackContent).toContain("} while (lastKey);");
    });

    test("kinesis processor code handles batch processing", () => {
      expect(stackContent).toContain("event.Records.map");
      expect(stackContent).toContain("Buffer.from(record.kinesis.data, 'base64')");
      expect(stackContent).toContain("INSERT INTO ticket_sales");
    });
  });

  describe("Performance and Scaling Configuration", () => {
    test("resources configured for high performance", () => {
      expect(stackContent).toMatch(/memory_size\s*=\s*3008/);
      expect(stackContent).toMatch(/node_type\s*=\s*"cache\.r7g\.xlarge"/);
      expect(stackContent).toMatch(/shard_count\s*=\s*20/);
      expect(stackContent).toMatch(/parallelization_factor\s*=\s*10/);
    });

    test("auto-scaling configured where applicable", () => {
      expect(stackContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
      expect(stackContent).toMatch(/serverlessv2_scaling_configuration/);
      expect(stackContent).toMatch(/max_capacity\s*=\s*16/);
    });
  });

  describe("Security Configuration", () => {
    test("encryption enabled on all data stores", () => {
      expect(stackContent).toMatch(/at_rest_encryption_enabled\s*=\s*true/);
      expect(stackContent).toMatch(/transit_encryption_enabled\s*=\s*true/);
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(stackContent).toMatch(/encryption_type\s*=\s*"KMS"/);
    });

    test("VPC isolation configured for sensitive resources", () => {
      expect(stackContent).toMatch(/vpc_config\s*{/);
      expect(stackContent).toMatch(/vpc_security_group_ids/);
      expect(stackContent).toMatch(/subnet_group_name/);
    });
  });

  describe("Monitoring and Observability", () => {
    test("X-Ray tracing enabled", () => {
      expect(stackContent).toMatch(/xray_tracing_enabled\s*=\s*true/);
      expect(stackContent).toMatch(/tracing_config\s*{[\s\S]*?mode\s*=\s*"Active"/);
    });

    test("CloudWatch logging configured", () => {
      expect(stackContent).toMatch(/logs:CreateLogGroup/);
      expect(stackContent).toMatch(/logs:CreateLogStream/);
      expect(stackContent).toMatch(/logs:PutLogEvents/);
    });
  });

  describe("Terraform Best Practices", () => {
    test("uses data sources for archive files", () => {
      expect(stackContent).toMatch(/data\s+"archive_file"/);
      expect(stackContent).toMatch(/source_code_hash\s*=\s*data\.archive_file\.\w+\.output_base64sha256/);
    });

    test("uses proper resource naming with locals", () => {
      expect(stackContent).toMatch(/\$\{local\.app_name\}/);
      expect(stackContent).toMatch(/\$\{var\.environment_suffix\}/);
    });

    test("includes lifecycle rules where needed", () => {
      expect(stackContent).toMatch(/lifecycle\s*{/);
      expect(stackContent).toMatch(/create_before_destroy\s*=\s*true/);
    });
  });

  describe("Edge Cases and Error Scenarios", () => {
    test("handles conditional expressions in DynamoDB operations", () => {
      expect(stackContent).toContain("ConditionExpression");
      expect(stackContent).toContain("attribute_not_exists");
      expect(stackContent).toContain("ConditionalCheckFailedException");
    });

    test("includes TTL configuration for lock expiry", () => {
      expect(stackContent).toContain("expiry_time");
      expect(stackContent).toContain("ttl");
    });

    test("handles pagination in DynamoDB scans", () => {
      expect(stackContent).toContain("ExclusiveStartKey");
      expect(stackContent).toContain("LastEvaluatedKey");
    });
  });
});
