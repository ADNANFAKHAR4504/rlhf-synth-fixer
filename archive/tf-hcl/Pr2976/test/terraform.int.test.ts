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
        execSync('terraform plan -out=test.tfplan -lock=false', {
          stdio: 'pipe',
          encoding: 'utf8',
        });
        // Clean up plan file
        if (fs.existsSync('test.tfplan')) {
          fs.unlinkSync('test.tfplan');
        }
      }).not.toThrow();
    });
  });

  describe('Infrastructure Resource Planning', () => {
    test('plan creates expected number of resources', () => {
      const result = execSync('terraform plan -lock=false', {
        stdio: 'pipe',
        encoding: 'utf8',
      });

      // Check for expected resource counts
      expect(result).toContain('92 to add');
      expect(result).toMatch(/aws_vpc/);
      expect(result).toMatch(/aws_subnet/);
      expect(result).toMatch(/aws_lb/);
      expect(result).toMatch(/aws_autoscaling_group/);
    });

    test('security groups are properly configured', () => {
      const result = execSync('terraform plan -lock=false', {
        stdio: 'pipe',
        encoding: 'utf8',
      });
      expect(result).toMatch(/aws_security_group.*alb/);
      expect(result).toMatch(/aws_security_group.*app/);
      expect(result).toMatch(/aws_security_group.*rds/);
    });

    test('monitoring and logging resources are included', () => {
      const result = execSync('terraform plan -lock=false', {
        stdio: 'pipe',
        encoding: 'utf8',
      });
      expect(result).toMatch(/aws_cloudwatch_metric_alarm/);
      expect(result).toMatch(/aws_sns_topic/);
      expect(result).toMatch(/aws_cloudtrail/);
      expect(result).toMatch(/aws_cloudwatch_log_group/);
    });
  });

  describe('Terraform Formatting and Best Practices', () => {
    test('terraform files are properly formatted', () => {
      expect(() => {
        execSync('terraform fmt -check', { stdio: 'pipe' });
      }).not.toThrow();
    });

    test('no deprecated resource configurations', () => {
      const files = fs.readdirSync(LIB_DIR).filter(f => f.endsWith('.tf'));
      
      for (const file of files) {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        
        // Check for deprecated configurations
        expect(content).not.toMatch(/provider\s*\.\s*region/);
        expect(content).not.toMatch(/data\s+"template_file"/);
        expect(content).not.toMatch(/\${template_file\./);
      }
    });
  });

  afterAll(() => {
    // Clean up any test files
    const testFiles = ['test.tfplan', '.terraform.lock.hcl'];
    testFiles.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
  });
});
