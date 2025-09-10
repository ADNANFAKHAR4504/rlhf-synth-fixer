import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const LIB_DIR = path.resolve(__dirname, '../lib');

describe('TAP Stack Infrastructure Integration Tests', () => {
  beforeAll(() => {
    // Ensure we're in the lib directory for Terraform commands
    process.chdir(LIB_DIR);
  });

  describe('Terraform Configuration Validation', () => {
    test('terraform init succeeds', () => {
      expect(() => {
        execSync('terraform init -upgrade', { stdio: 'pipe' });
      }).not.toThrow();
    });

    test('terraform validate succeeds', () => {
      expect(() => {
        execSync('terraform validate', { stdio: 'pipe' });
      }).not.toThrow();
    });

    test('terraform plan succeeds without errors', () => {
      expect(() => {
        execSync('terraform plan -out=test.tfplan', {
          stdio: 'pipe',
          encoding: 'utf8',
        });
        // Clean up the plan file
        if (fs.existsSync('test.tfplan')) {
          fs.unlinkSync('test.tfplan');
        }
      }).not.toThrow();
    });
  });

  describe('Infrastructure Resource Planning', () => {
    test('plan creates expected number of resources', () => {
      const result = execSync('terraform plan', {
        stdio: 'pipe',
        encoding: 'utf8',
      });

      // Check that the plan contains key resources
      expect(result).toMatch(/aws_vpc\.main/);
      expect(result).toMatch(/aws_lb\.main/);
      expect(result).toMatch(/aws_autoscaling_group\.main/);
      expect(result).toMatch(/aws_db_instance\.main/);
      expect(result).toMatch(/aws_cloudfront_distribution\.main/);
    });

    test('security groups are properly configured', () => {
      const result = execSync('terraform plan', {
        stdio: 'pipe',
        encoding: 'utf8',
      });

      expect(result).toMatch(/aws_security_group\.alb/);
      expect(result).toMatch(/aws_security_group\.app/);
      expect(result).toMatch(/aws_security_group\.rds/);
    });

    test('monitoring and logging resources are included', () => {
      const result = execSync('terraform plan', {
        stdio: 'pipe',
        encoding: 'utf8',
      });

      expect(result).toMatch(/aws_cloudwatch_metric_alarm/);
      expect(result).toMatch(/aws_cloudtrail\.main/);
      expect(result).toMatch(/aws_flow_log\.main/);
      expect(result).toMatch(/aws_config_configuration_recorder\.main/);
    });
  });

  describe('Terraform Formatting and Best Practices', () => {
    test('terraform files are properly formatted', () => {
      expect(() => {
        execSync('terraform fmt -check', { stdio: 'pipe' });
      }).not.toThrow();
    });

    test('no deprecated resource configurations', () => {
      const tapStackContent = fs.readFileSync(
        path.join(LIB_DIR, 'tap_stack.tf'),
        'utf8'
      );

      // Check for modern resource configurations
      expect(tapStackContent).toMatch(/vpc_security_group_ids/); // Modern instead of security_groups
      expect(tapStackContent).toMatch(/domain = "vpc"/); // Modern EIP configuration
    });
  });

  afterAll(() => {
    // Clean up any leftover files
    const filesToClean = ['test.tfplan', 'sample_lambda.zip'];
    filesToClean.forEach(file => {
      if (fs.existsSync(path.join(LIB_DIR, file))) {
        fs.unlinkSync(path.join(LIB_DIR, file));
      }
    });
  });
});
