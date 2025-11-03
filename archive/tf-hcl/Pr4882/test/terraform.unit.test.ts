import { beforeAll, describe, expect, test } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";

const stackPath = path.resolve(__dirname, "..", "lib", "tap_stack.tf");

let stackContent = "";

beforeAll(() => {
  expect(fs.existsSync(stackPath)).toBe(true);
  stackContent = fs.readFileSync(stackPath, "utf8");
});

describe("Terraform stack tap_stack.tf", () => {
  describe("File Basics", () => {
    test("stack file is present and non-trivial", () => {
      expect(stackContent.length).toBeGreaterThan(5000);
      const lineCount = stackContent.split(/\r?\n/).length;
      expect(lineCount).toBeGreaterThan(300);
    });

    test("uses documented section markers", () => {
      const markerMatches = stackContent.match(/# ============================================================================/g);
      expect(markerMatches).not.toBeNull();
      expect(markerMatches!.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe("Variable Definitions", () => {
    test("declares core configuration variables with expected defaults", () => {
      const requiredVariables = [
        { name: "aws_region", pattern: /default\s*=\s*"us-east-1"/ },
        { name: "environment", pattern: /default\s*=\s*"prod"/ },
        { name: "unique_prefix", pattern: /default\s*=\s*"iac-243"/ },
        { name: "vpc_cidr", pattern: /default\s*=\s*"10\.0\.0\.0\/16"/ },
        { name: "ssh_allowed_cidr", pattern: /default\s*=\s*"10\.0\.0\.0\/8"/ },
        { name: "enable_pitr", pattern: /default\s*=\s*true/ },
        { name: "enable_kinesis_encryption", pattern: /default\s*=\s*true/ },
        { name: "lambda_runtime", pattern: /default\s*=\s*"python3\.11"/ },
        { name: "lambda_timeout", pattern: /default\s*=\s*60/ },
        { name: "kinesis_shard_count", pattern: /default\s*=\s*10/ },
        { name: "dynamodb_read_capacity", pattern: /default\s*=\s*20/ },
        { name: "dynamodb_write_capacity", pattern: /default\s*=\s*20/ },
        { name: "state_bucket_name", pattern: /default\s*=\s*"terraform-state-bucket"/ },
        { name: "state_lock_table_name", pattern: /default\s*=\s*"terraform-state-lock"/ },
        { name: "project_name", pattern: /default\s*=\s*"ClickStream"/ },
      ];

      requiredVariables.forEach(({ name, pattern }) => {
        const declarationRegex = new RegExp(`variable\\s+"${name}"`, "m");
        const defaultRegex = new RegExp(`variable\\s+"${name}"[\\s\\S]*?${pattern.source}`, "m");
        expect(stackContent).toMatch(declarationRegex);
        expect(stackContent).toMatch(defaultRegex);
      });
    });

    test("configures availability zones and retention parameters", () => {
      expect(stackContent).toMatch(/variable\s+"azs"[\s\S]*default\s*=\s*\[\s*"us-east-1a"\s*,\s*"us-east-1b"\s*]/);
      expect(stackContent).toMatch(/variable\s+"kinesis_retention_period"[\s\S]*default\s*=\s*24/);
    });
  });

  describe("Locals and Tagging", () => {
    test("derives resource prefix, common tags, and CIDR slices", () => {
      expect(stackContent).toMatch(/resource_prefix\s*=\s*"\$\{var\.unique_prefix}-\$\{var\.environment\}"/);
      expect(stackContent).toMatch(/common_tags\s*=\s*{[\s\S]*Environment\s*=\s*var\.environment[\s\S]*Project\s*=\s*var\.project_name[\s\S]*ManagedBy\s*=\s*"Terraform"[\s\S]*iac-rlhf-amazon\s*=\s*"true"[\s\S]*team\s*=\s*2/);
      expect(stackContent).toMatch(/private_subnet_cidrs\s*=\s*\[[\s\S]*cidrsubnet\(var\.vpc_cidr,\s*4,\s*0\)[\s\S]*cidrsubnet\(var\.vpc_cidr,\s*4,\s*1\)/);
      expect(stackContent).toMatch(/nat_gateway_subnet_cidrs\s*=\s*\[[\s\S]*cidrsubnet\(var\.vpc_cidr,\s*8,\s*32\)[\s\S]*cidrsubnet\(var\.vpc_cidr,\s*8,\s*33\)/);
    });

    test("captures feature toggles and lambda batching locals", () => {
      expect(stackContent).toMatch(/enable_vpc_flow_logs\s*=\s*true/);
      expect(stackContent).toMatch(/enable_enhanced_monitoring\s*=\s*true/);
      expect(stackContent).toMatch(/lambda_batch_size\s*=\s*100/);
      expect(stackContent).toMatch(/lambda_max_batching_window\s*=\s*5/);
      expect(stackContent).toMatch(/lambda_parallelization_factor\s*=\s*10/);
      expect(stackContent).toMatch(/lambda_retry_attempts\s*=\s*3/);
    });
  });

  describe("Data Sources", () => {
    test("looks up availability zones and caller identity", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"[\s\S]*state\s*=\s*"available"/);
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{/);
    });
  });

  describe("Networking", () => {
    test("provisions VPC, private subnets, and NAT infrastructure", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"[\s\S]*cidr_block\s*=\s*var\.vpc_cidr/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"[\s\S]*count\s*=\s*length\(var\.azs\)[\s\S]*cidr_block\s*=\s*local\.private_subnet_cidrs\[count\.index]/);
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"nat"[\s\S]*map_public_ip_on_launch\s*=\s*true/);
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"[\s\S]*domain\s*=\s*"vpc"/);
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"[\s\S]*allocation_id\s*=\s*aws_eip\.nat\[count\.index]/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"[\s\S]*nat_gateway_id\s*=\s*aws_nat_gateway\.main\[count\.index]/);
    });

    test("adds gateway and interface VPC endpoints", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"dynamodb"[\s\S]*service_name\s*=\s*"com\.amazonaws\.\$\{var\.aws_region}\.dynamodb"/);
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"kinesis"[\s\S]*vpc_endpoint_type\s*=\s*"Interface"/);
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"lambda"[\s\S]*private_dns_enabled\s*=\s*true/);
    });
  });

  describe("Network Observability", () => {
    test("enables flow logs with supporting IAM resources", () => {
      expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"main"[\s\S]*count\s*=\s*local\.enable_vpc_flow_logs\s*\?\s*1\s*:\s*0/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"flow_logs"[\s\S]*count\s*=\s*local\.enable_vpc_flow_logs\s*\?\s*1\s*:\s*0/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"flow_logs"[\s\S]*count\s*=\s*local\.enable_vpc_flow_logs\s*\?\s*1\s*:\s*0/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"flow_logs"[\s\S]*logs:CreateLogGroup/);
    });
  });

  describe("Security Groups", () => {
    test("defines security groups for endpoints, lambda, and alb", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"vpc_endpoints"[\s\S]*cidr_blocks\s*=\s*\[var\.vpc_cidr]/);
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"lambda"[\s\S]*egress[\s\S]*protocol\s*=\s*"-1"[\s\S]*cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"]/);
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"[\s\S]*ipv6_cidr_blocks\s*=\s*\["::\/0"]/);
    });
  });

  describe("Kinesis and Encryption", () => {
    test("configures clickstream stream with optional KMS encryption", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kinesis_stream"\s+"clickstream"[\s\S]*shard_count\s*=\s*var\.kinesis_shard_count/);
      expect(stackContent).toMatch(/encryption_type\s*=\s*var\.enable_kinesis_encryption\s*\?\s*"KMS"\s*:\s*"NONE"/);
      expect(stackContent).toMatch(/kms_key_id\s*=\s*var\.enable_kinesis_encryption\s*\?\s*aws_kms_key\.kinesis\[0\]\.id\s*:\s*null/);
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"kinesis"[\s\S]*count\s*=\s*var\.enable_kinesis_encryption\s*\?\s*1\s*:\s*0/);
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"kinesis"[\s\S]*alias\/\$\{local\.resource_prefix}-kinesis/);
    });
  });

  describe("Stream Processing Lambda", () => {
    test("defines processor lambda connected to private subnets and DynamoDB", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"processor"[\s\S]*runtime\s*=\s*var\.lambda_runtime/);
      expect(stackContent).toMatch(/vpc_config[\s\S]*subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
      expect(stackContent).toMatch(/environment\s*{\s*variables\s*=\s*{[\s\S]*DYNAMODB_TABLE\s*=\s*aws_dynamodb_table\.processed_data\.name/);
      expect(stackContent).toMatch(/depends_on\s*=\s*\[[\s\S]*aws_iam_role_policy_attachment\.lambda_vpc_execution[\s\S]*aws_cloudwatch_log_group\.lambda/);
    });

    test("wires Kinesis event source mapping with batching settings", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"kinesis_lambda"[\s\S]*event_source_arn\s*=\s*aws_kinesis_stream\.clickstream\.arn/);
      expect(stackContent).toMatch(/batch_size\s*=\s*local\.lambda_batch_size/);
      expect(stackContent).toMatch(/maximum_batching_window_in_seconds\s*=\s*local\.lambda_max_batching_window/);
      expect(stackContent).toMatch(/parallelization_factor\s*=\s*local\.lambda_parallelization_factor/);
      expect(stackContent).toMatch(/maximum_retry_attempts\s*=\s*local\.lambda_retry_attempts/);
    });
  });

  describe("DynamoDB and Scaling", () => {
    test("creates DynamoDB table with GSI and PITR toggle", () => {
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"processed_data"[\s\S]*billing_mode\s*=\s*"PROVISIONED"/);
      expect(stackContent).toMatch(/global_secondary_index[\s\S]*name\s*=\s*"eventTypeIndex"[\s\S]*projection_type\s*=\s*"ALL"/);
      expect(stackContent).toMatch(/point_in_time_recovery\s*{\s*enabled\s*=\s*var\.enable_pitr/);
      expect(stackContent).toMatch(/stream_enabled\s*=\s*true/);
    });

    test("enables autoscaling targets for read and write capacity", () => {
      expect(stackContent).toMatch(/resource\s+"aws_appautoscaling_target"\s+"dynamodb_table_read_target"[\s\S]*count\s*=\s*var\.dynamodb_read_capacity\s*>\s*0\s*\?\s*1\s*:\s*0/);
      expect(stackContent).toMatch(/resource\s+"aws_appautoscaling_target"\s+"dynamodb_table_write_target"[\s\S]*count\s*=\s*var\.dynamodb_write_capacity\s*>\s*0\s*\?\s*1\s*:\s*0/);
      expect(stackContent).toMatch(/resource\s+"aws_appautoscaling_policy"\s+"dynamodb_table_read_policy"[\s\S]*DynamoDBReadCapacityUtilization/);
      expect(stackContent).toMatch(/resource\s+"aws_appautoscaling_policy"\s+"dynamodb_table_write_policy"[\s\S]*DynamoDBWriteCapacityUtilization/);
    });
  });

  describe("Application Load Balancer", () => {
    test("configures ALB with access logs and target group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"api"[\s\S]*enable_cross_zone_load_balancing\s*=\s*true/);
      expect(stackContent).toMatch(/access_logs\s*{\s*bucket\s*=\s*aws_s3_bucket\.alb_logs\.id/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"alb_logs"[\s\S]*bucket\s*=\s*"\$\{local\.resource_prefix}-alb-logs-v2"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"alb_logs"[\s\S]*sse_algorithm\s*=\s*"AES256"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"alb_logs"[\s\S]*Principal\s*=\s*{\s*AWS\s*=\s*data\.aws_elb_service_account\.main\.arn\s*}/);
    });

    test("defines lambda target group and listener wiring", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"api"[\s\S]*target_type\s*=\s*"lambda"/);
      expect(stackContent).toMatch(/health_check\s*{\s*enabled\s*=\s*true[\s\S]*path\s*=\s*"\/health"[\s\S]*matcher\s*=\s*"200"/);
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"api"[\s\S]*default_action[\s\S]*target_group_arn\s*=\s*aws_lb_target_group\.api\.arn/);
    });
  });

  describe("Stream Ingest Path", () => {
    test("packages and deploys ingest lambda for ALB invocation", () => {
      expect(stackContent).toMatch(/data\s+"archive_file"\s+"stream_ingest_zip"[\s\S]*source_file\s*=\s*"\$\{path\.module}\/runtime\/stream_ingest\.py"/);
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"stream_ingest"[\s\S]*handler\s*=\s*"stream_ingest\.handler"/);
      expect(stackContent).toMatch(/environment\s*{\s*variables\s*=\s*{[\s\S]*STREAM_NAME\s*=\s*aws_kinesis_stream\.clickstream\.name/);
      expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_from_alb_tg"[\s\S]*principal\s*=\s*"elasticloadbalancing\.amazonaws\.com"/);
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group_attachment"\s+"api_lambda"[\s\S]*target_id\s*=\s*aws_lambda_function\.stream_ingest\.arn/);
    });
  });

  describe("CloudWatch Monitoring", () => {
    test("defines alarms for kinesis, lambda, and dynamodb", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"kinesis_iterator_age"[\s\S]*metric_name\s*=\s*"GetRecords\.IteratorAgeMilliseconds"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors"[\s\S]*metric_name\s*=\s*"Errors"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dynamodb_throttles"[\s\S]*metric_name\s*=\s*"SystemErrors"/);
    });
  });

  describe("Stack Outputs", () => {
    test("exposes identifiers for key resources", () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"[\s\S]*aws_vpc\.main\.id/);
      expect(stackContent).toMatch(/output\s+"kinesis_stream_name"[\s\S]*aws_kinesis_stream\.clickstream\.name/);
      expect(stackContent).toMatch(/output\s+"lambda_function_name"[\s\S]*aws_lambda_function\.processor\.function_name/);
      expect(stackContent).toMatch(/output\s+"dynamodb_table_name"[\s\S]*aws_dynamodb_table\.processed_data\.name/);
      expect(stackContent).toMatch(/output\s+"alb_dns_name"[\s\S]*aws_lb\.api\.dns_name/);
    });
  });
});