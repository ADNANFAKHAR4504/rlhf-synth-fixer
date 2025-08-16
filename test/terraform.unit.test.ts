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
    });

    test('should conditionally create a multi-region CloudTrail', () => {
      expect(mainTfContent).toContain('resource "aws_cloudtrail" "main"');
    });

    test('should define a least-privilege IAM role for EC2 instances', () => {
      const roleBlock = mainTfContent.match(
        /resource "aws_iam_role" "ec2_role" {[\s\S]*?^}/m
      );
      expect(roleBlock).not.toBeNull();
      const normalizedBlock = normalize(roleBlock![0]);
      expect(normalizedBlock).toContain('Service = "ec2.amazonaws.com"');
    });

    test('should define an IAM policy with permissions for SSM, S3, and Secrets Manager', () => {
      const policyDocBlock = mainTfContent.match(
        /data "aws_iam_policy_document" "ec2_policy" {[\s\S]*?^}/m
      );
      expect(policyDocBlock).not.toBeNull();
      const policyDoc = normalize(policyDocBlock![0]);

      expect(policyDoc).toContain('sid = "AllowS3ReadOnly"');
      expect(policyDoc).toContain('sid = "AllowSSMSessionManager"');
      expect(policyDoc).toContain('sid = "AllowSecretsManagerRead"');
      expect(policyDoc).not.toContain('"s3:*"');
    });
  });

  // ##################################################################
  // ## Test Suite 2: Regional Resources and Security                ##
  // ##################################################################
  describe('Regional Resources and Security', () => {
    test.each([
      { region: 'us-east-1', instance: 'app_useast1', kms: 'useast1' },
      { region: 'us-west-2', instance: 'app_uswest2', kms: 'uswest2' },
    ])(
      'should enforce encryption and IMDSv2 on EC2 instance in $region',
      ({ instance, kms }) => {
        const instanceBlock = mainTfContent.match(
          new RegExp(
            `resource\\s+"aws_instance"\\s+"${instance}"\\s+{[\\s\\S]*?^}`,
            'm'
          )
        );
        expect(instanceBlock).not.toBeNull();

        const normalizedBlock = normalize(instanceBlock![0]);
        // Check for EBS encryption
        expect(normalizedBlock).toContain('encrypted = true');
        expect(normalizedBlock).toContain(
          `kms_key_id = aws_kms_key.${kms}.arn`
        );

        // Check for IMDSv2 enforcement
        expect(normalizedBlock).toContain('http_tokens = "required"');
      }
    );

    test('should enforce strict, least-privilege security group rules for RDS', () => {
      const rdsSgBlock = mainTfContent.match(
        /resource\s+"aws_security_group"\s+"rds_useast1"\s+{[\s\S]*?^}/m
      );
      expect(rdsSgBlock).not.toBeNull();

      const ingressBlock = rdsSgBlock![0].match(/ingress {[\s\S]*?}/m);
      expect(ingressBlock).not.toBeNull();

      const normalizedIngress = normalize(ingressBlock![0]);
      expect(normalizedIngress).toContain('from_port = 5432');
      expect(normalizedIngress).toContain(
        'security_groups = [aws_security_group.ec2_useast1.id]'
      );
      expect(normalizedIngress).not.toContain('cidr_blocks');
    });
  });

  // ##################################################################
  // ## Test Suite 3: Outputs                                        ##
  // ##################################################################
  describe('Terraform Outputs', () => {
    test('should define all required outputs for instances and networking', () => {
      expect(mainTfContent).toContain('output "primary_region_details"');
      expect(mainTfContent).toContain('output "secondary_region_details"');
      expect(mainTfContent).toContain('output "central_logging_bucket"');
      expect(mainTfContent).toContain('output "vpc_peering_connection_id"');
    });
  });
});
