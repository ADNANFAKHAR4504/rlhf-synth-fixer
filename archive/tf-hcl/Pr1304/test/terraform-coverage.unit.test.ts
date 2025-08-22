import * as fs from 'fs';
import * as path from 'path';
import { TerraformInfrastructure } from '../lib/terraform-wrapper';

describe('TerraformInfrastructure Branch Coverage Tests', () => {
  describe('Edge cases and error handling', () => {
    test('should handle non-existent directory', () => {
      const tfInfra = new TerraformInfrastructure('/non/existent/path');
      expect(tfInfra.getFileContent('main.tf')).toBeUndefined();
      expect(tfInfra.hasResource('aws_s3_bucket', 'test')).toBe(false);
      expect(tfInfra.hasVariable('test')).toBe(false);
      expect(tfInfra.hasOutput('test')).toBe(false);
    });

    test('should handle empty file content', () => {
      const tempDir = path.join(__dirname, 'temp-test');
      fs.mkdirSync(tempDir, { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'main.tf'), '');
      fs.writeFileSync(path.join(tempDir, 'variables.tf'), '');
      fs.writeFileSync(path.join(tempDir, 'outputs.tf'), '');

      const tfInfra = new TerraformInfrastructure(tempDir);
      
      expect(tfInfra.hasResource('aws_s3_bucket', 'test')).toBe(false);
      expect(tfInfra.hasVariable('test')).toBe(false);
      expect(tfInfra.hasOutput('test')).toBe(false);
      expect(tfInfra.getResourcesOfType('aws_s3_bucket')).toEqual([]);
      expect(tfInfra.getAllVariables()).toEqual([]);
      expect(tfInfra.getAllOutputs()).toEqual([]);
      expect(tfInfra.usesLocals()).toBe(false);
      expect(tfInfra.hasSecurityFeature('encryption')).toBe(false);
      expect(tfInfra.getEnvironmentSuffixUsage()).toBe(0);
      expect(tfInfra.countResourcesWithTag('test')).toBe(0);

      // Cleanup
      fs.rmSync(tempDir, { recursive: true });
    });

    test('should handle malformed resource blocks', () => {
      const tempDir = path.join(__dirname, 'temp-malformed');
      fs.mkdirSync(tempDir, { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'main.tf'), `
        resource "aws_s3_bucket" "test" 
        # Missing closing brace
      `);

      const tfInfra = new TerraformInfrastructure(tempDir);
      
      expect(tfInfra.resourceHasConfig('aws_s3_bucket', 'test', 'tags')).toBe(false);
      expect(tfInfra.resourceHasTags('aws_s3_bucket', 'test')).toBe(false);

      // Cleanup with error handling
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.warn('Cleanup warning:', error);
      }
    });

    test('should handle validation errors gracefully', () => {
      const tempDir = path.join(__dirname, 'temp-invalid');
      fs.mkdirSync(tempDir, { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'main.tf'), 'invalid terraform syntax {');

      const tfInfra = new TerraformInfrastructure(tempDir);
      const validation = tfInfra.validateConfiguration();
      
      expect(validation.valid).toBe(false);
      expect(validation.message).toBeDefined();

      // Cleanup with error handling
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.warn('Cleanup warning:', error);
      }
    });

    test('should handle formatting check errors', () => {
      const tempDir = path.join(__dirname, 'temp-unformatted');
      fs.mkdirSync(tempDir, { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'main.tf'), `
resource   "aws_s3_bucket"    "test"    {
bucket =    "test"
}
      `);

      const tfInfra = new TerraformInfrastructure(tempDir);
      const isFormatted = tfInfra.checkFormatting();
      
      // This might be false if terraform fmt detects issues
      expect(typeof isFormatted).toBe('boolean');

      // Cleanup with error handling
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.warn('Cleanup warning:', error);
      }
    });

    test('should handle compliance validation with missing components', () => {
      const tempDir = path.join(__dirname, 'temp-noncompliant');
      fs.mkdirSync(tempDir, { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'main.tf'), `
        resource "aws_s3_bucket" "test" {
          bucket = "test"
        }
      `);
      fs.writeFileSync(path.join(tempDir, 'variables.tf'), '');
      fs.writeFileSync(path.join(tempDir, 'outputs.tf'), '');

      const tfInfra = new TerraformInfrastructure(tempDir);
      const compliance = tfInfra.validateCompliance();
      
      expect(compliance.compliant).toBe(false);
      expect(compliance.issues.length).toBeGreaterThan(0);
      expect(compliance.issues).toContain('Missing project_name variable');
      expect(compliance.issues).toContain('Missing environment_suffix variable');
      expect(compliance.issues).toContain('Should have at least 2 S3 buckets (main and logs)');
      expect(compliance.issues).toContain('Missing KMS key for encryption');
      expect(compliance.issues).toContain('No IAM roles defined');
      expect(compliance.issues).toContain('CloudTrail not configured');
      expect(compliance.issues).toContain('No CloudWatch alarms configured');

      // Cleanup with error handling
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.warn('Cleanup warning:', error);
      }
    });

    test('should handle counting resources with tag value', () => {
      const tempDir = path.join(__dirname, 'temp-tags');
      fs.mkdirSync(tempDir, { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'main.tf'), `
        resource "aws_s3_bucket" "test1" {
          tags = {
            Environment = "prod"
            ManagedBy = "terraform"
          }
        }
        resource "aws_s3_bucket" "test2" {
          tags = {
            Environment = "dev"
            ManagedBy = "terraform"
          }
        }
      `);

      const tfInfra = new TerraformInfrastructure(tempDir);
      
      const prodCount = tfInfra.countResourcesWithTag('Environment', 'prod');
      expect(prodCount).toBe(1);
      
      const devCount = tfInfra.countResourcesWithTag('Environment', 'dev');
      expect(devCount).toBe(1);
      
      const managedCount = tfInfra.countResourcesWithTag('ManagedBy', 'terraform');
      expect(managedCount).toBe(2);

      // Cleanup with error handling
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.warn('Cleanup warning:', error);
      }
    });

    test('should handle all security feature patterns', () => {
      const tempDir = path.join(__dirname, 'temp-security');
      fs.mkdirSync(tempDir, { recursive: true });
      
      // Test each security feature pattern
      const securityFeatures = [
        { feature: 'encryption', content: 'encryption_at_rest = true' },
        { feature: 'versioning', content: 'versioning_enabled = true' },
        { feature: 'logging', content: 'logging_configuration {}' },
        { feature: 'monitoring', content: 'cloudwatch_metrics_enabled = true' },
        { feature: 'public_access_block', content: 'public_access_block {}' },
        { feature: 'least_privilege', content: 'description = "Least privilege access"' }
      ];

      securityFeatures.forEach(({ feature, content }) => {
        fs.writeFileSync(path.join(tempDir, 'main.tf'), `
          resource "test" "test" {
            ${content}
          }
        `);

        const tfInfra = new TerraformInfrastructure(tempDir);
        expect(tfInfra.hasSecurityFeature(feature)).toBe(true);
      });

      // Test unknown feature
      const tfInfra = new TerraformInfrastructure(tempDir);
      expect(tfInfra.hasSecurityFeature('unknown_feature')).toBe(false);

      // Cleanup with error handling
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.warn('Cleanup warning:', error);
      }
    });

    test('should handle resourceHasConfig with non-existent resource', () => {
      const tfInfra = new TerraformInfrastructure(path.join(__dirname, '..', 'lib'));
      
      // Non-existent resource
      expect(tfInfra.resourceHasConfig('aws_s3_bucket', 'nonexistent', 'tags')).toBe(false);
      
      // Existing resource with specific config
      expect(tfInfra.resourceHasConfig('aws_s3_bucket', 'main_bucket', 'force_destroy')).toBe(true);
      expect(tfInfra.resourceHasConfig('aws_s3_bucket', 'access_logs', 'force_destroy')).toBe(true);
    });

    test('should handle complex resource block parsing', () => {
      const tempDir = path.join(__dirname, 'temp-complex');
      fs.mkdirSync(tempDir, { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'main.tf'), `
        resource "aws_s3_bucket" "complex" {
          bucket = "test"
          
          lifecycle_rule {
            enabled = true
            
            transition {
              days = 30
              storage_class = "STANDARD_IA"
            }
          }
          
          server_side_encryption_configuration {
            rule {
              apply_server_side_encryption_by_default {
                sse_algorithm = "AES256"
              }
            }
          }
          
          tags = {
            Name = "Complex"
          }
        }
      `);

      const tfInfra = new TerraformInfrastructure(tempDir);
      
      expect(tfInfra.resourceHasConfig('aws_s3_bucket', 'complex', 'lifecycle_rule')).toBe(true);
      expect(tfInfra.resourceHasConfig('aws_s3_bucket', 'complex', 'server_side_encryption_configuration')).toBe(true);
      expect(tfInfra.resourceHasConfig('aws_s3_bucket', 'complex', 'tags')).toBe(true);
      expect(tfInfra.resourceHasTags('aws_s3_bucket', 'complex')).toBe(true);

      // Cleanup with error handling
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.warn('Cleanup warning:', error);
      }
    });

    test('should handle environment suffix counting with no matches', () => {
      const tempDir = path.join(__dirname, 'temp-nosuffix');
      fs.mkdirSync(tempDir, { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'main.tf'), `
        resource "aws_s3_bucket" "test" {
          bucket = "static-name"
        }
      `);
      fs.writeFileSync(path.join(tempDir, 'variables.tf'), '');
      fs.writeFileSync(path.join(tempDir, 'outputs.tf'), '');

      const tfInfra = new TerraformInfrastructure(tempDir);
      expect(tfInfra.getEnvironmentSuffixUsage()).toBe(0);

      // Cleanup with error handling
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.warn('Cleanup warning:', error);
      }
    });
  });

  describe('Default path handling', () => {
    test('should use current directory when no path provided', () => {
      const originalCwd = process.cwd();
      process.chdir(path.join(__dirname, '..', 'lib'));
      
      const tfInfra = new TerraformInfrastructure();
      expect(tfInfra.getFileContent('main.tf')).toBeDefined();
      
      process.chdir(originalCwd);
    });
  });

  describe('Additional compliance scenarios', () => {
    test('should detect partial compliance', () => {
      const tempDir = path.join(__dirname, 'temp-partial');
      fs.mkdirSync(tempDir, { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'main.tf'), `
        resource "aws_s3_bucket" "main" {
          bucket = "main"
        }
        resource "aws_s3_bucket" "logs" {
          bucket = "logs"
        }
        resource "aws_kms_key" "s3_key" {
          description = "KMS key"
        }
        resource "aws_iam_role" "test" {
          name = "test"
        }
      `);
      fs.writeFileSync(path.join(tempDir, 'variables.tf'), `
        variable "project_name" {
          default = "corp"
        }
        variable "environment_suffix" {
          default = ""
        }
      `);
      fs.writeFileSync(path.join(tempDir, 'outputs.tf'), '');

      const tfInfra = new TerraformInfrastructure(tempDir);
      const compliance = tfInfra.validateCompliance();
      
      // Should still be non-compliant due to missing CloudTrail and CloudWatch
      expect(compliance.compliant).toBe(false);
      expect(compliance.issues).toContain('CloudTrail not configured');
      expect(compliance.issues).toContain('No CloudWatch alarms configured');

      // Cleanup with error handling
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.warn('Cleanup warning:', error);
      }
    });
  });
});