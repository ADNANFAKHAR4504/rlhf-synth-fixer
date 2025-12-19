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

  test("uses aws_region data source in tap_stack.tf", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/data\s+"aws_region"\s+"current"\s*\{\}/);
  });

  test("uses aws_caller_identity data source in tap_stack.tf", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/data\s+"aws_caller_identity"\s+"current"\s*\{\}/);
  });

  test("defines KMS key resource in tap_stack.tf", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_kms_key"\s+"main"\s*\{/);
  });

  test("defines VPC resource in tap_stack.tf", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"\s*\{/);
  });

  test("defines S3 buckets in tap_stack.tf", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"app_content"\s*\{/);
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"\s*\{/);
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudfront_logs"\s*\{/);
  });

  test("defines CloudFront distribution in tap_stack.tf", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_cloudfront_distribution"\s+"main"\s*\{/);
  });

  test("defines RDS instance in tap_stack.tf", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_db_instance"\s+"main"\s*\{/);
  });

  test("includes required outputs in tap_stack.tf", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/output\s+"cloudfront_domain_name"\s*\{/);
    expect(content).toMatch(/output\s+"rds_endpoint"\s*\{/);
    expect(content).toMatch(/output\s+"app_content_bucket"\s*\{/);
  });

});
