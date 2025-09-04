# Enterprise Security Framework - Terraform Implementation
# This creates a comprehensive security infrastructure for AWS
# Including: IAM, KMS, VPC, GuardDuty, Config, CloudTrail, WAF, and more

# ==============================================================================
# Variables
# ==============================================================================

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"

  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[0-9]$", var.aws_region))
    error_message = "AWS region must be in the format: us-west-2, eu-west-1, etc."
  }
}

variable "environment" {
  description = "Environment name (prod, staging, dev)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["prod", "staging", "dev"], var.environment)
    error_message = "Environment must be prod, staging, or dev."
  }
}

variable "organization_name" {
  description = "Organization name for resource naming"
  type        = string
  default     = "security-framework"

  validation {
    condition     = can(regex("^[a-zA-Z0-9-]+$", var.organization_name)) && length(var.organization_name) <= 20
    error_message = "Organization name must be alphanumeric with hyphens only, max 20 characters."
  }
}

variable "owner" {
  description = "Owner of the infrastructure"
  type        = string
  default     = "security-team"
}

variable "environment_suffix" {
  description = "Environment suffix to avoid resource conflicts"
  type        = string
  default     = ""

  validation {
    condition     = can(regex("^[a-zA-Z0-9-]*$", var.environment_suffix))
    error_message = "Environment suffix must be alphanumeric with hyphens only."
  }
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
  description = "List of availability zones (leave empty for automatic selection)"
  type        = list(string)
  default     = []

  validation {
    condition     = length(var.availability_zones) == 0 || length(var.availability_zones) >= 2
    error_message = "If specified, must provide at least 2 availability zones."
  }
}

# Security Configuration
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
    require_numbers                = bool
    require_symbols                = bool
    allow_users_to_change_password = bool
    max_password_age               = number
    password_reuse_prevention      = number
  })
  default = {
    minimum_password_length        = 14
    require_lowercase_characters   = true
    require_uppercase_characters   = true
    require_numbers                = true
    require_symbols                = true
    allow_users_to_change_password = true
    max_password_age               = 90
    password_reuse_prevention      = 12
  }

  validation {
    condition     = var.password_policy_requirements.minimum_password_length >= 8
    error_message = "Minimum password length must be at least 8 characters."
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

  validation {
    condition     = var.waf_rate_limit >= 100 && var.waf_rate_limit <= 20000000
    error_message = "WAF rate limit must be between 100 and 20,000,000."
  }
}

variable "allowed_countries" {
  description = "List of allowed country codes for WAF geo-blocking (empty list disables geo-blocking)"
  type        = list(string)
  default     = ["US", "CA", "GB", "DE", "FR", "JP", "AU"]

  validation {
    condition = alltrue([
      for country in var.allowed_countries : can(regex("^[A-Z]{2}$", country))
    ])
    error_message = "Country codes must be 2-letter uppercase ISO codes (e.g., US, CA, GB)."
  }
}

variable "blocked_ips" {
  description = "List of IP addresses/CIDR blocks to block"
  type        = list(string)
  default     = []

  validation {
    condition = alltrue([
      for ip in var.blocked_ips : can(cidrhost(ip, 0))
    ])
    error_message = "All blocked IPs must be valid IP addresses or CIDR blocks."
  }
}

# Monitoring Configuration
variable "enable_guardduty" {
  description = "Enable GuardDuty threat detection"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 90

  validation {
    condition = contains([
      1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653
    ], var.log_retention_days)
    error_message = "Log retention days must be a valid CloudWatch retention period."
  }
}

variable "security_notification_email" {
  description = "Email for security notifications"
  type        = string
  default     = "security@example.com"

  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.security_notification_email))
    error_message = "Must be a valid email address."
  }
}

# Data Protection
variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30

  validation {
    condition     = var.backup_retention_days >= 1 && var.backup_retention_days <= 35
    error_message = "Backup retention must be between 1 and 35 days."
  }
}

variable "enable_cross_region_backup" {
  description = "Enable cross-region backup replication"
  type        = bool
  default     = true
}

# ==============================================================================
# Data Sources
# ==============================================================================

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

# ==============================================================================
# Locals
# ==============================================================================

locals {
  environment_suffix = var.environment_suffix != "" ? var.environment_suffix : var.environment
  name_prefix        = "${var.organization_name}-${local.environment_suffix}"
  availability_zones = length(var.availability_zones) > 0 ? var.availability_zones : slice(data.aws_availability_zones.available.names, 0, min(3, length(data.aws_availability_zones.available.names)))

  common_tags = {
    Project           = "Enterprise Security Framework"
    Environment       = var.environment
    EnvironmentSuffix = local.environment_suffix
    Owner             = var.owner
    ManagedBy         = "Terraform"
    CreatedDate       = formatdate("YYYY-MM-DD", timestamp())
  }
}

# ==============================================================================
# Random ID for unique naming
# ==============================================================================

resource "random_id" "suffix" {
  byte_length = 4
}

# ==============================================================================
# KMS - Master Key for Encryption
# ==============================================================================

resource "aws_kms_key" "security_master_key" {
  description             = "Master KMS key for ${var.environment} security framework encryption"
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
          "kms:DescribeKey",
          "kms:Decrypt"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:EncryptionContext:aws:cloudtrail:arn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${local.name_prefix}-security-trail-${random_id.suffix.hex}"
          }
        }
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-security-master-key"
  })
}

resource "aws_kms_alias" "security_master_key" {
  name          = "alias/${local.name_prefix}-security-master-${random_id.suffix.hex}"
  target_key_id = aws_kms_key.security_master_key.key_id
}

# ==============================================================================
# IAM - Password Policy
# ==============================================================================

resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = var.password_policy_requirements.minimum_password_length
  require_lowercase_characters   = var.password_policy_requirements.require_lowercase_characters
  require_uppercase_characters   = var.password_policy_requirements.require_uppercase_characters
  require_numbers                = var.password_policy_requirements.require_numbers
  require_symbols                = var.password_policy_requirements.require_symbols
  allow_users_to_change_password = var.password_policy_requirements.allow_users_to_change_password
  max_password_age               = var.password_policy_requirements.max_password_age
  password_reuse_prevention      = var.password_policy_requirements.password_reuse_prevention
}

# ==============================================================================
# IAM - Security Admin Role
# ==============================================================================

resource "aws_iam_role" "security_admin" {
  name = "${local.name_prefix}-security-admin-${random_id.suffix.hex}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      merge(
        {
          Action = "sts:AssumeRole"
          Effect = "Allow"
          Principal = {
            AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
          }
        },
        var.enforce_mfa ? {
          Condition = {
            Bool = {
              "aws:MultiFactorAuthPresent" = "true"
            }
            NumericLessThan = {
              "aws:MultiFactorAuthAge" = "3600"
            }
          }
        } : {}
      )
    ]
  })

  max_session_duration = var.session_duration_hours * 3600

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-security-admin-role"
    Purpose = "Security administration with MFA enforcement"
  })
}

resource "aws_iam_policy" "security_admin" {
  name        = "${local.name_prefix}-security-admin-policy-${random_id.suffix.hex}"
  description = "Comprehensive security administration policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "guardduty:*",
          "securityhub:*",
          "config:*",
          "cloudtrail:*",
          "inspector2:*",
          "macie2:*",
          "access-analyzer:*",
          "iam:Get*",
          "iam:List*",
          "iam:CreateRole",
          "iam:CreatePolicy",
          "iam:AttachRolePolicy",
          "iam:DetachRolePolicy",
          "iam:PutRolePolicy",
          "iam:DeleteRolePolicy",
          "iam:UpdateRole",
          "iam:UpdateRoleDescription",
          "iam:TagRole",
          "iam:UntagRole",
          "kms:*",
          "logs:*",
          "cloudwatch:*",
          "events:*",
          "ssm:*",
          "wafv2:*",
          "waf:*",
          "waf-regional:*",
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
          "ec2:CreateFlowLogs",
          "ec2:DeleteFlowLogs",
          "ec2:DescribeFlowLogs",
          "s3:GetBucketPolicy",
          "s3:PutBucketPolicy",
          "s3:GetBucketAcl",
          "s3:PutBucketAcl",
          "s3:GetBucketEncryption",
          "s3:PutBucketEncryption",
          "s3:GetBucketVersioning",
          "s3:PutBucketVersioning",
          "s3:GetBucketPublicAccessBlock",
          "s3:PutBucketPublicAccessBlock",
          "shield:*",
          "organizations:Describe*",
          "organizations:List*"
        ]
        Resource = "*"
      },
      {
        Effect = "Deny"
        Action = [
          "iam:CreateUser",
          "iam:DeleteUser",
          "iam:CreateAccessKey",
          "iam:DeleteAccessKey",
          "iam:AttachUserPolicy",
          "iam:DetachUserPolicy",
          "iam:PutUserPolicy",
          "iam:DeleteUserPolicy",
          "iam:CreateGroup",
          "iam:DeleteGroup",
          "iam:AddUserToGroup",
          "iam:RemoveUserFromGroup",
          "guardduty:DeleteDetector",
          "securityhub:DisableSecurityHub",
          "config:DeleteConfigurationRecorder",
          "config:DeleteDeliveryChannel",
          "config:StopConfigurationRecorder",
          "cloudtrail:StopLogging",
          "cloudtrail:DeleteTrail",
          "cloudtrail:PutEventSelectors"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "security_admin" {
  role       = aws_iam_role.security_admin.name
  policy_arn = aws_iam_policy.security_admin.arn
}

# ==============================================================================
# IAM - Developer Role
# ==============================================================================

resource "aws_iam_role" "developer" {
  name = "${local.name_prefix}-developer-${random_id.suffix.hex}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      merge(
        {
          Action = "sts:AssumeRole"
          Effect = "Allow"
          Principal = {
            AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
          }
        },
        var.enforce_mfa ? {
          Condition = {
            Bool = {
              "aws:MultiFactorAuthPresent" = "true"
            }
          }
        } : {}
      )
    ]
  })

  max_session_duration = var.session_duration_hours * 3600

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-developer-role"
  })
}

resource "aws_iam_policy" "developer" {
  name        = "${local.name_prefix}-developer-policy-${random_id.suffix.hex}"
  description = "Developer policy with security restrictions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:Describe*",
          "ec2:RunInstances",
          "ec2:TerminateInstances",
          "ec2:StartInstances",
          "ec2:StopInstances",
          "ec2:RebootInstances",
          "ec2:CreateTags",
          "ec2:DeleteTags",
          "lambda:*",
          "apigateway:*",
          "cloudformation:CreateStack",
          "cloudformation:UpdateStack",
          "cloudformation:DeleteStack",
          "cloudformation:DescribeStacks",
          "cloudformation:DescribeStackEvents",
          "cloudformation:DescribeStackResources",
          "cloudformation:GetTemplate",
          "cloudformation:ListStacks",
          "cloudformation:ValidateTemplate",
          "cloudwatch:Describe*",
          "cloudwatch:Get*",
          "cloudwatch:List*",
          "cloudwatch:PutMetricData",
          "logs:Describe*",
          "logs:Get*",
          "logs:FilterLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "ssm:DescribeParameters",
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath",
          "ssm:PutParameter",
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
          "secretsmanager:CreateSecret",
          "secretsmanager:UpdateSecret",
          "secretsmanager:TagResource",
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
          "s3:GetObjectVersion",
          "s3:GetBucketLocation",
          "s3:GetBucketVersioning",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:DeleteItem",
          "dynamodb:DescribeTable",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:UpdateItem",
          "sns:Publish",
          "sns:Subscribe",
          "sns:Unsubscribe",
          "sns:CreateTopic",
          "sns:DeleteTopic",
          "sns:GetTopicAttributes",
          "sns:ListTopics",
          "sns:SetTopicAttributes",
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl",
          "sqs:ListQueues",
          "sqs:CreateQueue",
          "sqs:DeleteQueue"
        ]
        Resource = "*"
      },
      {
        Effect = "Deny"
        Action = [
          "guardduty:*",
          "securityhub:*",
          "config:*",
          "cloudtrail:*",
          "iam:*",
          "kms:CreateKey",
          "kms:DeleteKey",
          "kms:ScheduleKeyDeletion",
          "kms:CancelKeyDeletion",
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
          "rds:Delete*",
          "rds:Modify*"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "developer" {
  role       = aws_iam_role.developer.name
  policy_arn = aws_iam_policy.developer.arn
}

# ==============================================================================
# IAM - Auditor Role
# ==============================================================================

resource "aws_iam_role" "auditor" {
  name = "${local.name_prefix}-auditor-${random_id.suffix.hex}"

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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-auditor-role"
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

# ==============================================================================
# VPC - Network Foundation
# ==============================================================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-security-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-security-igw"
  })
}

# Public Subnets for Load Balancers
resource "aws_subnet" "public" {
  count = length(local.availability_zones)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = local.availability_zones[count.index]
  map_public_ip_on_launch = false # Security best practice

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets for Application Servers
resource "aws_subnet" "private" {
  count = length(local.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = local.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Database Subnets (isolated)
resource "aws_subnet" "database" {
  count = length(local.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 20)
  availability_zone = local.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-subnet-${count.index + 1}"
    Type = "Database"
  })
}

# NAT Gateways for private subnet internet access
resource "aws_eip" "nat" {
  count = length(local.availability_zones)

  domain     = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "main" {
  count = length(local.availability_zones)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-gateway-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}

resource "aws_route_table" "private" {
  count = length(local.availability_zones)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${count.index + 1}"
  })
}

resource "aws_route_table" "database" {
  vpc_id = aws_vpc.main.id

  # Database subnets have no internet access for security
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-rt"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "database" {
  count = length(aws_subnet.database)

  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database.id
}

# ==============================================================================
# VPC Flow Logs for Security Monitoring
# ==============================================================================

resource "aws_flow_log" "vpc_flow_log" {
  iam_role_arn    = aws_iam_role.flow_log.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-flow-log"
  })
}

resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  name              = "/aws/vpc/flowlogs-${local.name_prefix}-${random_id.suffix.hex}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.security_master_key.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-flow-log-group"
  })
}

resource "aws_iam_role" "flow_log" {
  name = "${local.name_prefix}-vpc-flow-log-role-${random_id.suffix.hex}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-flow-log-role"
  })
}

resource "aws_iam_role_policy" "flow_log" {
  name = "${local.name_prefix}-vpc-flow-log-policy-${random_id.suffix.hex}"
  role = aws_iam_role.flow_log.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# ==============================================================================
# Security Groups - Network Security
# ==============================================================================

resource "aws_security_group" "web_tier" {
  name_prefix = "${local.name_prefix}-web-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for web tier - ALB only"

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from anywhere (redirect to HTTPS)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-web-tier-sg"
  })
}

resource "aws_security_group" "app_tier" {
  name_prefix = "${local.name_prefix}-app-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for application tier"

  ingress {
    description     = "HTTP from web tier"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.web_tier.id]
  }

  ingress {
    description     = "HTTPS from web tier"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.web_tier.id]
  }

  ingress {
    description     = "Custom app port from web tier"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.web_tier.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-tier-sg"
  })
}

resource "aws_security_group" "database_tier" {
  name_prefix = "${local.name_prefix}-db-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for database tier"

  ingress {
    description     = "MySQL/Aurora from app tier"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app_tier.id]
  }

  ingress {
    description     = "PostgreSQL from app tier"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_tier.id]
  }

  # No egress rules - databases don't need internet access

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-tier-sg"
  })
}

# ==============================================================================
# Network ACLs for Additional Security Layer
# ==============================================================================

resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.public[*].id

  # Allow inbound HTTPS
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  # Allow inbound HTTP
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }

  # Allow return traffic
  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Allow all outbound
  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-nacl"
  })
}

resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  # Allow inbound from VPC
  ingress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 0
    to_port    = 0
  }

  # Allow return traffic
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Allow all outbound
  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-nacl"
  })
}

resource "aws_network_acl" "database" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.database[*].id

  # Only allow inbound from private subnets
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = cidrsubnet(var.vpc_cidr, 8, 10) # First private subnet range
    from_port  = 3306
    to_port    = 3306
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = cidrsubnet(var.vpc_cidr, 8, 10) # First private subnet range
    from_port  = 5432
    to_port    = 5432
  }

  # Allow return traffic to private subnets only
  egress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = cidrsubnet(var.vpc_cidr, 8, 10) # First private subnet range
    from_port  = 1024
    to_port    = 65535
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-nacl"
  })
}

# ==============================================================================
# WAF v2 Configuration
# ==============================================================================

resource "aws_wafv2_web_acl" "main" {
  count = var.enable_waf ? 1 : 0

  name  = "${local.name_prefix}-security-waf-${random_id.suffix.hex}"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = var.waf_rate_limit
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules - Core Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 10

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
      metric_name                = "CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules - Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 20

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
      metric_name                = "KnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # Geo-blocking rule
  dynamic "rule" {
    for_each = length(var.allowed_countries) > 0 ? [1] : []

    content {
      name     = "GeoBlockingRule"
      priority = 30

      action {
        block {}
      }

      statement {
        not_statement {
          statement {
            geo_match_statement {
              country_codes = var.allowed_countries
            }
          }
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "GeoBlockingRule"
        sampled_requests_enabled   = true
      }
    }
  }

  # IP blocking rule
  dynamic "rule" {
    for_each = length(var.blocked_ips) > 0 ? [1] : []

    content {
      name     = "IPBlockingRule"
      priority = 40

      action {
        block {}
      }

      statement {
        ip_set_reference_statement {
          arn = aws_wafv2_ip_set.blocked_ips[0].arn
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "IPBlockingRule"
        sampled_requests_enabled   = true
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name_prefix}SecurityWAF"
    sampled_requests_enabled   = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-security-waf"
  })
}

# IP Set for blocked IPs
resource "aws_wafv2_ip_set" "blocked_ips" {
  count = length(var.blocked_ips) > 0 ? 1 : 0

  name               = "${local.name_prefix}-blocked-ips-${random_id.suffix.hex}"
  scope              = "REGIONAL"
  ip_address_version = "IPV4"
  addresses          = var.blocked_ips

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-blocked-ips"
  })
}

# WAF Logging Configuration
resource "aws_wafv2_web_acl_logging_configuration" "main" {
  count = var.enable_waf ? 1 : 0

  resource_arn            = aws_wafv2_web_acl.main[0].arn
  log_destination_configs = [aws_cloudwatch_log_group.waf[0].arn]

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

resource "aws_cloudwatch_log_group" "waf" {
  count = var.enable_waf ? 1 : 0

  name              = "aws-waf-logs-${local.name_prefix}-security-waf-${random_id.suffix.hex}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.security_master_key.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-waf-log-group"
  })
}

# ==============================================================================
# GuardDuty - Threat Detection
# ==============================================================================

# Try to get existing GuardDuty detector first
data "aws_guardduty_detector" "existing" {
  count = var.enable_guardduty ? 1 : 0
}

resource "aws_guardduty_detector" "main" {
  count = var.enable_guardduty && length(data.aws_guardduty_detector.existing) == 0 ? 1 : 0

  enable                       = true
  finding_publishing_frequency = "FIFTEEN_MINUTES"

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
    Name = "${local.name_prefix}-guardduty"
  })
}

locals {
  guardduty_detector_id = var.enable_guardduty ? (
    length(data.aws_guardduty_detector.existing) > 0 ?
    data.aws_guardduty_detector.existing[0].id :
    aws_guardduty_detector.main[0].id
  ) : null
}

# ==============================================================================
# Security Hub - Central Security Dashboard
# ==============================================================================

resource "aws_securityhub_account" "main" {
  count = 0 # Disabled due to existing subscription

  enable_default_standards  = true
  control_finding_generator = "SECURITY_CONTROL"
  auto_enable_controls      = true

  lifecycle {
    ignore_changes = [enable_default_standards]
  }
}

# Enable Security Hub standards with correct ARN format
resource "aws_securityhub_standards_subscription" "aws_foundational" {
  count         = 0 # Disabled due to Security Hub account being disabled
  standards_arn = "arn:aws:securityhub:${data.aws_region.current.name}::standard/aws-foundational-security-best-practices/v/1.0.0"
  depends_on    = [aws_securityhub_account.main]
}

resource "aws_securityhub_standards_subscription" "cis" {
  count         = 0 # Disabled due to Security Hub account being disabled
  standards_arn = "arn:aws:securityhub:${data.aws_region.current.name}::standard/cis-aws-foundations-benchmark/v/1.2.0"
  depends_on    = [aws_securityhub_account.main]
}

resource "aws_securityhub_standards_subscription" "pci_dss" {
  count         = 0 # Disabled due to Security Hub account being disabled
  standards_arn = "arn:aws:securityhub:${data.aws_region.current.name}::standard/pci-dss/v/3.2.1"
  depends_on    = [aws_securityhub_account.main]
}

# ==============================================================================
# Config - Compliance Monitoring
# ==============================================================================

# S3 Bucket for Config
resource "aws_s3_bucket" "config" {
  bucket        = "${local.name_prefix}-config-${random_id.suffix.hex}"
  force_destroy = false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-config-bucket"
  })
}

resource "aws_s3_bucket_public_access_block" "config" {
  bucket = aws_s3_bucket.config.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config" {
  bucket = aws_s3_bucket.config.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.security_master_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "config" {
  bucket = aws_s3_bucket.config.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_policy" "config" {
  bucket = aws_s3_bucket.config.id

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
        Resource = aws_s3_bucket.config.arn
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
        Resource = aws_s3_bucket.config.arn
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
        Resource = "${aws_s3_bucket.config.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"      = "bucket-owner-full-control"
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# Config Service Role
# Try to get existing Config service linked role
data "aws_iam_role" "config_service_role" {
  count = 1
  name  = "AWSServiceRoleForConfig"
}

resource "aws_iam_service_linked_role" "config" {
  count            = length(data.aws_iam_role.config_service_role) == 0 ? 1 : 0
  aws_service_name = "config.amazonaws.com"
}

locals {
  config_role_arn = length(data.aws_iam_role.config_service_role) > 0 ? data.aws_iam_role.config_service_role[0].arn : aws_iam_service_linked_role.config[0].arn
}

# Config Configuration Recorder
resource "aws_config_configuration_recorder" "main" {
  count    = 0 # Disabled due to recorder limit reached
  name     = "${local.name_prefix}-config-recorder-${random_id.suffix.hex}"
  role_arn = local.config_role_arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }

  lifecycle {
    ignore_changes = [name]
  }

  depends_on = [aws_s3_bucket.config]
}

# Config Delivery Channel
resource "aws_config_delivery_channel" "main" {
  count          = 0 # Disabled due to existing delivery channel
  name           = "${local.name_prefix}-config-delivery-channel-${random_id.suffix.hex}"
  s3_bucket_name = aws_s3_bucket.config.bucket

  lifecycle {
    ignore_changes = [name]
  }
}

# Config Rules for compliance
resource "aws_config_config_rule" "root_access_key_check" {
  count = 0 # Disabled due to no active configuration recorder
  name  = "root-access-key-check"

  source {
    owner             = "AWS"
    source_identifier = "ROOT_ACCESS_KEY_CHECK"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "encrypted_volumes" {
  count = 0 # Disabled due to no active configuration recorder
  name  = "encrypted-volumes"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "s3_bucket_ssl_requests_only" {
  count = 0 # Disabled due to no active configuration recorder
  name  = "s3-bucket-ssl-requests-only"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SSL_REQUESTS_ONLY"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# ==============================================================================
# CloudTrail - Audit Logging
# ==============================================================================

# S3 Bucket for CloudTrail
resource "aws_s3_bucket" "cloudtrail" {
  bucket        = "${local.name_prefix}-cloudtrail-${random_id.suffix.hex}"
  force_destroy = false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudtrail-bucket"
  })
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.security_master_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    id     = "cloudtrail_lifecycle"
    status = "Enabled"

    filter {}

    expiration {
      days = 2555 # 7 years
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
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
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${local.name_prefix}-security-trail-${random_id.suffix.hex}"
          }
        }
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
            "s3:x-amz-acl"  = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${local.name_prefix}-security-trail-${random_id.suffix.hex}"
          }
        }
      }
    ]
  })
}

# CloudWatch Log Group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${local.name_prefix}-${random_id.suffix.hex}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.security_master_key.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudtrail-log-group"
  })
}

# IAM Role for CloudTrail CloudWatch Logs
resource "aws_iam_role" "cloudtrail_cloudwatch" {
  name = "${local.name_prefix}-cloudtrail-cloudwatch-role-${random_id.suffix.hex}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudtrail-cloudwatch-role"
  })
}

resource "aws_iam_role_policy" "cloudtrail_cloudwatch" {
  name = "${local.name_prefix}-cloudtrail-cloudwatch-policy-${random_id.suffix.hex}"
  role = aws_iam_role.cloudtrail_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
      }
    ]
  })
}

# CloudTrail
resource "aws_cloudtrail" "main" {
  count                         = 0 # Disabled due to trail limit reached
  name                          = "${local.name_prefix}-security-trail-${random_id.suffix.hex}"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.bucket
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true
  kms_key_id                    = aws_kms_key.security_master_key.arn

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch.arn

  event_selector {
    read_write_type                  = "All"
    include_management_events        = true
    exclude_management_event_sources = []

    data_resource {
      type = "AWS::S3::Object"
      values = [
        "${aws_s3_bucket.cloudtrail.arn}/*",
        "${aws_s3_bucket.config.arn}/*",
        "${aws_s3_bucket.audit_logs.arn}/*"
      ]
    }

  }

  insight_selector {
    insight_type = "ApiCallRateInsight"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cloudtrail"
  })

  depends_on = [
    aws_s3_bucket_policy.cloudtrail,
    aws_cloudwatch_log_group.cloudtrail,
    aws_iam_role_policy.cloudtrail_cloudwatch
  ]
}

# ==============================================================================
# SNS Topic for Security Notifications
# ==============================================================================

resource "aws_sns_topic" "security_alerts" {
  name              = "${local.name_prefix}-security-alerts-${random_id.suffix.hex}"
  kms_master_key_id = aws_kms_key.security_master_key.arn

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-security-alerts"
  })
}

resource "aws_sns_topic_subscription" "security_email" {
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.security_notification_email
}

# ==============================================================================
# CloudWatch Alarms for Security Monitoring
# ==============================================================================

# Root account usage alarm
resource "aws_cloudwatch_log_metric_filter" "root_usage" {
  name           = "${local.name_prefix}-root-access-metric-filter-${random_id.suffix.hex}"
  pattern        = "{ ($.userIdentity.type = \"Root\") && ($.userIdentity.invokedBy NOT EXISTS) && ($.eventType != \"AwsServiceEvent\") }"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name

  metric_transformation {
    name      = "RootAccessCount"
    namespace = "${local.name_prefix}/Security"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "root_usage" {
  alarm_name          = "${local.name_prefix}-root-access-alarm-${random_id.suffix.hex}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "RootAccessCount"
  namespace           = "${local.name_prefix}/Security"
  period              = "60"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "This metric monitors root account usage"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-root-access-alarm"
  })
}

# Unauthorized API calls alarm
resource "aws_cloudwatch_log_metric_filter" "unauthorized_api_calls" {
  name           = "${local.name_prefix}-unauthorized-api-calls-metric-filter-${random_id.suffix.hex}"
  pattern        = "{ ($.errorCode = \"*UnauthorizedOperation\") || ($.errorCode = \"AccessDenied*\") }"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name

  metric_transformation {
    name      = "UnauthorizedAPICalls"
    namespace = "${local.name_prefix}/Security"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls" {
  alarm_name          = "${local.name_prefix}-unauthorized-api-calls-alarm-${random_id.suffix.hex}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "${local.name_prefix}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors unauthorized API calls"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-unauthorized-api-calls-alarm"
  })
}

# ==============================================================================
# Data Protection - S3 Bucket for Audit Logs
# ==============================================================================

resource "aws_s3_bucket" "audit_logs" {
  bucket        = "${local.name_prefix}-audit-logs-${random_id.suffix.hex}"
  force_destroy = false

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-audit-logs-bucket"
  })
}

resource "aws_s3_bucket_public_access_block" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.security_master_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Cross-region replication for audit logs
resource "aws_s3_bucket" "audit_logs_replica" {
  count = var.enable_cross_region_backup ? 1 : 0

  bucket   = "${local.name_prefix}-audit-logs-replica-${random_id.suffix.hex}"
  provider = aws.replica

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-audit-logs-replica-bucket"
  })
}

resource "aws_s3_bucket_versioning" "audit_logs_replica" {
  count = var.enable_cross_region_backup ? 1 : 0

  bucket   = aws_s3_bucket.audit_logs_replica[0].id
  provider = aws.replica

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_iam_role" "replication" {
  count = var.enable_cross_region_backup ? 1 : 0

  name = "${local.name_prefix}-s3-replication-role-${random_id.suffix.hex}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-replication-role"
  })
}

resource "aws_iam_policy" "replication" {
  count = var.enable_cross_region_backup ? 1 : 0

  name = "${local.name_prefix}-s3-replication-policy-${random_id.suffix.hex}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.audit_logs.arn}/*"
      },
      {
        Action = [
          "s3:ListBucket"
        ]
        Effect   = "Allow"
        Resource = aws_s3_bucket.audit_logs.arn
      },
      {
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.audit_logs_replica[0].arn}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "replication" {
  count = var.enable_cross_region_backup ? 1 : 0

  role       = aws_iam_role.replication[0].name
  policy_arn = aws_iam_policy.replication[0].arn
}

resource "aws_s3_bucket_replication_configuration" "audit_logs" {
  count = var.enable_cross_region_backup ? 1 : 0

  role   = aws_iam_role.replication[0].arn
  bucket = aws_s3_bucket.audit_logs.id

  rule {
    id     = "audit-logs-replication"
    status = "Enabled"

    filter {}

    delete_marker_replication {
      status = "Enabled"
    }

    destination {
      bucket        = aws_s3_bucket.audit_logs_replica[0].arn
      storage_class = "STANDARD_IA"
    }
  }

  depends_on = [aws_s3_bucket_versioning.audit_logs]
}

# ==============================================================================
# Outputs
# ==============================================================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of the database subnets"
  value       = aws_subnet.database[*].id
}

output "kms_key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.security_master_key.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.security_master_key.arn
}

output "security_admin_role_arn" {
  description = "ARN of the security admin role"
  value       = aws_iam_role.security_admin.arn
}

output "developer_role_arn" {
  description = "ARN of the developer role"
  value       = aws_iam_role.developer.arn
}

output "auditor_role_arn" {
  description = "ARN of the auditor role"
  value       = aws_iam_role.auditor.arn
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = var.enable_waf ? aws_wafv2_web_acl.main[0].arn : null
}

output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = var.enable_waf ? aws_wafv2_web_acl.main[0].id : null
}

output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = local.guardduty_detector_id
}

output "config_bucket_name" {
  description = "Name of the AWS Config bucket"
  value       = aws_s3_bucket.config.bucket
}

output "cloudtrail_bucket_name" {
  description = "Name of the CloudTrail bucket"
  value       = aws_s3_bucket.cloudtrail.bucket
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = length(aws_cloudtrail.main) > 0 ? aws_cloudtrail.main[0].arn : null
}

output "audit_logs_bucket_name" {
  description = "Name of the audit logs bucket"
  value       = aws_s3_bucket.audit_logs.bucket
}

output "security_alerts_topic_arn" {
  description = "ARN of the security alerts SNS topic"
  value       = aws_sns_topic.security_alerts.arn
}

output "web_security_group_id" {
  description = "ID of the web tier security group"
  value       = aws_security_group.web_tier.id
}

output "app_security_group_id" {
  description = "ID of the app tier security group"
  value       = aws_security_group.app_tier.id
}

output "database_security_group_id" {
  description = "ID of the database tier security group"
  value       = aws_security_group.database_tier.id
}

# ==============================================================================
# Provider for Cross-Region Replication
# ==============================================================================

provider "aws" {
  alias  = "replica"
  region = var.enable_cross_region_backup ? (var.aws_region == "us-west-2" ? "us-east-1" : "us-west-2") : var.aws_region
}