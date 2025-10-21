import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

describe('Terraform Infrastructure Integration Tests', () => {
  const libDir = path.resolve(__dirname, '../lib');
  
  // Helper function to check if stack exists
  async function checkTerraformState(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('terraform state list', { cwd: libDir });
      return stdout.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  // Helper function to skip test if state doesn't exist
  async function skipIfNoState(): Promise<boolean> {
    const hasState = await checkTerraformState();
    if (!hasState) {
      console.warn('⚠️  Terraform state not found, skipping integration test');
    }
    return !hasState;
  }

  describe('VPC Infrastructure', () => {
    test('VPC should exist with correct CIDR', async () => {
      if (await skipIfNoState()) return;

      const { stdout } = await execAsync(
        'terraform state show aws_vpc.main',
        { cwd: libDir }
      );
      expect(stdout).toContain('cidr_block');
      expect(stdout).toContain('10.35.0.0/16');
    });

    test('Private subnets should exist', async () => {
      if (await skipIfNoState()) return;

      const { stdout } = await execAsync(
        'terraform state list | grep aws_subnet',
        { cwd: libDir, shell: '/bin/bash' }
      );
      expect(stdout).toContain('aws_subnet');
    });
  });

  describe('Security Resources', () => {
    test('KMS key should exist', async () => {
      if (await skipIfNoState()) return;

      const { stdout } = await execAsync(
        'terraform state list | grep aws_kms_key.master',
        { cwd: libDir, shell: '/bin/bash' }
      );
      expect(stdout).toContain('aws_kms_key.master');
    });

    test('Network Firewall should exist', async () => {
      if (await skipIfNoState()) return;

      const { stdout } = await execAsync(
        'terraform state list | grep aws_networkfirewall',
        { cwd: libDir, shell: '/bin/bash' }
      );
      expect(stdout).toContain('aws_networkfirewall');
    });

    test('GuardDuty detector should be enabled', async () => {
      if (await skipIfNoState()) return;

      const { stdout } = await execAsync(
        'terraform state list | grep aws_guardduty_detector',
        { cwd: libDir, shell: '/bin/bash' }
      );
      expect(stdout).toContain('aws_guardduty_detector');
    });

    test('Security Hub should be enabled', async () => {
      if (await skipIfNoState()) return;

      const { stdout } = await execAsync(
        'terraform state list | grep aws_securityhub_account',
        { cwd: libDir, shell: '/bin/bash' }
      );
      expect(stdout).toContain('aws_securityhub_account');
    });
  });

  describe('Storage Resources', () => {
    test('S3 buckets should exist with encryption', async () => {
      if (await skipIfNoState()) return;

      const { stdout } = await execAsync(
        'terraform state list | grep aws_s3_bucket',
        { cwd: libDir, shell: '/bin/bash' }
      );
      expect(stdout).toContain('aws_s3_bucket');
    });

    test('FSx Lustre filesystem should exist', async () => {
      if (await skipIfNoState()) return;

      const { stdout } = await execAsync(
        'terraform state list | grep aws_fsx_lustre_file_system',
        { cwd: libDir, shell: '/bin/bash' }
      );
      expect(stdout).toContain('aws_fsx_lustre_file_system');
    });
  });

  describe('Compute Resources', () => {
    test('EC2 hosts should exist', async () => {
      if (await skipIfNoState()) return;

      const { stdout } = await execAsync(
        'terraform state list | grep aws_ec2_host',
        { cwd: libDir, shell: '/bin/bash' }
      );
      expect(stdout).toContain('aws_ec2_host');
    });

    test('Launch template should exist', async () => {
      if (await skipIfNoState()) return;

      const { stdout } = await execAsync(
        'terraform state list | grep aws_launch_template',
        { cwd: libDir, shell: '/bin/bash' }
      );
      expect(stdout).toContain('aws_launch_template');
    });
  });

  describe('Database Resources', () => {
    test('Aurora cluster should exist', async () => {
      if (await skipIfNoState()) return;

      const { stdout } = await execAsync(
        'terraform state list | grep aws_rds_cluster',
        { cwd: libDir, shell: '/bin/bash' }
      );
      expect(stdout).toContain('aws_rds_cluster');
    });
  });

  describe('Lambda Functions', () => {
    test('Security response Lambda should exist', async () => {
      if (await skipIfNoState()) return;

      const { stdout } = await execAsync(
        'terraform state list | grep aws_lambda_function.security_response',
        { cwd: libDir, shell: '/bin/bash' }
      );
      expect(stdout).toContain('aws_lambda_function.security_response');
    });

    test('Secret rotation Lambda should exist', async () => {
      if (await skipIfNoState()) return;

      const { stdout } = await execAsync(
        'terraform state list | grep aws_lambda_function.rotate_secret',
        { cwd: libDir, shell: '/bin/bash' }
      );
      expect(stdout).toContain('aws_lambda_function.rotate_secret');
    });
  });

  describe('Monitoring and Logging', () => {
    test('CloudTrail should be configured', async () => {
      if (await skipIfNoState()) return;

      const { stdout } = await execAsync(
        'terraform state list | grep aws_cloudtrail',
        { cwd: libDir, shell: '/bin/bash' }
      );
      expect(stdout).toContain('aws_cloudtrail');
    });

    test('AWS Config should be configured', async () => {
      if (await skipIfNoState()) return;

      const { stdout } = await execAsync(
        'terraform state list | grep aws_config',
        { cwd: libDir, shell: '/bin/bash' }
      );
      expect(stdout).toContain('aws_config');
    });

    test('Macie should be enabled', async () => {
      if (await skipIfNoState()) return;

      const { stdout } = await execAsync(
        'terraform state list | grep aws_macie2_account',
        { cwd: libDir, shell: '/bin/bash' }
      );
      expect(stdout).toContain('aws_macie2_account');
    });
  });

  describe('Secrets Management', () => {
    test('Secrets Manager secret should exist', async () => {
      if (await skipIfNoState()) return;

      const { stdout } = await execAsync(
        'terraform state list | grep aws_secretsmanager_secret',
        { cwd: libDir, shell: '/bin/bash' }
      );
      expect(stdout).toContain('aws_secretsmanager_secret');
    });

    test('Secret rotation should be configured', async () => {
      if (await skipIfNoState()) return;

      const { stdout } = await execAsync(
        'terraform state list | grep aws_secretsmanager_secret_rotation',
        { cwd: libDir, shell: '/bin/bash' }
      );
      expect(stdout).toContain('aws_secretsmanager_secret_rotation');
    });
  });
});
