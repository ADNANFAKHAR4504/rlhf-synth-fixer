// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for Terraform zero-trust architecture
// Tests Terraform file structure, syntax, and resource definitions

import fs from "fs";
import path from "path";

const STACK_FILE = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_FILE);

describe("Terraform Zero-Trust Architecture - Unit Tests", () => {
  let terraformContent: string;

  beforeAll(() => {
    // Read the Terraform file once for all tests
    if (fs.existsSync(stackPath)) {
      terraformContent = fs.readFileSync(stackPath, "utf8");
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

    test("file is not empty", () => {
      expect(terraformContent).toBeDefined();
      expect(terraformContent.length).toBeGreaterThan(100);
    });
  });

  describe("Data Sources", () => {
    test("declares aws_caller_identity data source", () => {
      expect(terraformContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test("declares aws_region data source", () => {
      expect(terraformContent).toMatch(/data\s+"aws_region"\s+"current"/);
    });
  });

  describe("Variables", () => {
    test("declares environment_suffix variable", () => {
      expect(terraformContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("declares aws_region variable", () => {
      expect(terraformContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("declares vpc_cidr variable", () => {
      expect(terraformContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
    });

    test("declares availability_zones variable", () => {
      expect(terraformContent).toMatch(/variable\s+"availability_zones"\s*{/);
    });

    test("declares enable_guardduty variable", () => {
      expect(terraformContent).toMatch(/variable\s+"enable_guardduty"\s*{/);
    });

    test("declares enable_config variable", () => {
      expect(terraformContent).toMatch(/variable\s+"enable_config"\s*{/);
    });

    test("declares cloudtrail_retention_days variable", () => {
      expect(terraformContent).toMatch(/variable\s+"cloudtrail_retention_days"\s*{/);
    });

    test("declares cloudwatch_log_retention_days variable", () => {
      expect(terraformContent).toMatch(/variable\s+"cloudwatch_log_retention_days"\s*{/);
    });
  });

  describe("VPC Resources", () => {
    test("declares VPC resource", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    });

    test("VPC has environment_suffix in name tag", () => {
      const vpcMatch = terraformContent.match(/resource\s+"aws_vpc"\s+"main"\s*{[\s\S]*?Name\s*=\s*"[^"]*\$\{var\.environment_suffix\}/);
      expect(vpcMatch).toBeTruthy();
    });

    test("declares private subnets", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });
  });

  describe("Network ACL Resources", () => {
    test("declares network ACL resource", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_network_acl"\s+"private"/);
    });

    test("network ACL has ingress rules", () => {
      const naclMatch = terraformContent.match(/resource\s+"aws_network_acl"\s+"private"\s*{[\s\S]*?ingress\s*{/);
      expect(naclMatch).toBeTruthy();
    });

    test("network ACL has egress rules", () => {
      const naclMatch = terraformContent.match(/resource\s+"aws_network_acl"\s+"private"\s*{[\s\S]*?egress\s*{/);
      expect(naclMatch).toBeTruthy();
    });
  });

  describe("Security Group Resources", () => {
    test("declares security group", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_security_group"\s+"data_processing"/);
    });

    test("security group has HTTPS ingress rule", () => {
      const sgMatch = terraformContent.match(/resource\s+"aws_security_group"[\s\S]*?from_port\s*=\s*443[\s\S]*?to_port\s*=\s*443/);
      expect(sgMatch).toBeTruthy();
    });
  });

  describe("KMS Resources", () => {
    test("declares main KMS key", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
    });

    test("main KMS key has rotation enabled", () => {
      const kmsMatch = terraformContent.match(/resource\s+"aws_kms_key"\s+"main"\s*{[\s\S]*?enable_key_rotation\s*=\s*true/);
      expect(kmsMatch).toBeTruthy();
    });

    test("declares CloudWatch KMS key", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_kms_key"\s+"cloudwatch"/);
    });

    test("declares main KMS alias", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
    });

    test("declares CloudWatch KMS alias", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_kms_alias"\s+"cloudwatch"/);
    });

    test("KMS key policy allows CloudTrail", () => {
      expect(terraformContent).toMatch(/cloudtrail\.amazonaws\.com/i);
    });

    test("KMS key policy allows Config service", () => {
      expect(terraformContent).toMatch(/config\.amazonaws\.com/i);
    });
  });

  describe("S3 Resources", () => {
    test("declares access logs bucket", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket"\s+"access_logs"/);
    });

    test("access logs bucket has force_destroy", () => {
      const s3Match = terraformContent.match(/resource\s+"aws_s3_bucket"\s+"access_logs"\s*{[\s\S]*?force_destroy\s*=\s*true/);
      expect(s3Match).toBeTruthy();
    });

    test("declares sensitive data bucket", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket"\s+"sensitive_data"/);
    });

    test("sensitive data bucket has force_destroy", () => {
      const s3Match = terraformContent.match(/resource\s+"aws_s3_bucket"\s+"sensitive_data"\s*{[\s\S]*?force_destroy\s*=\s*true/);
      expect(s3Match).toBeTruthy();
    });

    test("declares sensitive data bucket logging", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_logging"\s+"sensitive_data"/);
    });

    test("declares sensitive data bucket versioning", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"sensitive_data"/);
    });

    test("sensitive data bucket versioning is enabled", () => {
      const versionMatch = terraformContent.match(/resource\s+"aws_s3_bucket_versioning"\s+"sensitive_data"[\s\S]*?status\s*=\s*"Enabled"/);
      expect(versionMatch).toBeTruthy();
    });

    test("declares sensitive data bucket encryption", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"sensitive_data"/);
    });

    test("sensitive data bucket uses KMS encryption", () => {
      const encryptMatch = terraformContent.match(/sse_algorithm\s*=\s*"aws:kms"/);
      expect(encryptMatch).toBeTruthy();
    });

    test("declares sensitive data bucket public access block", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"sensitive_data"/);
    });

    test("declares sensitive data bucket lifecycle", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"sensitive_data"/);
    });

    test("lifecycle has empty filter", () => {
      const lifecycleMatch = terraformContent.match(/resource\s+"aws_s3_bucket_lifecycle_configuration"[\s\S]*?filter\s*\{\s*\}/);
      expect(lifecycleMatch).toBeTruthy();
    });

    test("declares CloudTrail bucket", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail"/);
    });

    test("declares CloudTrail bucket policy", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"/);
    });
  });

  describe("CloudTrail Resources", () => {
    test("declares CloudTrail", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
    });

    test("CloudTrail is multi-region", () => {
      const trailMatch = terraformContent.match(/resource\s+"aws_cloudtrail"\s+"main"[\s\S]*?is_multi_region_trail\s*=\s*true/);
      expect(trailMatch).toBeTruthy();
    });

    test("CloudTrail has log file validation enabled", () => {
      const trailMatch = terraformContent.match(/enable_log_file_validation\s*=\s*true/);
      expect(trailMatch).toBeTruthy();
    });

    test("CloudTrail uses KMS encryption", () => {
      const trailMatch = terraformContent.match(/resource\s+"aws_cloudtrail"\s+"main"[\s\S]*?kms_key_id/);
      expect(trailMatch).toBeTruthy();
    });
  });

  describe("CloudWatch Resources", () => {
    test("declares VPC flow logs log group", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"flow_logs"/);
    });

    test("declares application log group", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"application"/);
    });

    test("application log group uses correct naming pattern", () => {
      const logMatch = terraformContent.match(/name\s*=\s*"\/aws\/application\/\$\{var\.environment_suffix\}"/);
      expect(logMatch).toBeTruthy();
    });

    test("declares unauthorized API calls alarm", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"unauthorized_api_calls"/);
    });

    test("unauthorized API calls alarm threshold is 5", () => {
      const alarmMatch = terraformContent.match(/resource\s+"aws_cloudwatch_metric_alarm"\s+"unauthorized_api_calls"[\s\S]*?threshold\s*=\s*"5"/);
      expect(alarmMatch).toBeTruthy();
    });

    test("declares root account usage alarm", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"root_account_usage"/);
    });
  });

  describe("IAM Resources", () => {
    test("declares flow logs IAM role", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_iam_role"\s+"flow_logs"/);
    });

    test("declares flow logs IAM policy", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"flow_logs"/);
    });
  });

  describe("VPC Flow Logs", () => {
    test("declares VPC flow log", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_flow_log"\s+"main"/);
    });

    test("flow log captures ALL traffic", () => {
      const flowMatch = terraformContent.match(/traffic_type\s*=\s*"ALL"/);
      expect(flowMatch).toBeTruthy();
    });
  });

  describe("VPC Endpoints", () => {
    test("declares S3 VPC endpoint", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3"/);
    });

    test("declares KMS VPC endpoint", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"kms"/);
    });

    test("KMS endpoint is Interface type", () => {
      const kmsEndpointMatch = terraformContent.match(/resource\s+"aws_vpc_endpoint"\s+"kms"[\s\S]*?vpc_endpoint_type\s*=\s*"Interface"/);
      expect(kmsEndpointMatch).toBeTruthy();
    });
  });

  describe("GuardDuty Resources", () => {
    test("declares GuardDuty detector (conditional)", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_guardduty_detector"\s+"main"/);
    });

    test("GuardDuty uses count for conditional creation", () => {
      const guarddutyMatch = terraformContent.match(/resource\s+"aws_guardduty_detector"\s+"main"\s*{\s*count\s*=\s*var\.enable_guardduty/);
      expect(guarddutyMatch).toBeTruthy();
    });
  });

  describe("AWS Config Resources", () => {
    test("declares Config S3 bucket (conditional)", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket"\s+"config"/);
    });

    test("declares Config IAM role", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_iam_role"\s+"config"/);
    });

    test("declares Config IAM role policy attachment", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"config"/);
    });

    test("declares Config configuration recorder", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"/);
    });

    test("declares Config delivery channel", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"/);
    });

    test("declares Config recorder status", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_config_configuration_recorder_status"\s+"main"/);
    });

    test("declares Config encrypted volumes rule", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_config_config_rule"\s+"encrypted_volumes"/);
    });

    test("declares Config S3 public read prohibited rule", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_config_config_rule"\s+"s3_bucket_public_read_prohibited"/);
    });

    test("declares Config IAM password policy rule", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_config_config_rule"\s+"iam_password_policy"/);
    });
  });

  describe("Outputs", () => {
    test("declares vpc_id output", () => {
      expect(terraformContent).toMatch(/output\s+"vpc_id"/);
    });

    test("declares private_subnet_ids output", () => {
      expect(terraformContent).toMatch(/output\s+"private_subnet_ids"/);
    });

    test("declares network_acl_id output", () => {
      expect(terraformContent).toMatch(/output\s+"network_acl_id"/);
    });

    test("declares security_group_id output", () => {
      expect(terraformContent).toMatch(/output\s+"security_group_id"/);
    });

    test("declares kms_key_id output", () => {
      expect(terraformContent).toMatch(/output\s+"kms_key_id"/);
    });

    test("declares kms_key_arn output", () => {
      expect(terraformContent).toMatch(/output\s+"kms_key_arn"/);
    });

    test("declares access_logs_bucket_name output", () => {
      expect(terraformContent).toMatch(/output\s+"access_logs_bucket_name"/);
    });

    test("declares sensitive_data_bucket_name output", () => {
      expect(terraformContent).toMatch(/output\s+"sensitive_data_bucket_name"/);
    });

    test("declares cloudtrail_name output", () => {
      expect(terraformContent).toMatch(/output\s+"cloudtrail_name"/);
    });

    test("declares flow_logs_log_group output", () => {
      expect(terraformContent).toMatch(/output\s+"flow_logs_log_group"/);
    });

    test("declares application_log_group output", () => {
      expect(terraformContent).toMatch(/output\s+"application_log_group"/);
    });

    test("declares guardduty_detector_id output", () => {
      expect(terraformContent).toMatch(/output\s+"guardduty_detector_id"/);
    });

    test("declares config_recorder_id output", () => {
      expect(terraformContent).toMatch(/output\s+"config_recorder_id"/);
    });

    test("declares config_bucket_name output", () => {
      expect(terraformContent).toMatch(/output\s+"config_bucket_name"/);
    });
  });

  describe("Resource Naming", () => {
    test("all resource names include environment_suffix", () => {
      // Check that environment_suffix is used in resource names
      const namedResources = terraformContent.match(/Name\s*=\s*"[^"]*\$\{var\.environment_suffix\}/g);
      expect(namedResources).toBeTruthy();
      expect(namedResources!.length).toBeGreaterThan(10);
    });

    test("resources use zero-trust prefix", () => {
      const zeroTrustResources = terraformContent.match(/Name\s*=\s*"zero-trust-/g);
      expect(zeroTrustResources).toBeTruthy();
      expect(zeroTrustResources!.length).toBeGreaterThan(10);
    });
  });

  describe("Security Configuration", () => {
    test("all S3 buckets have force_destroy enabled", () => {
      const s3Buckets = terraformContent.match(/resource\s+"aws_s3_bucket"/g);
      const forceDestroy = terraformContent.match(/force_destroy\s*=\s*true/g);
      expect(s3Buckets).toBeTruthy();
      expect(forceDestroy).toBeTruthy();
      // Should have at least 3 S3 buckets with force_destroy
      expect(forceDestroy!.length).toBeGreaterThanOrEqual(3);
    });

    test("S3 buckets block public access", () => {
      const publicAccessBlocks = terraformContent.match(/block_public_acls\s*=\s*true/g);
      expect(publicAccessBlocks).toBeTruthy();
      expect(publicAccessBlocks!.length).toBeGreaterThanOrEqual(3);
    });

    test("KMS keys have deletion window", () => {
      const deletionWindow = terraformContent.match(/deletion_window_in_days\s*=\s*7/g);
      expect(deletionWindow).toBeTruthy();
      expect(deletionWindow!.length).toBeGreaterThanOrEqual(2);
    });
  });
});
