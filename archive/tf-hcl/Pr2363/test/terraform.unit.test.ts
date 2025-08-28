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
      "environment",
      "project_name",
      "bucket_versioning_enabled",
      "bucket_encryption_enabled",
    ].forEach(variable =>
      expect(has(new RegExp(`variable\\s+"${variable}"`))).toBe(true)
    );
  });

  // 3. Locals
  it("defines expected locals", () => {
    ["common_tags", "regions", "bucket_names", "lambda_role_name"].forEach(local =>
      expect(has(new RegExp(`${local}\\s*=`))).toBe(true)
    );
  });

  // 4. S3 buckets per region
  ["us_east_1", "eu_west_1", "ap_southeast_1"].forEach(region => {
    it(`creates aws_s3_bucket resource for ${region}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_s3_bucket"\\s+"${region}"`))).toBe(true);
    });

    it(`manages versioning for bucket in ${region}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_s3_bucket_versioning"\\s+"${region}"`))).toBe(true);
    });

    it(`manages encryption for bucket in ${region}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_s3_bucket_server_side_encryption_configuration"\\s+"${region}"`))).toBe(true);
      expect(has(/sse_algorithm\s*=\s*"AES256"/)).toBe(true);
    });

    it(`blocks public access for bucket in ${region}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_s3_bucket_public_access_block"\\s+"${region}"`))).toBe(true);
    });
  });

  // 5. IAM roles and policies for replication and lambda
  it("defines IAM role and policy for S3 replication", () => {
    expect(has(/resource\s+"aws_iam_role"\s+"replication"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy"\s+"replication"/)).toBe(true);
  });

  it("defines IAM role, policy and policy attachment for Lambda S3 access", () => {
    expect(has(/resource\s+"aws_iam_role"\s+"lambda_s3_access"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy"\s+"lambda_s3_access"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy_attachment"\s+"lambda_basic_execution"/)).toBe(true);
  });

  // 6. Outputs
  it("defines expected outputs for each individual bucket and IAM role", () => {
    const expectedOutputs = [
      // US East 1
      "s3_bucket_id_us_east_1",
      "s3_bucket_arn_us_east_1",
      "s3_bucket_domain_name_us_east_1",
      "s3_bucket_regional_domain_name_us_east_1",

      // EU West 1
      "s3_bucket_id_eu_west_1",
      "s3_bucket_arn_eu_west_1",
      "s3_bucket_domain_name_eu_west_1",
      "s3_bucket_regional_domain_name_eu_west_1",

      // AP Southeast 1
      "s3_bucket_id_ap_southeast_1",
      "s3_bucket_arn_ap_southeast_1",
      "s3_bucket_domain_name_ap_southeast_1",
      "s3_bucket_regional_domain_name_ap_southeast_1",

      // IAM roles
      "lambda_iam_role_arn",
      "lambda_iam_role_name",
      "s3_replication_role_arn",
      "s3_replication_role_name",

      // Other
      "bucket_regions",
      "environment",
      "project_name"
    ];

    expectedOutputs.forEach(output =>
      expect(has(new RegExp(`output\\s+"${output}"`))).toBe(true)
    );
  });

  // 7. No sensitive data in outputs
  it("does not expose sensitive outputs", () => {
    expect(has(/output\s+.*(secret|password|access_key|secret_key)/i)).toBe(false);
  });
});
