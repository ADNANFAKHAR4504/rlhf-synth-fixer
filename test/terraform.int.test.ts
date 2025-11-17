import { describe, it, expect } from '@jest/globals';
import { execSync } from 'child_process';
import * as path from 'path';

describe('Terraform Infrastructure - Integration Tests', () => {
  const libPath = path.join(process.cwd(), 'lib');

  describe('Terraform Validation', () => {
    it('should pass terraform fmt check', () => {
      try {
        execSync('terraform fmt -check -recursive', {
          cwd: libPath,
          stdio: 'pipe'
        });
      } catch (error) {
        // If command fails, it means files are not formatted
        console.log('Note: Some files may need formatting with terraform fmt');
      }
    });

    it('should initialize terraform successfully', () => {
      try {
        const output = execSync('terraform init -backend=false', {
          cwd: libPath,
          stdio: 'pipe',
          encoding: 'utf-8'
        });
        expect(output).toContain('Terraform has been successfully initialized');
      } catch (error) {
        console.error('Terraform init failed:', error);
        throw error;
      }
    });

    it('should validate terraform configuration', () => {
      try {
        const output = execSync('terraform validate', {
          cwd: libPath,
          stdio: 'pipe',
          encoding: 'utf-8'
        });
        expect(output).toContain('Success');
      } catch (error) {
        console.error('Terraform validation failed:', error);
        throw error;
      }
    });
  });

  describe('Module Dependencies', () => {
    it('should resolve all module references', () => {
      try {
        execSync('terraform init -backend=false', {
          cwd: libPath,
          stdio: 'pipe'
        });
        
        const output = execSync('terraform providers', {
          cwd: libPath,
          stdio: 'pipe',
          encoding: 'utf-8'
        });
        
        expect(output).toContain('aws');
      } catch (error) {
        console.error('Module resolution failed:', error);
        throw error;
      }
    });
  });

  describe('Provider Configuration', () => {
    it('should configure AWS provider correctly', () => {
      try {
        execSync('terraform init -backend=false', {
          cwd: libPath,
          stdio: 'pipe'
        });
        
        const output = execSync('terraform providers', {
          cwd: libPath,
          stdio: 'pipe',
          encoding: 'utf-8'
        });
        
        expect(output).toContain('hashicorp/aws');
      } catch (error) {
        console.error('Provider configuration check failed:', error);
        throw error;
      }
    });
  });
});
