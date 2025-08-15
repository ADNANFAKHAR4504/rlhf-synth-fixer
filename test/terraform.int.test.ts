// tests/integration/integration-tests.ts
// Integration tests for production AWS infrastructure
// Tests actual Terraform validation and planning

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const TERRAFORM_DIR = path.resolve(__dirname, '../lib');

describe('Production AWS Infrastructure - Integration Tests', () => {
  
  beforeAll(() => {
    // Ensure we're in the correct directory
    process.chdir(TERRAFORM_DIR);
  });

  describe('Terraform Validation', () => {
    test('terraform validate passes', () => {
      try {
        // Initialize terraform if not already done
        if (!fs.existsSync('.terraform')) {
          execSync('terraform init -backend=false', { 
            stdio: 'pipe',
            timeout: 30000 
          });
        }
        
        // Run terraform validate
        const result = execSync('terraform validate', { 
          stdio: 'pipe',
          timeout: 15000,
          encoding: 'utf8' 
        });
        
        expect(result).toContain('Success');
      } catch (error) {
        console.error('Terraform validation failed:', error instanceof Error ? error.message : String(error));
        throw error;
      }
    });

    test('terraform fmt check passes', () => {
      try {
        execSync('terraform fmt -check', { 
          stdio: 'pipe',
          timeout: 10000 
        });
      } catch (error) {
        console.error('Terraform formatting check failed. Run "terraform fmt" to fix.');
        throw error;
      }
    });
  });

  describe('Terraform Planning', () => {
    test('terraform plan with example vars does not fail', () => {
      try {
        // Create a temporary tfvars file for testing
        const testVars = `
aws_region = "us-west-2"
project_name = "test"
environment = "production"
vpc_cidr = "10.0.0.0/16"
allowed_cidrs = ["10.0.0.0/8"]
instance_type = "t3.micro"
min_size = 1
max_size = 3
desired_capacity = 2
`;
        fs.writeFileSync('test.tfvars', testVars);
        
        // Initialize terraform
        execSync('terraform init -backend=false', { 
          stdio: 'pipe',
          timeout: 30000 
        });
        
        // Run terraform plan (this will fail without AWS credentials, but syntax should be valid)
        try {
          execSync('terraform plan -var-file=test.tfvars', { 
            stdio: 'pipe',
            timeout: 30000 
          });
        } catch (planError) {
          // Plan may fail due to missing AWS credentials, but it should not fail due to syntax errors
          const errorOutput = (planError as any)?.stderr?.toString() || (planError instanceof Error ? planError.message : String(planError));
          
          // These are acceptable errors (missing credentials, etc.)
          const acceptableErrors = [
            'No valid credential sources found',
            'Unable to locate credentials',
            'Error: configuring Terraform AWS Provider',
            'NoCredentialProviders'
          ];
          
          const isAcceptableError = acceptableErrors.some(error => 
            errorOutput.includes(error)
          );
          
          if (!isAcceptableError) {
            console.error('Terraform plan failed with unexpected error:', errorOutput);
            throw planError;
          }
        }
        
        // Clean up
        if (fs.existsSync('test.tfvars')) {
          fs.unlinkSync('test.tfvars');
        }
        
      } catch (error) {
        console.error('Terraform planning test failed:', error instanceof Error ? error.message : String(error));
        throw error;
      }
    });
  });

  describe('Resource Count Validation', () => {
    test('infrastructure includes expected number of core resources', () => {
      const stackContent = fs.readFileSync('tap_stack.tf', 'utf8');
      
      // Count key resource types
      const vpcCount = (stackContent.match(/resource "aws_vpc"/g) || []).length;
      const subnetCount = (stackContent.match(/resource "aws_subnet"/g) || []).length;
      const sgCount = (stackContent.match(/resource "aws_security_group"/g) || []).length;
      const albCount = (stackContent.match(/resource "aws_lb"/g) || []).length;
      const asgCount = (stackContent.match(/resource "aws_autoscaling_group"/g) || []).length;
      const s3Count = (stackContent.match(/resource "aws_s3_bucket"/g) || []).length;
      
      expect(vpcCount).toBeGreaterThanOrEqual(1);
      expect(subnetCount).toBeGreaterThanOrEqual(6); // 3 public + 3 private
      expect(sgCount).toBeGreaterThanOrEqual(2); // ALB + EC2
      expect(albCount).toBeGreaterThanOrEqual(1);
      expect(asgCount).toBeGreaterThanOrEqual(1);
      expect(s3Count).toBeGreaterThanOrEqual(2); // app + log buckets
    });
  });

});
