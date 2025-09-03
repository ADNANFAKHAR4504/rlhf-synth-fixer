// Unit tests for ../lib/tap_stack.tf using lightweight static assertions
// No Terraform commands executed; we assert structure and critical safeguards.

import fs from 'fs';
import path from 'path';

const stackPath = path.resolve(__dirname, '..', 'lib', 'tap_stack.tf');
const providerPath = path.resolve(__dirname, '..', 'lib', 'provider.tf');
const variablesPath = path.resolve(__dirname, '..', 'lib', 'variables.tf');

describe('Secure AWS Infrastructure Unit Tests', () => {
  let tf: string;
  let providerContent: string;
  let variablesContent: string;

  beforeAll(() => {
    expect(fs.existsSync(stackPath)).toBe(true);
    expect(fs.existsSync(providerPath)).toBe(true);
    expect(fs.existsSync(variablesPath)).toBe(true);

    tf = fs.readFileSync(stackPath, 'utf8');
    providerContent = fs.readFileSync(providerPath, 'utf8');
    variablesContent = fs.readFileSync(variablesPath, 'utf8');
  });

  describe('File Structure and Separation', () => {
    test('tap_stack.tf exists and is not empty', () => {
      expect(tf.trim().length).toBeGreaterThan(100);
    });

    test('does NOT declare provider in tap_stack.tf (provider.tf owns providers)', () => {
      expect(tf).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test('provider.tf configures AWS provider correctly', () => {
      expect(providerContent).toMatch(/provider\s+"aws"/);
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
      expect(providerContent).toMatch(/required_version\s*=\s*">= 1\.4\.0"/);
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(providerContent).toMatch(/version\s*=\s*">= 5\.0"/);
    });

    test('variables.tf declares aws_region with us-east-1 default', () => {
      expect(variablesContent).toMatch(/variable\s+"aws_region"/);
      expect(variablesContent).toMatch(/default\s*=\s*"us-east-1"/);
    });
  });

  describe('VPC and Networking Configuration', () => {
    test('creates VPC with 10.0.0.0/16 CIDR block', () => {
      expect(tf).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(tf).toMatch(/cidr_block\s*=\s*"10\.0\.0\.0\/16"/);
      expect(tf).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(tf).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('creates Internet Gateway', () => {
      expect(tf).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(tf).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test('creates public and private subnets', () => {
      expect(tf).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(tf).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(tf).toMatch(/cidr_block\s*=\s*"10\.0\.1\.0\/24"/);
      expect(tf).toMatch(/cidr_block\s*=\s*"10\.0\.2\.0\/24"/);
      expect(tf).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test('creates NAT Gateway for private subnet outbound access', () => {
      expect(tf).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(tf).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(tf).toMatch(/allocation_id\s*=\s*aws_eip\.nat\.id/);
    });

    test('creates route tables and associations', () => {
      expect(tf).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(tf).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(tf).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(tf).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });
  });

  describe('Security Group Configuration', () => {
    test('creates restrictive security group for EC2', () => {
      expect(tf).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
      expect(tf).toMatch(/description\s*=\s*"Security group for EC2 instance with least privilege access"/);
    });

    test('security group allows SSH from VPC only (port 22)', () => {
      expect(tf).toMatch(/from_port\s*=\s*22[\s\S]*to_port\s*=\s*22[\s\S]*protocol\s*=\s*"tcp"[\s\S]*cidr_blocks\s*=\s*\[aws_vpc\.main\.cidr_block\]/);
      expect(tf).toMatch(/description\s*=\s*"SSH from VPC"/);
    });

    test('security group allows HTTPS from VPC only (port 443)', () => {
      expect(tf).toMatch(/from_port\s*=\s*443[\s\S]*to_port\s*=\s*443[\s\S]*protocol\s*=\s*"tcp"[\s\S]*cidr_blocks\s*=\s*\[aws_vpc\.main\.cidr_block\]/);
      expect(tf).toMatch(/description\s*=\s*"HTTPS from VPC"/);
    });

    test('security group allows HTTP from VPC only (port 80)', () => {
      expect(tf).toMatch(/from_port\s*=\s*80[\s\S]*to_port\s*=\s*80[\s\S]*protocol\s*=\s*"tcp"[\s\S]*cidr_blocks\s*=\s*\[aws_vpc\.main\.cidr_block\]/);
      expect(tf).toMatch(/description\s*=\s*"HTTP from VPC"/);
    });

    test('security group allows all outbound traffic', () => {
      expect(tf).toMatch(/egress[\s\S]*from_port\s*=\s*0[\s\S]*to_port\s*=\s*0[\s\S]*protocol\s*=\s*"-1"[\s\S]*cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });

    test('security group has lifecycle rule to prevent destruction issues', () => {
      expect(tf).toMatch(/lifecycle[\s\S]*create_before_destroy\s*=\s*true/);
    });
  });

  describe('KMS Encryption Configuration', () => {
    test('creates KMS key with proper configuration', () => {
      expect(tf).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
      expect(tf).toMatch(/description\s*=\s*"KMS key for.*encryption"/);
      expect(tf).toMatch(/deletion_window_in_days\s*=\s*7/);
      expect(tf).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('KMS key policy allows root permissions', () => {
      expect(tf).toMatch(/EnableRootPermissions/);
      expect(tf).toMatch(/"arn:aws:iam::\$\{data\.aws_caller_identity\.current\.account_id\}:root"/);
      expect(tf).toMatch(/"kms:\*"/);
    });

    test('KMS key policy allows EC2 and S3 services', () => {
      expect(tf).toMatch(/AllowEC2Service/);
      expect(tf).toMatch(/AllowS3Service/);
      expect(tf).toMatch(/"kms:Decrypt"/);
      expect(tf).toMatch(/"kms:GenerateDataKey"/);
    });

    test('creates KMS alias with unique naming', () => {
      expect(tf).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
      expect(tf).toMatch(/name\s*=\s*"alias\/.*-key-.*"/);
      expect(tf).toMatch(/target_key_id\s*=\s*aws_kms_key\.main\.key_id/);
    });
  });

  describe('S3 Bucket Security Configuration', () => {
    test('creates S3 bucket with unique naming', () => {
      expect(tf).toMatch(/resource\s+"aws_s3_bucket"\s+"secure_data"/);
      expect(tf).toMatch(/bucket\s*=\s*".*secure-data.*"/);
    });

    test('enables S3 bucket versioning', () => {
      expect(tf).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"secure_data"/);
      expect(tf).toMatch(/status\s*=\s*"Enabled"/);
    });

    test('configures server-side encryption with KMS', () => {
      expect(tf).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"secure_data"/);
      expect(tf).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.main\.arn/);
      expect(tf).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
      expect(tf).toMatch(/bucket_key_enabled\s*=\s*true/);
    });

    test('blocks all public access', () => {
      expect(tf).toMatch(/resource\s+"aws_s3_bucket_public_access_block"\s+"secure_data"/);
      expect(tf).toMatch(/block_public_acls\s*=\s*true/);
      expect(tf).toMatch(/block_public_policy\s*=\s*true/);
      expect(tf).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(tf).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('bucket policy enforces secure transport (TLS)', () => {
      expect(tf).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"secure_data"/);
      expect(tf).toMatch(/DenyInsecureConnections/);
      expect(tf).toMatch(/"aws:SecureTransport"\s*=\s*"false"/);
      expect(tf).toMatch(/Effect.*=.*"Deny"/);
    });

    test('bucket policy enforces encryption on uploads', () => {
      expect(tf).toMatch(/DenyUnencryptedObjectUploads/);
      expect(tf).toMatch(/"s3:x-amz-server-side-encryption"\s*=\s*"aws:kms"/);
      expect(tf).toMatch(/s3:PutObject/);
    });
  });

  describe('IAM Configuration', () => {
    test('creates IAM role for EC2 with proper assume role policy', () => {
      expect(tf).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
      expect(tf).toMatch(/assume_role_policy/);
      expect(tf).toMatch(/Service.*=.*ec2\.amazonaws\.com/);
      expect(tf).toMatch(/sts:AssumeRole/);
    });

    test('IAM policy grants least privilege S3 access', () => {
      expect(tf).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_s3_policy"/);
      expect(tf).toMatch(/"s3:GetObject"/);
      expect(tf).toMatch(/"s3:PutObject"/);
      expect(tf).toMatch(/"s3:DeleteObject"/);
      expect(tf).toMatch(/"s3:ListBucket"/);
      expect(tf).toMatch(/aws_s3_bucket\.secure_data\.arn/);
    });

    test('IAM policy includes KMS permissions for encryption', () => {
      expect(tf).toMatch(/"kms:Decrypt"/);
      expect(tf).toMatch(/"kms:GenerateDataKey"/);
      expect(tf).toMatch(/aws_kms_key\.main\.arn/);
    });

    test('creates instance profile for EC2', () => {
      expect(tf).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
      expect(tf).toMatch(/role\s*=\s*aws_iam_role\.ec2_role\.name/);
    });
  });

  describe('EC2 Instance Configuration', () => {
    test('creates EC2 instance in private subnet', () => {
      expect(tf).toMatch(/resource\s+"aws_instance"\s+"secure_instance"/);
      expect(tf).toMatch(/ami\s*=\s*data\.aws_ami\.amazon_linux\.id/);
      expect(tf).toMatch(/instance_type\s*=\s*"t3\.micro"/);
      expect(tf).toMatch(/subnet_id\s*=\s*aws_subnet\.private\.id/);
    });

    test('EC2 instance uses security group and IAM profile', () => {
      expect(tf).toMatch(/vpc_security_group_ids\s*=\s*\[aws_security_group\.ec2\.id\]/);
      expect(tf).toMatch(/iam_instance_profile\s*=\s*aws_iam_instance_profile\.ec2_profile\.name/);
    });

    test('root volume is encrypted with KMS', () => {
      expect(tf).toMatch(/root_block_device/);
      expect(tf).toMatch(/encrypted\s*=\s*true/);
      expect(tf).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
      expect(tf).toMatch(/volume_type\s*=\s*"gp3"/);
      expect(tf).toMatch(/delete_on_termination\s*=\s*true/);
    });

    test('instance has security-focused user data', () => {
      expect(tf).toMatch(/user_data\s*=\s*base64encode/);
      expect(tf).toMatch(/yum update -y/);
      expect(tf).toMatch(/awscli/);
    });

    test('EC2 instance has lifecycle rule', () => {
      expect(tf).toMatch(/lifecycle[\s\S]*create_before_destroy\s*=\s*true/);
    });
  });

  describe('Data Sources', () => {
    test('defines required data sources', () => {
      expect(tf).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
      expect(tf).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(tf).toMatch(/data\s+"aws_ami"\s+"amazon_linux"/);
    });

    test('AMI data source filters for Amazon Linux 2023', () => {
      expect(tf).toMatch(/most_recent\s*=\s*true/);
      expect(tf).toMatch(/owners\s*=\s*\["amazon"\]/);
      expect(tf).toMatch(/al2023-ami-\*-x86_64/);
      expect(tf).toMatch(/state.*=.*"available"/);
    });
  });

  describe('Tagging Strategy', () => {
    test('defines common tags in locals', () => {
      expect(tf).toMatch(/locals\s*{/);
      expect(tf).toMatch(/common_tags\s*=/);
      expect(tf).toMatch(/Environment\s*=\s*local\.environment/);
      expect(tf).toMatch(/Project\s*=\s*local\.project_name/);
      expect(tf).toMatch(/ManagedBy\s*=\s*"Terraform"/);
      expect(tf).toMatch(/Owner\s*=\s*"DevOps"/);
      expect(tf).toMatch(/Compliance\s*=\s*"Required"/);
    });

    test('resources use common tags pattern', () => {
      expect(tf).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
    });

    test('S3 bucket has data classification tag', () => {
      expect(tf).toMatch(/DataClassification\s*=\s*"Confidential"/);
    });
  });

  describe('Outputs Configuration', () => {
    test('defines all required outputs', () => {
      const expectedOutputs = [
        'vpc_id',
        'private_subnet_id',
        'ec2_instance_id',
        'ec2_private_ip',
        's3_bucket_name',
        's3_bucket_arn',
        'kms_key_id',
        'kms_key_arn'
      ];

      expectedOutputs.forEach(output => {
        expect(tf).toMatch(new RegExp(`output\\s+"${output}"`));
      });
    });

    test('outputs have proper descriptions', () => {
      expect(tf).toMatch(/description\s*=\s*"ID of the VPC"/);
      expect(tf).toMatch(/description\s*=\s*"Name of the secure S3 bucket"/);
      expect(tf).toMatch(/description\s*=\s*"ARN of the KMS key"/);
    });
  });

  describe('Random String Configuration', () => {
    test('creates random string for unique naming', () => {
      expect(tf).toMatch(/resource\s+"random_string"\s+"suffix"/);
      expect(tf).toMatch(/length\s*=\s*8/);
      expect(tf).toMatch(/special\s*=\s*false/);
      expect(tf).toMatch(/upper\s*=\s*false/);
    });
  });
});
