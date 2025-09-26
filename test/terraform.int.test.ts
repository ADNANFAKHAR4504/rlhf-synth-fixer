import * as fs from "fs";
import * as path from "path";

// Load flat outputs JSON from deployment result
const outputsRaw: { [key: string]: any } = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../cfn-outputs/flat-outputs.json"), "utf8")
);

function isNonEmptyString(value: any): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

describe("Flat Outputs Integration Tests", () => {
  const expectedKeys = [
    "ami_id",
    "cloudfront_distribution_domain_name",
    "cloudfront_distribution_id",
    "cloudwatch_dashboard_name",
    "iam_ec2_role_arn",
    "iam_ec2_role_name",
    "iam_instance_profile_name",
    "kms_key_arn",
    "kms_key_id",
    "rds_secret_arn",
    "s3_access_logs_bucket_name",
    "s3_main_bucket_arn",
    "s3_main_bucket_name",
    "vpc_cidr"
  ];

  it("should contain all expected output keys", () => {
    expectedKeys.forEach(key => {
      expect(outputsRaw).toHaveProperty(key);
    });
  });

  it("all outputs should be non-empty strings", () => {
    expectedKeys.forEach(key => {
      expect(isNonEmptyString(outputsRaw[key])).toBe(true);
    });
  });

  it("AMI ID format should be valid", () => {
    expect(/^ami-[a-z0-9]+$/.test(outputsRaw.ami_id)).toBe(true);
  });

  it("CloudFront distribution ID and domain should be valid", () => {
    expect(/^E[A-Z0-9]+$/.test(outputsRaw.cloudfront_distribution_id)).toBe(true);
    expect(/\.cloudfront\.net$/.test(outputsRaw.cloudfront_distribution_domain_name)).toBe(true);
  });

  it("IAM role and instance profile should be valid", () => {
    expect(outputsRaw.iam_ec2_role_arn).toMatch(/^arn:aws:iam::\d{12}:role\/.+$/);
    expect(isNonEmptyString(outputsRaw.iam_ec2_role_name)).toBe(true);
    expect(isNonEmptyString(outputsRaw.iam_instance_profile_name)).toBe(true);
  });

  it("KMS Key ARN and ID should be valid", () => {
    expect(outputsRaw.kms_key_arn).toMatch(/^arn:aws:kms:[a-z0-9-]+:\d{12}:key\/[a-f0-9-]+$/);
    expect(/^[a-f0-9-]+$/.test(outputsRaw.kms_key_id)).toBe(true);
  });

  it("RDS secret ARN should be valid", () => {
    expect(outputsRaw.rds_secret_arn).toMatch(/^arn:aws:secretsmanager:[a-z0-9-]+:\d{12}:secret:.+/);
  });

  it("S3 bucket names and ARNs should be valid", () => {
    expect(outputsRaw.s3_main_bucket_arn).toMatch(/^arn:aws:s3:::.+/);
    expect(isNonEmptyString(outputsRaw.s3_main_bucket_name)).toBe(true);
    expect(isNonEmptyString(outputsRaw.s3_access_logs_bucket_name)).toBe(true);
  });

  it("VPC CIDR should match expected value", () => {
    expect(outputsRaw.vpc_cidr).toBe("10.0.0.0/16");
  });
});

