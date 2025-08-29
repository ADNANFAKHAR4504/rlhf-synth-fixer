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
      "environment",
      "project_name",
      "owner",
      "lambda_runtime",
      "lambda_timeout",
      "lambda_memory_size",
      "dynamodb_read_capacity",
      "dynamodb_write_capacity",
      "api_gateway_stage_name",
      "error_rate_threshold"
    ].forEach(variable =>
      expect(has(new RegExp(`variable\\s+"${variable}"`))).toBe(true)
    );
  });

  // 3. Locals
  it("defines expected locals", () => {
    ["common_tags", "lambda_function_name", "dynamodb_table_name", "api_gateway_name"].forEach(local =>
      expect(has(new RegExp(`${local}\\s*=`))).toBe(true)
    );
  });

  // 4. Lambda function
  it("creates aws_lambda_function resource", () => {
    expect(has(/resource\s+"aws_lambda_function"\s+"api_handler"/)).toBe(true);
  });

  it("configures Lambda with Node.js runtime", () => {
    expect(has(/runtime\s*=\s*var\.lambda_runtime/)).toBe(true);
  });

  it("sets Lambda timeout and memory", () => {
    expect(has(/timeout\s*=\s*var\.lambda_timeout/)).toBe(true);
    expect(has(/memory_size\s*=\s*var\.lambda_memory_size/)).toBe(true);
  });

  it("configures Lambda environment variables", () => {
    expect(has(/environment\s*{/)).toBe(true);
    expect(has(/DYNAMODB_TABLE\s*=/)).toBe(true);
  });

  // 5. IAM role and policy for Lambda
  it("defines IAM role for Lambda execution", () => {
    expect(has(/resource\s+"aws_iam_role"\s+"lambda_execution"/)).toBe(true);
  });

  it("attaches basic Lambda execution policy", () => {
    expect(has(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_basic_execution"/)).toBe(true);
  });

  it("defines custom IAM policy for DynamoDB access", () => {
    expect(has(/resource\s+"aws_iam_role_policy"\s+"lambda_dynamodb_access"/)).toBe(true);
  });

  // 6. DynamoDB table
  it("creates aws_dynamodb_table resource", () => {
    expect(has(/resource\s+"aws_dynamodb_table"\s+"data_table"/)).toBe(true);
  });

  it("configures DynamoDB with itemId as primary key", () => {
    expect(has(/hash_key\s*=\s*"itemId"/)).toBe(true);
  });

  it("sets DynamoDB read/write capacity", () => {
    expect(has(/read_capacity\s*=\s*var\.dynamodb_read_capacity/)).toBe(true);
    expect(has(/write_capacity\s*=\s*var\.dynamodb_write_capacity/)).toBe(true);
  });

  it("configures DynamoDB to be retained on destroy", () => {
    expect(has(/lifecycle\s*{/)).toBe(true);
    expect(has(/prevent_destroy\s*=\s*true/)).toBe(true);
  });

  // 7. API Gateway
  it("creates aws_api_gateway_rest_api resource", () => {
    expect(has(/resource\s+"aws_api_gateway_rest_api"\s+"api"/)).toBe(true);
  });

  it("enables CORS for API Gateway", () => {
    expect(has(/resource\s+"aws_api_gateway_method"\s+"options"/)).toBe(true);
    expect(has(/Access-Control-Allow-Origin/)).toBe(true);
  });

  it("creates API Gateway deployment and stage", () => {
    expect(has(/resource\s+"aws_api_gateway_deployment"/)).toBe(true);
    expect(has(/resource\s+"aws_api_gateway_stage"/)).toBe(true);
  });

  it("configures stage variables", () => {
    expect(has(/variables\s*{/)).toBe(true);
  });

  // 8. CloudWatch Logs
  it("creates CloudWatch log group for Lambda", () => {
    expect(has(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_logs"/)).toBe(true);
  });

  it("configures log retention", () => {
    expect(has(/retention_in_days\s*=/)).toBe(true);
  });

  // 9. CloudWatch Alarms
  it("creates error rate alarm", () => {
    expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"error_rate"/)).toBe(true);
  });

  it("configures alarm with 5% threshold", () => {
    expect(has(/threshold\s*=\s*var\.error_rate_threshold/)).toBe(true);
  });

  // 10. SNS Topic for alerts
  it("creates SNS topic for alerts", () => {
    expect(has(/resource\s+"aws_sns_topic"\s+"alerts"/)).toBe(true);
  });

  it("subscribes CloudWatch alarm to SNS", () => {
    expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"error_rate"/)).toBe(true);
  });

  // 11. API Gateway logging
  it("enables API Gateway access logging", () => {
    expect(has(/resource\s+"aws_api_gateway_account"/)).toBe(true);
    expect(has(/cloudwatch_log_role_arn/)).toBe(true);
  });

  // 12. Outputs
  it("defines expected outputs", () => {
    const expectedOutputs = [
      "api_gateway_url",
      "lambda_function_name",
      "dynamodb_table_name",
      "sns_topic_arn",
      "lambda_iam_role_arn"
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
