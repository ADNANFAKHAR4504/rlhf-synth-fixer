import * as fs from "fs";
import * as path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const TAP_STACK_TF = path.join(LIB_DIR, "tap_stack.tf");
const tf = fs.readFileSync(TAP_STACK_TF, "utf8");
const has = (regex: RegExp) => regex.test(tf);

describe("tap_stack.tf static verification", () => {
  // 1. File validity
  it("exists and is a non-trivial Terraform config", () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(tf.length).toBeGreaterThan(2000); // file is long
  });

  // 2. Required variables
  it("declares required input variables", () => {
    [
      "environment",
      "project_name",
      "bucket_versioning_enabled",
      "bucket_encryption_enabled",
    ].forEach(v =>
      expect(has(new RegExp(`variable\\s+"${v}"`))).toBe(true)
    );
  });

  // 3. Locals
  it("defines expected locals for tags, regions, bucket names, lambda role", () => {
    ["common_tags", "regions", "bucket_names", "lambda_role_name"].forEach(local =>
      expect(has(new RegExp(`locals?\\s*{[\\s\\S]*${local}`))).toBe(true)
    );
  });

  // 4. S3 buckets existence per region
  it("creates S3 buckets in us-east-1, eu-west-1, ap-southeast-1", () => {
    ["us_east_1", "eu_west_1", "ap_southeast_1"].forEach(region =>
      expect(has(new RegExp(`resource\\s+"aws_s3_bucket"\\s+"${region}"`))).toBe(true)
    );
  });

  // 5. S3 security: versioning, encryption, and public access block
  it("manages versioning, encryption, and public access block per bucket", () => {
    ["us_east_1", "eu_west_1", "ap_southeast_1"].forEach(region => {
      expect(has(new RegExp(`resource\\s+"aws_s3_bucket_versioning"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_s3_bucket_server_side_encryption_configuration"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_s3_bucket_public_access_block"\\s+"${region}"`))).toBe(true);
    });
    // Encryption must be AES256
    expect(has(/sse_algorithm\s*=\s*"AES256"/)).toBe(true);
    // Public access must be blocked
    expect(has(/block_public_acls\s*=\s*true/)).toBe(true);
  });

  // 6. Replication IAM role + policy
  it("defines IAM role and policy for S3 replication", () => {
    expect(has(/resource\s+"aws_iam_role"\s+"replication"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy"\s+"replication"/)).toBe(true);
    // Replication Actions
    expect(has(/s3:ReplicateObject/)).toBe(true);
    expect(has(/s3:ReplicateDelete/)).toBe(true);
  });

  // 7. Replication configs
  it("creates replication configs from US East 1 to EU and AP", () => {
    expect(has(/resource\s+"aws_s3_bucket_replication_configuration"\s+"us_to_eu"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_replication_configuration"\s+"us_to_ap"/)).toBe(true);
    expect(has(/destination\s*{[\s\S]*eu-west-1/)).toBe(true);
    expect(has(/destination\s*{[\s\S]*ap-southeast-1/)).toBe(true);
  });

  // 8. IAM for Lambda
  it("defines IAM role, policy and attachment for Lambda S3 access", () => {
    expect(has(/resource\s+"aws_iam_role"\s+"lambda_s3_access"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy"\s+"lambda_s3_access"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_basic_execution"/)).toBe(true);
    // Lambda must access S3 actions
    expect(has(/s3:GetObject/)).toBe(true);
    expect(has(/s3:PutObject/)).toBe(true);
    expect(has(/s3:DeleteObject/)).toBe(true);
  });

  // 9. Outputs
  it("defines expected outputs for buckets, IAM roles, and replication", () => {
    [
      "s3_bucket_ids",
      "s3_bucket_arns",
      "s3_bucket_domain_names",
      "s3_bucket_regional_domain_names",
      "lambda_iam_role_arn",
      "lambda_iam_role_name",
      "s3_replication_role_arn",
      "s3_replication_role_name",
      "bucket_regions",
      "environment",
      "project_name",
    ].forEach(output =>
      expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true)
    );
  });

  // 10. Outputs sanitation
  it("does not expose sensitive outputs", () => {
    expect(has(/output\s+.*(secret|password|access_key|secret_key)/i)).toBe(false);
  });
});
