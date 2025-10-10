// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Validates all requirements from PROMPT.md without running terraform commands

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const VARIABLES_REL = "../lib/variables.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const variablesPath = path.resolve(__dirname, VARIABLES_REL);

describe("Terraform Infrastructure Validation", () => {
  let stackContent: string;
  let variablesContent: string;

  beforeAll(() => {
    // Read files once for all tests
    stackContent = fs.readFileSync(stackPath, "utf8");
    variablesContent = fs.readFileSync(variablesPath, "utf8");
  });

  describe("File Structure Validation", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("variables.tf exists", () => {
      expect(fs.existsSync(variablesPath)).toBe(true);
    });

    test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });
  });

  describe("Variables Validation", () => {
    test("declares aws_region variable", () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("declares project_prefix variable", () => {
      expect(variablesContent).toMatch(/variable\s+"project_prefix"\s*{/);
    });

    test("declares environment_suffix variable", () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("declares tags variable", () => {
      expect(variablesContent).toMatch(/variable\s+"tags"\s*{/);
    });

    test("declares all SQS configuration variables", () => {
      const sqsVariables = [
        "sqs_visibility_timeout_seconds",
        "sqs_message_retention_seconds",
        "sqs_receive_wait_time_seconds",
        "sqs_max_receive_count",
        "sqs_kms_master_key_id"
      ];

      sqsVariables.forEach(variable => {
        expect(variablesContent).toMatch(new RegExp(`variable\\s+"${variable}"\\s*{`));
      });
    });

    test("declares all Lambda configuration variables", () => {
      const lambdaVariables = [
        "lambda_memory_size",
        "lambda_timeout",
        "lambda_batch_size",
        "lambda_maximum_batching_window_in_seconds",
        "lambda_log_retention_days",
        "lambda_reserved_concurrent_executions"
      ];

      lambdaVariables.forEach(variable => {
        expect(variablesContent).toMatch(new RegExp(`variable\\s+"${variable}"\\s*{`));
      });
    });

    test("declares all DynamoDB configuration variables", () => {
      const dynamodbVariables = [
        "dynamodb_ttl_enabled",
        "dynamodb_ttl_attribute_name"
      ];

      dynamodbVariables.forEach(variable => {
        expect(variablesContent).toMatch(new RegExp(`variable\\s+"${variable}"\\s*{`));
      });
    });

    test("declares all alarm configuration variables", () => {
      const alarmVariables = [
        "alarm_age_of_oldest_message_threshold",
        "alarm_messages_visible_threshold"
      ];

      alarmVariables.forEach(variable => {
        expect(variablesContent).toMatch(new RegExp(`variable\\s+"${variable}"\\s*{`));
      });
    });
  });

  describe("SQS Resources Validation", () => {
    test("creates SQS Dead Letter Queue", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"dlq"\s*{/);
    });

    test("creates SQS Main Queue", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"\s+"main"\s*{/);
    });

    test("DLQ has proper configuration", () => {
      expect(stackContent).toMatch(/name\s*=\s*"\$\{var\.project_prefix\}-\$\{var\.environment_suffix\}-dlq"/);
      expect(stackContent).toMatch(/message_retention_seconds\s*=\s*var\.sqs_message_retention_seconds/);
      expect(stackContent).toMatch(/visibility_timeout_seconds\s*=\s*30/);
    });

    test("Main Queue has redrive policy to DLQ", () => {
      expect(stackContent).toMatch(/redrive_policy\s*=\s*jsonencode\(/);
      expect(stackContent).toMatch(/deadLetterTargetArn\s*=\s*aws_sqs_queue\.dlq\.arn/);
      expect(stackContent).toMatch(/maxReceiveCount\s*=\s*var\.sqs_max_receive_count/);
    });

    test("Both queues have SSE encryption enabled", () => {
      expect(stackContent).toMatch(/sqs_managed_sse_enabled\s*=\s*var\.sqs_kms_master_key_id\s*==\s*null\s*\?\s*true\s*:\s*false/);
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*var\.sqs_kms_master_key_id/);
    });

    test("Both queues have long polling enabled", () => {
      expect(stackContent).toMatch(/receive_wait_time_seconds\s*=\s*var\.sqs_receive_wait_time_seconds/);
    });

    test("Both queues have proper tagging", () => {
      expect(stackContent).toMatch(/tags\s*=\s*var\.tags/);
    });
  });

  describe("DynamoDB Resources Validation", () => {
    test("creates DynamoDB table for task status", () => {
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"task_status"\s*{/);
    });

    test("DynamoDB table has proper configuration", () => {
      expect(stackContent).toMatch(/name\s*=\s*"\$\{var\.project_prefix\}-\$\{var\.environment_suffix\}-task-status"/);
      expect(stackContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
      expect(stackContent).toMatch(/hash_key\s*=\s*"task_id"/);
    });

    test("DynamoDB table has task_id attribute", () => {
      expect(stackContent).toMatch(/attribute\s*{\s*name\s*=\s*"task_id"\s*type\s*=\s*"S"\s*}/);
    });

    test("DynamoDB table has optional TTL configuration", () => {
      expect(stackContent).toMatch(/dynamic\s+"ttl"\s*{/);
      expect(stackContent).toMatch(/for_each\s*=\s*var\.dynamodb_ttl_enabled\s*\?\s*\[1\]\s*:\s*\[\]/);
      expect(stackContent).toMatch(/attribute_name\s*=\s*var\.dynamodb_ttl_attribute_name/);
    });

    test("DynamoDB table has proper tagging", () => {
      expect(stackContent).toMatch(/tags\s*=\s*var\.tags/);
    });
  });

  describe("IAM Resources Validation", () => {
    test("creates Lambda execution role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_execution"\s*{/);
    });

    test("Lambda role has proper assume role policy", () => {
      expect(stackContent).toMatch(/assume_role_policy\s*=\s*jsonencode\(/);
      expect(stackContent).toMatch(/Service\s*=\s*"lambda\.amazonaws\.com"/);
    });

    test("creates Lambda permissions policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambda_permissions"\s*{/);
    });

    test("Lambda policy has SQS permissions", () => {
      expect(stackContent).toMatch(/"sqs:ReceiveMessage"/);
      expect(stackContent).toMatch(/"sqs:DeleteMessage"/);
      expect(stackContent).toMatch(/"sqs:GetQueueAttributes"/);
    });

    test("Lambda policy has DynamoDB permissions", () => {
      expect(stackContent).toMatch(/"dynamodb:PutItem"/);
      expect(stackContent).toMatch(/"dynamodb:UpdateItem"/);
    });

    test("Lambda policy has CloudWatch Logs permissions", () => {
      expect(stackContent).toMatch(/"logs:CreateLogGroup"/);
      expect(stackContent).toMatch(/"logs:CreateLogStream"/);
      expect(stackContent).toMatch(/"logs:PutLogEvents"/);
    });

    test("Lambda policy follows least privilege principle", () => {
      // Check that SQS permissions are scoped to main queue only
      expect(stackContent).toMatch(/Resource\s*=\s*aws_sqs_queue\.main\.arn/);
      // Check that DynamoDB permissions are scoped to task_status table only
      expect(stackContent).toMatch(/Resource\s*=\s*aws_dynamodb_table\.task_status\.arn/);
    });
  });

  describe("Lambda Resources Validation", () => {
    test("creates CloudWatch log group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_logs"\s*{/);
    });

    test("CloudWatch log group has proper configuration", () => {
      expect(stackContent).toMatch(/name\s*=\s*"\/aws\/lambda\/\$\{var\.project_prefix\}-\$\{var\.environment_suffix\}-processor"/);
      expect(stackContent).toMatch(/retention_in_days\s*=\s*var\.lambda_log_retention_days/);
    });

    test("creates Lambda function code archive", () => {
      expect(stackContent).toMatch(/data\s+"archive_file"\s+"lambda_code"\s*{/);
    });

    test("Lambda code archive has Node.js 20 code with AWS SDK v3", () => {
      expect(stackContent).toMatch(/import.*@aws-sdk\/client-dynamodb/);
      expect(stackContent).toMatch(/import.*@aws-sdk\/lib-dynamodb/);
      expect(stackContent).toMatch(/runtime\s*=\s*"nodejs20\.x"/);
    });

    test("creates Lambda function", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"processor"\s*{/);
    });

    test("Lambda function has proper configuration", () => {
      expect(stackContent).toMatch(/function_name\s*=\s*"\$\{var\.project_prefix\}-\$\{var\.environment_suffix\}-processor"/);
      expect(stackContent).toMatch(/handler\s*=\s*"index\.handler"/);
      expect(stackContent).toMatch(/timeout\s*=\s*var\.lambda_timeout/);
      expect(stackContent).toMatch(/memory_size\s*=\s*var\.lambda_memory_size/);
    });

    test("Lambda function has environment variables", () => {
      expect(stackContent).toMatch(/environment\s*{/);
      expect(stackContent).toMatch(/DYNAMODB_TABLE_NAME\s*=\s*aws_dynamodb_table\.task_status\.name/);
    });

    test("creates SQS event source mapping", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"\s+"sqs_trigger"\s*{/);
    });

    test("Event source mapping has proper configuration", () => {
      expect(stackContent).toMatch(/event_source_arn\s*=\s*aws_sqs_queue\.main\.arn/);
      expect(stackContent).toMatch(/function_name\s*=\s*aws_lambda_function\.processor\.arn/);
      expect(stackContent).toMatch(/batch_size\s*=\s*var\.lambda_batch_size/);
      expect(stackContent).toMatch(/maximum_batching_window_in_seconds\s*=\s*var\.lambda_maximum_batching_window_in_seconds/);
      expect(stackContent).toMatch(/enabled\s*=\s*true/);
    });
  });

  describe("CloudWatch Alarms Validation", () => {
    test("creates alarm for queue old messages", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"queue_old_messages"\s*{/);
    });

    test("queue old messages alarm has proper configuration", () => {
      expect(stackContent).toMatch(/metric_name\s*=\s*"ApproximateAgeOfOldestMessage"/);
      expect(stackContent).toMatch(/namespace\s*=\s*"AWS\/SQS"/);
      expect(stackContent).toMatch(/threshold\s*=\s*var\.alarm_age_of_oldest_message_threshold/);
    });

    test("creates alarm for queue backlog", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"queue_backlog"\s*{/);
    });

    test("queue backlog alarm has proper configuration", () => {
      expect(stackContent).toMatch(/metric_name\s*=\s*"ApproximateNumberOfMessagesVisible"/);
      expect(stackContent).toMatch(/threshold\s*=\s*var\.alarm_messages_visible_threshold/);
    });

    test("creates alarm for Lambda errors", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors"\s*{/);
    });

    test("Lambda errors alarm has proper configuration", () => {
      expect(stackContent).toMatch(/metric_name\s*=\s*"Errors"/);
      expect(stackContent).toMatch(/namespace\s*=\s*"AWS\/Lambda"/);
      expect(stackContent).toMatch(/threshold\s*=\s*"10"/);
    });

    test("creates alarm for Lambda throttles", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_throttles"\s*{/);
    });

    test("Lambda throttles alarm has proper configuration", () => {
      expect(stackContent).toMatch(/metric_name\s*=\s*"Throttles"/);
      expect(stackContent).toMatch(/namespace\s*=\s*"AWS\/Lambda"/);
      expect(stackContent).toMatch(/threshold\s*=\s*"5"/);
    });

    test("creates alarm for DLQ messages", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"dlq_messages"\s*{/);
    });

    test("DLQ messages alarm has proper configuration", () => {
      expect(stackContent).toMatch(/metric_name\s*=\s*"ApproximateNumberOfMessagesVisible"/);
      expect(stackContent).toMatch(/threshold\s*=\s*"0"/);
      expect(stackContent).toMatch(/evaluation_periods\s*=\s*"1"/);
    });

    test("All alarms have proper tagging", () => {
      expect(stackContent).toMatch(/tags\s*=\s*var\.tags/);
    });
  });

  describe("Outputs Validation", () => {
    test("outputs main queue URL and ARN", () => {
      expect(stackContent).toMatch(/output\s+"main_queue_url"\s*{/);
      expect(stackContent).toMatch(/output\s+"main_queue_arn"\s*{/);
      expect(stackContent).toMatch(/value\s*=\s*aws_sqs_queue\.main\.url/);
      expect(stackContent).toMatch(/value\s*=\s*aws_sqs_queue\.main\.arn/);
    });

    test("outputs DLQ URL and ARN", () => {
      expect(stackContent).toMatch(/output\s+"dlq_url"\s*{/);
      expect(stackContent).toMatch(/output\s+"dlq_arn"\s*{/);
      expect(stackContent).toMatch(/value\s*=\s*aws_sqs_queue\.dlq\.url/);
      expect(stackContent).toMatch(/value\s*=\s*aws_sqs_queue\.dlq\.arn/);
    });

    test("outputs Lambda function ARN", () => {
      expect(stackContent).toMatch(/output\s+"lambda_function_arn"\s*{/);
      expect(stackContent).toMatch(/value\s*=\s*aws_lambda_function\.processor\.arn/);
    });

    test("outputs event source mapping UUID", () => {
      expect(stackContent).toMatch(/output\s+"event_source_mapping_uuid"\s*{/);
      expect(stackContent).toMatch(/value\s*=\s*aws_lambda_event_source_mapping\.sqs_trigger\.uuid/);
    });

    test("outputs DynamoDB table name and ARN", () => {
      expect(stackContent).toMatch(/output\s+"dynamodb_table_name"\s*{/);
      expect(stackContent).toMatch(/output\s+"dynamodb_table_arn"\s*{/);
      expect(stackContent).toMatch(/value\s*=\s*aws_dynamodb_table\.task_status\.name/);
      expect(stackContent).toMatch(/value\s*=\s*aws_dynamodb_table\.task_status\.arn/);
    });

    test("outputs alarm ARNs", () => {
      expect(stackContent).toMatch(/output\s+"alarm_arns"\s*{/);
      expect(stackContent).toMatch(/queue_old_messages\s*=\s*aws_cloudwatch_metric_alarm\.queue_old_messages\.arn/);
      expect(stackContent).toMatch(/queue_backlog\s*=\s*aws_cloudwatch_metric_alarm\.queue_backlog\.arn/);
      expect(stackContent).toMatch(/lambda_errors\s*=\s*aws_cloudwatch_metric_alarm\.lambda_errors\.arn/);
      expect(stackContent).toMatch(/lambda_throttles\s*=\s*aws_cloudwatch_metric_alarm\.lambda_throttles\.arn/);
      expect(stackContent).toMatch(/dlq_messages\s*=\s*aws_cloudwatch_metric_alarm\.dlq_messages\.arn/);
    });
  });

  describe("Validation and Best Practices", () => {
    test("has timeout validation between Lambda and SQS", () => {
      expect(stackContent).toMatch(/resource\s+"null_resource"\s+"validate_timeouts"\s*{/);
      expect(stackContent).toMatch(/precondition\s*{/);
      expect(stackContent).toMatch(/condition\s*=\s*var\.lambda_timeout\s*<\s*var\.sqs_visibility_timeout_seconds/);
    });

    test("has operational notes and comments", () => {
      expect(stackContent).toMatch(/\/\*[\s\S]*OPERATIONAL NOTES:/);
      expect(stackContent).toMatch(/Visibility Timeout vs Lambda Timeout/);
      expect(stackContent).toMatch(/Batch Processing/);
      expect(stackContent).toMatch(/DLQ Strategy/);
      expect(stackContent).toMatch(/Cost Optimization/);
      expect(stackContent).toMatch(/Scaling/);
    });

    test("uses proper resource dependencies", () => {
      // Lambda function depends on IAM role
      expect(stackContent).toMatch(/role\s*=\s*aws_iam_role\.lambda_execution\.arn/);
      // Event source mapping depends on Lambda and SQS
      expect(stackContent).toMatch(/function_name\s*=\s*aws_lambda_function\.processor\.arn/);
      expect(stackContent).toMatch(/event_source_arn\s*=\s*aws_sqs_queue\.main\.arn/);
      // Lambda depends on DynamoDB table
      expect(stackContent).toMatch(/DYNAMODB_TABLE_NAME\s*=\s*aws_dynamodb_table\.task_status\.name/);
    });

    test("follows security best practices", () => {
      // SQS has encryption enabled
      expect(stackContent).toMatch(/sqs_managed_sse_enabled/);
      // IAM policies use least privilege
      expect(stackContent).toMatch(/Resource\s*=\s*aws_sqs_queue\.main\.arn/);
      expect(stackContent).toMatch(/Resource\s*=\s*aws_dynamodb_table\.task_status\.arn/);
      // All resources have tags
      expect(stackContent).toMatch(/tags\s*=\s*var\.tags/);
    });
  });

  describe("Resource Naming and Structure", () => {
    test("uses consistent naming with project prefix and environment suffix", () => {
      expect(stackContent).toMatch(/\$\{var\.project_prefix\}-\$\{var\.environment_suffix\}-dlq/);
      expect(stackContent).toMatch(/\$\{var\.project_prefix\}-\$\{var\.environment_suffix\}-queue/);
      expect(stackContent).toMatch(/\$\{var\.project_prefix\}-\$\{var\.environment_suffix\}-task-status/);
      expect(stackContent).toMatch(/\$\{var\.project_prefix\}-\$\{var\.environment_suffix\}-lambda-execution-role/);
      expect(stackContent).toMatch(/\$\{var\.project_prefix\}-\$\{var\.environment_suffix\}-processor/);
    });

    test("has proper resource organization", () => {
      // SQS resources first
      expect(stackContent.indexOf('resource "aws_sqs_queue" "dlq"')).toBeLessThan(stackContent.indexOf('resource "aws_dynamodb_table"'));
      // DynamoDB after SQS
      expect(stackContent.indexOf('resource "aws_dynamodb_table"')).toBeLessThan(stackContent.indexOf('resource "aws_iam_role"'));
      // IAM before Lambda
      expect(stackContent.indexOf('resource "aws_iam_role"')).toBeLessThan(stackContent.indexOf('resource "aws_lambda_function"'));
      // Lambda before alarms
      expect(stackContent.indexOf('resource "aws_lambda_function"')).toBeLessThan(stackContent.indexOf('resource "aws_cloudwatch_metric_alarm"'));
    });
  });
});
