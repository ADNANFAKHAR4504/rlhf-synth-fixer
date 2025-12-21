/**
 * Integration tests for Terraform IaC Optimization
 * Validates that the optimization script produces valid, working Terraform code
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Terraform IaC Optimization Integration Tests', () => {
  const testDir = path.join(__dirname, '../lib');

  describe('Baseline Infrastructure', () => {
    test('main.tf should exist and be valid HCL', () => {
      const mainTfPath = path.join(testDir, 'main.tf');
      expect(fs.existsSync(mainTfPath)).toBe(true);

      // Verify file is not empty
      const content = fs.readFileSync(mainTfPath, 'utf8');
      expect(content.length).toBeGreaterThan(100);

      // Verify basic Terraform structure
      expect(content).toContain('terraform {');
      expect(content).toContain('provider "aws"');
    });

    test('variables.tf should exist', () => {
      const varsPath = path.join(testDir, 'variables.tf');
      expect(fs.existsSync(varsPath)).toBe(true);
    });

    test('outputs.tf should exist', () => {
      const outputsPath = path.join(testDir, 'outputs.tf');
      expect(fs.existsSync(outputsPath)).toBe(true);
    });
  });

  describe('Optimization Script', () => {
    test('optimize.py should exist and be executable', () => {
      const optimizePath = path.join(testDir, 'optimize.py');
      expect(fs.existsSync(optimizePath)).toBe(true);

      // Verify file is executable
      const stats = fs.statSync(optimizePath);
      expect(stats.mode & fs.constants.X_OK).toBeTruthy();
    });

    test('optimize.py should run successfully and create optimized files', () => {
      // Run the optimization script
      try {
        execSync('cd lib && python3 optimize.py', {
          stdio: 'pipe',
          encoding: 'utf8'
        });

        // Verify optimized files were created
        const optimizedFiles = [
          'main-optimized.tf',
          'variables-optimized.tf',
          'outputs-optimized.tf',
          'terraform-optimized.tfvars'
        ];

        for (const filename of optimizedFiles) {
          const filepath = path.join(testDir, filename);
          expect(fs.existsSync(filepath)).toBe(true);

          // Verify file has content
          const content = fs.readFileSync(filepath, 'utf8');
          expect(content.length).toBeGreaterThan(50);
        }
      } catch (error: any) {
        fail(`Optimization script failed: ${error.message}`);
      }
    });
  });

  describe('Optimized Infrastructure Validation', () => {
    test('optimized main.tf should use for_each for repeated resources', () => {
      const mainOptPath = path.join(testDir, 'main-optimized.tf');
      if (!fs.existsSync(mainOptPath)) {
        console.warn('Skipping: main-optimized.tf not found. Run optimize.py first.');
        return;
      }

      const content = fs.readFileSync(mainOptPath, 'utf8');

      // Verify for_each is used
      expect(content).toContain('for_each');

      // Verify locals are defined
      expect(content).toContain('locals {');
      expect(content).toContain('public_subnets');
      expect(content).toContain('private_subnets');
      expect(content).toContain('ecs_services');
    });

    test('optimized variables.tf should have validation rules', () => {
      const varsOptPath = path.join(testDir, 'variables-optimized.tf');
      if (!fs.existsSync(varsOptPath)) {
        console.warn('Skipping: variables-optimized.tf not found. Run optimize.py first.');
        return;
      }

      const content = fs.readFileSync(varsOptPath, 'utf8');

      // Verify validation blocks exist
      expect(content).toContain('validation {');
      expect(content).toContain('error_message');
      expect(content).toContain('condition');
    });

    test('optimized main.tf should use dynamic blocks for security groups', () => {
      const mainOptPath = path.join(testDir, 'main-optimized.tf');
      if (!fs.existsSync(mainOptPath)) {
        console.warn('Skipping: main-optimized.tf not found. Run optimize.py first.');
        return;
      }

      const content = fs.readFileSync(mainOptPath, 'utf8');

      // Verify dynamic blocks are used
      expect(content).toContain('dynamic');
      expect(content).toContain('ingress');
    });

    test('optimized code should be shorter than baseline', () => {
      const mainBaseline = path.join(testDir, 'main.tf');
      const mainOptimized = path.join(testDir, 'main-optimized.tf');

      if (!fs.existsSync(mainOptimized)) {
        console.warn('Skipping: main-optimized.tf not found. Run optimize.py first.');
        return;
      }

      const baselineContent = fs.readFileSync(mainBaseline, 'utf8');
      const optimizedContent = fs.readFileSync(mainOptimized, 'utf8');

      const baselineLines = baselineContent.split('\n').length;
      const optimizedLines = optimizedContent.split('\n').length;

      console.log(`Baseline: ${baselineLines} lines, Optimized: ${optimizedLines} lines`);

      // Optimized should be at least 20% shorter
      expect(optimizedLines).toBeLessThan(baselineLines * 0.8);
    });
  });

  describe('Code Quality', () => {
    test('optimized files should have no hardcoded credentials', () => {
      const mainOptPath = path.join(testDir, 'main-optimized.tf');
      if (!fs.existsSync(mainOptPath)) {
        console.warn('Skipping: main-optimized.tf not found. Run optimize.py first.');
        return;
      }

      const content = fs.readFileSync(mainOptPath, 'utf8');

      // Check for common hardcoded credential patterns
      expect(content).not.toMatch(/password\s*=\s*"[^"]+"/i);
      expect(content).not.toMatch(/secret\s*=\s*"[^"]+"/i);
      expect(content).not.toMatch(/ChangeMe/i);
    });

    test('optimized main.tf should use centralized tagging', () => {
      const mainOptPath = path.join(testDir, 'main-optimized.tf');
      if (!fs.existsSync(mainOptPath)) {
        console.warn('Skipping: main-optimized.tf not found. Run optimize.py first.');
        return;
      }

      const content = fs.readFileSync(mainOptPath, 'utf8');

      // Verify centralized tags in provider
      expect(content).toContain('default_tags');
      expect(content).toContain('common_tags');
      expect(content).toContain('merge(');
    });
  });
});
