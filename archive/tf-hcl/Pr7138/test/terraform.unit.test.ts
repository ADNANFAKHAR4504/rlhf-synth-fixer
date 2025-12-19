// terraform.unit.test.ts
// Comprehensive unit tests for Multi-Account AWS Security Framework Terraform Stack
// Tests validate structure, configuration, and compliance without executing Terraform

import * as fs from 'fs';
import * as path from 'path';

// File paths - dynamically resolved
const MAIN_PATH = path.resolve(__dirname, '../lib/main.tf');
const VARIABLES_PATH = path.resolve(__dirname, '../lib/variables.tf');
const OUTPUTS_PATH = path.resolve(__dirname, '../lib/outputs.tf');
const PROVIDERS_PATH = path.resolve(__dirname, '../lib/providers.tf');
const IAM_PATH = path.resolve(__dirname, '../lib/iam.tf');
const KMS_PATH = path.resolve(__dirname, '../lib/kms.tf');
const CLOUDWATCH_PATH = path.resolve(__dirname, '../lib/cloudwatch.tf');
const CONFIG_PATH = path.resolve(__dirname, '../lib/config.tf');
const SCP_PATH = path.resolve(__dirname, '../lib/scp.tf');

// Helper functions
const readFileContent = (filePath: string): string => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
};

const hasResource = (content: string, resourceType: string, resourceName: string): boolean => {
  const regex = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"`);
  return regex.test(content);
};

const hasDataSource = (content: string, dataType: string, dataName: string): boolean => {
  const regex = new RegExp(`data\\s+"${dataType}"\\s+"${dataName}"`);
  return regex.test(content);
};

const hasVariable = (content: string, variableName: string): boolean => {
  const regex = new RegExp(`variable\\s+"${variableName}"`);
  return regex.test(content);
};

const hasOutput = (content: string, outputName: string): boolean => {
  const regex = new RegExp(`output\\s+"${outputName}"`);
  return regex.test(content);
};

const hasResourceAttribute = (content: string, resourceType: string, resourceName: string, attribute: string): boolean => {
  // Match both simple attributes (attribute = value) and nested blocks (attribute { ... })
  const resourceRegex = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"[\\s\\S]*?${attribute}\\s*[={]`, 's');
  return resourceRegex.test(content);
};

const countResourceOccurrences = (content: string, resourceType: string): number => {
  const regex = new RegExp(`resource\\s+"${resourceType}"\\s+"[^"]+"`, 'g');
  const matches = content.match(regex);
  return matches ? matches.length : 0;
};

const hasTagging = (content: string, resourceType: string, resourceName: string): boolean => {
  const tagsRegex = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"[\\s\\S]*?tags\\s*=`, 's');
  return tagsRegex.test(content);
};

describe('Multi-Account AWS Security Framework - Unit Tests', () => {
  let mainContent: string;
  let variablesContent: string;
  let outputsContent: string;
  let providersContent: string;
  let iamContent: string;
  let kmsContent: string;
  let cloudwatchContent: string;
  let configContent: string;
  let scpContent: string;

  beforeAll(() => {
    mainContent = readFileContent(MAIN_PATH);
    variablesContent = readFileContent(VARIABLES_PATH);
    outputsContent = readFileContent(OUTPUTS_PATH);
    providersContent = readFileContent(PROVIDERS_PATH);
    iamContent = readFileContent(IAM_PATH);
    kmsContent = readFileContent(KMS_PATH);
    cloudwatchContent = readFileContent(CLOUDWATCH_PATH);
    configContent = readFileContent(CONFIG_PATH);
    scpContent = readFileContent(SCP_PATH);
  });

  describe('File Structure and Existence', () => {
    test('all required Terraform files exist', () => {
      expect(fs.existsSync(MAIN_PATH)).toBe(true);
      expect(fs.existsSync(VARIABLES_PATH)).toBe(true);
      expect(fs.existsSync(OUTPUTS_PATH)).toBe(true);
      expect(fs.existsSync(PROVIDERS_PATH)).toBe(true);
      expect(fs.existsSync(IAM_PATH)).toBe(true);
      expect(fs.existsSync(KMS_PATH)).toBe(true);
      expect(fs.existsSync(CLOUDWATCH_PATH)).toBe(true);
      expect(fs.existsSync(CONFIG_PATH)).toBe(true);
      expect(fs.existsSync(SCP_PATH)).toBe(true);
    });

    test('main.tf contains comprehensive infrastructure', () => {
      expect(mainContent.length).toBeGreaterThan(1000);
    });

    test('variables.tf contains required variable definitions', () => {
      expect(variablesContent.length).toBeGreaterThan(500);
    });

    test('outputs.tf contains comprehensive output definitions', () => {
      expect(outputsContent.length).toBeGreaterThan(1000);
    });
  });

  describe('Provider Configuration', () => {
    test('declares Terraform version constraint', () => {
      expect(providersContent).toMatch(/required_version\s*=\s*">=\s*1\.\d+/);
    });

    test('has S3 backend configuration', () => {
      expect(providersContent).toMatch(/backend\s+"s3"/);
    });

    test('has primary and secondary AWS providers', () => {
      expect(providersContent).toMatch(/provider\s+"aws"\s*{[\s\\S]*?alias\s*=\s*"primary"/s);
      expect(providersContent).toMatch(/provider\s+"aws"\s*{[\s\\S]*?alias\s*=\s*"secondary"/s);
    });

    test('providers use default tags configuration', () => {
      expect(providersContent).toMatch(/default_tags\s*{[\s\\S]*?tags\s*=\s*merge\(/s);
    });
  });

  describe('Required Variables Declaration', () => {
    const requiredVariables = [
      'environment_suffix',
      'primary_region',
      'secondary_region',
      'organization_name',
      'trusted_account_ids',
      'tags'
    ];

    test.each(requiredVariables)('declares variable %s', (variableName) => {
      expect(hasVariable(variablesContent, variableName)).toBe(true);
    });


    test('secondary_region variable defaults to us-west-2', () => {
      expect(variablesContent).toMatch(/variable\s+"secondary_region"/);
      expect(variablesContent).toMatch(/default\s*=\s*"us-west-2"/);
    });

    test('kms_key_rotation_days has validation', () => {
      expect(variablesContent).toMatch(/variable\s+"kms_key_rotation_days"/);
      expect(variablesContent).toMatch(/validation\s*{/);
    });

    test('cloudwatch_log_retention_days has validation', () => {
      expect(variablesContent).toMatch(/variable\s+"cloudwatch_log_retention_days"/);
      expect(variablesContent).toMatch(/validation\s*{/);
    });
  });

  describe('AWS Organizations Configuration', () => {
    test('declares AWS Organizations resource', () => {
      expect(hasResource(mainContent, 'aws_organizations_organization', 'main')).toBe(true);
    });

    test('organizations has feature_set ALL', () => {
      expect(mainContent).toMatch(/resource\s+"aws_organizations_organization"\s+"main"/);
      expect(mainContent).toMatch(/feature_set\s*=\s*"ALL"/);
    });

    test('organizations enables SERVICE_CONTROL_POLICY', () => {
      expect(mainContent).toMatch(/enabled_policy_types/);
      expect(mainContent).toMatch(/"SERVICE_CONTROL_POLICY"/);
    });

    test('organizations enables required service access principals', () => {
      expect(mainContent).toMatch(/aws_service_access_principals/);
      expect(mainContent).toMatch(/"config.amazonaws.com"/);
      expect(mainContent).toMatch(/"cloudtrail.amazonaws.com"/);
      expect(mainContent).toMatch(/"kms.amazonaws.com"/);
    });

    test('declares organizational units for Security, Production, Development', () => {
      expect(hasResource(mainContent, 'aws_organizations_organizational_unit', 'security')).toBe(true);
      expect(hasResource(mainContent, 'aws_organizations_organizational_unit', 'production')).toBe(true);
      expect(hasResource(mainContent, 'aws_organizations_organizational_unit', 'development')).toBe(true);
    });

    test('organizational units use environment_suffix in naming', () => {
      expect(mainContent).toMatch(/Name\s*=\s*"security-ou-\${var\.environment_suffix}"/);
      expect(mainContent).toMatch(/Name\s*=\s*"production-ou-\${var\.environment_suffix}"/);
      expect(mainContent).toMatch(/Name\s*=\s*"development-ou-\${var\.environment_suffix}"/);
    });

    test('declares data source for organizations root', () => {
      expect(hasDataSource(mainContent, 'aws_organizations_organization', 'root')).toBe(true);
    });
  });

  describe('CloudTrail Configuration', () => {
    test('declares CloudTrail resource with conditional creation', () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudtrail"\s+"organization"\s*{[\s\\S]*?count\s*=\s*var\.enable_cloudtrail/s);
    });

    test('CloudTrail is configured as organization trail', () => {
      expect(mainContent).toMatch(/is_organization_trail\s*=\s*true/);
    });

    test('CloudTrail is configured as multi-region trail', () => {
      expect(mainContent).toMatch(/is_multi_region_trail\s*=\s*true/);
    });

    test('CloudTrail includes global service events', () => {
      expect(mainContent).toMatch(/include_global_service_events\s*=\s*true/);
    });

    test('CloudTrail has log file validation enabled', () => {
      expect(mainContent).toMatch(/enable_log_file_validation\s*=\s*true/);
    });

    test('CloudTrail uses KMS key for encryption', () => {
      expect(mainContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.primary\.arn/);
    });

    test('declares S3 bucket for CloudTrail logs', () => {
      expect(hasResource(mainContent, 'aws_s3_bucket', 'cloudtrail')).toBe(true);
    });

    test('CloudTrail bucket uses environment_suffix in naming', () => {
      expect(mainContent).toMatch(/bucket\s*=\s*"cloudtrail-logs-\${var\.environment_suffix}/);
    });

    test('CloudTrail bucket has public access blocked', () => {
      expect(hasResource(mainContent, 'aws_s3_bucket_public_access_block', 'cloudtrail')).toBe(true);
    });

    test('CloudTrail bucket has versioning enabled', () => {
      expect(hasResource(mainContent, 'aws_s3_bucket_versioning', 'cloudtrail')).toBe(true);
    });

    test('CloudTrail bucket has encryption configured', () => {
      expect(hasResource(mainContent, 'aws_s3_bucket_server_side_encryption_configuration', 'cloudtrail')).toBe(true);
    });

    test('CloudTrail bucket uses KMS encryption', () => {
      expect(mainContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      expect(mainContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.primary\.arn/);
    });

    test('CloudTrail bucket has policy for CloudTrail service', () => {
      expect(hasResource(mainContent, 'aws_s3_bucket_policy', 'cloudtrail')).toBe(true);
    });
  });

  describe('KMS Key Management', () => {
    test('declares primary KMS key', () => {
      expect(hasResource(kmsContent, 'aws_kms_key', 'primary')).toBe(true);
    });

    test('primary KMS key uses primary provider', () => {
      expect(kmsContent).toMatch(/provider\s*=\s*aws\.primary/);
    });

    test('primary KMS key has rotation enabled', () => {
      expect(hasResourceAttribute(kmsContent, 'aws_kms_key', 'primary', 'enable_key_rotation')).toBe(true);
    });

    test('primary KMS key uses variable for rotation period', () => {
      expect(kmsContent).toMatch(/rotation_period_in_days\s*=\s*var\.kms_key_rotation_days/);
    });

    test('declares primary KMS key alias', () => {
      expect(hasResource(kmsContent, 'aws_kms_alias', 'primary')).toBe(true);
    });

    test('primary KMS alias uses environment_suffix', () => {
      expect(kmsContent).toMatch(/name\s*=\s*"alias\/security-primary-\${var\.environment_suffix}"/);
    });

    test('declares KMS key policy for primary key', () => {
      expect(hasResource(kmsContent, 'aws_kms_key_policy', 'primary')).toBe(true);
    });

    test('declares secondary (replica) KMS key', () => {
      expect(hasResource(kmsContent, 'aws_kms_replica_key', 'secondary')).toBe(true);
    });

    test('secondary KMS key uses secondary provider', () => {
      expect(kmsContent).toMatch(/provider\s*=\s*aws\.secondary/);
    });

    test('secondary KMS key references primary key ARN', () => {
      expect(kmsContent).toMatch(/primary_key_arn\s*=\s*aws_kms_key\.primary\.arn/);
    });

    test('declares secondary KMS key alias', () => {
      expect(hasResource(kmsContent, 'aws_kms_alias', 'secondary')).toBe(true);
    });
  });

  describe('IAM Cross-Account Roles', () => {
    test('declares cross-account security role', () => {
      expect(hasResource(iamContent, 'aws_iam_role', 'cross_account_security')).toBe(true);
    });

    test('declares cross-account operations role', () => {
      expect(hasResource(iamContent, 'aws_iam_role', 'cross_account_operations')).toBe(true);
    });

    test('declares cross-account developer role', () => {
      expect(hasResource(iamContent, 'aws_iam_role', 'cross_account_developer')).toBe(true);
    });

    test('security role uses environment_suffix in name', () => {
      expect(iamContent).toMatch(/name\s*=\s*"cross-account-security-role-\${var\.environment_suffix}"/);
    });

    test('security role assume policy requires MFA', () => {
      expect(iamContent).toMatch(/variable\s*=\s*"aws:MultiFactorAuthPresent"/);
      expect(iamContent).toMatch(/values\s*=\s*\["true"\]/);
    });

    test('security role has deny statement for non-MFA access', () => {
      expect(iamContent).toMatch(/effect\s*=\s*"Deny"/);
    });

    test('security role has inline policy', () => {
      expect(hasResource(iamContent, 'aws_iam_role_policy', 'cross_account_security')).toBe(true);
    });

    test('security role policy denies dangerous actions', () => {
      expect(iamContent).toMatch(/kms:ScheduleKeyDeletion/);
      expect(iamContent).toMatch(/kms:DisableKey/);
    });
  });

  describe('CloudWatch Logs Configuration', () => {
    test('declares central CloudWatch log group', () => {
      expect(hasResource(cloudwatchContent, 'aws_cloudwatch_log_group', 'central')).toBe(true);
    });

    test('central log group uses environment_suffix', () => {
      expect(cloudwatchContent).toMatch(/name\s*=\s*"\/aws\/security\/central-logs-\${var\.environment_suffix}"/);
    });

    test('central log group uses variable for retention', () => {
      expect(cloudwatchContent).toMatch(/retention_in_days\s*=\s*var\.cloudwatch_log_retention_days/);
    });

    test('central log group uses KMS encryption', () => {
      expect(cloudwatchContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.primary\.arn/);
    });

    test('declares CloudWatch log resource policy for cross-account access', () => {
      expect(hasResource(cloudwatchContent, 'aws_cloudwatch_log_resource_policy', 'cross_account')).toBe(true);
    });

    test('declares multiple log groups for different services', () => {
      expect(hasResource(cloudwatchContent, 'aws_cloudwatch_log_group', 'organizations')).toBe(true);
      expect(hasResource(cloudwatchContent, 'aws_cloudwatch_log_group', 'config')).toBe(true);
      expect(hasResource(cloudwatchContent, 'aws_cloudwatch_log_group', 'iam_activity')).toBe(true);
      expect(hasResource(cloudwatchContent, 'aws_cloudwatch_log_group', 'cloudtrail')).toBe(true);
    });

    test('declares CloudWatch metric filters', () => {
      const metricFilterCount = countResourceOccurrences(cloudwatchContent, 'aws_cloudwatch_log_metric_filter');
      expect(metricFilterCount).toBeGreaterThan(0);
    });

    test('declares CloudWatch alarms', () => {
      const alarmCount = countResourceOccurrences(cloudwatchContent, 'aws_cloudwatch_metric_alarm');
      expect(alarmCount).toBeGreaterThan(0);
    });
  });

  describe('AWS Config Configuration', () => {
    test('declares Config configuration recorder with conditional creation', () => {
      expect(configContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"\s*{[\s\\S]*?count\s*=\s*var\.enable_config/s);
    });

    test('Config recorder uses environment_suffix in name', () => {
      expect(configContent).toMatch(/name\s*=\s*"config-recorder-\${var\.environment_suffix}"/);
    });

    test('declares Config recorder status', () => {
      expect(hasResource(configContent, 'aws_config_configuration_recorder_status', 'main')).toBe(true);
    });

    test('Config recorder status is enabled', () => {
      expect(configContent).toMatch(/is_enabled\s*=\s*true/);
    });

    test('declares Config delivery channel', () => {
      expect(hasResource(configContent, 'aws_config_delivery_channel', 'main')).toBe(true);
    });

    test('declares S3 bucket for Config', () => {
      // Config bucket is in iam.tf, not config.tf
      expect(hasResource(iamContent, 'aws_s3_bucket', 'config_bucket')).toBe(true);
    });

    test('declares SNS topic for Config notifications', () => {
      expect(hasResource(configContent, 'aws_sns_topic', 'config_notifications')).toBe(true);
    });

    test('declares Config rules', () => {
      expect(hasResource(configContent, 'aws_config_config_rule', 's3_encryption')).toBe(true);
      expect(hasResource(configContent, 'aws_config_config_rule', 'encrypted_volumes')).toBe(true);
      expect(hasResource(configContent, 'aws_config_config_rule', 'rds_encryption')).toBe(true);
      expect(hasResource(configContent, 'aws_config_config_rule', 'root_account_mfa')).toBe(true);
      expect(hasResource(configContent, 'aws_config_config_rule', 'iam_admin_access')).toBe(true);
      expect(hasResource(configContent, 'aws_config_config_rule', 'cloudtrail_enabled')).toBe(true);
      expect(hasResource(configContent, 'aws_config_config_rule', 'config_enabled')).toBe(true);
    });

    test('Config rules use AWS managed rules', () => {
      expect(configContent).toMatch(/owner\s*=\s*"AWS"/);
      expect(configContent).toMatch(/source_identifier\s*=\s*"S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"/);
    });

    test('declares Config conformance pack', () => {
      expect(hasResource(configContent, 'aws_config_conformance_pack', 'security')).toBe(true);
    });
  });

  describe('Service Control Policies', () => {
    test('declares S3 encryption SCP', () => {
      expect(hasResource(scpContent, 'aws_organizations_policy', 's3_encryption')).toBe(true);
    });

    test('declares EBS encryption SCP', () => {
      expect(hasResource(scpContent, 'aws_organizations_policy', 'ebs_encryption')).toBe(true);
    });

    test('declares RDS encryption SCP', () => {
      expect(hasResource(scpContent, 'aws_organizations_policy', 'rds_encryption')).toBe(true);
    });

    test('declares KMS protection SCP', () => {
      expect(hasResource(scpContent, 'aws_organizations_policy', 'kms_protection')).toBe(true);
    });

    test('SCPs use SERVICE_CONTROL_POLICY type', () => {
      expect(scpContent).toMatch(/type\s*=\s*"SERVICE_CONTROL_POLICY"/);
    });

    test('S3 encryption SCP denies unencrypted uploads', () => {
      expect(scpContent).toMatch(/DenyUnencryptedS3Uploads/);
      expect(scpContent).toMatch(/s3:PutObject/);
    });

    test('EBS encryption SCP denies unencrypted volumes', () => {
      expect(scpContent).toMatch(/DenyUnencryptedEBSVolumes/);
      expect(scpContent).toMatch(/ec2:RunInstances/);
    });
  });

  describe('Required Outputs', () => {
    const requiredOutputs = [
      'organization_id',
      'organization_arn',
      'security_ou_id',
      'production_ou_id',
      'development_ou_id',
      'primary_kms_key_arn',
      'secondary_kms_key_arn',
      'cross_account_security_role_arn',
      'cross_account_operations_role_arn',
      'cross_account_developer_role_arn',
      'cloudtrail_bucket_name',
      'config_bucket_name',
      'central_logs_group_name',
      'environment_suffix'
    ];

    test.each(requiredOutputs)('declares output %s', (outputName) => {
      expect(hasOutput(outputsContent, outputName)).toBe(true);
    });

    test('outputs have proper descriptions', () => {
      expect(outputsContent).toMatch(/description\s*=\s*"[^"]+"/);
    });

    test('sensitive outputs are marked as sensitive', () => {
      // Check that primary_kms_key_id output exists and has sensitive = true
      const primaryKeyOutputMatch = outputsContent.match(/output\s+"primary_kms_key_id"\s*{[\s\S]*?}/);
      expect(primaryKeyOutputMatch).toBeTruthy();
      expect(primaryKeyOutputMatch![0]).toMatch(/sensitive\s*=\s*true/);

      // Check that secondary_kms_key_id output exists and has sensitive = true
      const secondaryKeyOutputMatch = outputsContent.match(/output\s+"secondary_kms_key_id"\s*{[\s\S]*?}/);
      expect(secondaryKeyOutputMatch).toBeTruthy();
      expect(secondaryKeyOutputMatch![0]).toMatch(/sensitive\s*=\s*true/);
    });
  });

  describe('Resource Tagging and Naming', () => {
    test('resources use merge function for common tags', () => {
      expect(mainContent).toMatch(/tags\s*=\s*merge\(/);
      expect(iamContent).toMatch(/tags\s*=\s*merge\(/);
      expect(kmsContent).toMatch(/tags\s*=\s*merge\(/);
    });

    test('resources use environment_suffix in naming', () => {
      expect(mainContent).toMatch(/\${var\.environment_suffix}/);
      expect(iamContent).toMatch(/\${var\.environment_suffix}/);
      expect(kmsContent).toMatch(/\${var\.environment_suffix}/);
    });

    test('no hardcoded environment values in resource names', () => {
      const allContent = mainContent + iamContent + kmsContent + cloudwatchContent + configContent;
      expect(allContent).not.toMatch(/"security-ou-prod"|"security-ou-dev"/);
    });
  });

  describe('Security and Compliance', () => {
    test('S3 buckets have encryption enabled', () => {
      expect(mainContent).toMatch(/apply_server_side_encryption_by_default/);
    });

    test('S3 buckets block public access', () => {
      expect(mainContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(mainContent).toMatch(/block_public_policy\s*=\s*true/);
    });

    test('KMS keys have rotation enabled', () => {
      expect(kmsContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('IAM roles have explicit deny policies', () => {
      expect(iamContent).toMatch(/effect\s*=\s*"Deny"/);
    });

    test('CloudWatch logs use KMS encryption', () => {
      expect(cloudwatchContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.primary\.arn/);
    });
  });

  describe('Data Sources', () => {
    test('declares AWS caller identity data source', () => {
      expect(hasDataSource(mainContent, 'aws_caller_identity', 'current')).toBe(true);
    });

    test('declares AWS regions data source', () => {
      expect(hasDataSource(mainContent, 'aws_regions', 'available')).toBe(true);
    });
  });
});

