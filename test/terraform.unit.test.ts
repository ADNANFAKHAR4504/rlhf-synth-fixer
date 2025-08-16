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

  describe('Variables and Locals', () => {
    it('should define variable your_name with default value', () => {
      const varBlock = mainTfContent.match(/variable "your_name" {[\s\S]*?^}/m);
      expect(varBlock).not.toBeNull();
      expect(normalize(varBlock![0])).toContain('default = "nova-devops-team"');
    });

    it('should define locals with common_tags', () => {
      const localsBlock = mainTfContent.match(/locals {[\s\S]*?^}/m);
      expect(localsBlock).not.toBeNull();
      const normalizedLocals = normalize(localsBlock![0]);
      expect(normalizedLocals).toContain('Owner = var.your_name');
      expect(normalizedLocals).toContain(
        'Purpose = "Nova Application Baseline"'
      );
    });
  });

  describe('Global IAM Resources', () => {
    it('should define a single, global IAM Role for EC2', () => {
      const iamRoleBlock = mainTfContent.match(
        /resource "aws_iam_role" "ec2_role" {[\s\S]*?^}/m
      );
      expect(iamRoleBlock).not.toBeNull();
      const normalizedRole = normalize(iamRoleBlock![0]);
      expect(normalizedRole).toContain('name = "nova-ec2-role"');
      expect(normalizedRole).toContain('Service = "ec2.amazonaws.com"');
    });

    it('should define a policy that grants access to S3 buckets using for_each', () => {
      const policyDocBlock = mainTfContent.match(
        /data "aws_iam_policy_document" "ec2_permissions" {[\s\S]*?^}/m
      );
      expect(policyDocBlock).not.toBeNull();
      const normalizedPolicy = normalize(policyDocBlock![0]);
      // Check for the S3 GetObject action
      expect(normalizedPolicy).toContain('actions = ["s3:GetObject"]');
      // Check that the policy uses for loop for regions
      expect(normalizedPolicy).toContain('for region in var.aws_regions');
      expect(normalizedPolicy).toContain('nova-data-bucket-');
    });

    it('should not contain overly permissive wildcard actions in the IAM policy', () => {
      const policyDocBlock = mainTfContent.match(
        /data "aws_iam_policy_document" "ec2_permissions" {[\s\S]*?^}/m
      );
      expect(policyDocBlock).not.toBeNull();
      const normalizedPolicy = normalize(policyDocBlock![0]);
      expect(normalizedPolicy).not.toContain('"s3:*"');
      expect(normalizedPolicy).not.toContain('actions = ["*"]');
    });

    it('should define an IAM instance profile linked to the EC2 role', () => {
      const profileBlock = mainTfContent.match(
        /resource "aws_iam_instance_profile" "ec2_profile" {[\s\S]*?^}/m
      );
      expect(profileBlock).not.toBeNull();
      const normalizedProfile = normalize(profileBlock![0]);
      expect(normalizedProfile).toContain('name = "nova-ec2-instance-profile"');
      expect(normalizedProfile).toContain('role = aws_iam_role.ec2_role.name');
    });

    it('should define IAM role for AWS Config', () => {
      const configRoleBlock = mainTfContent.match(
        /resource "aws_iam_role" "config_role" {[\s\S]*?^}/m
      );
      expect(configRoleBlock).not.toBeNull();
      const normalizedRole = normalize(configRoleBlock![0]);
      expect(normalizedRole).toContain('name = "nova-config-role"');
      expect(normalizedRole).toContain('Service = "config.amazonaws.com"');
    });

    it('should attach AWS Config policy to the Config role', () => {
      const configPolicyBlock = mainTfContent.match(
        /resource "aws_iam_role_policy_attachment" "config_policy" {[\s\S]*?^}/m
      );
      expect(configPolicyBlock).not.toBeNull();
      const normalizedPolicy = normalize(configPolicyBlock![0]);
      expect(normalizedPolicy).toContain(
        'role = aws_iam_role.config_role.name'
      );
      expect(normalizedPolicy).toContain(
        'arn:aws:iam::aws:policy/service-role/ConfigRole'
      );
    });
  });

  describe('DRY Regional Resources with for_each', () => {
    it('should use for_each for AMI data sources', () => {
      const amiBlock = mainTfContent.match(
        /data "aws_ami" "amazon_linux_2" {[\s\S]*?^}/m
      );
      expect(amiBlock).not.toBeNull();
      const normalizedAmi = normalize(amiBlock![0]);
      expect(normalizedAmi).toContain('for_each = toset(var.aws_regions)');
      expect(normalizedAmi).toContain('owners = ["amazon"]');
      expect(normalizedAmi).toContain(
        'values = ["amzn2-ami-hvm-*-x86_64-gp2"]'
      );
    });

    it('should use for_each for KMS keys', () => {
      const kmsKeyBlock = mainTfContent.match(
        /resource "aws_kms_key" "app_key" {[\s\S]*?^}/m
      );
      expect(kmsKeyBlock).not.toBeNull();
      const normalizedKms = normalize(kmsKeyBlock![0]);
      expect(normalizedKms).toContain('for_each = toset(var.aws_regions)');
      expect(normalizedKms).toContain('deletion_window_in_days = 10');
      expect(normalizedKms).toContain(
        'description = "KMS key for Nova (${each.value})"'
      );
    });

    it('should use for_each for KMS aliases', () => {
      const kmsAliasBlock = mainTfContent.match(
        /resource "aws_kms_alias" "app_key_alias" {[\s\S]*?^}/m
      );
      expect(kmsAliasBlock).not.toBeNull();
      const normalizedAlias = normalize(kmsAliasBlock![0]);
      expect(normalizedAlias).toContain('for_each = toset(var.aws_regions)');
      expect(normalizedAlias).toContain('name = "alias/nova-app-key"');
      expect(normalizedAlias).toContain(
        'target_key_id = aws_kms_key.app_key[each.value].id'
      );
    });

    it('should use for_each for S3 buckets', () => {
      const s3BucketBlock = mainTfContent.match(
        /resource "aws_s3_bucket" "data_bucket" {[\s\S]*?^}/m
      );
      expect(s3BucketBlock).not.toBeNull();
      const normalizedS3 = normalize(s3BucketBlock![0]);
      expect(normalizedS3).toContain('for_each = toset(var.aws_regions)');
      expect(normalizedS3).toContain(
        'bucket = "nova-data-bucket-${data.aws_caller_identity.current.account_id}-${each.value}"'
      );
    });

    it('should use for_each for S3 encryption configuration', () => {
      const s3EncryptionBlock = mainTfContent.match(
        /resource "aws_s3_bucket_server_side_encryption_configuration" "data_bucket_encryption" {[\s\S]*?^}/m
      );
      expect(s3EncryptionBlock).not.toBeNull();
      const normalizedEncryption = normalize(s3EncryptionBlock![0]);
      expect(normalizedEncryption).toContain(
        'for_each = toset(var.aws_regions)'
      );
      expect(normalizedEncryption).toContain('sse_algorithm = "aws:kms"');
      expect(normalizedEncryption).toContain(
        'kms_master_key_id = aws_kms_key.app_key[each.value].arn'
      );
    });

    it('should use for_each for S3 public access blocks', () => {
      const s3PabBlock = mainTfContent.match(
        /resource "aws_s3_bucket_public_access_block" "data_bucket_pab" {[\s\S]*?^}/m
      );
      expect(s3PabBlock).not.toBeNull();
      const normalizedPab = normalize(s3PabBlock![0]);
      expect(normalizedPab).toContain('for_each = toset(var.aws_regions)');
      expect(normalizedPab).toContain('block_public_acls = true');
      expect(normalizedPab).toContain('block_public_policy = true');
      expect(normalizedPab).toContain('ignore_public_acls = true');
      expect(normalizedPab).toContain('restrict_public_buckets = true');
    });

    it('should use for_each for EC2 instances', () => {
      const ec2Block = mainTfContent.match(
        /resource "aws_instance" "app_server" {[\s\S]*?^}/m
      );
      expect(ec2Block).not.toBeNull();
      const normalizedEc2 = normalize(ec2Block![0]);
      expect(normalizedEc2).toContain('for_each = toset(var.aws_regions)');
      expect(normalizedEc2).toContain('instance_type = "t3.micro"');
      expect(normalizedEc2).toContain(
        'iam_instance_profile = aws_iam_instance_profile.ec2_profile.name'
      );
    });

    it('should use root_block_device for EC2 encryption', () => {
      const ec2Block = mainTfContent.match(
        /resource "aws_instance" "app_server" {[\s\S]*?^}/m
      );
      expect(ec2Block).not.toBeNull();
      const normalizedEc2 = normalize(ec2Block![0]);
      expect(normalizedEc2).toContain('root_block_device {');
      expect(normalizedEc2).toContain('encrypted = true');
      expect(normalizedEc2).toContain(
        'kms_key_id = aws_kms_key.app_key[each.value].arn'
      );
      expect(normalizedEc2).not.toContain('ebs_block_device {');
    });
  });

  describe('AWS Config Resources', () => {
    it('should use for_each for Config configuration recorders', () => {
      const configRecorderBlock = mainTfContent.match(
        /resource "aws_config_configuration_recorder" "recorder" {[\s\S]*?^}/m
      );
      expect(configRecorderBlock).not.toBeNull();
      const normalizedRecorder = normalize(configRecorderBlock![0]);
      expect(normalizedRecorder).toContain('for_each = toset(var.aws_regions)');
      expect(normalizedRecorder).toContain('name = "default"');
      expect(normalizedRecorder).toContain(
        'role_arn = aws_iam_role.config_role.arn'
      );
    });

    it('should define all three required Config rules using for_each', () => {
      // Check S3 encryption rule
      const s3RuleBlock = mainTfContent.match(
        /resource "aws_config_config_rule" "s3_encryption" {[\s\S]*?^}/m
      );
      expect(s3RuleBlock).not.toBeNull();
      const normalizedS3Rule = normalize(s3RuleBlock![0]);
      expect(normalizedS3Rule).toContain('for_each = toset(var.aws_regions)');
      expect(normalizedS3Rule).toContain(
        'name = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"'
      );

      // Check EBS encryption rule
      const ebsRuleBlock = mainTfContent.match(
        /resource "aws_config_config_rule" "ebs_encryption" {[\s\S]*?^}/m
      );
      expect(ebsRuleBlock).not.toBeNull();
      const normalizedEbsRule = normalize(ebsRuleBlock![0]);
      expect(normalizedEbsRule).toContain('for_each = toset(var.aws_regions)');
      expect(normalizedEbsRule).toContain('name = "ENCRYPTED_VOLUMES"');

      // Check IAM role policy rule
      const iamRuleBlock = mainTfContent.match(
        /resource "aws_config_config_rule" "iam_role_policy" {[\s\S]*?^}/m
      );
      expect(iamRuleBlock).not.toBeNull();
      const normalizedIamRule = normalize(iamRuleBlock![0]);
      expect(normalizedIamRule).toContain('for_each = toset(var.aws_regions)');
      expect(normalizedIamRule).toContain(
        'name = "IAM_ROLE_MANAGED_POLICY_CHECK"'
      );
    });

    it('should define Config S3 buckets using for_each', () => {
      const configBucketBlock = mainTfContent.match(
        /resource "aws_s3_bucket" "config_bucket" {[\s\S]*?^}/m
      );
      expect(configBucketBlock).not.toBeNull();
      const normalizedBucket = normalize(configBucketBlock![0]);
      expect(normalizedBucket).toContain('for_each = toset(var.aws_regions)');
      expect(normalizedBucket).toContain(
        'bucket = "nova-config-bucket-${data.aws_caller_identity.current.account_id}-${each.value}"'
      );
    });
  });

  describe('Terraform Outputs', () => {
    it('should define a structured output using for loop for deployment_summary', () => {
      const outputBlock = mainTfContent.match(
        /output "deployment_summary" {[\s\S]*?^}/m
      );
      expect(outputBlock).not.toBeNull();
      const normalizedOutput = normalize(outputBlock![0]);
      // Check that the output uses for loop
      expect(normalizedOutput).toContain('for region in var.aws_regions');
      expect(normalizedOutput).toContain(
        's3_bucket_name = aws_s3_bucket.data_bucket[region].id'
      );
      expect(normalizedOutput).toContain(
        'ec2_instance_id = aws_instance.app_server[region].id'
      );
      expect(normalizedOutput).toContain(
        'kms_key_arn = aws_kms_key.app_key[region].arn'
      );
    });
  });

  describe('Provider Configuration', () => {
    it('should not have provider-specific configurations in resources', () => {
      // Resources should use for_each, not provider = aws.region
      const resourceBlocks = mainTfContent.match(
        /resource "aws_[^"]*" "[^"]*" {[\s\S]*?^}/gm
      );

      if (resourceBlocks) {
        resourceBlocks.forEach(block => {
          const normalizedBlock = normalize(block);
          // Global resources (IAM) might have provider = aws, but regional resources shouldn't have specific providers
          if (normalizedBlock.includes('for_each = toset(var.aws_regions)')) {
            expect(normalizedBlock).not.toContain('provider = aws.us-east-1');
            expect(normalizedBlock).not.toContain('provider = aws.us-west-2');
            expect(normalizedBlock).not.toContain('provider = aws.eu-north-1');
          }
        });
      }
    });
  });
});
