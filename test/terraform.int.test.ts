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

      // Check for conditional provider
      expect(content).toMatch(
        /provider\s+"aws"\s*{[\s\S]*region\s*=\s*local\.current_env_config\.region/
      );
      // Check for staging provider alias
      expect(content).toMatch(
        /provider\s+"aws"\s*{[\s\S]*alias\s*=\s*"staging"/
      );
      // Check for production provider alias
      expect(content).toMatch(
        /provider\s+"aws"\s*{[\s\S]*alias\s*=\s*"production"/
      );
    });

    test('workspace-based environment detection works', () => {
      const localsPath = path.join(LIB_DIR, 'locals.tf');
      const content = fs.readFileSync(localsPath, 'utf8');

      // Check for local environment variable from workspace
      expect(content).toMatch(
        /env\s*=\s*terraform\.workspace\s*==\s*"production"\s*\?\s*"production"\s*:\s*"staging"/
      );
    });
  });

  describe('Module Integration', () => {
    test('all modules are properly integrated', () => {
      const stackPath = path.join(LIB_DIR, 'tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

      // Check environment-specific modules are declared
      expect(content).toMatch(/module\s+"storage_staging"\s*{/);
      expect(content).toMatch(/module\s+"storage_production"\s*{/);
      expect(content).toMatch(/module\s+"network_staging"\s*{/);
      expect(content).toMatch(/module\s+"network_production"\s*{/);
      expect(content).toMatch(/module\s+"iam_role_staging"\s*{/);
      expect(content).toMatch(/module\s+"iam_role_production"\s*{/);

      // Check environment-agnostic modules are declared
      expect(content).toMatch(/module\s+"storage"\s*{/);
      expect(content).toMatch(/module\s+"network"\s*{/);
      expect(content).toMatch(/module\s+"iam_role"\s*{/);

      // Check all modules use correct source paths
      expect(content).toMatch(/source\s*=\s*"\.\/modules\/storage"/);
      expect(content).toMatch(/source\s*=\s*"\.\/modules\/network"/);
      expect(content).toMatch(/source\s*=\s*"\.\/modules\/iam_role"/);
    });

    test('module dependencies are correctly configured', () => {
      const stackPath = path.join(LIB_DIR, 'tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

      // IAM role module depends on storage module output with conditional logic
      expect(content).toMatch(
        /module\s+"iam_role_staging"\s*{[\s\S]*bucket_arn\s*=\s*local\.env\s*==\s*"staging"\s*\?\s*module\.storage_staging\[0\]\.bucket_arn\s*:\s*null/
      );
      expect(content).toMatch(
        /module\s+"iam_role_production"\s*{[\s\S]*bucket_arn\s*=\s*local\.env\s*==\s*"production"\s*\?\s*module\.storage_production\[0\]\.bucket_arn\s*:\s*null/
      );

      // Environment-agnostic module dependencies
      expect(content).toMatch(
        /module\s+"iam_role"\s*{[\s\S]*bucket_arn\s*=\s*module\.storage\[0\]\.bucket_arn/
      );
    });

    test('all modules receive environment parameter', () => {
      const stackPath = path.join(LIB_DIR, 'tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

      // Check environment-specific modules get environment variable
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

      // Check environment-agnostic modules use local.env
      expect(content).toMatch(
        /module\s+"storage"\s*{[\s\S]*?environment\s*=\s*local\.env/
      );
      expect(content).toMatch(
        /module\s+"network"\s*{[\s\S]*?environment\s*=\s*local\.env/
      );
      expect(content).toMatch(
        /module\s+"iam_role"\s*{[\s\S]*?environment\s*=\s*local\.env/
      );
    });
  });

  describe('Output Integration', () => {
    test('outputs reference module outputs correctly', () => {
      const outputsPath = path.join(LIB_DIR, 'outputs.tf');
      const content = fs.readFileSync(outputsPath, 'utf8');

      // Check outputs reference environment-agnostic modules
      expect(content).toMatch(/module\.storage\[0\]\.bucket_name/);
      expect(content).toMatch(/module\.network\[0\]\.security_group_id/);
      expect(content).toMatch(/module\.iam_role\[0\]\.role_arn/);

      // Check for current environment outputs
      expect(content).toMatch(/output\s+"current_bucket_name"/);
      expect(content).toMatch(/output\s+"current_security_group_id"/);
      expect(content).toMatch(/output\s+"current_iam_role_arn"/);
      expect(content).toMatch(/output\s+"current_environment"/);
      expect(content).toMatch(/output\s+"current_region"/);
    });

    test('outputs provide both staging and production values', () => {
      const outputsPath = path.join(LIB_DIR, 'outputs.tf');
      const content = fs.readFileSync(outputsPath, 'utf8');

      // Check each output has staging and production entries using environment-agnostic modules
      expect(content).toMatch(
        /staging\s*=\s*local\.env\s*==\s*"staging"\s*\?\s*module\.storage\[0\]\.bucket_name\s*:\s*null/
      );
      expect(content).toMatch(
        /production\s*=\s*local\.env\s*==\s*"production"\s*\?\s*module\.storage\[0\]\.bucket_name\s*:\s*null/
      );
    });
  });

  describe('Configuration Consistency', () => {
    test('S3 backend is configured', () => {
      const backendPath = path.join(LIB_DIR, 'backend.tf');
      const content = fs.readFileSync(backendPath, 'utf8');

      expect(content).toMatch(/backend\s+"s3"/);
      expect(content).toMatch(/workspace.*prefix/);
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

      // Check conditional provider has default tags
      expect(content).toMatch(
        /default_tags\s*{[\s\S]*environment\s*=\s*local\.env/
      );
      expect(content).toMatch(/project\s*=\s*var\.project_name/);
      expect(content).toMatch(/managed_by\s*=\s*"terraform"/);

      // Check both staging and production aliased providers have default tags
      expect(content).toMatch(
        /default_tags\s*{[\s\S]*environment\s*=\s*var\.environment_names\.staging/
      );
      expect(content).toMatch(
        /default_tags\s*{[\s\S]*environment\s*=\s*var\.environment_names\.production/
      );
    });
  });
});
