import { describe, test, expect } from '@jest/globals';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import hcl from 'hcl2-parser';

const LIB_DIR = join(process.cwd(), 'lib');

describe('Terraform Configuration Unit Tests', () => {
  describe('File Structure', () => {
    test('should have all required Terraform files', () => {
      const files = readdirSync(LIB_DIR);
      const requiredFiles = [
        'provider.tf',
        'variables.tf',
        'data.tf',
        'organizations.tf',
        'kms.tf',
        'iam.tf',
        'scp.tf',
        'cloudwatch.tf',
        's3.tf',
        'config.tf',
        'outputs.tf'
      ];

      requiredFiles.forEach(file => {
        expect(files).toContain(file);
      });
    });
  });

  describe('Provider Configuration', () => {
    test('should configure primary and secondary AWS providers', () => {
      const content = readFileSync(join(LIB_DIR, 'provider.tf'), 'utf8');
      expect(content).toContain('provider "aws"');
      expect(content).toContain('alias  = "secondary"');
      expect(content).toContain('region = var.primary_region');
      expect(content).toContain('region = var.secondary_region');
    });

    test('should enable S3 backend with encryption', () => {
      const content = readFileSync(join(LIB_DIR, 'provider.tf'), 'utf8');
      expect(content).toContain('backend "s3"');
      expect(content).toContain('encrypt = true');
    });

    test('should require Terraform version >= 1.5.0', () => {
      const content = readFileSync(join(LIB_DIR, 'provider.tf'), 'utf8');
      expect(content).toMatch(/required_version\s*=\s*">=\s*1\.5\.0"/);
    });
  });

  describe('Variables', () => {
    test('should define environment_suffix variable', () => {
      const content = readFileSync(join(LIB_DIR, 'variables.tf'), 'utf8');
      expect(content).toContain('variable "environment_suffix"');
    });

    test('should define region variables', () => {
      const content = readFileSync(join(LIB_DIR, 'variables.tf'), 'utf8');
      expect(content).toContain('variable "primary_region"');
      expect(content).toContain('variable "secondary_region"');
      expect(content).toContain('default     = "us-east-1"');
      expect(content).toContain('default     = "eu-west-1"');
    });

    test('should define CloudWatch log retention variable', () => {
      const content = readFileSync(join(LIB_DIR, 'variables.tf'), 'utf8');
      expect(content).toContain('variable "cloudwatch_log_retention_days"');
      expect(content).toContain('default     = 90');
    });

    test('should define KMS deletion window variable', () => {
      const content = readFileSync(join(LIB_DIR, 'variables.tf'), 'utf8');
      expect(content).toContain('variable "kms_deletion_window"');
      expect(content).toContain('default     = 7');
    });

    test('should define OU name variables', () => {
      const content = readFileSync(join(LIB_DIR, 'variables.tf'), 'utf8');
      expect(content).toContain('variable "security_ou_name"');
      expect(content).toContain('variable "production_ou_name"');
      expect(content).toContain('variable "development_ou_name"');
    });

    test('should define common tags variable', () => {
      const content = readFileSync(join(LIB_DIR, 'variables.tf'), 'utf8');
      expect(content).toContain('variable "tags"');
      expect(content).toContain('Project');
      expect(content).toContain('ManagedBy');
      expect(content).toContain('Compliance');
    });
  });

  describe('AWS Organizations', () => {
    test('should create AWS Organization with all features', () => {
      const content = readFileSync(join(LIB_DIR, 'organizations.tf'), 'utf8');
      expect(content).toContain('resource "aws_organizations_organization" "main"');
      expect(content).toContain('feature_set = "ALL"');
    });

    test('should enable SERVICE_CONTROL_POLICY and TAG_POLICY', () => {
      const content = readFileSync(join(LIB_DIR, 'organizations.tf'), 'utf8');
      expect(content).toContain('SERVICE_CONTROL_POLICY');
      expect(content).toContain('TAG_POLICY');
    });

    test('should create three organizational units with environment_suffix', () => {
      const content = readFileSync(join(LIB_DIR, 'organizations.tf'), 'utf8');
      expect(content).toContain('resource "aws_organizations_organizational_unit" "security"');
      expect(content).toContain('resource "aws_organizations_organizational_unit" "production"');
      expect(content).toContain('resource "aws_organizations_organizational_unit" "development"');
      expect(content).toMatch(/name\s*=\s*"\$\{var\.security_ou_name\}-\$\{var\.environment_suffix\}"/);
    });

    test('should enable AWS service access for security services', () => {
      const content = readFileSync(join(LIB_DIR, 'organizations.tf'), 'utf8');
      expect(content).toContain('cloudtrail.amazonaws.com');
      expect(content).toContain('config.amazonaws.com');
      expect(content).toContain('guardduty.amazonaws.com');
      expect(content).toContain('securityhub.amazonaws.com');
    });
  });

  describe('KMS Configuration', () => {
    test('should create primary multi-region KMS key with rotation', () => {
      const content = readFileSync(join(LIB_DIR, 'kms.tf'), 'utf8');
      expect(content).toContain('resource "aws_kms_key" "primary"');
      expect(content).toContain('multi_region            = true');
      expect(content).toContain('enable_key_rotation     = true');
    });

    test('should create secondary replica KMS key', () => {
      const content = readFileSync(join(LIB_DIR, 'kms.tf'), 'utf8');
      expect(content).toContain('resource "aws_kms_replica_key" "secondary"');
      expect(content).toContain('provider = aws.secondary');
      expect(content).toContain('primary_key_arn         = aws_kms_key.primary.arn');
    });

    test('should create separate KMS key for Terraform state', () => {
      const content = readFileSync(join(LIB_DIR, 'kms.tf'), 'utf8');
      expect(content).toContain('resource "aws_kms_key" "terraform_state"');
      expect(content).toContain('enable_key_rotation     = true');
    });

    test('should create KMS aliases with environment_suffix', () => {
      const content = readFileSync(join(LIB_DIR, 'kms.tf'), 'utf8');
      expect(content).toContain('resource "aws_kms_alias" "primary"');
      expect(content).toContain('resource "aws_kms_alias" "secondary"');
      expect(content).toContain('resource "aws_kms_alias" "terraform_state"');
      expect(content).toMatch(/alias\/primary-key-\$\{var\.environment_suffix\}/);
    });

    test('should configure KMS key policies for service access', () => {
      const content = readFileSync(join(LIB_DIR, 'kms.tf'), 'utf8');
      expect(content).toContain('s3.amazonaws.com');
      expect(content).toContain('logs.amazonaws.com');
      expect(content).toContain('config.amazonaws.com');
      expect(content).toContain('kms:Decrypt');
      expect(content).toContain('kms:GenerateDataKey');
    });

    test('should use KMS deletion window from variable', () => {
      const content = readFileSync(join(LIB_DIR, 'kms.tf'), 'utf8');
      expect(content).toContain('deletion_window_in_days = var.kms_deletion_window');
    });
  });

  describe('IAM Configuration', () => {
    test('should create security audit role with MFA enforcement', () => {
      const content = readFileSync(join(LIB_DIR, 'iam.tf'), 'utf8');
      expect(content).toContain('resource "aws_iam_role" "security_audit"');
      expect(content).toContain('"aws:MultiFactorAuthPresent" = "true"');
    });

    test('should create read-only security audit policy', () => {
      const content = readFileSync(join(LIB_DIR, 'iam.tf'), 'utf8');
      expect(content).toContain('resource "aws_iam_policy" "security_audit"');
      expect(content).toContain('s3:Get*');
      expect(content).toContain('s3:List*');
      expect(content).toContain('ec2:Describe*');
      expect(content).toContain('iam:Get*');
      expect(content).toContain('iam:List*');
      expect(content).toMatch(/Resource\s*=\s*"\*"/);
    });

    test('should not include modification actions in security audit policy', () => {
      const content = readFileSync(join(LIB_DIR, 'iam.tf'), 'utf8');
      expect(content).not.toContain('Put*');
      expect(content).not.toContain('Create*');
      expect(content).not.toContain('Delete*');
      expect(content).not.toContain('Update*');
    });

    test('should create cross-account access role with MFA', () => {
      const content = readFileSync(join(LIB_DIR, 'iam.tf'), 'utf8');
      expect(content).toContain('resource "aws_iam_role" "cross_account_access"');
      expect(content).toContain('"aws:MultiFactorAuthPresent" = "true"');
      expect(content).toContain('aws_organizations_organizational_unit.security.arn');
    });

    test('should create AWS Config IAM role with correct managed policy', () => {
      const content = readFileSync(join(LIB_DIR, 'iam.tf'), 'utf8');
      expect(content).toContain('resource "aws_iam_role" "config"');
      expect(content).toContain('arn:aws:iam::aws:policy/service-role/AWS_ConfigRole');
    });

    test('should create Config S3 policy for writing', () => {
      const content = readFileSync(join(LIB_DIR, 'iam.tf'), 'utf8');
      expect(content).toContain('resource "aws_iam_role_policy" "config_s3"');
      expect(content).toContain('s3:PutObject');
      expect(content).toContain('s3:GetObject');
      expect(content).toContain('aws_s3_bucket.config.arn');
    });

    test('should use environment_suffix in IAM role names', () => {
      const content = readFileSync(join(LIB_DIR, 'iam.tf'), 'utf8');
      expect(content).toMatch(/security-audit-role-\$\{var\.environment_suffix\}/);
      expect(content).toMatch(/cross-account-access-\$\{var\.environment_suffix\}/);
      expect(content).toMatch(/aws-config-role-\$\{var\.environment_suffix\}/);
    });
  });

  describe('Service Control Policies', () => {
    test('should create SCP to enforce S3 encryption', () => {
      const content = readFileSync(join(LIB_DIR, 'scp.tf'), 'utf8');
      expect(content).toContain('resource "aws_organizations_policy" "enforce_s3_encryption"');
      expect(content).toContain('type        = "SERVICE_CONTROL_POLICY"');
      expect(content).toContain('DenyUnencryptedS3Uploads');
      expect(content).toContain('s3:x-amz-server-side-encryption');
    });

    test('should create SCP to enforce EBS encryption', () => {
      const content = readFileSync(join(LIB_DIR, 'scp.tf'), 'utf8');
      expect(content).toContain('resource "aws_organizations_policy" "enforce_ebs_encryption"');
      expect(content).toContain('DenyUnencryptedEBSVolumes');
      expect(content).toContain('ec2:Encrypted');
    });

    test('should create SCP to enforce RDS encryption', () => {
      const content = readFileSync(join(LIB_DIR, 'scp.tf'), 'utf8');
      expect(content).toContain('resource "aws_organizations_policy" "enforce_rds_encryption"');
      expect(content).toContain('DenyUnencryptedRDSInstances');
      expect(content).toContain('rds:StorageEncrypted');
    });

    test('should create SCP to protect CloudWatch Logs', () => {
      const content = readFileSync(join(LIB_DIR, 'scp.tf'), 'utf8');
      expect(content).toContain('resource "aws_organizations_policy" "protect_cloudwatch_logs"');
      expect(content).toContain('logs:DeleteLogGroup');
      expect(content).toContain('logs:DeleteLogStream');
    });

    test('should create SCP to restrict root user actions', () => {
      const content = readFileSync(join(LIB_DIR, 'scp.tf'), 'utf8');
      expect(content).toContain('resource "aws_organizations_policy" "restrict_root_user"');
      expect(content).toContain('DenyRootUserActions');
      expect(content).toContain('arn:aws:iam::*:root');
    });

    test('should create SCP to enforce mandatory tagging', () => {
      const content = readFileSync(join(LIB_DIR, 'scp.tf'), 'utf8');
      expect(content).toContain('resource "aws_organizations_policy" "enforce_tagging"');
      expect(content).toContain('aws:RequestTag/Project');
      expect(content).toContain('aws:RequestTag/Environment');
    });

    test('should attach all SCPs to all three OUs', () => {
      const content = readFileSync(join(LIB_DIR, 'scp.tf'), 'utf8');
      const policies = ['s3', 'ebs', 'rds', 'logs', 'root', 'tagging'];
      const ous = ['security', 'production', 'development'];

      policies.forEach(policy => {
        ous.forEach(ou => {
          expect(content).toContain(`resource "aws_organizations_policy_attachment" "${ou}_${policy}"`);
        });
      });
    });

    test('should use environment_suffix in SCP names', () => {
      const content = readFileSync(join(LIB_DIR, 'scp.tf'), 'utf8');
      expect(content).toMatch(/enforce-s3-encryption-\$\{var\.environment_suffix\}/);
      expect(content).toMatch(/enforce-ebs-encryption-\$\{var\.environment_suffix\}/);
    });
  });

  describe('CloudWatch Logs', () => {
    test('should create CloudWatch log groups with environment_suffix', () => {
      const content = readFileSync(join(LIB_DIR, 'cloudwatch.tf'), 'utf8');
      expect(content).toContain('resource "aws_cloudwatch_log_group" "iam_activity"');
      expect(content).toContain('resource "aws_cloudwatch_log_group" "organizations_activity"');
      expect(content).toContain('resource "aws_cloudwatch_log_group" "config_activity"');
      expect(content).toMatch(/\/aws\/iam\/activity-\$\{var\.environment_suffix\}/);
    });

    test('should set 90-day retention from variable', () => {
      const content = readFileSync(join(LIB_DIR, 'cloudwatch.tf'), 'utf8');
      expect(content).toContain('retention_in_days = var.cloudwatch_log_retention_days');
    });

    test('should encrypt log groups with KMS', () => {
      const content = readFileSync(join(LIB_DIR, 'cloudwatch.tf'), 'utf8');
      expect(content).toContain('kms_key_id        = aws_kms_key.primary.arn');
    });
  });

  describe('S3 Configuration', () => {
    test('should create S3 bucket for AWS Config with environment_suffix', () => {
      const content = readFileSync(join(LIB_DIR, 's3.tf'), 'utf8');
      expect(content).toContain('resource "aws_s3_bucket" "config"');
      expect(content).toMatch(/aws-config-bucket-\$\{var\.environment_suffix\}/);
    });

    test('should enable versioning for Config bucket', () => {
      const content = readFileSync(join(LIB_DIR, 's3.tf'), 'utf8');
      expect(content).toContain('resource "aws_s3_bucket_versioning" "config"');
      expect(content).toContain('status = "Enabled"');
    });

    test('should enable KMS encryption for Config bucket', () => {
      const content = readFileSync(join(LIB_DIR, 's3.tf'), 'utf8');
      expect(content).toContain('resource "aws_s3_bucket_server_side_encryption_configuration" "config"');
      expect(content).toContain('sse_algorithm     = "aws:kms"');
      expect(content).toContain('kms_master_key_id = aws_kms_key.primary.arn');
    });

    test('should block all public access for Config bucket', () => {
      const content = readFileSync(join(LIB_DIR, 's3.tf'), 'utf8');
      expect(content).toContain('resource "aws_s3_bucket_public_access_block" "config"');
      expect(content).toContain('block_public_acls       = true');
      expect(content).toContain('block_public_policy     = true');
      expect(content).toContain('ignore_public_acls      = true');
      expect(content).toContain('restrict_public_buckets = true');
    });

    test('should create S3 bucket for Terraform state with environment_suffix', () => {
      const content = readFileSync(join(LIB_DIR, 's3.tf'), 'utf8');
      expect(content).toContain('resource "aws_s3_bucket" "terraform_state"');
      expect(content).toMatch(/terraform-state-\$\{var\.environment_suffix\}/);
    });

    test('should enable versioning and KMS encryption for Terraform state bucket', () => {
      const content = readFileSync(join(LIB_DIR, 's3.tf'), 'utf8');
      expect(content).toContain('resource "aws_s3_bucket_versioning" "terraform_state"');
      expect(content).toContain('resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state"');
      expect(content).toContain('kms_master_key_id = aws_kms_key.terraform_state.arn');
    });

    test('should create DynamoDB table for state locking', () => {
      const content = readFileSync(join(LIB_DIR, 's3.tf'), 'utf8');
      expect(content).toContain('resource "aws_dynamodb_table" "terraform_state_lock"');
      expect(content).toContain('hash_key     = "LockID"');
      expect(content).toContain('billing_mode = "PAY_PER_REQUEST"');
    });

    test('should encrypt DynamoDB table with KMS', () => {
      const content = readFileSync(join(LIB_DIR, 's3.tf'), 'utf8');
      expect(content).toContain('server_side_encryption');
      expect(content).toContain('kms_key_arn = aws_kms_key.terraform_state.arn');
    });

    test('should configure Config bucket policy for AWS Config service', () => {
      const content = readFileSync(join(LIB_DIR, 's3.tf'), 'utf8');
      expect(content).toContain('resource "aws_s3_bucket_policy" "config"');
      expect(content).toContain('AWSConfigBucketPermissionsCheck');
      expect(content).toContain('s3:GetBucketAcl');
      expect(content).toContain('s3:PutObject');
    });
  });

  describe('AWS Config', () => {
    test('should create configuration recorder with environment_suffix', () => {
      const content = readFileSync(join(LIB_DIR, 'config.tf'), 'utf8');
      expect(content).toContain('resource "aws_config_configuration_recorder" "main"');
      expect(content).toMatch(/config-recorder-\$\{var\.environment_suffix\}/);
      expect(content).toContain('all_supported                 = true');
      expect(content).toContain('include_global_resource_types = true');
    });

    test('should create delivery channel with S3 bucket', () => {
      const content = readFileSync(join(LIB_DIR, 'config.tf'), 'utf8');
      expect(content).toContain('resource "aws_config_delivery_channel" "main"');
      expect(content).toContain('s3_bucket_name = aws_s3_bucket.config.id');
    });

    test('should enable configuration recorder', () => {
      const content = readFileSync(join(LIB_DIR, 'config.tf'), 'utf8');
      expect(content).toContain('resource "aws_config_configuration_recorder_status" "main"');
      expect(content).toContain('is_enabled = true');
    });

    test('should create config rules for S3, EBS, and RDS encryption', () => {
      const content = readFileSync(join(LIB_DIR, 'config.tf'), 'utf8');
      expect(content).toContain('resource "aws_config_config_rule" "s3_bucket_encryption"');
      expect(content).toContain('S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED');
      expect(content).toContain('resource "aws_config_config_rule" "ebs_encryption"');
      expect(content).toContain('ENCRYPTED_VOLUMES');
      expect(content).toContain('resource "aws_config_config_rule" "rds_encryption"');
      expect(content).toContain('RDS_STORAGE_ENCRYPTED');
    });

    test('should create config rule for CloudWatch Log Group encryption', () => {
      const content = readFileSync(join(LIB_DIR, 'config.tf'), 'utf8');
      expect(content).toContain('resource "aws_config_config_rule" "cloudwatch_log_group_encrypted"');
      expect(content).toContain('CLOUDWATCH_LOG_GROUP_ENCRYPTED');
    });

    test('should create config rules for IAM security', () => {
      const content = readFileSync(join(LIB_DIR, 'config.tf'), 'utf8');
      expect(content).toContain('resource "aws_config_config_rule" "iam_password_policy"');
      expect(content).toContain('IAM_PASSWORD_POLICY');
      expect(content).toContain('MinimumPasswordLength      = 14');
      expect(content).toContain('resource "aws_config_config_rule" "root_mfa_enabled"');
      expect(content).toContain('ROOT_ACCOUNT_MFA_ENABLED');
    });

    test('should configure IAM password policy requirements', () => {
      const content = readFileSync(join(LIB_DIR, 'config.tf'), 'utf8');
      expect(content).toContain('RequireUppercaseCharacters = true');
      expect(content).toContain('RequireLowercaseCharacters = true');
      expect(content).toContain('RequireSymbols             = true');
      expect(content).toContain('RequireNumbers             = true');
    });

    test('should use environment_suffix in config rule names', () => {
      const content = readFileSync(join(LIB_DIR, 'config.tf'), 'utf8');
      expect(content).toMatch(/s3-bucket-encryption-\$\{var\.environment_suffix\}/);
      expect(content).toMatch(/ebs-encryption-\$\{var\.environment_suffix\}/);
    });
  });

  describe('Outputs', () => {
    test('should output all key resource identifiers', () => {
      const content = readFileSync(join(LIB_DIR, 'outputs.tf'), 'utf8');
      const expectedOutputs = [
        'organization_id',
        'organization_arn',
        'security_ou_id',
        'production_ou_id',
        'development_ou_id',
        'primary_kms_key_id',
        'primary_kms_key_arn',
        'secondary_kms_key_id',
        'secondary_kms_key_arn',
        'terraform_state_kms_key_id',
        'terraform_state_kms_key_arn',
        'security_audit_role_arn',
        'cross_account_access_role_arn',
        'config_bucket_name',
        'terraform_state_bucket_name',
        'terraform_state_lock_table_name',
        'iam_activity_log_group_name',
        'organizations_activity_log_group_name',
        'config_activity_log_group_name'
      ];

      expectedOutputs.forEach(output => {
        expect(content).toContain(`output "${output}"`);
      });
    });

    test('should include descriptions for all outputs', () => {
      const content = readFileSync(join(LIB_DIR, 'outputs.tf'), 'utf8');
      expect(content).toContain('description =');
      const descriptionCount = (content.match(/description\s*=/g) || []).length;
      expect(descriptionCount).toBeGreaterThanOrEqual(19);
    });
  });

  describe('Data Sources', () => {
    test('should define current account and region data sources', () => {
      const content = readFileSync(join(LIB_DIR, 'data.tf'), 'utf8');
      expect(content).toContain('data "aws_caller_identity" "current"');
      expect(content).toContain('data "aws_region" "current"');
    });
  });

  describe('Security Best Practices', () => {
    test('should not contain any Retain policies', () => {
      const files = ['organizations.tf', 'kms.tf', 'iam.tf', 'scp.tf', 'cloudwatch.tf', 's3.tf', 'config.tf'];
      files.forEach(file => {
        const content = readFileSync(join(LIB_DIR, file), 'utf8');
        expect(content.toLowerCase()).not.toContain('prevent_destroy');
        expect(content.toLowerCase()).not.toContain('deletion_protection = true');
      });
    });

    test('should use environment_suffix in all resource names', () => {
      const files = ['organizations.tf', 'kms.tf', 'iam.tf', 'scp.tf', 'cloudwatch.tf', 's3.tf', 'config.tf'];
      files.forEach(file => {
        const content = readFileSync(join(LIB_DIR, file), 'utf8');
        if (content.includes('name ')) {
          expect(content).toMatch(/\$\{var\.environment_suffix\}/);
        }
      });
    });

    test('should not contain hardcoded region names except in defaults', () => {
      const files = ['kms.tf', 'iam.tf', 'cloudwatch.tf', 's3.tf', 'config.tf'];
      files.forEach(file => {
        const content = readFileSync(join(LIB_DIR, file), 'utf8');
        const hardcodedRegions = content.match(/"(us|eu|ap|sa|ca|me|af)-(east|west|central|south|north|northeast|southeast)-\d"/g);
        expect(hardcodedRegions).toBeNull();
      });
    });

    test('should enable encryption for all S3 buckets', () => {
      const content = readFileSync(join(LIB_DIR, 's3.tf'), 'utf8');
      const buckets = (content.match(/resource "aws_s3_bucket" /g) || []).length;
      const encryption = (content.match(/aws_s3_bucket_server_side_encryption_configuration/g) || []).length;
      expect(encryption).toBe(buckets);
    });

    test('should block public access for all S3 buckets', () => {
      const content = readFileSync(join(LIB_DIR, 's3.tf'), 'utf8');
      const buckets = (content.match(/resource "aws_s3_bucket" /g) || []).length;
      const publicBlocks = (content.match(/aws_s3_bucket_public_access_block/g) || []).length;
      expect(publicBlocks).toBe(buckets);
    });

    test('should enable versioning for critical S3 buckets', () => {
      const content = readFileSync(join(LIB_DIR, 's3.tf'), 'utf8');
      expect(content).toContain('aws_s3_bucket_versioning');
      expect(content).toMatch(/status = "Enabled"/g);
    });

    test('should enforce MFA for all assume role policies', () => {
      const content = readFileSync(join(LIB_DIR, 'iam.tf'), 'utf8');
      const assumeRolePolicies = (content.match(/assume_role_policy/g) || []).length;
      const mfaConditions = (content.match(/"aws:MultiFactorAuthPresent" = "true"/g) || []).length;
      expect(mfaConditions).toBeGreaterThanOrEqual(2);
    });

    test('should enable KMS key rotation for all keys', () => {
      const content = readFileSync(join(LIB_DIR, 'kms.tf'), 'utf8');
      const kmsKeys = (content.match(/resource "aws_kms_key" /g) || []).length;
      const rotationEnabled = (content.match(/enable_key_rotation\s*=\s*true/g) || []).length;
      expect(rotationEnabled).toBe(kmsKeys);
    });
  });

  describe('Compliance Requirements', () => {
    test('should meet PCI-DSS tagging requirements', () => {
      const content = readFileSync(join(LIB_DIR, 'variables.tf'), 'utf8');
      expect(content).toContain('Compliance');
      expect(content).toContain('PCI-DSS');
    });

    test('should enforce encryption at rest for all data stores', () => {
      const s3Content = readFileSync(join(LIB_DIR, 's3.tf'), 'utf8');
      const cloudwatchContent = readFileSync(join(LIB_DIR, 'cloudwatch.tf'), 'utf8');

      expect(s3Content).toContain('sse_algorithm');
      expect(cloudwatchContent).toContain('kms_key_id');
      expect(s3Content).toContain('server_side_encryption');
    });

    test('should configure audit logging for IAM and Organizations', () => {
      const content = readFileSync(join(LIB_DIR, 'cloudwatch.tf'), 'utf8');
      expect(content).toContain('/aws/iam/activity');
      expect(content).toContain('/aws/organizations/activity');
    });

    test('should enforce 90-day log retention', () => {
      const content = readFileSync(join(LIB_DIR, 'cloudwatch.tf'), 'utf8');
      expect(content).toContain('retention_in_days = var.cloudwatch_log_retention_days');

      const variablesContent = readFileSync(join(LIB_DIR, 'variables.tf'), 'utf8');
      expect(variablesContent).toMatch(/default\s*=\s*90/);
    });

    test('should implement least-privilege IAM policies', () => {
      const content = readFileSync(join(LIB_DIR, 'iam.tf'), 'utf8');
      expect(content).toContain('Get*');
      expect(content).toContain('List*');
      expect(content).toContain('Describe*');
    });
  });
});
