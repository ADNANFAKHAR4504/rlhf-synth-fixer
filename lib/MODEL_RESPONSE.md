<<<<<<< HEAD
# Secure AWS Environment - Complete Infrastructure

Below is a comprehensive Terraform configuration that implements all the security requirements in a single file. This configuration follows AWS security best practices and implements advanced security controls.

## tap_stack.tf

```hcl
# =============================================================================
# TERRAFORM CONFIGURATION
# =============================================================================

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }

  # Remote backend configuration - assumes S3 bucket and DynamoDB table exist
  backend "s3" {
    bucket         = "prod-sec-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    kms_key_id     = "alias/prod-sec-terraform-state-key"
    dynamodb_table = "prod-sec-terraform-locks"
  }
}

# =============================================================================
# PROVIDERS
# =============================================================================

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      CreatedBy   = "Security-Team"
    }
  }
}

# =============================================================================
# VARIABLES
# =============================================================================

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "prod-sec"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.100.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "iam_users" {
  description = "List of IAM users to create"
  type = map(object({
    name   = string
    role   = string
    groups = list(string)
  }))
  default = {
    developer = {
      name   = "prod-sec-developer"
      role   = "developer"
      groups = ["developers"]
    }
    admin = {
      name   = "prod-sec-admin"
      role   = "admin"
      groups = ["administrators"]
    }
    auditor = {
      name   = "prod-sec-auditor"
      role   = "auditor"
      groups = ["auditors"]
    }
  }
}

# =============================================================================
# DATA SOURCES
# =============================================================================

data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}

# =============================================================================
# RANDOM RESOURCES
# =============================================================================

resource "random_password" "db_password" {
  length  = 32
  special = true
}

# =============================================================================
# KMS KEY FOR ENCRYPTION
# =============================================================================

resource "aws_kms_key" "main" {
  description             = "Customer managed key for ${var.project_name}"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
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
      },
      {
        Sid    = "Allow Config to use the key"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey*"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-cmk"
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project_name}-cmk"
  target_key_id = aws_kms_key.main.key_id
}

# =============================================================================
# VPC AND NETWORKING
# =============================================================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.availability_zones)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-subnet-${count.index + 1}"
    Type = "Public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${var.project_name}-private-subnet-${count.index + 1}"
    Type = "Private"
  }
}

# Database Subnets
resource "aws_subnet" "database" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 20)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${var.project_name}-database-subnet-${count.index + 1}"
    Type = "Database"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = length(var.availability_zones)

  domain = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = {
    Name = "${var.project_name}-nat-eip-${count.index + 1}"
  }
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = length(var.availability_zones)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "${var.project_name}-nat-gateway-${count.index + 1}"
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
    Name = "${var.project_name}-public-rt"
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
    Name = "${var.project_name}-private-rt-${count.index + 1}"
  }
}

resource "aws_route_table" "database" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-database-rt"
  }
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

# =============================================================================
# SECURITY GROUPS
# =============================================================================

# Web Tier Security Group
resource "aws_security_group" "web" {
  name_prefix = "${var.project_name}-web-"
  description = "Security group for web tier"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
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

  tags = {
    Name = "${var.project_name}-web-sg"
    Tier = "Web"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Application Tier Security Group
resource "aws_security_group" "app" {
  name_prefix = "${var.project_name}-app-"
  description = "Security group for application tier"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from web tier"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  ingress {
    description     = "SSH from bastion"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-app-sg"
    Tier = "Application"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Database Tier Security Group
resource "aws_security_group" "database" {
  name_prefix = "${var.project_name}-db-"
  description = "Security group for database tier"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "MySQL/Aurora from app tier"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-database-sg"
    Tier = "Database"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Bastion Host Security Group
resource "aws_security_group" "bastion" {
  name_prefix = "${var.project_name}-bastion-"
  description = "Security group for bastion host"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH from trusted networks only"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"] # Restrict to corporate network
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-bastion-sg"
    Tier = "Management"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# =============================================================================
# S3 BUCKETS
# =============================================================================

# CloudTrail Logs Bucket
resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket = "${var.project_name}-logs-bucket-${random_id.bucket_suffix.hex}"

  tags = {
    Name    = "${var.project_name}-logs-bucket"
    Purpose = "CloudTrail Logs"
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_versioning" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.main.arn
        sse_algorithm     = "aws:kms"
      }
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

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
        Resource = aws_s3_bucket.cloudtrail_logs.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# Config Bucket
resource "aws_s3_bucket" "config" {
  bucket = "${var.project_name}-config-bucket-${random_id.config_bucket_suffix.hex}"

  tags = {
    Name    = "${var.project_name}-config-bucket"
    Purpose = "AWS Config"
  }
}

resource "random_id" "config_bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_versioning" "config" {
  bucket = aws_s3_bucket.config.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "config" {
  bucket = aws_s3_bucket.config.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.main.arn
        sse_algorithm     = "aws:kms"
      }
    }
  }
}

resource "aws_s3_bucket_public_access_block" "config" {
  bucket = aws_s3_bucket.config.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# =============================================================================
# IAM ROLES AND POLICIES
# =============================================================================

# CloudTrail Service Role
resource "aws_iam_role" "cloudtrail" {
  name = "${var.project_name}-cloudtrail-role"

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

  tags = {
    Name = "${var.project_name}-cloudtrail-role"
  }
}

# Config Service Role
resource "aws_iam_role" "config" {
  name = "${var.project_name}-config-role"

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

  tags = {
    Name = "${var.project_name}-config-role"
  }
}

resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

resource "aws_iam_role_policy" "config_s3" {
  name = "${var.project_name}-config-s3-policy"
  role = aws_iam_role.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.config.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.config.arn}/*"
      }
    ]
  })
}

# IAM Groups
resource "aws_iam_group" "developers" {
  name = "${var.project_name}-developers"
}

resource "aws_iam_group" "administrators" {
  name = "${var.project_name}-administrators"
}

resource "aws_iam_group" "auditors" {
  name = "${var.project_name}-auditors"
}

# IAM Policies
resource "aws_iam_policy" "developer_policy" {
  name        = "${var.project_name}-developer-policy"
  description = "Policy for developers with limited permissions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeImages",
          "ec2:DescribeSnapshots",
          "ec2:DescribeVolumes",
          "s3:ListBucket",
          "s3:GetObject",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:GetLogEvents"
        ]
        Resource = [
          "arn:aws:ec2:${var.aws_region}:${data.aws_caller_identity.current.account_id}:instance/*",
          "arn:aws:s3:::${var.project_name}-*",
          "arn:aws:s3:::${var.project_name}-*/*",
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "admin_policy" {
  name        = "${var.project_name}-admin-policy"
  description = "Policy for administrators with elevated permissions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:*",
          "s3:*",
          "rds:*",
          "logs:*",
          "cloudwatch:*",
          "iam:ListUsers",
          "iam:ListRoles",
          "iam:ListPolicies",
          "iam:GetUser",
          "iam:GetRole",
          "iam:GetPolicy"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = var.aws_region
          }
        }
      },
      {
        Effect = "Deny"
        Action = [
          "iam:CreateUser",
          "iam:DeleteUser",
          "iam:CreateRole",
          "iam:DeleteRole",
          "iam:AttachUserPolicy",
          "iam:DetachUserPolicy",
          "iam:PutUserPolicy",
          "iam:DeleteUserPolicy"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_policy" "auditor_policy" {
  name        = "${var.project_name}-auditor-policy"
  description = "Policy for auditors with read-only permissions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudtrail:DescribeTrails",
          "cloudtrail:GetTrailStatus",
          "cloudtrail:LookupEvents",
          "config:DescribeConfigRules",
          "config:DescribeComplianceByConfigRule",
          "config:GetComplianceDetailsByConfigRule",
          "s3:ListBucket",
          "s3:GetObject",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:GetLogEvents",
          "iam:GenerateServiceLastAccessedDetails",
          "iam:GetServiceLastAccessedDetails",
          "iam:ListUsers",
          "iam:ListRoles",
          "iam:ListPolicies",
          "iam:GetUser",
          "iam:GetRole",
          "iam:GetPolicy"
        ]
        Resource = "*"
      }
    ]
  })
}

# Group Policy Attachments
resource "aws_iam_group_policy_attachment" "developers" {
  group      = aws_iam_group.developers.name
  policy_arn = aws_iam_policy.developer_policy.arn
}

resource "aws_iam_group_policy_attachment" "administrators" {
  group      = aws_iam_group.administrators.name
  policy_arn = aws_iam_policy.admin_policy.arn
}

resource "aws_iam_group_policy_attachment" "auditors" {
  group      = aws_iam_group.auditors.name
  policy_arn = aws_iam_policy.auditor_policy.arn
}

# IAM Users
resource "aws_iam_user" "users" {
  for_each = var.iam_users

  name          = each.value.name
  force_destroy = true

  tags = {
    Name = each.value.name
    Role = each.value.role
  }
}

# User Group Memberships
resource "aws_iam_user_group_membership" "users" {
  for_each = var.iam_users

  user   = aws_iam_user.users[each.key].name
  groups = [for group in each.value.groups : "${var.project_name}-${group}"]

  depends_on = [
    aws_iam_group.developers,
    aws_iam_group.administrators,
    aws_iam_group.auditors
  ]
}

# Access Keys for Users
resource "aws_iam_access_key" "users" {
  for_each = var.iam_users

  user = aws_iam_user.users[each.key].name
}

# Login Profiles for Console Access
resource "aws_iam_user_login_profile" "users" {
  for_each = var.iam_users

  user                    = aws_iam_user.users[each.key].name
  password_reset_required = true
}

# =============================================================================
# SECRETS MANAGER
# =============================================================================

resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${var.project_name}-db-credentials"
  description             = "Database credentials for ${var.project_name}"
  kms_key_id              = aws_kms_key.main.arn
  recovery_window_in_days = 7

  tags = {
    Name = "${var.project_name}-db-credentials"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.db_password.result
  })
}

# =============================================================================
# CLOUDTRAIL
# =============================================================================

resource "aws_cloudtrail" "main" {
  name                          = "${var.project_name}-cloudtrail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail_logs.bucket
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true
  kms_key_id                    = aws_kms_key.main.arn

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }

    data_resource {
      type   = "AWS::Lambda::Function"
      values = ["arn:aws:lambda:*"]
    }
  }

  tags = {
    Name = "${var.project_name}-cloudtrail"
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail_logs]
}

# =============================================================================
# AWS CONFIG
# =============================================================================

resource "aws_config_configuration_recorder" "main" {
  name     = "${var.project_name}-config-recorder"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }

  depends_on = [aws_config_delivery_channel.main]
}

resource "aws_config_delivery_channel" "main" {
  name           = "${var.project_name}-config-delivery-channel"
  s3_bucket_name = aws_s3_bucket.config.bucket
}

# Config Rules
resource "aws_config_config_rule" "s3_bucket_public_read_prohibited" {
  name = "${var.project_name}-s3-bucket-public-read-prohibited"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "s3_bucket_public_write_prohibited" {
  name = "${var.project_name}-s3-bucket-public-write-prohibited"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_WRITE_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "cloudtrail_enabled" {
  name = "${var.project_name}-cloudtrail-enabled"

  source {
    owner             = "AWS"
    source_identifier = "CLOUD_TRAIL_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "kms_key_rotation_enabled" {
  name = "${var.project_name}-cmk-backing-key-rotation-enabled"

  source {
    owner             = "AWS"
    source_identifier = "CMK_BACKING_KEY_ROTATION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "ec2_required_tags" {
  name = "${var.project_name}-ec2-required-tags"

  source {
    owner             = "AWS"
    source_identifier = "REQUIRED_TAGS"
  }

  input_parameters = jsonencode({
    requiredTagKeys = "Project,Environment"
  })

  depends_on = [aws_config_configuration_recorder.main]
}

# =============================================================================
# OUTPUTS
# =============================================================================

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

output "database_subnet_ids" {
  description = "IDs of the database subnets"
  value       = aws_subnet.database[*].id
}

output "kms_key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.main.key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.main.arn
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       =
=======
# Model Response

This is the CDKTF TypeScript implementation that was generated by the AI model:

```typescript
// main.ts
import { Construct } from "constructs";
import { App, TerraformStack, S3Backend, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { NatGateway } from "@cdktf/provider-aws/lib/nat-gateway";
import { Eip } from "@cdktf/provider-aws/lib/eip";
import { RouteTable } from "@cdktf/provider-aws/lib/route-table";
import { Route } from "@cdktf/provider-aws/lib/route";
import { RouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { SecurityGroupRule } from "@cdktf/provider-aws/lib/security-group-rule";
import { KmsKey } from "@cdktf/provider-aws/lib/kms-key";
import { KmsAlias } from "@cdktf/provider-aws/lib/kms-alias";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketEncryption } from "@cdktf/provider-aws/lib/s3-bucket-encryption";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";
import { S3BucketLogging } from "@cdktf/provider-aws/lib/s3-bucket-logging";
import { S3BucketVersioning } from "@cdktf/provider-aws/lib/s3-bucket-versioning";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamPolicy } from "@cdktf/provider-aws/lib/iam-policy";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { IamUser } from "@cdktf/provider-aws/lib/iam-user";
import { IamUserPolicyAttachment } from "@cdktf/provider-aws/lib/iam-user-policy-attachment";
import { IamAccountPasswordPolicy } from "@cdktf/provider-aws/lib/iam-account-password-policy";
import { CloudtrailTrail } from "@cdktf/provider-aws/lib/cloudtrail-trail";
import { ConfigConfigurationRecorder } from "@cdktf/provider-aws/lib/config-configuration-recorder";
import { ConfigDeliveryChannel } from "@cdktf/provider-aws/lib/config-delivery-channel";
import { ConfigConfigRule } from "@cdktf/provider-aws/lib/config-config-rule";
import { GuarddutyDetector } from "@cdktf/provider-aws/lib/guardduty-detector";
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import { CloudwatchMetricAlarm } from "@cdktf/provider-aws/lib/cloudwatch-metric-alarm";
import { SnsTopicSubscription } from "@cdktf/provider-aws/lib/sns-topic-subscription";
import { SnsTopic } from "@cdktf/provider-aws/lib/sns-topic";
import { SecretsmanagerSecret } from "@cdktf/provider-aws/lib/secretsmanager-secret";
import { SsmParameter } from "@cdktf/provider-aws/lib/ssm-parameter";
import { DataAwsAvailabilityZones } from "@cdktf/provider-aws/lib/data-aws-availability-zones";
import { DataAwsCallerIdentity } from "@cdktf/provider-aws/lib/data-aws-caller-identity";

class SecureEnterpriseStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Common tags for all resources
    const commonTags = {
      Environment: "Production",
      Project: "IaC-AWS-Nova",
      ManagedBy: "CDKTF",
      SecurityLevel: "High"
    };

    // AWS Provider
    new AwsProvider(this, "aws", {
      region: "us-east-1",
      defaultTags: [{ tags: commonTags }]
    });

    // Data sources
    const azs = new DataAwsAvailabilityZones(this, "available", {
      state: "available"
    });

    const current = new DataAwsCallerIdentity(this, "current");

    // S3 Backend Configuration (commented out as it should be configured externally)
    new S3Backend(this, {
      bucket: "prod-sec-terraform-state-bucket",
      key: "nova-model/terraform.tfstate",
      region: "us-east-1",
      dynamodbTable: "prod-sec-terraform-locks",
      encrypt: true,
      kmsKeyId: "arn:aws:kms:us-east-1:ACCOUNT-ID:key/KEY-ID"
    });

    // KMS Keys for encryption
    const mainKmsKey = new KmsKey(this, "prod-sec-main-kms-key", {
      description: "Main KMS key for prod-sec environment encryption",
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "Enable IAM User Permissions",
            Effect: "Allow",
            Principal: {
              AWS: `arn:aws:iam::${current.accountId}:root`
            },
            Action: "kms:*",
            Resource: "*"
          },
          {
            Sid: "Allow CloudTrail to encrypt logs",
            Effect: "Allow",
            Principal: {
              Service: "cloudtrail.amazonaws.com"
            },
            Action: [
              "kms:GenerateDataKey*",
              "kms:DescribeKey"
            ],
            Resource: "*"
          }
        ]
      }),
      tags: { ...commonTags, Name: "prod-sec-main-kms-key" }
    });

    new KmsAlias(this, "prod-sec-main-kms-alias", {
      name: "alias/prod-sec-main-key",
      targetKeyId: mainKmsKey.keyId
    });

    // VPC Configuration
    const vpc = new Vpc(this, "prod-sec-vpc", {
      cidrBlock: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...commonTags, Name: "prod-sec-vpc" }
    });

    // Internet Gateway
    const igw = new InternetGateway(this, "prod-sec-igw", {
      vpcId: vpc.id,
      tags: { ...commonTags, Name: "prod-sec-igw" }
    });

    // Public Subnets
    const publicSubnet1 = new Subnet(this, "prod-sec-public-subnet-1", {
      vpcId: vpc.id,
      cidrBlock: "10.0.1.0/24",
      availabilityZone: azs.names[0],
      mapPublicIpOnLaunch: true,
      tags: { ...commonTags, Name: "prod-sec-public-subnet-1", Type: "Public" }
    });

    const publicSubnet2 = new Subnet(this, "prod-sec-public-subnet-2", {
      vpcId: vpc.id,
      cidrBlock: "10.0.2.0/24",
      availabilityZone: azs.names[1],
      mapPublicIpOnLaunch: true,
      tags: { ...commonTags, Name: "prod-sec-public-subnet-2", Type: "Public" }
    });

    // Private Subnets
    const privateSubnet1 = new Subnet(this, "prod-sec-private-subnet-1", {
      vpcId: vpc.id,
      cidrBlock: "10.0.10.0/24",
      availabilityZone: azs.names[0],
      tags: { ...commonTags, Name: "prod-sec-private-subnet-1", Type: "Private" }
    });

    const privateSubnet2 = new Subnet(this, "prod-sec-private-subnet-2", {
      vpcId: vpc.id,
      cidrBlock: "10.0.11.0/24",
      availabilityZone: azs.names[1],
      tags: { ...commonTags, Name: "prod-sec-private-subnet-2", Type: "Private" }
    });

    // Elastic IPs for NAT Gateways
    const eip1 = new Eip(this, "prod-sec-nat-eip-1", {
      domain: "vpc",
      tags: { ...commonTags, Name: "prod-sec-nat-eip-1" }
    });

    const eip2 = new Eip(this, "prod-sec-nat-eip-2", {
      domain: "vpc",
      tags: { ...commonTags, Name: "prod-sec-nat-eip-2" }
    });

    // NAT Gateways
    const natGw1 = new NatGateway(this, "prod-sec-nat-gw-1", {
      allocationId: eip1.id,
      subnetId: publicSubnet1.id,
      tags: { ...commonTags, Name: "prod-sec-nat-gw-1" }
    });

    const natGw2 = new NatGateway(this, "prod-sec-nat-gw-2", {
      allocationId: eip2.id,
      subnetId: publicSubnet2.id,
      tags: { ...commonTags, Name: "prod-sec-nat-gw-2" }
    });

    // Route Tables
    const publicRouteTable = new RouteTable(this, "prod-sec-public-rt", {
      vpcId: vpc.id,
      tags: { ...commonTags, Name: "prod-sec-public-rt" }
    });

    const privateRouteTable1 = new RouteTable(this, "prod-sec-private-rt-1", {
      vpcId: vpc.id,
      tags: { ...commonTags, Name: "prod-sec-private-rt-1" }
    });

    const privateRouteTable2 = new RouteTable(this, "prod-sec-private-rt-2", {
      vpcId: vpc.id,
      tags: { ...commonTags, Name: "prod-sec-private-rt-2" }
    });

    // Routes
    new Route(this, "prod-sec-public-route", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.id
    });

    new Route(this, "prod-sec-private-route-1", {
      routeTableId: privateRouteTable1.id,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: natGw1.id
    });

    new Route(this, "prod-sec-private-route-2", {
      routeTableId: privateRouteTable2.id,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: natGw2.id
    });

    // Route Table Associations
    new RouteTableAssociation(this, "prod-sec-public-rta-1", {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id
    });

    new RouteTableAssociation(this, "prod-sec-public-rta-2", {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id
    });

    new RouteTableAssociation(this, "prod-sec-private-rta-1", {
      subnetId: privateSubnet1.id,
      routeTableId: privateRouteTable1.id
    });

    new RouteTableAssociation(this, "prod-sec-private-rta-2", {
      subnetId: privateSubnet2.id,
      routeTableId: privateRouteTable2.id
    });

    // Security Groups
    const webSecurityGroup = new SecurityGroup(this, "prod-sec-web-sg", {
      name: "prod-sec-web-sg",
      description: "Security group for web tier",
      vpcId: vpc.id,
      tags: { ...commonTags, Name: "prod-sec-web-sg", Tier: "Web" }
    });

    const appSecurityGroup = new SecurityGroup(this, "prod-sec-app-sg", {
      name: "prod-sec-app-sg",
      description: "Security group for application tier",
      vpcId: vpc.id,
      tags: { ...commonTags, Name: "prod-sec-app-sg", Tier: "Application" }
    });

    const dbSecurityGroup = new SecurityGroup(this, "prod-sec-db-sg", {
      name: "prod-sec-db-sg",
      description: "Security group for database tier",
      vpcId: vpc.id,
      tags: { ...commonTags, Name: "prod-sec-db-sg", Tier: "Database" }
    });

    // Security Group Rules - Web Tier
    new SecurityGroupRule(this, "prod-sec-web-ingress-https", {
      type: "ingress",
      fromPort: 443,
      toPort: 443,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: webSecurityGroup.id,
      description: "HTTPS inbound"
    });

    new SecurityGroupRule(this, "prod-sec-web-ingress-http", {
      type: "ingress",
      fromPort: 80,
      toPort: 80,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: webSecurityGroup.id,
      description: "HTTP inbound (redirect to HTTPS)"
    });

    new SecurityGroupRule(this, "prod-sec-web-egress-app", {
      type: "egress",
      fromPort: 8080,
      toPort: 8080,
      protocol: "tcp",
      sourceSecurityGroupId: appSecurityGroup.id,
      securityGroupId: webSecurityGroup.id,
      description: "To application tier"
    });

    // Security Group Rules - App Tier
    new SecurityGroupRule(this, "prod-sec-app-ingress-web", {
      type: "ingress",
      fromPort: 8080,
      toPort: 8080,
      protocol: "tcp",
      sourceSecurityGroupId: webSecurityGroup.id,
      securityGroupId: appSecurityGroup.id,
      description: "From web tier"
    });

    new SecurityGroupRule(this, "prod-sec-app-egress-db", {
      type: "egress",
      fromPort: 5432,
      toPort: 5432,
      protocol: "tcp",
      sourceSecurityGroupId: dbSecurityGroup.id,
      securityGroupId: appSecurityGroup.id,
      description: "To database tier"
    });

    new SecurityGroupRule(this, "prod-sec-app-egress-https", {
      type: "egress",
      fromPort: 443,
      toPort: 443,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: appSecurityGroup.id,
      description: "HTTPS outbound for API calls"
    });

    // Security Group Rules - DB Tier
    new SecurityGroupRule(this, "prod-sec-db-ingress-app", {
      type: "ingress",
      fromPort: 5432,
      toPort: 5432,
      protocol: "tcp",
      sourceSecurityGroupId: appSecurityGroup.id,
      securityGroupId: dbSecurityGroup.id,
      description: "From application tier"
    });

    // S3 Buckets with security configurations
    const logsBucket = new S3Bucket(this, "prod-sec-logs-bucket", {
      bucket: `prod-sec-logs-${current.accountId}`,
      tags: { ...commonTags, Name: "prod-sec-logs-bucket", Purpose: "Logging" }
    });

    new S3BucketEncryption(this, "prod-sec-logs-bucket-encryption", {
      bucket: logsBucket.id,
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            kmsKeyId: mainKmsKey.arn,
            sseAlgorithm: "aws:kms"
          },
          bucketKeyEnabled: true
        }
      }
    });

    new S3BucketPublicAccessBlock(this, "prod-sec-logs-bucket-pab", {
      bucket: logsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true
    });

    new S3BucketVersioning(this, "prod-sec-logs-bucket-versioning", {
      bucket: logsBucket.id,
      versioningConfiguration: {
        status: "Enabled"
      }
    });

    const appDataBucket = new S3Bucket(this, "prod-sec-app-data-bucket", {
      bucket: `prod-sec-app-data-${current.accountId}`,
      tags: { ...commonTags, Name: "prod-sec-app-data-bucket", Purpose: "Application Data" }
    });

    new S3BucketEncryption(this, "prod-sec-app-data-bucket-encryption", {
      bucket: appDataBucket.id,
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            kmsKeyId: mainKmsKey.arn,
            sseAlgorithm: "aws:kms"
          },
          bucketKeyEnabled: true
        }
      }
    });

    new S3BucketPublicAccessBlock(this, "prod-sec-app-data-bucket-pab", {
      bucket: appDataBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true
    });

    new S3BucketVersioning(this, "prod-sec-app-data-bucket-versioning", {
      bucket: appDataBucket.id,
      versioningConfiguration: {
        status: "Enabled"
      }
    });

    new S3BucketLogging(this, "prod-sec-app-data-bucket-logging", {
      bucket: appDataBucket.id,
      targetBucket: logsBucket.id,
      targetPrefix: "s3-access-logs/"
    });

    // IAM Password Policy
    new IamAccountPasswordPolicy(this, "prod-sec-password-policy", {
      minimumPasswordLength: 14,
      requireLowercaseCharacters: true,
      requireNumbers: true,
      requireSymbols: true,
      requireUppercaseCharacters: true,
      allowUsersToChangePassword: true,
      maxPasswordAge: 90,
      passwordReusePrevention: 12,
      hardExpiry: false
    });

    // IAM Policies
    const ec2ReadOnlyPolicy = new IamPolicy(this, "prod-sec-ec2-readonly-policy", {
      name: "prod-sec-ec2-readonly-policy",
      description: "Read-only access to EC2 resources",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "ec2:Describe*",
              "ec2:Get*",
              "ec2:List*"
            ],
            Resource: "*"
          }
        ]
      }),
      tags: commonTags
    });

    const s3AppDataPolicy = new IamPolicy(this, "prod-sec-s3-app-data-policy", {
      name: "prod-sec-s3-app-data-policy",
      description: "Access to application data S3 bucket",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "s3:GetObject",
              "s3:PutObject",
              "s3:DeleteObject"
            ],
            Resource: `${appDataBucket.arn}/*`
          },
          {
            Effect: "Allow",
            Action: [
              "s3:ListBucket"
            ],
            Resource: appDataBucket.arn
          },
          {
            Effect: "Allow",
            Action: [
              "kms:Decrypt",
              "kms:GenerateDataKey"
            ],
            Resource: mainKmsKey.arn
          }
        ]
      }),
      tags: commonTags
    });

    // IAM Roles
    const appRole = new IamRole(this, "prod-sec-app-role", {
      name: "prod-sec-app-role",
      description: "Role for application instances",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "ec2.amazonaws.com"
            }
          }
        ]
      }),
      tags: commonTags
    });

    new IamRolePolicyAttachment(this, "prod-sec-app-role-s3-policy", {
      role: appRole.name,
      policyArn: s3AppDataPolicy.arn
    });

    // IAM Users with least privilege
    const devUser = new IamUser(this, "prod-sec-dev-user", {
      name: "prod-sec-dev-user",
      path: "/developers/",
      tags: { ...commonTags, UserType: "Developer" }
    });

    const opsUser = new IamUser(this, "prod-sec-ops-user", {
      name: "prod-sec-ops-user",
      path: "/operations/",
      tags: { ...commonTags, UserType: "Operations" }
    });

    new IamUserPolicyAttachment(this, "prod-sec-dev-user-ec2-readonly", {
      user: devUser.name,
      policyArn: ec2ReadOnlyPolicy.arn
    });

    // Secrets Manager
    const dbSecret = new SecretsmanagerSecret(this, "prod-sec-db-credentials", {
      name: "prod-sec/database/credentials",
      description: "Database credentials for prod-sec environment",
      kmsKeyId: mainKmsKey.arn,
      tags: commonTags
    });

    // SSM Parameters
    new SsmParameter(this, "prod-sec-app-config", {
      name: "/prod-sec/app/config",
      type: "SecureString",
      value: JSON.stringify({
        environment: "production",
        debug: false,
        logLevel: "INFO"
      }),
      keyId: mainKmsKey.arn,
      description: "Application configuration parameters",
      tags: commonTags
    });

    // CloudWatch Log Groups
    const appLogGroup = new CloudwatchLogGroup(this, "prod-sec-app-logs", {
      name: "/aws/ec2/prod-sec-app",
      retentionInDays: 90,
      kmsKeyId: mainKmsKey.arn,
      tags: commonTags
    });

    const vpcFlowLogGroup = new CloudwatchLogGroup(this, "prod-sec-vpc-flow-logs", {
      name: "/aws/vpc/prod-sec-flowlogs",
      retentionInDays: 30,
      kmsKeyId: mainKmsKey.arn,
      tags: commonTags
    });

    // SNS Topic for alerts
    const alertsTopic = new SnsTopic(this, "prod-sec-security-alerts", {
      name: "prod-sec-security-alerts",
      kmsKeyId: mainKmsKey.arn,
      tags: commonTags
    });

    // CloudWatch Alarms
    new CloudwatchMetricAlarm(this, "prod-sec-root-access-alarm", {
      alarmName: "prod-sec-root-access-alarm",
      comparisonOperator: "GreaterThanOrEqualToThreshold",
      evaluationPeriods: 1,
      metricName: "RootAccessCount",
      namespace: "CWLogs",
      period: 300,
      statistic: "Sum",
      threshold: 1,
      alarmDescription: "Alert when root user access is detected",
      alarmActions: [alertsTopic.arn],
      tags: commonTags
    });

    new CloudwatchMetricAlarm(this, "prod-sec-unauthorized-api-calls", {
      alarmName: "prod-sec-unauthorized-api-calls",
      comparisonOperator: "GreaterThanOrEqualToThreshold",
      evaluationPeriods: 1,
      metricName: "UnauthorizedAPICalls",
      namespace: "CWLogs",
      period: 300,
      statistic: "Sum",
      threshold: 5,
      alarmDescription: "Alert on unauthorized API calls",
      alarmActions: [alertsTopic.arn],
      tags: commonTags
    });

    // CloudTrail
    const cloudtrail = new CloudtrailTrail(this, "prod-sec-cloudtrail", {
      name: "prod-sec-cloudtrail",
      s3BucketName: logsBucket.id,
      s3KeyPrefix: "cloudtrail-logs/",
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableLogging: true,
      enableLogFileValidation: true,
      kmsKeyId: mainKmsKey.arn,
      cloudWatchLogsGroupArn: `${appLogGroup.arn}:*`,
      eventSelector: [
        {
          readWriteType: "All",
          includeManagementEvents: true,
          dataResource: [
            {
              type: "AWS::S3::Object",
              values: [`${appDataBucket.arn}/*`]
            }
          ]
        }
      ],
      tags: commonTags
    });

    // AWS Config
    const configRole = new IamRole(this, "prod-sec-config-role", {
      name: "prod-sec-config-role",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "config.amazonaws.com"
            }
          }
        ]
      }),
      managedPolicyArns: ["arn:aws:iam::aws:policy/service-role/ConfigRole"],
      tags: commonTags
    });

    const configBucketPolicy = new IamPolicy(this, "prod-sec-config-bucket-policy", {
      name: "prod-sec-config-bucket-policy",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "s3:GetBucketAcl",
              "s3:ListBucket"
            ],
            Resource: logsBucket.arn
          },
          {
            Effect: "Allow",
            Action: "s3:PutObject",
            Resource: `${logsBucket.arn}/config-logs/*`,
            Condition: {
              StringEquals: {
                "s3:x-amz-acl": "bucket-owner-full-control"
              }
            }
          }
        ]
      })
    });

    new IamRolePolicyAttachment(this, "prod-sec-config-role-bucket-policy", {
      role: configRole.name,
      policyArn: configBucketPolicy.arn
    });

    const configRecorder = new ConfigConfigurationRecorder(this, "prod-sec-config-recorder", {
      name: "prod-sec-config-recorder",
      roleArn: configRole.arn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true
      }
    });

    const configDeliveryChannel = new ConfigDeliveryChannel(this, "prod-sec-config-delivery-channel", {
      name: "prod-sec-config-delivery-channel",
      s3BucketName: logsBucket.id,
      s3KeyPrefix: "config-logs/"
    });

    // Config Rules
    new ConfigConfigRule(this, "prod-sec-s3-bucket-public-access-prohibited", {
      name: "s3-bucket-public-access-prohibited",
      source: {
        owner: "AWS",
        sourceIdentifier: "S3_BUCKET_PUBLIC_ACCESS_PROHIBITED"
      },
      dependsOn: [configRecorder]
    });

    new ConfigConfigRule(this, "prod-sec-encrypted-volumes", {
      name: "encrypted-volumes",
      source: {
        owner: "AWS",
        sourceIdentifier: "ENCRYPTED_VOLUMES"
      },
      dependsOn: [configRecorder]
    });

    new ConfigConfigRule(this, "prod-sec-iam-password-policy", {
      name: "iam-password-policy",
      source: {
        owner: "AWS",
        sourceIdentifier: "IAM_PASSWORD_POLICY"
      },
      inputParameters: JSON.stringify({
        RequireUppercaseCharacters: "true",
        RequireLowercaseCharacters: "true",
        RequireSymbols: "true",
        RequireNumbers: "true",
        MinimumPasswordLength: "14"
      }),
      dependsOn: [configRecorder]
    });

    // GuardDuty
    new GuarddutyDetector(this, "prod-sec-guardduty", {
      enable: true,
      findingPublishingFrequency: "FIFTEEN_MINUTES",
      tags: commonTags
    });

    // Outputs
    new TerraformOutput(this, "vpc_id", {
      value: vpc.id,
      description: "VPC ID"
    });

    new TerraformOutput(this, "public_subnet_ids", {
      value: [publicSubnet1.id, publicSubnet2.id],
      description: "Public subnet IDs"
    });

    new TerraformOutput(this, "private_subnet_ids", {
      value: [privateSubnet1.id, privateSubnet2.id],
      description: "Private subnet IDs"
    });

    new TerraformOutput(this, "kms_key_id", {
      value: mainKmsKey.keyId,
      description: "Main KMS key ID"
    });

    new TerraformOutput(this, "security_group_ids", {
      value: {
        web: webSecurityGroup.id,
        app: appSecurityGroup.id,
        db: dbSecurityGroup.id
      },
      description: "Security group IDs by tier"
    });
  }
}

// Bootstrap the application
const app = new App();
new SecureEnterpriseStack(app, "prod-sec");
app.synth();
```
>>>>>>> 043468c0d4b28b69cdfe06caec11670886894d9d
