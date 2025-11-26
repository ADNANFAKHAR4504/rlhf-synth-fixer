// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for Terraform infrastructure files
// Tests file structure, resource definitions, and configuration compliance

import fs from "fs";
import path from "path";

const STACK_FILE = "../lib/tap_stack.tf";
const PROVIDER_FILE = "../lib/provider.tf";
const VARIABLES_FILE = "../lib/variables.tf";

const stackPath = path.resolve(__dirname, STACK_FILE);
const providerPath = path.resolve(__dirname, PROVIDER_FILE);
const variablesPath = path.resolve(__dirname, VARIABLES_FILE);

describe("Terraform Infrastructure Unit Tests", () => {
  let stackContent: string;
  let providerContent: string;
  let variablesContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
    variablesContent = fs.readFileSync(variablesPath, "utf8");
  });

  describe("File Structure Tests", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test("variables.tf exists", () => {
      expect(fs.existsSync(variablesPath)).toBe(true);
    });

    test("tap_stack.tf does NOT declare provider (provider.tf owns providers)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("tap_stack.tf does NOT declare terraform block (provider.tf owns terraform config)", () => {
      expect(stackContent).not.toMatch(/\bterraform\s*{/);
    });
  });

  describe("Provider Configuration Tests", () => {
    test("provider.tf declares terraform version >= 1.5.0", () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
    });

    test("provider.tf declares AWS provider version ~> 5.0", () => {
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test("provider.tf configures AWS provider with region variable", () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test("provider.tf includes default tags", () => {
      expect(providerContent).toMatch(/default_tags\s*{/);
      expect(providerContent).toMatch(/Environment\s*=\s*var\.environment_suffix/);
    });
  });

  describe("Variables Configuration Tests", () => {
    test("variables.tf declares aws_region variable", () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("variables.tf declares environment_suffix variable", () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("variables.tf declares payment_providers variable as set", () => {
      expect(variablesContent).toMatch(/variable\s+"payment_providers"\s*{/);
      expect(variablesContent).toMatch(/type\s*=\s*set\(string\)/);
    });

    test("variables.tf declares lambda_reserved_concurrency variable", () => {
      expect(variablesContent).toMatch(/variable\s+"lambda_reserved_concurrency"\s*{/);
      expect(variablesContent).toMatch(/type\s*=\s*number/);
    });

    test("variables.tf declares API throttling variables", () => {
      expect(variablesContent).toMatch(/variable\s+"api_throttle_rate_limit"\s*{/);
      expect(variablesContent).toMatch(/variable\s+"api_throttle_burst_limit"\s*{/);
    });
  });

  describe("IAM Resources Tests", () => {
    test("declares IAM role for webhook_validator Lambda", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"webhook_validator"\s*{/);
    });

    test("declares IAM role for payment_processor Lambda", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"payment_processor"\s*{/);
    });

    test("declares IAM role for notification_dispatcher Lambda", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"notification_dispatcher"\s*{/);
    });

    test("declares IAM role for Step Functions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"step_functions"\s*{/);
    });

    test("IAM policies follow least privilege principle with specific resource ARNs", () => {
      expect(stackContent).toMatch(/Resource\s*=\s*aws_dynamodb_table\.webhook_idempotency\.arn/);
      expect(stackContent).toMatch(/Resource\s*=\s*\[for q in aws_sqs_queue\.processing : q\.arn\]/);
    });
  });

  describe("Lambda Functions Tests", () => {
    test("declares webhook_validator Lambda function", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"webhook_validator"\s*{/);
    });

    test("declares payment_processor Lambda function", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"payment_processor"\s*{/);
    });

    test("declares notification_dispatcher Lambda function", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"notification_dispatcher"\s*{/);
    });

    test("Lambda functions use ARM64 architecture", () => {
      const armMatches = stackContent.match(/architectures\s*=\s*\["arm64"\]/g);
      expect(armMatches).toBeTruthy();
      expect(armMatches!.length).toBeGreaterThanOrEqual(3);
    });

    test("Lambda functions use 512MB memory", () => {
      const memoryMatches = stackContent.match(/memory_size\s*=\s*512/g);
      expect(memoryMatches).toBeTruthy();
      expect(memoryMatches!.length).toBeGreaterThanOrEqual(3);
    });

    test("Lambda functions have 30s timeout", () => {
      expect(stackContent).toMatch(/timeout\s*=\s*local\.lambda_timeout/);
      expect(stackContent).toMatch(/lambda_timeout\s*=\s*30/);
    });

    test("Lambda functions use reserved concurrent executions", () => {
      expect(stackContent).toMatch(/reserved_concurrent_executions\s*=\s*var\.lambda_reserved_concurrency/);
    });

    test("Lambda functions use container images from ECR", () => {
      expect(stackContent).toMatch(/package_type\s*=\s*"Image"/);
      expect(stackContent).toMatch(/image_uri\s*=\s*"\${aws_ecr_repository\..*\.repository_url}:\${var\.ecr_image_tag}"/);
    });
  });

  describe("ECR Repository Tests", () => {
    test("declares ECR repositories for Lambda images", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ecr_repository"\s+"webhook_validator"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_ecr_repository"\s+"payment_processor"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_ecr_repository"\s+"notification_dispatcher"\s*{/);
    });

    test("ECR repositories have force_delete enabled (no retention policy)", () => {
      const forceDeleteMatches = stackContent.match(/force_delete\s*=\s*true/g);
      expect(forceDeleteMatches).toBeTruthy();
      expect(forceDeleteMatches!.length).toBeGreaterThanOrEqual(4);
    });

    test("ECR repositories have image scanning enabled", () => {
      expect(stackContent).toMatch(/scan_on_push\s*=\s*true/);
    });
  });

  describe("API Gateway Tests", () => {
    test("declares REST API Gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"webhook_api"\s*{/);
    });

    test("API Gateway uses REGIONAL endpoint", () => {
      expect(stackContent).toMatch(/types\s*=\s*\["REGIONAL"\]/);
    });

    test("declares API Gateway resources for multi-tenant paths", () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_resource"\s+"provider"\s*{/);
      expect(stackContent).toMatch(/for_each\s*=\s*var\.payment_providers/);
    });

    test("declares POST methods for webhook endpoints", () => {
      expect(stackContent).toMatch(/resource\s+"aws_api_gateway_method"\s+"webhook_post"\s*{/);
      expect(stackContent).toMatch(/http_method\s*=\s*"POST"/);
    });

    test("API Gateway has throttling configured", () => {
      expect(stackContent).toMatch(/throttling_rate_limit\s*=\s*var\.api_throttle_rate_limit/);
      expect(stackContent).toMatch(/throttling_burst_limit\s*=\s*var\.api_throttle_burst_limit/);
    });

    test("API Gateway has access logging configured", () => {
      expect(stackContent).toMatch(/access_log_settings\s*{/);
      expect(stackContent).toMatch(/destination_arn\s*=\s*aws_cloudwatch_log_group\.api_gateway\.arn/);
    });
  });

  describe("DynamoDB Tests", () => {
    test("declares DynamoDB table for idempotency", () => {
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"webhook_idempotency"\s*{/);
    });

    test("DynamoDB uses PAY_PER_REQUEST billing", () => {
      expect(stackContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
    });

    test("DynamoDB has TTL configured", () => {
      expect(stackContent).toMatch(/ttl\s*{/);
      expect(stackContent).toMatch(/enabled\s*=\s*true/);
      expect(stackContent).toMatch(/attribute_name\s*=\s*"processed_timestamp"/);
    });

    test("DynamoDB has point-in-time recovery enabled", () => {
      expect(stackContent).toMatch(/point_in_time_recovery\s*{/);
      expect(stackContent).toMatch(/enabled\s*=\s*true/);
    });

    test("DynamoDB has deletion protection disabled", () => {
      expect(stackContent).toMatch(/deletion_protection_enabled\s*=\s*false/);
    });

    test("DynamoDB hash key is webhook_id", () => {
      expect(stackContent).toMatch(/hash_key\s*=\s*"webhook_id"/);
    });
  });

  describe("SQS Queues Tests", () => {
    test("declares SQS processing queues for each provider", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"processing"\s*{/);
      expect(stackContent).toMatch(/for_each\s*=\s*var\.payment_providers/);
    });

    test("declares SQS dead letter queues", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"dlq"\s*{/);
    });

    test("SQS queues have correct retention periods", () => {
      expect(stackContent).toMatch(/message_retention_seconds\s*=\s*local\.sqs_retention_seconds/);
      expect(stackContent).toMatch(/sqs_retention_seconds\s*=\s*345600/); // 4 days
      expect(stackContent).toMatch(/dlq_retention_seconds\s*=\s*1209600/); // 14 days
    });

    test("SQS visibility timeout matches Lambda timeout", () => {
      expect(stackContent).toMatch(/visibility_timeout_seconds\s*=\s*local\.lambda_timeout/);
    });

    test("SQS queues have redrive policy configured", () => {
      expect(stackContent).toMatch(/redrive_policy\s*=\s*jsonencode/);
      expect(stackContent).toMatch(/maxReceiveCount/);
    });
  });

  describe("Step Functions Tests", () => {
    test("declares Step Functions state machine", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sfn_state_machine"\s+"payment_workflow"\s*{/);
    });

    test("Step Functions has logging configuration", () => {
      expect(stackContent).toMatch(/logging_configuration\s*{/);
      expect(stackContent).toMatch(/include_execution_data\s*=\s*true/);
    });

    test("Step Functions definition includes retry configuration", () => {
      expect(stackContent).toMatch(/Retry\s*=\s*\[/);
      expect(stackContent).toMatch(/BackoffRate/);
      expect(stackContent).toMatch(/IntervalSeconds/);
      expect(stackContent).toMatch(/MaxDelaySeconds/);
    });

    test("Step Functions includes fraud detection step", () => {
      expect(stackContent).toMatch(/FraudDetection\s*=\s*{/);
      expect(stackContent).toMatch(/frauddetector:getEventPrediction/);
    });

    test("Step Functions includes error handling", () => {
      expect(stackContent).toMatch(/Catch\s*=\s*\[/);
      expect(stackContent).toMatch(/HandleError/);
    });
  });

  describe("EventBridge Tests", () => {
    test("declares EventBridge rule for high value payments", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"high_value_payments"\s*{/);
    });

    test("declares EventBridge rules for payment types", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"payment_by_type"\s*{/);
      expect(stackContent).toMatch(/for_each\s*=\s*toset\(\["credit_card", "paypal", "bank_transfer"\]\)/);
    });

    test("EventBridge rules have proper event patterns", () => {
      expect(stackContent).toMatch(/event_pattern\s*=\s*jsonencode/);
      expect(stackContent).toMatch(/source.*payment\.processor/);
    });
  });

  describe("S3 Bucket Tests", () => {
    test("declares S3 bucket for payment archival", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"payment_archive"\s*{/);
    });

    test("S3 bucket has force_destroy enabled (no retention policy)", () => {
      expect(stackContent).toMatch(/force_destroy\s*=\s*true/);
    });

    test("S3 bucket has intelligent tiering configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_intelligent_tiering_configuration"\s*"payment_archive"\s*{/);
    });

    test("S3 bucket has lifecycle configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"payment_archive"\s*{/);
      expect(stackContent).toMatch(/days\s*=\s*var\.archival_days/);
      expect(stackContent).toMatch(/storage_class\s*=\s*"INTELLIGENT_TIERING"/);
    });

    test("S3 bucket has event notifications", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_notification"\s+"payment_archive"\s*{/);
      expect(stackContent).toMatch(/events\s*=\s*\["s3:ObjectCreated:\*"\]/);
    });

    test("S3 bucket has versioning enabled", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"payment_archive"\s*{/);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("S3 bucket has encryption configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"payment_archive"\s*{/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });
  });

  describe("CloudWatch Tests", () => {
    test("declares CloudWatch log groups for all Lambda functions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"webhook_validator"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"payment_processor"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"notification_dispatcher"\s*{/);
    });

    test("CloudWatch log groups have 7 day retention", () => {
      expect(stackContent).toMatch(/retention_in_days\s*=\s*local\.log_retention_days/);
      expect(stackContent).toMatch(/log_retention_days\s*=\s*7/);
    });

    test("declares CloudWatch log group for API Gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"api_gateway"\s*{/);
    });

    test("declares CloudWatch log group for Step Functions", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"step_functions"\s*{/);
    });
  });

  describe("VPC and Networking Tests", () => {
    test("declares VPC for private resources", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("declares private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
      expect(stackContent).toMatch(/count\s*=\s*2/);
    });

    test("declares VPC endpoints for private ECR access", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ecr_api"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"ecr_dkr"\s*{/);
    });

    test("declares VPC endpoint for DynamoDB", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"dynamodb"\s*{/);
      expect(stackContent).toMatch(/vpc_endpoint_type\s*=\s*"Gateway"/);
    });

    test("declares VPC endpoint for SQS", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"sqs"\s*{/);
    });

    test("declares security group for VPC endpoints", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"vpc_endpoints"\s*{/);
    });
  });

  describe("Output Tests", () => {
    test("declares api_endpoint_url output", () => {
      expect(stackContent).toMatch(/output\s+"api_endpoint_url"\s*{/);
      expect(stackContent).toMatch(/value\s*=\s*aws_api_gateway_stage\.prod\.invoke_url/);
    });

    test("declares processing_queue_urls output", () => {
      expect(stackContent).toMatch(/output\s+"processing_queue_urls"\s*{/);
      expect(stackContent).toMatch(/for k, v in aws_sqs_queue\.processing : k => v\.url/);
    });

    test("declares dlq_urls output", () => {
      expect(stackContent).toMatch(/output\s+"dlq_urls"\s*{/);
      expect(stackContent).toMatch(/for k, v in aws_sqs_queue\.dlq : k => v\.url/);
    });

    test("declares state_machine_arn output", () => {
      expect(stackContent).toMatch(/output\s+"state_machine_arn"\s*{/);
      expect(stackContent).toMatch(/value\s*=\s*aws_sfn_state_machine\.payment_workflow\.arn/);
    });
  });

  describe("Multi-tenant Support Tests", () => {
    test("uses payment_providers variable for multi-tenant isolation", () => {
      const forEachMatches = stackContent.match(/for_each\s*=\s*var\.payment_providers/g);
      expect(forEachMatches).toBeTruthy();
      expect(forEachMatches!.length).toBeGreaterThanOrEqual(3);
    });

    test("creates separate resources per payment provider", () => {
      expect(stackContent).toMatch(/each\.value/);
      expect(stackContent).toMatch(/each\.key/);
    });
  });

  describe("Security and Compliance Tests", () => {
    test("no hardcoded secrets or credentials", () => {
      expect(stackContent).not.toMatch(/password\s*=\s*"[^"]"/);
      expect(stackContent).not.toMatch(/secret\s*=\s*"[^"]"/);
      expect(stackContent).not.toMatch(/api_key\s*=\s*"[^"]"/);
    });

    test("uses data sources for account information", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test("no resources have deletion protection (as required)", () => {
      expect(stackContent).not.toMatch(/prevent_destroy\s*=\s*true/);
      expect(stackContent).toMatch(/deletion_protection_enabled\s*=\s*false/);
    });

    test("IAM policies include comments explaining intent", () => {
      expect(stackContent).toMatch(/# CloudWatch Logs permissions/);
      expect(stackContent).toMatch(/# DynamoDB permissions/);
      expect(stackContent).toMatch(/# ECR permissions/);
    });
  });

  describe("Performance and Scaling Tests", () => {
    test("API Gateway throttling is properly configured", () => {
      expect(variablesContent).toMatch(/default\s*=\s*10000/); // rate limit
      expect(variablesContent).toMatch(/default\s*=\s*5000/);  // burst limit
    });

    test("Lambda reserved concurrency is configurable", () => {
      expect(variablesContent).toMatch(/default\s*=\s*100/);
    });

    test("SQS batch processing is optimized", () => {
      expect(stackContent).toMatch(/batch_size\s*=\s*10/);
    });
  });

  describe("Configuration Consistency Tests", () => {
    test("all resources use consistent naming prefix", () => {
      expect(stackContent).toMatch(/prefix\s*=\s*"\${var\.environment_suffix}-webhook"/);
    });

    test("all resources use consistent tagging", () => {
      expect(stackContent).toMatch(/tags\s*=\s*local\.common_tags/);
      expect(stackContent).toMatch(/common_tags\s*=\s*{/);
    });

    test("environment variables are consistently set", () => {
      expect(stackContent).toMatch(/ENVIRONMENT\s*=\s*var\.environment_suffix/);
    });
  });

  describe("Advanced IAM Security Tests", () => {
    test("webhook validator IAM role has specific CloudWatch log group permissions", () => {
      expect(stackContent).toMatch(/Resource\s*=\s*"arn:aws:logs:\${var\.aws_region}:\*:log-group:\/aws\/lambda\/\${local\.prefix}-webhook-validator:\*"/);
    });

    test("payment processor IAM role has DynamoDB query permissions", () => {
      expect(stackContent).toMatch(/"dynamodb:Query"/);
    });

    test("notification dispatcher IAM role has SNS publish permissions", () => {
      expect(stackContent).toMatch(/"sns:Publish"/);
    });

    test("archival lambda has S3 object-level permissions", () => {
      expect(stackContent).toMatch(/"s3:GetObject"/);
      expect(stackContent).toMatch(/"s3:PutObject"/);
      expect(stackContent).toMatch(/"s3:DeleteObject"/);
    });

    test("Step Functions role has lambda invoke permissions for all functions", () => {
      expect(stackContent).toMatch(/aws_lambda_function\.webhook_validator\.arn/);
      expect(stackContent).toMatch(/aws_lambda_function\.payment_processor\.arn/);
      expect(stackContent).toMatch(/aws_lambda_function\.notification_dispatcher\.arn/);
    });

    test("API Gateway CloudWatch role uses managed policy", () => {
      expect(stackContent).toMatch(/arn:aws:iam::aws:policy\/service-role\/AmazonAPIGatewayPushToCloudWatchLogs/);
    });
  });

  describe("Detailed Lambda Configuration Tests", () => {
    test("webhook validator has DynamoDB table environment variable", () => {
      expect(stackContent).toMatch(/DYNAMODB_TABLE\s*=\s*aws_dynamodb_table\.webhook_idempotency\.name/);
    });

    test("webhook validator has SQS queue prefix environment variable", () => {
      expect(stackContent).toMatch(/SQS_QUEUE_PREFIX\s*=\s*local\.prefix/);
    });

    test("payment processor has DynamoDB environment variable", () => {
      expect(stackContent).toMatch(/DYNAMODB_TABLE\s*=\s*aws_dynamodb_table\.webhook_idempotency\.name/);
    });

    test("archival lambda has S3 bucket environment variable", () => {
      expect(stackContent).toMatch(/S3_BUCKET\s*=\s*aws_s3_bucket\.payment_archive\.id/);
    });

    test("all Lambda functions have proper depends_on relationships", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[/);
    });

    test("Lambda functions reference ECR repositories correctly", () => {
      expect(stackContent).toMatch(/aws_ecr_repository\.webhook_validator\.repository_url/);
      expect(stackContent).toMatch(/aws_ecr_repository\.payment_processor\.repository_url/);
      expect(stackContent).toMatch(/aws_ecr_repository\.notification_dispatcher\.repository_url/);
    });

    test("archival lambda has lower concurrency", () => {
      expect(stackContent).toMatch(/reserved_concurrent_executions\s*=\s*10/);
    });
  });

  describe("Advanced API Gateway Tests", () => {
    test("API Gateway deployment has proper lifecycle configuration", () => {
      expect(stackContent).toMatch(/create_before_destroy\s*=\s*true/);
    });

    test("API Gateway method settings enable metrics", () => {
      expect(stackContent).toMatch(/metrics_enabled\s*=\s*true/);
    });

    test("API Gateway method settings have INFO logging level", () => {
      expect(stackContent).toMatch(/logging_level\s*=\s*"INFO"/);
    });

    test("API Gateway method settings enable data tracing", () => {
      expect(stackContent).toMatch(/data_trace_enabled\s*=\s*true/);
    });

    test("API Gateway integration uses AWS_PROXY type", () => {
      expect(stackContent).toMatch(/type\s*=\s*"AWS_PROXY"/);
    });

    test("API Gateway integration uses POST method", () => {
      expect(stackContent).toMatch(/integration_http_method\s*=\s*"POST"/);
    });

    test("API Gateway resource uses webhook path part", () => {
      expect(stackContent).toMatch(/path_part\s*=\s*"webhook"/);
    });

    test("API Gateway methods require no authorization", () => {
      expect(stackContent).toMatch(/authorization\s*=\s*"NONE"/);
    });

    test("API Gateway access log format includes request ID", () => {
      expect(stackContent).toMatch(/requestId.*context\.requestId/);
    });

    test("API Gateway access log format includes source IP", () => {
      expect(stackContent).toMatch(/ip.*context\.identity\.sourceIp/);
    });
  });

  describe("Comprehensive DynamoDB Tests", () => {
    test("DynamoDB table uses correct attribute type for webhook_id", () => {
      expect(stackContent).toMatch(/type\s*=\s*"S"/);
    });

    test("DynamoDB table name uses local prefix", () => {
      expect(stackContent).toMatch(/name\s*=\s*"\${local\.prefix}-idempotency"/);
    });

    test("DynamoDB TTL uses processed_timestamp attribute", () => {
      expect(stackContent).toMatch(/attribute_name\s*=\s*"processed_timestamp"/);
    });

    test("DynamoDB point-in-time recovery is explicitly enabled", () => {
      expect(stackContent).toMatch(/point_in_time_recovery\s*{[\s\S]*?enabled\s*=\s*true/);
    });
  });

  describe("Extensive SQS Queue Tests", () => {
    test("SQS processing queues use provider-specific names", () => {
      expect(stackContent).toMatch(/name\s*=\s*"\${local\.prefix}-\${each\.value}-processing"/);
    });

    test("SQS DLQ queues use provider-specific names", () => {
      expect(stackContent).toMatch(/name\s*=\s*"\${local\.prefix}-\${each\.value}-dlq"/);
    });

    test("SQS redrive policy has maxReceiveCount of 3", () => {
      expect(stackContent).toMatch(/maxReceiveCount\s*=\s*3/);
    });

    test("SQS event source mapping uses correct batch size", () => {
      expect(stackContent).toMatch(/batch_size\s*=\s*10/);
    });

    test("SQS queues have proper retention configuration in locals", () => {
      expect(stackContent).toMatch(/sqs_retention_seconds\s*=\s*345600/);
      expect(stackContent).toMatch(/dlq_retention_seconds\s*=\s*1209600/);
    });
  });

  describe("Step Functions Advanced Tests", () => {
    test("Step Functions logging includes execution data", () => {
      expect(stackContent).toMatch(/include_execution_data\s*=\s*true/);
    });

    test("Step Functions logging level is ALL", () => {
      expect(stackContent).toMatch(/level\s*=\s*"ALL"/);
    });

    test("Step Functions ValidateWebhook state has proper retry configuration", () => {
      expect(stackContent).toMatch(/IntervalSeconds\s*=\s*2/);
      expect(stackContent).toMatch(/MaxAttempts\s*=\s*3/);
      expect(stackContent).toMatch(/BackoffRate\s*=\s*2\.0/);
    });

    test("Step Functions FraudDetection uses AWS SDK integration", () => {
      expect(stackContent).toMatch(/arn:aws:states:::aws-sdk:frauddetector:getEventPrediction/);
    });

    test("Step Functions CheckFraudScore uses Choice state", () => {
      expect(stackContent).toMatch(/Type\s*=\s*"Choice"/);
    });

    test("Step Functions has fraud score threshold of 800", () => {
      expect(stackContent).toMatch(/NumericGreaterThan\s*=\s*800/);
    });

    test("Step Functions ProcessPayment has custom exception handling", () => {
      expect(stackContent).toMatch(/PaymentProcessingException/);
    });

    test("Step Functions has proper state transitions", () => {
      expect(stackContent).toMatch(/Next\s*=\s*"FraudDetection"/);
      expect(stackContent).toMatch(/Next\s*=\s*"CheckFraudScore"/);
      expect(stackContent).toMatch(/Next\s*=\s*"ProcessPayment"/);
      expect(stackContent).toMatch(/Next\s*=\s*"SendNotification"/);
    });

    test("Step Functions has error handling states", () => {
      expect(stackContent).toMatch(/Next\s*=\s*"HandleError"/);
      expect(stackContent).toMatch(/Next\s*=\s*"RejectPayment"/);
    });
  });

  describe("EventBridge Detailed Tests", () => {
    test("EventBridge high value payments rule uses numeric filter", () => {
      expect(stackContent).toMatch(/numeric\s*=\s*\[">",\s*10000\]/);
    });

    test("EventBridge rules use payment.processor as source", () => {
      expect(stackContent).toMatch(/source\s*=\s*\["payment\.processor"\]/);
    });

    test("EventBridge payment type rules support credit_card", () => {
      expect(stackContent).toMatch(/"credit_card"/);
    });

    test("EventBridge payment type rules support paypal", () => {
      expect(stackContent).toMatch(/"paypal"/);
    });

    test("EventBridge payment type rules support bank_transfer", () => {
      expect(stackContent).toMatch(/"bank_transfer"/);
    });
  });

  describe("Advanced S3 Configuration Tests", () => {
    test("S3 bucket name includes account ID for uniqueness", () => {
      expect(stackContent).toMatch(/bucket\s*=\s*"\${local\.prefix}-payment-archive-\${data\.aws_caller_identity\.current\.account_id}"/);
    });

    test("S3 intelligent tiering has DEEP_ARCHIVE_ACCESS tier", () => {
      expect(stackContent).toMatch(/access_tier\s*=\s*"DEEP_ARCHIVE_ACCESS"/);
      expect(stackContent).toMatch(/days\s*=\s*180/);
    });

    test("S3 intelligent tiering has ARCHIVE_ACCESS tier", () => {
      expect(stackContent).toMatch(/access_tier\s*=\s*"ARCHIVE_ACCESS"/);
      expect(stackContent).toMatch(/days\s*=\s*90/);
    });

    test("S3 lifecycle rule has specific filter prefix", () => {
      expect(stackContent).toMatch(/prefix\s*=\s*"payments\/"/);
    });

    test("S3 event notification filters on .json suffix", () => {
      expect(stackContent).toMatch(/filter_suffix\s*=\s*"\.json"/);
    });

    test("S3 event notification triggers on all object creation events", () => {
      expect(stackContent).toMatch(/events\s*=\s*\["s3:ObjectCreated:\*"\]/);
    });

    test("S3 bucket versioning configuration status is Enabled", () => {
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("S3 encryption uses AES256 algorithm", () => {
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });
  });

  describe("VPC and Networking Detailed Tests", () => {
    test("VPC has proper CIDR block", () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("VPC enables DNS hostnames", () => {
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });

    test("VPC enables DNS support", () => {
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("private subnets use proper CIDR blocks", () => {
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.\${count\.index \+ 1}\.0\/24"/);
    });

    test("security group allows HTTPS traffic", () => {
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
      expect(stackContent).toMatch(/to_port\s*=\s*443/);
      expect(stackContent).toMatch(/protocol\s*=\s*"tcp"/);
    });

    test("security group has unrestricted egress", () => {
      expect(stackContent).toMatch(/from_port\s*=\s*0/);
      expect(stackContent).toMatch(/to_port\s*=\s*0/);
      expect(stackContent).toMatch(/protocol\s*=\s*"-1"/);
    });

    test("VPC endpoints use Interface type for ECR", () => {
      expect(stackContent).toMatch(/vpc_endpoint_type\s*=\s*"Interface"/);
    });

    test("VPC endpoint for DynamoDB uses Gateway type", () => {
      expect(stackContent).toMatch(/vpc_endpoint_type\s*=\s*"Gateway"/);
    });

    test("VPC endpoints enable private DNS", () => {
      expect(stackContent).toMatch(/private_dns_enabled\s*=\s*true/);
    });

    test("VPC endpoints use main route table for Gateway type", () => {
      expect(stackContent).toMatch(/route_table_ids\s*=\s*\[aws_vpc\.main\.main_route_table_id\]/);
    });
  });

  describe("Resource Naming and Tagging Tests", () => {
    test("ECR repositories use consistent naming pattern", () => {
      expect(stackContent).toMatch(/name\s*=\s*"\${local\.prefix}-webhook-validator"/);
      expect(stackContent).toMatch(/name\s*=\s*"\${local\.prefix}-payment-processor"/);
      expect(stackContent).toMatch(/name\s*=\s*"\${local\.prefix}-notification-dispatcher"/);
    });

    test("CloudWatch log groups use consistent naming pattern", () => {
      expect(stackContent).toMatch(/name\s*=\s*"\/aws\/lambda\/\${local\.prefix}-webhook-validator"/);
      expect(stackContent).toMatch(/name\s*=\s*"\/aws\/apigateway\/\${local\.prefix}"/);
      expect(stackContent).toMatch(/name\s*=\s*"\/aws\/stepfunctions\/\${local\.prefix}"/);
    });

    test("IAM roles use descriptive suffixes", () => {
      expect(stackContent).toMatch(/-webhook-validator-role/);
      expect(stackContent).toMatch(/-payment-processor-role/);
      expect(stackContent).toMatch(/-notification-dispatcher-role/);
      expect(stackContent).toMatch(/-step-functions-role/);
    });

    test("VPC resources use proper naming with merge function", () => {
      expect(stackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags,\s*{/);
    });
  });

  describe("Data Source and Reference Tests", () => {
    test("uses aws_caller_identity data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*{}/);
    });

    test("uses aws_availability_zones data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
      expect(stackContent).toMatch(/state\s*=\s*"available"/);
    });

    test("references availability zones in subnet configuration", () => {
      expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
    });
  });
});
