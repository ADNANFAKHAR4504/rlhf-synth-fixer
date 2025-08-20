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

      expect(content).toMatch(/module\s+"storage"/);
      expect(content).toMatch(/module\s+"network"/);
      expect(content).toMatch(/module\s+"iam_role"/);
    });

    test('tap_stack.tf has provider configuration', () => {
      const stackPath = path.join(LIB_DIR, 'tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

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
    });
  });

  describe('Module Dependencies', () => {
    test('iam_role module uses storage bucket_arn', () => {
      const stackPath = path.join(LIB_DIR, 'tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

      expect(content).toMatch(/bucket_arn\s*=\s*module\.storage\.bucket_arn/);
    });

    test('modules use environment variable', () => {
      const stackPath = path.join(LIB_DIR, 'tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

      expect(content).toMatch(/environment\s*=\s*local\.env/);
    });
  });
});
