// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf"; // adjust if your structure differs
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform Infrastructure Unit Tests", () => {
  test("tap_stack.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  // --- Optional sanity checks (keep lightweight) ---

  test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("declares aws_region variable in tap_stack.tf", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });
});

describe("Compliance and Monitoring Infrastructure Tests", () => {
  const libPath = path.resolve(__dirname, "../lib");
  const modulesPath = path.join(libPath, "modules");

  describe("Module Structure Validation", () => {
    test("monitoring module exists and has required files", () => {
      const monitoringPath = path.join(modulesPath, "monitoring");
      expect(fs.existsSync(monitoringPath)).toBe(true);
      expect(fs.existsSync(path.join(monitoringPath, "main.tf"))).toBe(true);
      expect(fs.existsSync(path.join(monitoringPath, "variables.tf"))).toBe(true);
      expect(fs.existsSync(path.join(monitoringPath, "outputs.tf"))).toBe(true);
    });

    test("compliance module exists and has required files", () => {
      const compliancePath = path.join(modulesPath, "compliance");
      expect(fs.existsSync(compliancePath)).toBe(true);
      expect(fs.existsSync(path.join(compliancePath, "main.tf"))).toBe(true);
      expect(fs.existsSync(path.join(compliancePath, "variables.tf"))).toBe(true);
      expect(fs.existsSync(path.join(compliancePath, "outputs.tf"))).toBe(true);
    });

    test("storage module exists and has required files", () => {
      const storagePath = path.join(modulesPath, "storage");
      expect(fs.existsSync(storagePath)).toBe(true);
      expect(fs.existsSync(path.join(storagePath, "main.tf"))).toBe(true);
      expect(fs.existsSync(path.join(storagePath, "variables.tf"))).toBe(true);
      expect(fs.existsSync(path.join(storagePath, "outputs.tf"))).toBe(true);
    });

    test("iam module exists and has required files", () => {
      const iamPath = path.join(modulesPath, "iam");
      expect(fs.existsSync(iamPath)).toBe(true);
      expect(fs.existsSync(path.join(iamPath, "main.tf"))).toBe(true);
      expect(fs.existsSync(path.join(iamPath, "variables.tf"))).toBe(true);
      expect(fs.existsSync(path.join(iamPath, "outputs.tf"))).toBe(true);
    });
  });

  describe("Monitoring Module Configuration", () => {
    let monitoringContent: string;

    beforeAll(() => {
      const monitoringPath = path.join(modulesPath, "monitoring", "main.tf");
      monitoringContent = fs.readFileSync(monitoringPath, "utf8");
    });

    test("has CloudTrail configuration", () => {
      expect(monitoringContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"\s*{/);
      expect(monitoringContent).toMatch(/include_global_service_events\s*=\s*true/);
      expect(monitoringContent).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test("has CloudWatch Log Group for CloudTrail", () => {
      expect(monitoringContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"cloudtrail"\s*{/);
      expect(monitoringContent).toMatch(/retention_in_days\s*=\s*30/);
    });

    test("has SNS Topic for notifications", () => {
      expect(monitoringContent).toMatch(/resource\s+"aws_sns_topic"\s+"main"\s*{/);
    });

    test("has CloudWatch Alarms", () => {
      expect(monitoringContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"api_errors"\s*{/);
      expect(monitoringContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lambda_errors"\s*{/);
    });

    test("has CloudWatch Dashboard", () => {
      expect(monitoringContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"main"\s*{/);
    });

    test("has IAM role for CloudTrail CloudWatch integration", () => {
      expect(monitoringContent).toMatch(/resource\s+"aws_iam_role"\s+"cloudtrail_cloudwatch_role"\s*{/);
    });
  });

  describe("Compliance Module Configuration", () => {
    let complianceContent: string;

    beforeAll(() => {
      const compliancePath = path.join(modulesPath, "compliance", "main.tf");
      complianceContent = fs.readFileSync(compliancePath, "utf8");
    });

    test("has AWS Config Recorder configuration", () => {
      expect(complianceContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"\s*{/);
      expect(complianceContent).toMatch(/all_supported\s*=\s*true/);
      expect(complianceContent).toMatch(/count\s*=\s*var\.use_existing_config_recorder\s*\?\s*0\s*:\s*1/);
    });

    test("has AWS Config Delivery Channel", () => {
      expect(complianceContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"\s*{/);
      expect(complianceContent).toMatch(/count\s*=\s*var\.use_existing_config_delivery_channel/);
    });

    test("has GuardDuty Detector", () => {
      expect(complianceContent).toMatch(/resource\s+"aws_guardduty_detector"\s+"main"\s*{/);
      expect(complianceContent).toMatch(/count\s*=\s*var\.use_existing_guardduty_detector/);
      expect(complianceContent).toMatch(/enable\s*=\s*true/);
    });

    test("has Security Hub Account", () => {
      expect(complianceContent).toMatch(/resource\s+"aws_securityhub_account"\s+"main"\s*{/);
      expect(complianceContent).toMatch(/count\s*=\s*var\.use_existing_securityhub/);
      expect(complianceContent).toMatch(/enable_default_standards\s*=\s*true/);
    });

    test("has Security Hub Standards Subscriptions", () => {
      expect(complianceContent).toMatch(/resource\s+"aws_securityhub_standards_subscription"\s+"cis_aws_foundations"\s*{/);
      expect(complianceContent).toMatch(/resource\s+"aws_securityhub_standards_subscription"\s+"pci_dss"\s*{/);
    });

    test("has Config Rules", () => {
      expect(complianceContent).toMatch(/resource\s+"aws_config_config_rule"\s+"s3_bucket_encryption"\s*{/);
      expect(complianceContent).toMatch(/resource\s+"aws_config_config_rule"\s+"rds_encryption"\s*{/);
      expect(complianceContent).toMatch(/resource\s+"aws_config_config_rule"\s+"iam_password_policy"\s*{/);
      expect(complianceContent).toMatch(/resource\s+"aws_config_config_rule"\s+"root_account_mfa"\s*{/);
      expect(complianceContent).toMatch(/depends_on\s*=\s*\[aws_config_configuration_recorder_status\.main\]/);
    });

    test("has IAM role for AWS Config", () => {
      expect(complianceContent).toMatch(/resource\s+"aws_iam_role"\s+"config_role"\s*{/);
    });

    test("has AWS managed policy attachment for Config", () => {
      expect(complianceContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"config_managed_policy"\s*{/);
      expect(complianceContent).toMatch(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/service-role\/AWS_ConfigRole"/);
    });

    test("has existing recorder configuration", () => {
      expect(complianceContent).toMatch(/config_recorder_name\s*=\s*var\.use_existing_config_recorder\s*\?\s*"prod-sec-config-recorder-main"/);
      expect(complianceContent).toMatch(/locals\s*{/);
    });
  });

  describe("IAM Module Configuration", () => {
    let iamContent: string;

    beforeAll(() => {
      const iamPath = path.join(modulesPath, "iam", "main.tf");
      iamContent = fs.readFileSync(iamPath, "utf8");
    });

    test("has SAML Identity Provider", () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_saml_provider"\s+"main"\s*{/);
      expect(iamContent).toMatch(/saml_metadata_document\s*=\s*var\.saml_metadata_document/);
    });

    test("has SAML Federation Role", () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"saml_role"\s*{/);
      expect(iamContent).toMatch(/Federated\s*=\s*aws_iam_saml_provider\.main\[0\]\.arn/);
    });

    test("has ReadOnly Role for SAML", () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"readonly_role"\s*{/);
      expect(iamContent).toMatch(/sts:AssumeRoleWithSAML/);
      expect(iamContent).toMatch(/Federated\s*=\s*aws_iam_saml_provider\.main\[0\]\.arn/);
    });

    test("has MFA Policy", () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_policy"\s+"mfa_policy"\s*{/);
      expect(iamContent).toMatch(/aws:MultiFactorAuthPresent/);
    });

    test("has Admin Role with MFA requirement", () => {
      expect(iamContent).toMatch(/resource\s+"aws_iam_role"\s+"admin_role"\s*{/);
      expect(iamContent).toMatch(/aws:MultiFactorAuthPresent.*true/);
    });
  });

  describe("Storage Module Configuration", () => {
    let storageContent: string;

    beforeAll(() => {
      const storagePath = path.join(modulesPath, "storage", "main.tf");
      storageContent = fs.readFileSync(storagePath, "utf8");
    });

    test("has KMS Key for encryption", () => {
      expect(storageContent).toMatch(/resource\s+"aws_kms_key"\s+"main"\s*{/);
      expect(storageContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("has S3 buckets for different purposes", () => {
      expect(storageContent).toMatch(/resource\s+"aws_s3_bucket"\s+"sensitive_data"\s*{/);
      expect(storageContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail"\s*{/);
      expect(storageContent).toMatch(/resource\s+"aws_s3_bucket"\s+"config"\s*{/);
    });

    test("has server-side encryption configuration", () => {
      expect(storageContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"sensitive_data"\s*{/);
      expect(storageContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"cloudtrail"\s*{/);
      expect(storageContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"config"\s*{/);
    });

    test("has versioning enabled", () => {
      expect(storageContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"sensitive_data"\s*{/);
      expect(storageContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"cloudtrail"\s*{/);
      expect(storageContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"config"\s*{/);
    });

    test("has public access blocked", () => {
      expect(storageContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"sensitive_data"\s*{/);
      expect(storageContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"cloudtrail"\s*{/);
      expect(storageContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"config"\s*{/);
    });

    test("has bucket policies for CloudTrail and Config", () => {
      expect(storageContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"\s*{/);
      expect(storageContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"config"\s*{/);
    });
  });

  describe("Module Integration Tests", () => {
    let stackContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
    });

    test("main stack includes monitoring module", () => {
      expect(stackContent).toMatch(/module\s+"monitoring"\s*{/);
      expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\/monitoring"/);
    });

    test("main stack includes compliance module", () => {
      expect(stackContent).toMatch(/module\s+"compliance"\s*{/);
      expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\/compliance"/);
    });

    test("main stack includes storage module", () => {
      expect(stackContent).toMatch(/module\s+"storage"\s*{/);
      expect(stackContent).toMatch(/source\s*=\s*"\.\/modules\/storage"/);
    });

    test("modules have proper dependencies", () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[module\.storage,\s*module\.monitoring\]/);
    });

    test("compliance module uses existing resources", () => {
      expect(stackContent).toMatch(/use_existing_config_recorder\s*=\s*true/);
      expect(stackContent).toMatch(/use_existing_config_delivery_channel\s*=\s*true/);
      expect(stackContent).toMatch(/use_existing_guardduty_detector\s*=\s*true/);
      expect(stackContent).toMatch(/use_existing_securityhub\s*=\s*true/);
    });

    test("modules receive required variables", () => {
      expect(stackContent).toMatch(/project_name\s*=\s*var\.project_name/);
      expect(stackContent).toMatch(/environment\s*=\s*var\.environment/);
      expect(stackContent).toMatch(/account_id\s*=\s*data\.aws_caller_identity\.current\.account_id/);
    });
  });

  describe("Security and Compliance Validation", () => {
    let monitoringContent: string;
    let complianceContent: string;
    let storageContent: string;

    beforeAll(() => {
      monitoringContent = fs.readFileSync(path.join(modulesPath, "monitoring", "main.tf"), "utf8");
      complianceContent = fs.readFileSync(path.join(modulesPath, "compliance", "main.tf"), "utf8");
      storageContent = fs.readFileSync(path.join(modulesPath, "storage", "main.tf"), "utf8");
    });

    test("CloudTrail has proper event selectors", () => {
      expect(monitoringContent).toMatch(/event_selector\s*{/);
      expect(monitoringContent).toMatch(/read_write_type\s*=\s*"All"/);
      expect(monitoringContent).toMatch(/include_management_events\s*=\s*true/);
      expect(monitoringContent).toMatch(/data_resource\s*{/);
      expect(monitoringContent).toMatch(/type\s*=\s*"AWS::S3::Object"/);
      expect(monitoringContent).toMatch(/values\s*=\s*\["arn:aws:s3:::\$\{var\.cloudtrail_s3_bucket\}\/\*"\]/);
    });

    test("S3 buckets have proper encryption", () => {
      expect(storageContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("Config rules cover security best practices", () => {
      expect(complianceContent).toMatch(/S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED/);
      expect(complianceContent).toMatch(/RDS_STORAGE_ENCRYPTED/);
      expect(complianceContent).toMatch(/IAM_PASSWORD_POLICY/);
      expect(complianceContent).toMatch(/ROOT_ACCOUNT_MFA_ENABLED/);
    });

    test("Security Hub has CIS and PCI DSS standards", () => {
      expect(complianceContent).toMatch(/cis-aws-foundations-benchmark/);
      expect(complianceContent).toMatch(/pci-dss/);
    });

    test("GuardDuty has S3 data events enabled", () => {
      expect(complianceContent).toMatch(/resource\s+"aws_guardduty_detector_feature"\s+"main"\s*{/);
      expect(complianceContent).toMatch(/name\s*=\s*"S3_DATA_EVENTS"/);
      expect(complianceContent).toMatch(/status\s*=\s*"ENABLED"/);
    });
  });

  describe("Output Validation", () => {
    let monitoringOutputs: string;
    let complianceOutputs: string;
    let storageOutputs: string;

    beforeAll(() => {
      monitoringOutputs = fs.readFileSync(path.join(modulesPath, "monitoring", "outputs.tf"), "utf8");
      complianceOutputs = fs.readFileSync(path.join(modulesPath, "compliance", "outputs.tf"), "utf8");
      storageOutputs = fs.readFileSync(path.join(modulesPath, "storage", "outputs.tf"), "utf8");
    });

    test("monitoring module exposes required outputs", () => {
      expect(monitoringOutputs).toMatch(/output\s+"cloudtrail_arn"/);
      expect(monitoringOutputs).toMatch(/output\s+"sns_topic_arn"/);
      expect(monitoringOutputs).toMatch(/output\s+"cloudwatch_dashboard_name"/);
    });

    test("compliance module exposes required outputs", () => {
      expect(complianceOutputs).toMatch(/output\s+"config_recorder_name"/);
      expect(complianceOutputs).toMatch(/output\s+"guardduty_detector_id"/);
      expect(complianceOutputs).toMatch(/output\s+"securityhub_account_id"/);
    });

    test("storage module exposes required outputs", () => {
      expect(storageOutputs).toMatch(/output\s+"kms_key_id"/);
      expect(storageOutputs).toMatch(/output\s+"cloudtrail_bucket_name"/);
      expect(storageOutputs).toMatch(/output\s+"config_bucket_name"/);
    });
  });

  describe("Variable Validation", () => {
    let monitoringVars: string;
    let complianceVars: string;
    let storageVars: string;

    beforeAll(() => {
      monitoringVars = fs.readFileSync(path.join(modulesPath, "monitoring", "variables.tf"), "utf8");
      complianceVars = fs.readFileSync(path.join(modulesPath, "compliance", "variables.tf"), "utf8");
      storageVars = fs.readFileSync(path.join(modulesPath, "storage", "variables.tf"), "utf8");
    });

    test("monitoring module has required variables", () => {
      expect(monitoringVars).toMatch(/variable\s+"project_name"/);
      expect(monitoringVars).toMatch(/variable\s+"environment"/);
      expect(monitoringVars).toMatch(/variable\s+"cloudtrail_s3_bucket"/);
      expect(monitoringVars).toMatch(/variable\s+"kms_key_id"/);
    });

    test("compliance module has required variables", () => {
      expect(complianceVars).toMatch(/variable\s+"project_name"/);
      expect(complianceVars).toMatch(/variable\s+"environment"/);
      expect(complianceVars).toMatch(/variable\s+"config_s3_bucket"/);
      expect(complianceVars).toMatch(/variable\s+"sns_topic_arn"/);
      expect(complianceVars).toMatch(/variable\s+"use_existing_config_recorder"/);
      expect(complianceVars).toMatch(/variable\s+"use_existing_config_delivery_channel"/);
      expect(complianceVars).toMatch(/variable\s+"use_existing_guardduty_detector"/);
      expect(complianceVars).toMatch(/variable\s+"use_existing_securityhub"/);
    });

    test("storage module has required variables", () => {
      expect(storageVars).toMatch(/variable\s+"project_name"/);
      expect(storageVars).toMatch(/variable\s+"environment"/);
      expect(storageVars).toMatch(/variable\s+"account_id"/);
    });
  });
});
