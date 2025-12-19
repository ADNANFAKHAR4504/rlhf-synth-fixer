# main.tf - Production-grade multi-account AWS security infrastructure

# ========================================
# TERRAFORM CONFIGURATION
# ========================================
terraform {
  required_version = ">= 1.4.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}

# ========================================
# VARIABLES
# ========================================
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "secure-infra"
}

variable "aws_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_regions" {
  description = "Secondary regions for multi-region deployment"
  type        = list(string)
  default     = ["us-west-2", "eu-west-1"]
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for subnet deployment"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "enable_shield_advanced" {
  description = "Enable AWS Shield Advanced"
  type        = bool
  default     = true
}

variable "mfa_serial_number" {
  description = "MFA device serial number for IAM users"
  type        = string
  default     = ""
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "production"
    ManagedBy   = "terraform"
    Security    = "enabled"
  }
}

# ========================================
# DATA SOURCES
# ========================================
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_iam_policy_document" "assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

# ========================================
# KMS KEYS FOR ENCRYPTION
# ========================================
resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.project_name} encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  tags                    = merge(var.common_tags, { Name = "${var.project_name}-kms-key" })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project_name}-main"
  target_key_id = aws_kms_key.main.key_id
}

resource "aws_kms_key" "cloudtrail" {
  description             = "KMS key for CloudTrail encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  tags                    = merge(var.common_tags, { Name = "${var.project_name}-cloudtrail-kms" })

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM policies"
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
}

# ========================================
# NETWORKING - VPC AND SUBNETS
# ========================================
resource "aws_vpc" "main" {
  cidr_block                       = var.vpc_cidr
  enable_dns_hostnames             = true
  enable_dns_support               = true
  assign_generated_ipv6_cidr_block = true
  tags                             = merge(var.common_tags, { Name = "${var.project_name}-vpc" })
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.flow_log.arn
  log_destination = aws_cloudwatch_log_group.flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id
  tags            = merge(var.common_tags, { Name = "${var.project_name}-flow-logs" })
}

resource "aws_cloudwatch_log_group" "flow_log" {
  name              = "/aws/vpc/${var.project_name}-flow-logs"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn
  tags              = merge(var.common_tags, { Name = "${var.project_name}-flow-log-group" })
}

resource "aws_iam_role" "flow_log" {
  name = "${var.project_name}-flow-log-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "vpc-flow-logs.amazonaws.com"
      }
    }]
  })
  tags = merge(var.common_tags, { Name = "${var.project_name}-flow-log-role" })
}

resource "aws_iam_role_policy" "flow_log" {
  name = "${var.project_name}-flow-log-policy"
  role = aws_iam_role.flow_log.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ]
      Effect   = "Allow"
      Resource = "*"
    }]
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true
  tags                    = merge(var.common_tags, { Name = "${var.project_name}-public-subnet-${count.index + 1}" })
}

# Private Subnets for RDS
resource "aws_subnet" "private_db" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]
  tags              = merge(var.common_tags, { Name = "${var.project_name}-private-db-subnet-${count.index + 1}" })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = merge(var.common_tags, { Name = "${var.project_name}-igw" })
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.common_tags, { Name = "${var.project_name}-public-rt" })
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ========================================
# S3 BUCKETS WITH SECURITY
# ========================================
# CloudTrail Bucket
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "${var.project_name}-cloudtrail-logs-${data.aws_caller_identity.current.account_id}"
  tags   = merge(var.common_tags, { Name = "${var.project_name}-cloudtrail-bucket" })
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
      kms_master_key_id = aws_kms_key.cloudtrail.arn
      sse_algorithm     = "aws:kms"
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
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "DenyInsecureConnections"
        Effect = "Deny"
        Principal = {
          AWS = "*"
        }
        Action   = "s3:*"
        Resource = ["${aws_s3_bucket.cloudtrail.arn}/*", aws_s3_bucket.cloudtrail.arn]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# Security Group Changes Log Bucket
resource "aws_s3_bucket" "sg_logs" {
  bucket = "${var.project_name}-sg-change-logs-${data.aws_caller_identity.current.account_id}"
  tags   = merge(var.common_tags, { Name = "${var.project_name}-sg-logs-bucket" })
}

resource "aws_s3_bucket_versioning" "sg_logs" {
  bucket = aws_s3_bucket.sg_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "sg_logs" {
  bucket = aws_s3_bucket.sg_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "sg_logs" {
  bucket = aws_s3_bucket.sg_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# General Purpose Encrypted Bucket
resource "aws_s3_bucket" "main" {
  bucket = "${var.project_name}-main-${data.aws_caller_identity.current.account_id}"
  tags   = merge(var.common_tags, { Name = "${var.project_name}-main-bucket" })
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
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
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

resource "aws_s3_bucket_policy" "main" {
  bucket = aws_s3_bucket.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyInsecureConnections"
        Effect = "Deny"
        Principal = {
          AWS = "*"
        }
        Action   = "s3:*"
        Resource = ["${aws_s3_bucket.main.arn}/*", aws_s3_bucket.main.arn]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# ========================================
# SECRETS MANAGER
# ========================================
resource "random_password" "rds_password" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret" "rds_credentials" {
  name                    = "${var.project_name}-rds-credentials"
  description             = "RDS database credentials"
  kms_key_id              = aws_kms_key.main.id
  recovery_window_in_days = 7
  tags                    = merge(var.common_tags, { Name = "${var.project_name}-rds-secret" })
}

resource "aws_secretsmanager_secret_version" "rds_credentials" {
  secret_id = aws_secretsmanager_secret.rds_credentials.id

  secret_string = jsonencode({
    username = "dbadmin"
    password = random_password.rds_password.result
    engine   = "mysql"
    host     = aws_db_instance.main.endpoint
    port     = 3306
    dbname   = aws_db_instance.main.db_name
  })
}

# ========================================
# SECURITY GROUPS
# ========================================
# RDS Security Group
resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-rds-sg"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "MySQL/Aurora from application"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, { Name = "${var.project_name}-rds-sg" })
}

# Application Security Group
resource "aws_security_group" "app" {
  name_prefix = "${var.project_name}-app-sg"
  description = "Security group for applications"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, { Name = "${var.project_name}-app-sg" })
}

# ========================================
# RDS DATABASE
# ========================================
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = aws_subnet.private_db[*].id
  tags       = merge(var.common_tags, { Name = "${var.project_name}-db-subnet-group" })
}

resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-rds"

  engine            = "mysql"
  engine_version    = "8.0"
  instance_class    = var.db_instance_class
  allocated_storage = 20
  storage_encrypted = true
  kms_key_id        = aws_kms_key.main.arn

  db_name  = "securedb"
  username = "dbadmin"
  password = random_password.rds_password.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot       = true
  final_snapshot_identifier = "${var.project_name}-rds-final-snapshot"

  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  tags = merge(var.common_tags, { Name = "${var.project_name}-rds" })
}

# ========================================
# IAM ROLES AND POLICIES
# ========================================
# EC2 Instance Role
resource "aws_iam_role" "ec2_instance" {
  name               = "${var.project_name}-ec2-instance-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
  tags               = merge(var.common_tags, { Name = "${var.project_name}-ec2-role" })
}

resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2_instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Lambda Role for Security Group Monitoring
resource "aws_iam_role" "sg_monitor_lambda" {
  name = "${var.project_name}-sg-monitor-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = merge(var.common_tags, { Name = "${var.project_name}-sg-monitor-lambda-role" })
}

resource "aws_iam_role_policy" "sg_monitor_lambda" {
  name = "${var.project_name}-sg-monitor-lambda-policy"
  role = aws_iam_role.sg_monitor_lambda.id

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
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "${aws_s3_bucket.sg_logs.arn}/*"
      }
    ]
  })
}

# IAM User with MFA requirement(for console access)
resource "aws_iam_group" "admins" {
  name = "${var.project_name}-admins"
}

resource "aws_iam_policy" "mfa_policy" {
  name        = "${var.project_name}-require-mfa"
  description = "Require MFA for all actions except MFA setup"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyAllExceptListedIfNoMFA"
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

resource "aws_iam_group_policy_attachment" "admins_mfa" {
  group      = aws_iam_group.admins.name
  policy_arn = aws_iam_policy.mfa_policy.arn
}

# ========================================
# AWS CONFIG
# ========================================
resource "aws_config_configuration_recorder" "main" {
  name     = "${var.project_name}-config-recorder"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported = true
  }
}

resource "aws_config_delivery_channel" "main" {
  name           = "${var.project_name}-config-delivery"
  s3_bucket_name = aws_s3_bucket.config.id

  snapshot_delivery_properties {
    delivery_frequency = "TwentyFour_Hours"
  }
}

resource "aws_s3_bucket" "config" {
  bucket = "${var.project_name}-config-${data.aws_caller_identity.current.account_id}"
  tags   = merge(var.common_tags, { Name = "${var.project_name}-config-bucket" })
}

resource "aws_s3_bucket_versioning" "config" {
  bucket = aws_s3_bucket.config.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config" {
  bucket = aws_s3_bucket.config.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
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
}

resource "aws_iam_role" "config" {
  name = "${var.project_name}-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "config.amazonaws.com"
      }
    }]
  })

  tags = merge(var.common_tags, { Name = "${var.project_name}-config-role" })
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
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetBucketVersioning",
        "s3:PutBucketVersioning",
        "s3:GetBucketNotification",
        "s3:PutBucketNotification",
        "s3:GetBucketPolicy",
        "s3:PutBucketPolicy"
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
    }]
  })
}

resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true
  depends_on = [aws_config_delivery_channel.main]
}

# ========================================
# AWS GUARDDUTY
# ========================================
resource "aws_guardduty_detector" "main" {
  enable                       = true
  finding_publishing_frequency = "FIFTEEN_MINUTES"

  datasources {
    s3_logs {
      enable = true
    }
  }

  tags = merge(var.common_tags, { Name = "${var.project_name}-guardduty" })
}

# ========================================
# AWS SHIELD ADVANCED
# ========================================
resource "aws_shield_subscription" "main" {
  count = var.enable_shield_advanced ? 1 : 0
}

# ========================================
# AWS CLOUDTRAIL
# ========================================
resource "aws_cloudtrail" "main" {
  name                          = "${var.project_name}-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true
  kms_key_id                    = aws_kms_key.cloudtrail.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }

    data_resource {
      type   = "AWS::RDS::DBCluster"
      values = ["arn:aws:rds:*:*:cluster/*"]
    }
  }

  tags = merge(var.common_tags, { Name = "${var.project_name}-cloudtrail" })
}

# ========================================
# SECURITY GROUP CHANGE MONITORING
# ========================================
resource "aws_cloudwatch_log_group" "sg_changes" {
  name              = "/aws/lambda/${var.project_name}-sg-monitor"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main.arn
  tags              = merge(var.common_tags, { Name = "${var.project_name}-sg-changes-log" })
}

# Lambda function inline code
data "archive_file" "sg_monitor_lambda" {
  type        = "zip"
  output_path = "${path.module}/sg_monitor.zip"

  source {
    content  = <<-EOF
import json
import os
import boto3
from datetime import datetime

s3 = boto3.client('s3')

def handler(event, context):
    """Lambda function to log security group changes to S3"""
    try:
        detail = event.get('detail', {})
        event_name = detail.get('eventName', 'Unknown')
        event_time = detail.get('eventTime', datetime.utcnow().isoformat())
        
        log_entry = {
            'timestamp': event_time,
            'eventName': event_name,
            'userIdentity': detail.get('userIdentity', {}),
            'requestParameters': detail.get('requestParameters', {}),
            'sourceIPAddress': detail.get('sourceIPAddress', 'Unknown'),
            'userAgent': detail.get('userAgent', 'Unknown'),
            'awsRegion': detail.get('awsRegion', 'Unknown')
        }
        
        bucket_name = os.environ.get('S3_BUCKET')
        if not bucket_name:
            return {'statusCode': 500, 'body': json.dumps('S3_BUCKET not set')}
        
        timestamp = datetime.utcnow().strftime('%Y/%m/%d/%H-%M-%S')
        s3_key = f'security-group-changes/{timestamp}-{event_name}.json'
        
        s3.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=json.dumps(log_entry, indent=2),
            ContentType='application/json',
            ServerSideEncryption='aws:kms'
        )
        
        print(f"Logged to s3://{bucket_name}/{s3_key}")
        return {'statusCode': 200, 'body': json.dumps('Success')}
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
        return {'statusCode': 500, 'body': json.dumps(f'Error: {str(e)}')}
EOF
    filename = "index.py"
  }
}

resource "aws_lambda_function" "sg_monitor" {
  filename         = data.archive_file.sg_monitor_lambda.output_path
  function_name    = "${var.project_name}-sg-monitor"
  role             = aws_iam_role.sg_monitor_lambda.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.sg_monitor_lambda.output_base64sha256
  runtime          = "python3.11"
  timeout          = 60

  environment {
    variables = {
      S3_BUCKET = aws_s3_bucket.sg_logs.id
      LOG_GROUP = aws_cloudwatch_log_group.sg_changes.name
    }
  }

  tags = merge(var.common_tags, { Name = "${var.project_name}-sg-monitor-lambda" })
}

resource "aws_cloudwatch_event_rule" "sg_changes" {
  name        = "${var.project_name}-sg-changes"
  description = "Capture security group changes"

  event_pattern = jsonencode({
    source      = ["aws.ec2"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventName = [
        "AuthorizeSecurityGroupIngress",
        "AuthorizeSecurityGroupEgress",
        "RevokeSecurityGroupIngress",
        "RevokeSecurityGroupEgress",
        "CreateSecurityGroup",
        "DeleteSecurityGroup",
        "ModifySecurityGroupRules"
      ]
    }
  })

  tags = merge(var.common_tags, { Name = "${var.project_name}-sg-changes-rule" })
}

resource "aws_cloudwatch_event_target" "sg_lambda" {
  rule      = aws_cloudwatch_event_rule.sg_changes.name
  target_id = "SGMonitorLambda"
  arn       = aws_lambda_function.sg_monitor.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.sg_monitor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.sg_changes.arn
}

# ========================================
# OUTPUTS
# ========================================
output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "cloudtrail_s3_bucket_arn" {
  description = "ARN of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.arn
}

output "sg_logs_s3_bucket_arn" {
  description = "ARN of the Security Group logs S3 bucket"
  value       = aws_s3_bucket.sg_logs.arn
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "secrets_manager_secret_arn" {
  description = "ARN of the Secrets Manager secret for RDS"
  value       = aws_secretsmanager_secret.rds_credentials.arn
}

output "guardduty_detector_id" {
  description = "GuardDuty detector ID"
  value       = aws_guardduty_detector.main.id
}

output "flow_log_id" {
  description = "VPC Flow Log ID"
  value       = aws_flow_log.main.id
}

output "config_recorder_name" {
  description = "AWS Config recorder name"
  value       = aws_config_configuration_recorder.main.name
}