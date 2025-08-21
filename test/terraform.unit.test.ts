// tests/unit/unit-tests.ts
// Unit tests for Terraform infrastructure files
// Tests file existence, syntax, and basic structure validation

import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');
const MODULES_DIR = path.resolve(__dirname, '../lib/modules');

describe('Terraform Infrastructure Unit Tests', () => {
  describe('Core Files', () => {
    test('tap_stack.tf exists', () => {
      const stackPath = path.join(LIB_DIR, 'tap_stack.tf');
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test('provider.tf exists', () => {
      const providerPath = path.join(LIB_DIR, 'provider.tf');
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test('variables.tf exists', () => {
      const variablesPath = path.join(LIB_DIR, 'variables.tf');
      expect(fs.existsSync(variablesPath)).toBe(true);
    });

    test('outputs.tf exists', () => {
      const outputsPath = path.join(LIB_DIR, 'outputs.tf');
      expect(fs.existsSync(outputsPath)).toBe(true);
    });

    test('backend.tf exists', () => {
      const backendPath = path.join(LIB_DIR, 'backend.tf');
      expect(fs.existsSync(backendPath)).toBe(true);
    });

    test('locals.tf exists', () => {
      const localsPath = path.join(LIB_DIR, 'locals.tf');
      expect(fs.existsSync(localsPath)).toBe(true);
    });
  });

  describe('Module Structure', () => {
    test('storage module exists', () => {
      const storagePath = path.join(MODULES_DIR, 'storage');
      expect(fs.existsSync(storagePath)).toBe(true);
      expect(fs.existsSync(path.join(storagePath, 'main.tf'))).toBe(true);
      expect(fs.existsSync(path.join(storagePath, 'variables.tf'))).toBe(true);
    });

    test('network module exists', () => {
      const networkPath = path.join(MODULES_DIR, 'network');
      expect(fs.existsSync(networkPath)).toBe(true);
      expect(fs.existsSync(path.join(networkPath, 'main.tf'))).toBe(true);
      expect(fs.existsSync(path.join(networkPath, 'variables.tf'))).toBe(true);
    });

    test('iam_role module exists', () => {
      const iamPath = path.join(MODULES_DIR, 'iam_role');
      expect(fs.existsSync(iamPath)).toBe(true);
      expect(fs.existsSync(path.join(iamPath, 'main.tf'))).toBe(true);
      expect(fs.existsSync(path.join(iamPath, 'variables.tf'))).toBe(true);
    });
  });

  describe('Configuration Validation', () => {
    test('tap_stack.tf contains required modules', () => {
      const stackPath = path.join(LIB_DIR, 'tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

      // Environment-specific modules
      expect(content).toMatch(/module\s+"storage_staging"/);
      expect(content).toMatch(/module\s+"storage_production"/);
      expect(content).toMatch(/module\s+"network_staging"/);
      expect(content).toMatch(/module\s+"network_production"/);
      expect(content).toMatch(/module\s+"iam_role_staging"/);
      expect(content).toMatch(/module\s+"iam_role_production"/);

      // Environment-agnostic modules
      expect(content).toMatch(/module\s+"storage"/);
      expect(content).toMatch(/module\s+"network"/);
      expect(content).toMatch(/module\s+"iam_role"/);
    });

    test('provider.tf has provider configuration', () => {
      const providerPath = path.join(LIB_DIR, 'provider.tf');
      const content = fs.readFileSync(providerPath, 'utf8');

      // Check for conditional provider
      expect(content).toMatch(
        /provider\s+"aws"\s*{[\s\S]*region\s*=\s*local\.current_env_config\.region/
      );

      // Check for aliased providers
      expect(content).toMatch(
        /provider\s+"aws"\s*{[\s\S]*alias\s*=\s*"staging"/
      );
      expect(content).toMatch(
        /provider\s+"aws"\s*{[\s\S]*alias\s*=\s*"production"/
      );
    });

    test('variables.tf contains required variables', () => {
      const variablesPath = path.join(LIB_DIR, 'variables.tf');
      const content = fs.readFileSync(variablesPath, 'utf8');

      expect(content).toMatch(/variable\s+"staging_region"/);
      expect(content).toMatch(/variable\s+"production_region"/);
    });

    test('outputs.tf contains expected outputs', () => {
      const outputsPath = path.join(LIB_DIR, 'outputs.tf');
      const content = fs.readFileSync(outputsPath, 'utf8');

      expect(content).toMatch(/output\s+"bucket_names"/);
      expect(content).toMatch(/output\s+"security_group_ids"/);
      expect(content).toMatch(/output\s+"iam_role_arns"/);
      expect(content).toMatch(/output\s+"current_bucket_name"/);
      expect(content).toMatch(/output\s+"current_security_group_id"/);
      expect(content).toMatch(/output\s+"current_iam_role_arn"/);
      expect(content).toMatch(/output\s+"current_environment"/);
      expect(content).toMatch(/output\s+"current_region"/);
    });

    test('backend.tf exists and has proper configuration', () => {
      const backendPath = path.join(LIB_DIR, 'backend.tf');
      expect(fs.existsSync(backendPath)).toBe(true);

      const content = fs.readFileSync(backendPath, 'utf8');
      expect(content).toMatch(/backend\s+"s3"/);
      expect(content).toMatch(/workspace.*prefix/);
    });
  });

  describe('Module Dependencies', () => {
    test('iam_role module uses storage bucket_arn with conditional logic', () => {
      const stackPath = path.join(LIB_DIR, 'tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

      // Check for conditional bucket_arn assignment in staging module
      expect(content).toMatch(
        /bucket_arn\s*=\s*local\.env\s*==\s*"staging"\s*\?\s*module\.storage_staging\[0\]\.bucket_arn\s*:\s*null/
      );
      // Check for conditional bucket_arn assignment in production module
      expect(content).toMatch(
        /bucket_arn\s*=\s*local\.env\s*==\s*"production"\s*\?\s*module\.storage_production\[0\]\.bucket_arn\s*:\s*null/
      );
      // Check for environment-agnostic module bucket_arn assignment
      expect(content).toMatch(
        /bucket_arn\s*=\s*module\.storage\[0\]\.bucket_arn/
      );
    });

    test('modules use environment variable', () => {
      const stackPath = path.join(LIB_DIR, 'tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

      expect(content).toMatch(/environment\s*=\s*"staging"/);
      expect(content).toMatch(/environment\s*=\s*"production"/);
      expect(content).toMatch(/environment\s*=\s*local\.env/);
    });

    test('environment-agnostic modules exist', () => {
      const stackPath = path.join(LIB_DIR, 'tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

      expect(content).toMatch(/module\s+"storage"\s*{/);
      expect(content).toMatch(/module\s+"network"\s*{/);
      expect(content).toMatch(/module\s+"iam_role"\s*{/);
    });
  });
});
