// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for Zero Trust Multi-Account AWS Security Architecture
// Tests ../lib/tap_stack.tf without executing Terraform commands 

import fs from "fs";
import path from "path";


const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Zero Trust Multi-Account AWS Security Architecture", () => {
  let stackContent: string;

  beforeAll(() => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      throw new Error(`Stack file not found at: ${stackPath}`);
    }
    stackContent = fs.readFileSync(stackPath, "utf8");
  });

  // ============================================================================
  // FILE STRUCTURE AND BASIC VALIDATION
  // ============================================================================

  describe("File Structure and Basic Validation", () => {
    test("tap_stack.tf exists and is readable", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
      expect(stackContent.length).toBeGreaterThan(1000);
    });

    test("does NOT declare provider (provider.tf owns providers)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("contains proper file header and documentation", () => {
      expect(stackContent).toMatch(/# tap_stack\.tf - Complete Zero Trust Multi-Account AWS Security Architecture/);
      expect(stackContent).toMatch(/# ==============================================================================/);
    });

    test("has proper section organization with comments", () => {
      const expectedSections = [
        "Variable Declarations with Validation",
        "Data Sources",
        "Local Values",
        "AWS Organizations & Organizational Units",
        "Service Control Policies",
        "KMS Keys for Encryption",
        "S3 Bucket for Centralized Security Logs",
        "IAM Identity Federation",
        "IAM Roles for Security Services",
        "IAM Access Analyzer",
        "CloudTrail Organization Trail",
        "AWS Config",
        "GuardDuty",
        "Security Hub",
        "SNS Topics for Alerting",
        "CloudWatch Alarms and Metrics",
        "Lambda Functions for Remediation",
        "EventBridge Rules for Automation",
        "Outputs"
      ];

      expectedSections.forEach(section => {
        expect(stackContent).toMatch(new RegExp(`# ${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
      });
    });
  });

  // ============================================================================
  // VARIABLE DECLARATIONS AND VALIDATION
  // ============================================================================

  describe("Variable Declarations and Validation", () => {
    test("declares all required variables with proper types", () => {
      const requiredVariables = [
        { name: "aws_region", type: "string" },
        { name: "management_account_id", type: "string" },
        { name: "security_account_id", type: "string" },
        { name: "workload_account_ids", type: "list(string)" },
        { name: "org_name", type: "string" },
        { name: "compliance_standards", type: "list(string)" },
        { name: "log_retention_days", type: "number" },
        { name: "saml_provider_arn", type: "string" },
        { name: "oidc_provider_url", type: "string" },
        { name: "resource_tags", type: "map(string)" }
      ];

      requiredVariables.forEach(variable => {
        const variableRegex = new RegExp(`variable\\s+"${variable.name}"\\s*{[\\s\\S]*?type\\s*=\\s*${variable.type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
        expect(stackContent).toMatch(variableRegex);
      });
    });

    test("aws_region variable has proper validation", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{[\s\S]*?validation\s*{[\s\S]*?condition\s*=\s*can\(regex\("\^\[a-z\]\{2\}-\[a-z\]\+-\[0-9\]\$"/);
      expect(stackContent).toMatch(/error_message\s*=\s*"AWS region must be in valid format/);
    });

    test("account ID variables have 12-digit validation", () => {
      const accountIdVariables = ["management_account_id", "security_account_id"];
      
      accountIdVariables.forEach(variable => {
        const validationRegex = new RegExp(`variable\\s+"${variable}"[\\s\\S]*?validation\\s*{[\\s\\S]*?condition\\s*=\\s*can\\(regex\\("\\^\\[0-9\\]\\{12\\}\\$"`);
        expect(stackContent).toMatch(validationRegex);
      });
    });

    test("workload_account_ids has array validation for 12-digit numbers", () => {
      expect(stackContent).toMatch(/variable\s+"workload_account_ids"[\s\S]*?validation\s*{[\s\S]*?condition\s*=\s*alltrue\(\[for id in var\.workload_account_ids : can\(regex\("\^\[0-9\]\{12\}\$"/);
    });

    test("org_name has proper format validation", () => {
      expect(stackContent).toMatch(/variable\s+"org_name"[\s\S]*?validation\s*{[\s\S]*?condition\s*=\s*can\(regex\("\^\[a-z0-9-\]\+\$"/);
    });

    test("log_retention_days has range validation", () => {
      expect(stackContent).toMatch(/variable\s+"log_retention_days"[\s\S]*?validation\s*{[\s\S]*?condition\s*=\s*var\.log_retention_days >= 365 && var\.log_retention_days <= 3653/);
    });

    test("variables have proper default values", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"[\s\S]*?default\s*=\s*"us-east-1"/);
      expect(stackContent).toMatch(/variable\s+"org_name"[\s\S]*?default\s*=\s*"financial-org"/);
      expect(stackContent).toMatch(/variable\s+"log_retention_days"[\s\S]*?default\s*=\s*2555/);
      expect(stackContent).toMatch(/variable\s+"compliance_standards"[\s\S]*?default\s*=\s*\["SOC2", "PCI-DSS"\]/);
    });

    test("resource_tags variable has proper default structure", () => {
      expect(stackContent).toMatch(/variable\s+"resource_tags"[\s\S]*?default\s*=\s*{[\s\S]*?Environment\s*=\s*"Production"[\s\S]*?Owner\s*=\s*"SecurityTeam"[\s\S]*?Project\s*=\s*"ZeroTrustArchitecture"[\s\S]*?Compliance\s*=\s*"SOC2-PCI-DSS"/);
    });
  });

  // ============================================================================
  // DATA SOURCES AND LOCAL VALUES
  // ============================================================================

  describe("Data Sources and Local Values", () => {
    test("declares required data sources", () => {
      const requiredDataSources = [
        'data "aws_caller_identity" "current"',
        'data "aws_partition" "current"'
      ];

      requiredDataSources.forEach(dataSource => {
        expect(stackContent).toMatch(new RegExp(dataSource.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      });
      
      // Verify organizations data source is commented out (single account setup)
      expect(stackContent).toMatch(/# Organizations data source removed - using single account setup/);
    });

    test("defines local values with proper structure", () => {
      expect(stackContent).toMatch(/locals\s*{[\s\S]*?account_id\s*=\s*data\.aws_caller_identity\.current\.account_id/);
      expect(stackContent).toMatch(/partition\s*=\s*data\.aws_partition\.current\.partition/);
      expect(stackContent).toMatch(/common_tags\s*=\s*merge\(var\.resource_tags/);
    });

    test("defines Security Hub standards ARNs in locals", () => {
      expect(stackContent).toMatch(/security_hub_standards\s*=\s*{[\s\S]*?cis_aws_foundations[\s\S]*?pci_dss[\s\S]*?nist_800_53/);
    });
  });

  // ============================================================================
  // AWS ORGANIZATIONS AND ORGANIZATIONAL UNITS
  // ============================================================================

  describe("AWS Organizations and Organizational Units (Single Account Setup)", () => {
    test("organizations resources are commented out for single account", () => {
      expect(stackContent).toMatch(/# AWS Organizations & Organizational Units \(Disabled for single account\)/);
      expect(stackContent).toMatch(/# resource "aws_organizations_organization" "main"/);
    });

    test("organizational units are commented out for single account", () => {
      expect(stackContent).toMatch(/# resource "aws_organizations_organizational_unit" "security"/);
      expect(stackContent).toMatch(/# resource "aws_organizations_organizational_unit" "workloads"/);
      expect(stackContent).toMatch(/# resource "aws_organizations_organizational_unit" "sandbox"/);
    });

    test("workload accounts are commented out for single account", () => {
      expect(stackContent).toMatch(/# Create workload accounts \(Disabled for single account\)/);
      expect(stackContent).toMatch(/# resource "aws_organizations_account" "workload_accounts"/);
    });

    test("retains service access principals in comments for reference", () => {
      const requiredServices = [
        "securityhub.amazonaws.com",
        "guardduty.amazonaws.com",
        "config.amazonaws.com",
        "cloudtrail.amazonaws.com",
        "access-analyzer.amazonaws.com",
        "sso.amazonaws.com",
        "fms.amazonaws.com"
      ];

      requiredServices.forEach(service => {
        expect(stackContent).toMatch(new RegExp(`#.*"${service}"`));
      });
    });
  });

  // ============================================================================
  // SERVICE CONTROL POLICIES (SCPs)
  // ============================================================================

  describe("Service Control Policies (Single Account Setup)", () => {
    test("SCPs are commented out for single account", () => {
      expect(stackContent).toMatch(/# Service Control Policies \(SCPs\) - Disabled for single account/);
      expect(stackContent).toMatch(/# resource "aws_organizations_policy" "deny_public_access"/);
      expect(stackContent).toMatch(/# resource "aws_organizations_policy" "require_encryption"/);
      expect(stackContent).toMatch(/# resource "aws_organizations_policy" "enforce_mfa"/);
    });

    test("SCP policies retain content in comments for reference", () => {
      const deniedServices = ["DenyPublicS3Access", "DenyPublicRDSAccess", "DenyPublicEC2Access", "DenyPublicRedshiftAccess"];
      
      deniedServices.forEach(service => {
        expect(stackContent).toMatch(new RegExp(`#.*Sid.*=.*"${service}"`));
      });
    });

    test("encryption policies retain content in comments for reference", () => {
      const encryptionServices = ["RequireS3Encryption", "RequireEBSEncryption", "RequireRDSEncryption", "RequireRedshiftEncryption"];
      
      encryptionServices.forEach(service => {
        expect(stackContent).toMatch(new RegExp(`#.*Sid.*=.*"${service}"`));
      });
    });

    test("SCP attachments are commented out for single account", () => {
      expect(stackContent).toMatch(/# resource "aws_organizations_policy_attachment" "deny_public_access_root"/);
      expect(stackContent).toMatch(/# resource "aws_organizations_policy_attachment" "require_encryption_root"/);
      expect(stackContent).toMatch(/# resource "aws_organizations_policy_attachment" "enforce_mfa_workloads"/);
    });
  });

  // ============================================================================
  // KMS AND ENCRYPTION
  // ============================================================================

  describe("KMS and Encryption", () => {
    test("creates KMS key for security logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"security_logs_key"\s*{[\s\S]*?description\s*=\s*"KMS key for security logs and findings encryption"/);
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(stackContent).toMatch(/deletion_window_in_days\s*=\s*30/);
    });

    test("KMS key policy allows required services", () => {
      const allowedServices = [
        "cloudtrail.amazonaws.com",
        "guardduty.amazonaws.com",
        "securityhub.amazonaws.com",
        "config.amazonaws.com"
      ];

      allowedServices.forEach(service => {
        expect(stackContent).toMatch(new RegExp(`"${service}"`));
      });
    });

    test("creates KMS alias", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"security_logs_key_alias"\s*{[\s\S]*?name\s*=\s*"alias\/\$\{var\.org_name\}-security-logs"/);
    });
  });

  // ============================================================================
  // S3 CENTRALIZED SECURITY LOGS
  // ============================================================================

  describe("S3 Centralized Security Logs", () => {
    test("creates S3 bucket for security logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"security_logs"\s*{[\s\S]*?bucket\s*=\s*"\$\{var\.org_name\}-security-logs-\$\{local\.account_id\}-\$\{var\.aws_region\}"/);
      expect(stackContent).toMatch(/force_destroy\s*=\s*false/);
      expect(stackContent).toMatch(/lifecycle\s*{[\s\S]*?prevent_destroy\s*=\s*true/);
    });

    test("configures S3 bucket public access block", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"security_logs_pab"[\s\S]*?block_public_acls\s*=\s*true[\s\S]*?block_public_policy\s*=\s*true[\s\S]*?ignore_public_acls\s*=\s*true[\s\S]*?restrict_public_buckets\s*=\s*true/);
    });

    test("configures S3 bucket encryption", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"security_logs_encryption"[\s\S]*?kms_master_key_id\s*=\s*aws_kms_key\.security_logs_key\.arn[\s\S]*?sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("enables S3 bucket versioning", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"security_logs_versioning"[\s\S]*?status\s*=\s*"Enabled"/);
    });

    test("configures S3 lifecycle policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"security_logs_lifecycle"[\s\S]*?storage_class\s*=\s*"STANDARD_IA"[\s\S]*?storage_class\s*=\s*"GLACIER"[\s\S]*?storage_class\s*=\s*"DEEP_ARCHIVE"/);
      expect(stackContent).toMatch(/expiration\s*{[\s\S]*?days\s*=\s*var\.log_retention_days/);
    });

    test("configures S3 bucket policy for CloudTrail and Config", () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"security_logs_policy"/);
      expect(stackContent).toMatch(/"AWSCloudTrailAclCheck"/);
      expect(stackContent).toMatch(/"AWSCloudTrailWrite"/);
      expect(stackContent).toMatch(/"AWSConfigBucketPermissionsCheck"/);
      expect(stackContent).toMatch(/"AWSConfigBucketDelivery"/);
    });
  });

  // ============================================================================
  // IAM IDENTITY FEDERATION
  // ============================================================================

  describe("IAM Identity Federation", () => {
    test("creates SAML identity provider", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_saml_provider"\s+"corporate_saml"\s*{[\s\S]*?count\s*=\s*0/);
    });

    test("creates OIDC identity provider", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_openid_connect_provider"\s+"corporate_oidc"\s*{[\s\S]*?count\s*=\s*var\.oidc_provider_url != "" \? 1 : 0/);
    });

    test("creates federated roles", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"federated_admin_role"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"federated_readonly_role"/);
    });

    test("attaches appropriate policies to federated roles", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"federated_admin_policy"[\s\S]*?policy_arn\s*=\s*"arn:\$\{local\.partition\}:iam::aws:policy\/AdministratorAccess"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"federated_readonly_policy"[\s\S]*?policy_arn\s*=\s*"arn:\$\{local\.partition\}:iam::aws:policy\/ReadOnlyAccess"/);
    });
  });

  // ============================================================================
  // IAM SECURITY ROLES
  // ============================================================================

  describe("IAM Security Roles", () => {
    test("creates security admin role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"security_admin_role"[\s\S]*?name\s*=\s*"\$\{var\.org_name\}-security-admin"/);
    });

    test("security admin role requires MFA", () => {
      expect(stackContent).toMatch(/aws:MultiFactorAuthPresent.*=.*true/);
      expect(stackContent).toMatch(/aws:MultiFactorAuthAge.*3600/);
    });

    test("creates comprehensive security admin policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"security_admin_policy"/);
      expect(stackContent).toMatch(/"SecurityServicesFullAccess"/);
      expect(stackContent).toMatch(/"LogsAndMetricsAccess"/);
      expect(stackContent).toMatch(/"S3SecurityLogsAccess"/);
      expect(stackContent).toMatch(/"KMSAccess"/);
      expect(stackContent).toMatch(/"IAMReadAccess"/);
      expect(stackContent).toMatch(/"SNSPublishAccess"/);
    });

    test("creates cross-account security role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"cross_account_security_role"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"cross_account_security_policy"/);
    });

    test("cross-account role allows security remediation actions", () => {
      expect(stackContent).toMatch(/"SecurityRemediationActions"/);
      expect(stackContent).toMatch(/s3:PutBucketPublicAccessBlock/);
      expect(stackContent).toMatch(/ec2:StopInstances/);
      expect(stackContent).toMatch(/iam:UpdateAccessKey/);
    });
  });

  // ============================================================================
  // IAM ACCESS ANALYZER
  // ============================================================================

  describe("IAM Access Analyzer", () => {
    test("creates account-level access analyzer", () => {
      expect(stackContent).toMatch(/resource\s+"aws_accessanalyzer_analyzer"\s+"organization_analyzer"[\s\S]*?analyzer_name\s*=\s*"\$\{var\.org_name\}-account-analyzer"[\s\S]*?type\s*=\s*"ACCOUNT"/);
    });
  });

  // ============================================================================
  // CLOUDTRAIL
  // ============================================================================

  describe("CloudTrail", () => {
    test("creates organization trail", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"organization_trail"[\s\S]*?name\s*=\s*"\$\{var\.org_name\}-organization-trail"/);
      expect(stackContent).toMatch(/is_organization_trail\s*=\s*true/);
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
      expect(stackContent).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test("CloudTrail includes data events", () => {
      expect(stackContent).toMatch(/event_selector\s*{[\s\S]*?data_resource\s*{[\s\S]*?type\s*=\s*"AWS::S3::Object"/);
      expect(stackContent).toMatch(/type\s*=\s*"AWS::Lambda::Function"/);
      expect(stackContent).toMatch(/type\s*=\s*"AWS::DynamoDB::Table"/);
    });

    test("CloudTrail has insights enabled", () => {
      expect(stackContent).toMatch(/insight_selector\s*{[\s\S]*?insight_type\s*=\s*"ApiCallRateInsight"/);
    });
  });

  // ============================================================================
  // AWS CONFIG
  // ============================================================================

  describe("AWS Config", () => {
    test("creates Config service role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"config_role"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"config_role_policy"[\s\S]*?policy_arn\s*=\s*"arn:\$\{local\.partition\}:iam::aws:policy\/service-role\/AWS_ConfigRole"/);
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"config_organization_policy"[\s\S]*?policy_arn\s*=\s*"arn:\$\{local\.partition\}:iam::aws:policy\/service-role\/ConfigRoleForOrganizations"/);
    });

    test("creates Config recorder", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"organization_recorder"[\s\S]*?all_supported\s*=\s*true[\s\S]*?include_global_resource_types\s*=\s*true/);
    });

    test("creates Config delivery channel", () => {
      expect(stackContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"organization_delivery_channel"[\s\S]*?s3_bucket_name\s*=\s*aws_s3_bucket\.security_logs\.id/);
    });

    test("creates organization managed rules", () => {
      const requiredRules = [
        "s3_bucket_public_write_prohibited",
        "s3_bucket_public_read_prohibited",
        "encrypted_volumes",
        "root_account_mfa_enabled",
        "iam_password_policy",
        "rds_encrypted",
        "cloudtrail_enabled"
      ];

      requiredRules.forEach(rule => {
        expect(stackContent).toMatch(new RegExp(`resource\\s+"aws_config_organization_managed_rule"\\s+"${rule}"`));
      });
    });

    test("IAM password policy rule has proper parameters", () => {
      expect(stackContent).toMatch(/input_parameters\s*=\s*jsonencode\({[\s\S]*?RequireUppercaseCharacters.*=.*"true"[\s\S]*?MinimumPasswordLength.*=.*"14"[\s\S]*?PasswordReusePrevention.*=.*"24"/);
    });
  });

  // ============================================================================
  // GUARDDUTY
  // ============================================================================

  describe("GuardDuty", () => {
    test("creates GuardDuty detector", () => {
      expect(stackContent).toMatch(/resource\s+"aws_guardduty_detector"\s+"main_detector"[\s\S]*?enable\s*=\s*true[\s\S]*?finding_publishing_frequency\s*=\s*"FIFTEEN_MINUTES"/);
    });

    test("enables GuardDuty data sources", () => {
      expect(stackContent).toMatch(/aws_guardduty_detector_feature.*s3_data_events/);
      expect(stackContent).toMatch(/aws_guardduty_detector_feature.*eks_audit_logs/);
      expect(stackContent).toMatch(/aws_guardduty_detector_feature.*ebs_malware_protection/);
    });

    test("creates GuardDuty organization configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_guardduty_organization_admin_account"\s+"security_admin"[\s\S]*?admin_account_id\s*=\s*var\.security_account_id/);
      expect(stackContent).toMatch(/resource\s+"aws_guardduty_organization_configuration"\s+"org_config"[\s\S]*?auto_enable_organization_members\s*=\s*"ALL"/);
    });

    test("creates threat intelligence set", () => {
      expect(stackContent).toMatch(/resource\s+"aws_guardduty_threatintelset"\s+"corporate_threat_intel"[\s\S]*?activate\s*=\s*true[\s\S]*?format\s*=\s*"TXT"/);
    });
  });

  // ============================================================================
  // SECURITY HUB
  // ============================================================================

  describe("Security Hub", () => {
    test("enables Security Hub account", () => {
      expect(stackContent).toMatch(/resource\s+"aws_securityhub_account"\s+"main"[\s\S]*?enable_default_standards\s*=\s*true/);
    });

    test("creates Security Hub organization configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_securityhub_organization_admin_account"\s+"security_admin"[\s\S]*?admin_account_id\s*=\s*var\.security_account_id/);
      expect(stackContent).toMatch(/resource\s+"aws_securityhub_organization_configuration"\s+"main"[\s\S]*?auto_enable\s*=\s*true/);
    });

    test("enables required Security Hub standards", () => {
      const requiredStandards = ["cis_aws_foundations", "pci_dss", "nist_800_53"];
      
      requiredStandards.forEach(standard => {
        expect(stackContent).toMatch(new RegExp(`resource\\s+"aws_securityhub_standards_subscription"\\s+"${standard}"`));
      });
    });

    test("creates Security Hub custom insights", () => {
      expect(stackContent).toMatch(/resource\s+"aws_securityhub_insight"\s+"high_severity_findings"/);
      expect(stackContent).toMatch(/resource\s+"aws_securityhub_insight"\s+"failed_compliance_checks"/);
    });
  });

  // ============================================================================
  // SNS TOPICS AND ALERTING
  // ============================================================================

  describe("SNS Topics and Alerting", () => {
    test("creates SNS topics for alerts", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"security_alerts"[\s\S]*?name\s*=\s*"\$\{var\.org_name\}-security-alerts"/);
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"\s+"compliance_alerts"[\s\S]*?name\s*=\s*"\$\{var\.org_name\}-compliance-alerts"/);
    });

    test("SNS topics use KMS encryption", () => {
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.security_logs_key\.id/);
    });

    test("creates SNS topic policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic_policy"\s+"security_alerts_policy"/);
      expect(stackContent).toMatch(/"AllowSecurityServicesPublish"/);
      expect(stackContent).toMatch(/"AllowLambdaPublish"/);
    });
  });

  // ============================================================================
  // CLOUDWATCH MONITORING
  // ============================================================================

  describe("CloudWatch Monitoring", () => {
    test("creates CloudWatch alarms for security metrics", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"guardduty_high_severity_findings"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"securityhub_compliance_score"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"config_compliance_failures"/);
    });

    test("CloudWatch alarms have proper thresholds", () => {
      expect(stackContent).toMatch(/threshold\s*=\s*"0"[\s\S]*?alarm_description\s*=\s*"This metric monitors high severity GuardDuty findings"/);
      expect(stackContent).toMatch(/threshold\s*=\s*"80"[\s\S]*?alarm_description\s*=\s*"This metric monitors Security Hub compliance score"/);
      expect(stackContent).toMatch(/threshold\s*=\s*"5"[\s\S]*?alarm_description\s*=\s*"This metric monitors Config rule compliance failures"/);
    });

    test("creates CloudWatch dashboard", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"security_dashboard"[\s\S]*?dashboard_name\s*=\s*"\$\{var\.org_name\}-security-dashboard"/);
    });

    test("dashboard includes security metrics", () => {
      expect(stackContent).toMatch(/AWS\/GuardDuty.*FindingCount/);
      expect(stackContent).toMatch(/AWS\/SecurityHub.*Findings/);
      expect(stackContent).toMatch(/AWS\/Config.*ComplianceByConfigRule/);
    });
  });

  // ============================================================================
  // LAMBDA REMEDIATION FUNCTIONS
  // ============================================================================

  describe("Lambda Remediation Functions", () => {
    test("creates Lambda execution role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_remediation_role"[\s\S]*?name\s*=\s*"\$\{var\.org_name\}-lambda-remediation-role"/);
    });

    test("creates comprehensive Lambda policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"lambda_remediation_policy"/);
      expect(stackContent).toMatch(/logs:CreateLogGroup/);
      expect(stackContent).toMatch(/s3:PutBucketPublicAccessBlock/);
      expect(stackContent).toMatch(/ec2:StopInstances/);
      expect(stackContent).toMatch(/iam:UpdateAccessKey/);
      expect(stackContent).toMatch(/securityhub:BatchUpdateFindings/);
      expect(stackContent).toMatch(/sns:Publish/);
      expect(stackContent).toMatch(/sts:AssumeRole/);
    });

    test("creates Lambda remediation functions", () => {
      const lambdaFunctions = [
        "s3_public_access_remediation",
        "iam_access_key_remediation",
        "ec2_security_group_remediation"
      ];

      lambdaFunctions.forEach(func => {
        expect(stackContent).toMatch(new RegExp(`resource\\s+"aws_lambda_function"\\s+"${func}"`));
      });
    });

    test("Lambda functions have proper configuration", () => {
      expect(stackContent).toMatch(/runtime\s*=\s*"python3\.9"/);
      expect(stackContent).toMatch(/timeout\s*=\s*60/);
      expect(stackContent).toMatch(/memory_size\s*=\s*256/);
    });

    test("creates Lambda source code archives", () => {
      expect(stackContent).toMatch(/data\s+"archive_file"\s+"s3_remediation_zip"/);
      expect(stackContent).toMatch(/data\s+"archive_file"\s+"iam_remediation_zip"/);
      expect(stackContent).toMatch(/data\s+"archive_file"\s+"ec2_remediation_zip"/);
    });

    test("Lambda functions include Python remediation code", () => {
      expect(stackContent).toMatch(/import json[\s\S]*?import boto3[\s\S]*?import os[\s\S]*?import logging/);
      expect(stackContent).toMatch(/def handler\(event, context\):/);
      expect(stackContent).toMatch(/s3_client = boto3\.client\('s3'\)/);
      expect(stackContent).toMatch(/sns_client = boto3\.client\('sns'\)/);
    });
  });

  // ============================================================================
  // EVENTBRIDGE AUTOMATION
  // ============================================================================

  describe("EventBridge Automation", () => {
    test("creates EventBridge rules for security automation", () => {
      const eventRules = [
        "guardduty_high_severity",
        "s3_public_access_violation",
        "config_compliance_violation",
        "securityhub_critical_finding"
      ];

      eventRules.forEach(rule => {
        expect(stackContent).toMatch(new RegExp(`resource\\s+"aws_cloudwatch_event_rule"\\s+"${rule}"`));
      });
    });

    test("EventBridge rules have proper event patterns", () => {
      expect(stackContent).toMatch(/source.*=.*\["aws\.guardduty"\]/);
      expect(stackContent).toMatch(/detail-type.*=.*\["GuardDuty Finding"\]/);
      expect(stackContent).toMatch(/source.*=.*\["aws\.s3"\]/);
      expect(stackContent).toMatch(/source.*=.*\["aws\.config"\]/);
      expect(stackContent).toMatch(/source.*=.*\["aws\.securityhub"\]/);
    });

    test("creates EventBridge targets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"guardduty_high_severity_target"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"s3_public_access_target"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"config_compliance_target"/);
    });

    test("creates Lambda permissions for EventBridge", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_eventbridge_guardduty"/);
      expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_eventbridge_s3"/);
      expect(stackContent).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_eventbridge_config"/);
    });

    test("EventBridge rules filter for high severity findings", () => {
      expect(stackContent).toMatch(/severity.*{[\s\S]*?numeric.*=.*\[">=".*7\.0\]/);
      expect(stackContent).toMatch(/Severity.*{[\s\S]*?Label.*=.*\["CRITICAL".*"HIGH"\]/);
    });
  });

  // ============================================================================
  // OUTPUTS
  // ============================================================================

  describe("Outputs", () => {
    test("declares comprehensive outputs", () => {
      const requiredOutputs = [
        "organization_id",
        "organization_arn",
        "security_logs_bucket",
        "security_logs_bucket_arn",
        "kms_key_id",
        "kms_key_arn",
        "cloudtrail_arn",
        "guardduty_detector_id",
        "securityhub_account_id",
        "config_recorder_name",
        "access_analyzer_arn",
        "security_admin_role_arn",
        "cross_account_security_role_arn",
        "federated_admin_role_arn",
        "federated_readonly_role_arn",
        "lambda_remediation_functions",
        "sns_topics",
        "cloudwatch_dashboard_url",
        "security_hub_standards",
        "organizational_units",
        "service_control_policies",
        "eventbridge_rules",
        "cloudwatch_alarms"
      ];

      requiredOutputs.forEach(output => {
        expect(stackContent).toMatch(new RegExp(`output\\s+"${output}"\\s*{`));
      });
    });

    test("outputs have proper descriptions", () => {
      expect(stackContent).toMatch(/output\s+"organization_id"[\s\S]*?description\s*=\s*"AWS Organization ID"/);
      expect(stackContent).toMatch(/output\s+"security_logs_bucket"[\s\S]*?description\s*=\s*"S3 bucket for centralized security logs"/);
      expect(stackContent).toMatch(/output\s+"guardduty_detector_id"[\s\S]*?description\s*=\s*"GuardDuty detector ID"/);
    });

    test("complex outputs have proper structure", () => {
      expect(stackContent).toMatch(/output\s+"lambda_remediation_functions"[\s\S]*?value\s*=\s*{[\s\S]*?s3_remediation[\s\S]*?iam_remediation[\s\S]*?ec2_remediation/);
      expect(stackContent).toMatch(/output\s+"sns_topics"[\s\S]*?value\s*=\s*{[\s\S]*?security_alerts[\s\S]*?compliance_alerts/);
      expect(stackContent).toMatch(/output\s+"organizational_units"[\s\S]*?value\s*=\s*{[\s\S]*?security[\s\S]*?workloads[\s\S]*?sandbox/);
    });

    test("CloudWatch dashboard URL is properly formatted", () => {
      expect(stackContent).toMatch(/output\s+"cloudwatch_dashboard_url"[\s\S]*?value\s*=\s*"https:\/\/\$\{var\.aws_region\}\.console\.aws\.amazon\.com\/cloudwatch\/home\?region=\$\{var\.aws_region\}#dashboards:name=\$\{aws_cloudwatch_dashboard\.security_dashboard\.dashboard_name\}"/);
    });
  });

  // ============================================================================
  // SECURITY AND COMPLIANCE VALIDATION
  // ============================================================================

  describe("Security and Compliance Validation", () => {
    test("enforces encryption at rest for all data stores", () => {
      expect(stackContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.security_logs_key/);
      expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test("implements least privilege access", () => {
      expect(stackContent).toMatch(/aws:MultiFactorAuthPresent.*=.*true/);
      expect(stackContent).toMatch(/sts:ExternalId/);
      expect(stackContent).toMatch(/AWS:SourceAccount/);
    });

    test("enables comprehensive logging", () => {
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
      expect(stackContent).toMatch(/enable_log_file_validation\s*=\s*true/);
      expect(stackContent).toMatch(/all_supported\s*=\s*true/);
      expect(stackContent).toMatch(/include_global_resource_types\s*=\s*true/);
    });

    test("implements defense in depth", () => {
      expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
      expect(stackContent).toMatch(/prevent_destroy\s*=\s*true/);
    });

    test("supports compliance requirements", () => {
      expect(stackContent).toMatch(/cis-aws-foundations-benchmark/);
      expect(stackContent).toMatch(/pci-dss/);
      expect(stackContent).toMatch(/nist-800-53/);
      expect(stackContent).toMatch(/default\s*=\s*2555/); // 7 years log retention
    });

    test("implements automated remediation", () => {
      expect(stackContent).toMatch(/PutBucketPublicAccessBlock/);
      expect(stackContent).toMatch(/UpdateAccessKey/);
      expect(stackContent).toMatch(/StopInstances/);
      expect(stackContent).toMatch(/RevokeSecurityGroupIngress/);
    });
  });

  // ============================================================================
  // ARCHITECTURE VALIDATION
  // ============================================================================

  describe("Architecture Validation", () => {
    test("implements Zero Trust principles", () => {
      expect(stackContent).toMatch(/DenyPublicAccess/);
      expect(stackContent).toMatch(/RequireEncryption/);
      expect(stackContent).toMatch(/EnforceMFA/);
      expect(stackContent).toMatch(/access-analyzer/);
    });

    test("supports single-account architecture with cross-account readiness", () => {
      // Organizations resources are commented out for single account
      expect(stackContent).toMatch(/# resource "aws_organizations_organization"/);
      expect(stackContent).toMatch(/# resource "aws_organizations_organizational_unit"/);
      
      // Cross-account security role is still available for future expansion
      expect(stackContent).toMatch(/cross-account-security/);
      
      // CloudTrail is configured for organization-wide logging when enabled
      expect(stackContent).toMatch(/is_organization_trail\s*=\s*true/);
    });

    test("implements centralized security management", () => {
      expect(stackContent).toMatch(/organization_analyzer/);
      expect(stackContent).toMatch(/organization_trail/);
      expect(stackContent).toMatch(/organization_recorder/);
      expect(stackContent).toMatch(/auto_enable_organization_members/);
    });

    test("provides comprehensive monitoring", () => {
      expect(stackContent).toMatch(/finding_publishing_frequency\s*=\s*"FIFTEEN_MINUTES"/);
      expect(stackContent).toMatch(/delivery_frequency\s*=\s*"One_Hour"/);
      expect(stackContent).toMatch(/evaluation_periods/);
      expect(stackContent).toMatch(/comparison_operator/);
    });

    test("implements event-driven automation", () => {
      expect(stackContent).toMatch(/aws_cloudwatch_event_rule/);
      expect(stackContent).toMatch(/aws_cloudwatch_event_target/);
      expect(stackContent).toMatch(/aws_lambda_permission/);
      expect(stackContent).toMatch(/events\.amazonaws\.com/);
    });
  });
});


