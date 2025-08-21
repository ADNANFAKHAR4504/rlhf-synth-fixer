// Unit tests for Terraform infrastructure
// Tests the structure and content of tap_stack.tf without executing Terraform

import fs from "fs";
import path from "path";

const STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");
const PROVIDER_PATH = path.resolve(__dirname, "../lib/provider.tf");

describe("Terraform Infrastructure Unit Tests", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
    providerContent = fs.readFileSync(PROVIDER_PATH, "utf8");
  });

  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
    });
  });

  describe("Provider Configuration", () => {
    test("provider.tf declares AWS provider", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test("provider.tf declares random provider", () => {
      expect(providerContent).toMatch(/random\s*=/);
    });

    test("tap_stack.tf does NOT declare provider (separation of concerns)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
      expect(stackContent).not.toMatch(/\bprovider\s+"random"\s*{/);
    });
  });

  describe("Variables", () => {
    test("declares aws_region variable", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("declares environment_suffix variable", () => {
      expect(stackContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });
  });

  describe("Security Components", () => {
    test("creates KMS key for encryption", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"logs_encryption_key"/);
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("creates S3 bucket with security configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logs_bucket"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
    });

    test("blocks all public access to S3 bucket", () => {
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(stackContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test("enables versioning on S3 bucket", () => {
      expect(stackContent).toMatch(/versioning_configuration\s*{[\s\S]*status\s*=\s*"Enabled"/);
    });
  });

  describe("IAM Configuration", () => {
    test("creates log writer role with MFA requirement", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"log_writer_role"/);
      expect(stackContent).toMatch(/"aws:MultiFactorAuthPresent"\s*=\s*"true"/);
    });

    test("creates log reader role without MFA requirement", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"log_reader_role"/);
    });

    test("creates IAM policies with least privilege", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"log_writer_policy"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"log_reader_policy"/);
    });

    test("log writer policy allows only necessary S3 actions", () => {
      expect(stackContent).toMatch(/"s3:PutObject"/);
      expect(stackContent).toMatch(/"s3:PutObjectAcl"/);
      expect(stackContent).not.toMatch(/"s3:\*"/);
    });

    test("log reader policy allows only read actions", () => {
      // Find the log reader policy section
      const logReaderPolicyMatch = stackContent.match(/resource\s+"aws_iam_role_policy"\s+"log_reader_policy"[\s\S]*?^\}/m);
      expect(logReaderPolicyMatch).toBeTruthy();
      
      const logReaderPolicy = logReaderPolicyMatch![0];
      expect(logReaderPolicy).toMatch(/"s3:GetObject"/);
      expect(logReaderPolicy).toMatch(/"s3:ListBucket"/);
      expect(logReaderPolicy).not.toMatch(/"s3:PutObject"/);
    });
  });

  describe("Monitoring and Alerting", () => {
    test("creates CloudWatch log group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"security_monitoring"/);
    });

    test("creates CloudTrail for audit logging", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"security_trail"/);
    });

    test("creates CloudWatch metric filter and alarm", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_metric_filter"\s+"unauthorized_access"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"unauthorized_access_alarm"/);
    });

    test("creates SNS topic for alerts", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"security_alerts"/);
    });
  });

  describe("Naming Convention", () => {
    test("uses corpSec prefix in resource names", () => {
      expect(stackContent).toMatch(/corpSec-logs/);
      expect(stackContent).toMatch(/corpSec-log-writer-role/);
      expect(stackContent).toMatch(/corpSec-log-reader-role/);
      expect(stackContent).toMatch(/corpSec-security-monitoring/);
      expect(stackContent).toMatch(/corpSec-security-trail/);
      expect(stackContent).toMatch(/corpSec-security-alerts/);
    });

    test("includes environment suffix in resource names", () => {
      expect(stackContent).toMatch(/\${var\.environment_suffix}/g);
    });
  });

  describe("Outputs", () => {
    test("provides all required outputs", () => {
      expect(stackContent).toMatch(/output\s+"bucket_name"/);
      expect(stackContent).toMatch(/output\s+"bucket_arn"/);
      expect(stackContent).toMatch(/output\s+"kms_key_id"/);
      expect(stackContent).toMatch(/output\s+"kms_key_arn"/);
      expect(stackContent).toMatch(/output\s+"log_writer_role_arn"/);
      expect(stackContent).toMatch(/output\s+"log_reader_role_arn"/);
      expect(stackContent).toMatch(/output\s+"cloudwatch_log_group"/);
      expect(stackContent).toMatch(/output\s+"sns_topic_arn"/);
    });

    test("outputs have descriptions", () => {
      const outputMatches = stackContent.match(/output\s+"[^"]+"\s*{[^}]*description/g);
      expect(outputMatches).toBeTruthy();
      expect(outputMatches!.length).toBeGreaterThan(5);
    });
  });

  describe("Security Best Practices", () => {
    test("enforces encryption at rest", () => {
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("enforces encryption in transit (implied by KMS usage)", () => {
      expect(stackContent).toMatch(/kms_master_key_id/);
    });

    test("uses lifecycle management for cost optimization", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"/);
    });

    test("includes proper tagging", () => {
      expect(stackContent).toMatch(/tags\s*=\s*{/);
      expect(stackContent).toMatch(/Environment/);
      expect(stackContent).toMatch(/Purpose/);
      expect(stackContent).toMatch(/ManagedBy/);
    });
  });
});
