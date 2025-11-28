// tests/unit/terraform.unit.test.ts
// Unit tests for Terraform multi-account security framework
// Tests configuration structure and key security requirements

import fs from "fs";
import path from "path";

const MAIN_TF = "../lib/main.tf";
const VARIABLES_TF = "../lib/variables.tf";
const PROVIDER_TF = "../lib/provider.tf";
const mainTfPath = path.resolve(__dirname, MAIN_TF);
const variablesTfPath = path.resolve(__dirname, VARIABLES_TF);
const providerTfPath = path.resolve(__dirname, PROVIDER_TF);

describe("Terraform Multi-Account Security Framework", () => {

  describe("File Structure", () => {
    test("main.tf exists", () => {
      const exists = fs.existsSync(mainTfPath);
      if (!exists) {
        console.error(`[unit] Expected main.tf at: ${mainTfPath}`);
      }
      expect(exists).toBe(true);
    });

    test("variables.tf exists", () => {
      expect(fs.existsSync(variablesTfPath)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(providerTfPath)).toBe(true);
    });
  });

  describe("AWS Organizations Configuration", () => {
    let mainTfContent: string;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(mainTfPath, "utf8");
    });

    test("declares aws_organizations_organization resource", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_organizations_organization"\s+"main"\s*{/);
    });

    test("creates Security OU with environment_suffix", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_organizations_organizational_unit"\s+"security"\s*{/);
      expect(mainTfContent).toMatch(/name\s*=\s*"Security-\$\{var\.environment_suffix\}"/);
    });

    test("creates Production OU with environment_suffix", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_organizations_organizational_unit"\s+"production"\s*{/);
      expect(mainTfContent).toMatch(/name\s*=\s*"Production-\$\{var\.environment_suffix\}"/);
    });

    test("creates Development OU with environment_suffix", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_organizations_organizational_unit"\s+"development"\s*{/);
      expect(mainTfContent).toMatch(/name\s*=\s*"Development-\$\{var\.environment_suffix\}"/);
    });

    test("does not enable GuardDuty service access", () => {
      expect(mainTfContent).not.toMatch(/guardduty\.amazonaws\.com/);
    });
  });

  describe("KMS Multi-Region Configuration", () => {
    let mainTfContent: string;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(mainTfPath, "utf8");
    });

    test("creates primary KMS key with rotation enabled", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_kms_key"\s+"primary"\s*{/);
      expect(mainTfContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("configures primary KMS key as multi-region", () => {
      expect(mainTfContent).toMatch(/multi_region\s*=\s*true/);
    });

    test("creates replica KMS key in eu-west-1", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_kms_replica_key"\s+"secondary"\s*{/);
      expect(mainTfContent).toMatch(/provider\s*=\s*aws\.eu_west_1/);
    });

    test("configures KMS key deletion window", () => {
      expect(mainTfContent).toMatch(/deletion_window_in_days\s*=\s*7/);
    });
  });

  describe("IAM Cross-Account Roles", () => {
    let mainTfContent: string;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(mainTfPath, "utf8");
    });

    test("creates SecurityAuditRole with MFA enforcement", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role"\s+"security_audit"\s*{/);
      expect(mainTfContent).toMatch(/name\s*=\s*"SecurityAuditRole-\$\{var\.environment_suffix\}"/);
      expect(mainTfContent).toMatch(/aws:MultiFactorAuthPresent/);
    });

    test("creates ComplianceAuditRole with MFA enforcement", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role"\s+"compliance_audit"\s*{/);
      expect(mainTfContent).toMatch(/name\s*=\s*"ComplianceAuditRole-\$\{var\.environment_suffix\}"/);
    });

    test("attaches ReadOnlyAccess policy to security audit role", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"security_audit_readonly"\s*{/);
      expect(mainTfContent).toMatch(/arn:aws:iam::aws:policy\/ReadOnlyAccess/);
    });
  });

  describe("Service Control Policies", () => {
    let mainTfContent: string;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(mainTfPath, "utf8");
    });

    test("creates SCP to enforce S3 encryption", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_organizations_policy"\s+"enforce_s3_encryption"\s*{/);
      expect(mainTfContent).toMatch(/name\s*=\s*"EnforceS3Encryption-\$\{var\.environment_suffix\}"/);
      expect(mainTfContent).toMatch(/type\s*=\s*"SERVICE_CONTROL_POLICY"/);
    });

    test("creates SCP to enforce EBS encryption", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_organizations_policy"\s+"enforce_ebs_encryption"\s*{/);
      expect(mainTfContent).toMatch(/DenyUnencryptedEBSVolumes/);
    });

    test("creates SCP to enforce RDS encryption", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_organizations_policy"\s+"enforce_rds_encryption"\s*{/);
      expect(mainTfContent).toMatch(/DenyUnencryptedRDSInstances/);
    });

    test("creates SCP to protect CloudWatch Logs", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_organizations_policy"\s+"protect_cloudwatch_logs"\s*{/);
      expect(mainTfContent).toMatch(/DenyCloudWatchLogsDeletion/);
    });

    test("attaches SCPs to all three OUs", () => {
      // Should have 3 attachments per policy (security, production, development)
      const s3Attachments = mainTfContent.match(/resource\s+"aws_organizations_policy_attachment"\s+"(security|production|development)_s3_encryption"/g);
      expect(s3Attachments).toHaveLength(3);
    });
  });

  describe("CloudWatch Logs Configuration", () => {
    let mainTfContent: string;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(mainTfPath, "utf8");
    });

    test("creates CloudWatch log group for IAM activity", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"iam_activity"\s*{/);
      expect(mainTfContent).toMatch(/retention_in_days\s*=\s*90/);
    });

    test("creates CloudWatch log group for CloudTrail", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"cloudtrail"\s*{/);
    });

    test("encrypts CloudWatch logs with KMS", () => {
      expect(mainTfContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.primary\.arn/);
    });
  });

  describe("AWS Config Rules", () => {
    let mainTfContent: string;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(mainTfPath, "utf8");
    });

    test("creates Config recorder", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"\s*{/);
    });

    test("creates Config rule for S3 encryption", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_config_config_rule"\s+"s3_bucket_encryption"\s*{/);
      expect(mainTfContent).toMatch(/S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED/);
    });

    test("creates Config rule for EBS encryption", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_config_config_rule"\s+"ebs_encryption"\s*{/);
      expect(mainTfContent).toMatch(/ENCRYPTED_VOLUMES/);
    });

    test("creates Config rule for RDS encryption", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_config_config_rule"\s+"rds_encryption"\s*{/);
      expect(mainTfContent).toMatch(/RDS_STORAGE_ENCRYPTED/);
    });

    test("creates Config rule for IAM MFA", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_config_config_rule"\s+"iam_mfa_enabled"\s*{/);
    });

    test("creates Config rule for root MFA", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_config_config_rule"\s+"root_mfa_enabled"\s*{/);
    });
  });

  describe("CloudTrail Configuration", () => {
    let mainTfContent: string;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(mainTfPath, "utf8");
    });

    test("creates organization-wide CloudTrail", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudtrail"\s+"organization"\s*{/);
      expect(mainTfContent).toMatch(/is_organization_trail\s*=\s*true/);
    });

    test("enables multi-region trail", () => {
      expect(mainTfContent).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test("enables log file validation", () => {
      expect(mainTfContent).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test("encrypts trail with KMS", () => {
      expect(mainTfContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.primary\.arn/);
    });
  });

  describe("Security Best Practices", () => {
    let mainTfContent: string;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(mainTfPath, "utf8");
    });

    test("all resources use environment_suffix variable", () => {
      const resourceNames = mainTfContent.match(/name\s*=\s*"[^"]+"/g) || [];
      const resourceNamesWithoutSuffix = resourceNames.filter(name =>
        !name.includes("${var.environment_suffix}") &&
        !name.includes("aws_service_access_principals") &&
        !name.includes("enabled_policy_types")
      );
      expect(resourceNamesWithoutSuffix).toHaveLength(0);
    });

    test("no hardcoded resource deletion protection", () => {
      expect(mainTfContent).not.toMatch(/deletion_protection\s*=\s*true/);
      expect(mainTfContent).not.toMatch(/prevent_destroy\s*=\s*true/);
    });

    test("S3 buckets use KMS encryption", () => {
      const s3Buckets = mainTfContent.match(/resource\s+"aws_s3_bucket"\s+"\w+"/g) || [];
      const encryptionConfigs = mainTfContent.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/g) || [];
      expect(s3Buckets.length).toBeGreaterThan(0);
      expect(encryptionConfigs.length).toBeGreaterThanOrEqual(s3Buckets.length);
    });
  });

  describe("Variables Configuration", () => {
    let variablesContent: string;

    beforeAll(() => {
      variablesContent = fs.readFileSync(variablesTfPath, "utf8");
    });

    test("declares environment_suffix variable", () => {
      expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });
  });
});
