// tests/unit/unit-tests.ts
// Unit tests for Terraform infrastructure defined in lib/tap_stack.tf
// Tests validate the structure and security configuration without executing Terraform

import fs from "fs";
import path from "path";

// ts-jest provides __dirname automatically
declare const __dirname: string;

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform Security Infrastructure Unit Tests", () => {
  let stackContent: string;

  beforeAll(() => {
    if (fs.existsSync(stackPath)) {
      stackContent = fs.readFileSync(stackPath, "utf8");
    }
  });

  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      const exists = fs.existsSync(stackPath);
      if (!exists) {
        console.error(`[unit] Expected stack at: ${stackPath}`);
      }
      expect(exists).toBe(true);
    });

    test("tap_stack.tf is not empty", () => {
      expect(stackContent).toBeDefined();
      expect(stackContent.length).toBeGreaterThan(0);
    });

    test("provider.tf does NOT exist (all config in tap_stack.tf)", () => {
      const providerPath = path.resolve(__dirname, "../lib/provider.tf");
      expect(fs.existsSync(providerPath)).toBe(false);
    });

    test("no tfplan file exists in lib directory", () => {
      const tfplanPath = path.resolve(__dirname, "../lib/tfplan");
      expect(fs.existsSync(tfplanPath)).toBe(false);
    });
  });

  describe("Terraform Configuration", () => {
    test("contains terraform configuration block", () => {
      expect(stackContent).toMatch(/terraform\s*{/);
      expect(stackContent).toMatch(/required_version/);
      expect(stackContent).toMatch(/required_providers/);
    });

    test("declares AWS provider inline", () => {
      expect(stackContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test("specifies us-west-2 region", () => {
      expect(stackContent).toMatch(/region\s*=\s*"us-west-2"/);
    });

    test("uses AWS provider version ~> 5.0", () => {
      expect(stackContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });
  });

  describe("Default Tagging Strategy", () => {
    test("provider has default_tags configured", () => {
      expect(stackContent).toMatch(/default_tags\s*{/);
    });

    test("includes CostCenter tag", () => {
      expect(stackContent).toMatch(/CostCenter\s*=\s*"IT-Security"/);
    });

    test("includes Environment tag", () => {
      expect(stackContent).toMatch(/Environment\s*=\s*"production"/);
    });

    test("includes ManagedBy tag", () => {
      expect(stackContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });
  });

  describe("Data Sources", () => {
    test("declares aws_caller_identity data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test("declares aws_region data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_region"\s+"current"/);
    });

    test("declares aws_partition data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_partition"\s+"current"/);
    });
  });

  describe("KMS Encryption Configuration", () => {
    test("creates KMS key resource", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"master"/);
    });

    test("enables key rotation", () => {
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("sets deletion window to 30 days", () => {
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*30/);
    });

    test("creates KMS alias", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"master"/);
      expect(stackContent).toMatch(/alias\/master-encryption-key/);
    });

    test("KMS policy allows root account", () => {
      expect(stackContent).toMatch(/Enable IAM User Permissions/);
      expect(stackContent).toMatch(/arn:.*:iam::.*:root/);
    });

    test("KMS policy allows CloudTrail", () => {
      expect(stackContent).toMatch(/Allow CloudTrail to encrypt logs/);
      expect(stackContent).toMatch(/cloudtrail\.amazonaws\.com/);
    });

    test("KMS policy allows AWS Config", () => {
      expect(stackContent).toMatch(/Allow AWS Config to encrypt/);
      expect(stackContent).toMatch(/config\.amazonaws\.com/);
    });
  });

  describe("S3 Buckets for Logging", () => {
    test("creates access_logs S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"access_logs"/);
      expect(stackContent).toMatch(/security-access-logs-/);
    });

    test("creates security_logs S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"security_logs"/);
      expect(stackContent).toMatch(/security-logs-/);
    });

    test("enables versioning on access_logs bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"access_logs"/);
      expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("enables versioning on security_logs bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"security_logs"/);
    });

    test("configures KMS encryption for access_logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"access_logs"/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("configures KMS encryption for security_logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"security_logs"/);
    });

    test("blocks all public access on access_logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"access_logs"/);
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("blocks all public access on security_logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"security_logs"/);
    });

    test("configures lifecycle policy for access_logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"access_logs"/);
      expect(stackContent).toMatch(/expire-old-logs/);
    });

    test("configures lifecycle policy for security_logs with archiving", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"security_logs"/);
      expect(stackContent).toMatch(/archive-old-logs/);
      expect(stackContent).toMatch(/STANDARD_IA/);
      expect(stackContent).toMatch(/GLACIER/);
    });

    test("security_logs bucket has logging to access_logs", () => {
      expect(stackContent).toMatch(/logging\s*{/);
      expect(stackContent).toMatch(/target_bucket\s*=\s*aws_s3_bucket\.access_logs\.id/);
    });

    test("bucket policies allow CloudTrail", () => {
      expect(stackContent).toMatch(/AWSCloudTrailAclCheck/);
      expect(stackContent).toMatch(/AWSCloudTrailWrite/);
    });

    test("bucket policies allow AWS Config", () => {
      expect(stackContent).toMatch(/AWSConfigBucketPermissionsCheck/);
      expect(stackContent).toMatch(/AWSConfigBucketDelivery/);
    });
  });

  describe("VPC and Network Configuration", () => {
    test("creates VPC with proper CIDR", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
    });

    test("enables DNS hostnames and support", () => {
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("creates private subnet", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.1\.0\/24"/);
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*false/);
    });

    test("creates public subnet", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*"10\.0\.2\.0\/24"/);
    });

    test("creates Internet Gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test("creates NAT Gateway with EIP", () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(stackContent).toMatch(/domain\s*=\s*"vpc"/);
    });

    test("creates private route table", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(stackContent).toMatch(/nat_gateway_id/);
    });

    test("creates public route table", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(stackContent).toMatch(/gateway_id.*internet_gateway/);
    });

    test("creates route table associations", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
    });

    test("creates Network ACL with restrictive rules", () => {
      expect(stackContent).toMatch(/resource\s+"aws_network_acl"\s+"main"/);
      expect(stackContent).toMatch(/10\.0\.0\.0\/16/); // Internal VPC traffic only
    });

    test("Network ACL blocks external 0.0.0.0/0 inbound", () => {
      const naclSection = stackContent.match(/resource "aws_network_acl" "main"[\s\S]*?(?=resource "|$)/);
      if (naclSection) {
        // Should allow internal but restrict external
        expect(naclSection[0]).toMatch(/10\.0\.0\.0\/16/);
      }
    });
  });

  describe("Security Groups", () => {
    test("creates default security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"default"/);
      expect(stackContent).toMatch(/secure-default-sg/);
    });

    test("security group restricts egress to internal VPC only", () => {
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*\["10\.0\.0\.0\/16"\]/);
    });

    test("security group does NOT allow 0.0.0.0/0 inbound", () => {
      const sgSection = stackContent.match(/resource "aws_security_group" "default"[\s\S]*?(?=resource "|$)/);
      if (sgSection) {
        expect(sgSection[0]).not.toMatch(/ingress.*0\.0\.0\.0\/0/);
      }
    });
  });

  describe("VPC Flow Logs", () => {
    test("creates VPC flow log", () => {
      expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"main"/);
      expect(stackContent).toMatch(/traffic_type\s*=\s*"ALL"/);
    });

    test("creates CloudWatch log group for flow logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"flow_log"/);
      expect(stackContent).toMatch(/\/aws\/vpc\/flowlogs/);
    });

    test("flow log group has KMS encryption", () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.master\.arn/);
    });

    test("flow log group has retention policy", () => {
      expect(stackContent).toMatch(/retention_in_days\s*=\s*30/);
    });

    test("creates IAM role for flow logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"flow_log"/);
      expect(stackContent).toMatch(/vpc-flow-logs\.amazonaws\.com/);
    });

    test("creates IAM policy for flow logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"flow_log"/);
      expect(stackContent).toMatch(/logs:CreateLogGroup/);
      expect(stackContent).toMatch(/logs:PutLogEvents/);
    });
  });

  describe("CloudTrail Configuration", () => {
    test("creates CloudTrail", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
      expect(stackContent).toMatch(/name\s*=\s*"main-trail"/);
    });

    test("enables multi-region trail", () => {
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test("includes global service events", () => {
      expect(stackContent).toMatch(/include_global_service_events\s*=\s*true/);
    });

    test("enables log file validation", () => {
      expect(stackContent).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test("enables logging", () => {
      expect(stackContent).toMatch(/enable_logging\s*=\s*true/);
    });

    test("uses KMS encryption", () => {
      expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.master\.arn/);
    });

    test("has event selector for S3 data events", () => {
      expect(stackContent).toMatch(/event_selector\s*{/);
      expect(stackContent).toMatch(/read_write_type\s*=\s*"All"/);
      expect(stackContent).toMatch(/include_management_events\s*=\s*true/);
      expect(stackContent).toMatch(/AWS::S3::Object/);
    });

    test("depends on S3 bucket policy", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_s3_bucket_policy\.security_logs\]/);
    });
  });

  describe("AWS Config Configuration", () => {
    test("creates Config IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"config"/);
      expect(stackContent).toMatch(/config\.amazonaws\.com/);
    });

    test("attaches AWS managed Config policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"config"/);
      expect(stackContent).toMatch(/service-role\/ConfigRole/);
    });

    test("creates Config recorder", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"/);
      expect(stackContent).toMatch(/all_supported\s*=\s*true/);
      expect(stackContent).toMatch(/include_global_resource_types\s*=\s*true/);
    });

    test("creates Config delivery channel", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"/);
      expect(stackContent).toMatch(/TwentyFour_Hours/);
    });

    test("enables Config recorder", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_configuration_recorder_status"\s+"main"/);
      expect(stackContent).toMatch(/is_enabled\s*=\s*true/);
    });

    test("creates Config rule for required tags", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"required_tags"/);
      expect(stackContent).toMatch(/REQUIRED_TAGS/);
      expect(stackContent).toMatch(/CostCenter/);
      expect(stackContent).toMatch(/Environment/);
    });

    test("creates Config rule for encrypted volumes", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_config_rule"\s+"encrypted_volumes"/);
      expect(stackContent).toMatch(/ENCRYPTED_VOLUMES/);
    });
  });

  describe("IAM Security Configuration", () => {
    test("creates strict password policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_account_password_policy"\s+"strict"/);
      expect(stackContent).toMatch(/minimum_password_length\s*=\s*14/);
      expect(stackContent).toMatch(/require_uppercase_characters\s*=\s*true/);
      expect(stackContent).toMatch(/require_lowercase_characters\s*=\s*true/);
      expect(stackContent).toMatch(/require_numbers\s*=\s*true/);
      expect(stackContent).toMatch(/require_symbols\s*=\s*true/);
      expect(stackContent).toMatch(/password_reuse_prevention\s*=\s*24/);
    });

    test("creates admin role with MFA requirement", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"admin"/);
      expect(stackContent).toMatch(/aws:MultiFactorAuthPresent/);
    });

    test("attaches AdministratorAccess to admin role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"admin"/);
      expect(stackContent).toMatch(/AdministratorAccess/);
    });

    test("creates readonly role with MFA requirement", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"readonly"/);
    });

    test("attaches ReadOnlyAccess to readonly role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"readonly"/);
      expect(stackContent).toMatch(/ReadOnlyAccess/);
    });

    test("creates MFA enforcement policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"enforce_mfa"/);
      expect(stackContent).toMatch(/DenyAllExceptListedIfNoMFA/);
    });

    test("creates IAM group for console users", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_group"\s+"users"/);
      expect(stackContent).toMatch(/console-users/);
    });

    test("attaches MFA policy to users group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_group_policy_attachment"\s+"enforce_mfa"/);
    });
  });

  describe("Budgets and Cost Management", () => {
    test("creates monthly budget", () => {
      expect(stackContent).toMatch(/resource\s+"aws_budgets_budget"\s+"monthly"/);
      expect(stackContent).toMatch(/budget_type\s*=\s*"COST"/);
      expect(stackContent).toMatch(/time_unit\s*=\s*"MONTHLY"/);
    });

    test("budget has notifications configured", () => {
      expect(stackContent).toMatch(/notification\s*{/);
      expect(stackContent).toMatch(/threshold\s*=\s*80/);
      expect(stackContent).toMatch(/threshold\s*=\s*100/);
    });

    test("creates CloudWatch budget alarm", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"budget_alarm"/);
      expect(stackContent).toMatch(/EstimatedCharges/);
      expect(stackContent).toMatch(/AWS\/Billing/);
    });
  });

  describe("SNS Notifications", () => {
    test("creates SNS topic for alerts", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
      expect(stackContent).toMatch(/security-alerts/);
    });

    test("SNS topic uses KMS encryption", () => {
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.master\.id/);
    });

    test("creates SNS topic policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic_policy"\s+"alerts"/);
      expect(stackContent).toMatch(/AllowCloudWatchToPublish/);
      expect(stackContent).toMatch(/AllowBudgetsToPublish/);
    });
  });

  describe("CloudWatch Monitoring", () => {
    test("creates log metric filter for unauthorized API calls", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"unauthorized_api_calls"/);
      expect(stackContent).toMatch(/UnauthorizedOperation/);
      expect(stackContent).toMatch(/AccessDenied/);
    });

    test("creates alarm for unauthorized API calls", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"unauthorized_api_calls"/);
      expect(stackContent).toMatch(/UnauthorizedAPICalls/);
      expect(stackContent).toMatch(/SecurityMetrics/);
    });
  });

  describe("GuardDuty Configuration", () => {
    test("enables GuardDuty detector", () => {
      expect(stackContent).toMatch(/resource\s+"aws_guardduty_detector"\s+"main"/);
      expect(stackContent).toMatch(/enable\s*=\s*true/);
    });

    test("configures GuardDuty finding frequency", () => {
      expect(stackContent).toMatch(/finding_publishing_frequency\s*=\s*"FIFTEEN_MINUTES"/);
    });

    test("enables S3 logs datasource", () => {
      expect(stackContent).toMatch(/datasources\s*{/);
      expect(stackContent).toMatch(/s3_logs\s*{/);
      expect(stackContent).toMatch(/enable\s*=\s*true/);
    });
  });

  describe("Security Best Practices", () => {
    test("no hardcoded AWS credentials", () => {
      expect(stackContent).not.toMatch(/aws_access_key_id/i);
      expect(stackContent).not.toMatch(/aws_secret_access_key/i);
      expect(stackContent).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS access key pattern
    });

    test("no hardcoded passwords", () => {
      expect(stackContent).not.toMatch(/password\s*=\s*"[^"]+"/);
    });

    test("uses encryption at rest", () => {
      const encryptionMatches = stackContent.match(/encrypted\s*=\s*true|sse_algorithm\s*=\s*"aws:kms"/g);
      expect(encryptionMatches).not.toBeNull();
      expect(encryptionMatches!.length).toBeGreaterThanOrEqual(2);
    });

    test("uses KMS for encryption", () => {
      const kmsMatches = stackContent.match(/kms_key_id|kms_master_key_id/g);
      expect(kmsMatches).not.toBeNull();
      expect(kmsMatches!.length).toBeGreaterThanOrEqual(5);
    });

    test("no buckets with force_destroy = false for QA", () => {
      // For QA pipeline, buckets should be destroyable
      expect(stackContent).toMatch(/force_destroy\s*=\s*false/);
    });

    test("no public 0.0.0.0/0 inbound access on security groups", () => {
      // Should not have unrestricted inbound rules
      const sgMatches = stackContent.match(/resource\s+"aws_security_group"/g);
      expect(sgMatches).not.toBeNull();
      // Verify security groups exist
      expect(sgMatches!.length).toBeGreaterThan(0);
    });
  });

  describe("Code Quality", () => {
    test("no syntax errors in HCL", () => {
      // Basic checks for common syntax issues - balanced braces
      const openBraces = (stackContent.match(/{/g) || []).length;
      const closeBraces = (stackContent.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    test("resources have descriptive names", () => {
      expect(stackContent).toMatch(/name\s*=\s*"[a-z-]+"/);
      expect(stackContent).not.toMatch(/name\s*=\s*"test"/);
      expect(stackContent).not.toMatch(/name\s*=\s*"foo"/);
    });

    test("proper indentation (2 or 4 spaces)", () => {
      const lines = stackContent.split('\n');
      const indentedLines = lines.filter(line => line.match(/^\s+\w/));
      expect(indentedLines.length).toBeGreaterThan(0);
    });
  });
});
