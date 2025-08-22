// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/main.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/main.tf"; // PROMPT.md requires main.tf
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform single-file stack: main.tf", () => {
  test("main.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  // --- Optional sanity checks (keep lightweight) ---

  test("does NOT declare provider in main.tf (provider.tf owns providers)", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("declares aws_region variable in main.tf", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("follows correct bucket naming pattern with -v3 suffix", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    // Should match data-secured-${local.account_id}-${local.unique_suffix} pattern
    expect(content).toMatch(/bucket\s*=\s*"data-secured-\$\{local\.account_id\}-\$\{local\.unique_suffix\}"/);
    // Should contain unique_suffix variable
    expect(content).toMatch(/unique_suffix\s*=\s*"v3"/);
  });

  test("includes all required resource types", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    
    // Check for required S3 resources
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"primary"/);
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"replication_destination"/);
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"access_logging"/);
    
    // Check for IAM resources
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"replication_role"/);
    expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"mfa_s3_access_policy"/);
    
    // Check for S3 configuration resources
    expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
    expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
    expect(content).toMatch(/resource\s+"aws_s3_bucket_replication_configuration"/);
  });

});
