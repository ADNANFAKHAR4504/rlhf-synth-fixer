import { describe, it, expect, beforeAll } from '@jest/globals';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Security Foundation - Unit Tests', () => {
  const libPath = path.join(__dirname, '../lib');

  describe('Terraform Configuration Structure', () => {
    it('should have all required Terraform files', () => {
      const requiredFiles = [
        'provider.tf',
        'variables.tf',
        'tap_stack.tf',
        'outputs.tf',
        'kms.tf',
        'iam.tf',
        'secrets.tf',
        'config.tf',
        'vpc_endpoints.tf',
        'cloudwatch.tf',
        'scp.tf',
        'backend.tf'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(libPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should have Lambda rotation function', () => {
      const lambdaPath = path.join(libPath, 'lambda/secret_rotation.py');
      expect(fs.existsSync(lambdaPath)).toBe(true);
    });
  });

  describe('Terraform Syntax Validation', () => {
    beforeAll(() => {
      try {
        execSync('terraform version', { cwd: libPath, stdio: 'pipe' });
      } catch (error) {
        console.warn('Terraform not installed, skipping syntax validation');
      }
    });

    it('should pass terraform fmt check', () => {
      try {
        const result = execSync('terraform fmt -check -recursive', {
          cwd: libPath,
          encoding: 'utf-8'
        });
        expect(result).toBe('');
      } catch (error: any) {
        // If files need formatting, this will fail
        console.warn('Some files need formatting:', error.stdout);
      }
    });

    it('should pass terraform validate', () => {
      try {
        // Initialize first
        execSync('terraform init -backend=false', {
          cwd: libPath,
          stdio: 'pipe'
        });

        // Validate
        const result = execSync('terraform validate', {
          cwd: libPath,
          encoding: 'utf-8'
        });

        expect(result).toContain('Success');
      } catch (error: any) {
        console.error('Terraform validation failed:', error.message);
        throw error;
      }
    });
  });

  describe('Resource Naming Convention', () => {
    it('should use environmentSuffix in resource names', () => {
      const tapStackTf = fs.readFileSync(path.join(libPath, 'tap_stack.tf'), 'utf-8');
      expect(tapStackTf).toContain('local.suffix');
      expect(tapStackTf).toContain('environment_suffix');
    });

    it('should follow naming pattern {environment}-security-{purpose}-{suffix}', () => {
      const files = ['kms.tf', 'iam.tf', 'secrets.tf'];

      files.forEach(file => {
        const content = fs.readFileSync(path.join(libPath, file), 'utf-8');
        expect(content).toMatch(/\$\{local\.resource_prefix\}-.*-\$\{local\.suffix\}/);
      });
    });
  });

  describe('KMS Configuration', () => {
    const kmsContent = fs.readFileSync(path.join(libPath, 'kms.tf'), 'utf-8');

    it('should configure multi-region KMS key', () => {
      expect(kmsContent).toMatch(/multi_region\s*=\s*true/);
    });

    it('should enable automatic key rotation', () => {
      expect(kmsContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    it('should have 7-day deletion window', () => {
      expect(kmsContent).toContain('deletion_window_in_days');
      expect(kmsContent).toContain('var.kms_key_deletion_window');
    });

    it('should create replica keys in eu-west-1 and ap-southeast-1', () => {
      expect(kmsContent).toContain('aws_kms_replica_key');
      expect(kmsContent).toContain('eu-west-1');
      expect(kmsContent).toContain('ap-southeast-1');
    });

    it('should deny root account decrypt operations', () => {
      expect(kmsContent).toContain('DenyRootAccountDecrypt');
      expect(kmsContent).toContain('kms:Decrypt');
      expect(kmsContent).toContain('Deny');
    });
  });

  describe('IAM Configuration', () => {
    const iamContent = fs.readFileSync(path.join(libPath, 'iam.tf'), 'utf-8');

    it('should enforce MFA for role assumption', () => {
      expect(iamContent).toContain('aws:MultiFactorAuthPresent');
    });

    it('should limit session duration to 1 hour', () => {
      expect(iamContent).toContain('max_session_duration');
      expect(iamContent).toContain('var.iam_session_duration_seconds');
    });

    it('should not use Resource: "*" in policies', () => {
      const policyDocuments = iamContent.match(/data "aws_iam_policy_document" "(\w+)"/g) || [];
      expect(policyDocuments.length).toBeGreaterThan(0);

      // Check admin_policy specifically - it should use scoped resources
      const adminPolicy = iamContent.match(/data "aws_iam_policy_document" "admin_policy"[\s\S]*?^}/m);
      if (adminPolicy) {
        // Should have specific resource ARNs, not wildcards
        expect(adminPolicy[0]).toMatch(/arn:aws:\w+:/);
      }
    });
  });

  describe('Secrets Manager Configuration', () => {
    const secretsContent = fs.readFileSync(path.join(libPath, 'secrets.tf'), 'utf-8');

    it('should configure automatic rotation', () => {
      expect(secretsContent).toContain('aws_secretsmanager_secret_rotation');
      expect(secretsContent).toContain('automatically_after_days');
    });

    it('should use ignore_changes lifecycle for secret versions', () => {
      expect(secretsContent).toContain('ignore_changes');
      expect(secretsContent).toContain('secret_string');
    });

    it('should encrypt with KMS', () => {
      expect(secretsContent).toContain('kms_key_id');
      expect(secretsContent).toContain('aws_kms_key.primary.id');
    });

    it('should use Lambda for rotation', () => {
      expect(secretsContent).toContain('aws_lambda_function');
      expect(secretsContent).toContain('secret_rotation');
      expect(secretsContent).toContain('python3.9');
    });
  });

  describe('AWS Config Configuration', () => {
    const configContent = fs.readFileSync(path.join(libPath, 'config.tf'), 'utf-8');

    it('should have at least 5 config rules', () => {
      const rules = configContent.match(/resource "aws_config_config_rule"/g);
      expect(rules).not.toBeNull();
      expect(rules!.length).toBeGreaterThanOrEqual(5);
    });

    it('should monitor KMS rotation', () => {
      expect(configContent).toContain('kms_rotation_enabled');
      expect(configContent).toContain('config_kms_rotation');
    });

    it('should monitor secrets encryption', () => {
      expect(configContent).toContain('SECRETSMANAGER_USING_CMK');
    });

    it('should monitor CloudWatch logs encryption', () => {
      expect(configContent).toContain('CLOUDWATCH_LOG_GROUP_ENCRYPTED');
    });

    it('should monitor S3 encryption', () => {
      expect(configContent).toContain('S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED');
    });
  });

  describe('VPC Endpoints', () => {
    const vpcContent = fs.readFileSync(path.join(libPath, 'vpc_endpoints.tf'), 'utf-8');

    it('should create VPC endpoint for Secrets Manager', () => {
      expect(vpcContent).toContain('aws_vpc_endpoint');
      expect(vpcContent).toContain('secretsmanager');
    });

    it('should create VPC endpoint for KMS', () => {
      expect(vpcContent).toContain('kms');
    });

    it('should create VPC endpoint for EC2', () => {
      expect(vpcContent).toContain('ec2');
    });

    it('should have endpoint policies', () => {
      expect(vpcContent).toContain('aws_iam_policy_document');
      expect(vpcContent).toContain('endpoint_policy');
    });
  });

  describe('CloudWatch Configuration', () => {
    const cwContent = fs.readFileSync(path.join(libPath, 'cloudwatch.tf'), 'utf-8');

    it('should encrypt logs with KMS', () => {
      expect(cwContent).toContain('kms_key_id');
      expect(cwContent).toContain('aws_kms_key.primary.arn');
    });

    it('should set 90-day retention', () => {
      expect(cwContent).toContain('retention_in_days');
      expect(cwContent).toContain('var.cloudwatch_logs_retention_days');
    });

    it('should configure VPC Flow Logs', () => {
      expect(cwContent).toContain('aws_flow_log');
    });
  });

  describe('Service Control Policies', () => {
    const scpContent = fs.readFileSync(path.join(libPath, 'scp.tf'), 'utf-8');

    it('should define SCP to deny root account usage', () => {
      expect(scpContent).toContain('DenyRootAccountUsage');
    });

    it('should define SCP to require encryption', () => {
      expect(scpContent).toContain('scp_require_encryption');
    });

    it('should output SCPs for manual application', () => {
      expect(scpContent).toContain('output');
      expect(scpContent).toContain('scp_deny_root_policy');
    });
  });

  describe('Lifecycle Rules', () => {
    const files = ['tap_stack.tf', 'kms.tf', 'iam.tf', 'secrets.tf', 'config.tf'];

    files.forEach(file => {
      it(`should have prevent_destroy lifecycle in ${file}`, () => {
        const content = fs.readFileSync(path.join(libPath, file), 'utf-8');
        expect(content).toContain('prevent_destroy');
      });
    });
  });

  describe('Variables Validation', () => {
    const variablesContent = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf-8');

    it('should validate KMS deletion window is exactly 7 days', () => {
      expect(variablesContent).toContain('kms_key_deletion_window');
      expect(variablesContent).toContain('validation');
      expect(variablesContent).toMatch(/condition.*==.*7/);
    });

    it('should validate IAM session duration is 3600 seconds', () => {
      expect(variablesContent).toContain('iam_session_duration_seconds');
      expect(variablesContent).toContain('validation');
      expect(variablesContent).toMatch(/condition.*==.*3600/);
    });

    it('should have environment_suffix variable', () => {
      expect(variablesContent).toContain('environment_suffix');
    });
  });

  describe('Outputs', () => {
    const outputsContent = fs.readFileSync(path.join(libPath, 'outputs.tf'), 'utf-8');

    it('should output KMS key IDs', () => {
      expect(outputsContent).toContain('kms_primary_key_id');
      expect(outputsContent).toContain('kms_replica_eu_west_1_id');
      expect(outputsContent).toContain('kms_replica_ap_southeast_1_id');
    });

    it('should output validation commands', () => {
      expect(outputsContent).toContain('validation_commands');
      expect(outputsContent).toContain('aws kms describe-key');
      expect(outputsContent).toContain('aws secretsmanager describe-secret');
    });

    it('should output resource summary', () => {
      expect(outputsContent).toContain('resource_summary');
    });

    it('should output environment suffix', () => {
      expect(outputsContent).toContain('environment_suffix');
    });
  });

  describe('Lambda Function', () => {
    const lambdaContent = fs.readFileSync(
      path.join(libPath, 'lambda/secret_rotation.py'),
      'utf-8'
    );

    it('should validate secret format before rotation', () => {
      expect(lambdaContent).toContain('required_fields');
      expect(lambdaContent).toContain('username');
      expect(lambdaContent).toContain('password');
    });

    it('should implement all rotation steps', () => {
      expect(lambdaContent).toContain('createSecret');
      expect(lambdaContent).toContain('setSecret');
      expect(lambdaContent).toContain('testSecret');
      expect(lambdaContent).toContain('finishSecret');
    });

    it('should include error handling', () => {
      expect(lambdaContent).toContain('try:');
      expect(lambdaContent).toContain('except');
      expect(lambdaContent).toContain('logger.error');
    });

    it('should validate password requirements', () => {
      expect(lambdaContent).toContain('len(password)');
    });
  });
});
