// tests/unit/unit-tests.ts
// Unit tests for Terraform S3 secure bucket infrastructure

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Terraform Infrastructure Unit Tests", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    if (fs.existsSync(stackPath)) {
      stackContent = fs.readFileSync(stackPath, "utf8");
    }
    if (fs.existsSync(providerPath)) {
      providerContent = fs.readFileSync(providerPath, "utf8");
    }
  });

  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      const exists = fs.existsSync(stackPath);
      expect(exists).toBe(true);
    });

    test("provider.tf exists", () => {
      const exists = fs.existsSync(providerPath);
      expect(exists).toBe(true);
    });
  });

  describe("Provider Configuration", () => {
    test("provider.tf declares AWS provider", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });


    test("provider.tf has S3 backend configuration", () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*{/);
    });

    test("tap_stack.tf does NOT declare provider (separation of concerns)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });
  });

  describe("Variable Declarations", () => {
    test("declares aws_region variable", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("declares environment_suffix variable", () => {
      expect(stackContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("declares bucket_name variable", () => {
      expect(stackContent).toMatch(/variable\s+"bucket_name"\s*{/);
    });

    test("declares project_name variable", () => {
      expect(stackContent).toMatch(/variable\s+"project_name"\s*{/);
    });

    test("uses locals for environment suffix handling", () => {
      expect(stackContent).toMatch(/locals\s*{[\s\S]*environment_suffix/);
    });
  });

  describe("S3 Bucket Resources", () => {
    test("declares main S3 bucket resource", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"secure_bucket"\s*{/);
    });

    test("declares CloudTrail logs S3 bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail_logs"\s*{/);
    });

    test("declares replica S3 bucket for cross-region replication", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"replica_bucket"\s*{/);
    });

    test("main bucket has force_destroy = true for cleanup", () => {
      const bucketMatch = stackContent.match(/resource\s+"aws_s3_bucket"\s+"secure_bucket"\s*{[\s\S]*?force_destroy\s*=\s*true/);
      expect(bucketMatch).toBeTruthy();
    });

    test("declares S3 bucket versioning", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"secure_bucket_versioning"\s*{/);
    });

    test("declares S3 bucket lifecycle configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"secure_bucket_lifecycle"\s*{/);
    });

    test("declares S3 bucket encryption with KMS", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"secure_bucket_encryption"\s*{/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("declares public access block for main bucket", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"secure_bucket_pab"\s*{/);
    });

    test("declares bucket policy for TLS enforcement", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"secure_bucket_policy"\s*{/);
    });

    test("declares S3 bucket replication configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_replication_configuration"\s+"replication"\s*{/);
    });
  });

  describe("KMS Configuration", () => {
    test("declares KMS key resource", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"s3_encryption_key"\s*{/);
    });

    test("declares replica KMS key resource", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"replica_encryption_key"\s*{/);
    });

    test("KMS key has deletion window configured", () => {
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*7/);
    });

    test("KMS key has rotation enabled", () => {
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("declares KMS key alias", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"s3_encryption_key_alias"\s*{/);
    });

    test("declares replica KMS key alias", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"replica_encryption_key_alias"\s*{/);
    });
  });

  describe("CloudWatch and Monitoring", () => {
    test("declares CloudWatch log group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"cloudtrail_log_group"\s*{/);
    });

    test("declares CloudWatch metric alarms", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"unauthorized_s3_access"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"bucket_policy_violations"\s*{/);
    });

    test("declares CloudWatch log metric filters", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"unauthorized_access_filter"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"policy_violations_filter"\s*{/);
    });

    test("declares SNS topic for alerts", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"security_alerts"\s*{/);
    });
  });

  describe("IAM Resources", () => {
    test("declares IAM role for CloudTrail", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"cloudtrail_role"\s*{/);
    });

    test("declares IAM role policy for CloudTrail logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"cloudtrail_logs_policy"\s*{/);
    });

    test("declares IAM role for S3 replication", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"replication_role"\s*{/);
    });

    test("declares IAM role policy for S3 replication", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"replication_policy"\s*{/);
    });
  });

  describe("Cross-Region Replication", () => {
    test("declares S3 bucket replication configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_replication_configuration"\s+"replication"\s*{/);
    });

    test("replication configuration has SSE KMS encrypted objects enabled", () => {
      expect(stackContent).toMatch(/sse_kms_encrypted_objects\s*{[\s\S]*?status\s*=\s*"Enabled"/);
    });

    test("replication configuration has delete marker replication enabled", () => {
      expect(stackContent).toMatch(/delete_marker_replication\s*{[\s\S]*?status\s*=\s*"Enabled"/);
    });

    test("replica bucket has versioning enabled", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"replica_bucket_versioning"\s*{/);
    });

    test("replica bucket has encryption configured", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"replica_bucket_encryption"\s*{/);
    });

    test("replica bucket has public access block", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"replica_bucket_pab"\s*{/);
    });
  });

  describe("Security Best Practices", () => {
    test("bucket policy enforces TLS/HTTPS", () => {
      expect(stackContent).toMatch(/aws:SecureTransport/);
      expect(stackContent).toMatch(/DenyInsecureConnections/);
    });

    test("bucket policy denies unencrypted uploads", () => {
      expect(stackContent).toMatch(/DenyUnencryptedUploads/);
    });

    test("all public access settings are blocked", () => {
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("lifecycle rules include all required transitions", () => {
      expect(stackContent).toMatch(/INTELLIGENT_TIERING/);
      expect(stackContent).toMatch(/GLACIER/);
      expect(stackContent).toMatch(/DEEP_ARCHIVE/);
    });

    test("lifecycle includes multipart upload cleanup", () => {
      expect(stackContent).toMatch(/abort_incomplete_multipart_upload/);
    });
  });

  describe("Outputs", () => {
    test("declares S3 bucket name output", () => {
      expect(stackContent).toMatch(/output\s+"s3_bucket_name"\s*{/);
    });

    test("declares S3 bucket ARN output", () => {
      expect(stackContent).toMatch(/output\s+"s3_bucket_arn"\s*{/);
    });

    test("declares KMS key outputs", () => {
      expect(stackContent).toMatch(/output\s+"kms_key_id"\s*{/);
      expect(stackContent).toMatch(/output\s+"kms_key_arn"\s*{/);
    });

    test("declares CloudWatch log group output", () => {
      expect(stackContent).toMatch(/output\s+"cloudwatch_log_group_name"\s*{/);
    });

    test("declares SNS topic ARN output", () => {
      expect(stackContent).toMatch(/output\s+"sns_topic_arn"\s*{/);
    });

    test("declares replica bucket outputs", () => {
      expect(stackContent).toMatch(/output\s+"replica_bucket_name"\s*{/);
      expect(stackContent).toMatch(/output\s+"replica_bucket_arn"\s*{/);
    });

    test("declares replica KMS key output", () => {
      expect(stackContent).toMatch(/output\s+"replica_kms_key_id"\s*{/);
    });

    test("declares CloudTrail logs bucket output", () => {
      expect(stackContent).toMatch(/output\s+"cloudtrail_logs_bucket"\s*{/);
    });
  });

  describe("Resource Naming and Tagging", () => {
    test("resources use environment suffix in names", () => {
      expect(stackContent).toMatch(/\$\{local\.environment_suffix\}/);
      expect(stackContent).toMatch(/\$\{local\.bucket_name\}/);
      expect(stackContent).toMatch(/\$\{local\.project_name_with_suffix\}/);
    });

    test("resources have proper tagging including EnvironmentSuffix", () => {
      const tagMatches = stackContent.match(/EnvironmentSuffix\s*=\s*local\.environment_suffix/g);
      expect(tagMatches).toBeTruthy();
      expect(tagMatches!.length).toBeGreaterThan(5);
    });
  });
});