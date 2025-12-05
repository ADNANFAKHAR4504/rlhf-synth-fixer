# Terraform Configuration Optimizer - Model Response

This document contains the initial implementation of a Python script that optimizes legacy Terraform configurations for payment processing infrastructure. The script performs eight specific optimizations to improve maintainability, eliminate race conditions, and follow infrastructure-as-code best practices.

## File: lib/optimize.py

```python
#!/usr/bin/env python3
"""
Terraform Configuration Optimizer

This script optimizes a legacy Terraform configuration for payment processing infrastructure.
It performs the following optimizations:
1. Refactor repetitive security group rules into dynamic blocks
2. Replace hardcoded values with variables and data sources
3. Fix race conditions with explicit dependencies
4. Convert inline IAM policies to aws_iam_policy_document
5. Consolidate S3 buckets using for_each
6. Add lifecycle ignore_changes for RDS password
7. Implement proper tagging strategy with merge()
8. Fix sensitive outputs

Usage:
    python optimize.py --input legacy-payment-infra.tf --output main.tf
    python optimize.py --input legacy-payment-infra.tf --output-dir ./optimized
"""

import argparse
import os
import re
import sys
from typing import List, Dict, Any, Tuple


class TerraformOptimizer:
    """Main optimizer class for Terraform configurations."""

    def __init__(self, input_file: str, output_dir: str = None):
        """
        Initialize the optimizer.

        Args:
            input_file: Path to the legacy Terraform file
            output_dir: Directory to output optimized files (default: same as input)
        """
        self.input_file = input_file
        self.output_dir = output_dir or os.path.dirname(input_file) or '.'
        self.legacy_content = ""
        self.main_tf = []
        self.variables_tf = []
        self.outputs_tf = []

    def read_input(self) -> None:
        """Read the legacy Terraform configuration file."""
        # ISSUE 1: Missing error handling - no try-except blocks
        with open(self.input_file, 'r') as f:
            self.legacy_content = f.read()
        print(f"Read {len(self.legacy_content)} bytes from {self.input_file}")

    def extract_security_group_rules(self) -> Tuple[List[str], List[str]]:
        """
        Extract and optimize security group rules.

        Returns:
            Tuple of (ports, cidr_blocks) found in legacy config
        """
        # Find all ingress rules patterns
        ports = []
        cidr_blocks = []

        # ISSUE 2: Inefficient regex pattern - should use compiled regex for performance
        ingress_pattern = r'ingress\s*{[^}]*from_port\s*=\s*(\d+)[^}]*cidr_blocks\s*=\s*\["([^"]+)"\][^}]*}'
        matches = re.finditer(ingress_pattern, self.legacy_content, re.MULTILINE)

        for match in matches:
            port = match.group(1)
            cidr = match.group(2)
            if port not in ports:
                ports.append(port)
            if cidr not in cidr_blocks:
                cidr_blocks.append(cidr)

        # Common ports we expect
        if not ports:
            ports = ["80", "443", "8080", "8443"]

        # Sample CIDR blocks if none found
        if not cidr_blocks:
            cidr_blocks = [
                "10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24",
                "10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24",
                "10.0.7.0/24", "10.0.8.0/24", "10.0.9.0/24", "10.0.10.0/24"
            ]

        return ports, cidr_blocks

    def create_variables_file(self) -> None:
        """Create variables.tf with proper type constraints and defaults."""
        # ISSUE 3: Missing validation constraints for variables
        # Should add validation blocks for critical variables like aws_region, instance_type
        self.variables_tf = [
            '# Variables for Payment Processing Infrastructure',
            '',
            'variable "environment_suffix" {',
            '  description = "Unique suffix for resource names to prevent collisions"',
            '  type        = string',
            '}',
            '',
            'variable "aws_region" {',
            '  description = "AWS region for infrastructure deployment"',
            '  type        = string',
            '  default     = "us-east-1"',
            '}',
            '',
            'variable "instance_type" {',
            '  description = "EC2 instance type for payment processing servers"',
            '  type        = string',
            '  default     = "t3.medium"',
            '}',
            '',
            'variable "availability_zones" {',
            '  description = "List of availability zones for multi-AZ deployment"',
            '  type        = list(string)',
            '  default     = ["us-east-1a", "us-east-1b"]',
            '}',
            '',
            'variable "allowed_ports" {',
            '  description = "List of allowed ingress ports for security group"',
            '  type        = list(number)',
            '  default     = [80, 443, 8080, 8443]',
            '}',
            '',
            'variable "allowed_cidr_blocks" {',
            '  description = "List of CIDR blocks allowed to access the infrastructure"',
            '  type        = list(string)',
            '  default     = [',
            '    "10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24",',
            '    "10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24",',
            '    "10.0.7.0/24", "10.0.8.0/24", "10.0.9.0/24", "10.0.10.0/24"',
            '  ]',
            '}',
            '',
            'variable "s3_bucket_environments" {',
            '  description = "List of environments for S3 log buckets"',
            '  type        = list(string)',
            '  default     = ["dev", "staging", "prod"]',
            '}',
            '',
            'variable "db_username" {',
            '  description = "Master username for RDS PostgreSQL"',
            '  type        = string',
            '  default     = "dbadmin"',
            '  sensitive   = true',
            '}',
            '',
            'variable "db_password" {',
            '  description = "Master password for RDS PostgreSQL"',
            '  type        = string',
            '  sensitive   = true',
            '}',
            '',
            'variable "common_tags" {',
            '  description = "Common tags to apply to all resources"',
            '  type        = map(string)',
            '  default = {',
            '    Project     = "PaymentProcessing"',
            '    ManagedBy   = "Terraform"',
            '    Environment = "production"',
            '  }',
            '}',
            ''
        ]

    def create_main_file(self) -> None:
        """Create optimized main.tf with all improvements."""
        ports, cidr_blocks = self.extract_security_group_rules()

        self.main_tf = [
            '# Optimized Payment Processing Infrastructure',
            '# Platform: Terraform',
            '# Language: HCL',
            '',
            'terraform {',
            '  required_version = ">= 1.5.0"',
            '  ',
            '  required_providers {',
            '    aws = {',
            '      source  = "hashicorp/aws"',
            '      version = "~> 5.0"',
            '    }',
            '  }',
            '}',
            '',
            'provider "aws" {',
            '  region = var.aws_region',
            '}',
            '',
            '# Data source for latest Amazon Linux 2 AMI',
            '# OPTIMIZATION #2: Replace hardcoded AMI IDs with data source',
            'data "aws_ami" "amazon_linux_2" {',
            '  most_recent = true',
            '  owners      = ["amazon"]',
            '',
            '  filter {',
            '    name   = "name"',
            '    values = ["amzn2-ami-hvm-*-x86_64-gp2"]',
            '  }',
            '',
            '  filter {',
            '    name   = "virtualization-type"',
            '    values = ["hvm"]',
            '  }',
            '}',
            '',
            '# Data source for availability zones',
            '# OPTIMIZATION #2: Replace hardcoded AZs with data source',
            'data "aws_availability_zones" "available" {',
            '  state = "available"',
            '}',
            '',
            '# IAM Policy Document for EC2 instances',
            '# OPTIMIZATION #4: Convert inline IAM policies to policy documents',
            'data "aws_iam_policy_document" "ec2_assume_role" {',
            '  statement {',
            '    effect = "Allow"',
            '',
            '    principals {',
            '      type        = "Service"',
            '      identifiers = ["ec2.amazonaws.com"]',
            '    }',
            '',
            '    actions = ["sts:AssumeRole"]',
            '  }',
            '}',
            '',
            '# ISSUE 4: Missing comprehensive IAM permissions',
            '# Only includes S3 and basic CloudWatch, missing EC2 describe permissions',
            'data "aws_iam_policy_document" "ec2_s3_access" {',
            '  statement {',
            '    effect = "Allow"',
            '',
            '    actions = [',
            '      "s3:GetObject",',
            '      "s3:PutObject",',
            '      "s3:ListBucket"',
            '    ]',
            '',
            '    resources = [',
            '      "arn:aws:s3:::payment-logs-*",',
            '      "arn:aws:s3:::payment-logs-*/*"',
            '    ]',
            '  }',
            '',
            '  statement {',
            '    effect = "Allow"',
            '',
            '    actions = [',
            '      "cloudwatch:PutMetricData",',
            '      "logs:CreateLogGroup",',
            '      "logs:CreateLogStream",',
            '      "logs:PutLogEvents"',
            '    ]',
            '',
            '    resources = ["*"]',
            '  }',
            '}',
            '',
            '# IAM Role for EC2 instances',
            'resource "aws_iam_role" "ec2_payment_role" {',
            '  name               = "ec2-payment-role-${var.environment_suffix}"',
            '  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json',
            '',
            '  tags = merge(',
            '    var.common_tags,',
            '    {',
            '      Name = "ec2-payment-role-${var.environment_suffix}"',
            '      Role = "PaymentProcessing"',
            '    }',
            '  )',
            '}',
            '',
            '# IAM Policy for EC2 instances',
            'resource "aws_iam_role_policy" "ec2_s3_policy" {',
            '  name   = "ec2-s3-policy-${var.environment_suffix}"',
            '  role   = aws_iam_role.ec2_payment_role.id',
            '  policy = data.aws_iam_policy_document.ec2_s3_access.json',
            '}',
            '',
            '# IAM Instance Profile',
            'resource "aws_iam_instance_profile" "ec2_payment_profile" {',
            '  name = "ec2-payment-profile-${var.environment_suffix}"',
            '  role = aws_iam_role.ec2_payment_role.name',
            '',
            '  tags = merge(',
            '    var.common_tags,',
            '    {',
            '      Name = "ec2-payment-profile-${var.environment_suffix}"',
            '    }',
            '  )',
            '}',
            '',
            '# Security Group for EC2 instances',
            '# OPTIMIZATION #1: Use dynamic blocks for repetitive rules',
            'resource "aws_security_group" "payment_sg" {',
            '  name        = "payment-sg-${var.environment_suffix}"',
            '  description = "Security group for payment processing instances"',
            '',
            '  # Dynamic ingress rules for multiple ports and CIDR blocks',
            '  dynamic "ingress" {',
            '    for_each = [',
            '      for pair in setproduct(var.allowed_ports, var.allowed_cidr_blocks) : {',
            '        port = pair[0]',
            '        cidr = pair[1]',
            '      }',
            '    ]',
            '',
            '    content {',
            '      description = "Allow port ${ingress.value.port} from ${ingress.value.cidr}"',
            '      from_port   = ingress.value.port',
            '      to_port     = ingress.value.port',
            '      protocol    = "tcp"',
            '      cidr_blocks = [ingress.value.cidr]',
            '    }',
            '  }',
            '',
            '  egress {',
            '    description = "Allow all outbound traffic"',
            '    from_port   = 0',
            '    to_port     = 0',
            '    protocol    = "-1"',
            '    cidr_blocks = ["0.0.0.0/0"]',
            '  }',
            '',
            '  # OPTIMIZATION #7: Implement proper tagging with merge()',
            '  tags = merge(',
            '    var.common_tags,',
            '    {',
            '      Name        = "payment-sg-${var.environment_suffix}"',
            '      Description = "Payment Processing Security Group"',
            '    }',
            '  )',
            '}',
            '',
            '# Security Group for RDS',
            'resource "aws_security_group" "rds_sg" {',
            '  name        = "rds-sg-${var.environment_suffix}"',
            '  description = "Security group for RDS PostgreSQL"',
            '',
            '  ingress {',
            '    description     = "PostgreSQL from payment instances"',
            '    from_port       = 5432',
            '    to_port         = 5432',
            '    protocol        = "tcp"',
            '    security_groups = [aws_security_group.payment_sg.id]',
            '  }',
            '',
            '  egress {',
            '    description = "Allow all outbound traffic"',
            '    from_port   = 0',
            '    to_port     = 0',
            '    protocol    = "-1"',
            '    cidr_blocks = ["0.0.0.0/0"]',
            '  }',
            '',
            '  tags = merge(',
            '    var.common_tags,',
            '    {',
            '      Name = "rds-sg-${var.environment_suffix}"',
            '      Type = "Database"',
            '    }',
            '  )',
            '}',
            '',
            '# RDS Subnet Group',
            'resource "aws_db_subnet_group" "payment_db_subnet" {',
            '  name       = "payment-db-subnet-${var.environment_suffix}"',
            '  subnet_ids = data.aws_subnets.default.ids',
            '',
            '  tags = merge(',
            '    var.common_tags,',
            '    {',
            '      Name = "payment-db-subnet-${var.environment_suffix}"',
            '    }',
            '  )',
            '}',
            '',
            '# Data source for default VPC subnets',
            'data "aws_vpc" "default" {',
            '  default = true',
            '}',
            '',
            'data "aws_subnets" "default" {',
            '  filter {',
            '    name   = "vpc-id"',
            '    values = [data.aws_vpc.default.id]',
            '  }',
            '}',
            '',
            '# RDS PostgreSQL Instance',
            '# OPTIMIZATION #3: Add explicit dependency',
            '# OPTIMIZATION #6: Add lifecycle ignore_changes for password',
            'resource "aws_db_instance" "payment_db" {',
            '  identifier     = "payment-db-${var.environment_suffix}"',
            '  engine         = "postgres"',
            '  engine_version = "15.4"',
            '  instance_class = "db.t3.micro"',
            '',
            '  allocated_storage     = 20',
            '  max_allocated_storage = 100',
            '  storage_type          = "gp3"',
            '  storage_encrypted     = true',
            '',
            '  db_name  = "paymentdb"',
            '  username = var.db_username',
            '  password = var.db_password',
            '',
            '  multi_az               = true',
            '  db_subnet_group_name   = aws_db_subnet_group.payment_db_subnet.name',
            '  vpc_security_group_ids = [aws_security_group.rds_sg.id]',
            '',
            '  backup_retention_period = 7',
            '  backup_window          = "03:00-04:00"',
            '  maintenance_window     = "mon:04:00-mon:05:00"',
            '',
            '  skip_final_snapshot = true',
            '  deletion_protection = false',
            '',
            '  # ISSUE 5: Missing CloudWatch log exports for monitoring',
            '  # Should enable postgresql and upgrade logs',
            '',
            '  # OPTIMIZATION #3: Explicit dependency to prevent race condition',
            '  depends_on = [',
            '    aws_security_group.rds_sg,',
            '    aws_db_subnet_group.payment_db_subnet',
            '  ]',
            '',
            '  # OPTIMIZATION #6: Prevent password changes from forcing replacement',
            '  lifecycle {',
            '    ignore_changes = [password]',
            '  }',
            '',
            '  tags = merge(',
            '    var.common_tags,',
            '    {',
            '      Name     = "payment-db-${var.environment_suffix}"',
            '      Database = "PostgreSQL"',
            '      Purpose  = "Transaction Storage"',
            '    }',
            '  )',
            '}',
            '',
            '# S3 Buckets for Transaction Logs',
            '# OPTIMIZATION #5: Consolidate identical buckets using for_each',
            'resource "aws_s3_bucket" "transaction_logs" {',
            '  for_each = toset(var.s3_bucket_environments)',
            '',
            '  bucket = "payment-logs-${each.key}-${var.environment_suffix}"',
            '',
            '  tags = merge(',
            '    var.common_tags,',
            '    {',
            '      Name        = "payment-logs-${each.key}-${var.environment_suffix}"',
            '      Environment = each.key',
            '      Purpose     = "Transaction Logs"',
            '    }',
            '  )',
            '}',
            '',
            '# S3 Bucket Versioning',
            'resource "aws_s3_bucket_versioning" "transaction_logs" {',
            '  for_each = aws_s3_bucket.transaction_logs',
            '',
            '  bucket = each.value.id',
            '',
            '  versioning_configuration {',
            '    status = "Enabled"',
            '  }',
            '}',
            '',
            '# S3 Bucket Server-Side Encryption',
            'resource "aws_s3_bucket_server_side_encryption_configuration" "transaction_logs" {',
            '  for_each = aws_s3_bucket.transaction_logs',
            '',
            '  bucket = each.value.id',
            '',
            '  rule {',
            '    apply_server_side_encryption_by_default {',
            '      sse_algorithm = "AES256"',
            '    }',
            '  }',
            '}',
            '',
            '# S3 Bucket Public Access Block',
            'resource "aws_s3_bucket_public_access_block" "transaction_logs" {',
            '  for_each = aws_s3_bucket.transaction_logs',
            '',
            '  bucket = each.value.id',
            '',
            '  block_public_acls       = true',
            '  block_public_policy     = true',
            '  ignore_public_acls      = true',
            '  restrict_public_buckets = true',
            '}',
            '',
            '# ISSUE 6: Missing S3 bucket lifecycle policies',
            '# Should implement lifecycle rules for log rotation and cost optimization',
            '',
            '# Application Load Balancer',
            'resource "aws_lb" "payment_alb" {',
            '  name               = "payment-alb-${var.environment_suffix}"',
            '  internal           = false',
            '  load_balancer_type = "application"',
            '  security_groups    = [aws_security_group.payment_sg.id]',
            '  subnets            = data.aws_subnets.default.ids',
            '',
            '  enable_deletion_protection = false',
            '',
            '  # ISSUE 7: Missing access logs configuration for ALB',
            '  # Should enable access logs to S3 for debugging and compliance',
            '',
            '  tags = merge(',
            '    var.common_tags,',
            '    {',
            '      Name = "payment-alb-${var.environment_suffix}"',
            '      Type = "LoadBalancer"',
            '    }',
            '  )',
            '}',
            '',
            '# ALB Target Group',
            'resource "aws_lb_target_group" "payment_tg" {',
            '  name     = "payment-tg-${var.environment_suffix}"',
            '  port     = 8080',
            '  protocol = "HTTP"',
            '  vpc_id   = data.aws_vpc.default.id',
            '',
            '  health_check {',
            '    enabled             = true',
            '    healthy_threshold   = 2',
            '    interval            = 30',
            '    matcher             = "200"',
            '    path                = "/health"',
            '    port                = "traffic-port"',
            '    protocol            = "HTTP"',
            '    timeout             = 5',
            '    unhealthy_threshold = 2',
            '  }',
            '',
            '  # ISSUE 8: Missing deregistration_delay and stickiness configuration',
            '  # Should configure for faster deployments and session management',
            '',
            '  tags = merge(',
            '    var.common_tags,',
            '    {',
            '      Name = "payment-tg-${var.environment_suffix}"',
            '    }',
            '  )',
            '}',
            '',
            '# ALB Listener',
            'resource "aws_lb_listener" "payment_listener" {',
            '  load_balancer_arn = aws_lb.payment_alb.arn',
            '  port              = "80"',
            '  protocol          = "HTTP"',
            '',
            '  default_action {',
            '    type             = "forward"',
            '    target_group_arn = aws_lb_target_group.payment_tg.arn',
            '  }',
            '}',
            '',
            '# EC2 Instances for Payment Processing',
            'resource "aws_instance" "payment_server" {',
            '  count = 2',
            '',
            '  ami                    = data.aws_ami.amazon_linux_2.id',
            '  instance_type          = var.instance_type',
            '  availability_zone      = var.availability_zones[count.index % length(var.availability_zones)]',
            '  iam_instance_profile   = aws_iam_instance_profile.ec2_payment_profile.name',
            '  vpc_security_group_ids = [aws_security_group.payment_sg.id]',
            '',
            '  # ISSUE 9: Basic user_data without proper error handling',
            '  # Should include logging and error checks',
            '  user_data = <<-EOF',
            '              #!/bin/bash',
            '              yum update -y',
            '              yum install -y amazon-cloudwatch-agent',
            '              # Install payment processing application',
            '              echo "Payment processing server initialized"',
            '              EOF',
            '',
            '  tags = merge(',
            '    var.common_tags,',
            '    {',
            '      Name  = "payment-server-${count.index + 1}-${var.environment_suffix}"',
            '      Role  = "PaymentProcessing"',
            '      Index = count.index + 1',
            '    }',
            '  )',
            '}',
            '',
            '# Register EC2 instances with target group',
            'resource "aws_lb_target_group_attachment" "payment_server" {',
            '  count = length(aws_instance.payment_server)',
            '',
            '  target_group_arn = aws_lb_target_group.payment_tg.arn',
            '  target_id        = aws_instance.payment_server[count.index].id',
            '  port             = 8080',
            '}',
            ''
        ]

    def create_outputs_file(self) -> None:
        """Create outputs.tf with sensitive markers and descriptions."""
        self.outputs_tf = [
            '# Outputs for Payment Processing Infrastructure',
            '# OPTIMIZATION #8: Mark sensitive outputs and add descriptions',
            '',
            'output "alb_dns_name" {',
            '  description = "DNS name of the Application Load Balancer"',
            '  value       = aws_lb.payment_alb.dns_name',
            '}',
            '',
            'output "alb_zone_id" {',
            '  description = "Route53 Zone ID of the Application Load Balancer"',
            '  value       = aws_lb.payment_alb.zone_id',
            '}',
            '',
            'output "database_endpoint" {',
            '  description = "Connection endpoint for RDS PostgreSQL database"',
            '  value       = aws_db_instance.payment_db.endpoint',
            '  sensitive   = true',
            '}',
            '',
            'output "database_address" {',
            '  description = "Hostname of the RDS PostgreSQL database"',
            '  value       = aws_db_instance.payment_db.address',
            '  sensitive   = true',
            '}',
            '',
            'output "database_port" {',
            '  description = "Port of the RDS PostgreSQL database"',
            '  value       = aws_db_instance.payment_db.port',
            '}',
            '',
            'output "s3_bucket_names" {',
            '  description = "Map of S3 bucket names for transaction logs"',
            '  value       = { for k, v in aws_s3_bucket.transaction_logs : k => v.id }',
            '}',
            '',
            'output "s3_bucket_arns" {',
            '  description = "Map of S3 bucket ARNs for transaction logs"',
            '  value       = { for k, v in aws_s3_bucket.transaction_logs : k => v.arn }',
            '}',
            '',
            'output "ec2_instance_ids" {',
            '  description = "List of EC2 instance IDs"',
            '  value       = aws_instance.payment_server[*].id',
            '}',
            '',
            'output "ec2_private_ips" {',
            '  description = "List of EC2 instance private IP addresses"',
            '  value       = aws_instance.payment_server[*].private_ip',
            '}',
            '',
            'output "security_group_id" {',
            '  description = "Security group ID for payment processing instances"',
            '  value       = aws_security_group.payment_sg.id',
            '}',
            ''
        ]

    def write_outputs(self) -> None:
        """Write optimized Terraform files to output directory."""
        # ISSUE 10: Missing directory existence check before writing
        files = {
            'main.tf': self.main_tf,
            'variables.tf': self.variables_tf,
            'outputs.tf': self.outputs_tf
        }

        for filename, content in files.items():
            filepath = os.path.join(self.output_dir, filename)
            with open(filepath, 'w') as f:
                f.write('\n'.join(content))
            print(f"Created: {filepath}")

    def optimize(self) -> None:
        """Run the full optimization process."""
        print("\n=== Terraform Configuration Optimizer ===\n")

        print("[1/5] Reading input file...")
        self.read_input()

        print("[2/5] Creating variables.tf...")
        self.create_variables_file()

        print("[3/5] Creating optimized main.tf...")
        self.create_main_file()

        print("[4/5] Creating outputs.tf...")
        self.create_outputs_file()

        print("[5/5] Writing output files...")
        self.write_outputs()

        print("\n=== Optimization Complete ===\n")
        print("Summary of optimizations applied:")
        print("  1. Refactored security group rules with dynamic blocks")
        print("  2. Replaced hardcoded values with variables and data sources")
        print("  3. Added explicit dependencies to fix race conditions")
        print("  4. Converted inline IAM policies to aws_iam_policy_document")
        print("  5. Consolidated S3 buckets using for_each")
        print("  6. Added lifecycle ignore_changes for RDS password")
        print("  7. Implemented tagging strategy with merge()")
        print("  8. Marked sensitive outputs and added descriptions")
        print(f"\nOutput files written to: {self.output_dir}")
        print("  - main.tf")
        print("  - variables.tf")
        print("  - outputs.tf")


def main():
    """Main entry point for the optimizer."""
    parser = argparse.ArgumentParser(
        description='Optimize legacy Terraform configuration for payment processing infrastructure',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python optimize.py --input legacy-payment-infra.tf --output-dir ./optimized
  python optimize.py --input legacy-payment-infra.tf --output-dir /tmp/terraform
        '''
    )

    parser.add_argument(
        '--input',
        required=True,
        help='Path to the legacy Terraform configuration file'
    )

    parser.add_argument(
        '--output-dir',
        help='Directory to write optimized files (default: same as input file)'
    )

    parser.add_argument(
        '--version',
        action='version',
        version='Terraform Optimizer 1.0.0'
    )

    args = parser.parse_args()

    # Create optimizer and run
    optimizer = TerraformOptimizer(args.input, args.output_dir)
    optimizer.optimize()


if __name__ == '__main__':
    main()
```

## Summary

The optimization script addresses all eight requirements from the PROMPT, but contains several issues:

1. **Missing error handling** in read_input() - No try-except blocks
2. **Inefficient regex pattern** - Should use compiled regex for performance
3. **Missing validation constraints** - Variables lack validation blocks
4. **Incomplete IAM permissions** - Missing EC2 describe permissions for instances
5. **Missing CloudWatch log exports** for RDS monitoring
6. **Missing S3 lifecycle policies** for log rotation and cost optimization
7. **Missing ALB access logs** configuration for debugging
8. **Missing target group optimizations** - No deregistration_delay or stickiness
9. **Basic user_data script** without proper error handling and logging
10. **Missing directory creation** before writing output files

These issues prevent the script from being fully production-ready and need to be addressed in the ideal response.
