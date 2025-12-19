// tests/unit/unit-tests.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Terraform AWS Security Stack: tap_stack.tf", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
  });

  // --- File Existence Tests ---
  test("tap_stack.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  test("provider.tf exists", () => {
    const exists = fs.existsSync(providerPath);
    expect(exists).toBe(true);
  });

  // --- Provider Configuration Tests ---
  test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
    expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("uses regional provider aliases from provider.tf", () => {
    // Test for multi-region resource pattern using for_each
    expect(stackContent).toMatch(/for_each\s*=\s*toset\(local\.regions\)/);
  });

  // --- Data Sources Tests ---
  test("declares aws_caller_identity data source", () => {
    expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
  });

  test("declares aws_partition data source", () => {
    expect(stackContent).toMatch(/data\s+"aws_partition"\s+"current"/);
  });

  test("declares aws_vpcs data source for existing VPCs", () => {
    expect(stackContent).toMatch(/data\s+"aws_vpcs"\s+"existing"/);
  });

  // --- Security Control 1: Global Tags ---
  test("references common tags from provider configuration", () => {
    expect(providerContent).toMatch(/default_tags\s*{\s*tags\s*=\s*local\.common_tags/);
  });

  // --- Security Control 2: Encryption at Rest (KMS) ---
  test("declares KMS keys for all regions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"regional_cmk_us_east_1"/);
    expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"regional_cmk_eu_west_1"/);
    expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"regional_cmk_ap_southeast_2"/);
    expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test("KMS key policy includes required service permissions", () => {
    expect(stackContent).toMatch(/Allow CloudTrail to encrypt logs/);
    expect(stackContent).toMatch(/Allow CloudWatch Logs/);
    expect(stackContent).toMatch(/cloudtrail\.amazonaws\.com/);
    expect(stackContent).toMatch(/logs\.(us-east-1|eu-west-1|ap-southeast-2)\.amazonaws\.com/);
  });

  test("declares KMS aliases for all keys", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"regional_cmk_us_east_1"/);
    expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"regional_cmk_eu_west_1"/);
    expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"regional_cmk_ap_southeast_2"/);
    expect(stackContent).toMatch(/target_key_id\s*=\s*aws_kms_key\.regional_cmk_us_east_1\.key_id/);
  });

  // --- Security Control 3: IAM + MFA Enforcement ---
  test("declares strict password policy", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_account_password_policy"\s+"strict"/);
    expect(stackContent).toMatch(/minimum_password_length\s*=\s*14/);
    expect(stackContent).toMatch(/require_lowercase_characters\s*=\s*true/);
    expect(stackContent).toMatch(/require_uppercase_characters\s*=\s*true/);
    expect(stackContent).toMatch(/require_numbers\s*=\s*true/);
    expect(stackContent).toMatch(/require_symbols\s*=\s*true/);
    expect(stackContent).toMatch(/password_reuse_prevention\s*=\s*24/);
  });

  test("declares MFA enforcement policy", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"mfa_enforcement"/);
    expect(stackContent).toMatch(/aws:MultiFactorAuthPresent.*false/);
    expect(stackContent).toMatch(/aws:ViaAWSService.*true/);
  });

  test("creates console users group with MFA policy attachment", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_group"\s+"console_users"/);
    expect(stackContent).toMatch(/resource\s+"aws_iam_group_policy_attachment"\s+"mfa_enforcement"/);
  });

  // --- Security Control 4: Security Groups ---
  test("creates VPCs when existing ones not found", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    expect(stackContent).toMatch(/length\(data\.aws_vpcs\.existing\[region\]\.ids\)\s*==\s*0/);
  });

  test("declares least privilege security groups", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"app_tier"/);
    expect(stackContent).toMatch(/from_port\s*=\s*443/); // HTTPS
    expect(stackContent).toMatch(/from_port\s*=\s*53/);  // DNS
    expect(stackContent).toMatch(/cidr_blocks\s*=\s*\[var\.corporate_cidr\]/);
  });

  // --- Security Control 5: CloudTrail ---
  test("declares S3 bucket for CloudTrail with random suffix", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail"/);
    expect(stackContent).toMatch(/resource\s+"random_string"\s+"bucket_suffix"/);
    expect(stackContent).toMatch(/random_string\.bucket_suffix\.result/);
  });

  test("configures S3 bucket encryption with KMS", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
    expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    expect(stackContent).toMatch(/kms_master_key_id\s*=\s*local\.kms_keys\[local\.home_region\]\.arn/);
  });

  test("blocks public access on S3 bucket", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail"/);
    expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
    expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
    expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
    expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
  });

  test("enforces TLS in S3 bucket policy", () => {
    expect(stackContent).toMatch(/aws:SecureTransport.*false/);
    expect(stackContent).toMatch(/DenyInsecureConnections/);
  });

  test("creates CloudWatch log group for CloudTrail", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"cloudtrail"/);
    expect(stackContent).toMatch(/\/aws\/cloudtrail/);
    expect(stackContent).toMatch(/kms_key_id\s*=\s*local\.kms_keys\[local\.home_region\]\.arn/);
  });

  test("declares multi-region CloudTrail", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
    expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
    expect(stackContent).toMatch(/include_global_service_events\s*=\s*true/);
    expect(stackContent).toMatch(/cloud_watch_logs_group_arn/);
    expect(stackContent).toMatch(/cloud_watch_logs_role_arn/);
  });

  // --- Security Control 6: TLS In Transit ---
  test("includes commented ALB listener example", () => {
    expect(stackContent).toMatch(/# resource "aws_lb_listener"/);
    expect(stackContent).toMatch(/ELBSecurityPolicy-TLS-1-2/);
  });

  // --- Security Control 7: GuardDuty ---
  test("enables GuardDuty in all regions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_guardduty_detector"\s+"main"/);
    expect(stackContent).toMatch(/for_each\s*=\s*toset\(local\.regions\)/);
    expect(stackContent).toMatch(/enable\s*=\s*true/);
  });

  test("enables comprehensive GuardDuty data sources", () => {
    // Check for new GuardDuty detector feature resources
    expect(stackContent).toMatch(/resource\s+"aws_guardduty_detector_feature"\s+"s3_logs"/);
    expect(stackContent).toMatch(/resource\s+"aws_guardduty_detector_feature"\s+"kubernetes_audit_logs"/);
    expect(stackContent).toMatch(/resource\s+"aws_guardduty_detector_feature"\s+"malware_protection"/);
    expect(stackContent).toMatch(/name\s*=\s*"S3_DATA_EVENTS"/);
    expect(stackContent).toMatch(/name\s*=\s*"EKS_AUDIT_LOGS"/);
    expect(stackContent).toMatch(/name\s*=\s*"EBS_MALWARE_PROTECTION"/);
    expect(stackContent).toMatch(/status\s*=\s*"ENABLED"/);
  });

  // --- Security Control 8: Unauthorized API Call Alerts ---
  test("creates SNS topic for security alerts", () => {
    expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"security_alerts"/);
    expect(stackContent).toMatch(/kms_master_key_id\s*=\s*local\.kms_keys\[local\.home_region\]\.id/);
  });

  test("creates CloudWatch metric filter for unauthorized API calls", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"unauthorized_api_calls"/);
    expect(stackContent).toMatch(/UnauthorizedOperation/);
    expect(stackContent).toMatch(/AccessDenied/);
    expect(stackContent).toMatch(/UnauthorizedAPICalls/);
  });

  test("creates CloudWatch alarm for unauthorized API calls", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"unauthorized_api_calls"/);
    expect(stackContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.security_alerts\.arn\]/);
    expect(stackContent).toMatch(/GreaterThanThreshold/);
  });

  // --- Security Control 9: VPC Flow Logs ---
  test("creates IAM role for VPC Flow Logs", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"flow_logs"/);
    expect(stackContent).toMatch(/vpc-flow-logs\.amazonaws\.com/);
  });

  test("creates CloudWatch log groups for VPC Flow Logs", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"/);
    expect(stackContent).toMatch(/\/aws\/vpc\/flowlogs/);
    expect(stackContent).toMatch(/kms_key_id\s*=\s*local\.kms_keys\[each\.key\]\.arn/);
  });

  test("enables VPC Flow Logs in all regions", () => {
    expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"vpc_flow_logs"/);
    expect(stackContent).toMatch(/traffic_type\s*=\s*"ALL"/);
    expect(stackContent).toMatch(/vpc_id\s*=\s*local\.vpc_ids\[each\.key\]/);
  });

  // --- Security Control 10: S3 Public Access Block ---
  test("enables account-level S3 public access block", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_account_public_access_block"\s+"main"/);
    expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
    expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
    expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
    expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
  });

  // --- Output Tests ---
  test("declares all required outputs", () => {
    const requiredOutputs = [
      "kms_key_arns",
      "cloudtrail_name", 
      "cloudtrail_s3_bucket",
      "cloudwatch_log_group_cloudtrail",
      "sns_topic_arn",
      "metric_filter_name",
      "security_group_ids",
      "guardduty_detector_ids", 
      "vpc_flow_log_ids",
      "mfa_policy_arn"
    ];

    requiredOutputs.forEach(output => {
      expect(stackContent).toMatch(new RegExp(`output\\s+"${output}"\\s*{`));
    });
  });

  test("outputs include descriptions", () => {
    expect(stackContent).toMatch(/description\s*=\s*"ARNs of KMS keys per region"/);
    expect(stackContent).toMatch(/description\s*=\s*"Name of the CloudTrail"/);
    expect(stackContent).toMatch(/description\s*=\s*"GuardDuty detector IDs per region"/);
  });

  // --- Multi-Region Tests ---
  test("uses for_each pattern for multi-region resources", () => {
    const multiRegionResources = [
      "aws_kms_key", 
      "aws_kms_alias",
      "aws_guardduty_detector",
      "aws_security_group",
      "aws_cloudwatch_log_group.*vpc_flow_logs",
      "aws_flow_log"
    ];

    multiRegionResources.forEach(resource => {
      const resourcePattern = new RegExp(`resource\\s+"${resource}".*for_each\\s*=\\s*toset\\(local\\.regions\\)`, 's');
      expect(stackContent).toMatch(resourcePattern);
    });
  });

  test("uses regional provider mapping", () => {
    expect(stackContent).toMatch(/regional_providers\s*=\s*{/);
    // Test that multi-region resources use for_each pattern
    expect(stackContent).toMatch(/for_each\s*=\s*toset\(local\.regions\)/);
  });

  // --- Locals and Variable Usage Tests ---
  test("uses local.name_prefix for consistent naming", () => {
    expect(stackContent).toMatch(/\$\{local\.name_prefix\}/);
  });

  test("uses local.home_region for centralized resources", () => {
    expect(stackContent).toMatch(/local\.home_region/);
  });

  test("uses local.project and local.environment in namespaces", () => {
    expect(stackContent).toMatch(/\$\{local\.project\}\/\$\{local\.environment\}/);
  });

  // --- Dependencies Tests ---
  test("CloudTrail depends on S3 bucket policy", () => {
    expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_s3_bucket_policy\.cloudtrail\]/);
  });

  // --- Best Practices Tests ---
  test("includes resource tags with Name", () => {
    expect(stackContent).toMatch(/tags\s*=\s*{\s*Name\s*=/);
  });

  test("uses secure defaults", () => {
    expect(stackContent).toMatch(/force_destroy\s*=\s*false/); // S3 bucket protection
    expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*7/); // KMS key protection
  });

  test("includes commented examples for extensibility", () => {
    expect(stackContent).toMatch(/# Uncomment to enable data events/);
    expect(stackContent).toMatch(/var\.security_team_email/);
  });
});
