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

  describe('Global IAM Resources', () => {
    it('should define a single, global IAM Role for EC2', () => {
      const iamRoleBlock = mainTfContent.match(
        /resource "aws_iam_role" "ec2_role" {[\s\S]*?^}/m
      );
      expect(iamRoleBlock).not.toBeNull();
      const normalizedRole = normalize(iamRoleBlock![0]);
      expect(normalizedRole).toContain('name = "nova-ec2-role-291844"');
      expect(normalizedRole).toContain('Service = "ec2.amazonaws.com"');
    });

    it('should define a policy that grants access to S3 buckets in both regions', () => {
      const policyDocBlock = mainTfContent.match(
        /data "aws_iam_policy_document" "ec2_permissions" {[\s\S]*?^}/m
      );
      expect(policyDocBlock).not.toBeNull();
      const normalizedPolicy = normalize(policyDocBlock![0]);
      // Check for the S3 GetObject action
      expect(normalizedPolicy).toContain('actions = ["s3:GetObject"]');
      // Check that the policy references both explicit S3 bucket ARNs
      expect(normalizedPolicy).toContain(
        '"${aws_s3_bucket.data_bucket_eu_north_1.arn}/*"'
      );
      expect(normalizedPolicy).toContain(
        '"${aws_s3_bucket.data_bucket_us_west_2.arn}/*"'
      );
    });

    it('should not contain overly permissive wildcard actions in the IAM policy', () => {
      const policyDocBlock = mainTfContent.match(
        /data "aws_iam_policy_document" "ec2_permissions" {[\s\S]*?^}/m
      );
      expect(policyDocBlock).not.toBeNull();
      const normalizedPolicy = normalize(policyDocBlock![0]);
      expect(normalizedPolicy).not.toContain('"s3:*"');
      expect(normalizedPolicy).not.toContain('"*"');
    });

    it('should define an IAM instance profile linked to the EC2 role', () => {
      const profileBlock = mainTfContent.match(
        /resource "aws_iam_instance_profile" "ec2_profile" {[\s\S]*?^}/m
      );
      expect(profileBlock).not.toBeNull();
      const normalizedProfile = normalize(profileBlock![0]);
      expect(normalizedProfile).toContain(
        'name = "nova-ec2-instance-profile-291844"'
      );
      expect(normalizedProfile).toContain('role = aws_iam_role.ec2_role.name');
    });
  });

  describe('Per-Region Resource Validation', () => {
    // This test uses Jest's 'each' feature to run the same validation logic for both regions.
    test.each([
      { region: 'eu-north-1', provider: 'aws.eu-north-1' },
      { region: 'us-west-2', provider: 'aws.us-west-2' },
    ])(
      'should have correctly configured KMS, S3, and EC2 resources for $region',
      ({ region, provider }) => {
        const regionSuffix = region.replace(/-/g, '_');

        // Validate KMS Key
        const kmsKeyRegex = new RegExp(
          `resource "aws_kms_key" "app_key_${regionSuffix}" {[\\s\\S]*?^}`,
          'm'
        );
        const kmsKeyBlock = mainTfContent.match(kmsKeyRegex);
        expect(kmsKeyBlock).not.toBeNull();
        const normalizedKms = normalize(kmsKeyBlock![0]);
        expect(normalizedKms).toContain(`provider = ${provider}`);
        expect(normalizedKms).toContain('deletion_window_in_days = 10');

        // Validate S3 Bucket
        const s3BucketRegex = new RegExp(
          `resource "aws_s3_bucket" "data_bucket_${regionSuffix}" {[\\s\\S]*?^}`,
          'm'
        );
        const s3BucketBlock = mainTfContent.match(s3BucketRegex);
        expect(s3BucketBlock).not.toBeNull();
        const normalizedS3 = normalize(s3BucketBlock![0]);
        expect(normalizedS3).toContain(`provider = ${provider}`);
        expect(normalizedS3).toContain(`bucket = "nova-data-bucket-`);

        // Validate S3 Public Access Block
        const s3PabRegex = new RegExp(
          `resource "aws_s3_bucket_public_access_block" "data_bucket_pac_${regionSuffix}" {[\\s\\S]*?^}`,
          'm'
        );
        const s3PabBlock = mainTfContent.match(s3PabRegex);
        expect(s3PabBlock).not.toBeNull();
        expect(normalize(s3PabBlock![0])).toContain('block_public_acls = true');

        // FIX: Change regex to look for the correct 'aws_instance' resource type.
        const ec2Regex = new RegExp(
          `resource "aws_instance" "app_server_${regionSuffix}_291844" {[\\s\\S]*?^}`,
          'm'
        );
        const ec2Block = mainTfContent.match(ec2Regex);
        expect(ec2Block).not.toBeNull();
        const normalizedEc2 = normalize(ec2Block![0]);
        expect(normalizedEc2).toContain(`provider = ${provider}`);
        expect(normalizedEc2).toContain('instance_type = "t3.micro"');
        expect(normalizedEc2).toContain('encrypted = true');
        expect(normalizedEc2).toContain(
          `kms_key_id = aws_kms_key.app_key_${regionSuffix}.arn`
        );
      }
    );

    test.each([
      { region: 'eu-north-1', provider: 'aws.eu-north-1' },
      { region: 'us-west-2', provider: 'aws.us-west-2' },
    ])(
      'should have a correctly named KMS alias for $region',
      ({ region, provider }) => {
        const regionSuffix = region.replace(/-/g, '_');
        const aliasRegex = new RegExp(
          `resource "aws_kms_alias" "app_key_alias_${regionSuffix}" {[\\s\\S]*?^}`,
          'm'
        );
        const aliasBlock = mainTfContent.match(aliasRegex);
        expect(aliasBlock).not.toBeNull();
        const normalizedAlias = normalize(aliasBlock![0]);
        expect(normalizedAlias).toContain(`provider = ${provider}`);
        expect(normalizedAlias).toContain('name = "alias/nova-app-key-291844"');
        expect(normalizedAlias).toContain(
          `target_key_id = aws_kms_key.app_key_${regionSuffix}.id`
        );
      }
    );

    test.each([
      { region: 'eu-north-1', provider: 'aws.eu-north-1' },
      { region: 'us-west-2', provider: 'aws.us-west-2' },
    ])(
      'should enforce SSE-KMS encryption on the S3 bucket for $region',
      ({ region, provider }) => {
        const regionSuffix = region.replace(/-/g, '_');
        const encryptionRegex = new RegExp(
          `resource "aws_s3_bucket_server_side_encryption_configuration" "data_bucket_encryption_${regionSuffix}" {[\\s\\S]*?^}`,
          'm'
        );
        const encryptionBlock = mainTfContent.match(encryptionRegex);
        expect(encryptionBlock).not.toBeNull();
        const normalizedEncryption = normalize(encryptionBlock![0]);
        expect(normalizedEncryption).toContain(`provider = ${provider}`);
        expect(normalizedEncryption).toContain('sse_algorithm = "aws:kms"');
        expect(normalizedEncryption).toContain(
          `kms_master_key_id = aws_kms_key.app_key_${regionSuffix}.arn`
        );
      }
    );

    test.each([{ region: 'eu-north-1' }, { region: 'us-west-2' }])(
      'should use ebs_block_device for root volume encryption on EC2 instance in $region',
      ({ region }) => {
        const regionSuffix = region.replace(/-/g, '_');
        // FIX: Change regex to look for the correct 'aws_instance' resource type.
        const ec2Regex = new RegExp(
          `resource "aws_instance" "app_server_${regionSuffix}_291844" {[\\s\\S]*?^}`,
          'm'
        );
        const ec2Block = mainTfContent.match(ec2Regex);
        expect(ec2Block).not.toBeNull();
        const normalizedEc2 = normalize(ec2Block![0]);
        expect(normalizedEc2).toContain('ebs_block_device {');
        expect(normalizedEc2).not.toContain('root_block_device {');
      }
    );

    test.each([{ region: 'eu-north-1' }, { region: 'us-west-2' }])(
      'should define all required AWS Config rules for $region',
      ({ region }) => {
        const regionSuffix = region.replace(/-/g, '_');
        const s3Rule = mainTfContent.match(
          new RegExp(
            `resource "aws_config_config_rule" "s3_encryption_${regionSuffix}"`,
            'm'
          )
        );
        const ebsRule = mainTfContent.match(
          new RegExp(
            `resource "aws_config_config_rule" "ebs_encryption_${regionSuffix}"`,
            'm'
          )
        );

        expect(s3Rule).not.toBeNull();
        expect(ebsRule).not.toBeNull();
      }
    );
  });

  describe('Terraform Outputs', () => {
    test.each([{ region: 'eu-north-1' }, { region: 'us-west-2' }])(
      'should define a structured output for $region in deployment_summary',
      ({ region }) => {
        const outputBlock = mainTfContent.match(
          /output "deployment_summary" {[\s\S]*?^}/m
        );
        expect(outputBlock).not.toBeNull();
        const normalizedOutput = normalize(outputBlock![0]);
        const regionSuffix = region.replace(/-/g, '_');

        // Check that the output block correctly references the explicit resources for the given region
        expect(normalizedOutput).toContain(
          `"${region}" = { s3_bucket_name = aws_s3_bucket.data_bucket_${regionSuffix}.id`
        );
        expect(normalizedOutput).toContain(
          `ec2_instance_id = aws_instance.app_server_${regionSuffix}_291844.id`
        );
        expect(normalizedOutput).toContain(
          `kms_key_arn = aws_kms_key.app_key_${regionSuffix}.arn`
        );
      }
    );
  });
});
