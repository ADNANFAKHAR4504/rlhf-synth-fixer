# Variables
variable "regions" {
  description = "AWS regions for deployment"
  type        = list(string)
  default     = ["us-west-2", "us-east-1"]
}

variable "allowed_ingress_cidrs" {
  description = "Allowed IP addresses for security group ingress"
  type        = list(string)
  default     = ["10.0.0.0/8", "172.16.0.0/12"]
}

variable "vpc_cidr_usw2" {
  description = "VPC CIDR for us-west-2"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_cidr_use1" {
  description = "VPC CIDR for us-east-1"
  type        = string
  default     = "10.1.0.0/16"
}

variable "prefix" {
  description = "Prefix for resource names"
  type        = string
  default     = "iac-291323"
}

# Locals
locals {
  common_tags = {
    environment = "production"
    owner      = "DevOps"
    project    = "SecureApp"
  }
  
  naming_prefix = "${var.prefix}-secureapp"
  
  regions = {
    usw2 = "us-west-2"
    use1 = "us-east-1"
  }
}

# KMS Keys (Customer Managed)
resource "aws_kms_key" "main_usw2" {
  provider                = aws.usw2
  description             = "${local.naming_prefix}-SecureApp production encryption key - us-west-2"
  deletion_window_in_days = 7
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
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.us-west-2.amazonaws.com"
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
  
  tags = merge(local.common_tags, { Name = "${local.naming_prefix}-kms-key-usw2" })
}

resource "aws_kms_key" "main_use1" {
  provider                = aws.use1
  description             = "${local.naming_prefix}-SecureApp production encryption key - us-east-1"
  deletion_window_in_days = 7
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
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.us-east-1.amazonaws.com"
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
  
  tags = merge(local.common_tags, { Name = "${local.naming_prefix}-kms-key-use1" })
}

resource "aws_kms_alias" "main_usw2" {
  provider      = aws.usw2
  name          = "alias/${local.naming_prefix}-usw2"
  target_key_id = aws_kms_key.main_usw2.key_id
}

resource "aws_kms_alias" "main_use1" {
  provider      = aws.use1
  name          = "alias/${local.naming_prefix}-use1"
  target_key_id = aws_kms_key.main_use1.key_id
}

# Data sources
data "aws_caller_identity" "current" {}

# VPCs
resource "aws_vpc" "main_usw2" {
  provider             = aws.usw2
  cidr_block           = var.vpc_cidr_usw2
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name = "${local.naming_prefix}-vpc-usw2"
  })
}

resource "aws_vpc" "main_use1" {
  provider             = aws.use1
  cidr_block           = var.vpc_cidr_use1
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name = "${local.naming_prefix}-vpc-use1"
  })
}

# VPC Flow Logs
resource "aws_flow_log" "vpc_usw2" {
  provider        = aws.usw2
  iam_role_arn    = aws_iam_role.flow_log.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs_usw2.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main_usw2.id
  
  tags = merge(local.common_tags, { Name = "${local.naming_prefix}-vpc-flowlog-usw2" })
}

resource "aws_flow_log" "vpc_use1" {
  provider        = aws.use1
  iam_role_arn    = aws_iam_role.flow_log.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs_use1.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main_use1.id
  
  tags = merge(local.common_tags, { Name = "${local.naming_prefix}-vpc-flowlog-use1" })
}

# CloudWatch Log Groups for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs_usw2" {
  provider          = aws.usw2
  name              = "/aws/vpc/flowlogs/${local.naming_prefix}-usw2"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main_usw2.arn
  
  tags = merge(local.common_tags, { Name = "${local.naming_prefix}-vpc-flowlogs-usw2" })
}

resource "aws_cloudwatch_log_group" "vpc_flow_logs_use1" {
  provider          = aws.use1
  name              = "/aws/vpc/flowlogs/${local.naming_prefix}-use1"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.main_use1.arn
  
  tags = merge(local.common_tags, { Name = "${local.naming_prefix}-vpc-flowlogs-use1" })
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "flow_log" {
  name = "${local.naming_prefix}-vpc-flow-log-role"
  
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
  
  tags = merge(local.common_tags, { Name = "${local.naming_prefix}-vpc-flow-log-role" })
}

resource "aws_iam_role_policy" "flow_log" {
  name = "${local.naming_prefix}-vpc-flow-log-policy"
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

# Security Groups
resource "aws_security_group" "web_usw2" {
  provider    = aws.usw2
  name        = "${local.naming_prefix}-web-sg-usw2"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main_usw2.id
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_ingress_cidrs
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.naming_prefix}-web-sg-usw2"
  })
}

resource "aws_security_group" "web_use1" {
  provider    = aws.use1
  name        = "${local.naming_prefix}-web-sg-use1"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main_use1.id
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_ingress_cidrs
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.naming_prefix}-web-sg-use1"
  })
}

# S3 Buckets with encryption
resource "aws_s3_bucket" "app_data_usw2" {
  provider = aws.usw2
  bucket   = "${local.naming_prefix}-app-data-usw2"
  
  tags = merge(local.common_tags, { Name = "${local.naming_prefix}-app-data-usw2" })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_data_usw2" {
  provider = aws.usw2
  bucket   = aws_s3_bucket.app_data_usw2.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main_usw2.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket" "app_data_use1" {
  provider = aws.use1
  bucket   = "${local.naming_prefix}-app-data-use1"
  
  tags = merge(local.common_tags, { Name = "${local.naming_prefix}-app-data-use1" })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_data_use1" {
  provider = aws.use1
  bucket   = aws_s3_bucket.app_data_use1.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main_use1.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket for CloudTrail logs (in logging account)
resource "aws_s3_bucket" "cloudtrail_logs" {
  provider = aws.use1
  bucket   = "${local.naming_prefix}-cloudtrail-logs"
  
  tags = merge(local.common_tags, { Name = "${local.naming_prefix}-cloudtrail-logs" })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs" {
  provider = aws.use1
  bucket   = aws_s3_bucket.cloudtrail_logs.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main_use1.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_policy" "cloudtrail_logs" {
  provider = aws.use1
  bucket   = aws_s3_bucket.cloudtrail_logs.id
  
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

# CloudTrail (conditional - only create if not hitting the 5-trail limit)
variable "create_cloudtrail" {
  description = "Whether to create CloudTrail (set to false if you already have max trails)"
  type        = bool
  default     = true
}

resource "aws_cloudtrail" "main" {
  count          = var.create_cloudtrail ? 1 : 0
  name           = "${local.naming_prefix}-cloudtrail"
  s3_bucket_name = aws_s3_bucket.cloudtrail_logs.bucket

  is_multi_region_trail         = true
  include_global_service_events = true
  is_organization_trail         = false
  enable_logging                = true

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.cloudtrail_logs.arn}/"]
    }
  }

  tags = merge(local.common_tags, { Name = "${local.naming_prefix}-cloudtrail" })
}

# RDS Subnet Groups
resource "aws_db_subnet_group" "main_usw2" {
  provider   = aws.usw2
  name       = "${local.naming_prefix}-db-subnet-group-usw2"
  subnet_ids = [aws_subnet.private_usw2_a.id, aws_subnet.private_usw2_b.id]
  
  tags = merge(local.common_tags, {
    Name = "${local.naming_prefix}-db-subnet-group-usw2"
  })
}

resource "aws_db_subnet_group" "main_use1" {
  provider   = aws.use1
  name       = "${local.naming_prefix}-db-subnet-group-use1"
  subnet_ids = [aws_subnet.private_use1_a.id, aws_subnet.private_use1_b.id]
  
  tags = merge(local.common_tags, {
    Name = "${local.naming_prefix}-db-subnet-group-use1"
  })
}

# Private Subnets for RDS
resource "aws_subnet" "private_usw2_a" {
  provider          = aws.usw2
  vpc_id            = aws_vpc.main_usw2.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-west-2a"
  
  tags = merge(local.common_tags, {
    Name = "${local.naming_prefix}-private-subnet-usw2a"
  })
}

resource "aws_subnet" "private_usw2_b" {
  provider          = aws.usw2
  vpc_id            = aws_vpc.main_usw2.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-west-2b"
  
  tags = merge(local.common_tags, {
    Name = "${local.naming_prefix}-private-subnet-usw2b"
  })
}

resource "aws_subnet" "private_use1_a" {
  provider          = aws.use1
  vpc_id            = aws_vpc.main_use1.id
  cidr_block        = "10.1.1.0/24"
  availability_zone = "us-east-1a"
  
  tags = merge(local.common_tags, {
    Name = "${local.naming_prefix}-private-subnet-use1a"
  })
}

resource "aws_subnet" "private_use1_b" {
  provider          = aws.use1
  vpc_id            = aws_vpc.main_use1.id
  cidr_block        = "10.1.2.0/24"
  availability_zone = "us-east-1b"
  
  tags = merge(local.common_tags, {
    Name = "${local.naming_prefix}-private-subnet-use1b"
  })
}

# RDS Security Groups
resource "aws_security_group" "rds_usw2" {
  provider    = aws.usw2
  name        = "${local.naming_prefix}-rds-sg-usw2"
  description = "Security group for RDS instances"
  vpc_id      = aws_vpc.main_usw2.id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web_usw2.id]
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.naming_prefix}-rds-sg-usw2"
  })
}

resource "aws_security_group" "rds_use1" {
  provider    = aws.use1
  name        = "${local.naming_prefix}-rds-sg-use1"
  description = "Security group for RDS instances"
  vpc_id      = aws_vpc.main_use1.id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web_use1.id]
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.naming_prefix}-rds-sg-use1"
  })
}

# RDS Instances (not publicly accessible, encrypted)
resource "aws_db_instance" "main_usw2" {
  provider = aws.usw2

  identifier     = "${local.naming_prefix}-db-usw2"
  engine         = "postgres"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.main_usw2.arn

  db_name  = "secureapp"
  username = "dbadmin"
  password = "ChangeMe123!"

  vpc_security_group_ids = [aws_security_group.rds_usw2.id]
  db_subnet_group_name   = aws_db_subnet_group.main_usw2.name

  publicly_accessible = false
  skip_final_snapshot = true

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  tags = merge(local.common_tags, { Name = "${local.naming_prefix}-db-usw2" })
}

resource "aws_db_instance" "main_use1" {
  provider = aws.use1

  identifier     = "${local.naming_prefix}-db-use1"
  engine         = "postgres"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.main_use1.arn

  db_name  = "secureapp"
  username = "dbadmin"
  password = "ChangeMe123!"

  vpc_security_group_ids = [aws_security_group.rds_use1.id]
  db_subnet_group_name   = aws_db_subnet_group.main_use1.name

  publicly_accessible = false
  skip_final_snapshot = true

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  tags = merge(local.common_tags, { Name = "${local.naming_prefix}-db-use1" })
}

# API Gateway VPC Endpoints (for private API Gateway)
resource "aws_vpc_endpoint" "api_gateway_usw2" {
  provider            = aws.usw2
  vpc_id              = aws_vpc.main_usw2.id
  service_name        = "com.amazonaws.us-west-2.execute-api"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.private_usw2_a.id, aws_subnet.private_usw2_b.id]
  security_group_ids  = [aws_security_group.web_usw2.id]
  private_dns_enabled = true
  
  tags = merge(local.common_tags, {
    Name = "${local.naming_prefix}-api-gateway-endpoint-usw2"
  })
}

resource "aws_vpc_endpoint" "api_gateway_use1" {
  provider            = aws.use1
  vpc_id              = aws_vpc.main_use1.id
  service_name        = "com.amazonaws.us-east-1.execute-api"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.private_use1_a.id, aws_subnet.private_use1_b.id]
  security_group_ids  = [aws_security_group.web_use1.id]
  private_dns_enabled = true
  
  tags = merge(local.common_tags, {
    Name = "${local.naming_prefix}-api-gateway-endpoint-use1"
  })
}

# AWS Config (conditional due to account limits)
variable "create_config" {
  description = "Whether to create AWS Config resources (set to false if you already have Config enabled)"
  type        = bool
  default     = true
}

# Only create Config in one region to avoid limits
resource "aws_config_configuration_recorder" "main_usw2" {
  count    = var.create_config ? 1 : 0
  provider = aws.usw2
  name     = "${local.naming_prefix}-config-recorder-usw2"
  role_arn = aws_iam_role.config.arn
  
  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

resource "aws_config_delivery_channel" "main_usw2" {
  count          = var.create_config ? 1 : 0
  provider       = aws.usw2
  name           = "${local.naming_prefix}-config-delivery-usw2"
  s3_bucket_name = aws_s3_bucket.config_usw2.bucket
  
  s3_key_prefix = "config"
}

# S3 Buckets for AWS Config
resource "aws_s3_bucket" "config_usw2" {
  provider = aws.usw2
  bucket   = "${local.naming_prefix}-config-usw2"
  
  tags = merge(local.common_tags, { Name = "${local.naming_prefix}-config-usw2" })
}

resource "aws_s3_bucket" "config_use1" {
  provider = aws.use1
  bucket   = "${local.naming_prefix}-config-use1"

  tags = merge(local.common_tags, { Name = "${local.naming_prefix}-config-use1" })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config_usw2" {
  provider = aws.usw2
  bucket   = aws_s3_bucket.config_usw2.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main_usw2.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# S3 bucket policy for AWS Config
resource "aws_s3_bucket_policy" "config_usw2" {
  provider = aws.usw2
  bucket   = aws_s3_bucket.config_usw2.id
  
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
        Resource = aws_s3_bucket.config_usw2.arn
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
        Resource = aws_s3_bucket.config_usw2.arn
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
        Resource = "${aws_s3_bucket.config_usw2.arn}/*"
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

# IAM Role for AWS Config
resource "aws_iam_role" "config" {
  name = "${local.naming_prefix}-config-role"
  
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
  
  tags = merge(local.common_tags, { Name = "${local.naming_prefix}-config-role" })
}

resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

# IAM Policy for MFA enforcement
resource "aws_iam_policy" "mfa_enforcement" {
  name        = "${local.naming_prefix}-mfa-enforcement"
  description = "Policy to enforce MFA for all users"
  
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
        Sid       = "DenyAllExceptUnlessSignedInWithMFA"
        Effect    = "Deny"
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
  
  tags = merge(local.common_tags, { Name = "${local.naming_prefix}-mfa-enforcement" })
}


# GuardDuty detectors (conditional)
variable "create_guardduty" {
  description = "Whether to create GuardDuty detectors in each region"
  type        = bool
  default     = false
}

resource "aws_guardduty_detector" "usw2" {
  count                        = var.create_guardduty ? 1 : 0
  provider                     = aws.usw2
  enable                       = true
  finding_publishing_frequency = "FIFTEEN_MINUTES"

  tags = merge(local.common_tags, { Name = "${local.naming_prefix}-guardduty-usw2" })
}

resource "aws_guardduty_detector" "use1" {
  count                        = var.create_guardduty ? 1 : 0
  provider                     = aws.use1
  enable                       = true
  finding_publishing_frequency = "FIFTEEN_MINUTES"

  tags = merge(local.common_tags, { Name = "${local.naming_prefix}-guardduty-use1" })
}

# EBS encryption by default (per region) + default KMS key
resource "aws_ebs_encryption_by_default" "usw2" {
  provider = aws.usw2
  enabled  = true
}

resource "aws_ebs_default_kms_key" "usw2" {
  provider   = aws.usw2
  key_arn    = aws_kms_key.main_usw2.arn
  depends_on = [aws_ebs_encryption_by_default.usw2]
}

resource "aws_ebs_encryption_by_default" "use1" {
  provider = aws.use1
  enabled  = true
}

resource "aws_ebs_default_kms_key" "use1" {
  provider   = aws.use1
  key_arn    = aws_kms_key.main_use1.arn
  depends_on = [aws_ebs_encryption_by_default.use1]
}


# Output important resource information - flattened for integration tests
output "kms_key_ids_usw2" {
  description = "KMS Key ID for us-west-2"
  value = aws_kms_key.main_usw2.key_id
}

output "kms_key_ids_use1" {
  description = "KMS Key ID for us-east-1"
  value = aws_kms_key.main_use1.key_id
}

output "vpc_ids_usw2" {
  description = "VPC ID for us-west-2"
  value = aws_vpc.main_usw2.id
}

output "vpc_ids_use1" {
  description = "VPC ID for us-east-1"
  value = aws_vpc.main_use1.id
}

output "cloudtrail_arn" {
  description = "CloudTrail ARN"
  value = var.create_cloudtrail ? aws_cloudtrail.main[0].arn : "not_created"
}

output "config_recorder_name" {
  description = "AWS Config Recorder name (when enabled)"
  value = var.create_config ? aws_config_configuration_recorder.main_usw2[0].name : "not_created"
}