import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Unit Tests', () => {
  const terraformDir = path.join(__dirname, '../lib');
  const environments = ['dev', 'staging', 'prod'];

  beforeAll(() => {
    // Change to terraform directory
    process.chdir(terraformDir);
  });

  describe('Terraform Configuration Validation', () => {
    test('should have valid Terraform syntax', () => {
      try {
        // Initialize Terraform providers first
        execSync('terraform init -backend=false', { 
          encoding: 'utf8',
          cwd: terraformDir,
          stdio: 'pipe'
        });
        
        // Then validate
        execSync('terraform validate', { 
          encoding: 'utf8',
          cwd: terraformDir,
          stdio: 'pipe'
        });
        
        // If we get here without throwing, validation passed
        expect(true).toBe(true);
      } catch (error) {
        throw new Error(`Terraform validation failed: ${error}`);
      }
    });

    test('should have valid Terraform format', () => {
      try {
        execSync('terraform fmt -check=true', { 
          encoding: 'utf8',
          cwd: terraformDir 
        });
      } catch (error) {
        throw new Error(`Terraform format check failed. Run 'terraform fmt' to fix formatting issues.`);
      }
    });

    test('should have required providers defined in provider.tf', () => {
      const providerContent = fs.readFileSync(path.join(terraformDir, 'provider.tf'), 'utf8');
      
      // Check for required providers in provider.tf
      expect(providerContent).toContain('required_providers');
      expect(providerContent).toContain('hashicorp/aws');
    });

    test('should have Terraform version constraint in provider.tf', () => {
      const providerContent = fs.readFileSync(path.join(terraformDir, 'provider.tf'), 'utf8');
      
      // Check for version constraint in provider.tf
      expect(providerContent).toContain('required_version');
      expect(providerContent).toMatch(/">= 1\.4\.0"/);
    });
  });

  describe('Variable Validation', () => {
    test('should have all required variables defined', () => {
      const tapStackContent = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
      
      const requiredVariables = [
        'environment',
        'aws_region',
        'aws_failover_region',
        'project_name',
        'owner',
        'cost_center',
        'vpc_cidr',
        'availability_zones',
        'public_subnet_cidrs',
        'private_subnet_cidrs',
        'database_subnet_cidrs',
        'instance_type',
        'min_size',
        'max_size',
        'desired_capacity',
        'db_instance_class',
        'db_allocated_storage',
        'db_engine',
        'db_engine_version',
        'db_username',
        'db_password',
        's3_bucket_prefix',
        'enable_detailed_monitoring',
        'log_retention_days',
        'allowed_cidr_blocks',
        'enable_nat_gateway',
        'backup_retention_days',
        'backup_window',
        'maintenance_window'
      ];

      requiredVariables.forEach(variable => {
        expect(tapStackContent).toContain(`variable "${variable}"`);
      });
    });

    test('should have environment validation', () => {
      const tapStackContent = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
      
      // Check for environment validation
      expect(tapStackContent).toContain('validation');
      expect(tapStackContent).toContain('contains(["dev", "staging", "prod"]');
    });

    test('should have sensitive variables marked correctly', () => {
      const tapStackContent = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
      
      // Check for sensitive variables
      expect(tapStackContent).toContain('sensitive   = true');
      expect(tapStackContent).toContain('variable "db_username"');
      expect(tapStackContent).toContain('variable "db_password"');
    });
  });
});