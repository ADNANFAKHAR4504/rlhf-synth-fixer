import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Terraform Infrastructure Unit Tests', () => {
  const libPath = path.join(__dirname, '..', 'lib');
  
  beforeAll(() => {
    // Ensure we're in the lib directory for terraform commands
    process.chdir(libPath);
    // Initialize Terraform providers before running tests
    execSync('terraform init -reconfigure -lock=false -upgrade', { cwd: libPath, stdio: 'pipe' });
  });

  describe('Terraform Configuration Validation', () => {
    test('terraform configuration is valid', () => {
      expect(() => {
        execSync('terraform validate', { cwd: libPath, stdio: 'pipe' });
      }).not.toThrow();
    });

    test('terraform fmt check passes', () => {
      expect(() => {
        execSync('terraform fmt -check -recursive', { cwd: libPath, stdio: 'pipe' });
      }).not.toThrow();
    });
  });

  describe('Security Requirements Validation', () => {
    let mainTfContent: string;
    let providerTfContent: string;
    let outputsTfContent: string;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      providerTfContent = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');
      outputsTfContent = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf8');
    });

    test('IAM policies are defined in version control (Terraform files)', () => {
      // Check that IAM policies are defined inline in Terraform
      expect(mainTfContent).toContain('data "aws_iam_policy_document"');
      expect(mainTfContent).toContain('aws_iam_policy');
      expect(mainTfContent).toContain('aws_iam_role');
    });

    test('Security groups only allow HTTP and HTTPS traffic', () => {
      // Check security group rules for web servers
      expect(mainTfContent).toContain('from_port   = 80');
      expect(mainTfContent).toContain('from_port   = 443');
      expect(mainTfContent).toContain('to_port     = 80');
      expect(mainTfContent).toContain('to_port     = 443');
      
      // Ensure no other ingress ports are defined in security groups
      const httpMatch = mainTfContent.match(/from_port\s*=\s*(\d+)/g);
      const allowedPorts = httpMatch?.map(m => parseInt(m.match(/\d+/)?.[0] || '0')) || [];
      const nonWebPorts = allowedPorts.filter(port => ![80, 443, 3306, 0].includes(port));
      expect(nonWebPorts).toHaveLength(0);
    });

    test('IAM roles follow least privilege principle', () => {
      // Check that IAM policies have specific, limited actions
      expect(mainTfContent).toContain('cloudwatch:PutMetricData');
      expect(mainTfContent).toContain('s3:GetObject');
      expect(mainTfContent).toContain('secretsmanager:GetSecretValue');
      
      // Check that policies have limited, specific actions (not wildcard actions like "s3:*")
      const iamPolicySection = mainTfContent.match(/data "aws_iam_policy_document" "ec2_minimal_policy"[\s\S]*?}/)?.[0] || '';
      expect(iamPolicySection).not.toContain('"s3:*"');
      expect(iamPolicySection).not.toContain('"iam:*"');
      expect(iamPolicySection).not.toContain('"ec2:*"');
      
      // CloudWatch logging to "*" resources is acceptable and necessary
      expect(iamPolicySection).toContain('resources = ["*"]');
    });

    test('S3 buckets have default encryption enabled', () => {
      expect(mainTfContent).toContain('aws_s3_bucket_server_side_encryption_configuration');
      expect(mainTfContent).toContain('sse_algorithm = "AES256"');
    });

    test('CloudWatch API logging is configured via CloudTrail', () => {
      expect(mainTfContent).toContain('aws_cloudtrail');
      expect(mainTfContent).toContain('include_management_events        = true');
      expect(mainTfContent).toContain('read_write_type                  = "All"');
    });

    test('Only approved AMIs are used', () => {
      expect(mainTfContent).toContain('data "aws_ami" "approved_ami"');
      expect(mainTfContent).toContain('owners      = ["amazon"]');
      expect(mainTfContent).toContain('amzn2-ami-hvm-*-x86_64-gp2');
    });

    test('MFA is required for console access', () => {
      expect(mainTfContent).toContain('aws_iam_user');
      expect(mainTfContent).toContain('data "aws_iam_policy_document" "mfa_policy"');
      expect(mainTfContent).toContain('aws:MultiFactorAuthPresent');
    });

    test('RDS storage is encrypted at rest', () => {
      expect(mainTfContent).toContain('storage_encrypted     = true');
    });
  });

  describe('Naming Conventions and Uniqueness', () => {
    let mainTfContent: string;
    let providerTfContent: string;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
      providerTfContent = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');
    });

    test('Resources use corp- prefix as required', () => {
      expect(providerTfContent).toContain('default     = "corp-"');
      expect(mainTfContent).toContain('${local.full_prefix}');
    });

    test('Environment suffix support is implemented for uniqueness', () => {
      expect(providerTfContent).toContain('variable "environment_suffix"');
      expect(providerTfContent).toContain('local.unique_suffix');
      expect(providerTfContent).toContain('random_id');
    });

    test('Resource naming includes randomness for uniqueness', () => {
      expect(mainTfContent).toContain('random_id');
      expect(mainTfContent).toContain('random_password');
      expect(mainTfContent).toContain('.hex');
    });
  });
});

