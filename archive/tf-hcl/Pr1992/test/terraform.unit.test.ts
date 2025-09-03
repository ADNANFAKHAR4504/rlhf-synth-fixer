/**
 * Unit tests for lib/tap_stack.tf (unit/static checks)
 *
 * These are fast, static tests that parse & validate HCL text patterns 
 * and critical invariants (providers, regional KMS, log groups, naming).
 *
 * Run:  npx jest test/terraform.unit.test.ts
 */

import fs from "fs";
import path from "path";

const tfPath = path.resolve(__dirname, "../lib/tap_stack.tf");
const hcl = fs.readFileSync(tfPath, "utf8");

const provPath = path.resolve(__dirname, "../lib/provider.tf");
const prov = fs.readFileSync(provPath, "utf8");

describe("provider.tf :: regionalized KMS + CloudWatch Logs", () => {
  test("contains aliased secondary provider", () => {
    expect(prov).toMatch(/provider\s+"aws"\s*{\s*alias\s*=\s*"secondary"/s);
  });

  test("declares primary_region and secondary_region variables or uses them", () => {
    // Either variable blocks or usage in code; allow flexibility
    const mentionsPrimary = /var\.primary_region/.test(prov);
    const mentionsSecondary = /var\.secondary_region/.test(prov);
    expect(mentionsPrimary && mentionsSecondary).toBe(true);
  });

  test("KMS key policies allow CloudWatch Logs service principals per region", () => {
    // We expect policy documents that include logs.${var.primary_region}.amazonaws.com and logs.${var.secondary_region}.amazonaws.com
    expect(hcl).toMatch(/data\s+"aws_iam_policy_document"\s+"logs_kms_use1"[\s\S]*identifiers\s*=\s*\[\s*"logs\.\$\{var\.primary_region}\.amazonaws\.com"\s*\]/);
    expect(hcl).toMatch(/data\s+"aws_iam_policy_document"\s+"logs_kms_usw2"[\s\S]*identifiers\s*=\s*\[\s*"logs\.\$\{var\.secondary_region}\.amazonaws\.com"\s*\]/);
  });

  test("defines regional KMS keys with for_each", () => {
    expect(hcl).toMatch(/resource\s+"aws_kms_key"\s+"logs_use1"[\s\S]*for_each/);
    expect(hcl).toMatch(/resource\s+"aws_kms_key"\s+"logs_usw2"[\s\S]*for_each/);
  });

  test("secondary region KMS key uses provider aws.secondary", () => {
    const block = hcl.match(/resource\s+"aws_kms_key"\s+"logs_usw2"[\s\S]*?}\n/);
    expect(block && /provider\s*=\s*aws\.secondary/.test(block[0])).toBe(true);
  });

  test("defines KMS aliases for both regions", () => {
    expect(hcl).toMatch(/resource\s+"aws_kms_alias"\s+"logs_use1"/);
    expect(hcl).toMatch(/resource\s+"aws_kms_alias"\s+"logs_usw2"[\s\S]*provider\s*=\s*aws\.secondary/);
  });

  test("log groups exist for both regions with correct providers", () => {
    // us-east-1 (primary) block
    const use1 = hcl.match(/resource\s+"aws_cloudwatch_log_group"\s+"application_logs_use1"[\s\S]*?}\n/);
    expect(use1).toBeTruthy();
    // us-west-2 (secondary) block with aliased provider
    const usw2 = hcl.match(/resource\s+"aws_cloudwatch_log_group"\s+"application_logs_usw2"[\s\S]*?}\n/);
    expect(usw2 && /provider\s*=\s*aws\.secondary/.test(usw2[0])).toBe(true);
  });

  test("log group naming pattern is stable and environment-derived", () => {
    const nameRegex = /name\s*=\s*"\/aws\/application\/\$\{each\.value}[-]logs[-]\$\{local\.project_name}[-]\$\{var\.environment_suffix}"/;
    expect(hcl).toMatch(nameRegex);
  });

  test("retention is 365 for production, else 30", () => {
    const retentionRegex = /retention_in_days\s*=\s*each\.value\s*==\s*"production"\s*\?\s*365\s*:\s*30/;
    expect(hcl).toMatch(retentionRegex);
  });

  test("log groups are encrypted with region-matching keys", () => {
    // Primary references logs_use1; Secondary references logs_usw2
    const use1 = hcl.match(/resource\s+"aws_cloudwatch_log_group"\s+"application_logs_use1"[\s\S]*?}\n/);
    const usw2 = hcl.match(/resource\s+"aws_cloudwatch_log_group"\s+"application_logs_usw2"[\s\S]*?}\n/);
    expect(use1 && /\bkms_key_id\s*=\s*aws_kms_key\.logs_use1\[\s*each\.value\s*]\.arn/.test(use1[0])).toBe(true);
    expect(usw2 && /\bkms_key_id\s*=\s*aws_kms_key\.logs_usw2\[\s*each\.value\s*]\.arn/.test(usw2[0])).toBe(true);
  });

  test("aliases are named clearly and include region suffix", () => {
    // alias/<env>-logs-<project>-<suffix>-<region>
    const aliasUse1 = /resource\s+"aws_kms_alias"\s+"logs_use1"[\s\S]*name\s*=\s*"alias\/\$\{each\.value}-logs-\$\{local\.project_name}-\$\{var\.environment_suffix}-\$\{var\.primary_region}"/;
    const aliasUsw2 = /resource\s+"aws_kms_alias"\s+"logs_usw2"[\s\S]*name\s*=\s*"alias\/\$\{each\.value}-logs-\$\{local\.project_name}-\$\{var\.environment_suffix}-\$\{var\.secondary_region}"/;
    expect(hcl).toMatch(aliasUse1);
    expect(hcl).toMatch(aliasUsw2);
  });
});


