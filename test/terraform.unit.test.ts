import * as fs from 'fs';
import * as path from 'path';

describe('Terraform IaC - AWS Nova Model Breaking Stack', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  let mainTfContent: string;

  // Before any tests run, read the main.tf file content into a string.
  beforeAll(() => {
    const filePath = path.join(libPath, 'main.tf');
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }
    mainTfContent = fs.readFileSync(filePath, 'utf8');
  });

  // --------------------------------------------------------------------------
  // ## 🔒 1. Core Security Requirements Validation
  // --------------------------------------------------------------------------
  describe('Security Requirements Implementation', () => {
    test('S3 buckets must use server-side encryption with KMS', () => {
      expect(mainTfContent).toContain(
        'resource "aws_s3_bucket_server_side_encryption_configuration" "storage_bucket_encryption"'
      );
      const encryptionBlock = mainTfContent.match(
        /resource "aws_s3_bucket_server_side_encryption_configuration" "storage_bucket_encryption"[\s\S]*?}/
      );
      expect(encryptionBlock?.[0]).toContain('sse_algorithm     = "aws:kms"');
      expect(encryptionBlock?.[0]).toContain(
        'kms_master_key_id = aws_kms_key.s3_key.arn'
      );
    });

    test('IAM roles must adhere to the principle of least privilege', () => {
      const iamPolicyBlock = mainTfContent.match(
        /resource "aws_iam_policy" "s3_readonly_policy"[\s\S]*?policy\s*=\s*jsonencode\({[\s\S]*?}\)/
      );
      expect(iamPolicyBlock).not.toBeNull();
      const policyString = iamPolicyBlock![0];
      expect(policyString).toContain('"s3:GetObject"');
      expect(policyString).toContain('"s3:ListBucket"');
      expect(policyString).toContain('"kms:Decrypt"');
      expect(policyString).not.toContain('"s3:*"');
      expect(policyString).not.toContain('"kms:*"');
      expect(policyString).not.toContain('"iam:*"');
      expect(policyString).not.toContain('"s3:PutObject"');
      expect(policyString).not.toContain('"s3:DeleteObject"');
    });

    test('KMS key policy must restrict access to the specific S3 bucket', () => {
      const kmsPolicyBlock = mainTfContent.match(
        /resource "aws_kms_key" "s3_key"[\s\S]*?policy\s*=\s*jsonencode\({[\s\S]*?}\)/
      );
      expect(kmsPolicyBlock).not.toBeNull();
      const policyString = kmsPolicyBlock![0];
      expect(policyString).toMatch(/\bCondition\s*=/);
      expect(policyString).toContain('"aws:SourceArn"');
      expect(policyString).toMatch(
        /arn:aws:s3:::\${local.name_prefix}-storage/
      );
    });

    test('KMS key policy must reference the current account dynamically', () => {
      expect(mainTfContent).toContain('data "aws_caller_identity" "current"');
      expect(mainTfContent).toMatch(
        /account_id\s*=\s*data\.aws_caller_identity\.current\.account_id/
      );
      const kmsPolicyBlock = mainTfContent.match(
        /resource "aws_kms_key" "s3_key"[\s\S]*?policy\s*=\s*jsonencode\({[\s\S]*?}\)/
      );
      expect(kmsPolicyBlock?.[0]).toContain(
        'arn:aws:iam::${local.account_id}:root'
      );
    });
  });

  // --------------------------------------------------------------------------
  // ## ✨ 2. Best Practices and Standards Validation
  // --------------------------------------------------------------------------
  describe('Terraform Best Practices and Naming Conventions', () => {
    test('All resources must be created from scratch (no data sources for existing resources)', () => {
      expect(mainTfContent).not.toContain('data "aws_s3_bucket"');
      expect(mainTfContent).not.toContain('data "aws_iam_role"');
      expect(mainTfContent).not.toContain('data "aws_vpc"');
      expect(mainTfContent).toContain('data "aws_caller_identity" "current"');
    });

    test('Resource naming must follow the "projname-environment" pattern via locals', () => {
      expect(mainTfContent).toContain(
        'name_prefix = "${var.project_name}-${var.environment}"'
      );
      expect(mainTfContent).toContain(
        'bucket = "${local.name_prefix}-storage"'
      );
      expect(mainTfContent).toContain(
        'name = "${local.name_prefix}-ec2-s3-readonly-role"'
      );
      expect(mainTfContent).toContain(
        'name          = "alias/${local.name_prefix}-s3-key"'
      );
    });

    test('S3 buckets must have public access blocked', () => {
      expect(mainTfContent).toContain(
        'resource "aws_s3_bucket_public_access_block" "storage_bucket_pab"'
      );
      const pabBlock = mainTfContent.match(
        /resource "aws_s3_bucket_public_access_block" "storage_bucket_pab"[\s\S]*?}/
      );
      expect(pabBlock?.[0]).toContain('block_public_acls       = true');
      expect(pabBlock?.[0]).toContain('block_public_policy     = true');
      expect(pabBlock?.[0]).toContain('ignore_public_acls      = true');
      expect(pabBlock?.[0]).toContain('restrict_public_buckets = true');
    });

    test('No hardcoded credentials or account IDs should be present', () => {
      expect(mainTfContent).not.toMatch(/access_key\s*=/);
      expect(mainTfContent).not.toMatch(/secret_key\s*=/);
      expect(mainTfContent).not.toMatch(/AKIA[0-9A-Z]{16}/);
      const hardcodedAccountPattern = /arn:aws:iam::\d{12}:/;
      expect(mainTfContent).not.toMatch(hardcodedAccountPattern);
      expect(mainTfContent).not.toContain('variable "aws_account_id"');
    });

    test('Outputs for key resources must be defined', () => {
      expect(mainTfContent).toContain('output "s3_bucket_name"');
      expect(mainTfContent).toContain('output "kms_key_arn"');
      expect(mainTfContent).toContain('output "iam_role_arn"');
      expect(mainTfContent).toContain('output "aws_account_id"');
    });

    test('KMS key must have rotation enabled', () => {
      const kmsKeyBlock = mainTfContent.match(
        /resource "aws_kms_key" "s3_key"[\s\S]*?(?=resource|output|$)/
      );
      expect(kmsKeyBlock?.[0]).toContain('enable_key_rotation     = true');
    });

    test('S3 bucket must have versioning enabled', () => {
      expect(mainTfContent).toContain(
        'resource "aws_s3_bucket_versioning" "storage_bucket_versioning"'
      );
      const versioningBlock = mainTfContent.match(
        /resource "aws_s3_bucket_versioning" "storage_bucket_versioning"[\s\S]*?}/
      );
      expect(versioningBlock?.[0]).toContain('status = "Enabled"');
    });
  });

  // --------------------------------------------------------------------------
  // ## 📋 3. Configuration Structure Validation
  // --------------------------------------------------------------------------
  describe('Terraform Configuration Structure', () => {
    test('Variables should be properly declared with descriptions and defaults', () => {
      expect(mainTfContent).toContain('variable "aws_region"');
      expect(mainTfContent).toContain('variable "project_name"');
      expect(mainTfContent).toContain('variable "environment"');
      const awsRegionVar = mainTfContent.match(
        /variable "aws_region"[\s\S]*?}/
      );
      expect(awsRegionVar?.[0]).toContain('description');
      expect(awsRegionVar?.[0]).toContain('default');
    });

    test('Common tags should be defined in locals and applied consistently', () => {
      expect(mainTfContent).toMatch(/\bcommon_tags\s*=/);
      expect(mainTfContent).toContain('Project');
      expect(mainTfContent).toContain('Environment');
      expect(mainTfContent).toContain('ManagedBy');
      expect(mainTfContent).toContain('tags = merge(local.common_tags');
    });

    test('IAM role trust policy should only allow EC2 service', () => {
      const trustPolicyBlock = mainTfContent.match(
        /assume_role_policy\s*=\s*jsonencode\({[\s\S]*?}\)/
      );
      expect(trustPolicyBlock?.[0]).toMatch(
        /Service\s*=\s*"ec2.amazonaws.com"/
      );
      expect(trustPolicyBlock?.[0]).not.toContain('iam.amazonaws.com');
      expect(trustPolicyBlock?.[0]).not.toContain('lambda.amazonaws.com');
    });
  });
});
