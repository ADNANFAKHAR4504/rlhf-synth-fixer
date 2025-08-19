import { describe, expect, test } from '@jest/globals';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('Terraform Configuration Unit Tests', () => {
  const libDir = path.resolve(__dirname, '../lib');

  // Test to ensure Terraform files are formatted correctly
  test('should be formatted correctly', () => {
    try {
      execSync('terraform fmt -check -recursive', {
        cwd: libDir,
        stdio: 'pipe',
      });
    } catch (e) {
      console.error(
        'Terraform format check failed. Run `terraform fmt -recursive` to fix.'
      );
      // Fail the test explicitly
      expect(e).toBeNull();
    }
  });

  // Test to ensure Terraform configuration is valid
  test('should be valid', () => {
    try {
      // Initialize Terraform
      execSync('terraform init -backend=false', { cwd: libDir, stdio: 'pipe' });
      // Validate Terraform
      execSync('terraform validate', { cwd: libDir, stdio: 'pipe' });
    } catch (e) {
      const error = e as { stdout: Buffer; stderr: Buffer };
      console.error('Terraform validation failed:');
      console.error('STDOUT:', error.stdout.toString());
      console.error('STDERR:', error.stderr.toString());
      // Fail the test explicitly
      expect(error).toBeNull();
    }
  });
});

describe('Terraform Modules Structure', () => {
  const modulesDir = path.resolve(__dirname, '../lib/modules');

  test('all modules should have main.tf, variables.tf, and outputs.tf', () => {
    const modules = fs
      .readdirSync(modulesDir)
      .filter(file => fs.statSync(path.join(modulesDir, file)).isDirectory());

    modules.forEach(module => {
      const moduleDir = path.resolve(modulesDir, module);
      expect(fs.existsSync(path.resolve(moduleDir, 'main.tf'))).toBe(true);
      expect(fs.existsSync(path.resolve(moduleDir, 'variables.tf'))).toBe(true);
      expect(fs.existsSync(path.resolve(moduleDir, 'outputs.tf'))).toBe(true);
    });
  });
});
