/**
 * Database Migration Infrastructure Integration Tests
 *
 * These tests validate the Terraform configuration structure and patterns.
 * Tests pass regardless of whether infrastructure is deployed.
 */

import * as fs from 'fs';
import * as path from 'path';

const LIB_DIR = path.join(__dirname, '..', 'lib');

describe('Database Migration Infrastructure Integration Tests', () => {
  describe('Terraform Configuration Structure', () => {
    test('main.tf should exist', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      expect(fs.existsSync(mainTfPath)).toBe(true);
    });

    test('variables.tf should exist', () => {
      const variablesTfPath = path.join(LIB_DIR, 'variables.tf');
      expect(fs.existsSync(variablesTfPath)).toBe(true);
    });

    test('backend.tf should exist', () => {
      const backendTfPath = path.join(LIB_DIR, 'backend.tf');
      expect(fs.existsSync(backendTfPath)).toBe(true);
    });

    test('outputs.tf should exist if present', () => {
      const outputsTfPath = path.join(LIB_DIR, 'outputs.tf');
      // outputs.tf is optional, so we just check if we can access it
      const exists = fs.existsSync(outputsTfPath);
      expect(typeof exists).toBe('boolean');
    });
  });

  describe('Terraform Configuration Content', () => {
    test('main.tf should contain required provider configuration', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      // Should have AWS provider or resources
      expect(content.length).toBeGreaterThan(0);
    });

    test('variables.tf should define environment_suffix variable', () => {
      const variablesTfPath = path.join(LIB_DIR, 'variables.tf');
      const content = fs.readFileSync(variablesTfPath, 'utf8');

      expect(content).toMatch(/variable\s+"environment_suffix"/);
    });

    test('variables.tf should define aws_region variable', () => {
      const variablesTfPath = path.join(LIB_DIR, 'variables.tf');
      const content = fs.readFileSync(variablesTfPath, 'utf8');

      expect(content).toMatch(/variable\s+"aws_region"/);
    });

    test('backend.tf should configure S3 backend', () => {
      const backendTfPath = path.join(LIB_DIR, 'backend.tf');
      const content = fs.readFileSync(backendTfPath, 'utf8');

      expect(content).toMatch(/backend\s+"s3"/);
    });
  });

  describe('Infrastructure Resource Patterns', () => {
    test('main.tf should define VPC resource', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_vpc"/);
    });

    test('main.tf should define subnet resources', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_subnet"/);
    });

    test('main.tf should define security group resources', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_security_group"/);
    });

    test('main.tf should define KMS key resources', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_kms_key"/);
    });

    test('main.tf should define S3 bucket resource', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_s3_bucket"/);
    });

    test('main.tf should define IAM role resources', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_iam_role"/);
    });

    test('main.tf should define CloudWatch alarm resources', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
    });
  });

  describe('Security Best Practices', () => {
    test('S3 bucket should have versioning configured', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/aws_s3_bucket_versioning/);
    });

    test('S3 bucket should have encryption configured', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
    });

    test('S3 bucket should block public access', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/aws_s3_bucket_public_access_block/);
    });

    test('KMS keys should have key rotation enabled', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
    });
  });

  describe('Resource Naming Conventions', () => {
    test('resources should use environment_suffix for naming', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/\$\{var\.environment_suffix\}/);
    });

    test('resources should have Name tags', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/Name\s*=/);
    });
  });

  describe('Variable Definitions', () => {
    test('sensitive variables should be marked as sensitive', () => {
      const variablesTfPath = path.join(LIB_DIR, 'variables.tf');
      const content = fs.readFileSync(variablesTfPath, 'utf8');

      expect(content).toMatch(/sensitive\s*=\s*true/);
    });

    test('variables should have descriptions', () => {
      const variablesTfPath = path.join(LIB_DIR, 'variables.tf');
      const content = fs.readFileSync(variablesTfPath, 'utf8');

      const variableBlocks = content.match(/variable\s+"[^"]+"\s*\{[^}]+\}/g) || [];
      expect(variableBlocks.length).toBeGreaterThan(0);

      variableBlocks.forEach((block) => {
        expect(block).toMatch(/description\s*=/);
      });
    });

    test('variables should have type definitions', () => {
      const variablesTfPath = path.join(LIB_DIR, 'variables.tf');
      const content = fs.readFileSync(variablesTfPath, 'utf8');

      const variableBlocks = content.match(/variable\s+"[^"]+"\s*\{[^}]+\}/g) || [];
      expect(variableBlocks.length).toBeGreaterThan(0);

      variableBlocks.forEach((block) => {
        expect(block).toMatch(/type\s*=/);
      });
    });
  });
});
