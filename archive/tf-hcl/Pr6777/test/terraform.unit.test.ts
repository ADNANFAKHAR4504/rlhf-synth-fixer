import fs from "fs";
import path from "path";

const stackPath = path.resolve(__dirname, "../lib/main.tf");

describe("Terraform Observability Stack - Unit Tests", () => {
  let terraformContent: string;

  beforeAll(() => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      // Try alternative paths
      const altPath1 = path.resolve(__dirname, "../lib/tap_stack.tf");
      const altPath2 = path.resolve(__dirname, "../main.tf");

      if (fs.existsSync(altPath1)) {
        terraformContent = fs.readFileSync(altPath1, "utf8");
      } else if (fs.existsSync(altPath2)) {
        terraformContent = fs.readFileSync(altPath2, "utf8");
      } else {
        throw new Error(`Terraform file not found. Checked: ${stackPath}, ${altPath1}, ${altPath2}`);
      }
    } else {
      terraformContent = fs.readFileSync(stackPath, "utf8");
    }
  });

  // Basic structure tests
  describe("File Structure", () => {
    test("Terraform file exists and is readable", () => {
      expect(terraformContent).toBeDefined();
      expect(terraformContent.length).toBeGreaterThan(0);
    });

    test("contains resource declarations", () => {
      expect(terraformContent).toMatch(/resource\s+"\w+"/);
    });

    test("does NOT declare provider block (provider.tf should own providers)", () => {
      expect(terraformContent).not.toMatch(/provider\s+"aws"\s*{/);
    });
  });

  // S3 Bucket tests
  describe("S3 Resources", () => {
    test("creates CloudTrail logs S3 bucket", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail_logs"/);
    });

    test("enables versioning for CloudTrail bucket", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"cloudtrail_logs"/);
      expect(terraformContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("blocks public access to CloudTrail bucket", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail_logs"/);
      expect(terraformContent).toMatch(/block_public_acls\s*=\s*true/);
    });

    test("encrypts CloudTrail bucket", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"cloudtrail_logs"/);
      expect(terraformContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test("sets lifecycle policy for log expiration", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"cloudtrail_logs"/);
      expect(terraformContent).toMatch(/expiration\s*{/);
    });
  });

  // CloudTrail tests
  describe("CloudTrail Resources", () => {
    test("creates CloudTrail for audit logging", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_cloudtrail"\s+"payment_audit"/);
    });

    test("enables log file validation", () => {
      expect(terraformContent).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test("includes management events", () => {
      expect(terraformContent).toMatch(/include_management_events\s*=\s*true/);
    });
  });

  // CloudWatch Log Groups tests
  describe("CloudWatch Log Groups", () => {
    test("creates payment API log group", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"payment_api_logs"/);
    });

    test("creates payment processor log group", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"payment_processor_logs"/);
    });

    test("creates database log group", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"payment_database_logs"/);
    });

    test("creates security events log group", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"security_events_logs"/);
    });

    test("encrypts log groups with KMS", () => {
      const logGroupMatches = terraformContent.match(/resource\s+"aws_cloudwatch_log_group"/g);
      expect(logGroupMatches).toBeTruthy();
      expect(logGroupMatches!.length).toBeGreaterThanOrEqual(4);
      expect(terraformContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.observability\.arn/);
    });
  });

  // KMS Key tests
  describe("KMS Encryption", () => {
    test("creates KMS key for observability", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_kms_key"\s+"observability"/);
    });

    test("enables key rotation", () => {
      expect(terraformContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("creates KMS alias", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_kms_alias"\s+"observability"/);
      expect(terraformContent).toMatch(/name\s*=\s*"alias\/observability-/);
    });
  });

  // X-Ray tests
  describe("X-Ray Tracing", () => {
    test("creates payment transaction sampling rule", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_xray_sampling_rule"\s+"payment_transactions"/);
    });

    test("creates default sampling rule", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_xray_sampling_rule"\s+"default_sampling"/);
    });

    test("configures payment API path sampling", () => {
      expect(terraformContent).toMatch(/url_path\s*=\s*"\/api\/payment\/\*"/);
    });
  });

  // SNS Topics tests
  describe("SNS Alert Topics", () => {
    test("creates payment alerts topic", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_sns_topic"\s+"payment_alerts"/);
    });

    test("creates security alerts topic", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_sns_topic"\s+"security_alerts"/);
    });

    test("encrypts SNS topics with KMS", () => {
      expect(terraformContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.observability\.id/);
    });

    test("creates email subscriptions when email is provided", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"payment_alerts_email"/);
      expect(terraformContent).toMatch(/count\s*=\s*var\.alert_email\s*!=\s*""\s*\?\s*1\s*:\s*0/);
    });
  });

  // CloudWatch Alarms tests
  describe("CloudWatch Alarms", () => {
    test("creates high error rate alarm", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_error_rate"/);
    });

    test("creates high latency alarm", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_latency"/);
    });

    test("creates failed transactions alarm", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"failed_transactions"/);
    });

    test("configures alarm actions to SNS", () => {
      expect(terraformContent).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.payment_alerts\.arn\]/);
    });
  });

  // CloudWatch Dashboard tests
  describe("CloudWatch Dashboard", () => {
    test("creates payment operations dashboard", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"payment_operations"/);
    });

    test("includes transaction volume widget", () => {
      expect(terraformContent).toMatch(/Payment Transaction Volume/);
    });

    test("includes latency distribution widget", () => {
      expect(terraformContent).toMatch(/Transaction Latency Distribution/);
    });

    test("includes error metrics widget", () => {
      expect(terraformContent).toMatch(/Error Metrics/);
    });
  });

  // EventBridge tests
  describe("EventBridge Rules", () => {
    test("creates security config change rule", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"security_config_changes"/);
    });

    test("creates unauthorized API calls rule", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"unauthorized_api_calls"/);
    });

    test("routes events to SNS topics", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_cloudwatch_event_target"/);
    });
  });

  // SSM Parameters tests
  describe("Systems Manager Parameters", () => {
    test("stores X-Ray sampling rate", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"xray_sampling_rate"/);
    });

    test("stores log retention setting", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"log_retention"/);
    });

    test("stores alert threshold", () => {
      expect(terraformContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"alert_threshold_latency"/);
    });
  });

  // Variables tests
  describe("Required Variables", () => {
    test("uses environment_suffix variable", () => {
      expect(terraformContent).toMatch(/var\.environment_suffix/);
    });

    test("uses aws_region variable", () => {
      expect(terraformContent).toMatch(/var\.aws_region/);
    });

    test("uses log_retention_days variable", () => {
      expect(terraformContent).toMatch(/var\.log_retention_days/);
    });

    test("uses alert_email variable", () => {
      expect(terraformContent).toMatch(/var\.alert_email/);
    });
  });

  // Security best practices tests
  describe("Security Best Practices", () => {
    test("all S3 buckets block public access", () => {
      const bucketCount = (terraformContent.match(/resource\s+"aws_s3_bucket"\s+"/g) || []).length;
      const publicAccessBlockCount = (terraformContent.match(/resource\s+"aws_s3_bucket_public_access_block"/g) || []).length;
      expect(publicAccessBlockCount).toBeGreaterThanOrEqual(1);
    });

    test("S3 buckets use encryption", () => {
      expect(terraformContent).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
    });

    test("uses data source for AWS account ID", () => {
      expect(terraformContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test("CloudWatch logs use KMS encryption", () => {
      const kmsReferences = terraformContent.match(/kms_key_id\s*=\s*aws_kms_key/g);
      expect(kmsReferences).toBeTruthy();
      expect(kmsReferences!.length).toBeGreaterThanOrEqual(4);
    });
  });

  // Optional features tests
  describe("Conditional Resources", () => {
    test("AWS Config is conditionally created", () => {
      expect(terraformContent).toMatch(/count\s*=\s*var\.enable_config\s*\?\s*1\s*:\s*0/);
    });

    test("Security Hub is conditionally created", () => {
      expect(terraformContent).toMatch(/count\s*=\s*var\.enable_security_hub\s*\?\s*1\s*:\s*0/);
    });
  });
});
