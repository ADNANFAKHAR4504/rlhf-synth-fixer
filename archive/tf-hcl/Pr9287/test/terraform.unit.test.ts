import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Terraform Configuration Tests', () => {
  const tfDir = path.join(__dirname, '..', 'lib');

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('Terraform Files Structure', () => {
    test('All required Terraform files exist', () => {
      const requiredFiles = [
        'main.tf',
        'variables.tf',
        'outputs.tf',
        'provider.tf',
        'compute.tf',
        'database.tf',
        'storage.tf',
        'security.tf',
        'monitoring.tf',
        'iam.tf'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(tfDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('Variables file contains required variables', () => {
      const variablesPath = path.join(tfDir, 'variables.tf');
      const content = fs.readFileSync(variablesPath, 'utf-8');
      
      expect(content).toContain('variable "environment_suffix"');
      expect(content).toContain('variable "aws_region"');
      expect(content).toContain('variable "availability_zones"');
      expect(content).toContain('variable "vpc_cidr"');
    });

    test('Provider configuration is valid', () => {
      const providerPath = path.join(tfDir, 'provider.tf');
      const content = fs.readFileSync(providerPath, 'utf-8');
      
      expect(content).toContain('terraform {');
      expect(content).toContain('required_version');
      expect(content).toContain('required_providers');
      expect(content).toContain('aws =');
      expect(content).toContain('backend "s3"');
    });

    test('Outputs file contains expected outputs', () => {
      const outputsPath = path.join(tfDir, 'outputs.tf');
      const content = fs.readFileSync(outputsPath, 'utf-8');
      
      expect(content).toContain('output "vpc_id"');
      expect(content).toContain('output "load_balancer_dns"');
      expect(content).toContain('output "rds_endpoint"');
    });
  });

  describe('Resource Configuration', () => {
    test('Compute resources include autoscaling group', () => {
      const computePath = path.join(tfDir, 'compute.tf');
      const content = fs.readFileSync(computePath, 'utf-8');
      
      expect(content).toContain('resource "aws_autoscaling_group"');
      expect(content).toContain('resource "aws_launch_template"');
      expect(content).toContain('min_size');
      expect(content).toContain('max_size');
      expect(content).toContain('desired_capacity');
    });

    test('Database configuration includes RDS instance', () => {
      const dbPath = path.join(tfDir, 'database.tf');
      const content = fs.readFileSync(dbPath, 'utf-8');
      
      expect(content).toContain('resource "aws_db_instance"');
      expect(content).toContain('engine');
      expect(content).toContain('instance_class');
      expect(content).toContain('allocated_storage');
      expect(content).toContain('backup_retention_period');
    });

    test('Storage resources include S3 buckets', () => {
      const storagePath = path.join(tfDir, 'storage.tf');
      const content = fs.readFileSync(storagePath, 'utf-8');
      
      expect(content).toContain('resource "aws_s3_bucket"');
      expect(content).toContain('versioning');
      expect(content).toContain('server_side_encryption_configuration');
    });

    test('Security groups are properly configured', () => {
      // Security groups are defined in main.tf
      const mainPath = path.join(tfDir, 'main.tf');
      const content = fs.readFileSync(mainPath, 'utf-8');
      
      expect(content).toContain('resource "aws_security_group"');
      expect(content).toContain('ingress');
      expect(content).toContain('egress');
      expect(content).toContain('from_port');
      expect(content).toContain('to_port');
    });

    test('Monitoring includes CloudWatch alarms', () => {
      const monitoringPath = path.join(tfDir, 'monitoring.tf');
      const content = fs.readFileSync(monitoringPath, 'utf-8');
      
      expect(content).toContain('resource "aws_cloudwatch_metric_alarm"');
      expect(content).toContain('comparison_operator');
      expect(content).toContain('evaluation_periods');
      expect(content).toContain('threshold');
    });

    test('IAM roles and policies are defined', () => {
      const iamPath = path.join(tfDir, 'iam.tf');
      const content = fs.readFileSync(iamPath, 'utf-8');
      
      expect(content).toContain('resource "aws_iam_role"');
      expect(content).toContain('resource "aws_iam_policy"');
      expect(content).toContain('assume_role_policy');
    });
  });

  describe('Terraform Validation', () => {
    test('Terraform configuration is valid', () => {
      try {
        // Run terraform init without backend to avoid authentication issues
        execSync('terraform init -backend=false', { 
          cwd: tfDir,
          stdio: 'pipe'
        });
        
        // Run terraform validate
        const result = execSync('terraform validate -json', { 
          cwd: tfDir,
          encoding: 'utf-8'
        });
        
        const validation = JSON.parse(result);
        expect(validation.valid).toBe(true);
      } catch (error: any) {
        // If terraform validate fails, parse the JSON output
        if (error.stdout) {
          const validation = JSON.parse(error.stdout);
          expect(validation.valid).toBe(true);
        } else {
          throw error;
        }
      }
    });

    test('Terraform formatting is correct', () => {
      const result = execSync('terraform fmt -check -recursive', { 
        cwd: tfDir,
        encoding: 'utf-8'
      }).trim();
      
      // If terraform fmt returns nothing, formatting is correct
      expect(result).toBe('');
    });
  });
});
