# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Variables
variable "environment_suffix" {
  description = "Unique suffix for resource names"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "enable_guardduty" {
  description = "Enable GuardDuty"
  type        = bool
  default     = false
}

variable "cloudtrail_retention_days" {
  description = "CloudTrail log retention"
  type        = number
  default     = 90
}

variable "cloudwatch_log_retention_days" {
  description = "CloudWatch log retention"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default = {
    Project     = "ZeroTrustArchitecture"
    ManagedBy   = "Terraform"
    Environment = "Production"
  }
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "zero-trust-vpc-${var.environment_suffix}"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "zero-trust-private-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "Private"
  }
}

# Security Group
resource "aws_security_group" "data_processing" {
  name_prefix = "zero-trust-data-processing-${var.environment_suffix}-"
  description = "Security group for data processing"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "HTTPS to AWS services"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "zero-trust-sg-${var.environment_suffix}"
  }
}

# KMS Keys
resource "aws_kms_key" "main" {
  description             = "KMS key for zero-trust architecture"
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
        Sid    = "Allow CloudTrail to encrypt logs"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:DecryptDataKey"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "kms:EncryptionContext:aws:cloudtrail:arn" = "arn:aws:cloudtrail:*:${data.aws_caller_identity.current.account_id}:trail/*"
          }
        }
      },
      {
        Sid    = "Allow CloudTrail to describe key"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "kms:DescribeKey"
        Resource = "*"
      },
      {
        Sid    = "Allow S3 to use the key"
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
    Name = "zero-trust-kms-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/zero-trust-main-${var.environment_suffix}"
  target_key_id = aws_kms_key.main.key_id
}

resource "aws_kms_key" "cloudwatch" {
  description             = "KMS key for CloudWatch logs"
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
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
          }
        }
      }
    ]
  })

  tags = {
    Name = "zero-trust-cloudwatch-kms-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "cloudwatch" {
  name          = "alias/zero-trust-cloudwatch-${var.environment_suffix}"
  target_key_id = aws_kms_key.cloudwatch.key_id
}

# S3 Buckets
resource "aws_s3_bucket" "sensitive_data" {
  bucket        = "zero-trust-sensitive-data-${var.environment_suffix}"
  force_destroy = true

  tags = {
    Name        = "zero-trust-sensitive-data-${var.environment_suffix}"
    Sensitivity = "High"
  }
}

resource "aws_s3_bucket_versioning" "sensitive_data" {
  bucket = aws_s3_bucket.sensitive_data.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "sensitive_data" {
  bucket = aws_s3_bucket.sensitive_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "sensitive_data" {
  bucket = aws_s3_bucket.sensitive_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "sensitive_data" {
  bucket = aws_s3_bucket.sensitive_data.id

  rule {
    id     = "transition-to-intelligent-tiering"
    status = "Enabled"

    filter {}

    transition {
      days          = 30
      storage_class = "INTELLIGENT_TIERING"
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# CloudTrail
resource "aws_s3_bucket" "cloudtrail" {
  bucket        = "zero-trust-cloudtrail-${var.environment_suffix}"
  force_destroy = true

  tags = {
    Name = "zero-trust-cloudtrail-${var.environment_suffix}"
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

resource "aws_cloudtrail" "main" {
  name                          = "zero-trust-trail-${var.environment_suffix}"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.main.arn

  depends_on = [aws_s3_bucket_policy.cloudtrail]

  tags = {
    Name = "zero-trust-trail-${var.environment_suffix}"
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "flow_logs" {
  name              = "/aws/vpc/flow-logs-${var.environment_suffix}"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = {
    Name = "zero-trust-flow-logs-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/application-${var.environment_suffix}"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch.arn

  tags = {
    Name = "zero-trust-application-${var.environment_suffix}"
  }
}

# IAM Roles
resource "aws_iam_role" "flow_logs" {
  name = "zero-trust-flow-logs-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "zero-trust-flow-logs-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy" "flow_logs" {
  name = "zero-trust-flow-logs-policy"
  role = aws_iam_role.flow_logs.id

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
        Resource = "*"
      }
    ]
  })
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  vpc_id          = aws_vpc.main.id
  traffic_type    = "ALL"
  iam_role_arn    = aws_iam_role.flow_logs.arn
  log_destination = aws_cloudwatch_log_group.flow_logs.arn

  tags = {
    Name = "zero-trust-flow-logs-${var.environment_suffix}"
  }
}

# VPC Endpoints
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${data.aws_region.current.name}.s3"

  tags = {
    Name = "zero-trust-s3-endpoint-${var.environment_suffix}"
  }
}

resource "aws_vpc_endpoint" "kms" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.kms"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.data_processing.id]
  private_dns_enabled = true

  tags = {
    Name = "zero-trust-kms-endpoint-${var.environment_suffix}"
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls" {
  alarm_name          = "zero-trust-unauthorized-api-calls-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "CloudTrailMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Monitors for unauthorized API calls"
  treat_missing_data  = "notBreaching"

  tags = {
    Name = "zero-trust-unauthorized-api-alarm-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "root_account_usage" {
  alarm_name          = "zero-trust-root-account-usage-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "RootAccountUsage"
  namespace           = "CloudTrailMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Monitors for root account usage"
  treat_missing_data  = "notBreaching"

  tags = {
    Name = "zero-trust-root-usage-alarm-${var.environment_suffix}"
  }
}

# GuardDuty (optional)
resource "aws_guardduty_detector" "main" {
  count = var.enable_guardduty ? 1 : 0

  enable = true

  tags = {
    Name = "zero-trust-guardduty-${var.environment_suffix}"
  }
}

# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.data_processing.id
}

output "kms_key_id" {
  description = "ID of the main KMS key"
  value       = aws_kms_key.main.id
}

output "kms_key_arn" {
  description = "ARN of the main KMS key"
  value       = aws_kms_key.main.arn
}

output "sensitive_data_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.sensitive_data.id
}

output "sensitive_data_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.sensitive_data.arn
}

output "cloudtrail_name" {
  description = "Name of CloudTrail"
  value       = aws_cloudtrail.main.name
}

output "cloudtrail_arn" {
  description = "ARN of CloudTrail"
  value       = aws_cloudtrail.main.arn
}

output "flow_logs_log_group" {
  description = "CloudWatch log group for VPC Flow Logs"
  value       = aws_cloudwatch_log_group.flow_logs.name
}

output "application_log_group" {
  description = "CloudWatch log group for application logs"
  value       = aws_cloudwatch_log_group.application.name
}

output "guardduty_detector_id" {
  description = "ID of GuardDuty detector"
  value       = var.enable_guardduty ? aws_guardduty_detector.main[0].id : null
}
