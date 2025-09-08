import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

describe('Terraform Multi-Environment Infrastructure Integration Tests', () => {
  const terraformDir = path.join(__dirname, '..', 'lib');
  const environment = process.env.TF_VAR_environment || 'dev';
  
  console.log(`Running integration tests for environment: ${environment}`);

beforeAll(() => {
    // Change to terraform directory
    process.chdir(terraformDir);
  });

  describe('Terraform Configuration Validation', () => {
    test('should have valid Terraform configuration', () => {
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
        
        expect(true).toBe(true);
      } catch (error) {
        throw new Error(`Terraform validation failed: ${error}`);
      }
    });

    test('should have proper Terraform configuration structure', () => {
      const tapStackContent = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
      
      // Check that configuration has proper structure
      expect(tapStackContent).toBeDefined();
      expect(typeof tapStackContent).toBe('string');
      expect(tapStackContent.length).toBeGreaterThan(1000); // Ensure it's substantial
      
      // Check for key resource types in configuration
      expect(tapStackContent).toContain('resource "aws_vpc"');
      expect(tapStackContent).toContain('resource "aws_subnet"');
      expect(tapStackContent).toContain('resource "aws_security_group"');
      expect(tapStackContent).toContain('resource "aws_db_instance"');
      expect(tapStackContent).toContain('resource "aws_s3_bucket"');
      expect(tapStackContent).toContain('resource "aws_lb"');
    });
  });

  describe('Infrastructure Configuration Validation', () => {
    test('should have VPC configuration', () => {
      const tapStackContent = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
      
      // Check VPC resource
      expect(tapStackContent).toContain('resource "aws_vpc" "main"');
      expect(tapStackContent).toContain('cidr_block           = var.vpc_cidr');
      expect(tapStackContent).toContain('enable_dns_hostnames = true');
      expect(tapStackContent).toContain('enable_dns_support   = true');
    });

    test('should have subnet configuration', () => {
      const tapStackContent = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
      
      // Check subnet resources
      expect(tapStackContent).toContain('resource "aws_subnet" "public"');
      expect(tapStackContent).toContain('resource "aws_subnet" "private"');
      expect(tapStackContent).toContain('resource "aws_subnet" "database"');
      
      // Check subnet configuration
      expect(tapStackContent).toContain('map_public_ip_on_launch = true');
      expect(tapStackContent).toContain('availability_zone');
    });

    test('should have security group configuration', () => {
      const tapStackContent = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
      
      // Check security group resources
      expect(tapStackContent).toContain('resource "aws_security_group" "web"');
      expect(tapStackContent).toContain('resource "aws_security_group" "app"');
      expect(tapStackContent).toContain('resource "aws_security_group" "database"');
      
      // Check security group rules
      expect(tapStackContent).toContain('from_port   = 80');
      expect(tapStackContent).toContain('from_port   = 443');
      expect(tapStackContent).toContain('from_port       = 3306');
    });

    test('should have database configuration', () => {
      const tapStackContent = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
      
      // Check RDS resources
      expect(tapStackContent).toContain('resource "aws_db_subnet_group" "main"');
      expect(tapStackContent).toContain('resource "aws_db_instance" "main"');
      
      // Check database configuration
      expect(tapStackContent).toContain('engine            = var.db_engine');
      expect(tapStackContent).toContain('engine_version    = var.db_engine_version');
      expect(tapStackContent).toContain('storage_encrypted = true');
      expect(tapStackContent).toContain('backup_retention_period');
    });

    test('should have load balancer configuration', () => {
      const tapStackContent = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
      
      // Check ALB resources
      expect(tapStackContent).toContain('resource "aws_lb" "main"');
      expect(tapStackContent).toContain('resource "aws_lb_target_group" "main"');
      expect(tapStackContent).toContain('resource "aws_lb_listener" "main"');
      
      // Check ALB configuration
      expect(tapStackContent).toContain('load_balancer_type = "application"');
      expect(tapStackContent).toContain('internal           = false');
    });

    test('should have auto scaling configuration', () => {
      const tapStackContent = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
      
      // Check ASG resources
      expect(tapStackContent).toContain('resource "aws_launch_template" "main"');
      expect(tapStackContent).toContain('resource "aws_autoscaling_group" "main"');
      
      // Check ASG configuration
      expect(tapStackContent).toContain('min_size');
      expect(tapStackContent).toContain('max_size');
      expect(tapStackContent).toContain('desired_capacity');
    });

    test('should have S3 configuration', () => {
      const tapStackContent = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
      
      // Check S3 resources
      expect(tapStackContent).toContain('resource "aws_s3_bucket" "main"');
      expect(tapStackContent).toContain('resource "aws_s3_bucket_versioning" "main"');
      expect(tapStackContent).toContain('resource "aws_s3_bucket_server_side_encryption_configuration" "main"');
      
      // Check S3 configuration
      expect(tapStackContent).toContain('versioning_configuration');
      expect(tapStackContent).toContain('sse_algorithm = "AES256"');
    });

    test('should have monitoring configuration', () => {
      const tapStackContent = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
      
      // Check CloudWatch resources
      expect(tapStackContent).toContain('resource "aws_cloudwatch_log_group" "main"');
      expect(tapStackContent).toContain('resource "aws_cloudwatch_metric_alarm" "high_cpu"');
      expect(tapStackContent).toContain('resource "aws_cloudwatch_metric_alarm" "db_high_cpu"');
      
      // Check monitoring configuration
      expect(tapStackContent).toContain('retention_in_days');
      expect(tapStackContent).toContain('comparison_operator = "GreaterThanThreshold"');
    });
  });

  describe('Environment-Specific Configuration', () => {
    test('should have environment-specific configurations', () => {
      const tapStackContent = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
      
      // Check environment configuration
      expect(tapStackContent).toContain('environment_config = {');
      expect(tapStackContent).toContain('dev = {');
      expect(tapStackContent).toContain('staging = {');
      expect(tapStackContent).toContain('prod = {');
      
      // Check environment-specific settings
      expect(tapStackContent).toContain('instance_type');
      expect(tapStackContent).toContain('db_instance_class');
      expect(tapStackContent).toContain('backup_retention');
    });

    test('should have proper tagging strategy', () => {
      const tapStackContent = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
      
      // Check tagging configuration
      expect(tapStackContent).toContain('base_tags = {');
      expect(tapStackContent).toContain('common_tags = merge');
      expect(tapStackContent).toContain('Project     = var.project_name');
      expect(tapStackContent).toContain('Environment = var.environment');
      expect(tapStackContent).toContain('ManagedBy   = "terraform"');
    });
  });

  describe('Output Configuration', () => {
    test('should have comprehensive outputs', () => {
      const tapStackContent = fs.readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
      
      // Check key outputs
      expect(tapStackContent).toContain('output "vpc_id"');
      expect(tapStackContent).toContain('output "public_subnet_ids"');
      expect(tapStackContent).toContain('output "private_subnet_ids"');
      expect(tapStackContent).toContain('output "alb_dns_name"');
      expect(tapStackContent).toContain('output "db_instance_endpoint"');
      expect(tapStackContent).toContain('output "s3_bucket_name"');
    });
  });

  afterAll(() => {
    // Clean up plan file
    try {
      fs.unlinkSync(path.join(terraformDir, 'tfplan'));
    } catch (error) {
      // Plan file might not exist, ignore error
    }
  });
});
