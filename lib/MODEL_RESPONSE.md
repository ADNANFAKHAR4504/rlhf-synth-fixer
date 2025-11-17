# Model Response: PCI-DSS Compliant Infrastructure

This document represents a typical initial model response to the PCI-DSS infrastructure prompt. This serves as a baseline for comparison against the ideal solution.

## Overview

This is a Terraform configuration for a PCI-DSS compliant payment processing infrastructure on AWS with zero-trust architecture.

## Implementation

### main.tf

```hcl
# Basic PCI-DSS Infrastructure Configuration

# Provider Configuration
terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "terraform-state-bucket"
    key    = "pci-dss/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = "us-east-1"
  
  default_tags {
    tags = {
      Environment     = "prod"
      Owner           = "security-team"
      ComplianceScope = "PCI-DSS"
    }
  }
}

# Variables
variable "aws_region" {
  default = "us-east-1"
}

variable "environment_suffix" {
  default = "dev"
}

variable "repository" {
  description = "Repository name"
  type        = string
  default     = "unknown"
}

variable "commit_author" {
  description = "Commit author"
  type        = string
  default     = "unknown"
}

# Locals
locals {
  common_tags = {
    Environment = "prod"
    Owner       = "security-team"
    Compliance  = "PCI-DSS"
  }
}

# Data Sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name = "main-vpc"
  })
}

# Subnets
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet("10.0.0.0/16", 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet("10.0.0.0/16", 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = merge(local.common_tags, {
    Name = "private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(local.common_tags, {
    Name = "main-igw"
  })
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = merge(local.common_tags, {
    Name = "public-rt"
  })
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "nat-eip"
  })
}

# NAT Gateway
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  
  tags = merge(local.common_tags, {
    Name = "main-nat"
  })
  
  depends_on = [aws_internet_gateway.main]
}

# Route Table for Private Subnets
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }
  
  tags = merge(local.common_tags, {
    Name = "private-rt"
  })
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# KMS Key
resource "aws_kms_key" "main" {
  description             = "KMS key for encryption"
  enable_key_rotation     = true
  deletion_window_in_days = 30
  
  tags = merge(local.common_tags, {
    Name = "main-kms-key"
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/main-key"
  target_key_id = aws_kms_key.main.key_id
}

# S3 Bucket for CloudTrail
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "${data.aws_caller_identity.current.account_id}-cloudtrail-logs"
  
  tags = merge(local.common_tags, {
    Name    = "cloudtrail-logs"
    Purpose = "CloudTrail"
  })
}

resource "aws_s3_bucket_versioning" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
      }
    ]
  })
}

# CloudTrail
resource "aws_cloudtrail" "main" {
  name                          = "main-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  
  tags = merge(local.common_tags, {
    Name = "main-cloudtrail"
  })
  
  depends_on = [aws_s3_bucket_policy.cloudtrail]
}

# Security Groups
resource "aws_security_group" "web" {
  name        = "web-sg"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from internet"
  }
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from internet"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }
  
  tags = merge(local.common_tags, {
    Name = "web-sg"
  })
}

resource "aws_security_group" "app" {
  name        = "app-sg"
  description = "Security group for application servers"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
    description     = "Application port from web tier"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }
  
  tags = merge(local.common_tags, {
    Name = "app-sg"
  })
}

# WAF
resource "aws_wafv2_web_acl" "main" {
  name        = "main-waf"
  scope       = "REGIONAL"
  description = "WAF for PCI-DSS compliance"
  
  default_action {
    allow {}
  }
  
  rule {
    name     = "rate-limit"
    priority = 1
    
    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }
    
    action {
      block {}
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "rate-limit"
      sampled_requests_enabled   = true
    }
  }
  
  rule {
    name     = "aws-managed-rules"
    priority = 2
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "aws-managed-rules"
      sampled_requests_enabled   = true
    }
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "main-waf"
    sampled_requests_enabled   = true
  }
  
  tags = merge(local.common_tags, {
    Name = "main-waf"
  })
}

# GuardDuty
resource "aws_guardduty_detector" "main" {
  enable = true
  
  tags = merge(local.common_tags, {
    Name = "main-guardduty"
  })
}

# AWS Config
resource "aws_config_configuration_recorder" "main" {
  name     = "main-recorder"
  role_arn = aws_iam_role.config.arn
  
  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

# IAM Role for Config
resource "aws_iam_role" "config" {
  name = "config-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "config.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
  
  tags = merge(local.common_tags, {
    Name = "config-role"
  })
}

resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

# SNS Topic for Alerts
resource "aws_sns_topic" "security_alerts" {
  name = "security-alerts"
  
  tags = merge(local.common_tags, {
    Name = "security-alerts"
  })
}

resource "aws_sns_topic_subscription" "security_email" {
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = "security@example.com"
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "main" {
  name              = "/aws/application/main"
  retention_in_days = 30
  
  tags = merge(local.common_tags, {
    Name = "main-logs"
  })
}

# IAM Role for EC2
resource "aws_iam_role" "ec2" {
  name = "ec2-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
  
  tags = merge(local.common_tags, {
    Name = "ec2-role"
  })
}

resource "aws_iam_role_policy" "ec2" {
  name = "ec2-policy"
  role = aws_iam_role.ec2.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2" {
  name = "ec2-profile"
  role = aws_iam_role.ec2.name
  
  tags = merge(local.common_tags, {
    Name = "ec2-profile"
  })
}

# Outputs
output "vpc_id" {
  value       = aws_vpc.main.id
  description = "VPC ID"
}

output "kms_key_id" {
  value       = aws_kms_key.main.id
  description = "KMS Key ID"
}

output "cloudtrail_name" {
  value       = aws_cloudtrail.main.name
  description = "CloudTrail name"
}

output "guardduty_detector_id" {
  value       = aws_guardduty_detector.main.id
  description = "GuardDuty detector ID"
}

output "waf_web_acl_id" {
  value       = aws_wafv2_web_acl.main.id
  description = "WAF Web ACL ID"
}
```

## Code Quality Issues

This implementation contains several code quality and best practice violations:

### 1. Missing Provider Specifications
All 92 resources lack explicit `provider` specification, which can cause issues in multi-region deployments:

```hcl
# All resources missing provider specification
resource "aws_vpc" "main" {
  # Missing: provider = aws.primary
  cidr_block = "10.0.0.0/16"
}

resource "aws_kms_key" "main" {
  # Missing: provider = aws.primary
  description = "KMS key for encryption"
}
```

### 2. Hardcoded Account IDs
Using hardcoded AWS account IDs instead of variables:

```hcl
# Example: Hardcoded account ID in bucket policy
resource "aws_s3_bucket_policy" "example" {
  policy = jsonencode({
    Statement = [{
      Principal = {
        AWS = "arn:aws:iam::123456789012:root"  # Hardcoded
      }
    }]
  })
}
```

### 3. Hardcoded Email Addresses
Using hardcoded emails instead of variables:

```hcl
# Example: Hardcoded email in SNS subscription
resource "aws_sns_topic_subscription" "alerts" {
  endpoint = "security-team@example.com"  # Hardcoded
}
```

### 4. Hardcoded Secrets
Exposing secrets without marking them as sensitive:

```hcl
# Example: Hardcoded API key
output "api_key" {
  value = "placeholder-api-key"  # Hardcoded and not marked sensitive
}
```

### 5. Hardcoded Region-Specific Values
Using hardcoded AWS service account IDs that vary by region:

```hcl
# Example: Hardcoded ELB service account ID for us-east-1
resource "aws_s3_bucket_policy" "alb_logs" {
  policy = jsonencode({
    Statement = [{
      Principal = {
        AWS = "arn:aws:iam::127311923021:root"  # us-east-1 specific, breaks in other regions
      }
    }]
  })
}
```

## Summary

This configuration provides:
- Single VPC with public/private subnets across 2 availability zones
- NAT Gateway for private subnet internet access
- KMS encryption with key rotation
- CloudTrail logging with multi-region support
- WAF with rate limiting and AWS managed rules
- GuardDuty threat detection
- AWS Config monitoring
- Security groups for web and application tiers
- SNS topic for security alerts
- CloudWatch log group for application logs
- IAM roles for EC2 instances with basic policies
- S3 bucket with versioning and encryption for CloudTrail

## Gaps and Limitations

While this configuration addresses many PCI-DSS requirements, it has several limitations:

1. **Network Architecture**: Uses a single VPC instead of separate DMZ, Application, and Data VPCs
2. **Encryption**: Uses AES256 for S3 instead of KMS encryption
3. **Multi-Region**: No secondary region provider configured
4. **VPC Flow Logs**: Not implemented
5. **Parameter Store**: Missing for secrets management
6. **Load Balancer**: No ALB or logging configuration
7. **CloudWatch Alarms**: No monitoring or alerting configured
8. **IAM Policies**: Uses wildcard resources instead of explicit ARNs
9. **MFA Delete**: Not enabled on S3 buckets
10. **Lifecycle Policies**: No S3 lifecycle management to Glacier
11. **Provider Specifications**: Missing on all 92 resources
12. **Hardcoded Values**: Account IDs, emails, secrets not parameterized
13. **Region-Specific Values**: Hardcoded service account IDs instead of data sources

The infrastructure meets basic compliance requirements but requires additional hardening for production deployment.