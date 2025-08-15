# Configure S3 backend for remote state management
terraform {
  backend "s3" {
    # Backend configuration will be provided via command line arguments
    # bucket, key, region, encrypt, use_lockfile
  }
}

#######################
# Variables
#######################

variable "author" {
  description = "Author of the project"
  type        = string
}

variable "created_date" {
  description = "Creation date"
  type        = string
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
}

variable "aws_region" {
  description = "The AWS region where resources will be created"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "tap-app"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "key_pair_name" {
  description = "Name of the AWS key pair for EC2 instances"
  type        = string
  default     = ""
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  default     = "ubRda3jFWlV4t42w"
  sensitive   = true
}

variable "backup_retention_period" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 7
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for critical resources"
  type        = bool
  default     = false
}

variable "allowed_cidr_blocks" {
  description = "List of CIDR blocks allowed to access EC2 instances via SSH"
  type        = list(string)
  default     = ["10.0.0.0/8"]
}

variable "notification_email" {
  description = "Email address for notifications"
  type        = string
  default     = "ngwakoleslieelijah@example.com"
}

variable "region" {
  description = "AWS region (alias for aws_region)"
  type        = string
  default     = "us-east-1"
}

variable "use_existing_vpc" {
  description = "Use existing VPC instead of creating new one (recommended to avoid VPC limits)"
  type        = bool
  default     = false
}

variable "existing_vpc_id" {
  description = "ID of existing VPC to use (required if use_existing_vpc is true)"
  type        = string
  default     = ""
  validation {
    condition     = var.use_existing_vpc == false || (var.use_existing_vpc == true && var.existing_vpc_id != "")
    error_message = "existing_vpc_id must be provided when use_existing_vpc is true."
  }
}

variable "existing_public_subnet_ids" {
  description = "IDs of existing public subnets (required if use_existing_vpc is true)"
  type        = list(string)
  default     = []
  validation {
    condition     = var.use_existing_vpc == false || (var.use_existing_vpc == true && length(var.existing_public_subnet_ids) >= 2)
    error_message = "At least 2 existing_public_subnet_ids must be provided when use_existing_vpc is true."
  }
}

variable "existing_private_subnet_ids" {
  description = "IDs of existing private subnets (required if use_existing_vpc is true)"
  type        = list(string)
  default     = []
  validation {
    condition     = var.use_existing_vpc == false || (var.use_existing_vpc == true && length(var.existing_private_subnet_ids) >= 2)
    error_message = "At least 2 existing_private_subnet_ids must be provided when use_existing_vpc is true."
  }
}

#######################
# Random string for unique naming
#######################
resource "random_string" "short" {
  length  = 6
  upper   = false
  special = false
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

#######################
# Locals
#######################

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    CreatedBy   = "ngwakoleslieelijah"
    CreatedDate = formatdate("YYYY-MM-DD", timestamp())
  }

  # Use existing VPC or create new one
  vpc_id              = var.use_existing_vpc ? var.existing_vpc_id : aws_vpc.main[0].id
  public_subnet_ids   = var.use_existing_vpc ? var.existing_public_subnet_ids : aws_subnet.public[*].id
  private_subnet_ids  = var.use_existing_vpc ? var.existing_private_subnet_ids : aws_subnet.private[*].id
  database_subnet_ids = var.use_existing_vpc ? var.existing_private_subnet_ids : aws_subnet.database[*].id

  # Shortened names for ALB and target group (always <=32 chars)
  alb_name = "${substr(local.name_prefix, 0, 18)}-alb-${random_string.short.result}"
  tg_name  = "${substr(local.name_prefix, 0, 17)}-tg-${random_string.short.result}"
}

#######################
# Data Sources
#######################

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}
data "aws_ami" "amazon_linux" {
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
  filter {
    name   = "state"
    values = ["available"]
  }
}
data "aws_partition" "current" {}
data "aws_vpc" "existing" {
  count = var.use_existing_vpc ? 1 : 0
  id    = var.existing_vpc_id
}
data "aws_subnet" "existing_public" {
  count = var.use_existing_vpc ? length(var.existing_public_subnet_ids) : 0
  id    = var.existing_public_subnet_ids[count.index]
}
data "aws_subnet" "existing_private" {
  count = var.use_existing_vpc ? length(var.existing_private_subnet_ids) : 0
  id    = var.existing_private_subnet_ids[count.index]
}

#######################
# VPC and Networking (Conditional)
#######################

resource "aws_vpc" "main" {
  count = var.use_existing_vpc ? 0 : 1
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
    Type = "networking"
  })
}

resource "aws_internet_gateway" "main" {
  count  = var.use_existing_vpc ? 0 : 1
  vpc_id = aws_vpc.main[0].id
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
    Type = "networking"
  })
}

resource "aws_subnet" "public" {
  count = var.use_existing_vpc ? 0 : 2
  vpc_id                  = aws_vpc.main[0].id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "public-subnet"
    Tier = "public"
  })
}

resource "aws_subnet" "private" {
  count = var.use_existing_vpc ? 0 : 2
  vpc_id            = aws_vpc.main[0].id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "private-subnet"
    Tier = "application"
  })
}

resource "aws_subnet" "database" {
  count = var.use_existing_vpc ? 0 : 2
  vpc_id            = aws_vpc.main[0].id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 20)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-subnet-${count.index + 1}"
    Type = "database-subnet"
    Tier = "database"
  })
}

#######################
# KMS Keys for Encryption
#######################

resource "aws_kms_key" "rds_key" {
  description             = "KMS key for RDS encryption in ${var.environment} environment"
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
        Sid    = "Allow RDS Service"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*"
        ]
        Resource = "*"
      }
    ]
  })
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-kms-key"
    Type = "encryption"
  })
}

resource "aws_kms_alias" "rds_key" {
  name          = "alias/${local.name_prefix}-rds-key"
  target_key_id = aws_kms_key.rds_key.key_id
}

resource "aws_kms_key" "s3_key" {
  description             = "KMS key for S3 encryption in ${var.environment} environment"
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
        Sid    = "Allow S3 Service"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*"
        ]
        Resource = "*"
      }
    ]
  })
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-kms-key"
    Type = "encryption"
  })
}

resource "aws_kms_alias" "s3_key" {
  name          = "alias/${local.name_prefix}-s3-key"
  target_key_id = aws_kms_key.s3_key.key_id
}

resource "aws_kms_key" "ebs_key" {
  description             = "KMS key for EBS encryption in ${var.environment} environment"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ebs-kms-key"
    Type = "encryption"
  })
}

resource "aws_kms_alias" "ebs_key" {
  name          = "alias/${local.name_prefix}-ebs-key"
  target_key_id = aws_kms_key.ebs_key.key_id
}

#######################
# Application Load Balancer
#######################

resource "aws_lb" "main" {
  name               = local.alb_name
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = local.public_subnet_ids

  enable_deletion_protection = var.environment == "prod" ? var.enable_deletion_protection : false

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.id
    prefix  = "alb-logs"
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb"
    Type = "load-balancer"
  })
}

resource "aws_lb_target_group" "app" {
  name     = local.tg_name
  port     = 80
  protocol = "HTTP"
  vpc_id   = local.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-target-group"
    Type = "load-balancer"
  })
}

resource "aws_lb_listener" "app" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-listener"
    Type = "load-balancer"
  })
}

#######################
# IAM Roles and Policies
#######################

# ... (IAM roles and policies unchanged, include all blocks as in your original file) ...

#######################
# EC2 Instances
#######################

# ... (EC2 launch template, autoscaling group, etc. unchanged) ...

#######################
# RDS Database
#######################

# ... (RDS instance, subnet group, etc. unchanged) ...

#######################
# S3 Buckets
#######################

resource "aws_s3_bucket" "app_data" {
  bucket = "${local.name_prefix}-app-data-${random_string.bucket_suffix.result}"
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-app-data-bucket"
    Type = "storage"
  })
}

resource "aws_s3_bucket" "alb_logs" {
  bucket = "${local.name_prefix}-alb-logs-${random_string.bucket_suffix.result}"
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-logs-bucket"
    Type = "storage"
  })
}

resource "aws_s3_bucket_versioning" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

########################
# Security Groups
########################

# ... (all security groups unchanged) ...

########################
# Monitoring
########################

# ... (CloudWatch, SNS, alarms, dashboard unchanged) ...

########################
# Lambda Function
########################

# ... (Lambda function and archive file unchanged) ...

########################
# S3 Additional Configuration
########################

resource "aws_s3_bucket_public_access_block" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.app_data.arn,
          "${aws_s3_bucket.app_data.arn}/*",
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.app_data]
}

# ---- FIXED ALB LOGS BUCKET POLICY ----
resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AWSLoadBalancerWrite",
        Effect    = "Allow",
        Principal = {
          Service = "logdelivery.elasticloadbalancing.amazonaws.com"
        },
        Action = [
          "s3:PutObject"
        ],
        Resource = [
          "${aws_s3_bucket.alb_logs.arn}/*"
        ],
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.alb_logs.arn,
          "${aws_s3_bucket.alb_logs.arn}/*",
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.alb_logs]
}

resource "aws_s3_bucket_lifecycle_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  rule {
    id     = "app_data_lifecycle"
    status = "Enabled"
    filter {
      prefix = ""
    }
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
    expiration {
      days = 365
    }
    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  rule {
    id     = "alb_logs_lifecycle"
    status = "Enabled"
    filter {
      prefix = ""
    }
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    transition {
      days          = 60
      storage_class = "GLACIER"
    }
    expiration {
      days = 90
    }
  }
}

########################
# Outputs
########################

output "vpc_id" {
  description = "ID of the VPC"
  value       = local.vpc_id
}

output "alb_dns_name" {
  description = "DNS name of the application load balancer"
  value       = aws_lb.main.dns_name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "app_data_bucket_name" {
  description = "Name of the application data S3 bucket"
  value       = aws_s3_bucket.app_data.id
}

output "alb_logs_bucket_name" {
  description = "Name of the ALB logs S3 bucket"
  value       = aws_s3_bucket.alb_logs.id
}

output "security_group_ids" {
  description = "Security Group IDs"
  value = {
    alb_sg    = aws_security_group.alb.id
    ec2_sg    = aws_security_group.ec2.id
    rds_sg    = aws_security_group.rds.id
    lambda_sg = aws_security_group.lambda.id
  }
}