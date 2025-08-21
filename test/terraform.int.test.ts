// Integration tests for Terraform infrastructure
// These tests validate the overall infrastructure setup and module integration

import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

describe('Terraform Infrastructure Integration Tests', () => {
  describe('Multi-Environment Setup', () => {
    test('supports staging and production environments', () => {
      const providerPath = path.join(LIB_DIR, 'provider.tf');
      const content = fs.readFileSync(providerPath, 'utf8');

      // Check for staging provider
      expect(content).toMatch(
        /provider\s+"aws"\s*{[\s\S]*alias\s*=\s*"staging"/
      );
      // Check for production provider
      expect(content).toMatch(
        /provider\s+"aws"\s*{[\s\S]*alias\s*=\s*"production"/
      );
    });

    test('workspace-based environment detection works', () => {
      const stackPath = path.join(LIB_DIR, 'tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

      // Check for local environment variable from workspace
      expect(content).toMatch(
        /env\s*=\s*replace\(terraform\.workspace,\s*"myapp-",\s*""\)/
      );
    });
  });

  describe('Module Integration', () => {
    test('all modules are properly integrated', () => {
      const stackPath = path.join(LIB_DIR, 'tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

      // Check all modules are declared
      expect(content).toMatch(/module\s+"storage_staging"\s*{/);
      expect(content).toMatch(/module\s+"storage_production"\s*{/);
      expect(content).toMatch(/module\s+"network_staging"\s*{/);
      expect(content).toMatch(/module\s+"network_production"\s*{/);
      expect(content).toMatch(/module\s+"iam_role_staging"\s*{/);
      expect(content).toMatch(/module\s+"iam_role_production"\s*{/);

      // Check all modules use correct source paths
      expect(content).toMatch(/source\s*=\s*"\.\/modules\/storage"/);
      expect(content).toMatch(/source\s*=\s*"\.\/modules\/network"/);
      expect(content).toMatch(/source\s*=\s*"\.\/modules\/iam_role"/);
    });

    test('module dependencies are correctly configured', () => {
      const stackPath = path.join(LIB_DIR, 'tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

      // IAM role module depends on storage module output
      expect(content).toMatch(
        /module\s+"iam_role_staging"\s*{[\s\S]*bucket_arn\s*=\s*module\.storage_staging\[0\]\.bucket_arn/
      );
      expect(content).toMatch(
        /module\s+"iam_role_production"\s*{[\s\S]*bucket_arn\s*=\s*module\.storage_production\[0\]\.bucket_arn/
      );
    });

    test('all modules receive environment parameter', () => {
      const stackPath = path.join(LIB_DIR, 'tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

      // Check each module gets environment variable - use a more flexible regex
      expect(content).toMatch(
        /module\s+"storage_staging"\s*{[\s\S]*?environment\s*=\s*"staging"/
      );
      expect(content).toMatch(
        /module\s+"storage_production"\s*{[\s\S]*?environment\s*=\s*"production"/
      );
      expect(content).toMatch(
        /module\s+"network_staging"\s*{[\s\S]*?environment\s*=\s*"staging"/
      );
      expect(content).toMatch(
        /module\s+"network_production"\s*{[\s\S]*?environment\s*=\s*"production"/
      );
      expect(content).toMatch(
        /module\s+"iam_role_staging"\s*{[\s\S]*?environment\s*=\s*"staging"/
      );
      expect(content).toMatch(
        /module\s+"iam_role_production"\s*{[\s\S]*?environment\s*=\s*"production"/
      );
    });
  });

  describe('Output Integration', () => {
    test('outputs reference module outputs correctly', () => {
      const outputsPath = path.join(LIB_DIR, 'outputs.tf');
      const content = fs.readFileSync(outputsPath, 'utf8');

      // Check outputs reference correct modules
      expect(content).toMatch(/module\.storage_staging\[0\]\.bucket_name/);
      expect(content).toMatch(/module\.storage_production\[0\]\.bucket_name/);
      expect(content).toMatch(/module\.network_staging\[0\]\.security_group_id/);
      expect(content).toMatch(/module\.network_production\[0\]\.security_group_id/);
      expect(content).toMatch(/module\.iam_role_staging\[0\]\.role_arn/);
      expect(content).toMatch(/module\.iam_role_production\[0\]\.role_arn/);
    });

    test('outputs provide both staging and production values', () => {
      const outputsPath = path.join(LIB_DIR, 'outputs.tf');
      const content = fs.readFileSync(outputsPath, 'utf8');

      // Check each output has staging and production entries
      expect(content).toMatch(/staging\s*=\s*local\.env\s*==\s*"staging"\s*\?\s*module\.storage_staging\[0\]\.bucket_name\s*:\s*null/);
      expect(content).toMatch(/production\s*=\s*local\.env\s*==\s*"production"\s*\?\s*module\.storage_production\[0\]\.bucket_name\s*:\s*null/);
    });
  });

  describe('Configuration Consistency', () => {
    test('S3 backend is configured', () => {
      const providerPath = path.join(LIB_DIR, 'provider.tf');
      const content = fs.readFileSync(providerPath, 'utf8');

      expect(content).toMatch(/backend\s+"s3"/);
    });

    test('required providers are specified', () => {
      const providerPath = path.join(LIB_DIR, 'provider.tf');
      const content = fs.readFileSync(providerPath, 'utf8');

      expect(content).toMatch(/required_providers\s*{/);
      expect(content).toMatch(/aws\s*=\s*{/);
      expect(content).toMatch(/random\s*=\s*{/);
    });

    test('provider default tags are configured', () => {
      const providerPath = path.join(LIB_DIR, 'provider.tf');
      const content = fs.readFileSync(providerPath, 'utf8');

      // Check both staging and production providers have default tags
      expect(content).toMatch(
        /default_tags\s*{[\s\S]*environment\s*=\s*var\.environment_names\.staging/
      );
      expect(content).toMatch(
        /default_tags\s*{[\s\S]*environment\s*=\s*var\.environment_names\.production/
      );
      expect(content).toMatch(/project\s*=\s*var\.project_name/);
    });
  });
});
