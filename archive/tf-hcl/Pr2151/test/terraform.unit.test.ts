// test/terraform.unit.test.ts
// Unit tests for your Terraform HCL stack (no terraform commands executed)

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");

function read(file: string) {
  return fs.readFileSync(path.join(LIB_DIR, file), "utf8");
}

describe("Terraform Security Baseline - Unit", () => {
  // ---------- Required files ----------
  describe("Required files exist", () => {
    const required = ["main.tf", "provider.tf", "variables.tf", "outputs.tf", "tap_stack.tf"];

    test.each(required)("%s exists", (fname) => {
      const p = path.join(LIB_DIR, fname);
      const exists = fs.existsSync(p);
      if (!exists) console.error(`[unit] Expected file at: ${p}`);
      expect(exists).toBe(true);
    });
  });

  // ---------- tap_stack.tf conventions ----------
  describe("tap_stack.tf conventions", () => {
    const content = read("tap_stack.tf");

    test("does NOT declare provider here (provider.tf owns providers)", () => {
      expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test('declares a shim variable "aws_region"', () => {
      expect(content).toMatch(/variable\s+"aws_region"\s*{/);
    });
  });

  // ---------- provider.tf ----------
  describe("Provider configuration", () => {
    const content = read("provider.tf");

    test('declares aws provider', () => {
      expect(content).toMatch(/provider\s+"aws"\s*{/);
    });

    test('region comes from a variable (no hardcoding)', () => {
      // accept var.region (your current pattern) or var.aws_region (shim)
      expect(content).toMatch(/region\s*=\s*var\.(region|aws_region)/);
    });

    test('has required_providers block for aws', () => {
      expect(content).toMatch(/required_providers\s*{[\s\S]*aws[\s\S]*}/);
    });

    test('default_tags include Environment & ManagedBy', () => {
      expect(content).toMatch(/default_tags\s*{/);
      expect(content).toMatch(/Environment/);
      expect(content).toMatch(/ManagedBy/);
    });
  });

  // ---------- variables.tf ----------
  describe("Variables", () => {
    const vars = read("variables.tf");

    const mustDeclare = [
      "project_name",
      "region",
      "tags",
      "alarm_email",
      "enable_guardduty",
      "enable_aws_config",
    ];

    test.each(mustDeclare)("declares variable %s", (v) => {
      expect(vars).toMatch(new RegExp(`variable\\s+"${v}"\\s*{`));
    });
  });

  // ---------- main.tf quick structure ----------
  describe("main.tf structure & resources", () => {
    const main = read("main.tf");

    test("contains section headers (comments) used by repo tests & reviewers", () => {
      // We suggested adding these; keep them present
      expect(main).toMatch(/#\s*Locals/);
      expect(main).toMatch(/#\s*Data Sources/);
      expect(main).toMatch(/#\s*IAM Policies/);
      expect(main).toMatch(/#\s*IAM Roles/);
      expect(main).toMatch(/#\s*Outputs/);
    });

    // Core resources you actually define
    const resources = [
      ['aws_s3_bucket', 'logs'],
      ['aws_s3_bucket', 'access_logs'],
      ['aws_s3_bucket_versioning', 'logs'],
      ['aws_s3_bucket_server_side_encryption_configuration', 'logs'],
      ['aws_s3_bucket_public_access_block', 'logs'],
      ['aws_s3_bucket_public_access_block', 'access_logs'],
      ['aws_s3_bucket_logging', 'logs'],
      ['aws_s3_bucket_ownership_controls', 'logs'],
      ['aws_s3_bucket_ownership_controls', 'access_logs'],
      ['aws_kms_key', 'logs'],
      ['aws_kms_alias', 'logs'],
      ['aws_cloudwatch_log_group', 'trail'],
      ['aws_iam_role', 'trail_cw'],
      ['aws_iam_role_policy', 'trail_cw'],
      ['aws_cloudtrail', 'main'],
      ['aws_sns_topic', 'security'],
      ['aws_sns_topic_subscription', 'email'],
      ['aws_cloudwatch_log_metric_filter', 'root_usage'],
      ['aws_cloudwatch_metric_alarm', 'root_usage'],
      ['aws_cloudwatch_log_metric_filter', 'no_mfa_login'],
      ['aws_cloudwatch_metric_alarm', 'no_mfa_login'],
      ['aws_iam_account_password_policy', 'baseline'],
      // Optional-by-toggle resources (still declared in code with count)
      ['aws_iam_role', 'config'],
      ['aws_iam_role_policy', 'config_inline'],
      ['aws_config_configuration_recorder', 'rec'],
      ['aws_config_delivery_channel', 'dc'],
      ['aws_config_configuration_recorder_status', 'status'],
      ['aws_guardduty_detector', 'this'],
    ] as const;

    test.each(resources)("declares resource %s.%s", (type, name) => {
      expect(main).toMatch(new RegExp(`resource\\s+"${type}"\\s+"${name}"`));
    });

    // Policy documents you actually define
    const policyDocs = [
      ['aws_iam_policy_document', 'trail_cw_assume'],
      ['aws_iam_policy_document', 'trail_cw_policy'],
      ['aws_iam_policy_document', 'kms_policy'],
      ['aws_iam_policy_document', 'logs_bucket'],
      ['aws_iam_policy_document', 'config_assume'],
    ] as const;

    test.each(policyDocs)("declares data policy doc %s.%s", (type, name) => {
      expect(main).toMatch(new RegExp(`data\\s+"${type}"\\s+"${name}"`));
    });
  });

  // ---------- security best practices ----------
  describe("Security best practices (static scan)", () => {
    const main = read("main.tf");

    test("S3 buckets: block public + SSE + versioning", () => {
      expect(main).toMatch(/block_public_acls\s*=\s*true/);
      expect(main).toMatch(/block_public_policy\s*=\s*true/);
      expect(main).toMatch(/server_side_encryption/i);
      expect(main).toMatch(/versioning_configuration\s*{\s*status\s*=\s*"Enabled"/);
    });

    test("KMS key policy allows CloudTrail/Logs usage", () => {
      expect(main).toMatch(/data\s+"aws_iam_policy_document"\s+"kms_policy"/);
      expect(main).toMatch(/cloudtrail\.amazonaws\.com/);
      expect(main).toMatch(/logs\.\$\{?var\.region\}?\.amazonaws\.com/);
    });

    test("CloudTrail hardened settings", () => {
      expect(main).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
      expect(main).toMatch(/enable_log_file_validation\s*=\s*true/);
      expect(main).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test("IAM account password policy is strict", () => {
      expect(main).toMatch(/resource\s+"aws_iam_account_password_policy"\s+"baseline"/);
      expect(main).toMatch(/minimum_password_length\s*=\s*14/);
      expect(main).toMatch(/require_uppercase_characters\s*=\s*true/);
      expect(main).toMatch(/require_lowercase_characters\s*=\s*true/);
      expect(main).toMatch(/require_numbers\s*=\s*true/);
      expect(main).toMatch(/require_symbols\s*=\s*true/);
    });

    test("no hardcoded AWS access keys or secrets", () => {
      expect(main).not.toMatch(/AKIA[0-9A-Z]{16}/);
      expect(main).not.toMatch(/secret\s*=\s*".+?"/);
      expect(main).not.toMatch(/password\s*=\s*".+?"/);
    });
  });

  // ---------- outputs.tf ----------
  describe("Outputs", () => {
    const outputs = read("outputs.tf");

    test('exports cloudtrail_arn, logs_bucket_name, sns_topic_arn', () => {
      expect(outputs).toMatch(/output\s+"cloudtrail_arn"/);
      expect(outputs).toMatch(/output\s+"logs_bucket_name"/);
      expect(outputs).toMatch(/output\s+"sns_topic_arn"/);
    });

    test('guardduty output (if any) uses count-safe indexing', () => {
      // Will pass whether you include it or not; if present, ensure count-safe pattern
      if (/output\s+"guardduty_detector_id"/.test(outputs)) {
        expect(outputs).toMatch(/length\(aws_guardduty_detector\.this\)\s*>\s*0\s*\?\s*aws_guardduty_detector\.this\[0]\.id\s*:\s*null/);
      }
    });
  });

  // ---------- file structure integrity ----------
  describe("File structure integrity", () => {
    const main = read("main.tf");

    test('no duplicate resource addresses (type.name) in main.tf', () => {
      const mainPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainPath, 'utf8');

      // capture resource "<type>" "<name>"
      const matches = content.match(/resource\s+"([^"]+)"\s+"([^"]+)"/g) || [];

      const seen: string[] = [];
      matches.forEach(m => {
        const parts = m.match(/resource\s+"([^"]+)"\s+"([^"]+)"/);
        if (parts) {
          const addr = `${parts[1]}.${parts[2]}`; // type.name
          expect(seen).not.toContain(addr);
          seen.push(addr);
        }
      });
    });

  });
});
