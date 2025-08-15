import * as fs from 'fs';
import * as path from 'path';

// --- Test Suite ---

describe('Multi-Region Terraform Configuration: ../lib/main.tf', () => {
  let mainTfContent: string;

  beforeAll(() => {
    const filePath = path.resolve(__dirname, '../lib/main.tf');
    if (!fs.existsSync(filePath)) {
      throw new Error(`Test setup failed: main.tf not found at ${filePath}`);
    }
    mainTfContent = fs.readFileSync(filePath, 'utf8');
  });

  // Helper function to normalize whitespace for more resilient regex matching.
  const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

  it('should successfully read the main.tf file', () => {
    expect(mainTfContent).not.toBeNull();
    expect(mainTfContent.length).toBeGreaterThan(0);
  });

  describe('Variable and Local Value Definitions', () => {
    it('should define required variables with correct defaults', () => {
      expect(mainTfContent).toMatch(
        /variable "your_name" {[\s\S]*?default\s*=\s*"nova-devops-team"[\s\S]*?}/m
      );
      expect(mainTfContent).toMatch(
        /variable "aws_regions" {[\s\S]*?default\s*=\s*\["us-east-1", "us-west-2"\][\s\S]*?}/m
      );
    });

    it('should define common_tags and config_rules in a locals block', () => {
      const localsBlock = mainTfContent.match(/locals {[\s\S]*?^}/m);
      expect(localsBlock).not.toBeNull();
      const normalizedLocals = normalize(localsBlock![0]);
      expect(normalizedLocals).toContain('Owner = var.your_name');
      expect(normalizedLocals).toContain(
        'Purpose = "Nova Application Baseline"'
      );
      expect(normalizedLocals).toContain(
        'config_rules = [ "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED", "ENCRYPTED_VOLUMES", "IAM_ROLE_MANAGED_POLICY_CHECK", ]'
      );
    });
  });

  describe('Data Source Configuration', () => {
    it('should define a data source to find the latest Amazon Linux 2 AMI for each region', () => {
      const amiDataBlock = mainTfContent.match(
        /data "aws_ami" "amazon_linux_2" {[\s\S]*?^}/m
      );
      expect(amiDataBlock).not.toBeNull();
      const normalizedAmi = normalize(amiDataBlock![0]);
      expect(normalizedAmi).toContain('for_each = toset(var.aws_regions)');
      expect(normalizedAmi).toContain('most_recent = true');
      expect(normalizedAmi).toContain('name = "name"');
      expect(normalizedAmi).toContain(
        'values = ["amzn2-ami-hvm-*-x86_64-gp2"]'
      );
    });

    it('should define a data source for the current caller identity', () => {
      expect(mainTfContent).toContain(
        'data "aws_caller_identity" "current" {}'
      );
    });
  });

  describe('IAM (Global Resources)', () => {
    it('should create a single IAM Role for EC2', () => {
      const iamRoleBlock = mainTfContent.match(
        /resource "aws_iam_role" "ec2_role" {[\s\S]*?^}/m
      );
      expect(iamRoleBlock).not.toBeNull();
      const normalizedRole = normalize(iamRoleBlock![0]);
      expect(normalizedRole).toContain('name = "nova-ec2-role"');
      expect(normalizedRole).toContain('Service = "ec2.amazonaws.com"');
    });

    it('should create a single IAM Instance Profile', () => {
      expect(mainTfContent).toContain(
        'resource "aws_iam_instance_profile" "ec2_profile"'
      );
    });

    it('should attach a policy granting S3 and CloudWatch Logs access', () => {
      const policyDocBlock = mainTfContent.match(
        /data "aws_iam_policy_document" "ec2_permissions" {[\s\S]*?^}/m
      );
      expect(policyDocBlock).not.toBeNull();
      const normalizedPolicy = normalize(policyDocBlock![0]);
      expect(normalizedPolicy).toContain('actions = [ "s3:GetObject" ]');
      // FIX: Add spaces around '=' and inside '[]' to match normalized string.
      expect(normalizedPolicy).toContain(
        'resources = [ "arn:aws:s3:::nova-data-bucket-${data.aws_caller_identity.current.account_id}-*/*" ]'
      );
      expect(normalizedPolicy).toContain(
        'actions = [ "logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents" ]'
      );
    });
  });

  describe('Regional Resources (KMS, S3, EC2, Config)', () => {
    it('should create a customer-managed KMS key in each region', () => {
      const kmsKeyBlock = mainTfContent.match(
        /resource "aws_kms_key" "app_key" {[\s\S]*?^}/m
      );
      expect(kmsKeyBlock).not.toBeNull();
      const normalizedKey = normalize(kmsKeyBlock![0]);
      expect(normalizedKey).toContain('for_each = toset(var.aws_regions)');
      expect(normalizedKey).toContain('deletion_window_in_days = 10');
    });

    it('should create a secure S3 bucket in each region', () => {
      const s3BucketBlock = mainTfContent.match(
        /resource "aws_s3_bucket" "data_bucket" {[\s\S]*?^}/m
      );
      expect(s3BucketBlock).not.toBeNull();
      const normalizedBucket = normalize(s3BucketBlock![0]);
      expect(normalizedBucket).toContain('for_each = toset(var.aws_regions)');
      expect(normalizedBucket).toContain(
        'bucket = "nova-data-bucket-${data.aws_caller_identity.current.account_id}-${each.key}"'
      );
    });

    it('should enforce KMS encryption on each S3 bucket', () => {
      const s3EncryptionBlock = mainTfContent.match(
        /resource "aws_s3_bucket_server_side_encryption_configuration" "data_bucket_encryption" {[\s\S]*?^}/m
      );
      expect(s3EncryptionBlock).not.toBeNull();
      const normalizedEncryption = normalize(s3EncryptionBlock![0]);
      expect(normalizedEncryption).toContain('sse_algorithm = "aws:kms"');
      expect(normalizedEncryption).toContain(
        'kms_master_key_id = aws_kms_key.app_key[each.key].arn'
      );
    });

    it('should block all public access on each S3 bucket', () => {
      const s3PabBlock = mainTfContent.match(
        /resource "aws_s3_bucket_public_access_block" "data_bucket_pac" {[\s\S]*?^}/m
      );
      expect(s3PabBlock).not.toBeNull();
      const normalizedPab = normalize(s3PabBlock![0]);
      expect(normalizedPab).toContain('block_public_acls = true');
      expect(normalizedPab).toContain('block_public_policy = true');
      expect(normalizedPab).toContain('ignore_public_acls = true');
      expect(normalizedPab).toContain('restrict_public_buckets = true');
    });

    it('should launch a t3.micro EC2 instance in each region', () => {
      const ec2InstanceBlock = mainTfContent.match(
        /resource "aws_ec2_instance" "app_server" {[\s\S]*?^}/m
      );
      expect(ec2InstanceBlock).not.toBeNull();
      const normalizedInstance = normalize(ec2InstanceBlock![0]);
      expect(normalizedInstance).toContain('for_each = toset(var.aws_regions)');
      expect(normalizedInstance).toContain('instance_type = "t3.micro"');
    });

    it('should encrypt the EC2 root volume with the correct regional KMS key', () => {
      const ec2InstanceBlock = mainTfContent.match(
        /resource "aws_ec2_instance" "app_server" {[\s\S]*?^}/m
      );
      expect(ec2InstanceBlock).not.toBeNull();
      const normalizedInstance = normalize(ec2InstanceBlock![0]);
      expect(normalizedInstance).toContain('ebs_block_device {');
      expect(normalizedInstance).toContain(
        'device_name = data.aws_ami.amazon_linux_2[each.key].root_device_name'
      );
      expect(normalizedInstance).toContain('encrypted = true');
      expect(normalizedInstance).toContain(
        'kms_key_id = aws_kms_key.app_key[each.key].arn'
      );
      // FIX: Check for the block definition specifically to avoid matching comments.
      expect(normalizedInstance).not.toContain('root_block_device {');
    });

    it('should deploy three AWS Config rules in each region', () => {
      const configRuleBlock = mainTfContent.match(
        /resource "aws_config_config_rule" "compliance_rules" {[\s\S]*?^}/m
      );
      expect(configRuleBlock).not.toBeNull();
      const normalizedRule = normalize(configRuleBlock![0]);
      expect(normalizedRule).toContain(
        'for_each = { for pair in setproduct(var.aws_regions, local.config_rules)'
      );
      expect(normalizedRule).toContain('owner = "AWS"');
    });
  });

  describe('Terraform Outputs', () => {
    it('should define a structured output named deployment_summary', () => {
      const outputBlock = mainTfContent.match(
        /output "deployment_summary" {[\s\S]*?^}/m
      );
      expect(outputBlock).not.toBeNull();
      const normalizedOutput = normalize(outputBlock![0]);
      expect(normalizedOutput).toContain(
        'value = { for region in var.aws_regions'
      );
      expect(normalizedOutput).toContain(
        's3_bucket_name = aws_s3_bucket.data_bucket[region].id'
      );
      expect(normalizedOutput).toContain(
        'ec2_instance_id = aws_ec2_instance.app_server[region].id'
      );
      expect(normalizedOutput).toContain(
        'kms_key_arn = aws_kms_key.app_key[region].arn'
      );
    });
  });
});
