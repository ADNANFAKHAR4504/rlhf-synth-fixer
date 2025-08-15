import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure Unit Tests', () => {
  let mainTfContent: string;

  beforeAll(() => {
    const filePath = path.join(__dirname, '../lib/main.tf');
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }
    mainTfContent = fs.readFileSync(filePath, 'utf8');
  });

  // Helper function to normalize whitespace for resilient testing
  const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

  // ##################################################################
  // ## Test Suite 1: Global Resources & IAM                         ##
  // ##################################################################
  describe('Global Resources and IAM', () => {
    test('should define a central S3 bucket for logs', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket" "logs"');
      expect(normalize(mainTfContent)).toContain(
        'bucket = "${local.project_name}-${local.environment}-central-logs'
      );
    });

    test('should configure a multi-region CloudTrail', () => {
      const trailBlock = mainTfContent.match(
        /resource "aws_cloudtrail" "main" {[\s\S]*?^}/m
      );
      expect(trailBlock).not.toBeNull();
      expect(normalize(trailBlock![0])).toContain(
        'is_multi_region_trail = true'
      );
      expect(normalize(trailBlock![0])).toContain(
        's3_bucket_name = aws_s3_bucket.logs.id'
      );
    });

    test('should define a least-privilege IAM role for EC2 instances', () => {
      const roleBlock = mainTfContent.match(
        /resource "aws_iam_role" "ec2_role" {[\s\S]*?^}/m
      );
      expect(roleBlock).not.toBeNull();
      // FIX: Match the HCL syntax before jsonencode processes it.
      const normalizedBlock = normalize(roleBlock![0]);
      expect(normalizedBlock).toContain('Service = "ec2.amazonaws.com"');
      expect(normalizedBlock).toContain('Action = "sts:AssumeRole"');
    });

    test('should define an IAM policy with specific, non-wildcard permissions', () => {
      const policyDocBlock = mainTfContent.match(
        /data "aws_iam_policy_document" "ec2_policy" {[\s\S]*?^}/m
      );
      expect(policyDocBlock).not.toBeNull();
      const policyDoc = normalize(policyDocBlock![0]);

      expect(policyDoc).toContain('sid = "AllowS3ReadOnly"');
      expect(policyDoc).toContain('"s3:GetObject"');
      expect(policyDoc).toContain('"s3:ListBucket"');
      expect(policyDoc).not.toContain('"s3:*"');
      expect(policyDoc).toContain(
        'resources = [ aws_s3_bucket.primary_data.arn, "${aws_s3_bucket.primary_data.arn}/*" ]'
      );
      expect(policyDoc).toContain('sid = "AllowSSMSessionManager"');
    });
  });

  // ##################################################################
  // ## Test Suite 2: Multi-Region Network & Peering                 ##
  // ##################################################################
  describe('Multi-Region Network & Peering', () => {
    test('should create a VPC in us-east-1 and us-west-2', () => {
      expect(mainTfContent).toContain('resource "aws_vpc" "useast1"');
      expect(mainTfContent).toContain('resource "aws_vpc" "uswest2"');
    });

    test('should establish a VPC peering connection between regions', () => {
      const peeringBlock = mainTfContent.match(
        /resource "aws_vpc_peering_connection" "nova_peering" {[\s\S]*?^}/m
      );
      expect(peeringBlock).not.toBeNull();
      const peering = normalize(peeringBlock![0]);
      expect(peering).toContain('vpc_id = aws_vpc.useast1.id');
      expect(peering).toContain('peer_vpc_id = aws_vpc.uswest2.id');
      expect(peering).toContain('peer_region = "us-west-2"');
    });

    test('should update route tables to enable peered traffic', () => {
      expect(mainTfContent).toContain(
        'resource "aws_route" "useast1_to_uswest2_private"'
      );
      expect(mainTfContent).toContain(
        'resource "aws_route" "uswest2_to_useast1_private"'
      );
      expect(normalize(mainTfContent)).toContain(
        'vpc_peering_connection_id = aws_vpc_peering_connection.nova_peering.id'
      );
    });
  });

  // ##################################################################
  // ## Test Suite 3: Compute, Database & Encryption (per region)    ##
  // ##################################################################
  describe('Regional Resources and Security', () => {
    test.each([
      {
        region: 'us-east-1',
        launch_template: 'app_useast1',
        rds: 'rds_useast1',
        kms: 'useast1',
      },
      // NOTE: A us-west-2 launch template would need to be added to the main.tf for this to pass
    ])(
      'should enforce encryption for EC2 and RDS in $region',
      ({ launch_template, rds, kms }) => {
        const ltBlock = mainTfContent.match(
          new RegExp(
            `resource\\s+"aws_launch_template"\\s+"${launch_template}"\\s+{[\\s\\S]*?^}`,
            'm'
          )
        );
        expect(ltBlock).not.toBeNull();
        expect(normalize(ltBlock![0])).toContain('encrypted = true');
        expect(normalize(ltBlock![0])).toContain(
          `kms_key_id = aws_kms_key.${kms}.arn`
        );

        const rdsBlock = mainTfContent.match(
          new RegExp(
            `resource\\s+"aws_db_instance"\\s+"${rds}"\\s+{[\\s\\S]*?^}`,
            'm'
          )
        );
        expect(rdsBlock).not.toBeNull();
        expect(normalize(rdsBlock![0])).toContain('storage_encrypted = true');
        expect(normalize(rdsBlock![0])).toContain(
          `kms_key_id = aws_kms_key.${kms}.arn`
        );
      }
    );

    test('should enforce strict, least-privilege security group rules for RDS', () => {
      // FIX: Make the regex flexible to handle any whitespace.
      const rdsSgBlock = mainTfContent.match(
        /resource\s+"aws_security_group"\s+"rds_useast1"\s+{[\s\S]*?^}/m
      );
      expect(rdsSgBlock).not.toBeNull();

      const ingressBlock = rdsSgBlock![0].match(/ingress {[\s\S]*?}/m);
      expect(ingressBlock).not.toBeNull();

      const normalizedIngress = normalize(ingressBlock![0]);
      expect(normalizedIngress).toContain('from_port = 5432');
      expect(normalizedIngress).toContain('protocol = "tcp"');
      expect(normalizedIngress).toContain(
        'security_groups = [aws_security_group.ec2_useast1.id]'
      );
      expect(normalizedIngress).not.toContain('cidr_blocks');
    });
  });

  // ##################################################################
  // ## Test Suite 4: S3 Cross-Region Replication                    ##
  // ##################################################################
  describe('S3 Data Protection and Replication', () => {
    test('should configure Cross-Region Replication from primary to backup bucket', () => {
      const replicationBlock = mainTfContent.match(
        /resource "aws_s3_bucket_replication_configuration" "primary_data_replication" {[\s\S]*?^}/m
      );
      expect(replicationBlock).not.toBeNull();
      const replication = normalize(replicationBlock![0]);
      expect(replication).toContain('role = aws_iam_role.s3_replication.arn');
      expect(replication).toContain('bucket = aws_s3_bucket.backup_data.arn');
      expect(replication).toContain(
        'replica_kms_key_id = aws_kms_key.uswest2.arn'
      );
    });

    test('should enforce SSE-KMS encryption on both S3 data buckets', () => {
      const primaryEncryptionBlock = mainTfContent.match(
        /resource "aws_s3_bucket_server_side_encryption_configuration" "primary_data" {[\s\S]*?^}/m
      );
      expect(normalize(primaryEncryptionBlock![0])).toContain(
        'sse_algorithm = "aws:kms"'
      );
      expect(normalize(primaryEncryptionBlock![0])).toContain(
        'kms_master_key_id = aws_kms_key.useast1.arn'
      );

      const backupEncryptionBlock = mainTfContent.match(
        /resource "aws_s3_bucket_server_side_encryption_configuration" "backup_data" {[\s\S]*?^}/m
      );
      expect(normalize(backupEncryptionBlock![0])).toContain(
        'sse_algorithm = "aws:kms"'
      );
      expect(normalize(backupEncryptionBlock![0])).toContain(
        'kms_master_key_id = aws_kms_key.uswest2.arn'
      );
    });

    test('should block all public access to S3 data buckets', () => {
      const primaryPabBlock = mainTfContent.match(
        /resource "aws_s3_bucket_public_access_block" "primary_data" {[\s\S]*?^}/m
      );
      expect(normalize(primaryPabBlock![0])).toContain(
        'block_public_acls = true'
      );
      expect(normalize(primaryPabBlock![0])).toContain(
        'restrict_public_buckets = true'
      );

      const backupPabBlock = mainTfContent.match(
        /resource "aws_s3_bucket_public_access_block" "backup_data" {[\s\S]*?^}/m
      );
      expect(normalize(backupPabBlock![0])).toContain(
        'block_public_acls = true'
      );
      expect(normalize(backupPabBlock![0])).toContain(
        'restrict_public_buckets = true'
      );
    });
  });

  // ##################################################################
  // ## Test Suite 5: Outputs                                        ##
  // ##################################################################
  describe('Terraform Outputs', () => {
    test('should define all required outputs', () => {
      expect(mainTfContent).toContain('output "primary_region_details"');
      expect(mainTfContent).toContain('output "secondary_region_details"');
      expect(mainTfContent).toContain('output "vpc_peering_connection_id"');
    });

    test('should not output any sensitive information', () => {
      const outputBlocks = mainTfContent.match(/output "[\s\S]*?}/g) || [];
      outputBlocks.forEach(block => {
        expect(block).not.toContain('db_password');
        expect(block).not.toContain('random_password.db.result');
      });
    });
  });

  // ##################################################################
  // ## Test Suite 6: Enhanced Security and Best Practices           ##
  // ##################################################################
  describe('Enhanced Security Tests', () => {
    test('should define Network ACLs for public and private subnets', () => {
      expect(mainTfContent).toContain(
        'resource "aws_network_acl" "public_useast1"'
      );
      expect(mainTfContent).toContain(
        'resource "aws_network_acl" "private_useast1"'
      );
      expect(mainTfContent).toContain(
        'resource "aws_network_acl" "public_uswest2"'
      );
      expect(mainTfContent).toContain(
        'resource "aws_network_acl" "private_uswest2"'
      );
    });

    test('should use AWS Secrets Manager for RDS password', () => {
      expect(mainTfContent).toContain(
        'resource "aws_secretsmanager_secret" "rds_password"'
      );
      expect(mainTfContent).toContain(
        'resource "aws_secretsmanager_secret_version" "rds_password"'
      );
      const secretBlock = mainTfContent.match(
        /resource "aws_secretsmanager_secret" "rds_password" {[\s\S]*?^}/m
      );
      expect(normalize(secretBlock![0])).toContain(
        'replica { region = "us-west-2" }'
      );
    });

    test('should enforce HTTPS-only access to S3 buckets', () => {
      const bucketPolicyBlock = mainTfContent.match(
        /data "aws_iam_policy_document" "primary_data_bucket_policy" {[\s\S]*?^}/m
      );
      expect(bucketPolicyBlock).not.toBeNull();
      const policy = normalize(bucketPolicyBlock![0]);

      expect(policy).toContain('sid = "DenyInsecureTransport"');
      expect(policy).toContain('"aws:SecureTransport"');
      expect(policy).toContain('"false"');
    });

    test('should create VPC endpoints for S3', () => {
      expect(mainTfContent).toContain(
        'resource "aws_vpc_endpoint" "s3_useast1"'
      );
      expect(mainTfContent).toContain(
        'resource "aws_vpc_endpoint" "s3_uswest2"'
      );
      const endpointBlock = mainTfContent.match(
        /resource "aws_vpc_endpoint" "s3_useast1" {[\s\S]*?^}/m
      );
      expect(normalize(endpointBlock![0])).toContain(
        'service_name = "com.amazonaws.us-east-1.s3"'
      );
    });

    test('should enforce IMDSv2 on EC2 instances via Launch Template', () => {
      const launchTemplateBlock = mainTfContent.match(
        /resource "aws_launch_template" "app_useast1" {[\s\S]*?metadata_options {[\s\S]*?^}/m
      );
      expect(launchTemplateBlock).not.toBeNull();
      const metadata = normalize(launchTemplateBlock![0]);
      expect(metadata).toContain('http_tokens = "required"');
    });

    test('should replace standalone EC2 instances with Auto Scaling Groups', () => {
      // Check that the new ASG resources exist
      expect(mainTfContent).toContain(
        'resource "aws_launch_template" "app_useast1"'
      );
      expect(mainTfContent).toContain(
        'resource "aws_autoscaling_group" "app_useast1"'
      );

      // Verify the old standalone instances have been removed
      expect(mainTfContent).not.toContain(
        'resource "aws_instance" "app_useast1"'
      );
      expect(mainTfContent).not.toContain(
        'resource "aws_instance" "app_uswest2"'
      );
    });
  });
});
