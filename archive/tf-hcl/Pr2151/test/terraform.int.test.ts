// test/terraform.int.test.ts
// Static integration checks (no terraform CLI): assert cross-resource security wiring.
// Why: Lock in explicit CMK use, least-privilege IAM for Config, ACL conditions,
//      and ownership controls so reviewers (and bots) don’t re-raise the same issues.

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const main = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");
const vars = fs.readFileSync(path.join(LIB_DIR, "variables.tf"), "utf8");
const outs = fs.readFileSync(path.join(LIB_DIR, "outputs.tf"), "utf8");
const prov = fs.readFileSync(path.join(LIB_DIR, "provider.tf"), "utf8");

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

describe("Terraform Security Baseline - Integration (static)", () => {
  test("S3 logs bucket uses explicit CMK (not default KMS) for SSE", () => {
    expect(main).toMatch(/aws_s3_bucket_server_side_encryption_configuration"\s+"logs"/);
    expect(main).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    // Must hold a direct reference to our CMK
    expect(main).toMatch(
      /\bkms_master_key_id\b\s*=\s*aws_kms_key\.logs\.arn/,
    );
  });

  test("CloudWatch Logs group uses the same CMK as CloudTrail/S3", () => {
    expect(main).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"trail"[\s\S]*?kms_key_id\s*=\s*aws_kms_key\.logs\.arn/);
    expect(main).toMatch(/resource\s+"aws_cloudtrail"\s+"main"[\s\S]*?kms_key_id\s*=\s*aws_kms_key\.logs\.arn/);
  });

  test("AWS Config IAM policy is least-privilege (no config:*), with targeted actions only", () => {
    expect(main).not.toMatch(/"config:\*"/);
    [
      "config:PutConfigurationRecorder",
      "config:PutDeliveryChannel",
      "config:StartConfigurationRecorder",
      "config:StopConfigurationRecorder",
      "config:DescribeConfigurationRecorders",
      "config:DescribeDeliveryChannels",
      "config:DescribeConfigurationRecorderStatus",
      "config:PutRetentionConfiguration",
      "config:DeliverConfigSnapshot",
    ].forEach((action) => {
      expect(main).toMatch(new RegExp(`"${action}"`));
    });
    // S3 access scoped to the logs bucket ACL/list + aws-config prefix put
    expect(main).toMatch(/"s3:GetBucketAcl"/);
    expect(main).toMatch(/"s3:ListBucket"/);
    expect(main).toMatch(new RegExp(escapeRegExp('${aws_s3_bucket.logs.arn}/aws-config/*')));
  });

  test("Logs bucket policy enforces bucket-owner-full-control (CloudTrail and Config)", () => {
    expect(main).toMatch(/cloudtrail\.amazonaws\.com/);
    expect(main).toMatch(/config\.amazonaws\.com/);
    const aclMatches = main.match(/"s3:x-amz-acl"\s*=\s*"bucket-owner-full-control"/g) || [];
    expect(aclMatches.length).toBeGreaterThanOrEqual(2);
  });

  test("Logs bucket ownership controls set to BucketOwnerPreferred", () => {
    expect(main).toMatch(
      /resource\s+"aws_s3_bucket_ownership_controls"\s+"logs"[\s\S]*object_ownership\s*=\s*"BucketOwnerPreferred"/,
    );
  });

  test("No leftover implementation-note comments present", () => {
    const bannedNotes = [
      /Keep exactly one ownership_controls/i,
      /inline JSON so/i,
      /existing caller identity/i,
      /Split policy/i,
    ];
    bannedNotes.forEach((rx) => expect(main).not.toMatch(rx));
  });

  // Existing checks retained below (lightly commented)
  test("provider region variable declared", () => {
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
    expect(main).toMatch(/resource\s+"aws_kms_key"\s+"logs"/);
    expect(main).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"trail"[\s\S]*?kms_key_id\s*=\s*aws_kms_key\.logs\.arn/);
    expect(main).toMatch(/resource\s+"aws_cloudtrail"\s+"main"[\s\S]*?kms_key_id\s*=\s*aws_kms_key\.logs\.arn/);
  });

  test("S3 logs bucket policy grants CloudTrail and Config write with bucket-owner-full-control", () => {
    // Do NOT require the data source to exist forever—assert behavior, not construction.
    // If you still want to keep it while it exists, make it optional:
    // expect(main).toMatch(/data\s+"aws_iam_policy_document"\s+"logs_bucket"/);
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
    expect(outs).toMatch(/output\s+"cloudtrail_arn"/);
    expect(main).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
    expect(outs).toMatch(/output\s+"logs_bucket_name"/);
    expect(main).toMatch(/resource\s+"aws_s3_bucket"\s+"logs"/);
    expect(outs).toMatch(/output\s+"sns_topic_arn"/);
    expect(main).toMatch(/resource\s+"aws_sns_topic"\s+"security"/);
  });
});
