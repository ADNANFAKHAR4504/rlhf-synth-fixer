// test/terraform.int.test.ts
// Lightweight cross-file consistency checks (no terraform CLI run)

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const main = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");
const vars = fs.readFileSync(path.join(LIB_DIR, "variables.tf"), "utf8");
const outs = fs.readFileSync(path.join(LIB_DIR, "outputs.tf"), "utf8");
const prov = fs.readFileSync(path.join(LIB_DIR, "provider.tf"), "utf8");

describe("Terraform Security Baseline - Integration (static)", () => {
  test("provider region variable declared", () => {
    // Your provider uses var.region; make sure variables.tf declares it
    expect(vars).toMatch(/variable\s+"region"\s*{/);
    expect(prov).toMatch(/region\s*=\s*var\.(region|aws_region)/);
  });

  test("CloudTrail uses the log group and role you create", () => {
    expect(main).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"trail"/);
    expect(main).toMatch(/resource\s+"aws_iam_role"\s+"trail_cw"/);
    expect(main).toMatch(/cloud_watch_logs_group_arn\s*=\s*"\$\{?aws_cloudwatch_log_group\.trail\.arn}?:\*"?/);
    expect(main).toMatch(/cloud_watch_logs_role_arn\s*=\s*aws_iam_role\.trail_cw\.arn/);
  });

  test("KMS key referenced by CloudWatch Logs and CloudTrail is the same key", () => {
    // KMS key resource exists
    expect(main).toMatch(/resource\s+"aws_kms_key"\s+"logs"/);
    // CloudWatch log group points to that key
    expect(main).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"trail"[\s\S]*?kms_key_id\s*=\s*aws_kms_key\.logs\.arn/);
    // CloudTrail points to same key
    expect(main).toMatch(/resource\s+"aws_cloudtrail"\s+"main"[\s\S]*?kms_key_id\s*=\s*aws_kms_key\.logs\.arn/);
  });

  test("S3 logs bucket policy grants CloudTrail and Config write with bucket-owner-full-control", () => {
    expect(main).toMatch(/data\s+"aws_iam_policy_document"\s+"logs_bucket"/);
    expect(main).toMatch(/cloudtrail\.amazonaws\.com/);
    expect(main).toMatch(/config\.amazonaws\.com/);
    expect(main).toMatch(/s3:x-amz-acl"\s*=\s*"bucket-owner-full-control"/);
  });

  test("Password policy + alarms present", () => {
    expect(main).toMatch(/resource\s+"aws_iam_account_password_policy"\s+"baseline"/);
    expect(main).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"root_usage"/);
    expect(main).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"root_usage"/);
    expect(main).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"no_mfa_login"/);
    expect(main).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"no_mfa_login"/);
  });

  test("Outputs align with resources", () => {
    // These outputs should exist and reference real resources
    expect(outs).toMatch(/output\s+"cloudtrail_arn"/);
    expect(main).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);

    expect(outs).toMatch(/output\s+"logs_bucket_name"/);
    expect(main).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);

    expect(outs).toMatch(/output\s+"sns_topic_arn"/);
    expect(main).toMatch(/resource\s+"aws_sns_topic"\s+"security"/);
  });
});
