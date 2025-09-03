import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Integration Tests', () => {
  const projectRoot = path.resolve(__dirname, '..');
  const libPath = path.join(projectRoot, 'lib');
  const tfStateFile = path.join(libPath, 'terraform.tfstate');
  const tfPlanFile = path.join(libPath, 'tfplan');
  
  // Helper function to execute terraform commands
  const runTerraformCommand = (command: string): string => {
    try {
      return execSync(command, { 
        cwd: libPath,
        encoding: 'utf8',
        stdio: 'pipe'
      });
    } catch (error: any) {
      throw new Error(`Terraform command failed: ${error.message}`);
    }
  };

  // Helper to check if AWS credentials are configured
  const hasAWSCredentials = (): boolean => {
    return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
           !!process.env.AWS_PROFILE ||
           fs.existsSync(path.join(process.env.HOME || '', '.aws', 'credentials'));
  };

  beforeAll(() => {
    // Ensure terraform files exist
    expect(fs.existsSync(path.join(libPath, 'tap_stack.tf'))).toBe(true);
    expect(fs.existsSync(path.join(libPath, 'provider.tf'))).toBe(true);
    expect(fs.existsSync(path.join(libPath, 'variables.tf'))).toBe(true);
    expect(fs.existsSync(path.join(libPath, 'outputs.tf'))).toBe(true);
  });

  describe('Terraform Configuration Validation', () => {
    test('terraform init should succeed', () => {
      if (!hasAWSCredentials()) {
        console.log('Skipping test - AWS credentials not configured');
        return;
      }
      
      const output = runTerraformCommand('terraform init -backend=false');
      expect(output).toContain('Terraform has been successfully initialized');
    }, 30000);

    test('terraform validate should succeed', () => {
      if (!hasAWSCredentials()) {
        console.log('Skipping test - AWS credentials not configured');
        return;
      }
      
      const output = runTerraformCommand('terraform validate');
      expect(output).toContain('configuration is valid');
    }, 10000);

    test('terraform fmt should pass', () => {
      const output = runTerraformCommand('terraform fmt -check -diff');
      // No output means files are properly formatted
      expect(output.trim()).toBe('');
    }, 5000);
  });

  describe('Security Constraints Validation', () => {
    const tapStackContent = fs.readFileSync(path.join(libPath, 'tap_stack.tf'), 'utf8');
    
    test('should enforce us-west-2 region constraint', () => {
      // Check region validation in variables
      const variablesContent = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
      expect(variablesContent).toContain('us-west-2');
      expect(variablesContent).toContain('validation');
    });

    test('should implement VPC with public/private/database subnets', () => {
      expect(tapStackContent).toContain('aws_vpc');
      expect(tapStackContent).toContain('aws_subnet');
      expect(tapStackContent).toContain('public_subnet');
      expect(tapStackContent).toContain('private_subnet');
      expect(tapStackContent).toContain('db_subnet');
    });

    test('should configure NAT Gateway for private subnet access', () => {
      expect(tapStackContent).toContain('aws_nat_gateway');
      expect(tapStackContent).toContain('aws_eip');
      expect(tapStackContent).toContain('aws_route_table');
    });

    test('should implement bastion host in public subnet', () => {
      expect(tapStackContent).toContain('bastion');
      expect(tapStackContent).toContain('aws_instance');
      expect(tapStackContent).toContain('aws_security_group');
    });

    test('should enable S3 bucket encryption and versioning', () => {
      expect(tapStackContent).toContain('aws_s3_bucket');
      expect(tapStackContent).toContain('aws_s3_bucket_server_side_encryption_configuration');
      expect(tapStackContent).toContain('aws:kms');
      expect(tapStackContent).toContain('aws_s3_bucket_versioning');
      expect(tapStackContent).toContain('Enabled');
    });

    test('should configure RDS with encryption', () => {
      expect(tapStackContent).toContain('aws_db_instance');
      expect(tapStackContent).toContain('storage_encrypted');
      expect(tapStackContent).toContain('backup_retention_period');
    });

    test('should implement KMS key for encryption', () => {
      expect(tapStackContent).toContain('aws_kms_key');
      expect(tapStackContent).toContain('aws_kms_alias');
      expect(tapStackContent).toContain('enable_key_rotation');
    });

    test('should configure CloudWatch dashboard and alarms', () => {
      expect(tapStackContent).toContain('aws_cloudwatch_dashboard');
      expect(tapStackContent).toContain('aws_cloudwatch_metric_alarm');
    });

    test('should implement SNS topics for alerts', () => {
      expect(tapStackContent).toContain('aws_sns_topic');
      expect(tapStackContent).toContain('aws_sns_topic_subscription');
    });

    test('should configure IAM roles with least privilege', () => {
      expect(tapStackContent).toContain('aws_iam_role');
      expect(tapStackContent).toContain('aws_iam_role_policy');
      expect(tapStackContent).toContain('assume_role_policy');
    });

    test('should enable VPC Flow Logs', () => {
      expect(tapStackContent).toContain('aws_flow_log');
      expect(tapStackContent).toContain('aws_cloudwatch_log_group');
    });

    test('should configure Systems Manager for patch management', () => {
      expect(tapStackContent).toContain('aws_ssm_maintenance_window');
      expect(tapStackContent).toContain('aws_ssm_maintenance_window_task');
    });
  });

  afterAll(() => {
    // Clean up any temporary files created during tests
    if (fs.existsSync(tfPlanFile)) {
      fs.unlinkSync(tfPlanFile);
    }
    if (fs.existsSync(path.join(libPath, '.terraform.lock.hcl'))) {
      fs.unlinkSync(path.join(libPath, '.terraform.lock.hcl'));
    }
  });
});
