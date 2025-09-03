# Comprehensive Enterprise Security Framework with Terraform

This is an excellent and comprehensive security initiative! I'll help you build a robust, enterprise-grade security framework that addresses all the requirements you've outlined. Let me break this down into a well-structured Terraform solution.

## Architecture Overview

Before diving into the code, let's establish the security architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS Organizations                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Security      │  │   Production    │  │   Development│ │
│  │   Account       │  │   Account       │  │   Account    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   Security Hub    │
                    │   GuardDuty       │
                    │   Config          │
                    │   CloudTrail      │
                    └───────────────────┘
```

## Project Structure

```
terraform-security-framework/
├── main.tf
├── variables.tf
├── outputs.tf
├── terraform.tfvars.example
├── modules/
│   ├── iam/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── network-security/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── monitoring/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── data-protection/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── compliance/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
├── scripts/
│   ├── auto-remediation.py
│   └── compliance-check.sh
└── docs/
    ├── security-architecture.md
    └── operational-procedures.md
```

## Core Infrastructure Files

### 1. Main Configuration (`main.tf`)

```hcl
# main.tf - Enterprise Security Framework
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    # Configure your backend here
    bucket         = "your-terraform-state-bucket"
    key            = "security-framework/terraform.tfstate"
    region         = "us-west-2"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "Enterprise Security Framework"
      Environment = var.environment
      Owner       = var.owner
      Compliance  = "SOC2,ISO27001,PCI-DSS"
      ManagedBy   = "Terraform"
    }
  }
}

# Data sources for current AWS account and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# KMS Key for encryption across all services
resource "aws_kms_key" "security_master_key" {
  description             = "Master KMS key for security framework encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail to encrypt logs"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
  
  tags = {
    Name = "SecurityFrameworkMasterKey"
  }
}

resource "aws_kms_alias" "security_master_key" {
  name          = "alias/security-framework-master"
  target_key_id = aws_kms_key.security_master_key.key_id
}

# IAM Module - Identity and Access Management
module "iam" {
  source = "./modules/iam"
  
  organization_name = var.organization_name
  environment      = var.environment
  kms_key_arn      = aws_kms_key.security_master_key.arn
  
  # Security policies configuration
  enforce_mfa                    = var.enforce_mfa
  password_policy_requirements   = var.password_policy_requirements
  session_duration_hours        = var.session_duration_hours
}

# Network Security Module
module "network_security" {
  source = "./modules/network-security"
  
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  environment         = var.environment
  kms_key_arn         = aws_kms_key.security_master_key.arn
  
  # WAF Configuration
  enable_waf                = var.enable_waf
  waf_rate_limit           = var.waf_rate_limit
  allowed_countries        = var.allowed_countries
  blocked_ips              = var.blocked_ips
}

# Data Protection Module
module "data_protection" {
  source = "./modules/data-protection"
  
  environment     = var.environment
  kms_key_arn     = aws_kms_key.security_master_key.arn
  
  # S3 Configuration
  audit_bucket_name           = var.audit_bucket_name
  backup_retention_days       = var.backup_retention_days
  enable_cross_region_backup  = var.enable_cross_region_backup
  
  # Database encryption settings
  rds_encryption_enabled      = var.rds_encryption_enabled
  backup_window              = var.backup_window
  maintenance_window         = var.maintenance_window
}

# Monitoring and Threat Detection Module
module "monitoring" {
  source = "./modules/monitoring"
  
  environment     = var.environment
  kms_key_arn     = aws_kms_key.security_master_key.arn
  vpc_id          = module.network_security.vpc_id
  
  # GuardDuty Configuration
  enable_guardduty           = var.enable_guardduty
  guardduty_finding_format   = var.guardduty_finding_format
  
  # CloudTrail Configuration
  cloudtrail_bucket_name     = var.cloudtrail_bucket_name
  log_retention_days         = var.log_retention_days
  
  # Alerting
  security_notification_email = var.security_notification_email
  critical_alert_webhook      = var.critical_alert_webhook
}

# Compliance and Config Module
module "compliance" {
  source = "./modules/compliance"
  
  environment     = var.environment
  kms_key_arn     = aws_kms_key.security_master_key.arn
  
  # Config settings
  config_bucket_name          = var.config_bucket_name
  compliance_frameworks       = var.compliance_frameworks
  auto_remediation_enabled    = var.auto_remediation_enabled
  
  # Systems Manager
  patch_baseline_approval_delay = var.patch_baseline_approval_delay
  maintenance_window_schedule   = var.maintenance_window_schedule
}

# Security Hub - Central security dashboard
resource "aws_securityhub_account" "main" {
  enable_default_standards = true
}

# Enable Security Hub standards
resource "aws_securityhub_standards_subscription" "aws_foundational" {
  standards_arn = "arn:aws:securityhub:::ruleset/finding-format/aws-foundational-security-standard/v/1.0.0"
  depends_on    = [aws_securityhub_account.main]
}

resource "aws_securityhub_standards_subscription" "cis" {
  standards_arn = "arn:aws:securityhub:::ruleset/finding-format/cis-aws-foundations-benchmark/v/1.2.0"
  depends_on    = [aws_securityhub_account.main]
}

resource "aws_securityhub_standards_subscription" "pci_dss" {
  standards_arn = "arn:aws:securityhub:::ruleset/finding-format/pci-dss/v/3.2.1"
  depends_on    = [aws_securityhub_account.main]
}
```

### 2. Variables Configuration (`variables.tf`)

```hcl
# variables.tf - Security Framework Variables

# General Configuration
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (prod, staging, dev)"
  type        = string
  validation {
    condition     = contains(["prod", "staging", "dev"], var.environment)
    error_message = "Environment must be prod, staging, or dev."
  }
}

variable "organization_name" {
  description = "Organization name for resource naming"
  type        = string
}

variable "owner" {
  description = "Owner of the infrastructure"
  type        = string
}

# Network Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

# IAM Configuration
variable "enforce_mfa" {
  description = "Enforce MFA for all users"
  type        = bool
  default     = true
}

variable "password_policy_requirements" {
  description = "Password policy requirements"
  type = object({
    minimum_password_length        = number
    require_lowercase_characters   = bool
    require_uppercase_characters   = bool
    require_numbers               = bool
    require_symbols               = bool
    allow_users_to_change_password = bool
    max_password_age              = number
    password_reuse_prevention     = number
  })
  default = {
    minimum_password_length        = 14
    require_lowercase_characters   = true
    require_uppercase_characters   = true
    require_numbers               = true
    require_symbols               = true
    allow_users_to_change_password = true
    max_password_age              = 90
    password_reuse_prevention     = 12
  }
}

variable "session_duration_hours" {
  description = "Maximum session duration in hours"
  type        = number
  default     = 8
  validation {
    condition     = var.session_duration_hours >= 1 && var.session_duration_hours <= 12
    error_message = "Session duration must be between 1 and 12 hours."
  }
}

# WAF Configuration
variable "enable_waf" {
  description = "Enable WAF protection"
  type        = bool
  default     = true
}

variable "waf_rate_limit" {
  description = "WAF rate limit per 5 minutes"
  type        = number
  default     = 2000
}

variable "allowed_countries" {
  description = "List of allowed country codes for WAF geo-blocking"
  type        = list(string)
  default     = ["US", "CA", "GB", "DE", "FR", "JP", "AU"]
}

variable "blocked_ips" {
  description = "List of IP addresses to block"
  type        = list(string)
  default     = []
}

# Data Protection
variable "audit_bucket_name" {
  description = "Name for the audit logs S3 bucket"
  type        = string
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 90
}

variable "enable_cross_region_backup" {
  description = "Enable cross-region backup replication"
  type        = bool
  default     = true
}

variable "rds_encryption_enabled" {
  description = "Enable RDS encryption"
  type        = bool
  default     = true
}

variable "backup_window" {
  description = "RDS backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "maintenance_window" {
  description = "RDS maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

# Monitoring Configuration
variable "enable_guardduty" {
  description = "Enable GuardDuty threat detection"
  type        = bool
  default     = true
}

variable "guardduty_finding_format" {
  description = "GuardDuty finding publishing format"
  type        = string
  default     = "JSON"
}

variable "cloudtrail_bucket_name" {
  description = "S3 bucket name for CloudTrail logs"
  type        = string
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 90
}

variable "security_notification_email" {
  description = "Email for security notifications"
  type        = string
}

variable "critical_alert_webhook" {
  description = "Webhook URL for critical alerts"
  type        = string
  default     = ""
}

# Compliance Configuration
variable "config_bucket_name" {
  description = "S3 bucket name for AWS Config"
  type        = string
}

variable "compliance_frameworks" {
  description = "List of compliance frameworks to monitor"
  type        = list(string)
  default     = ["SOC2", "ISO27001", "PCI-DSS", "CIS"]
}

variable "auto_remediation_enabled" {
  description = "Enable automatic remediation of compliance issues"
  type        = bool
  default     = true
}

variable "patch_baseline_approval_delay" {
  description = "Days to wait before auto-approving patches"
  type        = number
  default     = 7
}

variable "maintenance_window_schedule" {
  description = "Cron expression for maintenance window"
  type        = string
  default     = "cron(0 2 ? * SUN *)"  # 2 AM every Sunday
}
```

### 3. IAM Module (`modules/iam/main.tf`)

```hcl
# modules/iam/main.tf - Identity and Access Management

# Password Policy
resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = var.password_policy_requirements.minimum_password_length
  require_lowercase_characters   = var.password_policy_requirements.require_lowercase_characters
  require_uppercase_characters   = var.password_policy_requirements.require_uppercase_characters
  require_numbers               = var.password_policy_requirements.require_numbers
  require_symbols               = var.password_policy_requirements.require_symbols
  allow_users_to_change_password = var.password_policy_requirements.allow_users_to_change_password
  max_password_age              = var.password_policy_requirements.max_password_age
  password_reuse_prevention     = var.password_policy_requirements.password_reuse_prevention
}

# Security Admin Role
resource "aws_iam_role" "security_admin" {
  name = "${var.organization_name}-security-admin-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = var.enforce_mfa ? "true" : "false"
          }
          NumericLessThan = {
            "aws:MultiFactorAuthAge" = "3600"  # 1 hour
          }
        }
      }
    ]
  })
  
  max_session_duration = var.session_duration_hours * 3600
  
  tags = {
    Name = "SecurityAdminRole"
    Purpose = "Security administration with MFA enforcement"
  }
}

# Security Admin Policy
resource "aws_iam_policy" "security_admin" {
  name        = "${var.organization_name}-security-admin-policy-${var.environment}"
  description = "Comprehensive security administration policy"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          # Security services
          "guardduty:*",
          "securityhub:*",
          "config:*",
          "cloudtrail:*",
          "inspector:*",
          "macie2:*",
          
          # IAM (with restrictions)
          "iam:Get*",
          "iam:List*",
          "iam:CreateRole",
          "iam:CreatePolicy",
          "iam:AttachRolePolicy",
          "iam:DetachRolePolicy",
          "iam:PutRolePolicy",
          "iam:DeleteRolePolicy",
          
          # KMS
          "kms:*",
          
          # CloudWatch and logging
          "logs:*",
          "cloudwatch:*",
          "events:*",
          
          # Systems Manager
          "ssm:*",
          
          # WAF
          "wafv2:*",
          "waf:*",
          
          # VPC Security
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:AuthorizeSecurityGroupEgress",
          "ec2:RevokeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupEgress",
          "ec2:CreateSecurityGroup",
          "ec2:DeleteSecurityGroup",
          "ec2:DescribeSecurityGroups",
          "ec2:CreateNetworkAcl*",
          "ec2:DeleteNetworkAcl*",
          "ec2:ReplaceNetworkAcl*",
          "ec2:DescribeNetworkAcls",
          
          # S3 Security
          "s3:GetBucketPolicy",
          "s3:PutBucketPolicy",
          "s3:GetBucketAcl",
          "s3:PutBucketAcl",
          "s3:GetBucketEncryption",
          "s3:PutBucketEncryption",
          "s3:GetBucketVersioning",
          "s3:PutBucketVersioning"
        ]
        Resource = "*"
      },
      {
        Effect = "Deny"
        Action = [
          # Prevent privilege escalation
          "iam:CreateUser",
          "iam:DeleteUser",
          "iam:CreateAccessKey",
          "iam:DeleteAccessKey",
          "iam:AttachUserPolicy",
          "iam:DetachUserPolicy",
          "iam:PutUserPolicy",
          "iam:DeleteUserPolicy",
          
          # Prevent disabling security services
          "guardduty:DeleteDetector",
          "securityhub:DisableSecurityHub",
          "config:DeleteConfigurationRecorder",
          "config:DeleteDeliveryChannel",
          "cloudtrail:StopLogging",
          "cloudtrail:DeleteTrail"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "security_admin" {
  role       = aws_iam_role.security_admin.name
  policy_arn = aws_iam_policy.security_admin.arn
}

# Developer Role with restricted permissions
resource "aws_iam_role" "developer" {
  name = "${var.organization_name}-developer-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Condition = var.enforce_mfa ? {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
        } : {}
      }
    ]
  })
  
  max_session_duration = var.session_duration_hours * 3600
}

# Developer Policy - Least privilege
resource "aws_iam_policy" "developer" {
  name        = "${var.organization_name}-developer-policy-${var.environment}"
  description = "Developer policy with security restrictions"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          # EC2 (limited)
          "ec2:Describe*",
          "ec2:RunInstances",
          "ec2:TerminateInstances",
          "ec2:StartInstances",
          "ec2:StopInstances",
          "ec2:RebootInstances",
          
          # S3 (application buckets only)
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
          
          # Lambda
          "lambda:*",
          
          # API Gateway
          "apigateway:*",
          
          # CloudWatch (read-only)
          "cloudwatch:Describe*",
          "cloudwatch:Get*",
          "cloudwatch:List*",
          "logs:Describe*",
          "logs:Get*",
          "logs:FilterLogEvents",
          
          # Systems Manager (read-only)
          "ssm:DescribeParameters",
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "*"
      },
      {
        Effect = "Deny"
        Action = [
          # Security services
          "guardduty:*",
          "securityhub:*",
          "config:*",
          "cloudtrail:*",
          
          # IAM
          "iam:*",
          
          # KMS admin actions
          "kms:CreateKey",
          "kms:DeleteKey",
          "kms:ScheduleKeyDeletion",
          "kms:CancelKeyDeletion",
          
          # VPC modifications
          "ec2:CreateVpc",
          "ec2:DeleteVpc",
          "ec2:ModifyVpc*",
          "ec2:CreateSubnet",
          "ec2:DeleteSubnet",
          "ec2:ModifySubnet*",
          "ec2:CreateSecurityGroup",
          "ec2:DeleteSecurityGroup",
          "ec2:AuthorizeSecurityGroup*",
          "ec2:RevokeSecurityGroup*",
          
          # Production resource modifications
          "rds:Delete*",
          "rds:Modify*"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "developer" {
  role       = aws_iam_role.developer.name
  policy_arn = aws_iam_policy.developer.arn
}

# ReadOnly Auditor Role
resource "aws_iam_role" "auditor" {
  name = "${var.organization_name}-auditor-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "auditor_readonly" {
  role       = aws_iam_role.auditor.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

resource "aws_iam_role_policy_attachment" "auditor_security_audit" {
  role       = aws_iam_role.auditor.name
  policy_arn = "arn:aws:iam::aws:policy/SecurityAudit"
}

# Service Role for Lambda Functions
resource "aws_iam_role" "lambda_security_role" {
  name = "${var.organization_name}-lambda-security-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_security_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda policy for security automation
resource "aws_iam_policy" "lambda_security_automation" {
  name        = "${var.organization_name}-lambda-security-automation-${var.environment}"
  description = "Policy for security automation Lambda functions"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          # Config remediation
          "config:PutRemediationConfiguration",
          "config:DeleteRemediationConfiguration",
          
          # Security Group remediation
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupIngress",
          "ec2:AuthorizeSecurityGroupEgress",
          "ec2:RevokeSecurityGroupEgress",
          
          # S3 remediation
          "s3:PutBucketPolicy",
          "s3:PutBucketEncryption",
          "s3:PutBucketVersioning",
          "s3:PutBucketPublicAccessBlock",
          
          # SNS for notifications
          "sns:Publish",
          
          # CloudWatch metrics
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_security_automation" {
  role       = aws_iam_role.lambda_security_role.name
  policy_arn = aws_iam_policy.lambda_security_automation.arn
}

data "aws_caller_identity" "current" {}
```

### 4. Network Security Module (`modules/network-security/main.tf`)

```hcl
# modules/network-security/main.tf - Network Security Configuration

# VPC with DNS support
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "${var.environment}-security-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = {
    Name = "${var.environment}-security-igw"
  }
}

# Public Subnets for Load Balancers
resource "aws_subnet" "public" {
  count = length(var.availability_zones)
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = false  # Security best practice
  
  tags = {
    Name = "${var.environment}-public-subnet-${count.index + 1}"
    Type = "Public"
  }
}

# Private Subnets for Application Servers
resource "aws_subnet" "private" {
  count = length(var.availability_zones)
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]
  
  tags = {
    Name = "${var.environment}-private-subnet-${count.index + 1}"
    Type = "Private"
  }
}

# Database Subnets (isolated)
resource "aws_subnet" "database" {
  count = length(var.availability_zones)
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 20)
  availability_zone = var.availability_zones[count.index]
  
  tags = {
    Name = "${var.environment}-database-subnet-${count.index + 1}"
    Type = "Database"
  }
}

# NAT Gateways for private subnet internet access
resource "aws_eip" "nat" {
  count = length(var.availability_zones)
  
  domain = "vpc"
  depends_on = [aws_internet_gateway.main]
  
  tags = {
    Name = "${var.environment}-nat-eip-${count.index + 1}"
  }
}

resource "aws_nat_gateway" "main" {
  count = length(var.availability_zones)
  
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = {
    Name = "${var.environment}-nat-gateway-${count.index + 1}"
  }
  
  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = {
    Name = "${var.environment}-public-rt"
  }
}

resource "aws_route_table" "private" {
  count = length(var.availability_zones)
  
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = {
    Name = "${var.environment}-private-rt-${count.index + 1}"
  }
}

resource "aws_route_table" "database"