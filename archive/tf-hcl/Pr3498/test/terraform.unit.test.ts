// Unit tests for Terraform security monitoring infrastructure
// These tests validate the structure and contents of Terraform files

import fs from "fs";
import path from "path";
import * as HCL from "hcl2-parser";

const LIB_DIR = path.resolve(__dirname, "../lib");

// Helper function to parse HCL files
function parseHCLFile(filename: string): any {
  const filePath = path.join(LIB_DIR, filename);
  const content = fs.readFileSync(filePath, "utf8");

  // Basic HCL parsing - check for resource blocks
  const resources: Record<string, string[]> = {};
  const resourceMatches = content.matchAll(/resource\s+"([^"]+)"\s+"([^"]+)"/g);

  for (const match of resourceMatches) {
    const [, type, name] = match;
    if (!resources[type]) resources[type] = [];
    resources[type].push(name);
  }

  return { content, resources };
}

// Helper to check if a file exists
function fileExists(filename: string): boolean {
  return fs.existsSync(path.join(LIB_DIR, filename));
}

describe("Terraform Security Monitoring Infrastructure", () => {
  describe("File Structure", () => {
    const requiredFiles = [
      "provider.tf",
      "variables.tf",
      "outputs.tf",
      "s3.tf",
      "cloudtrail.tf",
      "guardduty.tf",
      "security_hub.tf",
      "cloudwatch.tf",
      "eventbridge.tf",
      "lambda.tf",
      "sns.tf",
      "iam.tf",
      "kms.tf",
      "lambda_function.py"
    ];

    test.each(requiredFiles)("%s file exists", (filename) => {
      expect(fileExists(filename)).toBe(true);
    });
  });

  describe("Provider Configuration", () => {
    test("provider.tf contains required providers", () => {
      const { content } = parseHCLFile("provider.tf");
      expect(content).toMatch(/provider\s+"aws"/);
      expect(content).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
      expect(content).toMatch(/backend\s+"s3"/);
    });

    test("provider.tf includes required provider sources", () => {
      const { content } = parseHCLFile("provider.tf");
      expect(content).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(content).toMatch(/source\s*=\s*"hashicorp\/random"/);
      expect(content).toMatch(/source\s*=\s*"hashicorp\/archive"/);
    });
  });

  describe("Variables Configuration", () => {
    test("variables.tf contains all required variables", () => {
      const { content } = parseHCLFile("variables.tf");
      const requiredVars = [
        "aws_region",
        "environment",
        "owner",
        "security_email",
        "cloudtrail_bucket_prefix",
        "log_retention_days",
        "glacier_transition_days",
        "environment_suffix"
      ];

      requiredVars.forEach(varName => {
        expect(content).toMatch(new RegExp(`variable\\s+"${varName}"\\s*{`));
      });
    });

    test("variables.tf includes environment suffix logic", () => {
      const { content } = parseHCLFile("variables.tf");
      expect(content).toMatch(/locals\s*{/);
      expect(content).toMatch(/environment_suffix\s*=/);
      expect(content).toMatch(/synth78029461/);
    });

    test("variables.tf includes common tags", () => {
      const { content } = parseHCLFile("variables.tf");
      expect(content).toMatch(/common_tags\s*=/);
      expect(content).toMatch(/Environment/);
      expect(content).toMatch(/Purpose/);
      expect(content).toMatch(/Owner/);
      expect(content).toMatch(/ManagedBy/);
    });
  });

  describe("S3 Bucket Configuration", () => {
    test("s3.tf creates CloudTrail logs bucket", () => {
      const { resources } = parseHCLFile("s3.tf");
      expect(resources["aws_s3_bucket"]).toContain("cloudtrail_logs");
    });

    test("s3.tf includes bucket versioning", () => {
      const { resources } = parseHCLFile("s3.tf");
      expect(resources["aws_s3_bucket_versioning"]).toContain("cloudtrail_logs");
    });

    test("s3.tf includes lifecycle configuration", () => {
      const { resources, content } = parseHCLFile("s3.tf");
      expect(resources["aws_s3_bucket_lifecycle_configuration"]).toContain("cloudtrail_logs");
      expect(content).toMatch(/storage_class\s*=\s*"GLACIER"/);
    });

    test("s3.tf includes encryption configuration", () => {
      const { resources, content } = parseHCLFile("s3.tf");
      expect(resources["aws_s3_bucket_server_side_encryption_configuration"]).toContain("cloudtrail_logs");
      expect(content).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("s3.tf includes public access block", () => {
      const { resources, content } = parseHCLFile("s3.tf");
      expect(resources["aws_s3_bucket_public_access_block"]).toContain("cloudtrail_logs");
      expect(content).toMatch(/block_public_acls\s*=\s*true/);
      expect(content).toMatch(/block_public_policy\s*=\s*true/);
    });

    test("s3.tf includes bucket policy", () => {
      const { resources } = parseHCLFile("s3.tf");
      expect(resources["aws_s3_bucket_policy"]).toContain("cloudtrail_logs");
    });

    test("s3.tf bucket has force_destroy enabled", () => {
      const { content } = parseHCLFile("s3.tf");
      expect(content).toMatch(/force_destroy\s*=\s*true/);
    });
  });

  describe("CloudTrail Configuration", () => {
    test("cloudtrail.tf creates trail resource", () => {
      const { resources } = parseHCLFile("cloudtrail.tf");
      expect(resources["aws_cloudtrail"]).toContain("main");
    });

    test("cloudtrail.tf enables multi-region trail", () => {
      const { content } = parseHCLFile("cloudtrail.tf");
      expect(content).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test("cloudtrail.tf enables log file validation", () => {
      const { content } = parseHCLFile("cloudtrail.tf");
      expect(content).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test("cloudtrail.tf includes environment suffix in name", () => {
      const { content } = parseHCLFile("cloudtrail.tf");
      expect(content).toMatch(/name\s*=\s*"security-monitoring-trail-\$\{local\.environment_suffix\}"/);
    });
  });

  describe("GuardDuty Configuration", () => {
    test("guardduty.tf creates detector resource", () => {
      const { content } = parseHCLFile("guardduty.tf");
      expect(content).toMatch(/resource\s+"aws_guardduty_detector"\s+"main"/);
    });

    test("guardduty.tf enables detector", () => {
      const { content } = parseHCLFile("guardduty.tf");
      expect(content).toMatch(/enable\s*=\s*true/);
    });

    test("guardduty.tf sets finding publishing frequency", () => {
      const { content } = parseHCLFile("guardduty.tf");
      expect(content).toMatch(/finding_publishing_frequency\s*=\s*"FIFTEEN_MINUTES"/);
    });
  });

  describe("Security Hub Configuration", () => {
    test("security_hub.tf enables Security Hub account", () => {
      const { resources } = parseHCLFile("security_hub.tf");
      expect(resources["aws_securityhub_account"]).toContain("main");
    });

    test("security_hub.tf subscribes to foundational standards", () => {
      const { resources, content } = parseHCLFile("security_hub.tf");
      expect(resources["aws_securityhub_standards_subscription"]).toContain("foundational");
      expect(content).toMatch(/aws-foundational-security-best-practices/);
    });

    test("security_hub.tf enables finding aggregator", () => {
      const { resources, content } = parseHCLFile("security_hub.tf");
      expect(resources["aws_securityhub_finding_aggregator"]).toContain("main");
      expect(content).toMatch(/linking_mode\s*=\s*"ALL_REGIONS"/);
    });
  });

  describe("CloudWatch Configuration", () => {
    test("cloudwatch.tf creates required log groups", () => {
      const { resources } = parseHCLFile("cloudwatch.tf");
      expect(resources["aws_cloudwatch_log_group"]).toContain("security_events");
      expect(resources["aws_cloudwatch_log_group"]).toContain("cloudtrail");
    });

    test("cloudwatch.tf sets retention period", () => {
      const { content } = parseHCLFile("cloudwatch.tf");
      expect(content).toMatch(/retention_in_days\s*=\s*var\.log_retention_days/);
    });

    test("cloudwatch.tf creates log streams", () => {
      const { resources } = parseHCLFile("cloudwatch.tf");
      expect(resources["aws_cloudwatch_log_stream"]).toContain("guardduty");
      expect(resources["aws_cloudwatch_log_stream"]).toContain("security_hub");
      expect(resources["aws_cloudwatch_log_stream"]).toContain("custom_rules");
    });
  });

  describe("EventBridge Configuration", () => {
    test("eventbridge.tf creates event rules", () => {
      const { resources } = parseHCLFile("eventbridge.tf");
      expect(resources["aws_cloudwatch_event_rule"]).toContain("guardduty_findings");
      expect(resources["aws_cloudwatch_event_rule"]).toContain("security_hub_findings");
      expect(resources["aws_cloudwatch_event_rule"]).toContain("cloudtrail_api_events");
    });

    test("eventbridge.tf creates event targets", () => {
      const { resources } = parseHCLFile("eventbridge.tf");
      expect(resources["aws_cloudwatch_event_target"]).toContain("guardduty_sns");
      expect(resources["aws_cloudwatch_event_target"]).toContain("security_hub_sns");
      expect(resources["aws_cloudwatch_event_target"]).toContain("security_hub_lambda");
      expect(resources["aws_cloudwatch_event_target"]).toContain("cloudtrail_sns");
    });

    test("eventbridge.tf filters high severity findings", () => {
      const { content } = parseHCLFile("eventbridge.tf");
      expect(content).toMatch(/severity.*numeric.*>=.*7/s);
      expect(content).toMatch(/CRITICAL/);
      expect(content).toMatch(/HIGH/);
    });
  });

  describe("Lambda Configuration", () => {
    test("lambda.tf creates Lambda function", () => {
      const { resources } = parseHCLFile("lambda.tf");
      expect(resources["aws_lambda_function"]).toContain("custom_rules_processor");
    });

    test("lambda.tf uses Python 3.11 runtime", () => {
      const { content } = parseHCLFile("lambda.tf");
      expect(content).toMatch(/runtime\s*=\s*"python3\.11"/);
    });

    test("lambda.tf creates Lambda permission for EventBridge", () => {
      const { resources } = parseHCLFile("lambda.tf");
      expect(resources["aws_lambda_permission"]).toContain("allow_eventbridge");
    });

    test("lambda.tf includes environment variables", () => {
      const { content } = parseHCLFile("lambda.tf");
      expect(content).toMatch(/LOG_GROUP/);
      expect(content).toMatch(/SNS_TOPIC/);
    });

    test("lambda_function.py exists and is valid Python", () => {
      const lambdaPath = path.join(LIB_DIR, "lambda_function.py");
      const content = fs.readFileSync(lambdaPath, "utf8");
      expect(content).toMatch(/def handler/);
      expect(content).toMatch(/import json/);
      expect(content).toMatch(/import boto3/);
    });
  });

  describe("SNS Configuration", () => {
    test("sns.tf creates SNS topic", () => {
      const { resources } = parseHCLFile("sns.tf");
      expect(resources["aws_sns_topic"]).toContain("security_alerts");
    });

    test("sns.tf creates email subscription", () => {
      const { resources, content } = parseHCLFile("sns.tf");
      expect(resources["aws_sns_topic_subscription"]).toContain("security_email");
      expect(content).toMatch(/protocol\s*=\s*"email"/);
    });

    test("sns.tf includes filter policy for severity", () => {
      const { content } = parseHCLFile("sns.tf");
      expect(content).toMatch(/filter_policy/);
      expect(content).toMatch(/HIGH/);
      expect(content).toMatch(/CRITICAL/);
    });

    test("sns.tf creates topic policy", () => {
      const { resources } = parseHCLFile("sns.tf");
      expect(resources["aws_sns_topic_policy"]).toContain("security_alerts");
    });
  });

  describe("IAM Configuration", () => {
    test("iam.tf creates required roles", () => {
      const { resources } = parseHCLFile("iam.tf");
      expect(resources["aws_iam_role"]).toContain("security_team");
      expect(resources["aws_iam_role"]).toContain("lambda_execution");
      expect(resources["aws_iam_role"]).toContain("cloudtrail_cloudwatch");
    });

    test("iam.tf creates role policies", () => {
      const { resources } = parseHCLFile("iam.tf");
      expect(resources["aws_iam_role_policy"]).toContain("security_team_policy");
      expect(resources["aws_iam_role_policy"]).toContain("lambda_custom_policy");
      expect(resources["aws_iam_role_policy"]).toContain("cloudtrail_cloudwatch_policy");
    });

    test("iam.tf security team role requires MFA", () => {
      const { content } = parseHCLFile("iam.tf");
      expect(content).toMatch(/aws:MultiFactorAuthPresent.*true/);
    });

    test("iam.tf includes environment suffix in role names", () => {
      const { content } = parseHCLFile("iam.tf");
      expect(content).toMatch(/SecurityTeamRole-\$\{local\.environment_suffix\}/);
      expect(content).toMatch(/CustomRulesLambdaExecutionRole-\$\{local\.environment_suffix\}/);
      expect(content).toMatch(/CloudTrailCloudWatchRole-\$\{local\.environment_suffix\}/);
    });
  });

  describe("KMS Configuration", () => {
    test("kms.tf creates KMS key", () => {
      const { resources } = parseHCLFile("kms.tf");
      expect(resources["aws_kms_key"]).toContain("security_key");
    });

    test("kms.tf creates KMS alias", () => {
      const { resources } = parseHCLFile("kms.tf");
      expect(resources["aws_kms_alias"]).toContain("security_key_alias");
    });

    test("kms.tf enables key rotation", () => {
      const { content } = parseHCLFile("kms.tf");
      expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("kms.tf includes CloudWatch Logs permissions", () => {
      const { content } = parseHCLFile("kms.tf");
      expect(content).toMatch(/Allow CloudWatch Logs/);
      expect(content).toMatch(/logs.*amazonaws\.com/);
    });

    test("kms.tf includes CloudTrail permissions", () => {
      const { content } = parseHCLFile("kms.tf");
      expect(content).toMatch(/Allow CloudTrail/);
      expect(content).toMatch(/cloudtrail\.amazonaws\.com/);
    });

    test("kms.tf has reduced deletion window for destroyability", () => {
      const { content } = parseHCLFile("kms.tf");
      expect(content).toMatch(/deletion_window_in_days\s*=\s*7/);
    });
  });

  describe("Outputs Configuration", () => {
    test("outputs.tf contains all required outputs", () => {
      const { content } = parseHCLFile("outputs.tf");
      const requiredOutputs = [
        "security_hub_arn",
        "guardduty_detector_id",
        "cloudtrail_arn",
        "cloudtrail_bucket",
        "sns_topic_arn",
        "lambda_function_name",
        "security_team_role_arn",
        "kms_key_id",
        "log_group_name"
      ];

      requiredOutputs.forEach(output => {
        expect(content).toMatch(new RegExp(`output\\s+"${output}"\\s*{`));
      });
    });
  });

  describe("Resource Naming Convention", () => {
    test("all resources use environment suffix", () => {
      const filesToCheck = ["cloudtrail.tf", "cloudwatch.tf", "eventbridge.tf", "lambda.tf", "sns.tf", "iam.tf", "kms.tf", "s3.tf"];

      filesToCheck.forEach(filename => {
        const { content } = parseHCLFile(filename);
        // Check that resources use ${local.environment_suffix} for naming
        const hasEnvironmentSuffix = content.includes("${local.environment_suffix}") ||
                                    content.includes("local.environment_suffix");
        expect(hasEnvironmentSuffix).toBe(true);
      });
    });
  });

  describe("Security Best Practices", () => {
    test("S3 bucket has encryption enabled", () => {
      const { content } = parseHCLFile("s3.tf");
      expect(content).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
    });

    test("S3 bucket has versioning enabled", () => {
      const { content } = parseHCLFile("s3.tf");
      expect(content).toMatch(/aws_s3_bucket_versioning/);
      expect(content).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("CloudTrail has log file validation enabled", () => {
      const { content } = parseHCLFile("cloudtrail.tf");
      expect(content).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test("KMS key has rotation enabled", () => {
      const { content } = parseHCLFile("kms.tf");
      expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("Lambda function has appropriate timeout", () => {
      const { content } = parseHCLFile("lambda.tf");
      expect(content).toMatch(/timeout\s*=\s*60/);
    });
  });

  describe("Resource Dependencies", () => {
    test("CloudTrail depends on S3 bucket policy", () => {
      const { content } = parseHCLFile("cloudtrail.tf");
      expect(content).toMatch(/depends_on\s*=\s*\[aws_s3_bucket_policy\.cloudtrail_logs\]/);
    });

    test("Lambda permission references correct event rule", () => {
      const { content } = parseHCLFile("lambda.tf");
      expect(content).toMatch(/source_arn\s*=\s*aws_cloudwatch_event_rule\.security_hub_findings\.arn/);
    });
  });
});