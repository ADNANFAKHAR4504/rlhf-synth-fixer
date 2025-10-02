// tests/unit/terraform.unit.test.ts
// Unit tests for Terraform infrastructure modules

import fs from 'fs';
import path from 'path';
import * as HCL from 'hcl2-parser';

const libDir = path.resolve(__dirname, '../lib');

describe('Terraform Infrastructure Unit Tests', () => {
  let allTerraformFiles: Record<string, string> = {};

  beforeAll(() => {
    // Load all Terraform files for testing
    const files = fs.readdirSync(libDir).filter(f => f.endsWith('.tf'));
    files.forEach(file => {
      const content = fs.readFileSync(path.join(libDir, file), 'utf8');
      allTerraformFiles[file] = content;
    });
  });

  describe('File Structure Tests', () => {
    test('all required Terraform files exist', () => {
      const requiredFiles = [
        'provider.tf',
        'variables.tf',
        'locals.tf',
        'vpc.tf',
        'security_group.tf',
        'ec2.tf',
        's3.tf',
        'cloudwatch.tf',
        'outputs.tf'
      ];

      requiredFiles.forEach(file => {
        expect(fs.existsSync(path.join(libDir, file))).toBe(true);
      });
    });

    test('provider.tf has correct structure', () => {
      const content = allTerraformFiles['provider.tf'];
      expect(content).toContain('terraform {');
      expect(content).toContain('required_version = ">= 1.4.0"');
      expect(content).toContain('backend "s3"');
      expect(content).toContain('provider "aws"');
    });
  });

  describe('Variables Tests', () => {
    test('all required variables are defined', () => {
      const content = allTerraformFiles['variables.tf'];
      const requiredVars = [
        'aws_region',
        'project_name',
        'environment',
        'vpc_cidr',
        'public_subnet_1_cidr',
        'public_subnet_2_cidr',
        'instance_type',
        'ssh_allowed_cidr',
        'environment_suffix'
      ];

      requiredVars.forEach(varName => {
        expect(content).toContain(`variable "${varName}"`);
      });
    });

    test('variables have proper descriptions', () => {
      const content = allTerraformFiles['variables.tf'];
      expect(content).toMatch(/description\s*=\s*".*"/g);
    });

    test('environment_suffix variable exists', () => {
      const content = allTerraformFiles['variables.tf'];
      expect(content).toContain('variable "environment_suffix"');
      expect(content).toContain('Environment suffix for unique resource naming');
    });
  });

  describe('Locals Tests', () => {
    test('locals.tf exists and defines naming convention', () => {
      const content = allTerraformFiles['locals.tf'];
      expect(content).toContain('locals {');
      expect(content).toContain('environment_suffix');
      expect(content).toContain('name_prefix');
      expect(content).toContain('common_tags');
    });

    test('name_prefix uses environment suffix correctly', () => {
      const content = allTerraformFiles['locals.tf'];
      expect(content).toContain('${var.project_name}-${local.environment_suffix}');
    });

    test('common_tags structure is properly defined', () => {
      const content = allTerraformFiles['locals.tf'];
      expect(content).toContain('Project');
      expect(content).toContain('Environment');
      expect(content).toContain('EnvironmentSuffix');
      expect(content).toContain('ManagedBy');
    });
  });

  describe('VPC Module Tests', () => {
    test('VPC resource is properly configured', () => {
      const content = allTerraformFiles['vpc.tf'];
      expect(content).toContain('resource "aws_vpc" "main"');
      expect(content).toContain('cidr_block');
      expect(content).toContain('enable_dns_hostnames = true');
      expect(content).toContain('enable_dns_support   = true');
    });

    test('Internet Gateway is configured', () => {
      const content = allTerraformFiles['vpc.tf'];
      expect(content).toContain('resource "aws_internet_gateway" "main"');
      expect(content).toContain('vpc_id = aws_vpc.main.id');
    });

    test('Two public subnets are configured', () => {
      const content = allTerraformFiles['vpc.tf'];
      expect(content).toContain('resource "aws_subnet" "public_1"');
      expect(content).toContain('resource "aws_subnet" "public_2"');
      expect(content).toContain('var.public_subnet_1_cidr');
      expect(content).toContain('var.public_subnet_2_cidr');
      expect(content).toContain('map_public_ip_on_launch = true');
    });

    test('Route table and associations are configured', () => {
      const content = allTerraformFiles['vpc.tf'];
      expect(content).toContain('resource "aws_route_table" "public"');
      expect(content).toContain('resource "aws_route_table_association" "public_1"');
      expect(content).toContain('resource "aws_route_table_association" "public_2"');
      expect(content).toContain('0.0.0.0/0');
    });

    test('VPC Flow Logs are configured', () => {
      const content = allTerraformFiles['vpc.tf'];
      expect(content).toContain('resource "aws_flow_log" "main"');
      expect(content).toContain('traffic_type    = "ALL"');
      expect(content).toContain('resource "aws_cloudwatch_log_group" "flow_log"');
      expect(content).toContain('resource "aws_iam_role" "flow_log"');
    });

    test('all VPC resources use environment suffix naming', () => {
      const content = allTerraformFiles['vpc.tf'];
      expect(content).toContain('${local.name_prefix}-vpc');
      expect(content).toContain('${local.name_prefix}-igw');
      expect(content).toContain('${local.name_prefix}-public-subnet-1');
      expect(content).toContain('${local.name_prefix}-public-subnet-2');
      expect(content).toContain('${local.name_prefix}-flow-log');
    });
  });

  describe('Security Group Tests', () => {
    test('Security group is properly configured', () => {
      const content = allTerraformFiles['security_group.tf'];
      expect(content).toContain('resource "aws_security_group" "web"');
      expect(content).toContain('vpc_id      = aws_vpc.main.id');
    });

    test('HTTPS ingress rule is configured', () => {
      const content = allTerraformFiles['security_group.tf'];
      expect(content).toContain('from_port   = 443');
      expect(content).toContain('to_port     = 443');
      expect(content).toContain('protocol    = "tcp"');
      expect(content).toContain('"0.0.0.0/0"');
    });

    test('SSH ingress rule is restricted to internal network', () => {
      const content = allTerraformFiles['security_group.tf'];
      expect(content).toContain('from_port   = 22');
      expect(content).toContain('to_port     = 22');
      expect(content).toContain('var.ssh_allowed_cidr');
    });

    test('HTTP ingress rule is configured', () => {
      const content = allTerraformFiles['security_group.tf'];
      expect(content).toContain('from_port   = 80');
      expect(content).toContain('to_port     = 80');
    });

    test('Egress rule allows all outbound traffic', () => {
      const content = allTerraformFiles['security_group.tf'];
      expect(content).toContain('egress {');
      expect(content).toContain('from_port   = 0');
      expect(content).toContain('protocol    = "-1"');
    });

    test('Security group uses environment suffix naming', () => {
      const content = allTerraformFiles['security_group.tf'];
      expect(content).toContain('${local.name_prefix}-web-sg');
    });
  });

  describe('EC2 Module Tests', () => {
    test('AMI data source is configured', () => {
      const content = allTerraformFiles['ec2.tf'];
      expect(content).toContain('data "aws_ami" "amazon_linux_2"');
      expect(content).toContain('most_recent = true');
      expect(content).toContain('owners      = ["amazon"]');
    });

    test('Two EC2 instances are configured', () => {
      const content = allTerraformFiles['ec2.tf'];
      expect(content).toContain('resource "aws_instance" "web_1"');
      expect(content).toContain('resource "aws_instance" "web_2"');
    });

    test('EC2 instances use t3.small instance type', () => {
      const content = allTerraformFiles['ec2.tf'];
      expect(content).toContain('instance_type          = var.instance_type');
    });

    test('EC2 instances have IMDSv2 configured', () => {
      const content = allTerraformFiles['ec2.tf'];
      expect(content).toContain('metadata_options {');
      expect(content).toContain('http_tokens                 = "required"');
      expect(content).toContain('http_endpoint               = "enabled"');
    });

    test('EC2 instances have monitoring enabled', () => {
      const content = allTerraformFiles['ec2.tf'];
      expect(content).toContain('monitoring = true');
    });

    test('User data script installs nginx', () => {
      const content = allTerraformFiles['ec2.tf'];
      expect(content).toContain('amazon-linux-extras install -y nginx1');
      expect(content).toContain('systemctl enable nginx');
      expect(content).toContain('systemctl start nginx');
    });

    test('User data configures SSL certificates', () => {
      const content = allTerraformFiles['ec2.tf'];
      expect(content).toContain('openssl req -x509');
      expect(content).toContain('/etc/nginx/ssl/nginx.key');
      expect(content).toContain('/etc/nginx/ssl/nginx.crt');
    });

    test('EC2 instances use environment suffix naming', () => {
      const content = allTerraformFiles['ec2.tf'];
      expect(content).toContain('${local.name_prefix}-web-1');
      expect(content).toContain('${local.name_prefix}-web-2');
    });

    test('EC2 instances are in different subnets', () => {
      const content = allTerraformFiles['ec2.tf'];
      expect(content).toContain('subnet_id              = aws_subnet.public_1.id');
      expect(content).toContain('subnet_id              = aws_subnet.public_2.id');
    });
  });

  describe('S3 Module Tests', () => {
    test('S3 bucket is configured with random suffix', () => {
      const content = allTerraformFiles['s3.tf'];
      expect(content).toContain('resource "random_string" "bucket_suffix"');
      expect(content).toContain('resource "aws_s3_bucket" "static_images"');
      expect(content).toContain('${random_string.bucket_suffix.result}');
    });

    test('S3 bucket versioning is enabled', () => {
      const content = allTerraformFiles['s3.tf'];
      expect(content).toContain('resource "aws_s3_bucket_versioning" "static_images"');
      expect(content).toContain('status = "Enabled"');
    });

    test('CORS configuration is set up', () => {
      const content = allTerraformFiles['s3.tf'];
      expect(content).toContain('resource "aws_s3_bucket_cors_configuration" "static_images"');
      expect(content).toContain('allowed_methods = ["GET", "HEAD"]');
      expect(content).toContain('allowed_origins = ["*"]');
    });

    test('Public access block is configured', () => {
      const content = allTerraformFiles['s3.tf'];
      expect(content).toContain('resource "aws_s3_bucket_public_access_block" "static_images"');
      expect(content).toContain('block_public_acls       = false');
    });

    test('Bucket policy allows public read', () => {
      const content = allTerraformFiles['s3.tf'];
      expect(content).toContain('resource "aws_s3_bucket_policy" "static_images"');
      expect(content).toContain('s3:GetObject');
      expect(content).toContain('Principal = "*"');
    });

    test('S3 bucket uses environment suffix naming', () => {
      const content = allTerraformFiles['s3.tf'];
      expect(content).toContain('${local.name_prefix}-static-images');
    });
  });

  describe('CloudWatch Module Tests', () => {
    test('CloudWatch dashboard is configured', () => {
      const content = allTerraformFiles['cloudwatch.tf'];
      expect(content).toContain('resource "aws_cloudwatch_dashboard" "main"');
      expect(content).toContain('dashboard_name = "${local.name_prefix}-dashboard"');
    });

    test('Dashboard contains required widgets', () => {
      const content = allTerraformFiles['cloudwatch.tf'];
      expect(content).toContain('EC2 CPU Utilization');
      expect(content).toContain('Network Traffic');
      expect(content).toContain('Instance Status Checks');
      expect(content).toContain('T3 Instance CPU Credits');
    });

    test('CPU alarm is configured', () => {
      const content = allTerraformFiles['cloudwatch.tf'];
      expect(content).toContain('resource "aws_cloudwatch_metric_alarm" "high_cpu"');
      expect(content).toContain('threshold           = "80"');
      expect(content).toContain('metric_name         = "CPUUtilization"');
    });

    test('Nginx log group is configured', () => {
      const content = allTerraformFiles['cloudwatch.tf'];
      expect(content).toContain('resource "aws_cloudwatch_log_group" "nginx"');
      expect(content).toContain('retention_in_days = 7');
    });

    test('CloudWatch resources use environment suffix naming', () => {
      const content = allTerraformFiles['cloudwatch.tf'];
      expect(content).toContain('${local.name_prefix}-dashboard');
      expect(content).toContain('${local.name_prefix}-high-cpu');
      expect(content).toContain('${local.name_prefix}-nginx-logs');
    });
  });

  describe('Outputs Tests', () => {
    test('all required outputs are defined', () => {
      const content = allTerraformFiles['outputs.tf'];
      const requiredOutputs = [
        'vpc_id',
        'public_subnet_1_id',
        'public_subnet_2_id',
        'web_instance_1_public_ip',
        'web_instance_2_public_ip',
        'web_instance_1_id',
        'web_instance_2_id',
        's3_bucket_name',
        's3_bucket_arn',
        's3_bucket_domain_name',
        'security_group_id',
        'cloudwatch_dashboard_url',
        'flow_log_group_name'
      ];

      requiredOutputs.forEach(output => {
        expect(content).toContain(`output "${output}"`);
      });
    });

    test('outputs have descriptions', () => {
      const content = allTerraformFiles['outputs.tf'];
      const outputMatches = content.match(/output\s+"[^"]+"/g) || [];
      expect(outputMatches.length).toBeGreaterThan(10);

      outputMatches.forEach(() => {
        expect(content).toContain('description =');
      });
    });
  });

  describe('Resource Tagging Tests', () => {
    test('all resources use common_tags', () => {
      const filesToCheck = ['vpc.tf', 'security_group.tf', 'ec2.tf', 's3.tf', 'cloudwatch.tf'];

      filesToCheck.forEach(file => {
        const content = allTerraformFiles[file];
        expect(content).toContain('merge(local.common_tags');
      });
    });
  });

  describe('Infrastructure Requirements Validation', () => {
    test('VPC CIDR is 10.10.0.0/16', () => {
      const content = allTerraformFiles['variables.tf'];
      expect(content).toContain('default     = "10.10.0.0/16"');
    });

    test('Subnet CIDRs are correctly configured', () => {
      const content = allTerraformFiles['variables.tf'];
      expect(content).toContain('default     = "10.10.1.0/24"');
      expect(content).toContain('default     = "10.10.2.0/24"');
    });

    test('Instance type defaults to t3.small', () => {
      const content = allTerraformFiles['variables.tf'];
      expect(content).toContain('default     = "t3.small"');
    });

    test('SSH is restricted to 10.0.0.0/8', () => {
      const content = allTerraformFiles['variables.tf'];
      expect(content).toContain('default     = "10.0.0.0/8"');
    });

    test('AWS region defaults to us-east-1', () => {
      const content = allTerraformFiles['variables.tf'];
      expect(content).toContain('default     = "us-east-1"');
    });
  });

  describe('Best Practices Tests', () => {
    test('no hardcoded credentials in any file', () => {
      Object.values(allTerraformFiles).forEach(content => {
        expect(content).not.toMatch(/aws_access_key_id\s*=/);
        expect(content).not.toMatch(/aws_secret_access_key\s*=/);
        expect(content).not.toMatch(/AKIA[A-Z0-9]{16}/); // AWS access key pattern
      });
    });

    test('terraform version constraint is set', () => {
      const content = allTerraformFiles['provider.tf'];
      expect(content).toContain('required_version');
    });

    test('provider versions are pinned', () => {
      const content = allTerraformFiles['provider.tf'];
      expect(content).toContain('version = ">= 5.0"');
      expect(content).toContain('version = ">= 3.1"');
    });

    test('user_data uses base64 encoding properly', () => {
      const content = allTerraformFiles['ec2.tf'];
      expect(content).toContain('user_data_base64');
      expect(content).not.toContain('user_data =');
    });
  });
});