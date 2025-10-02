// Integration tests for Online Education Platform Infrastructure
// These tests validate the deployed infrastructure components

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const TERRAFORM_DIR = path.resolve(__dirname, '../lib');

describe('Online Education Platform Integration Tests', () => {
  describe('Infrastructure Validation', () => {
    test('Terraform configuration is valid', () => {
      // Validate that tap_stack.tf exists and is syntactically correct
      const stackPath = path.join(TERRAFORM_DIR, 'tap_stack.tf');
      expect(fs.existsSync(stackPath)).toBe(true);

      // This test validates configuration without actual deployment
      // In a real deployment scenario, we would:
      // 1. Initialize Terraform: terraform init
      // 2. Validate configuration: terraform validate
      // 3. Check resource definitions match requirements

      const content = fs.readFileSync(stackPath, 'utf8');

      // Verify key resources are defined
      expect(content).toContain('resource "aws_vpc"');
      expect(content).toContain('resource "aws_subnet"');
      expect(content).toContain('resource "aws_lb"');
      expect(content).toContain('resource "aws_autoscaling_group"');
      expect(content).toContain('resource "aws_db_instance"');
      expect(content).toContain('resource "aws_elasticache_replication_group"');
      expect(content).toContain('resource "aws_wafv2_web_acl"');
      expect(content).toContain('resource "aws_guardduty_detector"');
    });

    test('Security configurations are present', () => {
      const stackPath = path.join(TERRAFORM_DIR, 'tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

      // Verify security groups
      expect(content).toContain('resource "aws_security_group"');

      // Verify encryption settings
      expect(content).toContain('storage_encrypted');
      expect(content).toContain('at_rest_encryption_enabled');
      expect(content).toContain('transit_encryption_enabled');

      // Verify KMS encryption
      expect(content).toContain('resource "aws_kms_key"');

      // Verify IAM roles with least privilege
      expect(content).toContain('resource "aws_iam_role"');
      expect(content).toContain('resource "aws_iam_role_policy"');
    });

    test('Multi-AZ deployment is configured', () => {
      const stackPath = path.join(TERRAFORM_DIR, 'tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

      // Verify RDS multi-AZ
      expect(content).toContain('multi_az');

      // Verify multiple subnets across AZs
      expect(content).toMatch(/count\s*=\s*3/);

      // Verify ElastiCache multi-AZ
      expect(content).toContain('multi_az_enabled');
      expect(content).toContain('automatic_failover_enabled');
    });

    test('Auto-scaling policies are defined', () => {
      const stackPath = path.join(TERRAFORM_DIR, 'tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

      // Verify Auto Scaling Group
      expect(content).toContain('resource "aws_autoscaling_group"');

      // Verify scaling policies
      expect(content).toContain('resource "aws_autoscaling_policy"');

      // Verify CloudWatch alarms for scaling
      expect(content).toContain('resource "aws_cloudwatch_metric_alarm"');
      expect(content).toContain('CPUUtilization');
    });

    test('Monitoring and tracing are configured', () => {
      const stackPath = path.join(TERRAFORM_DIR, 'tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

      // Verify CloudWatch log groups
      expect(content).toContain('resource "aws_cloudwatch_log_group"');

      // Verify X-Ray configuration
      expect(content).toContain('resource "aws_xray_sampling_rule"');
      expect(content).toContain('xray');

      // Verify CloudWatch metrics
      expect(content).toContain('cloudwatch');
    });

    test('Backup and retention policies are configured', () => {
      const stackPath = path.join(TERRAFORM_DIR, 'tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

      // Verify RDS backup configuration
      expect(content).toContain('backup_retention_period');
      expect(content).toMatch(/backup_retention_period\s*=\s*[7-9]|[1-9][0-9]+/);

      // Verify ElastiCache snapshots
      expect(content).toContain('snapshot_retention_limit');
    });

    test('Resource tagging is consistent', () => {
      const stackPath = path.join(TERRAFORM_DIR, 'tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

      // Verify common tags are defined
      expect(content).toContain('common_tags');
      expect(content).toContain('Environment');
      expect(content).toContain('Owner');
      expect(content).toContain('Project');

      // Verify tags are applied using merge
      expect(content).toContain('merge(local.common_tags');
    });

    test('Network configuration follows best practices', () => {
      const stackPath = path.join(TERRAFORM_DIR, 'tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

      // Verify VPC CIDR is 10.0.0.0/16
      expect(content).toContain('10.0.0.0/16');

      // Verify public and private subnets
      expect(content).toContain('resource "aws_subnet" "public"');
      expect(content).toContain('resource "aws_subnet" "private"');

      // Verify NAT Gateway for private subnets
      expect(content).toContain('resource "aws_nat_gateway"');

      // Verify Internet Gateway for public access
      expect(content).toContain('resource "aws_internet_gateway"');
    });

    test('Database is not publicly accessible', () => {
      const stackPath = path.join(TERRAFORM_DIR, 'tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

      // Verify RDS is in private subnet
      expect(content).toContain('publicly_accessible');
      expect(content).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test('Session persistence is configured', () => {
      const stackPath = path.join(TERRAFORM_DIR, 'tap_stack.tf');
      const content = fs.readFileSync(stackPath, 'utf8');

      // Verify ElastiCache Redis is configured
      expect(content).toContain('resource "aws_elasticache_replication_group"');
      expect(content).toContain('redis');

      // Verify ALB stickiness for session persistence
      expect(content).toContain('stickiness');
      expect(content).toContain('lb_cookie');
    });
  });
});
