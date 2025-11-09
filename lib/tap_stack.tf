# main.tf - Secure AWS Environment with Best Practices

# Variables for parameterization
variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "trusted_ssh_cidr" {
  description = "Trusted CIDR block for SSH access"
  type        = string
  default     = "10.0.0.0/16" # Update with your trusted IP range
}

variable "environment" {
  description = "Environment name for tagging"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "secure-aws-infrastructure"
}

variable "rds_username" {
  description = "RDS master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

# Data sources for current account and caller identity
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Common tags to be applied to all resources
locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
    CreatedOn   = timestamp()
  }
}

# KMS key for encryption across all services
resource "aws_kms_key" "main_encryption_key" {
  description             = "KMS key for encrypting AWS resources"
  enable_key_rotation     = true # Security best practice: enable automatic key rotation
  deletion_window_in_days = 10

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-main-kms-key"
  })
}

resource "aws_kms_alias" "main_encryption_key_alias" {
  name          = "alias/${var.project_name}-main-key"
  target_key_id = aws_kms_key.main_encryption_key.key_id
}

# Generate a random password for RDS - Security best practice
resource "random_password" "rds_password" {
  length  = 32
  special = true
  # Ensure password meets RDS MySQL requirements
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Store RDS password in AWS Secrets Manager - Security best practice
resource "aws_secretsmanager_secret" "rds_password" {
  name                    = "${var.project_name}-rds-master-password"
  description             = "Master password for RDS MySQL instance"
  recovery_window_in_days = 7 # Allows recovery if accidentally deleted

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-rds-password"
  })
}

resource "aws_secretsmanager_secret_version" "rds_password" {
  secret_id = aws_secretsmanager_secret.rds_password.id
  secret_string = jsonencode({
    username = var.rds_username
    password = random_password.rds_password.result
    engine   = "mysql"
    host     = aws_db_instance.main.endpoint
    port     = 3306
    dbname   = "secureapp"
  })

  # Ensure RDS is created first
  depends_on = [aws_db_instance.main]
}

# S3 bucket for CloudTrail logs with encryption and security best practices
resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket = "${var.project_name}-cloudtrail-logs-${data.aws_caller_identity.current.account_id}"

  # Prevent accidental deletion of audit logs
  force_destroy = true # No deletion protection as per requirements

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-cloudtrail-logs"
    Type = "audit-logs"
  })
}

# Enable versioning for CloudTrail logs bucket
resource "aws_s3_bucket_versioning" "cloudtrail_logs_versioning" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption for CloudTrail logs bucket using KMS
resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs_encryption" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main_encryption_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Block all public access to CloudTrail logs bucket
resource "aws_s3_bucket_public_access_block" "cloudtrail_logs_pab" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket policy for CloudTrail
resource "aws_s3_bucket_policy" "cloudtrail_logs_policy" {
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
      },
      {
        Sid       = "DenyUnencryptedObjectUploads"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.cloudtrail_logs.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.cloudtrail_logs_pab]
}

# CloudTrail configuration for comprehensive API logging
resource "aws_cloudtrail" "main" {
  name                          = "${var.project_name}-main-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail_logs.id
  include_global_service_events = true
  is_multi_region_trail         = true # Security best practice: log all regions
  enable_logging                = true
  enable_log_file_validation    = true # Security best practice: ensure log integrity

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }
  }

  kms_key_id = aws_kms_key.main_encryption_key.arn

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-main-trail"
  })

  depends_on = [aws_s3_bucket_policy.cloudtrail_logs_policy]
}

# General purpose S3 bucket with security best practices
resource "aws_s3_bucket" "application_data" {
  bucket = "${var.project_name}-application-data-${data.aws_caller_identity.current.account_id}"

  force_destroy = true # No deletion protection as per requirements

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-application-data"
    Type = "application"
  })
}

# Enable versioning for application data bucket
resource "aws_s3_bucket_versioning" "application_data_versioning" {
  bucket = aws_s3_bucket.application_data.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption for application data bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "application_data_encryption" {
  bucket = aws_s3_bucket.application_data.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main_encryption_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Block all public access to application data bucket
resource "aws_s3_bucket_public_access_block" "application_data_pab" {
  bucket = aws_s3_bucket.application_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# VPC for secure network isolation
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-igw"
  })
}

# Public subnet for bastion/jump host
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-subnet"
    Type = "public"
  })
}

# Private subnet for RDS and application instances
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-subnet-1"
    Type = "private"
  })
}

# Second private subnet for RDS Multi-AZ
resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-subnet-2"
    Type = "private"
  })
}

# Route table for public subnet
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-rt"
  })
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Security group for EC2 instances with restricted SSH access
resource "aws_security_group" "ec2_instance" {
  name        = "${var.project_name}-ec2-sg"
  description = "Security group for EC2 instances with restricted SSH access"
  vpc_id      = aws_vpc.main.id

  # Restrict SSH access to trusted CIDR block only
  ingress {
    description = "SSH from trusted CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.trusted_ssh_cidr]
  }

  # Allow HTTPS inbound for web applications
  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound traffic
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-ec2-sg"
  })
}

# Security group for RDS with restricted access
resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg"
  description = "Security group for RDS instance"
  vpc_id      = aws_vpc.main.id

  # Allow MySQL/PostgreSQL access only from EC2 security group
  ingress {
    description     = "MySQL/PostgreSQL from EC2"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_instance.id]
  }

  # No egress rules for RDS - it doesn't need outbound connectivity

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-rds-sg"
  })
}

# IAM role for EC2 instances following least privilege principle
resource "aws_iam_role" "ec2_instance" {
  name = "${var.project_name}-ec2-instance-role"

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
    Name = "${var.project_name}-ec2-instance-role"
  })
}

# IAM policy for EC2 instances with minimal permissions
resource "aws_iam_policy" "ec2_instance" {
  name        = "${var.project_name}-ec2-instance-policy"
  description = "Policy for EC2 instances with least privilege access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3ReadOnlyAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.application_data.arn,
          "${aws_s3_bucket.application_data.arn}/*"
        ]
      },
      {
        Sid    = "CloudWatchLogsAccess"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/ec2/*"
      },
      {
        Sid    = "SSMAccess"
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/*"
      }
    ]
  })
}

# Attach policy to EC2 role
resource "aws_iam_role_policy_attachment" "ec2_instance" {
  role       = aws_iam_role.ec2_instance.name
  policy_arn = aws_iam_policy.ec2_instance.arn
}

# Instance profile for EC2
resource "aws_iam_instance_profile" "ec2_instance" {
  name = "${var.project_name}-ec2-instance-profile"
  role = aws_iam_role.ec2_instance.name
}

# IAM account password policy enforcing strong passwords
resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = 14 # Security best practice: long passwords
  require_lowercase_characters   = true
  require_uppercase_characters   = true
  require_numbers                = true
  require_symbols                = true
  allow_users_to_change_password = true
  hard_expiry                    = false
  max_password_age               = 90 # Passwords expire after 90 days
  password_reuse_prevention      = 5  # Prevent reuse of last 5 passwords
}

# IAM policy requiring MFA for console access
resource "aws_iam_policy" "require_mfa" {
  name        = "${var.project_name}-require-mfa-policy"
  description = "Policy that requires MFA for all actions except setting up MFA"

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
        Sid    = "AllowManageOwnPasswordsAndMFA"
        Effect = "Allow"
        Action = [
          "iam:ChangePassword",
          "iam:GetUser",
          "iam:CreateVirtualMFADevice",
          "iam:DeleteVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:ListMFADevices",
          "iam:ResyncMFADevice"
        ]
        Resource = [
          "arn:aws:iam::*:user/$${aws:username}",
          "arn:aws:iam::*:mfa/$${aws:username}"
        ]
      },
      {
        Sid    = "DenyAllExceptListedIfNoMFA"
        Effect = "Deny"
        NotAction = [
          "iam:ChangePassword",
          "iam:GetUser",
          "iam:CreateVirtualMFADevice",
          "iam:DeleteVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:ListMFADevices",
          "iam:ResyncMFADevice",
          "iam:GetAccountPasswordPolicy",
          "iam:ListVirtualMFADevices"
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

# RDS subnet group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-db-subnet-group"
  })
}

# RDS instance with encryption and security best practices
resource "aws_db_instance" "main" {
  identifier     = "${var.project_name}-db"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100 # Enable storage autoscaling
  storage_type          = "gp3"
  storage_encrypted     = true # Security best practice: encrypt at rest
  kms_key_id            = aws_kms_key.main_encryption_key.arn

  db_name  = "secureapp"
  username = var.rds_username
  password = random_password.rds_password.result # Use randomly generated password from Secrets Manager

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  # Backup configuration
  backup_retention_period = 7 # Keep backups for 7 days
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  # Security configurations
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]
  publicly_accessible             = false

  # High availability
  multi_az = false # Set to true in production for high availability

  # No deletion protection as per requirements
  deletion_protection = false
  skip_final_snapshot = true

  # Performance Insights for monitoring
  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.main_encryption_key.arn

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-db"
  })
}

# S3 bucket for AWS Config
resource "aws_s3_bucket" "config" {
  bucket = "${var.project_name}-config-${data.aws_caller_identity.current.account_id}"

  force_destroy = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-config"
    Type = "config"
  })
}

# Enable versioning for Config bucket
resource "aws_s3_bucket_versioning" "config_versioning" {
  bucket = aws_s3_bucket.config.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption for Config bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "config_encryption" {
  bucket = aws_s3_bucket.config.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main_encryption_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Block public access to Config bucket
resource "aws_s3_bucket_public_access_block" "config_pab" {
  bucket = aws_s3_bucket.config.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket policy for AWS Config
resource "aws_s3_bucket_policy" "config_bucket_policy" {
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
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config.arn
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
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.config_pab]
}

# IAM role for AWS Config
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

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-config-role"
  })
}

# IAM policy for AWS Config
resource "aws_iam_policy" "config" {
  name        = "${var.project_name}-config-policy"
  description = "Policy for AWS Config service"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketVersioning",
          "s3:PutBucketVersioning",
          "s3:GetBucketNotification",
          "s3:PutBucketNotification",
          "s3:GetBucketPolicy",
          "s3:PutBucketPolicy",
          "s3:GetBucketLocation",
          "s3:ListBucket",
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          aws_s3_bucket.config.arn,
          "${aws_s3_bucket.config.arn}/*"
        ]
      }
    ]
  })
}

# Attach AWS managed policy for Config
resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

# Attach custom policy to Config role
resource "aws_iam_role_policy_attachment" "config_custom" {
  role       = aws_iam_role.config.name
  policy_arn = aws_iam_policy.config.arn
}

# AWS Config configuration recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "${var.project_name}-recorder"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported = true
  }

  depends_on = [aws_config_delivery_channel.main]
}

# AWS Config delivery channel
resource "aws_config_delivery_channel" "main" {
  name           = "${var.project_name}-delivery-channel"
  s3_bucket_name = aws_s3_bucket.config.bucket

  snapshot_delivery_properties {
    delivery_frequency = "TwentyFour_Hours"
  }

  depends_on = [aws_s3_bucket_policy.config_bucket_policy]
}

# Start AWS Config recorder
resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# AWS Config Rule: Check S3 bucket encryption
resource "aws_config_config_rule" "s3_bucket_encryption" {
  name = "${var.project_name}-s3-bucket-encryption"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-s3-bucket-encryption-rule"
  })
}

# AWS Config Rule: Check MFA enabled for IAM users
resource "aws_config_config_rule" "iam_user_mfa_enabled" {
  name = "${var.project_name}-iam-user-mfa-enabled"

  source {
    owner             = "AWS"
    source_identifier = "IAM_USER_MFA_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-iam-user-mfa-rule"
  })
}

# AWS Config Rule: Check CloudTrail is enabled
resource "aws_config_config_rule" "cloudtrail_enabled" {
  name = "${var.project_name}-cloudtrail-enabled"

  source {
    owner             = "AWS"
    source_identifier = "CLOUD_TRAIL_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-cloudtrail-enabled-rule"
  })
}

# AWS Config Rule: Check restricted SSH
resource "aws_config_config_rule" "restricted_ssh" {
  name = "${var.project_name}-restricted-ssh"

  source {
    owner             = "AWS"
    source_identifier = "INCOMING_SSH_DISABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-restricted-ssh-rule"
  })
}

# AWS Config Rule: Check S3 bucket public read prohibited
resource "aws_config_config_rule" "s3_bucket_public_read_prohibited" {
  name = "${var.project_name}-s3-bucket-public-read-prohibited"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-s3-public-read-prohibited-rule"
  })
}

# AWS Config Rule: Check S3 bucket public write prohibited
resource "aws_config_config_rule" "s3_bucket_public_write_prohibited" {
  name = "${var.project_name}-s3-bucket-public-write-prohibited"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_WRITE_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-s3-public-write-prohibited-rule"
  })
}

# AWS Config Rule: Check RDS encryption enabled
resource "aws_config_config_rule" "rds_encryption_enabled" {
  name = "${var.project_name}-rds-encryption-enabled"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  depends_on = [aws_config_configuration_recorder.main]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-rds-encryption-rule"
  })
}

# AWS Config Rule: Check password policy
resource "aws_config_config_rule" "iam_password_policy" {
  name = "${var.project_name}-iam-password-policy"

  source {
    owner             = "AWS"
    source_identifier = "IAM_PASSWORD_POLICY"
  }

  input_parameters = jsonencode({
    RequireUppercaseCharacters = "true"
    RequireLowercaseCharacters = "true"
    RequireSymbols             = "true"
    RequireNumbers             = "true"
    MinimumPasswordLength      = "14"
    PasswordReusePrevention    = "5"
    MaxPasswordAge             = "90"
  })

  depends_on = [aws_config_configuration_recorder.main]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-iam-password-policy-rule"
  })
}

# Optional: Sample EC2 instance to demonstrate IAM role usage
resource "aws_instance" "example" {
  count = 0 # Set to 1 to create an instance

  ami                    = "ami-0c02fb55956c7d316" # Amazon Linux 2 AMI (update for your region)
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.ec2_instance.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_instance.name

  # Enable detailed monitoring
  monitoring = true

  # Enable EBS encryption
  root_block_device {
    encrypted   = true
    volume_type = "gp3"
    volume_size = 20
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # Require IMDSv2 for enhanced security
    http_put_response_hop_limit = 1
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-example-instance"
  })
}

# Outputs for reference
output "cloudtrail_name" {
  value       = aws_cloudtrail.main.name
  description = "Name of the CloudTrail"
}

output "cloudtrail_s3_bucket" {
  value       = aws_s3_bucket.cloudtrail_logs.id
  description = "S3 bucket storing CloudTrail logs"
}

output "application_s3_bucket" {
  value       = aws_s3_bucket.application_data.id
  description = "S3 bucket for application data"
}

output "config_recorder_name" {
  value       = aws_config_configuration_recorder.main.name
  description = "Name of the AWS Config recorder"
}

output "rds_endpoint" {
  value       = aws_db_instance.main.endpoint
  description = "RDS instance endpoint"
  sensitive   = true
}

output "rds_password_secret_arn" {
  value       = aws_secretsmanager_secret.rds_password.arn
  description = "ARN of the Secrets Manager secret containing RDS credentials"
  sensitive   = true
}

output "kms_key_id" {
  value       = aws_kms_key.main_encryption_key.id
  description = "KMS key ID for encryption"
}

output "vpc_id" {
  value       = aws_vpc.main.id
  description = "VPC ID"
}

output "ec2_role_name" {
  value       = aws_iam_role.ec2_instance.name
  description = "IAM role name for EC2 instances"
}