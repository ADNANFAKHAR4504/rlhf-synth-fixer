import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Configuration Unit Tests', () => {
  const libDir = path.join(__dirname, '..', 'lib');

  describe('File Structure', () => {
    it('should have tap_stack.tf file', () => {
      const filePath = path.join(libDir, 'tap_stack.tf');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have variables.tf file', () => {
      const filePath = path.join(libDir, 'variables.tf');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have outputs.tf file', () => {
      const filePath = path.join(libDir, 'outputs.tf');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have provider.tf file', () => {
      const filePath = path.join(libDir, 'provider.tf');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe('Resource Naming Convention', () => {
    it('should use environment_suffix in all resource names', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');

      // Check VPC naming
      expect(stackFile).toContain('ecommerce-vpc${var.environment_suffix}');

      // Check ALB naming
      expect(stackFile).toContain('ecommerce-alb${var.environment_suffix}');

      // Check RDS naming
      expect(stackFile).toContain('ecommerce-db${var.environment_suffix}');

      // Check S3 naming
      expect(stackFile).toContain('ecommerce-static-assets${var.environment_suffix}');
    });

    it('should include Environment and ManagedBy tags', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');

      expect(stackFile).toContain('Environment = var.environment_suffix');
      expect(stackFile).toContain('ManagedBy   = "Terraform"');
    });
  });

  describe('Variables Configuration', () => {
    it('should define environment_suffix variable', () => {
      const varsFile = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf-8');
      expect(varsFile).toContain('variable "environment_suffix"');
    });

    it('should define instance_type variable with validation', () => {
      const varsFile = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf-8');
      expect(varsFile).toContain('variable "instance_type"');
      expect(varsFile).toContain('validation');
    });

    it('should define db_instance_class variable', () => {
      const varsFile = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf-8');
      expect(varsFile).toContain('variable "db_instance_class"');
    });

    it('should mark sensitive variables as sensitive', () => {
      const varsFile = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf-8');
      expect(varsFile).toContain('sensitive   = true');
    });
  });

  describe('Network Configuration', () => {
    it('should create VPC with 10.0.0.0/16 CIDR', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('cidr_block           = "10.0.0.0/16"');
    });

    it('should create 2 public subnets', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('resource "aws_subnet" "public"');
      expect(stackFile).toContain('count                   = 2');
    });

    it('should create 2 private subnets', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('resource "aws_subnet" "private"');
      expect(stackFile).toContain('count             = 2');
    });

    it('should create NAT Gateway for private subnet connectivity', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('resource "aws_nat_gateway" "main"');
    });
  });

  describe('Security Groups', () => {
    it('should create ALB security group with HTTP/HTTPS ingress', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('resource "aws_security_group" "alb"');
      expect(stackFile).toContain('from_port   = 80');
      expect(stackFile).toContain('from_port   = 443');
    });

    it('should create EC2 security group allowing traffic from ALB', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('resource "aws_security_group" "ec2"');
      expect(stackFile).toContain('security_groups = [aws_security_group.alb.id]');
    });

    it('should create RDS security group allowing MySQL from EC2', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('resource "aws_security_group" "rds"');
      expect(stackFile).toContain('from_port       = 3306');
      expect(stackFile).toContain('security_groups = [aws_security_group.ec2.id]');
    });
  });

  describe('Encryption Configuration', () => {
    it('should create KMS key for encryption', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('resource "aws_kms_key" "main"');
      expect(stackFile).toContain('enable_key_rotation     = true');
    });

    it('should enable RDS storage encryption with KMS', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('storage_encrypted     = true');
      expect(stackFile).toContain('kms_key_id            = aws_kms_key.main.arn');
    });

    it('should enable S3 bucket encryption with KMS', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('resource "aws_s3_bucket_server_side_encryption_configuration"');
      expect(stackFile).toContain('sse_algorithm     = "aws:kms"');
    });
  });

  describe('Outputs Configuration', () => {
    it('should output ALB DNS name', () => {
      const outputsFile = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf-8');
      expect(outputsFile).toContain('output "alb_dns_name"');
      expect(outputsFile).toContain('aws_lb.main.dns_name');
    });

    it('should output RDS endpoint', () => {
      const outputsFile = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf-8');
      expect(outputsFile).toContain('output "rds_endpoint"');
      expect(outputsFile).toContain('aws_db_instance.main.endpoint');
    });

    it('should output S3 bucket name', () => {
      const outputsFile = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf-8');
      expect(outputsFile).toContain('output "s3_bucket_name"');
    });
  });

  describe('Auto Scaling Configuration', () => {
    it('should create launch template', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('resource "aws_launch_template" "app"');
    });

    it('should create auto scaling group', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('resource "aws_autoscaling_group" "app"');
    });

    it('should configure health checks for ASG', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('health_check_type         = "ELB"');
    });
  });

  describe('RDS Configuration', () => {
    it('should create MySQL RDS instance', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('resource "aws_db_instance" "main"');
      expect(stackFile).toContain('engine         = "mysql"');
    });

    it('should configure automated backups', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('backup_retention_period = 7');
      expect(stackFile).toContain('backup_window');
    });

    it('should allow destruction without final snapshot for testing', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('skip_final_snapshot = true');
      expect(stackFile).toContain('deletion_protection = false');
    });
  });

  describe('S3 Configuration', () => {
    it('should create S3 bucket with versioning', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('resource "aws_s3_bucket_versioning"');
      expect(stackFile).toContain('status = "Enabled"');
    });

    it('should block public access to S3 bucket', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('resource "aws_s3_bucket_public_access_block"');
      expect(stackFile).toContain('block_public_acls       = true');
    });
  });

  describe('Monitoring Configuration', () => {
    it('should create CloudWatch log group', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('resource "aws_cloudwatch_log_group" "app"');
    });

    it('should enable RDS CloudWatch logs export', () => {
      const stackFile = fs.readFileSync(path.join(libDir, 'tap_stack.tf'), 'utf-8');
      expect(stackFile).toContain('enabled_cloudwatch_logs_exports');
    });
  });

  describe('Provider Configuration', () => {
    it('should require Terraform version >= 1.5.0', () => {
      const providerFile = fs.readFileSync(path.join(libDir, 'provider.tf'), 'utf-8');
      expect(providerFile).toContain('required_version = ">= 1.5.0"');
    });

    it('should use AWS provider version ~> 5.0', () => {
      const providerFile = fs.readFileSync(path.join(libDir, 'provider.tf'), 'utf-8');
      expect(providerFile).toContain('version = "~> 5.0"');
    });

    it('should set default tags', () => {
      const providerFile = fs.readFileSync(path.join(libDir, 'provider.tf'), 'utf-8');
      expect(providerFile).toContain('default_tags');
    });
  });
});
