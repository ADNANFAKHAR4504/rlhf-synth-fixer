// tests/unit/unit-tests.ts
// Unit tests for Terraform webhook processing infrastructure
// No Terraform commands are executed - only static file checks

import fs from "fs";
import path from "path";

const libPath = path.resolve(__dirname, "../lib");

describe("Terraform Webhook Infrastructure Unit Tests", () => {

  describe("Required Terraform Files", () => {
    const requiredFiles = [
      "provider.tf",
      "variables.tf",
      "main.tf",
      "api_gateway.tf",
      "lambda.tf",
      "dynamodb.tf",
      "sqs.tf",
      "eventbridge.tf",
      "monitoring.tf",
      "iam.tf",
      "secrets.tf",
      "outputs.tf"
    ];

    requiredFiles.forEach(file => {
      test(`${file} exists`, () => {
        const filePath = path.join(libPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe("Provider Configuration", () => {
    test("provider.tf declares AWS provider", () => {
      const content = fs.readFileSync(path.join(libPath, "provider.tf"), "utf8");
      expect(content).toMatch(/provider\s+"aws"\s*{/);
      expect(content).toMatch(/terraform\s*{/);
      expect(content).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
    });

    test("provider.tf includes archive provider for Lambda", () => {
      const content = fs.readFileSync(path.join(libPath, "provider.tf"), "utf8");
      expect(content).toMatch(/archive\s*=\s*{/);
    });
  });

  describe("Variables Configuration", () => {
    test("variables.tf declares required variables", () => {
      const content = fs.readFileSync(path.join(libPath, "variables.tf"), "utf8");
      expect(content).toMatch(/variable\s+"aws_region"\s*{/);
      expect(content).toMatch(/variable\s+"environment_suffix"\s*{/);
      expect(content).toMatch(/variable\s+"project_name"\s*{/);
      expect(content).toMatch(/variable\s+"environment"\s*{/);
      expect(content).toMatch(/variable\s+"lambda_timeout"\s*{/);
      expect(content).toMatch(/variable\s+"lambda_memory"\s*{/);
    });

    test("variables.tf has correct default region", () => {
      const content = fs.readFileSync(path.join(libPath, "variables.tf"), "utf8");
      expect(content).toMatch(/default\s*=\s*"us-east-2"/);
    });
  });

  describe("API Gateway Configuration", () => {
    test("api_gateway.tf declares REST API resources", () => {
      const content = fs.readFileSync(path.join(libPath, "api_gateway.tf"), "utf8");
      expect(content).toMatch(/resource\s+"aws_api_gateway_rest_api"/);
      expect(content).toMatch(/resource\s+"aws_api_gateway_resource"/);
      expect(content).toMatch(/resource\s+"aws_api_gateway_method"/);
      expect(content).toMatch(/resource\s+"aws_api_gateway_deployment"/);
      expect(content).toMatch(/resource\s+"aws_api_gateway_stage"/);
    });

    test("api_gateway.tf enables X-Ray tracing", () => {
      const content = fs.readFileSync(path.join(libPath, "api_gateway.tf"), "utf8");
      expect(content).toMatch(/xray_tracing_enabled\s*=\s*true/);
    });

    test("api_gateway.tf configures POST method for webhook", () => {
      const content = fs.readFileSync(path.join(libPath, "api_gateway.tf"), "utf8");
      expect(content).toMatch(/http_method\s*=\s*"POST"/);
      expect(content).toMatch(/path_part\s*=\s*"webhook"/);
    });
  });

  describe("Lambda Configuration", () => {
    test("lambda.tf declares validation and routing functions", () => {
      const content = fs.readFileSync(path.join(libPath, "lambda.tf"), "utf8");
      expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"webhook_validation"/);
      expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"webhook_routing"/);
    });

    test("lambda.tf uses Node.js 20 runtime", () => {
      const content = fs.readFileSync(path.join(libPath, "lambda.tf"), "utf8");
      expect(content).toMatch(/runtime\s*=\s*"nodejs20\.x"/g);
    });

    test("lambda.tf enables X-Ray tracing", () => {
      const content = fs.readFileSync(path.join(libPath, "lambda.tf"), "utf8");
      expect(content).toMatch(/tracing_config\s*{[^}]*mode\s*=\s*"Active"/);
    });

    test("lambda.tf sets reserved concurrent executions", () => {
      const content = fs.readFileSync(path.join(libPath, "lambda.tf"), "utf8");
      expect(content).toMatch(/reserved_concurrent_executions\s*=\s*\d+/);
    });

    test("Lambda function code exists", () => {
      expect(fs.existsSync(path.join(libPath, "lambda/validation/index.js"))).toBe(true);
      expect(fs.existsSync(path.join(libPath, "lambda/routing/index.js"))).toBe(true);
    });
  });

  describe("SQS Configuration", () => {
    test("sqs.tf declares processing and DLQ queues", () => {
      const content = fs.readFileSync(path.join(libPath, "sqs.tf"), "utf8");
      expect(content).toMatch(/resource\s+"aws_sqs_queue"\s+"webhook_processing"/);
      expect(content).toMatch(/resource\s+"aws_sqs_queue"\s+"webhook_dlq"/);
    });

    test("sqs.tf configures visibility timeout correctly", () => {
      const content = fs.readFileSync(path.join(libPath, "sqs.tf"), "utf8");
      // Should be 6 times Lambda timeout
      expect(content).toMatch(/visibility_timeout_seconds\s*=\s*var\.lambda_timeout\s*\*\s*6/);
    });

    test("sqs.tf enables encryption", () => {
      const content = fs.readFileSync(path.join(libPath, "sqs.tf"), "utf8");
      expect(content).toMatch(/kms_master_key_id\s*=\s*"alias\/aws\/sqs"/g);
    });

    test("sqs.tf configures redrive policy", () => {
      const content = fs.readFileSync(path.join(libPath, "sqs.tf"), "utf8");
      expect(content).toMatch(/redrive_policy\s*=\s*jsonencode/);
      expect(content).toMatch(/maxReceiveCount\s*=\s*3/);
    });
  });

  describe("DynamoDB Configuration", () => {
    test("dynamodb.tf declares webhook logs table", () => {
      const content = fs.readFileSync(path.join(libPath, "dynamodb.tf"), "utf8");
      expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"webhook_logs"/);
    });

    test("dynamodb.tf uses on-demand billing", () => {
      const content = fs.readFileSync(path.join(libPath, "dynamodb.tf"), "utf8");
      expect(content).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
    });

    test("dynamodb.tf configures global secondary indexes", () => {
      const content = fs.readFileSync(path.join(libPath, "dynamodb.tf"), "utf8");
      expect(content).toMatch(/global_secondary_index\s*{/);
      expect(content).toMatch(/source-timestamp-index/);
      expect(content).toMatch(/status-timestamp-index/);
    });

    test("dynamodb.tf enables point-in-time recovery", () => {
      const content = fs.readFileSync(path.join(libPath, "dynamodb.tf"), "utf8");
      expect(content).toMatch(/point_in_time_recovery\s*{[^}]*enabled\s*=\s*true/);
    });
  });

  describe("EventBridge Configuration", () => {
    test("eventbridge.tf declares custom event bus", () => {
      const content = fs.readFileSync(path.join(libPath, "eventbridge.tf"), "utf8");
      expect(content).toMatch(/resource\s+"aws_cloudwatch_event_bus"\s+"webhook_events"/);
    });

    test("eventbridge.tf declares event rule", () => {
      const content = fs.readFileSync(path.join(libPath, "eventbridge.tf"), "utf8");
      expect(content).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"webhook_processed"/);
    });

    test("eventbridge.tf configures event archive with 7 day retention", () => {
      const content = fs.readFileSync(path.join(libPath, "eventbridge.tf"), "utf8");
      expect(content).toMatch(/resource\s+"aws_cloudwatch_event_archive"/);
      expect(content).toMatch(/retention_days\s*=\s*7/);
    });
  });

  describe("CloudWatch Monitoring", () => {
    test("monitoring.tf declares log groups", () => {
      const content = fs.readFileSync(path.join(libPath, "monitoring.tf"), "utf8");
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"validation_lambda"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"routing_lambda"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"api_gateway"/);
    });

    test("monitoring.tf sets log retention", () => {
      const content = fs.readFileSync(path.join(libPath, "monitoring.tf"), "utf8");
      expect(content).toMatch(/retention_in_days\s*=\s*var\.log_retention_days/);
    });

    test("monitoring.tf declares CloudWatch alarms", () => {
      const content = fs.readFileSync(path.join(libPath, "monitoring.tf"), "utf8");
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"webhook_errors"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dlq_messages"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_4xx_errors"/);
    });

    test("monitoring.tf declares SNS topic for alerts", () => {
      const content = fs.readFileSync(path.join(libPath, "monitoring.tf"), "utf8");
      expect(content).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
    });
  });

  describe("IAM Configuration", () => {
    test("iam.tf declares Lambda execution roles", () => {
      const content = fs.readFileSync(path.join(libPath, "iam.tf"), "utf8");
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"webhook_validation_lambda"/);
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"webhook_routing_lambda"/);
    });

    test("iam.tf attaches necessary policies", () => {
      const content = fs.readFileSync(path.join(libPath, "iam.tf"), "utf8");
      expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"validation_lambda_policy"/);
      expect(content).toMatch(/resource\s+"aws_iam_role_policy"\s+"routing_lambda_policy"/);
    });

    test("iam.tf follows least privilege principle", () => {
      const content = fs.readFileSync(path.join(libPath, "iam.tf"), "utf8");
      expect(content).toMatch(/AWSLambdaBasicExecutionRole/);
      expect(content).toMatch(/AWSXRayDaemonWriteAccess/);
    });
  });

  describe("Secrets Manager Configuration", () => {
    test("secrets.tf declares webhook secrets", () => {
      const content = fs.readFileSync(path.join(libPath, "secrets.tf"), "utf8");
      expect(content).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"webhook_secrets"/);
      expect(content).toMatch(/resource\s+"aws_secretsmanager_secret_version"/);
    });
  });

  describe("Outputs Configuration", () => {
    test("outputs.tf declares all necessary outputs", () => {
      const content = fs.readFileSync(path.join(libPath, "outputs.tf"), "utf8");
      expect(content).toMatch(/output\s+"api_gateway_url"/);
      expect(content).toMatch(/output\s+"sqs_queue_url"/);
      expect(content).toMatch(/output\s+"dlq_url"/);
      expect(content).toMatch(/output\s+"dynamodb_table_name"/);
      expect(content).toMatch(/output\s+"event_bus_name"/);
      expect(content).toMatch(/output\s+"validation_lambda_function_name"/);
      expect(content).toMatch(/output\s+"routing_lambda_function_name"/);
      expect(content).toMatch(/output\s+"secret_arn"/);
      expect(content).toMatch(/output\s+"sns_topic_arn"/);
    });
  });

  describe("Resource Naming and Tagging", () => {
    test("main.tf uses resource prefix with environment suffix", () => {
      const content = fs.readFileSync(path.join(libPath, "main.tf"), "utf8");
      expect(content).toMatch(/resource_prefix\s*=/);
      expect(content).toMatch(/env_suffix/);
    });

    test("main.tf defines common tags", () => {
      const content = fs.readFileSync(path.join(libPath, "main.tf"), "utf8");
      expect(content).toMatch(/common_tags\s*=/);
      // Check variables.tf for tag definitions
      const varsContent = fs.readFileSync(path.join(libPath, "variables.tf"), "utf8");
      expect(varsContent).toMatch(/Environment/);
      expect(varsContent).toMatch(/Project/);
      expect(varsContent).toMatch(/ManagedBy/);
    });
  });
});
