```hcl - main.tf

########################
# Variables
########################
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}

variable "bucket_region" {
  description = "Region for the S3 bucket"
  type        = string
  default     = "us-west-2"
}

variable "bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
  default     = "devs3-bucket"
}

variable "bucket_tags" {
  description = "Tags to apply to the S3 bucket"
  type        = map(string)
  default = {
    Project     = "ExampleProject"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "organization_name" {
  description = "Organization name"
  type        = string
  default     = "financialservices"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed for management access"
  type        = list(string)
  default     = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
}

variable "enable_cloudtrail" {
  description = "Whether to create CloudTrail trail"
  type        = bool
  default     = false
}

########################
# Data Sources
########################

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

########################
# VPC Configuration
########################

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.environment}-${var.organization_name}-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.environment}-${var.organization_name}-igw"
  }
}

# Subnets
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "${var.environment}-${var.organization_name}-public-subnet-${count.index + 1}"
    Type = "Public"
  }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.environment}-${var.organization_name}-private-subnet-${count.index + 1}"
    Type = "Private"
  }
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.environment}-${var.organization_name}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

########################
# KMS Key for encryption
########################

resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.environment} environment encryption"
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
      },
      {
        Sid    = "Allow S3 service to use the key"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "${var.environment}-${var.organization_name}-kms-key"
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.environment}-${var.organization_name}-key"
  target_key_id = aws_kms_key.main.key_id
}

########################
# S3 Buckets
########################

# Random strings for bucket suffixes
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "random_string" "app_bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "dev${var.organization_name}ct${random_string.bucket_suffix.result}"

  tags = {
    Name    = "${var.environment}-${var.organization_name}-cloudtrail-logs"
    Purpose = "CloudTrail Logs"
  }
}

# S3 bucket versioning for CloudTrail
resource "aws_s3_bucket_versioning" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket server-side encryption for CloudTrail
resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 bucket public access block for CloudTrail
resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket policy for CloudTrail
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
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/*"
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
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/*"
          }
        }
      },
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.cloudtrail.arn,
          "${aws_s3_bucket.cloudtrail.arn}/*"
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

# Application data bucket
resource "aws_s3_bucket" "app_data" {
  bucket = "dev${var.organization_name}app${random_string.app_bucket_suffix.result}"

  tags = {
    Name    = "${var.environment}-${var.organization_name}-app-data"
    Purpose = "Application Data"
  }
}

# App data bucket versioning
resource "aws_s3_bucket_versioning" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

# App data bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# App data bucket public access block
resource "aws_s3_bucket_public_access_block" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Main S3 Bucket with Lifecycle Management
resource "aws_s3_bucket" "this" {
  bucket = "${var.bucket_name}-${var.environment_suffix}-${random_string.bucket_suffix.result}"
  tags   = var.bucket_tags
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket                  = aws_s3_bucket.this.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Lifecycle rule to handle versioned objects during deletion
resource "aws_s3_bucket_lifecycle_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    id     = "cleanup-versions"
    status = "Enabled"

    # Apply to all objects
    filter {
      prefix = ""
    }

    # Noncurrent version transition to Glacier after 30 days
    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "GLACIER"
    }

    # Noncurrent version expiration - delete old versions after 90 days
    noncurrent_version_expiration {
      noncurrent_days = 90
    }

    # Abort incomplete multipart uploads after 1 day
    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

# Bucket policy to allow deletion
resource "aws_s3_bucket_policy" "this" {
  bucket = aws_s3_bucket.this.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowTerraformDeletion"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = [
          "s3:DeleteObject",
          "s3:DeleteObjectVersion",
          "s3:ListBucketVersions"
        ]
        Resource = [
          aws_s3_bucket.this.arn,
          "${aws_s3_bucket.this.arn}/*"
        ]
      }
    ]
  })
}

########################
# IAM Resources
########################

# IAM Password Policy
resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = 14
  require_lowercase_characters   = true
  require_numbers                = true
  require_uppercase_characters   = true
  require_symbols                = true
  allow_users_to_change_password = true
  max_password_age               = 90
  password_reuse_prevention      = 12
  hard_expiry                    = true
}

# IAM Role for EC2 instances (least privilege)
resource "aws_iam_role" "ec2_role" {
  name = "${var.environment}-${var.organization_name}-ec2-role"

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
}

# IAM Policy for EC2 role (minimal permissions)
resource "aws_iam_role_policy" "ec2_policy" {
  name = "${var.environment}-${var.organization_name}-ec2-policy"
  role = aws_iam_role.ec2_role.id

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
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.environment}-${var.organization_name}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

# CloudTrail Service Role
resource "aws_iam_role" "cloudtrail_role" {
  name = "${var.environment}-${var.organization_name}-cloudtrail-role"

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
}

# Example IAM User with MFA enforcement
resource "aws_iam_user" "example_user" {
  name = "${var.environment}-${var.organization_name}-user"
  path = "/"
}

# IAM Policy to enforce MFA
resource "aws_iam_user_policy" "mfa_policy" {
  name = "${var.environment}-${var.organization_name}-mfa-policy"
  user = aws_iam_user.example_user.name

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
          "iam:EnableMFADevice",
          "iam:ListMFADevices",
          "iam:ResyncMFADevice"
        ]
        Resource = [
          "arn:aws:iam::*:mfa/$${aws:username}",
          "arn:aws:iam::*:user/$${aws:username}"
        ]
      },
      {
        Sid    = "DenyAllExceptUnlessMFAAuthenticated"
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

########################
# Security Groups
########################

# Web tier security group (only allows 80 and 443 from anywhere)
resource "aws_security_group" "web" {
  name_prefix = "${var.environment}-${var.organization_name}-web-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for web tier - allows HTTP/HTTPS"

  # HTTP access from anywhere
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS access from anywhere
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound traffic
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-${var.organization_name}-web-sg"
    Tier = "Web"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Application tier security group (restricted access)
resource "aws_security_group" "app" {
  name_prefix = "${var.environment}-${var.organization_name}-app-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for application tier"

  # Access from web tier only
  ingress {
    description     = "App port from web tier"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  # SSH access from allowed CIDR blocks only
  ingress {
    description = "SSH from allowed networks"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-${var.organization_name}-app-sg"
    Tier = "Application"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Database tier security group (most restrictive)
resource "aws_security_group" "db" {
  name_prefix = "${var.environment}-${var.organization_name}-db-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for database tier"

  # Database access from app tier only
  ingress {
    description     = "MySQL/Aurora from app tier"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  # PostgreSQL access from app tier only
  ingress {
    description     = "PostgreSQL from app tier"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  # No outbound rules for maximum security
  tags = {
    Name = "${var.environment}-${var.organization_name}-db-sg"
    Tier = "Database"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Management security group for administrative access
resource "aws_security_group" "mgmt" {
  name_prefix = "${var.environment}-${var.organization_name}-mgmt-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for management access"

  # SSH access from allowed CIDR blocks only
  ingress {
    description = "SSH from allowed networks"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  # RDP access from allowed CIDR blocks only
  ingress {
    description = "RDP from allowed networks"
    from_port   = 3389
    to_port     = 3389
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-${var.organization_name}-mgmt-sg"
    Tier = "Management"
  }

  lifecycle {
    create_before_destroy = true
  }
}

########################
# CloudTrail
########################

# CloudTrail for logging all API calls
resource "aws_cloudtrail" "main" {
  count          = var.enable_cloudtrail ? 1 : 0
  name           = "${var.environment}-${var.organization_name}-cloudtrail"
  s3_bucket_name = aws_s3_bucket.cloudtrail.bucket

  event_selector {
    read_write_type                  = "All"
    include_management_events        = true
    exclude_management_event_sources = []
  }

  # Enable encryption using KMS
  kms_key_id = aws_kms_key.main.arn

  # Enable log file validation
  enable_log_file_validation = true

  # Enable logging
  enable_logging = true

  # Include global service events
  include_global_service_events = true

  # Multi-region trail
  is_multi_region_trail = true

  # Organization trail (if using AWS Organizations)
  is_organization_trail = false

  tags = {
    Name        = "${var.environment}-${var.organization_name}-cloudtrail"
    Environment = var.environment
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail]
}

# CloudWatch Log Group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${var.environment}-${var.organization_name}"
  retention_in_days = 90

  tags = {
    Name        = "${var.environment}-${var.organization_name}-cloudtrail-logs"
    Environment = var.environment
  }
}

# IAM role for CloudTrail to write to CloudWatch Logs
resource "aws_iam_role" "cloudtrail_logs_role" {
  name = "${var.environment}-${var.organization_name}-cloudtrail-logs-role"

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
}

# IAM policy for CloudTrail to write to CloudWatch Logs
resource "aws_iam_role_policy" "cloudtrail_logs_policy" {
  name = "${var.environment}-${var.organization_name}-cloudtrail-logs-policy"
  role = aws_iam_role.cloudtrail_logs_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]

        Resource = [
          "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/cloudtrail/${var.environment}-${var.organization_name}:*"
        ]
      }
    ]
  })
}

########################
# Local Values
########################

locals {
  bucket_name = aws_s3_bucket.this.bucket
  bucket_arn  = aws_s3_bucket.this.arn
}

########################
# Outputs
########################

# Main S3 Bucket Outputs
output "bucket_name" {
  description = "Name of the created S3 bucket"
  value       = aws_s3_bucket.this.bucket
}

output "bucket_arn" {
  description = "ARN of the created S3 bucket"
  value       = aws_s3_bucket.this.arn
}

output "bucket_tags" {
  description = "Tags applied to the S3 bucket"
  value       = aws_s3_bucket.this.tags
}

output "bucket_region" {
  description = "Region where the S3 bucket is located"
  value       = aws_s3_bucket.this.region
}

output "bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.this.bucket_domain_name
}

output "bucket_regional_domain_name" {
  description = "Regional domain name of the S3 bucket"
  value       = aws_s3_bucket.this.bucket_regional_domain_name
}

# KMS Outputs
output "kms_key_id" {
  description = "KMS key ID"
  value       = aws_kms_key.main.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN"
  value       = aws_kms_key.main.arn
}

output "kms_alias_arn" {
  description = "KMS key alias ARN"
  value       = aws_kms_alias.main.arn
}

# S3 CloudTrail Outputs
output "cloudtrail_bucket_name" {
  description = "CloudTrail S3 bucket name"
  value       = aws_s3_bucket.cloudtrail.bucket
}

output "cloudtrail_bucket_arn" {
  description = "CloudTrail S3 bucket ARN"
  value       = aws_s3_bucket.cloudtrail.arn
}

output "app_data_bucket_name" {
  description = "Application data S3 bucket name"
  value       = aws_s3_bucket.app_data.bucket
}

output "app_data_bucket_arn" {
  description = "Application data S3 bucket ARN"
  value       = aws_s3_bucket.app_data.arn
}

# VPC Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

# Security Group Outputs
output "web_security_group_id" {
  description = "Web tier security group ID"
  value       = aws_security_group.web.id
}

output "app_security_group_id" {
  description = "Application tier security group ID"
  value       = aws_security_group.app.id
}

output "db_security_group_id" {
  description = "Database tier security group ID"
  value       = aws_security_group.db.id
}

output "mgmt_security_group_id" {
  description = "Management security group ID"
  value       = aws_security_group.mgmt.id
}

# CloudTrail Outputs
output "cloudtrail_name" {
  description = "CloudTrail name"
  value       = var.enable_cloudtrail ? aws_cloudtrail.main[0].name : null
}

output "cloudtrail_arn" {
  description = "CloudTrail ARN"
  value       = var.enable_cloudtrail ? aws_cloudtrail.main[0].arn : null
}

# Internet Gateway Output
output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = aws_internet_gateway.main.id
}

# IAM Role Outputs
output "ec2_role_arn" {
  description = "EC2 role ARN"
  value       = aws_iam_role.ec2_role.arn
}

output "cloudtrail_role_arn" {
  description = "CloudTrail role ARN"
  value       = aws_iam_role.cloudtrail_role.arn
}

output "cloudtrail_logs_role_arn" {
  description = "CloudTrail logs role ARN"
  value       = aws_iam_role.cloudtrail_logs_role.arn
}

# CloudWatch Log Group Outputs
output "cloudwatch_log_group_name" {
  description = "CloudWatch log group name"
  value       = aws_cloudwatch_log_group.cloudtrail.name
}

output "cloudwatch_log_group_arn" {
  description = "CloudWatch log group ARN"
  value       = aws_cloudwatch_log_group.cloudtrail.arn
}

# Account and Region Outputs
output "account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "region" {
  description = "AWS Region"
  value       = data.aws_region.current.name
}

output "caller_arn" {
  description = "Caller ARN"
  value       = data.aws_caller_identity.current.arn
}

# VPC ARN Output
output "vpc_arn" {
  description = "VPC ARN"
  value       = aws_vpc.main.arn
}

# Infrastructure Summary Output
output "infrastructure_summary" {
  description = "Infrastructure summary as JSON"
  value = jsonencode({
    encryption = {
      kms_key_arn = aws_kms_key.main.arn
      kms_key_id  = aws_kms_key.main.key_id
    }
    monitoring = {
      cloudtrail_name = var.enable_cloudtrail ? aws_cloudtrail.main[0].name : null
      log_group_name  = aws_cloudwatch_log_group.cloudtrail.name
      log_group_arn   = aws_cloudwatch_log_group.cloudtrail.arn
    }
    security_groups = {
      web  = aws_security_group.web.id
      app  = aws_security_group.app.id
      db   = aws_security_group.db.id
      mgmt = aws_security_group.mgmt.id
    }
    storage = {
      app_data_bucket   = aws_s3_bucket.app_data.bucket
      cloudtrail_bucket = aws_s3_bucket.cloudtrail.bucket
      main_bucket       = aws_s3_bucket.this.bucket
    }
    vpc = {
      id   = aws_vpc.main.id
      cidr = aws_vpc.main.cidr_block
    }
    networking = {
      public_subnets   = aws_subnet.public[*].id
      private_subnets  = aws_subnet.private[*].id
      internet_gateway = aws_internet_gateway.main.id
    }
    subnets = {
      private_count = length(aws_subnet.private)
      public_count  = length(aws_subnet.public)
    }
  })
}

########################
# Null Resource for Cleanup (Optional)
########################

# This null resource can be used to trigger cleanup operations
resource "null_resource" "s3_cleanup" {
  triggers = {
    bucket_name = aws_s3_bucket.this.bucket
  }

  provisioner "local-exec" {
    when    = destroy
    command = <<-EOT
      echo "Cleaning up S3 bucket: ${self.triggers.bucket_name}"
      
      # Check if bucket exists
      if aws s3 ls "s3://${self.triggers.bucket_name}" 2>/dev/null; then
        echo "Found bucket, cleaning up versions and objects..."
        
        # Delete all versions and delete markers
        aws s3api list-object-versions \
          --bucket "${self.triggers.bucket_name}" \
          --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}' \
          --output json | \
          jq -r '.Objects | if length > 0 then . else [] end' | \
          aws s3api delete-objects --bucket "${self.triggers.bucket_name}" --delete file:///dev/stdin 2>/dev/null || true
        
        # Delete all delete markers
        aws s3api list-object-versions \
          --bucket "${self.triggers.bucket_name}" \
          --query '{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}' \
          --output json | \
          jq -r '.Objects | if length > 0 then . else [] end' | \
          aws s3api delete-objects --bucket "${self.triggers.bucket_name}" --delete file:///dev/stdin 2>/dev/null || true
        
        # Delete all objects (non-versioned)
        aws s3 rm "s3://${self.triggers.bucket_name}" --recursive 2>/dev/null || true
        
        echo "S3 bucket cleanup completed"
      else
        echo "Bucket does not exist or is already deleted"
      fi
    EOT
  }
}


```

```hcl - provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    null = {
      source  = "hashicorp/null"
      version = ">= 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.0"
    }
  }

  # Backend configuration - will be configured via backend.conf file
  /**
    TF_INIT_OPTS="-backend-config=backend.conf" npm run tf:init
  */
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}

# Null provider for cleanup operations
provider "null" {}

# Random provider for generating unique names
provider "random" {}


```