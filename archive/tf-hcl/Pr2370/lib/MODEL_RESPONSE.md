I'll create a comprehensive Terraform configuration that meets all your security requirements. This will be modularized for reusability and scalability.

## Project Structure

```
terraform-secure-infrastructure/
├── main.tf
├── variables.tf
├── outputs.tf
├── terraform.tfvars.example
└── modules/
    ├── vpc/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── iam/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── security/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── monitoring/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    └── storage/
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

## Root Configuration Files

### main.tf
```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "SecurityConfiguration"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Get current AWS account ID and caller identity
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# VPC Module
module "vpc" {
  source = "./modules/vpc"
  
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  environment          = var.environment
}

# IAM Module
module "iam" {
  source = "./modules/iam"
  
  environment = var.environment
}

# Security Module
module "security" {
  source = "./modules/security"
  
  vpc_id            = module.vpc.vpc_id
  allowed_ssh_cidr  = var.allowed_ssh_cidr
  environment       = var.environment
}

# Storage Module
module "storage" {
  source = "./modules/storage"
  
  environment = var.environment
}

# Monitoring Module
module "monitoring" {
  source = "./modules/monitoring"
  
  environment = var.environment
}
```

### variables.tf
```hcl
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
  default     = "203.0.113.0/32"  # Replace with your IP
}
```

### outputs.tf
```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.vpc.private_subnet_ids
}

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = module.storage.kms_key_id
}

output "s3_bucket_name" {
  description = "Name of the encrypted S3 bucket"
  value       = module.storage.s3_bucket_name
}

output "terraform_user_arn" {
  description = "ARN of the Terraform user"
  value       = module.iam.terraform_user_arn
}
```

## Module Configurations

### modules/vpc/main.tf
```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "SecConfig-VPC-${var.environment}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "SecConfig-IGW-${var.environment}"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "SecConfig-Public-Subnet-${count.index + 1}-${var.environment}"
    Type = "Public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "SecConfig-Private-Subnet-${count.index + 1}-${var.environment}"
    Type = "Private"
  }
}

# NAT Gateways
resource "aws_eip" "nat" {
  count = length(var.public_subnet_cidrs)

  domain = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = {
    Name = "SecConfig-NAT-EIP-${count.index + 1}-${var.environment}"
  }
}

resource "aws_nat_gateway" "main" {
  count = length(var.public_subnet_cidrs)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "SecConfig-NAT-Gateway-${count.index + 1}-${var.environment}"
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
    Name = "SecConfig-Public-RT-${var.environment}"
  }
}

resource "aws_route_table" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "SecConfig-Private-RT-${count.index + 1}-${var.environment}"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(var.public_subnet_cidrs)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(var.private_subnet_cidrs)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

### modules/vpc/variables.tf
```hcl
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
}

variable "environment" {
  description = "Environment name"
  type        = string
}
```

### modules/vpc/outputs.tf
```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}
```

### modules/iam/main.tf
```hcl
# Data source for current AWS account
data "aws_caller_identity" "current" {}

# IAM Policy for S3 Read-Only Access
resource "aws_iam_policy" "s3_read_only" {
  name        = "SecConfig-S3ReadOnly-${var.environment}"
  description = "Read-only access to specific S3 services"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [
          "arn:aws:s3:::secconfig-*",
          "arn:aws:s3:::secconfig-*/*"
        ]
      }
    ]
  })
}

# IAM Role for EC2 with S3 Read-Only Access
resource "aws_iam_role" "ec2_s3_readonly" {
  name = "SecConfig-EC2-S3ReadOnly-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
        }
      }
    ]
  })
}

# Attach S3 Read-Only Policy to Role
resource "aws_iam_role_policy_attachment" "ec2_s3_readonly" {
  role       = aws_iam_role.ec2_s3_readonly.name
  policy_arn = aws_iam_policy.s3_read_only.arn
}

# Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2_s3_readonly" {
  name = "SecConfig-EC2-S3ReadOnly-${var.environment}"
  role = aws_iam_role.ec2_s3_readonly.name
}

# IAM Policy for Terraform Operations
resource "aws_iam_policy" "terraform_policy" {
  name        = "SecConfig-TerraformPolicy-${var.environment}"
  description = "Policy for Terraform stack creation and management"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:*",
          "vpc:*",
          "iam:*",
          "s3:*",
          "kms:*",
          "cloudtrail:*",
          "cloudwatch:*",
          "logs:*",
          "guardduty:*",
          "config:*",
          "sts:GetCallerIdentity"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM User for Terraform
resource "aws_iam_user" "terraform_user" {
  name = "SecConfig-TerraformUser-${var.environment}"
  path = "/"

  tags = {
    Name        = "SecConfig-TerraformUser-${var.environment}"
    Description = "User for Terraform stack creation"
  }
}

# Attach Terraform Policy to User
resource "aws_iam_user_policy_attachment" "terraform_user_policy" {
  user       = aws_iam_user.terraform_user.name
  policy_arn = aws_iam_policy.terraform_policy.arn
}

# MFA Policy for Console Access
resource "aws_iam_policy" "mfa_policy" {
  name        = "SecConfig-MFAPolicy-${var.environment}"
  description = "Enforce MFA for console access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowViewAccountInfo"
        Effect = "Allow"
        Action = [
          "iam:GetAccountPasswordPolicy",
          "iam:ListVirtualMFADevices"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowManageOwnPasswords"
        Effect = "Allow"
        Action = [
          "iam:ChangePassword",
          "iam:GetUser"
        ]
        Resource = "arn:aws:iam::*:user/$${aws:username}"
      },
      {
        Sid    = "AllowManageOwnMFA"
        Effect = "Allow"
        Action = [
          "iam:CreateVirtualMFADevice",
          "iam:DeleteVirtualMFADevice",
          "iam:ListMFADevices",
          "iam:EnableMFADevice",
          "iam:ResyncMFADevice"
        ]
        Resource = [
          "arn:aws:iam::*:mfa/$${aws:username}",
          "arn:aws:iam::*:user/$${aws:username}"
        ]
      },
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
}

# Attach MFA Policy to all roles that need console access
resource "aws_iam_role_policy_attachment" "ec2_mfa_policy" {
  role       = aws_iam_role.ec2_s3_readonly.name
  policy_arn = aws_iam_policy.mfa_policy.arn
}
```

### modules/iam/variables.tf
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}
```

### modules/iam/outputs.tf
```hcl
output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_s3_readonly.name
}

output "terraform_user_arn" {
  description = "ARN of the Terraform user"
  value       = aws_iam_user.terraform_user.arn
}

output "terraform_user_name" {
  description = "Name of the Terraform user"
  value       = aws_iam_user.terraform_user.name
}
```

### modules/security/main.tf
```hcl
# Security Group for SSH Access
resource "aws_security_group" "ssh_access" {
  name        = "SecConfig-SSH-Access-${var.environment}"
  description = "Security group for SSH access from specific IP"
  vpc_id      = var.vpc_id

  ingress {
    description = "SSH from specific IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "SecConfig-SSH-SG-${var.environment}"
  }
}

# Security Group for Web Traffic
resource "aws_security_group" "web_access" {
  name        = "SecConfig-Web-Access-${var.environment}"
  description = "Security group for web traffic"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "SecConfig-Web-SG-${var.environment}"
  }
}

# Network ACL for additional security
resource "aws_network_acl" "restrictive" {
  vpc_id = var.vpc_id

  # Allow HTTP inbound
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }

  # Allow HTTPS inbound
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  # Allow return traffic (ephemeral ports)
  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Allow all outbound traffic
  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name = "SecConfig-Restrictive-NACL-${var.environment}"
  }
}
```

### modules/security/variables.tf
```hcl
variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}
```

### modules/security/outputs.tf
```hcl
output "ssh_security_group_id" {
  description = "ID of the SSH security group"
  value       = aws_security_group.ssh_access.id
}

output "web_security_group_id" {
  description = "ID of the web security group"
  value       = aws_security_group.web_access.id
}

output "network_acl_id" {
  description = "ID of the restrictive network ACL"
  value       = aws_network_acl.restrictive.id
}
```

### modules/storage/main.tf
```hcl
# KMS Key for S3 Encryption
resource "aws_kms_key" "s3_encryption" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 7

  tags = {
    Name = "SecConfig-S3-KMS-Key-${var.environment}"
  }
}

# KMS Key Alias
resource "aws_kms_alias" "s3_encryption" {
  name          = "alias/secconfig-s3-${var.environment}"
  target_key_id = aws_kms_key.s3_encryption.key_id
}

# S3 Bucket with Encryption
resource "aws_s3_bucket" "secure_bucket" {
  bucket = "secconfig-secure-bucket-${var.environment}-${random_string.bucket_suffix.result}"

  tags = {
    Name = "SecConfig-Secure-Bucket-${var.environment}"
  }
}

# Random string for unique bucket naming
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server-Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_encryption.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Policy
resource "aws_s3_bucket_policy" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.secure_bucket.arn,
          "${aws_s3_bucket.secure_bucket.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# EBS Default Encryption
resource "aws_ebs_default_kms_key" "default" {
  key_arn = aws_kms_key.ebs_encryption.arn
}

resource "aws_ebs_encryption_by_default" "default" {
  enabled = true
}

# KMS Key for EBS Encryption
resource "aws_kms_key" "ebs_encryption" {
  description             = "KMS key for EBS volume encryption"
  deletion_window_in_days = 7

  tags = {
    Name = "SecConfig-EBS-KMS-Key-${var.environment}"
  }
}

# KMS Key Alias for EBS
resource "aws_kms_alias" "ebs_encryption" {
  name          = "alias/secconfig-ebs-${var.environment}"
  target_key_id = aws_kms_key.ebs_encryption.key_id
}
```

### modules/storage/variables.tf
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}
```

### modules/storage/outputs.tf
```hcl
output "s3_bucket_name" {
  description = "Name of the secure S3 bucket"
  value       = aws_s3_bucket.secure_bucket.id
}

output "s3_bucket_arn" {
  description = "ARN of the secure S3 bucket"
  value       = aws_s3_bucket.secure_bucket.arn
}

output "kms_key_id" {
  description = "ID of the KMS key for S3 encryption"
  value       = aws_kms_key.s3_encryption.key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS key for S3 encryption"
  value       = aws_kms_key.s3_encryption.arn
}

output "ebs_kms_key_id" {
  description = "ID of the KMS key for EBS encryption"
  value       = aws_kms_key.ebs_encryption.key_id
}
```

### modules/monitoring/main.tf
```hcl
# CloudTrail S3 Bucket
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "secconfig-cloudtrail-${var.environment}-${random_string.cloudtrail_suffix.result}"

  tags = {
    Name = "SecConfig-CloudTrail-Bucket-${var.environment}"
  }
}

resource "random_string" "cloudtrail_suffix" {
  length  = 8
  special = false
  upper   = false
}

# CloudTrail S3 Bucket Policy
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
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# CloudTrail
resource "aws_cloudtrail" "main" {
  name           = "SecConfig-CloudTrail-${var.environment}"
  s3_bucket_name = aws_s3_bucket.cloudtrail.bucket

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }
  }

  tags = {
    Name = "SecConfig-CloudTrail-${var.environment}"
  }
}

# CloudWatch Log Group for failed login attempts
resource "aws_cloudwatch_log_group" "security_logs" {
  name              = "/aws/security/login-attempts"
  retention_in_days = 30

  tags = {
    Name = "SecConfig-Security-Logs-${var.environment}"
  }
}

# CloudWatch Metric Filter for failed login attempts
resource "aws_cloudwatch_log_metric_filter" "failed_logins" {
  name           = "SecConfig-FailedLogins-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.security_logs.name
  pattern        = "[timestamp, request_id, event_type=\"ConsoleLogin\", event_name, source_ip, user_agent, error_code=\"Failed\", error_message]"

  metric_transformation {
    name      = "FailedLoginAttempts"
    namespace = "Security/Authentication"
    value     = "1"
  }
}

# CloudWatch Alarm for excessive login attempts
resource "aws_cloudwatch_metric_alarm" "excessive_login_attempts" {
  alarm_name          = "SecConfig-ExcessiveLoginAttempts-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FailedLoginAttempts"
  namespace           = "Security/Authentication"
  period              = "300"  # 5 minutes
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors failed login attempts"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = {
    Name = "SecConfig-Login-Alarm-${var.environment}"
  }
}

# SNS Topic for Security Alerts
resource "aws_sns_topic" "security_alerts" {
  name = "SecConfig-SecurityAlerts-${var.environment}"

  tags = {
    Name = "SecConfig-Security-Alerts-${var.environment}"
  }
}

# GuardDuty
resource "aws_guardduty_detector" "main" {
  enable = true

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

  tags = {
    Name = "SecConfig-GuardDuty-${var.environment}"
  }
}

# Config Configuration Recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "SecConfig-Recorder-${var.environment}"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }

  depends_on = [aws_config_delivery_channel.main]
}

# Config Delivery Channel
resource "aws_

```