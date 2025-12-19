File: lib/versions.tf

```hcl
# Terraform Version Configuration

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}
```

File: lib/variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "pr_number" {
  description = "PR number for resource identification"
  type        = string
  default     = ""
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "Availability zones for resources"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "cost_center" {
  description = "Cost center for tagging"
  type        = string
}

variable "db_username" {
  description = "Master username for RDS"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

# Note: db_password is now retrieved from AWS Secrets Manager
# Secret name: payment-app/${var.environment}/db-password
# Secret format: {"password": "your-password-here"}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "ec2_tenancy" {
  description = "EC2 instance tenancy"
  type        = string
  default     = "default"
}

variable "asg_min_size" {
  description = "Minimum size of Auto Scaling Group"
  type        = number
}

variable "asg_max_size" {
  description = "Maximum size of Auto Scaling Group"
  type        = number
}

variable "asg_desired_capacity" {
  description = "Desired capacity of Auto Scaling Group"
  type        = number
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for ALB and RDS"
  type        = bool
  default     = false
}

variable "log_retention_days" {
  description = "Number of days to retain logs in CloudWatch"
  type        = number
  default     = 90
}

variable "allowed_ip_addresses" {
  description = "List of IP addresses to whitelist in WAF"
  type        = list(string)
  default     = []
}

variable "blocked_ip_addresses" {
  description = "List of IP addresses to blacklist in WAF"
  type        = list(string)
  default     = []
}

variable "blocked_countries" {
  description = "List of country codes to block in WAF"
  type        = list(string)
  default     = []
}
```

File: lib/main.tf

```hcl
locals {
  common_tags = {
    Environment = var.environment
    CostCenter  = var.cost_center
    ManagedBy   = "Terraform"
    Workspace   = terraform.workspace
    PRNumber    = var.pr_number
  }

  is_production = var.environment == "prod"

  # Resource naming prefix with PR number
  name_prefix = var.pr_number != "" ? "${var.environment}-${var.pr_number}" : var.environment
}

# AWS Secrets Manager - Create database password secret
resource "random_password" "db_password" {
  length  = 32
  special = true
  # Override characters to avoid issues with PostgreSQL
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "db_password" {
  name        = "payment-app/${var.environment}/db-password"
  description = "Database password for ${var.environment} environment"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-password"
  })
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    password = random_password.db_password.result
  })
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  environment        = local.name_prefix
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  tags               = local.common_tags
}

# Security Groups
resource "aws_security_group" "alb" {
  name_prefix = "${local.name_prefix}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-sg"
  })
}

resource "aws_security_group" "app" {
  name_prefix = "${local.name_prefix}-app-sg"
  description = "Security group for application instances"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-sg"
  })
}

resource "aws_security_group" "rds" {
  name_prefix = "${local.name_prefix}-rds-sg"
  description = "Security group for RDS database"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
    description     = "PostgreSQL access from application instances only"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-sg"
  })
}

# S3 Module
module "s3" {
  source = "./modules/s3"

  environment = local.name_prefix
  tags        = local.common_tags
}

# Application Load Balancer Module
module "alb" {
  source = "./modules/alb"

  environment                = local.name_prefix
  vpc_id                     = module.vpc.vpc_id
  public_subnet_ids          = module.vpc.public_subnet_ids
  security_group_id          = aws_security_group.alb.id
  enable_deletion_protection = var.enable_deletion_protection
  tags                       = local.common_tags
}

# Auto Scaling Group Module
module "asg" {
  source = "./modules/asg"

  environment          = local.name_prefix
  vpc_id               = module.vpc.vpc_id
  private_subnet_ids   = module.vpc.private_subnet_ids
  security_group_id    = aws_security_group.app.id
  target_group_arn     = module.alb.target_group_arn
  instance_type        = var.ec2_instance_type
  instance_tenancy     = var.ec2_tenancy
  iam_instance_profile = aws_iam_instance_profile.ec2_instance.name
  kms_key_id           = aws_kms_key.ebs.arn
  min_size             = var.asg_min_size
  max_size             = var.asg_max_size
  desired_capacity     = var.asg_desired_capacity
  alb_dns              = module.alb.alb_dns_name
  s3_bucket            = module.s3.bucket_name
  rds_endpoint         = module.rds.endpoint
  secret_name          = aws_secretsmanager_secret.db_password.name
  kms_rds_key_id       = aws_kms_key.rds.key_id
  kms_ebs_key_id       = aws_kms_key.ebs.key_id
  aws_region           = var.aws_region
  tags                 = local.common_tags
}

# RDS Module
module "rds" {
  source = "./modules/rds"

  environment                = local.name_prefix
  private_subnet_ids         = module.vpc.private_subnet_ids
  security_group_id          = aws_security_group.rds.id
  instance_class             = var.rds_instance_class
  db_username                = var.db_username
  db_password                = random_password.db_password.result
  kms_key_id                 = aws_kms_key.rds.arn
  enable_deletion_protection = var.enable_deletion_protection
  multi_az                   = local.is_production
  tags                       = local.common_tags
}
```

File: lib/iam.tf

```hcl
# IAM Role for EC2 Instances

resource "aws_iam_role" "ec2_instance" {
  name = "${local.name_prefix}-ec2-role"

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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-role"
  })
}

# IAM Policy for S3 Access
resource "aws_iam_role_policy" "s3_access" {
  name = "${local.name_prefix}-s3-access"
  role = aws_iam_role.ec2_instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket",
          "s3:PutObject"
        ]
        Resource = [
          module.s3.bucket_arn,
          "${module.s3.bucket_arn}/*"
        ]
      }
    ]
  })
}

# IAM Policy for Secrets Manager Access
resource "aws_iam_role_policy" "secrets_access" {
  name = "${local.name_prefix}-secrets-access"
  role = aws_iam_role.ec2_instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = aws_secretsmanager_secret.db_password.arn
      }
    ]
  })
}

# IAM Policy for KMS Access
resource "aws_iam_role_policy" "kms_access" {
  name = "${local.name_prefix}-kms-access"
  role = aws_iam_role.ec2_instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = [
          aws_kms_key.ebs.arn,
          aws_kms_key.rds.arn
        ]
      }
    ]
  })
}

# IAM Policy for CloudWatch Logs
resource "aws_iam_role_policy" "cloudwatch_logs" {
  name = "${local.name_prefix}-cloudwatch-logs"
  role = aws_iam_role.ec2_instance.id

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
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/*"
      }
    ]
  })
}

# Attach AWS managed policies
resource "aws_iam_role_policy_attachment" "ssm_managed_instance" {
  role       = aws_iam_role.ec2_instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "cloudwatch_agent" {
  role       = aws_iam_role.ec2_instance.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_instance" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2_instance.name

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ec2-profile"
  })
}
```

File: lib/kms.tf

```hcl
# KMS Key for RDS Encryption

resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption - ${var.environment}"
  deletion_window_in_days = var.enable_deletion_protection ? 30 : 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-kms"
  })
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${local.name_prefix}-rds"
  target_key_id = aws_kms_key.rds.key_id
}

# KMS Key Policy for RDS
resource "aws_kms_key_policy" "rds" {
  key_id = aws_kms_key.rds.id

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
        Sid    = "Allow RDS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:CreateGrant"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant"
        ]
        Resource = "*"
      }
    ]
  })
}

# KMS Key for EBS Volumes (EC2)
resource "aws_kms_key" "ebs" {
  description             = "KMS key for EBS encryption - ${var.environment}"
  deletion_window_in_days = var.enable_deletion_protection ? 30 : 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ebs-kms"
  })
}

resource "aws_kms_alias" "ebs" {
  name          = "alias/${local.name_prefix}-ebs"
  target_key_id = aws_kms_key.ebs.key_id
}

# KMS Key Policy for EBS
resource "aws_kms_key_policy" "ebs" {
  key_id = aws_kms_key.ebs.id

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
        Sid    = "Allow EC2 to use the key"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow Auto Scaling to use the key"
        Effect = "Allow"
        Principal = {
          Service = "autoscaling.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "ec2.${var.aws_region}.amazonaws.com"
          }
        }
      },
      {
        Sid    = "Allow service-linked role for Auto Scaling"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-service-role/[autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling](https://autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling)"
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant"
        ]
        Resource = "*"
      }
    ]
  })
}

# Data source for current AWS account

data "aws_caller_identity" "current" {}
```

File: lib/waf.tf

```hcl
# WAF Web ACL for Application Load Balancer

resource "aws_wafv2_web_acl" "main" {
  name  = "${local.name_prefix}-waf-acl"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # Rule 1: Rate limiting to prevent DDoS
  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  # Rule 2: AWS Managed Rules - Core Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesCommonRuleSet"

        # Exclude specific rules if needed
        rule_action_override {
          name = "SizeRestrictions_BODY"
          action_to_use {
            count {}
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-common-rule-set"
      sampled_requests_enabled   = true
    }
  }

  # Rule 3: AWS Managed Rules - Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-bad-inputs"
      sampled_requests_enabled   = true
    }
  }

  # Rule 4: AWS Managed Rules - SQL Injection
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesSQLiRuleSet"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-sqli"
      sampled_requests_enabled   = true
    }
  }

  # Rule 5: Geo-blocking (example: block specific countries if needed)
  # Only created if blocked_countries list is not empty
  dynamic "rule" {
    for_each = length(var.blocked_countries) > 0 ? [1] : []

    content {
      name     = "GeoBlockingRule"
      priority = 5

      action {
        count {} # Using count for monitoring, change to block if needed
      }

      statement {
        geo_match_statement {
          country_codes = var.blocked_countries
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${local.name_prefix}-geo-block"
        sampled_requests_enabled   = true
      }
    }
  }

  # Rule 6: IP Reputation List
  rule {
    name     = "AWSManagedRulesAmazonIpReputationList"
    priority = 6

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesAmazonIpReputationList"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-ip-reputation"
      sampled_requests_enabled   = true
    }
  }

  # Rule 7: Custom IP whitelist (allow specific IPs)
  # Note: Removed overly restrictive User-Agent rule that was blocking legitimate traffic
  dynamic "rule" {
    for_each = length(var.allowed_ip_addresses) > 0 ? [1] : []

    content {
      name     = "IPWhitelistRule"
      priority = 7

      action {
        allow {}
      }

      statement {
        ip_set_reference_statement {
          arn = aws_wafv2_ip_set.whitelist[0].arn
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${local.name_prefix}-ip-whitelist"
        sampled_requests_enabled   = true
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name_prefix}-waf"
    sampled_requests_enabled   = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-waf-acl"
  })
}

# IP Set for whitelisted IPs (optional)
resource "aws_wafv2_ip_set" "whitelist" {
  count = length(var.allowed_ip_addresses) > 0 ? 1 : 0

  name               = "${local.name_prefix}-ip-whitelist"
  scope              = "REGIONAL"
  ip_address_version = "IPV4"
  addresses          = var.allowed_ip_addresses

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ip-whitelist"
  })
}

# IP Set for blacklisted IPs
resource "aws_wafv2_ip_set" "blacklist" {
  name               = "${local.name_prefix}-ip-blacklist"
  scope              = "REGIONAL"
  ip_address_version = "IPV4"
  addresses          = var.blocked_ip_addresses

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ip-blacklist"
  })
}

# Rule for IP blacklist
resource "aws_wafv2_web_acl_association" "alb" {
  resource_arn = module.alb.alb_arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

# CloudWatch Log Group for WAF logs
# Note: WAFv2 requires log group name to start with "aws-waf-logs-"
resource "aws_cloudwatch_log_group" "waf" {
  name              = "aws-waf-logs-${local.name_prefix}"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-waf-logs"
  })
}

# WAF Logging Configuration
resource "aws_wafv2_web_acl_logging_configuration" "main" {
  resource_arn            = aws_wafv2_web_acl.main.arn
  log_destination_configs = ["${aws_cloudwatch_log_group.waf.arn}:*"]

  redacted_fields {
    single_header {
      name = "authorization"
    }
  }

  redacted_fields {
    single_header {
      name = "cookie"
    }
  }
}
```

File: lib/outputs.tf

```hcl
# Root Module - Outputs

output "name_prefix" {
  value       = local.name_prefix
  description = "Resource naming prefix (includes PR number)"
}

output "pr_number" {
  value       = var.pr_number
  description = "PR number used for resource identification"
}

output "vpc_id" {
  value       = module.vpc.vpc_id
  description = "ID of the VPC"
}

output "alb_dns_name" {
  value       = module.alb.alb_dns_name
  description = "DNS name of the Application Load Balancer"
}

output "alb_arn" {
  value       = module.alb.alb_arn
  description = "ARN of the Application Load Balancer"
}

output "target_group_arn" {
  value       = module.alb.target_group_arn
  description = "ARN of the target group"
}

output "rds_endpoint" {
  value       = module.rds.endpoint
  description = "RDS instance endpoint"
  sensitive   = true
}

output "rds_identifier" {
  value       = "${local.name_prefix}-db"
  description = "RDS instance identifier with PR number"
}

output "s3_bucket_name" {
  value       = module.s3.bucket_name
  description = "Name of the S3 bucket"
}

output "s3_bucket_arn" {
  value       = module.s3.bucket_arn
  description = "ARN of the S3 bucket"
}

output "db_secret_arn" {
  value       = aws_secretsmanager_secret.db_password.arn
  description = "ARN of the database password secret in AWS Secrets Manager"
}

output "db_secret_name" {
  value       = aws_secretsmanager_secret.db_password.name
  description = "Name of the database password secret in AWS Secrets Manager (includes PR number)"
}

output "db_username" {
  value       = var.db_username
  description = "Database master username"
  sensitive   = true
}

output "waf_web_acl_id" {
  value       = aws_wafv2_web_acl.main.id
  description = "ID of the WAF Web ACL"
}

output "waf_web_acl_arn" {
  value       = aws_wafv2_web_acl.main.arn
  description = "ARN of the WAF Web ACL"
}

output "waf_web_acl_name" {
  value       = "${local.name_prefix}-waf-acl"
  description = "Name of the WAF Web ACL with PR number"
}

output "iam_role_arn" {
  value       = aws_iam_role.ec2_instance.arn
  description = "ARN of the EC2 IAM role"
}

output "iam_role_name" {
  value       = "${local.name_prefix}-ec2-role"
  description = "Name of the EC2 IAM role with PR number"
}

output "kms_rds_key_id" {
  value       = aws_kms_key.rds.key_id
  description = "KMS key ID for RDS encryption"
}

output "kms_rds_key_arn" {
  value       = aws_kms_key.rds.arn
  description = "KMS key ARN for RDS encryption"
}

output "kms_rds_alias" {
  value       = "alias/${local.name_prefix}-rds"
  description = "KMS key alias for RDS with PR number"
}

output "kms_ebs_key_id" {
  value       = aws_kms_key.ebs.key_id
  description = "KMS key ID for EBS encryption"
}

output "kms_ebs_key_arn" {
  value       = aws_kms_key.ebs.arn
  description = "KMS key ARN for EBS encryption"
}

output "kms_ebs_alias" {
  value       = "alias/${local.name_prefix}-ebs"
  description = "KMS key alias for EBS with PR number"
}

output "resource_summary" {
  value = {
    name_prefix    = local.name_prefix
    environment    = var.environment
    pr_number      = var.pr_number
    vpc_id         = module.vpc.vpc_id
    alb_dns        = module.alb.alb_dns_name
    s3_bucket      = module.s3.bucket_name
    rds_identifier = "${local.name_prefix}-db"
    secret_name    = aws_secretsmanager_secret.db_password.name
    waf_acl_name   = "${local.name_prefix}-waf-acl"
    iam_role_name  = "${local.name_prefix}-ec2-role"
    kms_rds_alias  = "alias/${local.name_prefix}-rds"
    kms_ebs_alias  = "alias/${local.name_prefix}-ebs"
  }
  description = "Summary of all resources with PR number naming"
}
```

File: lib/dev.tfvars

```hcl
environment = "dev"
aws_region  = "us-east-1"
pr_number   = "pr7015dev"

vpc_cidr           = "10.1.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

cost_center = "Development"

# Instance configurations - smaller for dev
ec2_instance_type  = "t3.micro"
rds_instance_class = "db.t3.micro"
ec2_tenancy        = "default"

# Auto Scaling configuration
asg_min_size         = 1
asg_max_size         = 3
asg_desired_capacity = 2

# Database credentials
# Password is retrieved from AWS Secrets Manager: payment-app/dev/db-password
db_username = "dbadmin"

# Protection settings

enable_deletion_protection = false
```

File: lib/staging.tfvars

```hcl
environment = "staging"
aws_region  = "us-east-1"
pr_number   = "pr7015staging"

vpc_cidr           = "10.2.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

cost_center = "Staging"

# Instance configurations - smaller for staging
ec2_instance_type  = "t3.micro"
rds_instance_class = "db.t3.micro"
ec2_tenancy        = "default"

# Auto Scaling configuration
asg_min_size         = 2
asg_max_size         = 4
asg_desired_capacity = 2

# Database credentials
# Password is retrieved from AWS Secrets Manager: payment-app/staging/db-password
db_username = "dbadmin"

# Protection settings

enable_deletion_protection = false
```

File: lib/prod.tfvars

```hcl
environment = "prod"
aws_region  = "us-east-1"
pr_number   = "pr7015prod"

vpc_cidr           = "10.3.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

cost_center = "Production"

# Instance configurations - larger for production
ec2_instance_type  = "m5.large"
rds_instance_class = "db.m5.large"
ec2_tenancy        = "dedicated"

# Auto Scaling configuration
asg_min_size         = 3
asg_max_size         = 10
asg_desired_capacity = 4

# Database credentials
# Password is retrieved from AWS Secrets Manager: payment-app/prod/db-password
db_username = "dbadmin"

# Protection settings

enable_deletion_protection = true
```

File: lib/modules/vpc/main.tf

```hcl
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "${var.environment}-vpc"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.environment}-igw"
  })
}

resource "aws_subnet" "public" {
  count = length(var.availability_zones)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${var.environment}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

resource "aws_subnet" "private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${var.environment}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

resource "aws_eip" "nat" {
  count = length(var.availability_zones)

  domain = "vpc"

  tags = merge(var.tags, {
    Name = "${var.environment}-nat-eip-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "main" {
  count = length(var.availability_zones)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.tags, {
    Name = "${var.environment}-nat-gateway-${count.index + 1}"
  })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-public-rt"
  })
}

resource "aws_route_table" "private" {
  count = length(var.availability_zones)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-private-rt-${count.index + 1}"
  })
}

resource "aws_route_table_association" "public" {
  count = length(var.availability_zones)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(var.availability_zones)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

File: lib/modules/vpc/variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}
```

File: lib/modules/vpc/outputs.tf

```hcl
output "vpc_id" {
  value       = aws_vpc.main.id
  description = "ID of the VPC"
}

output "public_subnet_ids" {
  value       = aws_subnet.public[*].id
  description = "List of public subnet IDs"
}

output "private_subnet_ids" {
  value       = aws_subnet.private[*].id
  description = "List of private subnet IDs"
}

output "vpc_cidr" {
  value       = aws_vpc.main.cidr_block
  description = "CIDR block of the VPC"
}
```

File: lib/modules/s3/main.tf

```hcl
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "main" {
  bucket = "${var.environment}-app-bucket-${random_id.bucket_suffix.hex}"

  tags = merge(var.tags, {
    Name = "${var.environment}-app-bucket"
  })
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    id     = "expire-old-versions"
    status = "Enabled"

    filter {
      prefix = ""
    }

    noncurrent_version_expiration {
      noncurrent_days = var.environment == "prod" ? 90 : 30
    }
  }

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = var.environment == "prod" ? 60 : 30
      storage_class = "STANDARD_IA"
    }
  }
}
```

File: lib/modules/s3/variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}
```

File: lib/modules/s3/outputs.tf

```hcl
output "bucket_name" {
  value       = aws_s3_bucket.main.id
  description = "Name of the S3 bucket"
}

output "bucket_arn" {
  value       = aws_s3_bucket.main.arn
  description = "ARN of the S3 bucket"
}
```

File: lib/modules/alb/main.tf

```hcl
# S3 Bucket for ALB Access Logs

resource "aws_s3_bucket" "alb_logs" {
  bucket = "${var.environment}-alb-logs"

  tags = merge(var.tags, {
    Name = "${var.environment}-alb-logs"
  })
}

resource "aws_s3_bucket_versioning" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = var.log_retention_days
    }
  }
}

# S3 Bucket Policy for ALB Access Logs
# Reference: [https://docs.aws.amazon.com/elasticloadbalancing/latest/application/enable-access-logging.html](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/enable-access-logging.html)
data "aws_elb_service_account" "main" {}

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSLogDeliveryWrite"
        Effect = "Allow"
        Principal = {
          Service = "elasticloadbalancing.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/*"
      },
      {
        Sid    = "AWSLogDeliveryAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "elasticloadbalancing.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.alb_logs.arn
      },
      {
        Sid    = "AWSELBAccountWrite"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_elb_service_account.main.id}:root"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/*"
      }
    ]
  })
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.security_group_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection       = var.enable_deletion_protection
  enable_http2                     = true
  enable_cross_zone_load_balancing = true

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    enabled = true
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-alb"
  })

  depends_on = [aws_s3_bucket_policy.alb_logs]
}

resource "aws_lb_target_group" "main" {
  name     = "${var.environment}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = merge(var.tags, {
    Name = "${var.environment}-tg"
  })
}

resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}
```

File: lib/modules/alb/variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for ALB"
  type        = string
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = false
}

variable "log_retention_days" {
  description = "Number of days to retain ALB access logs"
  type        = number
  default     = 90
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}
```

File: lib/modules/alb/outputs.tf

```hcl
output "alb_arn" {
  value       = aws_lb.main.arn
  description = "ARN of the Application Load Balancer"
}

output "alb_dns_name" {
  value       = aws_lb.main.dns_name
  description = "DNS name of the Application Load Balancer"
}

output "target_group_arn" {
  value       = aws_lb_target_group.main.arn
  description = "ARN of the target group"
}
```

File: lib/modules/asg/main.tf

```hcl
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_launch_template" "main" {
  name_prefix   = "${var.environment}-lt-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = var.instance_type

  iam_instance_profile {
    name = var.iam_instance_profile
  }

  vpc_security_group_ids = [var.security_group_id]

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      delete_on_termination = true
      encrypted             = true
      kms_key_id            = var.kms_key_id
    }
  }

  placement {
    tenancy = var.instance_tenancy
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    environment    = var.environment
    vpc_id         = var.vpc_id
    alb_dns        = var.alb_dns
    s3_bucket      = var.s3_bucket
    rds_endpoint   = var.rds_endpoint
    secret_name    = var.secret_name
    kms_rds_key_id = var.kms_rds_key_id
    kms_ebs_key_id = var.kms_ebs_key_id
    aws_region     = var.aws_region
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(var.tags, {
      Name = "${var.environment}-app-instance"
    })
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(var.tags, {
      Name = "${var.environment}-app-volume"
    })
  }
}

resource "aws_autoscaling_group" "main" {
  name                      = "${var.environment}-asg"
  vpc_zone_identifier       = var.private_subnet_ids
  target_group_arns         = [var.target_group_arn]
  health_check_type         = "ELB"
  health_check_grace_period = 1200
  min_size                  = var.min_size
  max_size                  = var.max_size
  desired_capacity          = var.desired_capacity

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.environment}-asg-instance"
    propagate_at_launch = true
  }

  dynamic "tag" {
    for_each = var.tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${var.environment}-scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${var.environment}-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}
```

File: lib/modules/asg/variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for EC2 instances"
  type        = string
}

variable "target_group_arn" {
  description = "Target group ARN for ALB"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "instance_tenancy" {
  description = "EC2 instance tenancy"
  type        = string
  default     = "default"
}

variable "iam_instance_profile" {
  description = "IAM instance profile name for EC2"
  type        = string
}

variable "kms_key_id" {
  description = "KMS key ID for EBS encryption"
  type        = string
}

variable "alb_dns" {
  description = "ALB DNS name"
  type        = string
  default     = ""
}

variable "s3_bucket" {
  description = "S3 bucket name"
  type        = string
  default     = ""
}

variable "rds_endpoint" {
  description = "RDS endpoint"
  type        = string
  default     = ""
}

variable "secret_name" {
  description = "Secrets Manager secret name"
  type        = string
  default     = ""
}

variable "kms_rds_key_id" {
  description = "KMS key ID for RDS"
  type        = string
  default     = ""
}

variable "kms_ebs_key_id" {
  description = "KMS key ID for EBS"
  type        = string
  default     = ""
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "min_size" {
  description = "Minimum size of Auto Scaling Group"
  type        = number
}

variable "max_size" {
  description = "Maximum size of Auto Scaling Group"
  type        = number
}

variable "desired_capacity" {
  description = "Desired capacity of Auto Scaling Group"
  type        = number
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}
```

File: lib/modules/asg/outputs.tf

```hcl
output "asg_id" {
  value       = aws_autoscaling_group.main.id
  description = "ID of the Auto Scaling Group"
}

output "asg_name" {
  value       = aws_autoscaling_group.main.name
  description = "Name of the Auto Scaling Group"
}
```

File: lib/modules/asg/user_data.sh

```bash
#!/bin/bash
# User data script for EC2 instances in ${environment}

set -e

# Update system
yum update -y
amazon-linux-extras enable postgresql14
yum install -y httpd jq postgresql python3 python3-pip

# Install Python PostgreSQL adapter and boto3
pip3 install psycopg2-binary boto3 --quiet

# Create Python HTTP server for E2E testing
mkdir -p /opt/payment-app
cat > /opt/payment-app/app.py << 'PYTHON_EOF'
#!/usr/bin/env python3
"""
Simple HTTP server for E2E testing
Handles health checks and database connectivity tests
"""
import json
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Load configuration
DB_ENDPOINT = os.environ.get('DB_ENDPOINT', '')
DB_NAME = os.environ.get('DB_NAME', 'paymentdb')
DB_SECRET_NAME = os.environ.get('DB_SECRET_NAME', '')
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')

class PaymentAppHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/health':
            self.send_health_response()
        elif path == '/db-test':
            self.send_db_test_response()
        elif path == '/':
            self.send_root_response()
        else:
            self.send_error(404, "Not Found")
    
    def send_health_response(self):
        """Health check endpoint"""
        response = {
            "status": "healthy",
            "service": "payment-app"
        }
        self.send_json_response(200, response)
    
    def send_db_test_response(self):
        """Test database connectivity"""
        try:
            # Get DB credentials from Secrets Manager
            import boto3
            secrets_client = boto3.client('secretsmanager', region_name=AWS_REGION)
            
            secret_response = secrets_client.get_secret_value(SecretId=DB_SECRET_NAME)
            db_creds = json.loads(secret_response['SecretString'])
            
            db_host = DB_ENDPOINT.split(':')[0] if ':' in DB_ENDPOINT else DB_ENDPOINT
            db_port = DB_ENDPOINT.split(':')[1] if ':' in DB_ENDPOINT else '5432'
            db_user = db_creds.get('username') or db_creds.get('user') or 'dbadmin'
            db_password = db_creds.get('password')
            db_name = db_creds.get('dbname') or db_creds.get('database') or DB_NAME
            
            # Test connection using psycopg2
            import psycopg2
            conn = psycopg2.connect(
                host=db_host,
                port=db_port,
                user=db_user,
                password=db_password,
                database=db_name,
                connect_timeout=5
            )
            
            cursor = conn.cursor()
            cursor.execute("SELECT 1 as test_result, current_timestamp as query_time;")
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            
            response = {
                "status": "success",
                "message": "Database connection successful",
                "test_result": result[0],
                "query_time": str(result[1]),
                "endpoint": DB_ENDPOINT
            }
            self.send_json_response(200, response)
            
        except Exception as e:
            response = {
                "status": "error",
                "message": f"Database connection failed: {str(e)}",
                "endpoint": DB_ENDPOINT
            }
            self.send_json_response(500, response)
    
    def send_root_response(self):
        """Root endpoint"""
        html = f"""<html>
<head><title>Payment App</title></head>
<body>
    <h1>Welcome to Payment App ({os.environ.get('ENVIRONMENT', 'dev')})</h1>
    <p>DB Endpoint: {DB_ENDPOINT}</p>
    <ul>
        <li><a href="/health">Health Check</a></li>
        <li><a href="/db-test">Database Test</a></li>
    </ul>
</body>
</html>"""
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.send_header('Content-Length', str(len(html)))
        self.end_headers()
        self.wfile.write(html.encode())
    
    def send_json_response(self, status_code, data):
        """Send JSON response"""
        json_data = json.dumps(data, indent=2)
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(json_data)))
        self.end_headers()
        self.wfile.write(json_data.encode())
    
    def log_message(self, format, *args):
        """Suppress default logging"""
        pass

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    server = HTTPServer(('0.0.0.0', port), PaymentAppHandler)
    print(f'Starting Payment App server on port {port}...')
    server.serve_forever()
PYTHON_EOF

chmod +x /opt/payment-app/app.py

# Create systemd service for Python app
cat > /etc/systemd/system/payment-app.service << EOF
[Unit]
Description=Payment App Python Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/payment-app
Environment="DB_ENDPOINT=${rds_endpoint}"
Environment="DB_NAME=${db_name}"
Environment="DB_SECRET_NAME=${secret_name}"
Environment="AWS_REGION=${aws_region}"
Environment="ENVIRONMENT=${environment}"
Environment="PORT=8080"
ExecStart=/usr/bin/python3 /opt/payment-app/app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Configure Apache to proxy to Python server
cat >> /etc/httpd/conf/httpd.conf << 'APACHE_PROXY_EOF'

# Proxy to Python server
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so

<Location /db-test>
    ProxyPass http://127.0.0.1:8080/db-test
    ProxyPassReverse http://127.0.0.1:8080/db-test
</Location>

<Location /health>
    ProxyPass http://127.0.0.1:8080/health
    ProxyPassReverse http://127.0.0.1:8080/health
</Location>
APACHE_PROXY_EOF

# Start Python server
systemctl daemon-reload
systemctl enable payment-app
systemctl start payment-app

# Start Apache
systemctl start httpd
systemctl enable httpd

# Create health check endpoint
cat <<'HEALTH_EOF' > /var/www/html/health
OK
HEALTH_EOF

# Create detailed health endpoint with JSON response
cat <<'HEALTH_JSON_EOF' > /var/www/html/health.json
{
  "status": "healthy",
  "environment": "${environment}",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
HEALTH_JSON_EOF

# Create main index page
cat <<'INDEX_EOF' > /var/www/html/index.html
<!DOCTYPE html>
<html>
<head>
    <title>Environment: ${environment}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f0f0f0; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #232f3e; }
        .info { margin: 20px 0; }
        .endpoint { background: #232f3e; color: white; padding: 5px 10px; border-radius: 4px; font-family: monospace; }
        ul { list-style-type: none; padding: 0; }
        li { margin: 10px 0; }
        a { color: #ff9900; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to ${environment} Environment</h1>
        
        <div class="info">
            <p><strong>Instance ID:</strong> <span class="endpoint">INSTANCE_ID_PLACEHOLDER</span></p>
            <p><strong>Availability Zone:</strong> <span class="endpoint">AZ_PLACEHOLDER</span></p>
            <p><strong>Instance Type:</strong> <span class="endpoint">INSTANCE_TYPE_PLACEHOLDER</span></p>
            <p><strong>Private IP:</strong> <span class="endpoint">PRIVATE_IP_PLACEHOLDER</span></p>
        </div>

        <h2>Available Test Endpoints:</h2>
        <ul>
            <li><a href="/health">/health</a> - Simple health check</li>
            <li><a href="/health.json">/health.json</a> - Health check (JSON)</li>
            <li><a href="/status">/status</a> - Detailed status information</li>
            <li><a href="/db-test">/db-test</a> - Database connectivity test</li>
            <li><a href="/s3-test">/s3-test</a> - S3 bucket connectivity test</li>
            <li><a href="/secrets-test">/secrets-test</a> - Secrets Manager test</li>
            <li><a href="/metadata">/metadata</a> - EC2 metadata</li>
            <li><a href="/env">/env</a> - Environment information</li>
            <li><a href="/config">/config</a> - Configuration details</li>
        </ul>
    </div>
</body>
</html>
INDEX_EOF

# Get instance metadata
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" 2>/dev/null || echo "")
if [ -n "$TOKEN" ]; then
    INSTANCE_ID=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null)
    AZ=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/availability-zone 2>/dev/null)
    INSTANCE_TYPE=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-type 2>/dev/null)
    PRIVATE_IP=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/local-ipv4 2>/dev/null)
else
    INSTANCE_ID=$(ec2-metadata --instance-id | cut -d " " -f 2)
    AZ=$(ec2-metadata --availability-zone | cut -d " " -f 2)
    INSTANCE_TYPE=$(ec2-metadata --instance-type | cut -d " " -f 2)
    PRIVATE_IP=$(ec2-metadata --local-ipv4 | cut -d " " -f 2)
fi

# Update index.html with actual values
sed -i "s|INSTANCE_ID_PLACEHOLDER|$INSTANCE_ID|g" /var/www/html/index.html
sed -i "s|AZ_PLACEHOLDER|$AZ|g" /var/www/html/index.html
sed -i "s|INSTANCE_TYPE_PLACEHOLDER|$INSTANCE_TYPE|g" /var/www/html/index.html
sed -i "s|PRIVATE_IP_PLACEHOLDER|$PRIVATE_IP|g" /var/www/html/index.html

# Create status endpoint
cat > /var/www/html/status <<'STATUS_EOF'
#!/bin/bash
echo "Content-type: text/html"
echo ""
echo "<html><body>"
echo "<h1>System Status</h1>"
echo "<p>Uptime: $(uptime)</p>"
echo "<p>Memory: $(free -h | grep Mem | awk '{print "Used: "$3" / Total: "$2}')</p>"
echo "<p>Disk: $(df -h / | tail -1 | awk '{print "Used: "$3" / Total: "$2" ("$5" full)"}')</p>"
echo "<p>Load Average: $(cat /proc/loadavg | cut -d' ' -f1-3)</p>"
echo "</body></html>"
STATUS_EOF
chmod +x /var/www/html/status

# Create DB test endpoint (PHP-like bash CGI)
cat > /var/www/html/db-test <<'DB_TEST_EOF'
#!/bin/bash
echo "Content-type: application/json"
echo ""

# Get RDS endpoint from environment
RDS_ENDPOINT="${rds_endpoint}"

if [ -z "$RDS_ENDPOINT" ]; then
    echo '{"status":"error","message":"RDS endpoint not configured"}'
    exit 0
fi

# Extract host from endpoint (remove port if present)
RDS_HOST="$${RDS_ENDPOINT%%:*}"

# Test connection (without actual credentials for security)
if timeout 3 bash -c "cat < /dev/null > /dev/tcp/$RDS_HOST/5432" 2>/dev/null; then
    echo "{\"status\":\"success\",\"message\":\"RDS endpoint reachable\",\"endpoint\":\"$RDS_ENDPOINT\",\"port\":5432}"
else
    echo "{\"status\":\"error\",\"message\":\"Cannot reach RDS endpoint\",\"endpoint\":\"$RDS_ENDPOINT\"}"
fi
DB_TEST_EOF
chmod +x /var/www/html/db-test

# Create S3 test endpoint
cat > /var/www/html/s3-test <<'S3_TEST_EOF'
#!/bin/bash
echo "Content-type: application/json"
echo ""

S3_BUCKET="${s3_bucket}"

if [ -z "$S3_BUCKET" ]; then
    echo '{"status":"error","message":"S3 bucket not configured"}'
    exit 0
fi

# Test S3 access using AWS CLI
if aws s3 ls "s3://$S3_BUCKET" --region ${aws_region} >/dev/null 2>&1; then
    echo "{\"status\":\"success\",\"message\":\"S3 bucket accessible\",\"bucket\":\"$S3_BUCKET\"}"
else
    echo "{\"status\":\"error\",\"message\":\"Cannot access S3 bucket\",\"bucket\":\"$S3_BUCKET\"}"
fi
S3_TEST_EOF
chmod +x /var/www/html/s3-test

# Create Secrets Manager test endpoint
cat > /var/www/html/secrets-test <<'SECRETS_TEST_EOF'
#!/bin/bash
echo "Content-type: application/json"
echo ""

SECRET_NAME="${secret_name}"

if [ -z "$SECRET_NAME" ]; then
    echo '{"status":"error","message":"Secret name not configured"}'
    exit 0
fi

# Test Secrets Manager access
if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region ${aws_region} >/dev/null 2>&1; then
    echo "{\"status\":\"success\",\"message\":\"Secret accessible\",\"secret_name\":\"$SECRET_NAME\"}"
else
    echo "{\"status\":\"error\",\"message\":\"Cannot access secret\",\"secret_name\":\"$SECRET_NAME\"}"
fi
SECRETS_TEST_EOF
chmod +x /var/www/html/secrets-test

# Create metadata endpoint
cat > /var/www/html/metadata <<'METADATA_EOF'
#!/bin/bash
echo "Content-type: application/json"
echo ""

TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" 2>/dev/null || echo "")

if [ -n "$TOKEN" ]; then
    INSTANCE_ID=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id)
    AZ=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/availability-zone)
    REGION=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/region)
    INSTANCE_TYPE=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-type)
    PRIVATE_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/local-ipv4)
    PUBLIC_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "N/A")
    AMI_ID=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/ami-id)
else
    INSTANCE_ID="unavailable"
    AZ="unavailable"
    REGION="${aws_region}"
    INSTANCE_TYPE="unavailable"
    PRIVATE_IP="unavailable"
    PUBLIC_IP="N/A"
    AMI_ID="unavailable"
fi

cat <<METADATA_JSON
{
  "instance_id": "$INSTANCE_ID",
  "availability_zone": "$AZ",
  "region": "$REGION",
  "instance_type": "$INSTANCE_TYPE",
  "private_ip": "$PRIVATE_IP",
  "public_ip": "$PUBLIC_IP",
  "ami_id": "$AMI_ID",
  "environment": "${environment}"
}
METADATA_JSON
METADATA_EOF
chmod +x /var/www/html/metadata

# Create environment info endpoint
cat > /var/www/html/env <<'ENV_EOF'
#!/bin/bash
echo "Content-type: application/json"
echo ""
cat <<ENV_JSON
{
  "environment": "${environment}",
  "vpc_id": "${vpc_id}",
  "alb_dns": "${alb_dns}",
  "region": "${aws_region}"
}
ENV_JSON
ENV_EOF
chmod +x /var/www/html/env

# Create config endpoint with all resource information
cat > /var/www/html/config <<'CONFIG_EOF'
#!/bin/bash
echo "Content-type: application/json"
echo ""
cat <<CONFIG_JSON
{
  "environment": "${environment}",
  "resources": {
    "vpc_id": "${vpc_id}",
    "alb_dns": "${alb_dns}",
    "s3_bucket": "${s3_bucket}",
    "rds_endpoint": "${rds_endpoint}",
    "secret_name": "${secret_name}",
    "kms_rds_key_id": "${kms_rds_key_id}",
    "kms_ebs_key_id": "${kms_ebs_key_id}"
  },
  "endpoints": [
    "/health",
    "/health.json",
    "/status",
    "/db-test",
    "/s3-test",
    "/secrets-test",
    "/metadata",
    "/env",
    "/config"
  ]
}
CONFIG_JSON
CONFIG_EOF
chmod +x /var/www/html/config

# Enable CGI execution in Apache
cat >> /etc/httpd/conf/httpd.conf <<'APACHE_EOF'

# Enable CGI execution
LoadModule cgi_module modules/mod_cgi.so
AddHandler cgi-script .cgi .sh
<Directory "/var/www/html">
    Options +ExecCGI +FollowSymLinks
    AllowOverride None
    Require all granted
</Directory>
APACHE_EOF

# Restart Apache to apply changes
systemctl restart httpd

# Log completion
echo "User data script completed successfully for ${environment}" >> /var/log/user-data.log
```

File: lib/modules/rds/main.tf

```hcl
resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = merge(var.tags, {
    Name = "${var.environment}-db-subnet-group"
  })
}

resource "aws_db_parameter_group" "main" {
  name   = "${var.environment}-db-params"
  family = "postgres15"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-db-params"
  })
}

resource "aws_db_instance" "main" {
  identifier     = "${var.environment}-db"
  engine         = "postgres"
  engine_version = "15.14"

  instance_class    = var.instance_class
  allocated_storage = var.multi_az ? 100 : 20
  storage_type      = "gp3"
  storage_encrypted = true
  kms_key_id        = var.kms_key_id

  db_name  = "appdb"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [var.security_group_id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name

  multi_az                = var.multi_az
  backup_retention_period = var.multi_az ? 30 : 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot       = !var.enable_deletion_protection
  final_snapshot_identifier = var.enable_deletion_protection ? "${var.environment}-db-final-snapshot-${formatdate("YYYY-MM-DD-hhmmss", timestamp())}" : null
  deletion_protection       = var.enable_deletion_protection

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = merge(var.tags, {
    Name = "${var.environment}-db"
  })
}
```

File: lib/modules/rds/variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for RDS"
  type        = string
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "db_username" {
  description = "Master username for RDS"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Master password for RDS"
  type        = string
  sensitive   = true
}

variable "kms_key_id" {
  description = "KMS key ID for RDS encryption"
  type        = string
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = false
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}
```

File: lib/modules/rds/outputs.tf

```hcl
output "endpoint" {
  value       = aws_db_instance.main.endpoint
  description = "RDS instance endpoint"
  sensitive   = true
}

output "database_name" {
  value       = aws_db_instance.main.db_name
  description = "Name of the database"
}

output "port" {
  value       = aws_db_instance.main.port
  description = "Database port"
}
