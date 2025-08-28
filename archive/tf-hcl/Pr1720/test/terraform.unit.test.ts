import * as fs from "fs";
import * as path from "path";

describe("Terraform Secure Infra - Unit Tests", () => {
  const tfPath = path.resolve(__dirname, "../lib/main.tf");
  const tfContent = fs.readFileSync(tfPath, "utf-8");

  // ---------- INPUTS ----------
  it("should declare aws_region variable with validation", () => {
    expect(tfContent).toMatch(/variable\s+"aws_region"/);
    expect(tfContent).toMatch(/validation/);
    expect(tfContent).toMatch(/us-west-2/);
  });

  // ---------- IAM & SECURITY ----------
  it("should define IAM roles and policies", () => {
    expect(tfContent).toMatch(/resource\s+"aws_iam_role"/);
    expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy"/);
  });

  it("should enforce least privilege policies (no wildcard actions)", () => {
    // Allow kms:* for root account administration in KMS policy
    const wildcardActions = tfContent.match(/"Action"\s*:\s*".*[*].*"/g);
    const allowedWildcards = tfContent.match(/"Action"\s*:\s*"kms:\*"/g);
    const unauthorizedWildcards = wildcardActions ? wildcardActions.filter(action => !action.includes("kms:*")) : null;
    expect(unauthorizedWildcards).toBeNull();
  });

  // ---------- STORAGE (S3 + KMS) ----------
  it("should create KMS key for encryption", () => {
    expect(tfContent).toMatch(/resource\s+"aws_kms_key"/);
    expect(tfContent).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  it("should configure an S3 bucket with KMS encryption and versioning", () => {
    expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"/);
    expect(tfContent).toMatch(/server_side_encryption_configuration/);
    expect(tfContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    expect(tfContent).toMatch(/bucket_key_enabled\s*=\s*true/);
    expect(tfContent).toMatch(/versioning_configuration/);
    expect(tfContent).toMatch(/status\s*=\s*"Enabled"/);
  });

  it("should block all public access to S3", () => {
    expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
    expect(tfContent).toMatch(/block_public_acls\s*=\s*true/);
    expect(tfContent).toMatch(/ignore_public_acls\s*=\s*true/);
    expect(tfContent).toMatch(/block_public_policy\s*=\s*true/);
    expect(tfContent).toMatch(/restrict_public_buckets\s*=\s*true/);
  });

  // ---------- MONITORING ----------
  it("should define CloudWatch log groups and metric alarms", () => {
    expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
    expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
  });

  it("should include CloudWatch metric filter for unauthorized API calls", () => {
    expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"/);
    expect(tfContent).toMatch(/UnauthorizedOperation/);
    expect(tfContent).toMatch(/AccessDenied/);
  });

  // ---------- ALERTING ----------
  it("should configure an SNS topic with KMS encryption", () => {
    expect(tfContent).toMatch(/resource\s+"aws_sns_topic"/);
    expect(tfContent).toMatch(/kms_master_key_id/);
  });

  // ---------- AUDITING & COMPLIANCE ----------
  it("should have conditional CloudTrail configuration", () => {
    expect(tfContent).toMatch(/variable\s+"create_cloudtrail"/);
    expect(tfContent).toMatch(/resource\s+"aws_cloudtrail"/);
    expect(tfContent).toMatch(/count\s*=\s*var\.create_cloudtrail/);
  });

  it("should have CloudTrail with S3 and CloudWatch integration when enabled", () => {
    expect(tfContent).toMatch(/s3_bucket_name/);
    expect(tfContent).toMatch(/cloud_watch_logs_group_arn/);
    expect(tfContent).toMatch(/cloud_watch_logs_role_arn/);
    expect(tfContent).toMatch(/enable_logging\s*=\s*true/);
    expect(tfContent).toMatch(/include_global_service_events\s*=\s*true/);
  });

  // ---------- STANDARDS ----------
  it("should apply consistent tagging", () => {
    expect(tfContent).toMatch(/tags\s*=\s*{/);
    expect(tfContent).toMatch(/Environment/);
    expect(tfContent).toMatch(/Project/);
    expect(tfContent).toMatch(/Owner/);
    expect(tfContent).toMatch(/ManagedBy/);
  });

  // ---------- OUTPUTS ----------
  it("should define outputs for key resources", () => {
    expect(tfContent).toMatch(/output\s+"aws_region"/);
    expect(tfContent).toMatch(/output\s+"app_bucket_name"/);
    expect(tfContent).toMatch(/output\s+"cloudtrail_bucket_name"/);
    expect(tfContent).toMatch(/output\s+"kms_key_arn"/);
    expect(tfContent).toMatch(/output\s+"cloudtrail_arn"/);
    expect(tfContent).toMatch(/output\s+"security_alerts_topic_arn"/);
  });

  it("should not output sensitive secrets", () => {
    const sensitiveOutputs = tfContent.match(/output\s+".*password.*"/gi);
    expect(sensitiveOutputs).toBeNull();
  });
});
