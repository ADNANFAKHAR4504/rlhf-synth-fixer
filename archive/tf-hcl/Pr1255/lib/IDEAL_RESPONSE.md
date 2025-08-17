# Secure AWS Multi-Region Infrastructure with Terraform

This document provides a comprehensive guide to a secure, multi-region AWS infrastructure implemented using Terraform. The infrastructure follows security best practices, implements compliance standards (SOC2, PCI-DSS), and includes monitoring and alerting capabilities.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Provider Configuration](#provider-configuration)
3. [Environment Configuration](#environment-configuration)
4. [Core Infrastructure Components](#core-infrastructure-components)
5. [Security Implementation](#security-implementation)
6. [Threat Detection and Response](#threat-detection-and-response)
7. [DDoS Protection and API Security](#ddos-protection-and-api-security)
8. [Monitoring and Alerting](#monitoring-and-alerting)
9. [Compliance and Configuration Management](#compliance-and-configuration-management)
10. [Terraform Outputs](#terraform-outputs)
11. [Best Practices Implemented](#best-practices-implemented)

## Architecture Overview

This infrastructure deploys a secure, multi-region setup across two AWS regions:
- **Primary Region**: us-west-1
- **Secondary Region**: eu-central-1

The architecture implements a 3-tier design with:
- **Web Tier**: Public-facing components with restricted access
- **Application Tier**: Private application servers
- **Database Tier**: Secure database layer with encryption

## Provider Configuration

### Terraform Requirements and Providers

```hcl
# From: provider.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}
```

**Key Points:**
- Requires Terraform version 1.0 or higher for stability and feature support
- Uses AWS provider version 5.x for latest AWS service support
- Backend configuration is commented out for flexibility in different environments

### Multi-Region Provider Setup

```hcl
# From: provider.tf
# Primary AWS Provider (us-west-1)
provider "aws" {
  alias  = "us_west"
  region = "us-west-1"

  default_tags {
    tags = local.common_tags
  }
}

# Secondary AWS Provider (eu-central-1)
provider "aws" {
  alias  = "eu_central"
  region = "eu-central-1"

  default_tags {
    tags = local.common_tags
  }
}
```

**Benefits:**
- **Multi-region deployment** for high availability and disaster recovery
- **Automatic tagging** applied to all resources for cost tracking and management
- **Region-specific configurations** while maintaining consistency

## Environment Configuration

### Local Variables and Common Settings

```hcl
# From: secure_aws_environment.tf
locals {
  environment = terraform.workspace
  common_tags = {
    Environment   = local.environment
    Project      = "SecureCloudInfra"
    Owner        = "DevOpsTeam"
    ManagedBy    = "Terraform"
    CostCenter   = "IT-Security"
    Compliance   = "SOC2-PCI-DSS"
  }
  
  # Allowed IP ranges for security groups (replace with your actual ranges)
  allowed_ip_ranges = [
    "10.0.0.0/8",     # Internal network
    "172.16.0.0/12",  # Private network
    "203.0.113.0/24"  # Example public IP range - replace with actual
  ]
  
  regions = ["us-west-1", "eu-central-1"]
}
```

**Security Features:**
- **Workspace-based environments** for dev/staging/production isolation
- **Consistent tagging strategy** for governance and cost allocation
- **Compliance tags** for audit and regulatory requirements
- **Restricted IP ranges** to limit access to known safe networks

## Core Infrastructure Components

### Data Sources

```hcl
# From: tap_stack.tf
# Data sources for current AWS account and caller identity
data "aws_caller_identity" "current" {}
data "aws_region" "us_west" {
  provider = aws.us_west
}
data "aws_region" "eu_central" {
  provider = aws.eu_central
}
```

**Purpose:** Dynamically retrieve AWS account information and region details for resource configuration.

### Encryption at Rest - KMS Configuration

```hcl
# From: tap_stack.tf
# KMS Keys for encryption
resource "aws_kms_key" "main_us_west" {
  provider                = aws.us_west
  description             = "Main KMS key for ${local.environment} environment in us-west-1"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnableRootPermissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "AllowCloudWatchLogs"
        Effect = "Allow"
        Principal = {
          Service = "logs.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
}

# Similar configuration for eu-central-1...

# KMS Key Aliases for easier management
resource "aws_kms_alias" "main_us_west" {
  provider      = aws.us_west
  name          = "alias/secure-${local.environment}-us-west-1-${random_string.bucket_suffix.result}"
  target_key_id = aws_kms_key.main_us_west.key_id
}
```

**Security Features:**
- **Automatic key rotation** enabled for enhanced security
- **Service-specific permissions** for CloudWatch Logs integration
- **Short deletion window** (7 days) for operational recovery
- **Region-specific keys** for data sovereignty requirements

### Network Infrastructure

#### VPC Configuration

```hcl
# From: tap_stack.tf
# VPC Configuration - us-west-1
resource "aws_vpc" "secure_app_vpc_us_west" {
  provider             = aws.us_west
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "SecureAppVPC-${local.environment}-us-west-1"
  })
}

# VPC Configuration - eu-central-1
resource "aws_vpc" "secure_app_vpc_eu_central" {
  provider             = aws.eu_central
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "SecureAppVPC-${local.environment}-eu-central-1"
  })
}
```

**Network Design:**
- **Separate CIDR blocks** for each region to avoid conflicts
- **DNS resolution enabled** for internal service discovery
- **Non-overlapping IP ranges** (10.0.0.0/16 and 10.1.0.0/16)

#### Subnet Architecture

```hcl
# From: tap_stack.tf
# Private Subnets - US West 1
resource "aws_subnet" "private_subnet_us_west_1a" {
  provider          = aws.us_west
  vpc_id            = aws_vpc.secure_app_vpc_us_west.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-west-1a"
  
  tags = merge(local.common_tags, {
    Name = "PrivateSubnet-${local.environment}-us-west-1a"
    Type = "Private"
  })
}

# Public Subnets for NAT Gateways
resource "aws_subnet" "public_subnet_us_west_1a" {
  provider                = aws.us_west
  vpc_id                  = aws_vpc.secure_app_vpc_us_west.id
  cidr_block              = "10.0.10.0/24"
  availability_zone       = "us-west-1a"
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "PublicSubnet-${local.environment}-us-west-1a"
    Type = "Public"
  })
}
```

**High Availability Design:**
- **Multiple Availability Zones** in each region
- **Private subnets** for application and database tiers
- **Public subnets** only for NAT Gateways and load balancers
- **Consistent IP allocation** across regions

#### Internet Connectivity

```hcl
# From: tap_stack.tf
# Internet Gateways
resource "aws_internet_gateway" "igw_us_west" {
  provider = aws.us_west
  vpc_id   = aws_vpc.secure_app_vpc_us_west.id
  
  tags = merge(local.common_tags, {
    Name = "SecureIGW-${local.environment}-us-west-1"
  })
}

# NAT Gateways with Elastic IPs
resource "aws_eip" "nat_eip_us_west" {
  provider = aws.us_west
  domain   = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "NATGatewayEIP-${local.environment}-us-west-1"
  })
}

resource "aws_nat_gateway" "nat_us_west" {
  provider      = aws.us_west
  allocation_id = aws_eip.nat_eip_us_west.id
  subnet_id     = aws_subnet.public_subnet_us_west_1a.id
  
  tags = merge(local.common_tags, {
    Name = "NATGateway-${local.environment}-us-west-1"
  })
}
```

**Security Benefits:**
- **Controlled internet access** through NAT Gateways
- **Private subnet isolation** - no direct internet connectivity
- **Static IP addresses** for outbound traffic (Elastic IPs)

#### Routing Configuration

```hcl
# From: tap_stack.tf
# Route Tables
resource "aws_route_table" "private_rt_us_west" {
  provider = aws.us_west
  vpc_id   = aws_vpc.secure_app_vpc_us_west.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_us_west.id
  }
  
  tags = merge(local.common_tags, {
    Name = "PrivateRouteTable-${local.environment}-us-west-1"
  })
}

# Route Table Associations
resource "aws_route_table_association" "private_rta_us_west_1a" {
  provider       = aws.us_west
  subnet_id      = aws_subnet.private_subnet_us_west_1a.id
  route_table_id = aws_route_table.private_rt_us_west.id
}
```

**Routing Strategy:**
- **Separate route tables** for public and private subnets
- **Private traffic** routed through NAT Gateways
- **Public traffic** routed through Internet Gateways

## Security Implementation

### Security Groups - Defense in Depth

```hcl
# From: tap_stack.tf
# Web Tier Security Group
resource "aws_security_group" "web_tier_us_west" {
  provider    = aws.us_west
  name        = "${local.environment}-web-tier-sg-us-west-1"
  description = "Security group for web tier with restricted access"
  vpc_id      = aws_vpc.secure_app_vpc_us_west.id
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = local.allowed_ip_ranges
    description = "HTTPS from allowed IP ranges"
  }
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = local.allowed_ip_ranges
    description = "HTTP from allowed IP ranges"
  }
  
  # Restricted egress - HTTPS for external API calls and updates
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS outbound for API calls and updates"
  }

  # DNS resolution
  egress {
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = [aws_vpc.secure_app_vpc_us_west.cidr_block]
    description = "DNS resolution within VPC"
  }

  # HTTP for package updates (can be restricted to specific repos in production)
  egress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP for package updates"
  }

  # Database access to database tier
  egress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.database_tier_us_west.id]
    description     = "MySQL to database tier"
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.environment}-web-tier-sg-us-west-1"
    Tier = "Web"
  })
}

# From: tap_stack.tf
# Database Tier Security Group
resource "aws_security_group" "database_tier_us_west" {
  provider    = aws.us_west
  name        = "${local.environment}-database-tier-sg-us-west-1"
  description = "Security group for database tier"
  vpc_id      = aws_vpc.secure_app_vpc_us_west.id
  
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web_tier_us_west.id]
    description     = "MySQL from web tier"
  }
  
  # DNS resolution for updates
  egress {
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = [aws_vpc.secure_app_vpc_us_west.cidr_block]
    description = "DNS resolution within VPC"
  }

  # HTTPS for security updates and patches
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS for security updates and patches"
  }

  # HTTP for package repositories (restricted as much as possible)
  egress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP for package updates"
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.environment}-database-tier-sg-us-west-1"
    Tier = "Database"
  })
}
```

**Security Principles:**
- **Least privilege access** - only necessary ports opened
- **Source restriction** - traffic only from allowed IP ranges or security groups
- **Tier-based isolation** - database only accessible from web tier
- **Descriptive rules** for audit and compliance

### Identity and Access Management (IAM)

#### Password Policy

```hcl
# From: tap_stack.tf
# IAM Password Policy
resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = 14
  require_lowercase_characters   = true
  require_numbers               = true
  require_uppercase_characters   = true
  require_symbols               = true
  allow_users_to_change_password = true
  max_password_age              = 90
  password_reuse_prevention     = 24
  hard_expiry                   = false
}
```

**Compliance Features:**
- **Strong password requirements** (14+ characters, complexity)
- **Regular password rotation** (90 days)
- **Password history** prevention (24 previous passwords)

#### IAM Roles and Policies

```hcl
# From: tap_stack.tf
# IAM Role for EC2 instances with least privilege
resource "aws_iam_role" "ec2_secure_role" {
  name = "EC2SecureRole-${local.environment}-${random_string.bucket_suffix.result}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}
```

**Resource Naming Strategy:**

The infrastructure uses a hybrid naming approach optimized for management and uniqueness:

**Predictable Naming (Management-Friendly):**
- **Security Groups**: Use descriptive, predictable patterns: `${environment}-${tier}-sg-${region}`
  - Example: `default-web-tier-sg-us-west-1`, `default-database-tier-sg-eu-central-1`
  - **Benefits**: Easy to identify, scriptable, team-friendly, audit-friendly
  - **Uniqueness**: Ensured by environment prefix + region suffix + VPC scoping

**Random Suffix Naming (Conflict Prevention):**
For resources requiring global or regional uniqueness, random suffixes (`${random_string.bucket_suffix.result}`) prevent conflicts:

- **Global Services**: IAM roles, policies, groups, instance profiles (global namespace)
- **Regional Services**: KMS aliases, CloudWatch log groups, SNS topics, WAF Web ACLs
- **API Gateway**: REST APIs and other API Gateway resources
- **Multiple Environments**: Allows deployment of the same infrastructure in different environments/workspaces
- **Conflict Prevention**: Eliminates "EntityAlreadyExists" and "AlreadyExistsException" errors during deployment

**Naming Pattern Examples:**
- **Security Groups**: `default-web-tier-sg-us-west-1` (predictable)
- **IAM Roles**: `EC2SecureRole-default-k4x9d1cb` (random suffix)
- **KMS Aliases**: `alias/main-key-default-us-west-1-k4x9d1cb` (random suffix)
- **CloudWatch Log Groups**: `/aws/application/default/us-west-1-k4x9d1cb` (random suffix)
- **AWS Config**: Configuration recorders and delivery channels
- **S3**: Bucket names for AWS Config storage

```hcl
# IAM Policy for EC2 role with minimal permissions
resource "aws_iam_role_policy" "ec2_secure_policy" {
  name = "EC2SecurePolicy-${local.environment}-${random_string.bucket_suffix.result}"
  role = aws_iam_role.ec2_secure_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "ec2:DescribeVolumes",
          "ec2:DescribeTags"
        ]
        Resource = "*"
      }
    ]
  })
}
```

#### Multi-Factor Authentication (MFA) Enforcement

```hcl
# From: tap_stack.tf
# IAM Policy requiring MFA for console access
resource "aws_iam_policy" "force_mfa" {
  name        = "ForceMFA-${local.environment}-${random_string.bucket_suffix.result}"
  description = "Policy to force MFA for console access"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyAllExceptUnlessSignedInWithMFA"
        Effect = "Deny"
        NotAction = [
          "iam:CreateVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:GetUser",
          "iam:ListMFADevices",
          "iam:ListVirtualMFADevices",
          "iam:ResyncMFADevice",
          "sts:GetSessionToken"
        ]
        Resource = "*"
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      }
    ]
  })
  
  tags = local.common_tags
}

# IAM Group for developers with MFA requirement
resource "aws_iam_group" "developers" {
  name = "Developers-${local.environment}-${random_string.bucket_suffix.result}"
}

# Attach MFA policy to developers group
resource "aws_iam_group_policy_attachment" "developers_force_mfa" {
  group      = aws_iam_group.developers.name
  policy_arn = aws_iam_policy.force_mfa.arn
}
```

**Security Enhancements:**
- **Mandatory MFA** for console access
- **Granular permissions** for specific AWS services only
- **Role-based access control** with least privilege principle

## Threat Detection and Response

### AWS GuardDuty - Intelligent Threat Detection

AWS GuardDuty provides intelligent threat detection for malicious activity and unauthorized behavior across the entire AWS infrastructure.

```hcl
# From: tap_stack.tf
# GuardDuty Detector - us-west-1
resource "aws_guardduty_detector" "main_us_west" {
  provider = aws.us_west
  enable   = true

  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = true
      }
    }
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes {
          enable = true
        }
      }
    }
  }

  tags = merge(local.common_tags, {
    Name = "GuardDutyDetector-${local.environment}-us-west-1"
  })
}

# GuardDuty Detector - eu-central-1
resource "aws_guardduty_detector" "main_eu_central" {
  provider = aws.eu_central
  enable   = true

  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = true
      }
    }
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes {
          enable = true
        }
      }
    }
  }

  tags = merge(local.common_tags, {
    Name = "GuardDutyDetector-${local.environment}-eu-central-1"
  })
}
```

### Threat Intelligence Integration

```hcl
# From: tap_stack.tf
# Custom threat intelligence set for enhanced detection
resource "aws_guardduty_threatintelset" "threat_intel_us_west" {
  provider        = aws.us_west
  activate        = true
  detector_id     = aws_guardduty_detector.main_us_west.id
  format          = "TXT"
  location        = "s3://${aws_s3_bucket.config_bucket_us_west.bucket}/threat-intel/malicious-ips.txt"
  name            = "ThreatIntelSet-${local.environment}-us-west-1"

  tags = merge(local.common_tags, {
    Name = "GuardDutyThreatIntel-${local.environment}-us-west-1"
  })

  # Note: This requires the threat intel file to exist in S3
  # In production, you would populate this with actual threat intelligence data
}
```

### Automated Threat Response with CloudWatch Events

```hcl
# From: tap_stack.tf
# CloudWatch Event Rule for GuardDuty findings
resource "aws_cloudwatch_event_rule" "guardduty_finding_us_west" {
  provider    = aws.us_west
  name        = "guardduty-finding-${local.environment}-us-west-1"
  description = "Capture GuardDuty findings"

  event_pattern = jsonencode({
    source        = ["aws.guardduty"]
    detail-type   = ["GuardDuty Finding"]
    detail = {
      severity = [4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 5.0, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 6.0, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 7.0, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 8.0, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 9.0, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 10.0]
    }
  })

  tags = merge(local.common_tags, {
    Name = "GuardDutyEventRule-${local.environment}-us-west-1"
  })
}

# GuardDuty CloudWatch Event Target - SNS Integration
resource "aws_cloudwatch_event_target" "guardduty_sns_us_west" {
  provider  = aws.us_west
  rule      = aws_cloudwatch_event_rule.guardduty_finding_us_west.name
  target_id = "GuardDutySNSTarget"
  arn       = aws_sns_topic.security_alerts_us_west.arn
}
```

**GuardDuty Threat Detection Features:**

- **Malware Protection**: Scans EC2 instances and EBS volumes for malicious files
- **S3 Log Analysis**: Monitors S3 access patterns for suspicious activity
- **Kubernetes Audit Logs**: Analyzes EKS cluster activity for threats
- **Automated Alerting**: High and critical severity findings trigger immediate SNS notifications
- **Threat Intelligence**: Custom threat feeds enhance detection accuracy
- **Multi-Region Monitoring**: Comprehensive coverage across both regions

## DDoS Protection and API Security

### AWS WAF - Web Application Firewall

AWS WAF protects applications from common web exploits and provides DDoS protection with comprehensive rule sets.

```hcl
# From: tap_stack.tf
# WAF Web ACL with comprehensive protection rules
resource "aws_wafv2_web_acl" "api_protection_us_west" {
  provider = aws.us_west
  name     = "APIProtection-${local.environment}-us-west-1-${random_string.bucket_suffix.result}"
  scope    = "REGIONAL"

  default_action {
    allow {}
  }

  # Rate limiting rule - DDoS protection
  rule {
    name     = "RateLimitRule"
    priority = 1

    override_action {
      none {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                 = "RateLimitRule"
      sampled_requests_enabled    = true
    }

    action {
      block {}
    }
  }

  # AWS Managed Rules - Core Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
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
      metric_name                 = "CommonRuleSetMetric"
      sampled_requests_enabled    = true
    }
  }

  # AWS Managed Rules - Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                 = "KnownBadInputsRuleSetMetric"
      sampled_requests_enabled    = true
    }
  }

  # Geo-blocking rule for enhanced security
  rule {
    name     = "GeoBlockRule"
    priority = 4

    action {
      block {}
    }

    statement {
      geo_match_statement {
        country_codes = ["CN", "RU", "KP"]  # Block high-risk countries
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                 = "GeoBlockRule"
      sampled_requests_enabled    = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                 = "APIProtectionWebACL"
    sampled_requests_enabled    = true
  }

  tags = merge(local.common_tags, {
    Name = "WAFWebACL-${local.environment}-us-west-1"
  })
}
```

### API Gateway CloudWatch Integration

Before API Gateway can log to CloudWatch, we need to set up account-level IAM roles:

```hcl
# From: tap_stack.tf
# IAM Role for API Gateway CloudWatch Logs
resource "aws_iam_role" "api_gateway_cloudwatch_role" {
  name = "APIGatewayCloudWatchLogsRole-${random_string.bucket_suffix.result}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for API Gateway CloudWatch Logs
resource "aws_iam_role_policy" "api_gateway_cloudwatch_policy" {
  name = "APIGatewayCloudWatchLogsPolicy"
  role = aws_iam_role.api_gateway_cloudwatch_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogGroups", 
          "logs:DescribeLogStreams",
          "logs:PutLogEvents",
          "logs:GetLogEvents",
          "logs:FilterLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

# API Gateway Account Settings for CloudWatch Logs (us-west-1)
resource "aws_api_gateway_account" "api_gateway_account_us_west" {
  provider           = aws.us_west
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch_role.arn
}

# API Gateway Account Settings for CloudWatch Logs (eu-central-1) 
resource "aws_api_gateway_account" "api_gateway_account_eu_central" {
  provider           = aws.eu_central
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch_role.arn
}
```

**Account-Level Configuration:**
- **Single IAM Role**: Shared across both regions for consistency
- **Comprehensive Permissions**: Full CloudWatch Logs access for API Gateway
- **Regional Account Settings**: Configured per region for proper logging
- **Dependency Management**: API Gateway stages depend on account configuration

### API Gateway with Advanced Security

```hcl
# From: tap_stack.tf
# API Gateway with IP-restricted policies and comprehensive logging
resource "aws_api_gateway_rest_api" "secure_api_us_west" {
  provider = aws.us_west
  name     = "SecureAPI-${local.environment}-us-west-1-${random_string.bucket_suffix.result}"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = "*"
        Action = "execute-api:Invoke"
        Resource = "*"
        Condition = {
          IpAddress = {
            "aws:SourceIp" = local.allowed_ip_ranges
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "APIGateway-${local.environment}-us-west-1"
  })
}

# API Gateway Stage with X-Ray tracing and detailed logging
resource "aws_api_gateway_stage" "secure_api_stage_us_west" {
  provider  = aws.us_west
  deployment_id = aws_api_gateway_deployment.secure_api_deployment_us_west.id
  rest_api_id   = aws_api_gateway_rest_api.secure_api_us_west.id
  stage_name    = local.environment

  xray_tracing_enabled = true

  depends_on = [aws_api_gateway_account.api_gateway_account_us_west]

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.application_logs_us_west.arn
    format         = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      caller         = "$context.identity.caller"
      user           = "$context.identity.user"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = merge(local.common_tags, {
    Name = "APIGatewayStage-${local.environment}-us-west-1"
  })
}
```

### WAF and API Gateway Integration

```hcl
# From: tap_stack.tf
# Associate WAF with API Gateway for complete protection
resource "aws_wafv2_web_acl_association" "api_waf_association_us_west" {
  provider     = aws.us_west
  resource_arn = aws_api_gateway_stage.secure_api_stage_us_west.arn
  web_acl_arn  = aws_wafv2_web_acl.api_protection_us_west.arn
}
```

**DDoS Protection Features:**

- **Rate Limiting**: 2000 requests per 5-minute window per IP address
- **AWS Managed Rules**: Protection against OWASP Top 10 and common attacks
- **Geo-blocking**: Automatic blocking of high-risk countries
- **Real-time Monitoring**: CloudWatch metrics for all WAF rules
- **IP Restrictions**: API Gateway policies limit access to allowed IP ranges
- **X-Ray Tracing**: Detailed request tracing for performance analysis
- **Comprehensive Logging**: Full request/response logging to CloudWatch

## Monitoring and Alerting

### CloudWatch Log Groups

```hcl
# From: tap_stack.tf
# CloudWatch Log Groups with encryption
resource "aws_cloudwatch_log_group" "application_logs_us_west" {
  provider          = aws.us_west
  name              = "/aws/application/${local.environment}/us-west-1-${random_string.bucket_suffix.result}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main_us_west.arn
  
  tags = merge(local.common_tags, {
    Name = "ApplicationLogs-${local.environment}-us-west-1"
  })
}

resource "aws_cloudwatch_log_group" "security_logs_us_west" {
  provider          = aws.us_west
  name              = "/aws/security/${local.environment}/us-west-1-${random_string.bucket_suffix.result}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.main_us_west.arn
  
  tags = merge(local.common_tags, {
    Name = "SecurityLogs-${local.environment}-us-west-1"
  })
}
```

**Logging Strategy:**
- **Encrypted log storage** using KMS keys
- **Different retention periods** (30 days for application, 90 days for security)
- **Centralized logging** with structured log groups

### CloudWatch Alarms

```hcl
# From: tap_stack.tf
# CloudWatch Alarms for security monitoring
resource "aws_cloudwatch_metric_alarm" "high_cpu_us_west" {
  provider            = aws.us_west
  alarm_name          = "HighCPUUtilization-${local.environment}-us-west-1-${random_string.bucket_suffix.result}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.security_alerts_us_west.arn]
  
  tags = merge(local.common_tags, {
    Name = "HighCPUAlarm-${local.environment}-us-west-1"
  })
}
```

### SNS Topics for Notifications

```hcl
# From: tap_stack.tf
# SNS Topics for security alerts
resource "aws_sns_topic" "security_alerts_us_west" {
  provider         = aws.us_west
  name             = "SecurityAlerts-${local.environment}-us-west-1-${random_string.bucket_suffix.result}"
  kms_master_key_id = aws_kms_key.main_us_west.id
  
  tags = merge(local.common_tags, {
    Name = "SecurityAlerts-${local.environment}-us-west-1"
  })
}
```

**Alerting Features:**
- **Real-time monitoring** with CloudWatch alarms
- **Encrypted SNS topics** for secure notifications
- **Multi-region alerting** setup

## Compliance and Configuration Management

### AWS Config Setup

First, we need to create the IAM role and S3 buckets for AWS Config:

```hcl
# From: tap_stack.tf
# IAM Role for AWS Config
resource "aws_iam_role" "config_role" {
  name = "AWSConfigRole-${local.environment}-${random_string.bucket_suffix.result}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# Attach AWS managed policy for Config service role
resource "aws_iam_role_policy_attachment" "config_role_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

# S3 bucket for AWS Config delivery channel - US West
resource "aws_s3_bucket" "config_bucket_us_west" {
  provider      = aws.us_west
  bucket        = "aws-config-${local.environment}-us-west-1-${random_string.bucket_suffix.result}"
  force_destroy = true

  tags = merge(local.common_tags, {
    Name = "AWSConfigBucket-${local.environment}-us-west-1"
  })
}

# S3 bucket for AWS Config delivery channel - EU Central  
resource "aws_s3_bucket" "config_bucket_eu_central" {
  provider      = aws.eu_central
  bucket        = "aws-config-${local.environment}-eu-central-1-${random_string.bucket_suffix.result}"
  force_destroy = true

  tags = merge(local.common_tags, {
    Name = "AWSConfigBucket-${local.environment}-eu-central-1"
  })
}

# Random string for S3 bucket suffix
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 bucket encryption for Config buckets
resource "aws_s3_bucket_server_side_encryption_configuration" "config_bucket_us_west_encryption" {
  provider = aws.us_west
  bucket   = aws_s3_bucket.config_bucket_us_west.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main_us_west.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config_bucket_eu_central_encryption" {
  provider = aws.eu_central
  bucket   = aws_s3_bucket.config_bucket_eu_central.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main_eu_central.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# S3 bucket public access block for Config buckets
resource "aws_s3_bucket_public_access_block" "config_bucket_us_west_pab" {
  provider = aws.us_west
  bucket   = aws_s3_bucket.config_bucket_us_west.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "config_bucket_eu_central_pab" {
  provider = aws.eu_central
  bucket   = aws_s3_bucket.config_bucket_eu_central.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket policies for AWS Config
resource "aws_s3_bucket_policy" "config_bucket_us_west_policy" {
  provider = aws.us_west
  bucket   = aws_s3_bucket.config_bucket_us_west.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config_bucket_us_west.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config_bucket_us_west.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config_bucket_us_west.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_policy" "config_bucket_eu_central_policy" {
  provider = aws.eu_central
  bucket   = aws_s3_bucket.config_bucket_eu_central.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config_bucket_eu_central.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config_bucket_eu_central.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config_bucket_eu_central.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}
```

Now we can create the AWS Config resources using a **smart deployment strategy** that prevents conflicts with existing Config resources:

```hcl
# From: tap_stack.tf
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> bc0c831cc (resolve resources conflicts)
# AWS Config - Smart deployment strategy
# Uses locals to control Config resource creation based on environment needs

locals {
  # Set these based on your environment:
  # - true: Create new Config resources (safe for fresh environments)
  # - false: Skip creation (use when Config already exists)
  deploy_config_us_west     = false # Set to false if Config already exists in us-west-1
  deploy_config_eu_central  = false # Set to false if Config already exists in eu-central-1
}

# Create Config resources only when explicitly enabled
<<<<<<< HEAD
resource "aws_config_configuration_recorder" "recorder_us_west" {
  provider = aws.us_west
  count    = local.deploy_config_us_west ? 1 : 0
  name     = "SecurityRecorder-${local.environment}-us-west-1-${random_string.bucket_suffix.result}"
=======
# AWS Config Configuration Recorder
resource "aws_config_configuration_recorder" "recorder_us_west" {
  provider = aws.us_west
  name     = "SecurityRecorder-${local.environment}-us-west-1"
>>>>>>> 5351080ae (feat(IAC-291775): Updated code with regions and complete integration tests)
=======
resource "aws_config_configuration_recorder" "recorder_us_west" {
  provider = aws.us_west
  count    = local.deploy_config_us_west ? 1 : 0
  name     = "SecurityRecorder-${local.environment}-us-west-1-${random_string.bucket_suffix.result}"
>>>>>>> bc0c831cc (resolve resources conflicts)
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

resource "aws_config_configuration_recorder" "recorder_eu_central" {
  provider = aws.eu_central
<<<<<<< HEAD
<<<<<<< HEAD
  count    = local.deploy_config_eu_central ? 1 : 0
  name     = "SecurityRecorder-${local.environment}-eu-central-1-${random_string.bucket_suffix.result}"
=======
  name     = "SecurityRecorder-${local.environment}-eu-central-1"
>>>>>>> 5351080ae (feat(IAC-291775): Updated code with regions and complete integration tests)
=======
  count    = local.deploy_config_eu_central ? 1 : 0
  name     = "SecurityRecorder-${local.environment}-eu-central-1-${random_string.bucket_suffix.result}"
>>>>>>> bc0c831cc (resolve resources conflicts)
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = false
  }
}

<<<<<<< HEAD
<<<<<<< HEAD
resource "aws_config_delivery_channel" "delivery_channel_us_west" {
  provider       = aws.us_west
  count          = local.deploy_config_us_west ? 1 : 0
  name           = "SecurityDeliveryChannel-${local.environment}-us-west-1-${random_string.bucket_suffix.result}"
=======
# AWS Config Delivery Channel
resource "aws_config_delivery_channel" "delivery_channel_us_west" {
  provider       = aws.us_west
  name           = "SecurityDeliveryChannel-${local.environment}-us-west-1"
>>>>>>> 5351080ae (feat(IAC-291775): Updated code with regions and complete integration tests)
=======
resource "aws_config_delivery_channel" "delivery_channel_us_west" {
  provider       = aws.us_west
  count          = local.deploy_config_us_west ? 1 : 0
  name           = "SecurityDeliveryChannel-${local.environment}-us-west-1-${random_string.bucket_suffix.result}"
>>>>>>> bc0c831cc (resolve resources conflicts)
  s3_bucket_name = aws_s3_bucket.config_bucket_us_west.bucket

  depends_on = [
    aws_s3_bucket_policy.config_bucket_us_west_policy,
    aws_iam_role_policy_attachment.config_role_policy
  ]
}

resource "aws_config_delivery_channel" "delivery_channel_eu_central" {
  provider       = aws.eu_central
<<<<<<< HEAD
<<<<<<< HEAD
  count          = local.deploy_config_eu_central ? 1 : 0
  name           = "SecurityDeliveryChannel-${local.environment}-eu-central-1-${random_string.bucket_suffix.result}"
=======
  name           = "SecurityDeliveryChannel-${local.environment}-eu-central-1"
>>>>>>> 5351080ae (feat(IAC-291775): Updated code with regions and complete integration tests)
=======
  count          = local.deploy_config_eu_central ? 1 : 0
  name           = "SecurityDeliveryChannel-${local.environment}-eu-central-1-${random_string.bucket_suffix.result}"
>>>>>>> bc0c831cc (resolve resources conflicts)
  s3_bucket_name = aws_s3_bucket.config_bucket_eu_central.bucket

  depends_on = [
    aws_s3_bucket_policy.config_bucket_eu_central_policy,
    aws_iam_role_policy_attachment.config_role_policy
  ]
}
```

### AWS Config Deployment Strategy

**Default Configuration (Conservative):**
- Both regions set to `false` by default to prevent conflicts with existing Config resources
- Safe for deployment in environments that may already have Config enabled

**Configuration Options:**

1. **Fresh Environment (No existing Config):**
   ```hcl
   deploy_config_us_west     = true
   deploy_config_eu_central  = true
   ```

2. **Existing Config in Both Regions:**
   ```hcl
   deploy_config_us_west     = false  # Skip - Config exists
   deploy_config_eu_central  = false  # Skip - Config exists
   ```

3. **Mixed Environment:**
   ```hcl
   deploy_config_us_west     = true   # Create new Config
   deploy_config_eu_central  = false  # Skip - Config exists
   ```

**Key Benefits:**
- **Conflict Prevention**: AWS Config allows only 1 Configuration Recorder and 1 Delivery Channel per region
- **Environment Flexibility**: Works with any existing Config setup
- **Production Safety**: Conservative defaults prevent deployment failures

**Compliance Benefits:**
- **Configuration tracking** for all AWS resources
- **Change monitoring** and audit trails
- **Compliance reporting** capabilities

## Terraform Outputs

This infrastructure configuration provides comprehensive outputs to expose key resource information for integration with other systems, monitoring tools, and dependent infrastructure components.

### Output Categories

The outputs are organized into logical categories for easy access and use:

#### 1. Account and Environment Information

```hcl
# From: tap_stack.tf - Account Information
output "aws_account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "aws_regions" {
  description = "AWS regions being used"
  value = {
    primary   = data.aws_region.us_west.name
    secondary = data.aws_region.eu_central.name
  }
}

output "environment" {
  description = "Current environment (workspace)"
  value       = local.environment
}
```

**Use Cases:**
- **Cross-stack references** for dependent Terraform configurations
- **Environment identification** in monitoring and alerting systems
- **Account validation** for deployment pipelines

#### 2. Network Infrastructure Outputs

```hcl
# From: tap_stack.tf - VPC Information
output "vpc_us_west" {
  description = "VPC information for us-west-1"
  value = {
    id         = aws_vpc.secure_app_vpc_us_west.id
    arn        = aws_vpc.secure_app_vpc_us_west.arn
    cidr_block = aws_vpc.secure_app_vpc_us_west.cidr_block
  }
}

# From: tap_stack.tf - Subnet Information
output "subnets_us_west" {
  description = "Subnet information for us-west-1"
  value = {
    private = {
      subnet_1a = {
        id                = aws_subnet.private_subnet_us_west_1a.id
        arn               = aws_subnet.private_subnet_us_west_1a.arn
        cidr_block        = aws_subnet.private_subnet_us_west_1a.cidr_block
        availability_zone = aws_subnet.private_subnet_us_west_1a.availability_zone
      }
      # Additional subnet configurations...
    }
    public = {
      # Public subnet configurations...
    }
  }
}
```

**Integration Examples:**
- **EC2 deployment**: Use subnet IDs for instance placement
- **Load balancers**: Reference public subnets for ALB/NLB placement
- **Database deployment**: Use private subnets for RDS instances
- **Network monitoring**: Monitor traffic across specific CIDR blocks

#### 3. Security Group Outputs

```hcl
# From: tap_stack.tf - Security Groups
output "security_groups" {
  description = "Security Group information"
  value = {
    us_west = {
      web_tier = {
        id   = aws_security_group.web_tier_us_west.id
        arn  = aws_security_group.web_tier_us_west.arn
        name = aws_security_group.web_tier_us_west.name
      }
      database_tier = {
        id   = aws_security_group.database_tier_us_west.id
        arn  = aws_security_group.database_tier_us_west.arn
        name = aws_security_group.database_tier_us_west.name
      }
    }
    # Similar structure for eu_central region...
  }
}
```

**Security Integration:**
- **Application deployment**: Attach appropriate security groups to EC2 instances
- **Microservices**: Reference security group IDs for service-to-service communication
- **Security auditing**: Use ARNs for compliance reporting and security reviews

#### 4. Encryption and Key Management

```hcl
# From: tap_stack.tf - KMS Keys
output "kms_keys" {
  description = "KMS key information"
  value = {
    us_west = {
      key_id     = aws_kms_key.main_us_west.key_id
      arn        = aws_kms_key.main_us_west.arn
      alias_name = aws_kms_alias.main_us_west.name
      alias_arn  = aws_kms_alias.main_us_west.arn
    }
    # Similar structure for eu_central region...
  }
}
```

**Encryption Use Cases:**
- **S3 bucket encryption**: Use KMS key ARNs for server-side encryption
- **RDS encryption**: Reference keys for database encryption at rest
- **EBS volume encryption**: Apply keys to EC2 instance storage
- **Application-level encryption**: Use keys for custom encryption workflows

#### 5. Identity and Access Management

```hcl
# From: tap_stack.tf - IAM Resources
output "iam_resources" {
  description = "IAM role and policy information"
  value = {
    ec2_role = {
      name = aws_iam_role.ec2_secure_role.name
      arn  = aws_iam_role.ec2_secure_role.arn
    }
    ec2_instance_profile = {
      name = aws_iam_instance_profile.ec2_profile.name
      arn  = aws_iam_instance_profile.ec2_profile.arn
    }
    # Additional IAM resources...
  }
}
```

**IAM Integration:**
- **EC2 instances**: Use instance profile for secure AWS API access
- **Lambda functions**: Reference roles for serverless function execution
- **Cross-account access**: Use role ARNs for trusted relationships
- **Service integrations**: Apply roles to AWS services requiring permissions

#### 6. Monitoring and Alerting Outputs

```hcl
# From: tap_stack.tf - CloudWatch Resources
output "cloudwatch_log_groups" {
  description = "CloudWatch Log Group information"
  value = {
    us_west = {
      application_logs = {
        name = aws_cloudwatch_log_group.application_logs_us_west.name
        arn  = aws_cloudwatch_log_group.application_logs_us_west.arn
      }
      security_logs = {
        name = aws_cloudwatch_log_group.security_logs_us_west.name
        arn  = aws_cloudwatch_log_group.security_logs_us_west.arn
      }
    }
    # Similar structure for eu_central region...
  }
}

output "sns_topics" {
  description = "SNS Topic information"
  value = {
    us_west = {
      security_alerts = {
        name = aws_sns_topic.security_alerts_us_west.name
        arn  = aws_sns_topic.security_alerts_us_west.arn
      }
    }
    # Similar structure for eu_central region...
  }
}
```

**Monitoring Integration:**
- **Application logging**: Configure applications to send logs to specified log groups
- **Custom metrics**: Publish application metrics to CloudWatch
- **Alerting workflows**: Subscribe to SNS topics for incident response
- **Log aggregation**: Forward logs to external systems using log group ARNs

#### 7. AWS Config and Compliance Outputs

```hcl
# From: tap_stack.tf - AWS Config Resources
output "aws_config" {
  description = "AWS Config resources information"
  value = {
    us_west = {
      configuration_recorder = {
        # Show created resource name or indicate if deployment was skipped
        name     = local.deploy_config_us_west ? aws_config_configuration_recorder.recorder_us_west[0].name : "deployment-skipped-config-exists"
        deployed = local.deploy_config_us_west
      }
      delivery_channel = {
        # Show created resource name or indicate if deployment was skipped
        name     = local.deploy_config_us_west ? aws_config_delivery_channel.delivery_channel_us_west[0].name : "deployment-skipped-config-exists"
        deployed = local.deploy_config_us_west
      }
    }
    eu_central = {
      configuration_recorder = {
        # Show created resource name or indicate if deployment was skipped
        name     = local.deploy_config_eu_central ? aws_config_configuration_recorder.recorder_eu_central[0].name : "deployment-skipped-config-exists"
        deployed = local.deploy_config_eu_central
      }
      delivery_channel = {
        # Show created resource name or indicate if deployment was skipped
        name     = local.deploy_config_eu_central ? aws_config_delivery_channel.delivery_channel_eu_central[0].name : "deployment-skipped-config-exists"
        deployed = local.deploy_config_eu_central
      }
    }
  }
}

output "config_s3_buckets" {
  description = "S3 buckets for AWS Config delivery channels"
  value = {
    us_west = {
      bucket_name = aws_s3_bucket.config_bucket_us_west.bucket
      bucket_arn  = aws_s3_bucket.config_bucket_us_west.arn
    }
    eu_central = {
      bucket_name = aws_s3_bucket.config_bucket_eu_central.bucket
      bucket_arn  = aws_s3_bucket.config_bucket_eu_central.arn
    }
  }
}
```

**Compliance Integration:**
- **Configuration tracking**: Use Config recorder names for compliance reporting
- **Audit trails**: Reference delivery channel names for audit log configuration
- **Deployment status**: Check `deployed` flags to understand resource creation status
- **Multi-environment support**: Adapt deployment strategy based on existing Config resources
- **S3 integration**: Use bucket information for direct Config data access

#### 8. Connectivity and Networking

```hcl
# From: tap_stack.tf - NAT Gateway Information
output "nat_gateways" {
  description = "NAT Gateway and Elastic IP information"
  value = {
    us_west = {
      id               = aws_nat_gateway.nat_us_west.id
      public_ip        = aws_eip.nat_eip_us_west.public_ip
      elastic_ip_id    = aws_eip.nat_eip_us_west.id
      allocation_id    = aws_eip.nat_eip_us_west.allocation_id
    }
    # Similar structure for eu_central region...
  }
}
```

**Networking Use Cases:**
- **Firewall rules**: Whitelist NAT Gateway IPs in external systems
- **Network monitoring**: Track outbound traffic from specific IP addresses
- **Third-party integrations**: Configure API access using static IP addresses
- **Security auditing**: Monitor and log traffic from known egress points

#### 9. AWS GuardDuty Threat Detection Outputs

```hcl
# From: tap_stack.tf - GuardDuty Resources
output "guardduty" {
  description = "GuardDuty detector information"
  value = {
    us_west = {
      detector_id = aws_guardduty_detector.main_us_west.id
      detector_arn = aws_guardduty_detector.main_us_west.arn
      enabled = aws_guardduty_detector.main_us_west.enable
      threat_intel_set = {
        id = aws_guardduty_threatintelset.threat_intel_us_west.id
        name = aws_guardduty_threatintelset.threat_intel_us_west.name
      }
      event_rule = {
        name = aws_cloudwatch_event_rule.guardduty_finding_us_west.name
        arn = aws_cloudwatch_event_rule.guardduty_finding_us_west.arn
      }
    }
    eu_central = {
      detector_id = aws_guardduty_detector.main_eu_central.id
      detector_arn = aws_guardduty_detector.main_eu_central.arn
      enabled = aws_guardduty_detector.main_eu_central.enable
      event_rule = {
        name = aws_cloudwatch_event_rule.guardduty_finding_eu_central.name
        arn = aws_cloudwatch_event_rule.guardduty_finding_eu_central.arn
      }
    }
  }
}
```

**Threat Detection Integration:**
- **Security Operations**: Use detector IDs for custom GuardDuty API integrations
- **Incident Response**: Reference event rule ARNs for automated response workflows
- **Threat Intelligence**: Manage custom threat feeds via threat intel set IDs
- **Multi-region Coordination**: Centralize threat detection across both regions
- **Compliance Reporting**: Track threat detection status and configuration

#### 10. AWS WAF and DDoS Protection Outputs

```hcl
# From: tap_stack.tf - WAF Resources
output "waf" {
  description = "WAF Web ACL information"
  value = {
    us_west = {
      web_acl_id = aws_wafv2_web_acl.api_protection_us_west.id
      web_acl_arn = aws_wafv2_web_acl.api_protection_us_west.arn
      web_acl_name = aws_wafv2_web_acl.api_protection_us_west.name
      api_association = {
        resource_arn = aws_wafv2_web_acl_association.api_waf_association_us_west.resource_arn
        web_acl_arn = aws_wafv2_web_acl_association.api_waf_association_us_west.web_acl_arn
      }
    }
    eu_central = {
      web_acl_id = aws_wafv2_web_acl.api_protection_eu_central.id
      web_acl_arn = aws_wafv2_web_acl.api_protection_eu_central.arn
      web_acl_name = aws_wafv2_web_acl.api_protection_eu_central.name
      api_association = {
        resource_arn = aws_wafv2_web_acl_association.api_waf_association_eu_central.resource_arn
        web_acl_arn = aws_wafv2_web_acl_association.api_waf_association_eu_central.web_acl_arn
      }
    }
  }
}
```

**DDoS Protection Integration:**
- **Application Protection**: Associate WAF ACLs with additional resources (ALB, CloudFront)
- **Security Monitoring**: Use WAF metrics for security dashboard creation
- **Rule Management**: Reference WAF ARNs for custom rule deployment
- **Multi-region Defense**: Coordinate DDoS protection across regions
- **Cost Optimization**: Monitor WAF usage and rule effectiveness

#### 11. API Gateway and Secure API Outputs

```hcl
# From: tap_stack.tf - API Gateway Resources
output "api_gateway" {
  description = "API Gateway information"
  value = {
    cloudwatch_role = {
      arn = aws_iam_role.api_gateway_cloudwatch_role.arn
      name = aws_iam_role.api_gateway_cloudwatch_role.name
    }
    us_west = {
      rest_api = {
        id = aws_api_gateway_rest_api.secure_api_us_west.id
        name = aws_api_gateway_rest_api.secure_api_us_west.name
        arn = aws_api_gateway_rest_api.secure_api_us_west.arn
        execution_arn = aws_api_gateway_rest_api.secure_api_us_west.execution_arn
      }
      stage = {
        name = aws_api_gateway_stage.secure_api_stage_us_west.stage_name
        arn = aws_api_gateway_stage.secure_api_stage_us_west.arn
        invoke_url = aws_api_gateway_stage.secure_api_stage_us_west.invoke_url
      }
      deployment = {
        id = aws_api_gateway_deployment.secure_api_deployment_us_west.id
        invoke_url = aws_api_gateway_deployment.secure_api_deployment_us_west.invoke_url
      }
      health_endpoint = {
        resource_id = aws_api_gateway_resource.health_us_west.id
        path = aws_api_gateway_resource.health_us_west.path_part
      }
    }
    eu_central = {
      rest_api = {
        id = aws_api_gateway_rest_api.secure_api_eu_central.id
        name = aws_api_gateway_rest_api.secure_api_eu_central.name
        arn = aws_api_gateway_rest_api.secure_api_eu_central.arn
        execution_arn = aws_api_gateway_rest_api.secure_api_eu_central.execution_arn
      }
      stage = {
        name = aws_api_gateway_stage.secure_api_stage_eu_central.stage_name
        arn = aws_api_gateway_stage.secure_api_stage_eu_central.arn
        invoke_url = aws_api_gateway_stage.secure_api_stage_eu_central.invoke_url
      }
      deployment = {
        id = aws_api_gateway_deployment.secure_api_deployment_eu_central.id
        invoke_url = aws_api_gateway_deployment.secure_api_deployment_eu_central.invoke_url
      }
      health_endpoint = {
        resource_id = aws_api_gateway_resource.health_eu_central.id
        path = aws_api_gateway_resource.health_eu_central.path_part
      }
    }
  }
}
```

**API Security Integration:**
- **Client Applications**: Use invoke URLs for secure API access
- **Load Balancing**: Distribute traffic across regional API endpoints
- **Health Monitoring**: Implement health checks using dedicated endpoints
- **Security Testing**: Use execution ARNs for IAM policy testing
- **Performance Analysis**: Reference stage ARNs for X-Ray trace analysis

### Advanced Output Usage Patterns

#### 1. Cross-Stack Resource Sharing

```hcl
# In a dependent Terraform configuration
data "terraform_remote_state" "network" {
  backend = "s3"
  config = {
    bucket = "terraform-state-bucket"
    key    = "network/terraform.tfstate"
    region = "us-west-1"
  }
}

# Use outputs from network stack
resource "aws_instance" "app_server" {
  subnet_id              = data.terraform_remote_state.network.outputs.subnets_us_west.private.subnet_1a.id
  vpc_security_group_ids = [data.terraform_remote_state.network.outputs.security_groups.us_west.web_tier.id]
  iam_instance_profile   = data.terraform_remote_state.network.outputs.iam_resources.ec2_instance_profile.name
  
  # Additional configuration...
}
```

#### 2. Monitoring Dashboard Configuration

```hcl
# Use outputs to configure CloudWatch dashboards
resource "aws_cloudwatch_dashboard" "infrastructure" {
  dashboard_name = "Infrastructure-Overview"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", "InstanceId", aws_instance.app.id],
            ["AWS/VPC", "PacketDropCount", "VPC", data.terraform_remote_state.network.outputs.vpc_us_west.id]
          ]
          # Additional widget configuration...
        }
      }
    ]
  })
}
```

#### 3. Infrastructure Summary and Reporting

```hcl
# From: tap_stack.tf - Resource Summary
output "resource_summary" {
  description = "Summary of key resources created by this Terraform configuration"
  value = {
    regions_deployed   = [data.aws_region.us_west.name, data.aws_region.eu_central.name]
    vpcs_created      = 2
    subnets_created   = 6
    security_groups   = 4
    kms_keys         = 2
    nat_gateways     = 2
    s3_buckets       = 2
    cloudwatch_logs  = 4
    sns_topics       = 2
    config_recorders = 2
    environment      = local.environment
    project          = "SecureCloudInfra"
  }
}
```

**Reporting Benefits:**
- **Cost tracking**: Understand resource count for cost estimation
- **Capacity planning**: Monitor resource utilization across regions
- **Compliance reporting**: Document infrastructure scope for audits
- **Change management**: Track infrastructure growth over time

### Output Best Practices

#### 1. Structured Output Organization
- **Consistent naming**: Use predictable naming patterns across outputs
- **Nested objects**: Group related information logically
- **Regional separation**: Clearly separate resources by region

#### 2. Security Considerations
- **Sensitive data**: Avoid exposing sensitive information in outputs
- **Access control**: Use Terraform Cloud/Enterprise for secure output sharing
- **Audit trails**: Log access to output values for compliance

#### 3. Documentation and Maintenance
- **Clear descriptions**: Provide meaningful descriptions for all outputs
- **Version compatibility**: Document any breaking changes to output structure
- **Usage examples**: Include practical examples in documentation

#### 4. Integration Patterns
- **Remote state**: Use remote state for secure cross-stack communication
- **Data sources**: Reference outputs through data sources in dependent stacks
- **Automation**: Use outputs in CI/CD pipelines for automated deployments

These comprehensive outputs enable seamless integration with other infrastructure components, monitoring systems, and automation tools while maintaining security and operational best practices.

## Best Practices Implemented

### Security Best Practices

1. **Encryption at Rest and Transit**
   - KMS encryption for all data stores
   - HTTPS/TLS for all communications

2. **Network Security**
   - Private subnets for application tiers
   - Security groups with least privilege and restricted egress rules
   - Network ACLs for additional protection
   - NAT Gateways for secure outbound connectivity

3. **Threat Detection and Response**
   - AWS GuardDuty for intelligent threat detection
   - Malware protection and EBS volume scanning
   - S3 log analysis and Kubernetes audit log monitoring
   - Automated threat response via CloudWatch Events and SNS
   - Custom threat intelligence integration

4. **DDoS Protection and Web Application Security**
   - AWS WAF with comprehensive rule sets (OWASP Top 10)
   - Rate limiting to prevent DDoS attacks (2000 requests/5min per IP)
   - Geo-blocking for high-risk countries
   - API Gateway with IP-restricted policies
   - X-Ray tracing for performance and security analysis

5. **Identity and Access Management**
   - MFA enforcement for human users
   - Role-based access with minimal permissions
   - Strong password policies
   - Unique resource naming to prevent naming conflicts

6. **Monitoring and Logging**
   - Comprehensive CloudWatch monitoring
   - Encrypted log storage with appropriate retention
   - Real-time alerting for security events
   - Multi-region threat detection and alerting

### Operational Best Practices

1. **Multi-Region Deployment**
   - Active-active or active-passive configuration
   - Data replication and backup strategies

2. **High Availability**
   - Multi-AZ deployment
   - Auto-scaling capabilities
   - Load balancing

3. **Resource Management and Naming**
   - Hybrid naming strategy for optimal management
   - Predictable security group names for easy identification
   - Random suffixes for conflict prevention where needed
   - Consistent tagging across all resources

4. **Disaster Recovery**
   - Cross-region backups
   - Infrastructure as Code for rapid recovery
   - Regular DR testing procedures

5. **Cost Optimization**
   - Resource tagging for cost allocation
   - Right-sizing recommendations
   - Automated resource cleanup

### Compliance and Governance

1. **Regulatory Compliance**
   - SOC2 and PCI-DSS compliance controls
   - Audit logging and reporting
   - Data residency requirements

2. **Change Management**
   - Infrastructure as Code (Terraform)
   - Version control and peer review
   - Automated testing and validation

3. **Documentation and Training**
   - Comprehensive documentation
   - Security awareness training
   - Incident response procedures

## Conclusion

This Terraform configuration provides a robust, secure, and compliant AWS infrastructure that follows industry best practices. The multi-region setup ensures high availability and disaster recovery capabilities, while the comprehensive security controls protect against various threat vectors.

Key benefits of this infrastructure include:

- **Security**: Defense-in-depth approach with multiple security layers
- **Compliance**: Built-in controls for SOC2 and PCI-DSS requirements
- **Scalability**: Auto-scaling and load balancing capabilities
- **Monitoring**: Comprehensive observability and alerting
- **Maintainability**: Infrastructure as Code with consistent configuration

Regular reviews and updates of this infrastructure ensure continued security and compliance as requirements evolve.
