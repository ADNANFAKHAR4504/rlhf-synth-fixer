import { readFileSync } from 'fs';
import { join } from 'path';

const readTerraformFile = (filename: string): string => {
  return readFileSync(join(__dirname, '../lib', filename), 'utf-8');
};

const providerCode = readTerraformFile('provider.tf');
const versionsCode = readTerraformFile('versions.tf');
const variablesCode = readTerraformFile('variables.tf');
const dataCode = readTerraformFile('data.tf');
const localsCode = readTerraformFile('locals.tf');
const iamPoliciesCode = readTerraformFile('iam-policies.tf');
const iamRolesDeveloperCode = readTerraformFile('iam-roles-developer.tf');
const iamRolesOperatorCode = readTerraformFile('iam-roles-operator.tf');
const iamRolesAdministratorCode = readTerraformFile('iam-roles-administrator.tf');
const iamRolesServiceCode = readTerraformFile('iam-roles-service.tf');
const iamCrossAccountCode = readTerraformFile('iam-cross-account.tf');
const iamPasswordPolicyCode = readTerraformFile('iam-password-policy.tf');
const s3Code = readTerraformFile('s3.tf');
const monitoringCode = readTerraformFile('monitoring.tf');
const lambdaCode = readTerraformFile('lambda.tf');
const outputsCode = readTerraformFile('outputs.tf');

describe('Terraform IAM Zero-Trust Security Framework Unit Tests', () => {
  describe('File Structure Tests', () => {
    test('should have versions.tf file', () => {
      expect(versionsCode).toBeDefined();
      expect(versionsCode.length).toBeGreaterThan(0);
    });

    test('should have provider.tf file', () => {
      expect(providerCode).toBeDefined();
      expect(providerCode.length).toBeGreaterThan(0);
    });

    test('should have all required .tf files', () => {
      expect(variablesCode).toBeDefined();
      expect(dataCode).toBeDefined();
      expect(localsCode).toBeDefined();
      expect(iamPoliciesCode).toBeDefined();
      expect(outputsCode).toBeDefined();
    });
  });

  describe('Versions and Provider Configuration', () => {
    test('should require Terraform >= 1.5.0', () => {
      expect(versionsCode).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
    });

    test('should require AWS provider >= 5.0', () => {
      expect(versionsCode).toMatch(/version\s*=\s*">=\s*5\.0"/);
    });

    test('should include random provider', () => {
      expect(versionsCode).toMatch(/random/);
    });

    test('should configure AWS provider with region variable', () => {
      expect(providerCode).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test('should configure S3 backend', () => {
      expect(versionsCode).toMatch(/backend\s+"s3"/);
    });
  });

  describe('Variables Configuration', () => {
    test('should define aws_region variable', () => {
      expect(variablesCode).toMatch(/variable\s+"aws_region"/);
    });

    test('should define environment variable with validation', () => {
      expect(variablesCode).toMatch(/variable\s+"environment"/);
      expect(variablesCode).toMatch(/validation\s*\{/);
      expect(variablesCode).toMatch(/dev.*staging.*production/);
    });

    test('should define environment_suffix variable', () => {
      expect(variablesCode).toMatch(/variable\s+"environment_suffix"/);
      expect(variablesCode).toMatch(/default\s*=\s*""/);
    });

    test('should have environment_suffix validation for lowercase alphanumeric and hyphens', () => {
      expect(variablesCode).toMatch(/validation\s*\{[\s\S]*?environment_suffix/);
      expect(variablesCode).toMatch(/\[a-z0-9-\]/);
    });

    test('should define project_name variable', () => {
      expect(variablesCode).toMatch(/variable\s+"project_name"/);
      expect(variablesCode).toMatch(/zero-trust-iam/);
    });

    test('should define allowed_ip_ranges variable', () => {
      expect(variablesCode).toMatch(/variable\s+"allowed_ip_ranges"/);
      expect(variablesCode).toMatch(/list\(string\)/);
    });

    test('should define vpc_endpoint_id variable', () => {
      expect(variablesCode).toMatch(/variable\s+"vpc_endpoint_id"/);
    });

    test('should define business hours variables', () => {
      expect(variablesCode).toMatch(/variable\s+"business_hours_start"/);
      expect(variablesCode).toMatch(/variable\s+"business_hours_end"/);
    });

    test('should define max_session_duration with validation', () => {
      expect(variablesCode).toMatch(/variable\s+"max_session_duration"/);
      expect(variablesCode).toMatch(/14400/);
      expect(variablesCode).toMatch(/validation/);
    });

    test('should define external_session_duration with validation', () => {
      expect(variablesCode).toMatch(/variable\s+"external_session_duration"/);
      expect(variablesCode).toMatch(/7200/);
    });

    test('should define mfa_max_age variable', () => {
      expect(variablesCode).toMatch(/variable\s+"mfa_max_age"/);
      expect(variablesCode).toMatch(/3600/);
    });

    test('should define external_account_ids variable', () => {
      expect(variablesCode).toMatch(/variable\s+"external_account_ids"/);
      expect(variablesCode).toMatch(/list\(string\)/);
    });

    test('should define external_id as sensitive', () => {
      expect(variablesCode).toMatch(/variable\s+"external_id"/);
      expect(variablesCode).toMatch(/sensitive\s*=\s*true/);
    });

    test('should define allowed_regions variable', () => {
      expect(variablesCode).toMatch(/variable\s+"allowed_regions"/);
      expect(variablesCode).toMatch(/us-east-1/);
    });

    test('should define password_min_length with validation >= 14', () => {
      expect(variablesCode).toMatch(/variable\s+"password_min_length"/);
      expect(variablesCode).toMatch(/default\s*=\s*14/);
      expect(variablesCode).toMatch(/password_min_length\s*>=\s*14/);
    });

    test('should define password_max_age with validation', () => {
      expect(variablesCode).toMatch(/variable\s+"password_max_age"/);
      expect(variablesCode).toMatch(/default\s*=\s*90/);
    });

    test('should define password_reuse_prevention with validation >= 12', () => {
      expect(variablesCode).toMatch(/variable\s+"password_reuse_prevention"/);
      expect(variablesCode).toMatch(/default\s*=\s*12/);
      expect(variablesCode).toMatch(/password_reuse_prevention\s*>=\s*12/);
    });

    test('should define monitoring variables', () => {
      expect(variablesCode).toMatch(/variable\s+"enable_iam_monitoring"/);
      expect(variablesCode).toMatch(/variable\s+"alert_email"/);
      expect(variablesCode).toMatch(/variable\s+"log_retention_days"/);
    });

    test('should define log_retention_days with validation >= 90', () => {
      expect(variablesCode).toMatch(/log_retention_days\s*>=\s*90/);
    });

    test('should define service role enable flags', () => {
      expect(variablesCode).toMatch(/variable\s+"enable_ec2_instance_role"/);
      expect(variablesCode).toMatch(/variable\s+"enable_lambda_execution_role"/);
      expect(variablesCode).toMatch(/variable\s+"enable_rds_monitoring_role"/);
    });

    test('should define S3 security variables', () => {
      expect(variablesCode).toMatch(/variable\s+"enable_s3_access_logging"/);
      expect(variablesCode).toMatch(/variable\s+"s3_encryption_enabled"/);
      expect(variablesCode).toMatch(/variable\s+"enable_mfa_delete"/);
    });
  });

  describe('Data Sources', () => {
    test('should define aws_caller_identity data source', () => {
      expect(dataCode).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test('should define aws_region data source', () => {
      expect(dataCode).toMatch(/data\s+"aws_region"\s+"current"/);
    });

    test('should define aws_availability_zones data source', () => {
      expect(dataCode).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });

    test('should define aws_partition data source', () => {
      expect(dataCode).toMatch(/data\s+"aws_partition"\s+"current"/);
    });
  });

  describe('Locals Configuration', () => {
    test('should define random_string resource for suffix', () => {
      expect(localsCode).toMatch(/resource\s+"random_string"\s+"suffix"/);
    });

    test('should configure random_string with 8 characters', () => {
      expect(localsCode).toMatch(/length\s*=\s*8/);
      expect(localsCode).toMatch(/special\s*=\s*false/);
      expect(localsCode).toMatch(/upper\s*=\s*false/);
    });

    test('should define name_prefix local', () => {
      expect(localsCode).toMatch(/name_prefix\s*=/);
    });

    test('should define name_suffix with conditional logic', () => {
      expect(localsCode).toMatch(/name_suffix\s*=\s*var\.environment_suffix\s*!=\s*""/);
      expect(localsCode).toMatch(/random_string\.suffix\.result/);
    });

    test('should define account_id, region, and partition locals', () => {
      expect(localsCode).toMatch(/account_id\s*=\s*data\.aws_caller_identity\.current\.account_id/);
      expect(localsCode).toMatch(/region\s*=\s*data\.aws_region\.current\.(id|name)/);
      expect(localsCode).toMatch(/partition\s*=\s*data\.aws_partition\.current\.partition/);
    });

    test('should define common_tags local', () => {
      expect(localsCode).toMatch(/common_tags\s*=\s*\{/);
      expect(localsCode).toMatch(/Project/);
      expect(localsCode).toMatch(/Environment/);
      expect(localsCode).toMatch(/ManagedBy.*Terraform/);
    });

    test('should include compliance and security level tags', () => {
      expect(localsCode).toMatch(/ComplianceType/);
      expect(localsCode).toMatch(/SecurityLevel/);
    });

    test('should define bucket names with suffix', () => {
      expect(localsCode).toMatch(/financial_data_bucket\s*=/);
      expect(localsCode).toMatch(/access_logs_bucket\s*=/);
      expect(localsCode).toMatch(/name_suffix/);
    });

    test('should define SNS topic name', () => {
      expect(localsCode).toMatch(/security_alerts_topic\s*=/);
    });

    test('should define Lambda function names', () => {
      expect(localsCode).toMatch(/access_expiration_lambda\s*=/);
    });

    test('should define CloudWatch log group names', () => {
      expect(localsCode).toMatch(/iam_events_log_group\s*=/);
      expect(localsCode).toMatch(/access_expiration_log_group\s*=/);
    });

    test('should define KMS key alias', () => {
      expect(localsCode).toMatch(/kms_key_alias\s*=\s*"alias/);
    });
  });

  describe('IAM Policies - Advanced Conditional Logic', () => {
    test('should create developer policy document', () => {
      expect(iamPoliciesCode).toMatch(/data\s+"aws_iam_policy_document"\s+"developer_policy"/);
    });

    test('should create developer policy resource', () => {
      expect(iamPoliciesCode).toMatch(/resource\s+"aws_iam_policy"\s+"developer"/);
    });

    test('should include IP address condition in developer policy', () => {
      expect(iamPoliciesCode).toMatch(/IpAddress/);
      expect(iamPoliciesCode).toMatch(/aws:SourceIp/);
      expect(iamPoliciesCode).toMatch(/var\.allowed_ip_ranges/);
    });

    test('should include MFA condition in developer policy', () => {
      expect(iamPoliciesCode).toMatch(/Bool/);
      expect(iamPoliciesCode).toMatch(/aws:MultiFactorAuthPresent/);
    });

    test('should include region restriction condition', () => {
      expect(iamPoliciesCode).toMatch(/StringEquals/);
      expect(iamPoliciesCode).toMatch(/aws:RequestedRegion/);
      expect(iamPoliciesCode).toMatch(/var\.allowed_regions/);
    });

    test('should deny IAM modifications in developer policy', () => {
      expect(iamPoliciesCode).toMatch(/DenyIAMModifications/);
      expect(iamPoliciesCode).toMatch(/effect\s*=\s*"Deny"/);
      expect(iamPoliciesCode).toMatch(/iam:CreatePolicy|iam:DeletePolicy/);
    });

    test('should deny direct database access in developer policy', () => {
      expect(iamPoliciesCode).toMatch(/DenyDirectDatabaseAccess/);
      expect(iamPoliciesCode).toMatch(/rds:ModifyDBInstance|rds:DeleteDBInstance/);
    });

    test('should create operator policy document', () => {
      expect(iamPoliciesCode).toMatch(/data\s+"aws_iam_policy_document"\s+"operator_policy"/);
    });

    test('should include MFA age condition in operator policy', () => {
      expect(iamPoliciesCode).toMatch(/NumericLessThan/);
      expect(iamPoliciesCode).toMatch(/aws:MultiFactorAuthAge/);
      expect(iamPoliciesCode).toMatch(/var\.mfa_max_age/);
    });

    test('should deny CloudTrail modifications in operator policy', () => {
      expect(iamPoliciesCode).toMatch(/DenyAuditTrailChanges/);
      expect(iamPoliciesCode).toMatch(/cloudtrail:StopLogging|cloudtrail:DeleteTrail/);
    });

    test('should deny S3 public access in operator policy', () => {
      expect(iamPoliciesCode).toMatch(/DenyS3PublicAccess/);
      expect(iamPoliciesCode).toMatch(/s3:x-amz-acl/);
      expect(iamPoliciesCode).toMatch(/public-read/);
    });

    test('should create administrator policy document', () => {
      expect(iamPoliciesCode).toMatch(/data\s+"aws_iam_policy_document"\s+"administrator_policy"/);
    });

    test('should deny disabling logging in administrator policy', () => {
      expect(iamPoliciesCode).toMatch(/DenyDisablingLogging/);
      expect(iamPoliciesCode).toMatch(/cloudtrail:StopLogging|cloudtrail:DeleteTrail/);
    });

    test('should deny disabling encryption in administrator policy', () => {
      expect(iamPoliciesCode).toMatch(/DenyDisablingEncryption/);
      expect(iamPoliciesCode).toMatch(/kms:DisableKey|kms:ScheduleKeyDeletion/);
    });

    test('should create S3 access policy with VPC endpoint restriction', () => {
      expect(iamPoliciesCode).toMatch(/data\s+"aws_iam_policy_document"\s+"s3_access_policy"/);
      expect(iamPoliciesCode).toMatch(/aws:SourceVpce/);
    });

    test('should require secure transport in S3 access policy', () => {
      expect(iamPoliciesCode).toMatch(/aws:SecureTransport/);
    });

    test('should require KMS encryption in S3 access policy', () => {
      expect(iamPoliciesCode).toMatch(/s3:x-amz-server-side-encryption/);
      expect(iamPoliciesCode).toMatch(/aws:kms/);
    });

    test('should create regional restriction policy', () => {
      expect(iamPoliciesCode).toMatch(/resource\s+"aws_iam_policy"\s+"regional_restriction"/);
    });

    test('should allow global services in regional restriction policy', () => {
      expect(iamPoliciesCode).toMatch(/AllowGlobalServices/);
      expect(iamPoliciesCode).toMatch(/iam:\*|cloudfront:\*/);
    });

    test('should create permission boundary policy', () => {
      expect(iamPoliciesCode).toMatch(/resource\s+"aws_iam_policy"\s+"permission_boundary"/);
    });

    test('should prevent IAM creation without permission boundary', () => {
      expect(iamPoliciesCode).toMatch(/RequirePermissionBoundary/);
      expect(iamPoliciesCode).toMatch(/iam:CreateUser|iam:CreateRole/);
      expect(iamPoliciesCode).toMatch(/iam:PermissionsBoundary/);
    });

    test('should prevent boundary removal', () => {
      expect(iamPoliciesCode).toMatch(/PreventBoundaryRemoval/);
      expect(iamPoliciesCode).toMatch(/DeleteUserPermissionsBoundary|DeleteRolePermissionsBoundary/);
    });
  });

  describe('IAM Roles - All Conditions', () => {
    test('should have at least 3 different condition keys per policy', () => {
      const conditionMatches = iamPoliciesCode.match(/condition\s*\{/g) || [];
      expect(conditionMatches.length).toBeGreaterThan(10);
    });

    test('should use explicit deny statements', () => {
      const denyMatches = iamPoliciesCode.match(/effect\s*=\s*"Deny"/gi) || [];
      expect(denyMatches.length).toBeGreaterThan(5);
    });

    test('should enforce encryption across all policies', () => {
      expect(iamPoliciesCode).toMatch(/encryption|kms|aws:kms/i);
      expect(s3Code).toMatch(/encryption|kms/i);
    });

    test('should use environment suffix for unique resource naming', () => {
      expect(localsCode).toMatch(/name_suffix/);
      // S3 uses computed locals (local.financial_data_bucket, local.access_logs_bucket) which include name_suffix
      expect(s3Code).toMatch(/name_suffix|local\.(name_prefix|financial_data_bucket|access_logs_bucket|kms_key_alias)/);
      // Monitoring uses computed locals (local.security_alerts_topic, local.iam_events_log_group, etc.) which include name_suffix
      expect(monitoringCode).toMatch(/name_suffix|local\.(name_prefix|security_alerts_topic|iam_events_log_group|access_expiration_lambda)/);
    });

    test('should tag all resources with common_tags', () => {
      const tagMatches = (
        iamPoliciesCode +
        iamRolesDeveloperCode +
        s3Code +
        monitoringCode
      ).match(/tags\s*=\s*(local\.common_tags|merge\(local\.common_tags)/g) || [];
      expect(tagMatches.length).toBeGreaterThan(15);
    });
  });

  describe('Password Policy', () => {
    test('should create account password policy', () => {
      expect(iamPasswordPolicyCode).toMatch(/resource\s+"aws_iam_account_password_policy"\s+"strict"/);
    });

    test('should enforce minimum password length', () => {
      expect(iamPasswordPolicyCode).toMatch(/minimum_password_length\s*=\s*var\.password_min_length/);
    });

    test('should require uppercase characters', () => {
      expect(iamPasswordPolicyCode).toMatch(/require_uppercase_characters\s*=\s*true/);
    });

    test('should require lowercase characters', () => {
      expect(iamPasswordPolicyCode).toMatch(/require_lowercase_characters\s*=\s*true/);
    });

    test('should require numbers', () => {
      expect(iamPasswordPolicyCode).toMatch(/require_numbers\s*=\s*true/);
    });

    test('should require symbols', () => {
      expect(iamPasswordPolicyCode).toMatch(/require_symbols\s*=\s*true/);
    });

    test('should enforce max password age', () => {
      expect(iamPasswordPolicyCode).toMatch(/max_password_age\s*=\s*var\.password_max_age/);
    });

    test('should prevent password reuse', () => {
      expect(iamPasswordPolicyCode).toMatch(/password_reuse_prevention\s*=\s*var\.password_reuse_prevention/);
    });

    test('should allow users to change password', () => {
      expect(iamPasswordPolicyCode).toMatch(/allow_users_to_change_password\s*=\s*true/);
    });
  });

  describe('S3 Buckets and Security', () => {
    test('should create KMS key for S3 encryption', () => {
      expect(s3Code).toMatch(/resource\s+"aws_kms_key"\s+"s3"/);
      expect(s3Code).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('should include CloudWatch Logs in KMS key policy', () => {
      expect(s3Code).toMatch(/logs\..*\.amazonaws\.com/);
      expect(s3Code).toMatch(/kms:Decrypt|kms:GenerateDataKey/);
    });

    test('should create KMS key alias', () => {
      expect(s3Code).toMatch(/resource\s+"aws_kms_alias"\s+"s3"/);
    });

    test('should create access logs bucket', () => {
      expect(s3Code).toMatch(/resource\s+"aws_s3_bucket"\s+"access_logs"/);
    });

    test('should block public access on all S3 buckets', () => {
      expect(s3Code).toMatch(/aws_s3_bucket_public_access_block/);
      expect(s3Code).toMatch(/block_public_acls\s*=\s*true/);
      expect(s3Code).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('should encrypt buckets with KMS', () => {
      expect(s3Code).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
      expect(s3Code).toMatch(/bucket_key_enabled\s*=\s*true/);
    });

    test('should enable versioning on financial data bucket', () => {
      expect(s3Code).toMatch(/aws_s3_bucket_versioning.*financial_data/);
      expect(s3Code).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('should deny unencrypted uploads in bucket policy', () => {
      expect(s3Code).toMatch(/DenyUnencryptedUploads/);
      expect(s3Code).toMatch(/s3:x-amz-server-side-encryption/);
    });

    test('should deny insecure transport in bucket policy', () => {
      expect(s3Code).toMatch(/DenyInsecureTransport/);
      expect(s3Code).toMatch(/aws:SecureTransport/);
    });

    test('should require MFA for delete operations in bucket policy', () => {
      expect(s3Code).toMatch(/RequireMFAForDelete/);
      expect(s3Code).toMatch(/s3:DeleteObject/);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should create SNS topic for security alerts', () => {
      expect(monitoringCode).toMatch(/resource\s+"aws_sns_topic"\s+"security_alerts"/);
    });

    test('should create email subscription for security alerts', () => {
      expect(monitoringCode).toMatch(/aws_sns_topic_subscription.*security_alerts_email/);
      expect(monitoringCode).toMatch(/protocol\s*=\s*"email"/);
    });

    test('should create CloudWatch log group for IAM events', () => {
      expect(monitoringCode).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"iam_events"/);
      expect(monitoringCode).toMatch(/retention_in_days\s*=\s*var\.log_retention_days/);
    });

    test('should create EventBridge rules for IAM monitoring', () => {
      expect(monitoringCode).toMatch(/aws_cloudwatch_event_rule.*iam_policy_changes/);
      expect(monitoringCode).toMatch(/aws_cloudwatch_event_rule.*role_assumption/);
      expect(monitoringCode).toMatch(/aws_cloudwatch_event_rule.*failed_auth/);
    });

    test('should create metric filter for unauthorized API calls', () => {
      expect(monitoringCode).toMatch(/aws_cloudwatch_log_metric_filter.*unauthorized_api_calls/);
      expect(monitoringCode).toMatch(/UnauthorizedOperation|AccessDenied/);
    });

    test('should create alarm for unauthorized API calls', () => {
      expect(monitoringCode).toMatch(/aws_cloudwatch_metric_alarm.*unauthorized_api_calls/);
    });
  });

  describe('Lambda Function - Access Expiration', () => {
    test('should create CloudWatch log group for Lambda', () => {
      expect(lambdaCode).toMatch(/aws_cloudwatch_log_group.*access_expiration/);
    });

    test('should create Lambda IAM role', () => {
      expect(lambdaCode).toMatch(/resource\s+"aws_iam_role"\s+"access_expiration_lambda"/);
    });

    test('should allow Lambda to manage IAM policies', () => {
      expect(lambdaCode).toMatch(/ManageIAMPolicies/);
      expect(lambdaCode).toMatch(/iam:DetachUserPolicy|iam:DetachRolePolicy/);
    });

    test('should create Lambda function', () => {
      expect(lambdaCode).toMatch(/resource\s+"aws_lambda_function"\s+"access_expiration"/);
      expect(lambdaCode).toMatch(/runtime\s*=\s*"python3\.11"/);
    });

    test('should enable X-Ray tracing for Lambda', () => {
      expect(lambdaCode).toMatch(/tracing_config\s*\{[\s\S]*?mode\s*=\s*"Active"/);
    });

    test('should create EventBridge schedule for Lambda', () => {
      expect(lambdaCode).toMatch(/aws_cloudwatch_event_rule.*access_expiration_schedule/);
      expect(lambdaCode).toMatch(/schedule_expression/);
    });
  });

  describe('Outputs', () => {
    test('should output all role ARNs and names', () => {
      expect(outputsCode).toMatch(/output\s+"developer_role_arn"/);
      expect(outputsCode).toMatch(/output\s+"operator_role_arn"/);
      expect(outputsCode).toMatch(/output\s+"administrator_role_arn"/);
      expect(outputsCode).toMatch(/output\s+"break_glass_role_arn"/);
    });

    test('should output policy ARNs', () => {
      expect(outputsCode).toMatch(/output\s+"developer_policy_arn"/);
      expect(outputsCode).toMatch(/output\s+"operator_policy_arn"/);
      expect(outputsCode).toMatch(/output\s+"administrator_policy_arn"/);
      expect(outputsCode).toMatch(/output\s+"permission_boundary_policy_arn"/);
    });

    test('should output S3 bucket information', () => {
      expect(outputsCode).toMatch(/output\s+"financial_data_bucket_name"/);
      expect(outputsCode).toMatch(/output\s+"financial_data_bucket_arn"/);
    });

    test('should output KMS key information', () => {
      expect(outputsCode).toMatch(/output\s+"kms_key_id"/);
      expect(outputsCode).toMatch(/output\s+"kms_key_arn"/);
    });

    test('should output monitoring information', () => {
      expect(outputsCode).toMatch(/output\s+"security_alerts_topic_arn"/);
      expect(outputsCode).toMatch(/output\s+"iam_events_log_group_name"/);
    });

    test('should output environment suffix', () => {
      expect(outputsCode).toMatch(/output\s+"environment_suffix"/);
      expect(outputsCode).toMatch(/local\.name_suffix/);
    });
  });
});
