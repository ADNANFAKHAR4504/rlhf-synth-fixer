import { readFileSync } from 'fs';
import { join } from 'path';

// Terraform module validation interface
interface TerraformModuleValidation {
  resourceCount: number;
  requiredTags: string[];
  namingConvention: RegExp;
  securityStandards: string[];
  bestPractices: string[];
}

// Load Terraform configuration files
const loadTerraformConfig = (modulePath: string): string => {
  try {
    return readFileSync(join(__dirname, '..', modulePath), 'utf8');
  } catch (error) {
    console.error(`Failed to load Terraform config from ${modulePath}:`, error);
    throw error;
  }
};

// Validate Terraform configuration standards
const validateTerraformStandards = (config: string, moduleName: string): TerraformModuleValidation => {
  const validation: TerraformModuleValidation = {
    resourceCount: 0,
    requiredTags: [],
    namingConvention: /^[a-z0-9-]+$/,
    securityStandards: [],
    bestPractices: []
  };

  // Count resources
  const resourceMatches = config.match(/resource\s+"[^"]+"\s+"[^"]+"/g);
  validation.resourceCount = resourceMatches ? resourceMatches.length : 0;

  // Check for required tags
  if (config.includes('tags = {')) {
    validation.requiredTags.push('Name', 'Environment');
  }

  // Check security standards
  if (config.includes('encryption') || config.includes('kms_key_id')) {
    validation.securityStandards.push('encryption_enabled');
  }
  if (config.includes('public_access_block') || config.includes('block_public')) {
    validation.securityStandards.push('public_access_blocked');
  }
  if (config.includes('versioning') || config.includes('versioning_configuration')) {
    validation.securityStandards.push('versioning_enabled');
  }
  if (config.includes('password_policy') || config.includes('minimum_password_length')) {
    validation.securityStandards.push('password_policy_enabled');
  }
  if (config.includes('mfa') || config.includes('MultiFactorAuth')) {
    validation.securityStandards.push('mfa_enforcement');
  }

  // Check best practices
  if (config.includes('lifecycle')) {
    validation.bestPractices.push('lifecycle_management');
  }
  if (config.includes('depends_on')) {
    validation.bestPractices.push('explicit_dependencies');
  }
  if (config.includes('data "aws_')) {
    validation.bestPractices.push('data_sources_used');
  }

  return validation;
};

describe('Terraform Modules Unit Tests', () => {
  describe('KMS Module Standards', () => {
    let kmsConfig: string;
    let kmsValidation: TerraformModuleValidation;

    beforeAll(() => {
      kmsConfig = loadTerraformConfig('lib/modules/kms/main.tf');
      kmsValidation = validateTerraformStandards(kmsConfig, 'kms');
    });

    test('should have required KMS resources', () => {
      expect(kmsConfig).toContain('resource "aws_kms_key"');
      expect(kmsConfig).toContain('resource "aws_kms_alias"');
      expect(kmsValidation.resourceCount).toBeGreaterThanOrEqual(2);
    });

    test('should have proper KMS key configuration', () => {
      expect(kmsConfig).toContain('enable_key_rotation     = true');
      expect(kmsConfig).toContain('deletion_window_in_days = 30');
      expect(kmsConfig).toContain('description             =');
    });

    test('should have KMS key policy with proper statements', () => {
      expect(kmsConfig).toContain('"Enable IAM User Permissions"');
      expect(kmsConfig).toContain('"Allow CloudTrail to encrypt logs"');
      expect(kmsConfig).toContain('"Allow S3 service to use the key"');
    });

    test('should have proper KMS alias configuration', () => {
      expect(kmsConfig).toContain('name          = "alias/');
      expect(kmsConfig).toContain('target_key_id = aws_kms_key.main.key_id');
    });

    test('should have required tags', () => {
      expect(kmsConfig).toContain('tags = {');
      expect(kmsConfig).toContain('Name =');
    });

    test('should follow naming conventions', () => {
      expect(kmsConfig).toMatch(/\$\{var\.environment\}-\$\{var\.organization_name\}-kms-key/);
      expect(kmsConfig).toMatch(/\$\{var\.environment\}-\$\{var\.organization_name\}-key/);
    });

    test('should have data sources for account information', () => {
      expect(kmsConfig).toContain('data "aws_caller_identity"');
    });
  });

  describe('S3 Module Standards', () => {
    let s3Config: string;
    let s3Validation: TerraformModuleValidation;

    beforeAll(() => {
      s3Config = loadTerraformConfig('lib/modules/s3/main.tf');
      s3Validation = validateTerraformStandards(s3Config, 's3');
    });

    test('should have required S3 resources', () => {
      expect(s3Config).toContain('resource "aws_s3_bucket"');
      expect(s3Config).toContain('resource "aws_s3_bucket_versioning"');
      expect(s3Config).toContain('resource "aws_s3_bucket_server_side_encryption_configuration"');
      expect(s3Config).toContain('resource "aws_s3_bucket_public_access_block"');
      expect(s3Validation.resourceCount).toBeGreaterThanOrEqual(8);
    });

    test('should have CloudTrail bucket with proper configuration', () => {
      expect(s3Config).toContain('bucket = "${var.environment}-${var.organization_name}-cloudtrail-logs-');
      expect(s3Config).toContain('Purpose = "CloudTrail Logs"');
    });

    test('should have app data bucket with proper configuration', () => {
      expect(s3Config).toContain('bucket = "${var.environment}-${var.organization_name}-app-data-');
      expect(s3Config).toContain('Purpose = "Application Data"');
    });

    test('should have versioning enabled on all buckets', () => {
      expect(s3Config).toContain('versioning_configuration {');
      expect(s3Config).toContain('status = "Enabled"');
    });

    test('should have encryption enabled on all buckets', () => {
      expect(s3Config).toContain('apply_server_side_encryption_by_default');
      expect(s3Config).toContain('kms_master_key_id = var.kms_key_arn');
      expect(s3Config).toContain('sse_algorithm     = "aws:kms"');
    });

    test('should have public access blocked on all buckets', () => {
      expect(s3Config).toContain('block_public_acls       = true');
      expect(s3Config).toContain('block_public_policy     = true');
      expect(s3Config).toContain('ignore_public_acls      = true');
      expect(s3Config).toContain('restrict_public_buckets = true');
    });

    test('should have CloudTrail bucket policy with proper permissions', () => {
      expect(s3Config).toContain('"AWSCloudTrailAclCheck"');
      expect(s3Config).toContain('"AWSCloudTrailWrite"');
      expect(s3Config).toContain('"DenyInsecureConnections"');
    });

    test('should have random string for bucket naming', () => {
      expect(s3Config).toContain('resource "random_string"');
      expect(s3Config).toContain('length  = 8');
      expect(s3Config).toContain('special = false');
    });

    test('should have data sources for account and region', () => {
      expect(s3Config).toContain('data "aws_caller_identity"');
      expect(s3Config).toContain('data "aws_region"');
    });

    test('should follow security best practices', () => {
      expect(s3Validation.securityStandards).toContain('encryption_enabled');
      expect(s3Validation.securityStandards).toContain('public_access_blocked');
      expect(s3Validation.securityStandards).toContain('versioning_enabled');
    });
  });

  describe('Security Groups Module Standards', () => {
    let sgConfig: string;
    let sgValidation: TerraformModuleValidation;

    beforeAll(() => {
      sgConfig = loadTerraformConfig('lib/modules/security-groups/main.tf');
      sgValidation = validateTerraformStandards(sgConfig, 'security-groups');
    });

    test('should have all required security groups', () => {
      expect(sgConfig).toContain('resource "aws_security_group" "web"');
      expect(sgConfig).toContain('resource "aws_security_group" "app"');
      expect(sgConfig).toContain('resource "aws_security_group" "db"');
      expect(sgConfig).toContain('resource "aws_security_group" "mgmt"');
      expect(sgValidation.resourceCount).toBe(4);
    });

    test('should have proper naming conventions', () => {
      expect(sgConfig).toContain('name_prefix = "${var.environment}-${var.organization_name}-web-"');
      expect(sgConfig).toContain('name_prefix = "${var.environment}-${var.organization_name}-app-"');
      expect(sgConfig).toContain('name_prefix = "${var.environment}-${var.organization_name}-db-"');
      expect(sgConfig).toContain('name_prefix = "${var.environment}-${var.organization_name}-mgmt-"');
    });

    test('should have proper descriptions', () => {
      expect(sgConfig).toContain('description = "Security group for web tier - allows HTTP/HTTPS"');
      expect(sgConfig).toContain('description = "Security group for application tier"');
      expect(sgConfig).toContain('description = "Security group for database tier"');
      expect(sgConfig).toContain('description = "Security group for management access"');
    });

    test('should have web tier with HTTP/HTTPS access', () => {
      expect(sgConfig).toContain('from_port   = 80');
      expect(sgConfig).toContain('to_port     = 80');
      expect(sgConfig).toContain('from_port   = 443');
      expect(sgConfig).toContain('to_port     = 443');
    });

    test('should have app tier with restricted access', () => {
      expect(sgConfig).toContain('from_port       = 8080');
      expect(sgConfig).toContain('to_port         = 8080');
      expect(sgConfig).toContain('security_groups = [aws_security_group.web.id]');
    });

    test('should have database tier with most restrictive access', () => {
      expect(sgConfig).toContain('from_port       = 3306');
      expect(sgConfig).toContain('to_port         = 3306');
      expect(sgConfig).toContain('from_port       = 5432');
      expect(sgConfig).toContain('to_port         = 5432');
      expect(sgConfig).toContain('security_groups = [aws_security_group.app.id]');
    });

    test('should have management tier with SSH/RDP access', () => {
      expect(sgConfig).toContain('from_port   = 22');
      expect(sgConfig).toContain('to_port     = 22');
      expect(sgConfig).toContain('from_port   = 3389');
      expect(sgConfig).toContain('to_port     = 3389');
      expect(sgConfig).toContain('cidr_blocks = var.allowed_cidr_blocks');
    });

    test('should have proper egress rules', () => {
      expect(sgConfig).toContain('egress {');
      expect(sgConfig).toContain('from_port   = 0');
      expect(sgConfig).toContain('to_port     = 0');
      expect(sgConfig).toContain('protocol    = "-1"');
    });

    test('should have lifecycle management', () => {
      expect(sgConfig).toContain('lifecycle {');
      expect(sgConfig).toContain('create_before_destroy = true');
    });

    test('should have proper tags', () => {
      expect(sgConfig).toContain('tags = {');
      expect(sgConfig).toContain('Tier = "Web"');
      expect(sgConfig).toContain('Tier = "Application"');
      expect(sgConfig).toContain('Tier = "Database"');
      expect(sgConfig).toContain('Tier = "Management"');
    });
  });

  describe('IAM Module Standards', () => {
    let iamConfig: string;
    let iamValidation: TerraformModuleValidation;

    beforeAll(() => {
      iamConfig = loadTerraformConfig('lib/modules/iam/main.tf');
      iamValidation = validateTerraformStandards(iamConfig, 'iam');
    });

    test('should have required IAM resources', () => {
      expect(iamConfig).toContain('resource "aws_iam_account_password_policy"');
      expect(iamConfig).toContain('resource "aws_iam_role"');
      expect(iamConfig).toContain('resource "aws_iam_role_policy"');
      expect(iamConfig).toContain('resource "aws_iam_instance_profile"');
      expect(iamConfig).toContain('resource "aws_iam_user"');
      expect(iamConfig).toContain('resource "aws_iam_user_policy"');
      expect(iamValidation.resourceCount).toBeGreaterThanOrEqual(6);
    });

    test('should have strict password policy', () => {
      expect(iamConfig).toContain('minimum_password_length        = 14');
      expect(iamConfig).toContain('require_lowercase_characters   = true');
      expect(iamConfig).toContain('require_numbers                = true');
      expect(iamConfig).toContain('require_uppercase_characters   = true');
      expect(iamConfig).toContain('require_symbols                = true');
      expect(iamConfig).toContain('max_password_age               = 90');
      expect(iamConfig).toContain('password_reuse_prevention      = 12');
      expect(iamConfig).toContain('hard_expiry                    = true');
    });

    test('should have EC2 role with proper assume role policy', () => {
      expect(iamConfig).toContain('name = "${var.environment}-${var.organization_name}-ec2-role"');
      expect(iamConfig).toContain('Service = "ec2.amazonaws.com"');
      expect(iamConfig).toContain('Action = "sts:AssumeRole"');
    });

    test('should have EC2 role with minimal permissions', () => {
      expect(iamConfig).toContain('"logs:CreateLogGroup"');
      expect(iamConfig).toContain('"logs:CreateLogStream"');
      expect(iamConfig).toContain('"logs:PutLogEvents"');
      expect(iamConfig).toContain('"kms:Decrypt"');
      expect(iamConfig).toContain('"kms:GenerateDataKey"');
    });

    test('should have CloudTrail role with proper assume role policy', () => {
      expect(iamConfig).toContain('name = "${var.environment}-${var.organization_name}-cloudtrail-role"');
      expect(iamConfig).toContain('Service = "cloudtrail.amazonaws.com"');
    });

    test('should have MFA enforcement policy', () => {
      expect(iamConfig).toContain('"DenyAllExceptUnlessMFAAuthenticated"');
      expect(iamConfig).toContain('"aws:MultiFactorAuthPresent"');
      expect(iamConfig).toContain('"iam:CreateVirtualMFADevice"');
      expect(iamConfig).toContain('"iam:EnableMFADevice"');
    });

    test('should have proper naming conventions', () => {
      expect(iamConfig).toMatch(/\$\{var\.environment\}-\$\{var\.organization_name\}-ec2-role/);
      expect(iamConfig).toMatch(/\$\{var\.environment\}-\$\{var\.organization_name\}-cloudtrail-role/);
      expect(iamConfig).toMatch(/\$\{var\.environment\}-\$\{var\.organization_name\}-user/);
    });

    test('should follow security best practices', () => {
      expect(iamValidation.securityStandards.length).toBeGreaterThan(0);
      expect(iamValidation.bestPractices.length).toBeGreaterThan(0);
    });
  });

  describe('CloudTrail Module Standards', () => {
    let cloudtrailConfig: string;
    let cloudtrailValidation: TerraformModuleValidation;

    beforeAll(() => {
      cloudtrailConfig = loadTerraformConfig('lib/modules/cloudtrail/main.tf');
      cloudtrailValidation = validateTerraformStandards(cloudtrailConfig, 'cloudtrail');
    });

    test('should have required CloudTrail resources', () => {
      expect(cloudtrailConfig).toContain('resource "aws_cloudtrail"');
      expect(cloudtrailConfig).toContain('resource "aws_cloudwatch_log_group"');
      expect(cloudtrailConfig).toContain('resource "aws_iam_role"');
      expect(cloudtrailConfig).toContain('resource "aws_iam_role_policy"');
      expect(cloudtrailConfig).toContain('resource "aws_s3_bucket_policy"');
      expect(cloudtrailValidation.resourceCount).toBeGreaterThanOrEqual(5);
    });

    test('should have proper CloudTrail configuration', () => {
      expect(cloudtrailConfig).toContain('name           = "${var.environment}-${var.organization_name}-cloudtrail"');
      expect(cloudtrailConfig).toContain('s3_bucket_name = var.s3_bucket_name');
      expect(cloudtrailConfig).toContain('kms_key_id = var.kms_key_arn');
      expect(cloudtrailConfig).toContain('enable_log_file_validation = true');
      expect(cloudtrailConfig).toContain('enable_logging = true');
      expect(cloudtrailConfig).toContain('include_global_service_events = true');
      expect(cloudtrailConfig).toContain('is_multi_region_trail = true');
    });

    test('should have event selector configuration', () => {
      expect(cloudtrailConfig).toContain('event_selector {');
      expect(cloudtrailConfig).toContain('read_write_type                  = "All"');
      expect(cloudtrailConfig).toContain('include_management_events        = true');
    });

    test('should have CloudWatch log group with proper configuration', () => {
      expect(cloudtrailConfig).toContain('name              = "/aws/cloudtrail/${var.environment}-${var.organization_name}"');
      expect(cloudtrailConfig).toContain('retention_in_days = 90');
    });

    test('should have CloudTrail logs role with proper assume role policy', () => {
      expect(cloudtrailConfig).toContain('name = "${var.environment}-${var.organization_name}-cloudtrail-logs-role"');
      expect(cloudtrailConfig).toContain('Service = "cloudtrail.amazonaws.com"');
    });

    test('should have CloudTrail logs policy with proper permissions', () => {
      expect(cloudtrailConfig).toContain('"logs:CreateLogGroup"');
      expect(cloudtrailConfig).toContain('"logs:CreateLogStream"');
      expect(cloudtrailConfig).toContain('"logs:PutLogEvents"');
      expect(cloudtrailConfig).toContain('"logs:DescribeLogGroups"');
      expect(cloudtrailConfig).toContain('"logs:DescribeLogStreams"');
    });

    test('should have S3 bucket policy for CloudTrail', () => {
      expect(cloudtrailConfig).toContain('"AWSCloudTrailAclCheck"');
      expect(cloudtrailConfig).toContain('"AWSCloudTrailWrite"');
      expect(cloudtrailConfig).toContain('s3:GetBucketAcl');
      expect(cloudtrailConfig).toContain('s3:PutObject');
    });

    test('should have explicit dependencies', () => {
      expect(cloudtrailConfig).toContain('depends_on = [aws_s3_bucket_policy.cloudtrail_policy]');
    });

    test('should have data sources for account and region', () => {
      expect(cloudtrailConfig).toContain('data "aws_region"');
      expect(cloudtrailConfig).toContain('data "aws_caller_identity"');
    });

    test('should have proper tags', () => {
      expect(cloudtrailConfig).toContain('tags = {');
      expect(cloudtrailConfig).toContain('Environment = var.environment');
    });

    test('should follow security best practices', () => {
      expect(cloudtrailValidation.securityStandards.length).toBeGreaterThan(0);
      expect(cloudtrailValidation.bestPractices).toContain('explicit_dependencies');
      expect(cloudtrailValidation.bestPractices).toContain('data_sources_used');
    });
  });

  describe('Module Variables Standards', () => {
    test('should have consistent variable naming across modules', () => {
      const kmsVars = loadTerraformConfig('lib/modules/kms/variables.tf');
      const s3Vars = loadTerraformConfig('lib/modules/s3/variables.tf');
      const sgVars = loadTerraformConfig('lib/modules/security-groups/variables.tf');
      const iamVars = loadTerraformConfig('lib/modules/iam/variables.tf');
      const cloudtrailVars = loadTerraformConfig('lib/modules/cloudtrail/variables.tf');

      // All modules should have environment and organization_name variables
      [kmsVars, s3Vars, sgVars, iamVars, cloudtrailVars].forEach(vars => {
        expect(vars).toContain('variable "environment"');
        expect(vars).toContain('variable "organization_name"');
      });
    });

    test('should have proper variable descriptions', () => {
      const kmsVars = loadTerraformConfig('lib/modules/kms/variables.tf');
      expect(kmsVars).toContain('description = "Environment name"');
      expect(kmsVars).toContain('description = "Organization name"');
    });

    test('should have proper variable types', () => {
      const kmsVars = loadTerraformConfig('lib/modules/kms/variables.tf');
      expect(kmsVars).toContain('type        = string');
    });
  });

  describe('Module Outputs Standards', () => {
    test('should have consistent output naming across modules', () => {
      const kmsOutputs = loadTerraformConfig('lib/modules/kms/outputs.tf');
      const s3Outputs = loadTerraformConfig('lib/modules/s3/outputs.tf');
      const sgOutputs = loadTerraformConfig('lib/modules/security-groups/outputs.tf');
      const iamOutputs = loadTerraformConfig('lib/modules/iam/outputs.tf');
      const cloudtrailOutputs = loadTerraformConfig('lib/modules/cloudtrail/outputs.tf');

      // All modules should have proper output definitions
      [kmsOutputs, s3Outputs, sgOutputs, iamOutputs, cloudtrailOutputs].forEach(outputs => {
        expect(outputs).toContain('output "');
        expect(outputs).toContain('description =');
        expect(outputs).toContain('value       =');
      });
    });

    test('should have proper output descriptions', () => {
      const kmsOutputs = loadTerraformConfig('lib/modules/kms/outputs.tf');
      expect(kmsOutputs).toContain('description = "KMS key ID"');
      expect(kmsOutputs).toContain('description = "KMS key ARN"');
      expect(kmsOutputs).toContain('description = "KMS key alias ARN"');
    });
  });

  describe('Terraform Best Practices Compliance', () => {
    test('should use consistent resource naming patterns', () => {
      const modules = ['kms', 's3', 'security-groups', 'iam', 'cloudtrail'];
      
      modules.forEach(module => {
        const config = loadTerraformConfig(`lib/modules/${module}/main.tf`);
        expect(config).toMatch(/\$\{var\.environment\}-\$\{var\.organization_name\}/);
      });
    });

    test('should use data sources for dynamic values', () => {
      const modules = ['kms', 's3', 'cloudtrail'];
      
      modules.forEach(module => {
        const config = loadTerraformConfig(`lib/modules/${module}/main.tf`);
        expect(config).toContain('data "aws_');
      });
    });

    test('should have proper resource dependencies', () => {
      const s3Config = loadTerraformConfig('lib/modules/s3/main.tf');
      const cloudtrailConfig = loadTerraformConfig('lib/modules/cloudtrail/main.tf');
      
      expect(s3Config).toContain('aws_s3_bucket.');
      expect(cloudtrailConfig).toContain('depends_on');
    });

    test('should use variables for configurable values', () => {
      const modules = ['kms', 's3', 'security-groups', 'iam', 'cloudtrail'];
      
      modules.forEach(module => {
        const config = loadTerraformConfig(`lib/modules/${module}/main.tf`);
        expect(config).toContain('var.');
      });
    });

    test('should have proper tagging strategy', () => {
      const modules = ['kms', 's3', 'security-groups', 'iam', 'cloudtrail'];
      
      modules.forEach(module => {
        const config = loadTerraformConfig(`lib/modules/${module}/main.tf`);
        if (config.includes('tags = {')) {
          // Different modules may have different tag formatting
          expect(config).toMatch(/Name\s*=/);
        }
      });
    });
  });
});
