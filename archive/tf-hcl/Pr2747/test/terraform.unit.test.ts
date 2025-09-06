// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf"; // adjust if your structure differs
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform single-file stack: tap_stack.tf", () => {
  test("tap_stack.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  // --- Optional sanity checks (keep lightweight) ---

  test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("declares aws_region variable in tap_stack.tf", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test('defines an S3 bucket with AES256 server-side encryption and public access block', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
    expect(content).toMatch(/sse_algorithm\s*=\s*"AES256"/i);
    // verify the public access block resource and that public blocking is enabled
    expect(content).toMatch(/aws_s3_bucket_public_access_block/);
    expect(content).toMatch(/block_public_policy\s*=\s*true/);
  });

  test('defines a Lambda function with runtime nodejs14.x and timeout configured', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"secure_function"/);
    expect(content).toMatch(/runtime\s*=\s*"nodejs14\.x"/);
    expect(content).toMatch(/timeout\s*=\s*var\.lambda_timeout/);
  });

  test('CloudWatch log group has a kms_key_id reference', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"lambda_logs"/);
    expect(content).toMatch(/kms_key_id\s*=\s*aws_kms_key\.cloudwatch_logs\.arn/);
  });

  test('CloudWatch alarm for Lambda errors is configured (threshold 5, period 60)', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_error_alarm"/);
    expect(content).toMatch(/metric_name\s*=\s*"Errors"/);
    expect(content).toMatch(/threshold\s*=\s*"?5"?/);
    expect(content).toMatch(/period\s*=\s*"?60"?/);
  });

  test('CloudFront distribution and WAF are declared with HTTPS viewer policy', () => {
    const content = fs.readFileSync(stackPath, 'utf8');
    expect(content).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"main"/);
    expect(content).toMatch(/viewer_protocol_policy\s*=\s*"redirect-to-https"/);
    expect(content).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"/);
  });

});
