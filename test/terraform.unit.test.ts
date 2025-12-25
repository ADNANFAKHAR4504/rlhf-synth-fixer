import { readFileSync } from 'fs';
import { join } from 'path';

// Terraform infrastructure validation interface
interface TerraformInfrastructureValidation {
  resourceCount: number;
  requiredTags: string[];
  namingConvention: RegExp;
  securityStandards: string[];
  bestPractices: string[];
}

// Load Terraform configuration file
const loadTerraformConfig = (filePath: string): string => {
  try {
    return readFileSync(join(__dirname, '..', filePath), 'utf8');
  } catch (error) {
    console.error(`Failed to load Terraform config from ${filePath}:`, error);
    throw error;
  }
};

// Validate Terraform configuration standards
const validateTerraformStandards = (config: string, sectionName: string): TerraformInfrastructureValidation => {
  const validation: TerraformInfrastructureValidation = {
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

describe('Terraform Consolidated Infrastructure Unit Tests', () => {
  let mainConfig: string;
  let mainValidation: TerraformInfrastructureValidation;

  beforeAll(() => {
    mainConfig = loadTerraformConfig('lib/main.tf');
    mainValidation = validateTerraformStandards(mainConfig, 'main');
  });

  describe('Overall Infrastructure Standards', () => {
    test('should have comprehensive resource coverage', () => {
      expect(mainValidation.resourceCount).toBeGreaterThan(20);
    });

    test('should have proper variable definitions', () => {
      expect(mainConfig).toContain('variable "aws_region"');
      expect(mainConfig).toContain('variable "environment"');
      expect(mainConfig).toContain('variable "organization_name"');
      expect(mainConfig).toContain('variable "vpc_cidr"');
    });

    test('should have data sources for account information', () => {
      expect(mainConfig).toContain('data "aws_caller_identity" "current"');
      expect(mainConfig).toContain('data "aws_region" "current"');
      expect(mainConfig).toContain('data "aws_availability_zones" "available"');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC configuration', () => {
      expect(mainConfig).toContain('resource "aws_vpc" "main"');
      expect(mainConfig).toContain('enable_dns_hostnames = true');
      expect(mainConfig).toContain('enable_dns_support   = true');
    });

    test('should have Internet Gateway', () => {
      expect(mainConfig).toContain('resource "aws_internet_gateway" "main"');
    });

    test('should have public and private subnets', () => {
      expect(mainConfig).toContain('resource "aws_subnet" "public"');
      expect(mainConfig).toContain('resource "aws_subnet" "private"');
      expect(mainConfig).toContain('map_public_ip_on_launch = true');
    });

    test('should have route tables', () => {
      expect(mainConfig).toContain('resource "aws_route_table" "public"');
      expect(mainConfig).toContain('resource "aws_route_table_association" "public"');
    });
  });

  describe('KMS Resources', () => {
    test('should have KMS key with proper configuration', () => {
      expect(mainConfig).toContain('resource "aws_kms_key" "main"');
      expect(mainConfig).toContain('enable_key_rotation     = true');
      expect(mainConfig).toContain('deletion_window_in_days = 30');
    });

    test('should have KMS alias', () => {
      expect(mainConfig).toContain('resource "aws_kms_alias" "main"');
      expect(mainConfig).toContain('target_key_id = aws_kms_key.main.key_id');
    });

    test('should have KMS key policy with proper statements', () => {
      expect(mainConfig).toContain('"Enable IAM User Permissions"');
      expect(mainConfig).toContain('"Allow CloudTrail to encrypt logs"');
      expect(mainConfig).toContain('"Allow S3 service to use the key"');
    });
  });

  describe('S3 Resources', () => {
    test('should have multiple S3 buckets', () => {
      expect(mainConfig).toContain('resource "aws_s3_bucket" "cloudtrail"');
      expect(mainConfig).toContain('resource "aws_s3_bucket" "app_data"');
      expect(mainConfig).toContain('resource "aws_s3_bucket" "this"');
    });

    test('should have versioning enabled on all buckets', () => {
      expect(mainConfig).toContain('resource "aws_s3_bucket_versioning"');
      expect(mainConfig).toContain('status = "Enabled"');
    });

    test('should have encryption enabled on all buckets', () => {
      expect(mainConfig).toContain('resource "aws_s3_bucket_server_side_encryption_configuration"');
      expect(mainConfig).toContain('kms_master_key_id = aws_kms_key.main.arn');
      expect(mainConfig).toContain('sse_algorithm     = "aws:kms"');
    });

    test('should have public access blocked on all buckets', () => {
      expect(mainConfig).toContain('resource "aws_s3_bucket_public_access_block"');
      expect(mainConfig).toContain('block_public_acls       = true');
      expect(mainConfig).toContain('block_public_policy     = true');
      expect(mainConfig).toContain('ignore_public_acls      = true');
      expect(mainConfig).toContain('restrict_public_buckets = true');
    });

    test('should have lifecycle management for main bucket', () => {
      expect(mainConfig).toContain('resource "aws_s3_bucket_lifecycle_configuration"');
      expect(mainConfig).toContain('noncurrent_version_expiration');
      expect(mainConfig).toContain('abort_incomplete_multipart_upload');
    });

    test('should have bucket policies', () => {
      expect(mainConfig).toContain('resource "aws_s3_bucket_policy"');
      expect(mainConfig).toContain('"AWSCloudTrailAclCheck"');
      expect(mainConfig).toContain('"AWSCloudTrailWrite"');
      expect(mainConfig).toContain('"DenyInsecureConnections"');
    });

    test('should have random strings for bucket naming', () => {
      expect(mainConfig).toContain('resource "random_string"');
      expect(mainConfig).toContain('length  = 8');
      expect(mainConfig).toContain('special = false');
    });
  });

  describe('IAM Resources', () => {
    test('should have strict password policy', () => {
      expect(mainConfig).toContain('resource "aws_iam_account_password_policy" "strict"');
      expect(mainConfig).toContain('minimum_password_length        = 14');
      expect(mainConfig).toContain('require_lowercase_characters   = true');
      expect(mainConfig).toContain('require_numbers                = true');
      expect(mainConfig).toContain('require_uppercase_characters   = true');
      expect(mainConfig).toContain('require_symbols                = true');
      expect(mainConfig).toContain('max_password_age               = 90');
      expect(mainConfig).toContain('password_reuse_prevention      = 12');
      expect(mainConfig).toContain('hard_expiry                    = true');
    });

    test('should have EC2 role with proper configuration', () => {
      expect(mainConfig).toContain('resource "aws_iam_role" "ec2_role"');
      expect(mainConfig).toContain('Service = "ec2.amazonaws.com"');
      expect(mainConfig).toContain('Action = "sts:AssumeRole"');
    });

    test('should have EC2 role policy with minimal permissions', () => {
      expect(mainConfig).toContain('resource "aws_iam_role_policy" "ec2_policy"');
      expect(mainConfig).toContain('"logs:CreateLogGroup"');
      expect(mainConfig).toContain('"logs:CreateLogStream"');
      expect(mainConfig).toContain('"logs:PutLogEvents"');
      expect(mainConfig).toContain('"kms:Decrypt"');
      expect(mainConfig).toContain('"kms:GenerateDataKey"');
    });

    test('should have CloudTrail role', () => {
      expect(mainConfig).toContain('resource "aws_iam_role" "cloudtrail_role"');
      expect(mainConfig).toContain('Service = "cloudtrail.amazonaws.com"');
    });

    test('should have example user with MFA enforcement', () => {
      expect(mainConfig).toContain('resource "aws_iam_user" "example_user"');
      expect(mainConfig).toContain('resource "aws_iam_user_policy" "mfa_policy"');
      expect(mainConfig).toContain('"DenyAllExceptUnlessMFAAuthenticated"');
      expect(mainConfig).toContain('"aws:MultiFactorAuthPresent"');
    });

    test('should have instance profile', () => {
      expect(mainConfig).toContain('resource "aws_iam_instance_profile" "ec2_profile"');
    });
  });

  describe('Security Groups', () => {
    test('should have all required security groups', () => {
      expect(mainConfig).toContain('resource "aws_security_group" "web"');
      expect(mainConfig).toContain('resource "aws_security_group" "app"');
      expect(mainConfig).toContain('resource "aws_security_group" "db"');
      expect(mainConfig).toContain('resource "aws_security_group" "mgmt"');
    });

    test('should have proper naming conventions', () => {
      expect(mainConfig).toContain('name_prefix = "${var.environment}-${var.organization_name}-web-"');
      expect(mainConfig).toContain('name_prefix = "${var.environment}-${var.organization_name}-app-"');
      expect(mainConfig).toContain('name_prefix = "${var.environment}-${var.organization_name}-db-"');
      expect(mainConfig).toContain('name_prefix = "${var.environment}-${var.organization_name}-mgmt-"');
    });

    test('should have proper descriptions', () => {
      expect(mainConfig).toContain('description = "Security group for web tier - allows HTTP/HTTPS"');
      expect(mainConfig).toContain('description = "Security group for application tier"');
      expect(mainConfig).toContain('description = "Security group for database tier"');
      expect(mainConfig).toContain('description = "Security group for management access"');
    });

    test('should have web tier with HTTP/HTTPS access', () => {
      expect(mainConfig).toContain('from_port   = 80');
      expect(mainConfig).toContain('to_port     = 80');
      expect(mainConfig).toContain('from_port   = 443');
      expect(mainConfig).toContain('to_port     = 443');
    });

    test('should have app tier with restricted access', () => {
      expect(mainConfig).toContain('from_port       = 8080');
      expect(mainConfig).toContain('to_port         = 8080');
      expect(mainConfig).toContain('security_groups = [aws_security_group.web.id]');
    });

    test('should have database tier with most restrictive access', () => {
      expect(mainConfig).toContain('from_port       = 3306');
      expect(mainConfig).toContain('to_port         = 3306');
      expect(mainConfig).toContain('from_port       = 5432');
      expect(mainConfig).toContain('to_port         = 5432');
      expect(mainConfig).toContain('security_groups = [aws_security_group.app.id]');
    });

    test('should have management tier with SSH/RDP access', () => {
      expect(mainConfig).toContain('from_port   = 22');
      expect(mainConfig).toContain('to_port     = 22');
      expect(mainConfig).toContain('from_port   = 3389');
      expect(mainConfig).toContain('to_port     = 3389');
      expect(mainConfig).toContain('cidr_blocks = var.allowed_cidr_blocks');
    });

    test('should have lifecycle management', () => {
      expect(mainConfig).toContain('lifecycle {');
      expect(mainConfig).toContain('create_before_destroy = true');
    });
  });

  describe('CloudTrail Resources', () => {
    test('should have CloudTrail configuration', () => {
      expect(mainConfig).toContain('resource "aws_cloudtrail" "main"');
      expect(mainConfig).toContain('enable_log_file_validation = true');
      expect(mainConfig).toContain('enable_logging = true');
      expect(mainConfig).toContain('include_global_service_events = true');
      expect(mainConfig).toContain('is_multi_region_trail = true');
    });

    test('should have CloudWatch log group', () => {
      expect(mainConfig).toContain('resource "aws_cloudwatch_log_group" "cloudtrail"');
      expect(mainConfig).toContain('retention_in_days = 90');
    });

    test('should have CloudTrail IAM roles', () => {
      expect(mainConfig).toContain('resource "aws_iam_role" "cloudtrail_logs_role"');
      expect(mainConfig).toContain('resource "aws_iam_role_policy" "cloudtrail_logs_policy"');
    });
  });

  describe('Outputs', () => {
    test('should have comprehensive outputs', () => {
      expect(mainConfig).toContain('output "bucket_name"');
      expect(mainConfig).toContain('output "bucket_arn"');
      expect(mainConfig).toContain('output "kms_key_id"');
      expect(mainConfig).toContain('output "kms_key_arn"');
      expect(mainConfig).toContain('output "vpc_id"');
      expect(mainConfig).toContain('output "cloudtrail_name"');
      expect(mainConfig).toContain('output "web_security_group_id"');
    });
  });

  describe('Cleanup Resources', () => {
    test('should have null resource for cleanup', () => {
      expect(mainConfig).toContain('resource "null_resource" "s3_cleanup"');
      expect(mainConfig).toContain('when    = destroy');
      expect(mainConfig).toContain('aws s3api list-object-versions');
      expect(mainConfig).toContain('aws s3api delete-objects');
    });
  });

  describe('Security and Best Practices', () => {
    test('should follow security best practices', () => {
      expect(mainValidation.securityStandards).toContain('encryption_enabled');
      expect(mainValidation.securityStandards).toContain('public_access_blocked');
      expect(mainValidation.securityStandards).toContain('versioning_enabled');
      expect(mainValidation.securityStandards).toContain('password_policy_enabled');
      expect(mainValidation.securityStandards).toContain('mfa_enforcement');
    });

    test('should follow infrastructure best practices', () => {
      expect(mainValidation.bestPractices).toContain('lifecycle_management');
      expect(mainValidation.bestPractices).toContain('data_sources_used');
    });

    test('should have proper naming conventions throughout', () => {
      expect(mainConfig).toMatch(/\$\{var\.environment\}-\$\{var\.organization_name\}-/g);
    });

    test('should have proper tagging strategy', () => {
      expect(mainConfig).toContain('tags = {');
      expect(mainConfig).toContain('Name =');
      expect(mainConfig).toContain('Environment =');
    });
  });
});
