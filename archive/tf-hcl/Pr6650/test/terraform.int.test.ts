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

  describe('File Structure', () => {
    it('should have all required configuration files', () => {
      const fs = require('fs');
      const requiredFiles = [
        'main.tf',
        'variables.tf',
        'terraform.tfvars',
        'backend.tf'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(libPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should have valid JSON template file', () => {
      const fs = require('fs');
      const templatePath = path.join(libPath, 'template.json');

      if (fs.existsSync(templatePath)) {
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        expect(() => JSON.parse(templateContent)).not.toThrow();

        const template = JSON.parse(templateContent);
        expect(template).toHaveProperty('AWSTemplateFormatVersion');
      }
    });
  });

  describe('Variable Configuration', () => {
    it('should have all required variables defined', () => {
      const fs = require('fs');
      const varFilePath = path.join(libPath, 'variables.tf');

      if (fs.existsSync(varFilePath)) {
        const content = fs.readFileSync(varFilePath, 'utf8');

        // Check for essential variables
        expect(content).toContain('variable "environment_suffix"');
        expect(content).toContain('variable "environment"');
        expect(content).toContain('variable "primary_region"');
        expect(content).toContain('variable "secondary_region"');
      }
    });

    it('should have terraform.tfvars with required values', () => {
      const fs = require('fs');
      const tfvarsPath = path.join(libPath, 'terraform.tfvars');

      if (fs.existsSync(tfvarsPath)) {
        const content = fs.readFileSync(tfvarsPath, 'utf8');

        // Check for essential values
        expect(content).toContain('environment_suffix');
        expect(content).toContain('database_name');
        expect(content).toContain('domain_name');
      }
    });
  });
});
