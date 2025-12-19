// test/terraform.unit.test.ts
// Unit tests for S3 Cross-Region Replication Terraform configuration
// Static code analysis - validates configuration before deployment
// NO Terraform commands - just reads main.tf file as text

import * as fs from "fs";
import * as path from "path";

// Path to main.tf in lib/ folder (one level up from test/)
const TERRAFORM_FILE = path.resolve(__dirname, "../lib/main.tf");

let tf: string;

beforeAll(() => {
  if (!fs.existsSync(TERRAFORM_FILE)) {
    throw new Error(`Terraform file not found at: ${TERRAFORM_FILE}`);
  }
  tf = fs.readFileSync(TERRAFORM_FILE, "utf8");
});

// Helper function to test regex patterns
function has(rx: RegExp): boolean {
  return rx.test(tf);
}

describe("S3 Cross-Region Replication - Unit Tests", () => {
  
  describe("File Structure and Size", () => {
    test("main.tf exists and is non-trivial", () => {
      expect(tf).toBeDefined();
      expect(tf.length).toBeGreaterThan(10000);
      expect(tf).toMatch(/resource|variable|output/);
    });

    test("file has proper provider configuration", () => {
      // Provider configuration can be in main.tf or separate provider.tf (best practice)
      const providerFile = path.resolve(__dirname, "../lib/provider.tf");
      const hasProviderInMain = /provider\s+"aws"/.test(tf);
      const hasProviderFile = fs.existsSync(providerFile);
      
      expect(hasProviderInMain || hasProviderFile).toBe(true);
    });
  });

  describe("Required Variables", () => {
    test("declares region variable", () => {
      expect(has(/variable\s+"region"/)).toBe(true);
    });

    test("declares environment variable", () => {
      expect(has(/variable\s+"environment"/)).toBe(true);
    });

    test("declares project_name variable", () => {
      expect(has(/variable\s+"project_name"/)).toBe(true);
    });

    test("declares alarm threshold variables", () => {
      expect(has(/variable\s+"replication_latency_threshold"/)).toBe(true);
      expect(has(/variable\s+"pending_replication_threshold"/)).toBe(true);
    });

    test("declares lifecycle policy variables", () => {
      expect(has(/variable\s+"lifecycle_noncurrent_expiration_days"/)).toBe(true);
      expect(has(/variable\s+"lifecycle_multipart_expiration_days"/)).toBe(true);
    });

    test("variables have proper defaults", () => {
      expect(has(/default\s*=\s*"us-east-1"/)).toBe(true);
      expect(has(/default\s*=\s*"production"/)).toBe(true);
      expect(has(/default\s*=\s*"retail-v2"/)).toBe(true);
      expect(has(/default\s*=\s*900/)).toBe(true);
      expect(has(/default\s*=\s*90/)).toBe(true);
    });
  });

  describe("Data Sources and Locals", () => {
    test("uses data source to get AWS account ID", () => {
      expect(has(/data\s+"aws_caller_identity"\s+"current"/)).toBe(true);
    });

    test("defines locals block with account_id", () => {
      expect(has(/locals\s*{/)).toBe(true);
      expect(has(/account_id\s*=\s*data\.aws_caller_identity\.current\.account_id/)).toBe(true);
    });

    test("defines bucket naming patterns in locals", () => {
      expect(has(/source_bucket_name/)).toBe(true);
      expect(has(/replica_bucket_name/)).toBe(true);
      expect(has(/cloudtrail_bucket_name/)).toBe(true);
    });

    test("defines common tags in locals", () => {
      expect(has(/common_tags\s*=/)).toBe(true);
      expect(has(/Project/)).toBe(true);
      expect(has(/Environment/)).toBe(true);
      expect(has(/ManagedBy.*Terraform/)).toBe(true);
      expect(has(/DataClassification.*Confidential/)).toBe(true);
    });
  });

  describe("KMS Keys - Encryption at Rest", () => {
    test("creates KMS key in us-east-1", () => {
      expect(has(/resource\s+"aws_kms_key"\s+"source_key"/)).toBe(true);
      expect(has(/provider\s*=\s*aws\.us_east_1/)).toBe(true);
    });

    test("creates KMS key in eu-west-1", () => {
      expect(has(/resource\s+"aws_kms_key"\s+"replica_key"/)).toBe(true);
      expect(has(/provider\s*=\s*aws\.eu_west_1/)).toBe(true);
    });

    test("enables automatic key rotation", () => {
      const rotationMatches = tf.match(/enable_key_rotation\s*=\s*true/g);
      expect(rotationMatches).not.toBeNull();
      expect(rotationMatches!.length).toBeGreaterThanOrEqual(2);
    });

    test("creates KMS key aliases", () => {
      expect(has(/resource\s+"aws_kms_alias"\s+"source_key_alias"/)).toBe(true);
      expect(has(/alias\/retail-data-source-key-v2/)).toBe(true);
      expect(has(/resource\s+"aws_kms_alias"\s+"replica_key_alias"/)).toBe(true);
      expect(has(/alias\/retail-data-replica-key-v2/)).toBe(true);
    });

    test("KMS policies allow S3 service", () => {
      expect(has(/"Allow S3 Service"/)).toBe(true);
      expect(has(/Service.*s3\.amazonaws\.com/)).toBe(true);
    });

    test("KMS policies allow replication role", () => {
      expect(has(/"Allow Replication Role"/)).toBe(true);
      expect(has(/aws_iam_role\.replication_role\.arn/)).toBe(true);
    });

    test("source KMS policy allows CloudTrail", () => {
      expect(has(/"Allow CloudTrail"/)).toBe(true);
      expect(has(/cloudtrail\.amazonaws\.com/)).toBe(true);
    });
  });

  describe("IAM Roles and Policies", () => {
    test("creates replication IAM role", () => {
      expect(has(/resource\s+"aws_iam_role"\s+"replication_role"/)).toBe(true);
      expect(has(/name\s*=\s*"retail-s3-replication-role-v2"/)).toBe(true);
    });

    test("replication role trust policy allows S3 service", () => {
      expect(has(/assume_role_policy/)).toBe(true);
      expect(has(/s3\.amazonaws\.com/)).toBe(true);
    });

    test("creates replication IAM policy", () => {
      expect(has(/resource\s+"aws_iam_role_policy"\s+"replication_policy"/)).toBe(true);
    });

    test("replication policy has required S3 permissions", () => {
      expect(has(/"s3:GetReplicationConfiguration"/)).toBe(true);
      expect(has(/"s3:GetObjectVersionForReplication"/)).toBe(true);
      expect(has(/"s3:ReplicateObject"/)).toBe(true);
      expect(has(/"s3:ReplicateDelete"/)).toBe(true);
      expect(has(/"s3:ReplicateTags"/)).toBe(true);
    });

    test("replication policy has KMS permissions", () => {
      expect(has(/"kms:Decrypt"/)).toBe(true);
      expect(has(/"kms:Encrypt"/)).toBe(true);
      expect(has(/"kms:GenerateDataKey"/)).toBe(true);
    });

    test("IAM policy uses specific resource ARNs (least privilege)", () => {
      expect(has(/aws_s3_bucket\.source\.arn/)).toBe(true);
      expect(has(/aws_s3_bucket\.replica\.arn/)).toBe(true);
      expect(has(/aws_kms_key\.source_key\.arn/)).toBe(true);
      expect(has(/aws_kms_key\.replica_key\.arn/)).toBe(true);
    });

    test("creates CloudTrail IAM role", () => {
      expect(has(/resource\s+"aws_iam_role"\s+"cloudtrail"/)).toBe(true);
    });

    test("CloudTrail role has CloudWatch Logs permissions", () => {
      expect(has(/resource\s+"aws_iam_role_policy"\s+"cloudtrail"/)).toBe(true);
      expect(has(/"logs:CreateLogStream"/)).toBe(true);
      expect(has(/"logs:PutLogEvents"/)).toBe(true);
    });
  });

  describe("S3 Source Bucket Configuration", () => {
    test("creates source bucket in us-east-1", () => {
      expect(has(/resource\s+"aws_s3_bucket"\s+"source"/)).toBe(true);
      expect(has(/bucket\s*=\s*local\.source_bucket_name/)).toBe(true);
    });

    test("enables versioning on source bucket", () => {
      expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"source"/)).toBe(true);
      expect(has(/status\s*=\s*"Enabled"/)).toBe(true);
    });

    test("configures KMS encryption on source bucket", () => {
      expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"source"/)).toBe(true);
      expect(has(/sse_algorithm\s*=\s*"aws:kms"/)).toBe(true);
      expect(has(/kms_master_key_id\s*=\s*aws_kms_key\.source_key\.arn/)).toBe(true);
      expect(has(/bucket_key_enabled\s*=\s*true/)).toBe(true);
    });

    test("blocks all public access on source bucket", () => {
      expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"source"/)).toBe(true);
      expect(has(/block_public_acls\s*=\s*true/)).toBe(true);
      expect(has(/block_public_policy\s*=\s*true/)).toBe(true);
      expect(has(/ignore_public_acls\s*=\s*true/)).toBe(true);
      expect(has(/restrict_public_buckets\s*=\s*true/)).toBe(true);
    });

    test("configures Intelligent-Tiering", () => {
      expect(has(/resource\s+"aws_s3_bucket_intelligent_tiering_configuration"\s+"source"/)).toBe(true);
      expect(has(/access_tier\s*=\s*"ARCHIVE_ACCESS"/)).toBe(true);
      expect(has(/days\s*=\s*90/)).toBe(true);
    });

    test("configures lifecycle policies", () => {
      expect(has(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"source"/)).toBe(true);
      expect(has(/delete-incomplete-multipart-uploads/)).toBe(true);
      expect(has(/expire-noncurrent-versions/)).toBe(true);
      expect(has(/abort_incomplete_multipart_upload/)).toBe(true);
      expect(has(/noncurrent_version_expiration/)).toBe(true);
      expect(has(/filter\s*{}/)).toBe(true);
    });
  });

  describe("S3 Replica Bucket Configuration", () => {
    test("creates replica bucket in eu-west-1", () => {
      expect(has(/resource\s+"aws_s3_bucket"\s+"replica"/)).toBe(true);
      expect(has(/bucket\s*=\s*local\.replica_bucket_name/)).toBe(true);
    });

    test("enables versioning on replica bucket", () => {
      expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"replica"/)).toBe(true);
    });

    test("configures KMS encryption on replica bucket", () => {
      expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"replica"/)).toBe(true);
      expect(has(/kms_master_key_id\s*=\s*aws_kms_key\.replica_key\.arn/)).toBe(true);
    });

    test("blocks all public access on replica bucket", () => {
      expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"replica"/)).toBe(true);
    });

    test("configures Intelligent-Tiering on replica", () => {
      expect(has(/resource\s+"aws_s3_bucket_intelligent_tiering_configuration"\s+"replica"/)).toBe(true);
    });

    test("configures lifecycle policies on replica", () => {
      expect(has(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"replica"/)).toBe(true);
    });
  });

  describe("S3 Replication Configuration", () => {
    test("creates replication configuration", () => {
      expect(has(/resource\s+"aws_s3_bucket_replication_configuration"\s+"replication"/)).toBe(true);
    });

    test("replication depends on source versioning", () => {
      expect(has(/depends_on\s*=\s*\[\s*aws_s3_bucket_versioning\.source\s*\]/)).toBe(true);
    });

    test("uses replication IAM role", () => {
      expect(has(/role\s*=\s*aws_iam_role\.replication_role\.arn/)).toBe(true);
    });

    test("enables delete marker replication", () => {
      expect(has(/delete_marker_replication/)).toBe(true);
      expect(has(/status\s*=\s*"Enabled"/)).toBe(true);
    });

    test("includes source_selection_criteria for KMS (CRITICAL)", () => {
      expect(has(/source_selection_criteria/)).toBe(true);
      expect(has(/sse_kms_encrypted_objects/)).toBe(true);
    });

    test("configures encryption with replica KMS key", () => {
      expect(has(/encryption_configuration/)).toBe(true);
      expect(has(/replica_kms_key_id\s*=\s*aws_kms_key\.replica_key\.arn/)).toBe(true);
    });

    test("enables Replication Time Control (15 minutes)", () => {
      expect(has(/replication_time/)).toBe(true);
      expect(has(/minutes\s*=\s*15/)).toBe(true);
    });

    test("enables replication metrics", () => {
      expect(has(/metrics.*{/)).toBe(true);
      expect(has(/event_threshold/)).toBe(true);
    });
  });

  describe("SNS Topics", () => {
    test("creates SNS topic for critical alerts", () => {
      expect(has(/resource\s+"aws_sns_topic"\s+"critical_alerts"/)).toBe(true);
      expect(has(/name\s*=\s*"retail-s3-critical-alerts-v2"/)).toBe(true);
    });

    test("creates SNS topic for warning alerts", () => {
      expect(has(/resource\s+"aws_sns_topic"\s+"warning_alerts"/)).toBe(true);
      expect(has(/name\s*=\s*"retail-s3-warning-alerts-v2"/)).toBe(true);
    });

    test("creates SNS topic for info alerts", () => {
      expect(has(/resource\s+"aws_sns_topic"\s+"info_alerts"/)).toBe(true);
      expect(has(/name\s*=\s*"retail-s3-info-alerts-v2"/)).toBe(true);
    });

    test("creates SNS topic policies for EventBridge and CloudWatch", () => {
      expect(has(/resource\s+"aws_sns_topic_policy"\s+"critical_alerts_policy"/)).toBe(true);
      expect(has(/resource\s+"aws_sns_topic_policy"\s+"warning_alerts_policy"/)).toBe(true);
      expect(has(/resource\s+"aws_sns_topic_policy"\s+"info_alerts_policy"/)).toBe(true);
    });

    test("SNS policies allow EventBridge to publish", () => {
      expect(has(/"AllowEventBridgePublish"/)).toBe(true);
      expect(has(/"events\.amazonaws\.com"/)).toBe(true);
      expect(has(/"sns:Publish"/)).toBe(true);
    });

    test("SNS policies allow CloudWatch to publish", () => {
      expect(has(/"AllowCloudWatchPublish"/)).toBe(true);
      expect(has(/"cloudwatch\.amazonaws\.com"/)).toBe(true);
    });
  });

  describe("CloudWatch Monitoring", () => {
    test("creates replication latency alarm", () => {
      expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"replication_latency"/)).toBe(true);
      expect(has(/metric_name\s*=\s*"ReplicationLatency"/)).toBe(true);
      expect(has(/threshold\s*=\s*var\.replication_latency_threshold/)).toBe(true);
    });

    test("alarms have SNS actions configured", () => {
      expect(has(/alarm_actions\s*=\s*\[\s*aws_sns_topic\.critical_alerts\.arn\s*\]/)).toBe(true);
      expect(has(/alarm_actions\s*=\s*\[\s*aws_sns_topic\.warning_alerts\.arn\s*\]/)).toBe(true);
    });

    test("creates pending bytes alarm", () => {
      expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"bytes_pending_replication"/)).toBe(true);
      expect(has(/metric_name\s*=\s*"BytesPendingReplication"/)).toBe(true);
    });

    test("creates 4xx errors alarm", () => {
      expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"source_4xx_errors"/)).toBe(true);
      expect(has(/metric_name\s*=\s*"4xxErrors"/)).toBe(true);
      expect(has(/threshold\s*=\s*100/)).toBe(true);
    });

    test("creates 5xx errors alarm", () => {
      expect(has(/resource\s+"aws_cloudwatch_metric_alarm"\s+"source_5xx_errors"/)).toBe(true);
      expect(has(/metric_name\s*=\s*"5xxErrors"/)).toBe(true);
      expect(has(/threshold\s*=\s*10/)).toBe(true);
    });

    test("creates CloudWatch dashboard", () => {
      expect(has(/resource\s+"aws_cloudwatch_dashboard"\s+"replication"/)).toBe(true);
      expect(has(/dashboard_name\s*=\s*"retail-s3-replication-dashboard-v2"/)).toBe(true);
    });

    test("dashboard includes replication metrics", () => {
      expect(has(/ReplicationLatency/)).toBe(true);
      expect(has(/BytesPendingReplication/)).toBe(true);
      expect(has(/OperationsPendingReplication/)).toBe(true);
    });

    test("creates CloudWatch log groups", () => {
      expect(has(/resource\s+"aws_cloudwatch_log_group"\s+"eventbridge_logs"/)).toBe(true);
      expect(has(/resource\s+"aws_cloudwatch_log_group"\s+"cloudtrail_logs"/)).toBe(true);
      expect(has(/retention_in_days\s*=\s*var\.log_retention_days/)).toBe(true);
    });
  });

  describe("EventBridge Configuration", () => {
    test("creates EventBridge rule for S3 object events", () => {
      expect(has(/resource\s+"aws_cloudwatch_event_rule"\s+"s3_object_events"/)).toBe(true);
      expect(has(/retail-s3-object-events-v2/)).toBe(true);
    });

    test("creates EventBridge rule for replication events", () => {
      expect(has(/resource\s+"aws_cloudwatch_event_rule"\s+"s3_replication_events"/)).toBe(true);
      expect(has(/retail-s3-replication-events-v2/)).toBe(true);
    });

    test("creates EventBridge rule for security events", () => {
      expect(has(/resource\s+"aws_cloudwatch_event_rule"\s+"s3_security_events"/)).toBe(true);
      expect(has(/retail-s3-security-events-v2/)).toBe(true);
    });

    test("EventBridge rules have CloudWatch Logs targets", () => {
      expect(has(/resource\s+"aws_cloudwatch_event_target"/)).toBe(true);
      expect(has(/aws_cloudwatch_log_group\.eventbridge_logs\.arn/)).toBe(true);
    });

    test("EventBridge rules have SNS targets", () => {
      expect(has(/s3_object_events_sns/)).toBe(true);
      expect(has(/s3_replication_events_sns/)).toBe(true);
      expect(has(/s3_security_events_sns/)).toBe(true);
    });
  });

  describe("CloudTrail Configuration", () => {
    test("creates dedicated CloudTrail logs bucket", () => {
      expect(has(/resource\s+"aws_s3_bucket"\s+"cloudtrail"/)).toBe(true);
      expect(has(/bucket\s*=\s*local\.cloudtrail_bucket_name/)).toBe(true);
    });

    test("CloudTrail bucket has versioning enabled", () => {
      expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"cloudtrail"/)).toBe(true);
    });

    test("CloudTrail bucket has encryption enabled", () => {
      expect(has(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"cloudtrail"/)).toBe(true);
    });

    test("CloudTrail bucket has public access blocked", () => {
      expect(has(/resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail"/)).toBe(true);
    });

    test("CloudTrail bucket policy allows CloudTrail service", () => {
      expect(has(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"/)).toBe(true);
      expect(has(/AWSCloudTrailAclCheck/)).toBe(true);
      expect(has(/AWSCloudTrailWrite/)).toBe(true);
    });

    test("creates CloudTrail trail", () => {
      expect(has(/resource\s+"aws_cloudtrail"\s+"main"/)).toBe(true);
      expect(has(/name\s*=\s*"retail-s3-audit-trail-v2"/)).toBe(true);
    });

    test("CloudTrail is multi-region", () => {
      expect(has(/is_multi_region_trail\s*=\s*true/)).toBe(true);
    });

    test("CloudTrail log file validation enabled", () => {
      expect(has(/enable_log_file_validation\s*=\s*true/)).toBe(true);
    });

    test("CloudTrail captures S3 data events", () => {
      expect(has(/event_selector/)).toBe(true);
      expect(has(/data_resource/)).toBe(true);
      expect(has(/AWS::S3::Object/)).toBe(true);
    });

    test("CloudTrail integrates with CloudWatch Logs", () => {
      expect(has(/cloud_watch_logs_group_arn/)).toBe(true);
      expect(has(/cloud_watch_logs_role_arn/)).toBe(true);
    });
  });

  describe("Output Definitions", () => {
    test("outputs source bucket information", () => {
      expect(has(/output\s+"source_bucket_name"/)).toBe(true);
      expect(has(/output\s+"source_bucket_arn"/)).toBe(true);
    });

    test("outputs replica bucket information", () => {
      expect(has(/output\s+"replica_bucket_name"/)).toBe(true);
      expect(has(/output\s+"replica_bucket_arn"/)).toBe(true);
    });

    test("outputs replication role ARN", () => {
      expect(has(/output\s+"replication_role_arn"/)).toBe(true);
    });

    test("outputs KMS key ARNs", () => {
      expect(has(/output\s+"source_kms_key_arn"/)).toBe(true);
      expect(has(/output\s+"replica_kms_key_arn"/)).toBe(true);
    });

    test("outputs CloudTrail ARN", () => {
      expect(has(/output\s+"cloudtrail_arn"/)).toBe(true);
    });

    test("outputs CloudWatch dashboard name", () => {
      expect(has(/output\s+"cloudwatch_dashboard_name"/)).toBe(true);
    });

    test("outputs SNS topic ARNs", () => {
      expect(has(/output\s+"sns_critical_topic_arn"/)).toBe(true);
      expect(has(/output\s+"sns_warning_topic_arn"/)).toBe(true);
      expect(has(/output\s+"sns_info_topic_arn"/)).toBe(true);
    });

    test("outputs have descriptions", () => {
      const descriptionMatches = tf.match(/description\s*=\s*"/g);
      expect(descriptionMatches).not.toBeNull();
      expect(descriptionMatches!.length).toBeGreaterThanOrEqual(9);
    });

    test("has at least 12 outputs", () => {
      const outputMatches = tf.match(/^output\s+"/gm);
      expect(outputMatches).not.toBeNull();
      expect(outputMatches!.length).toBeGreaterThanOrEqual(12);
    });
  });

  describe("Security Compliance", () => {
    test("no hardcoded AWS account IDs", () => {
      const accountIdMatches = tf.match(/\d{12}/g);
      if (accountIdMatches) {
        expect(accountIdMatches.length).toBeLessThan(3);
      }
    });

    test("no hardcoded access keys or secrets", () => {
      expect(has(/AKIA[A-Z0-9]{16}/)).toBe(false);
      expect(has(/aws_secret_access_key/)).toBe(false);
      expect(has(/password\s*=\s*"[^"]+"/)).toBe(false);
    });

    test("uses encryption for all S3 buckets", () => {
      const encryptionMatches = tf.match(/aws_s3_bucket_server_side_encryption_configuration/g);
      expect(encryptionMatches).not.toBeNull();
      expect(encryptionMatches!.length).toBeGreaterThanOrEqual(2);
    });

    test("no public access configurations", () => {
      expect(has(/map_public_ip_on_launch\s*=\s*true/)).toBe(false);
    });

    test("encryption mentioned extensively", () => {
      const encryptionRefs = tf.match(/encryption|kms|sse/gi);
      expect(encryptionRefs).not.toBeNull();
      expect(encryptionRefs!.length).toBeGreaterThan(30);
    });
  });

  describe("Tagging Compliance", () => {
    test("defines all required tags", () => {
      expect(has(/Project/)).toBe(true);
      expect(has(/Environment/)).toBe(true);
      expect(has(/ManagedBy.*Terraform/)).toBe(true);
      expect(has(/DataClassification.*Confidential/)).toBe(true);
    });

    test("tags are applied via locals.common_tags", () => {
      // Tags can be directly assigned or merged with additional tags
      const hasDirectTags = /tags\s*=\s*local\.common_tags/.test(tf);
      const hasMergedTags = /tags\s*=\s*merge\(\s*local\.common_tags/.test(tf);
      
      expect(hasDirectTags || hasMergedTags).toBe(true);
    });
  });
});