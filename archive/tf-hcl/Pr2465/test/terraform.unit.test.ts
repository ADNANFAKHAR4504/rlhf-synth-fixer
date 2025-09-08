// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import * as fs from "fs";
import * as path from "path";

const TAP_STACK_TF = path.resolve(__dirname, "../lib/tap_stack.tf");
const tf = fs.readFileSync(TAP_STACK_TF, "utf8");
const has = (regex: RegExp) => regex.test(tf);

describe("tap_stack.tf static verification", () => {
  // 1. File existence and length check
  it("exists and is a non-trivial config file", () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(tf.length).toBeGreaterThan(1000);
  });

  // 2. Required input variables
  it("declares required input variables", () => {
    [
      "aws_region",
      "project_name",
      "environment",
      "owner",
      "db_read_capacity",
      "db_write_capacity",
      "log_retention_days"
    ].forEach(variable =>
      expect(has(new RegExp(`variable\\s+"${variable}"`))).toBe(true)
    );
  });

  // 3. Locals
  it("defines expected locals", () => {
    ["common_tags", "name_prefix"].forEach(local =>
      expect(has(new RegExp(`${local}\\s*=`))).toBe(true)
    );
  });

  // 4. Lambda function
  it("creates aws_lambda_function resource", () => {
    expect(has(/resource\s+"aws_lambda_function"\s+"api_handler"/)).toBe(true);
  });

  it("configures Lambda with Node.js runtime", () => {
    expect(has(/runtime\s*=\s*"nodejs18\.x"/)).toBe(true);
  });

  it("sets Lambda timeout and memory", () => {
    expect(has(/timeout\s*=\s*30/)).toBe(true);
    expect(has(/memory_size\s*=\s*256/)).toBe(true);
  });

  it("configures Lambda environment variables", () => {
    expect(has(/environment\s*{/)).toBe(true);
    expect(has(/DYNAMODB_TABLE_NAME\s*=/)).toBe(true);
  });

  // 5. IAM role and policy for Lambda
  it("defines IAM role for Lambda execution", () => {
    expect(has(/resource\s+"aws_iam_role"\s+"lambda_role"/)).toBe(true);
  });

  it("attaches basic Lambda execution policy", () => {
    expect(has(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_basic_execution"/)).toBe(true);
  });

  it("defines custom IAM policy for DynamoDB access", () => {
    expect(has(/resource\s+"aws_iam_role_policy"\s+"lambda_dynamodb_policy"/)).toBe(true);
  });

  // 6. DynamoDB table
  it("creates aws_dynamodb_table resource", () => {
    expect(has(/resource\s+"aws_dynamodb_table"\s+"main_table"/)).toBe(true);
  });

  it("configures DynamoDB with id as primary key", () => {
    expect(has(/hash_key\s*=\s*"id"/)).toBe(true);
  });

  it("sets DynamoDB read/write capacity", () => {
    expect(has(/read_capacity\s*=\s*var\.db_read_capacity/)).toBe(true);
    expect(has(/write_capacity\s*=\s*var\.db_write_capacity/)).toBe(true);
  });

  it("configures DynamoDB to be retained on destroy", () => {
    expect(has(/lifecycle\s*{/)).toBe(true);
    expect(has(/prevent_destroy\s*=\s*true/)).toBe(true);
  });

  // 7. API Gateway
  it("creates aws_api_gateway_rest_api resource", () => {
    expect(has(/resource\s+"aws_api_gateway_rest_api"\s+"main_api"/)).toBe(true);
  });

  it("enables CORS for API Gateway", () => {
    expect(has(/resource\s+"aws_api_gateway_method"\s+"options_method"/)).toBe(true);
    expect(has(/Access-Control-Allow-Origin/)).toBe(true);
  });

  it("creates API Gateway deployment and stage", () => {
    expect(has(/resource\s+"aws_api_gateway_deployment"/)).toBe(true);
    expect(has(/resource\s+"aws_api_gateway_stage"/)).toBe(true);
  });

  it("configures stage variables", () => {
    expect(has(/stage_name\s*=\s*"dev"/)).toBe(true);
    expect(has(/stage_name\s*=\s*"prod"/)).toBe(true);
  });

  // 8. CloudWatch Logs
  it("creates CloudWatch log group for Lambda", () => {
    expect(has(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_logs"/)).toBe(true);
  });

  it("configures log retention", () => {
    expect(has(/retention_in_days\s*=\s*var\.log_retention_days/)).toBe(true);
  });

  // 9. CloudWatch Alarms
  it("creates error rate alarm", () => {
    expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_error_rate"/)).toBe(true);
  });

  it("configures alarm with 5% threshold", () => {
    expect(has(/threshold\s*=\s*"5"/)).toBe(true);
  });

  // 10. SNS Topic for alerts
  it("creates SNS topic for alerts", () => {
    expect(has(/resource\s+"aws_sns_topic"\s+"alerts"/)).toBe(true);
  });

  it("subscribes CloudWatch alarm to SNS", () => {
    expect(has(/alarm_actions\s*=\s*\[aws_sns_topic\.alerts\.arn\]/)).toBe(true);
  });

  // 11. API Gateway logging
  it("enables API Gateway access logging", () => {
    expect(has(/resource\s+"aws_cloudwatch_log_group"\s+"api_gateway_logs"/)).toBe(true);
    expect(has(/access_log_settings/)).toBe(true);
  });

  // 12. Outputs
  it("defines expected outputs", () => {
    const expectedOutputs = [
      "api_gateway_url_dev",
      "api_gateway_url_prod",
      "dynamodb_table_name",
      "lambda_function_name",
      "sns_topic_arn"
    ];

    expectedOutputs.forEach(output =>
      expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true)
    );
  });

  // 13. No sensitive data in outputs
  it("does not expose sensitive outputs", () => {
    expect(has(/output\s+.*(secret|password|access_key|secret_key)/i)).toBe(false);
  });

  // 14. Provider configuration
  it("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
    expect(tf).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  // 15. Tags
  it("applies common tags to resources", () => {
    expect(has(/tags\s*=\s*local\.common_tags/)).toBe(true);
  });
});
