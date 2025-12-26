########################
# Variables
########################
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-west-2"
}

variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
  default     = ""
}

variable "bucket_name" {
  description = "Name of the secure S3 bucket"
  type        = string
  default     = "secure-audit-bucket-trainr902"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name for resource tagging"
  type        = string
  default     = "secure-s3-infrastructure"
}

variable "enable_cloudwatch_alarms" {
  description = "Enable CloudWatch metric alarms (set to false for LocalStack compatibility)"
  type        = bool
  default     = true
}

locals {
  environment_suffix       = var.environment_suffix != "" ? var.environment_suffix : "synthtrainr902"
  bucket_name              = "${var.bucket_name}-${local.environment_suffix}"
  project_name_with_suffix = "${var.project_name}-${local.environment_suffix}"
}

########################
# KMS Key for Encryption
########################

# Customer-managed KMS key for S3 encryption
resource "aws_kms_key" "s3_encryption_key" {
  description             = "KMS key for S3 bucket encryption - ${local.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  multi_region            = false

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
        Sid    = "Allow S3 Service"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "s3.${var.aws_region}.amazonaws.com"
          }
        }
      },
      {
        Sid    = "Allow CloudTrail Service"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt*",
          "kms:Decrypt*",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/cloudtrail/${local.project_name_with_suffix}"
          }
        }
      }
    ]
  })

  tags = {
    Name              = "${local.project_name_with_suffix}-s3-encryption-key"
    Environment       = var.environment
    EnvironmentSuffix = local.environment_suffix
    Purpose           = "S3-KMS-Encryption"
    ManagedBy         = "terraform"
  }
}

resource "aws_kms_alias" "s3_encryption_key_alias" {
  name          = "alias/${local.project_name_with_suffix}-s3-key"
  target_key_id = aws_kms_key.s3_encryption_key.key_id
}

data "aws_caller_identity" "current" {}

########################
# S3 Bucket
########################

# Secure S3 bucket with comprehensive configuration
resource "aws_s3_bucket" "secure_bucket" {
  bucket        = local.bucket_name
  force_destroy = true

  tags = {
    Name              = local.bucket_name
    Environment       = var.environment
    EnvironmentSuffix = local.environment_suffix
    Project           = var.project_name
    Purpose           = "Secure-Auditable-Storage"
    ManagedBy         = "terraform"
    Compliance        = "High-Security"
  }
}

# Block all public access
resource "aws_s3_bucket_public_access_block" "secure_bucket_pab" {
  bucket = aws_s3_bucket.secure_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning with MFA Delete
resource "aws_s3_bucket_versioning" "secure_bucket_versioning" {
  bucket = aws_s3_bucket.secure_bucket.id

  versioning_configuration {
    status = "Enabled"
    # Note: MFA Delete can only be enabled via AWS CLI or API with MFA authentication
    # It cannot be managed through Terraform. This must be done manually after deployment
    # mfa_delete = "Enabled"
  }
}

# Server-side encryption with KMS
resource "aws_s3_bucket_server_side_encryption_configuration" "secure_bucket_encryption" {
  bucket = aws_s3_bucket.secure_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_encryption_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# Lifecycle configuration for data retention
resource "aws_s3_bucket_lifecycle_configuration" "secure_bucket_lifecycle" {
  bucket = aws_s3_bucket.secure_bucket.id

  rule {
    id     = "comprehensive_lifecycle_rule"
    status = "Enabled"

    # Apply to all objects in the bucket
    filter {}

    # Transition to Intelligent Tiering
    transition {
      days          = 30
      storage_class = "INTELLIGENT_TIERING"
    }

    # Transition to Glacier
    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    # Transition to Deep Archive
    transition {
      days          = 180
      storage_class = "DEEP_ARCHIVE"
    }

    # Delete objects after 7 years
    expiration {
      days = 2555
    }

    # Clean up incomplete multipart uploads
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }

    # Lifecycle for non-current versions
    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "INTELLIGENT_TIERING"
    }

    noncurrent_version_transition {
      noncurrent_days = 90
      storage_class   = "GLACIER"
    }

    noncurrent_version_transition {
      noncurrent_days = 180
      storage_class   = "DEEP_ARCHIVE"
    }

    noncurrent_version_expiration {
      noncurrent_days = 2555
    }
  }
}

########################
# Cross-Region Replication
########################

# IAM role for S3 replication
resource "aws_iam_role" "replication_role" {
  name = "${local.project_name_with_suffix}-s3-replication-role"

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

  tags = {
    Name              = "${local.project_name_with_suffix}-s3-replication-role"
    Environment       = var.environment
    EnvironmentSuffix = local.environment_suffix
    Project           = var.project_name
    ManagedBy         = "terraform"
  }
}

# IAM policy for S3 replication
resource "aws_iam_role_policy" "replication_policy" {
  name = "${local.project_name_with_suffix}-s3-replication-policy"
  role = aws_iam_role.replication_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.secure_bucket.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = "${aws_s3_bucket.secure_bucket.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = "${aws_s3_bucket.replica_bucket.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.s3_encryption_key.arn,
          aws_kms_key.replica_encryption_key.arn
        ]
      }
    ]
  })
}

# Replica bucket in us-east-1
resource "aws_s3_bucket" "replica_bucket" {
  provider      = aws.replica
  bucket        = "${local.bucket_name}-replica"
  force_destroy = true

  tags = {
    Name              = "${local.bucket_name}-replica"
    Environment       = var.environment
    EnvironmentSuffix = local.environment_suffix
    Project           = var.project_name
    Purpose           = "Cross-Region-Replica"
    ManagedBy         = "terraform"
  }
}

# Block public access for replica bucket
resource "aws_s3_bucket_public_access_block" "replica_bucket_pab" {
  provider = aws.replica
  bucket   = aws_s3_bucket.replica_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning on replica bucket
resource "aws_s3_bucket_versioning" "replica_bucket_versioning" {
  provider = aws.replica
  bucket   = aws_s3_bucket.replica_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

# KMS key for replica bucket encryption
resource "aws_kms_key" "replica_encryption_key" {
  provider                = aws.replica
  description             = "KMS key for S3 replica bucket encryption - ${local.environment_suffix}"
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
        Sid    = "Allow S3 Service"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "s3.us-east-1.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = {
    Name              = "${local.project_name_with_suffix}-replica-encryption-key"
    Environment       = var.environment
    EnvironmentSuffix = local.environment_suffix
    Purpose           = "S3-Replica-Encryption"
    ManagedBy         = "terraform"
  }
}

resource "aws_kms_alias" "replica_encryption_key_alias" {
  provider      = aws.replica
  name          = "alias/${local.project_name_with_suffix}-replica-key"
  target_key_id = aws_kms_key.replica_encryption_key.key_id
}

# Server-side encryption for replica bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "replica_bucket_encryption" {
  provider = aws.replica
  bucket   = aws_s3_bucket.replica_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.replica_encryption_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 bucket replication configuration
resource "aws_s3_bucket_replication_configuration" "replication" {
  role   = aws_iam_role.replication_role.arn
  bucket = aws_s3_bucket.secure_bucket.id

  rule {
    id     = "replicate-all-objects"
    status = "Enabled"

    delete_marker_replication {
      status = "Enabled"
    }

    filter {}

    destination {
      bucket        = aws_s3_bucket.replica_bucket.arn
      storage_class = "STANDARD"

      encryption_configuration {
        replica_kms_key_id = aws_kms_key.replica_encryption_key.arn
      }
    }

    source_selection_criteria {
      sse_kms_encrypted_objects {
        status = "Enabled"
      }
    }
  }

  depends_on = [
    aws_s3_bucket_versioning.secure_bucket_versioning,
    aws_s3_bucket_versioning.replica_bucket_versioning
  ]
}

# Bucket policy for TLS enforcement
resource "aws_s3_bucket_policy" "secure_bucket_policy" {
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
      },
      {
        Sid       = "DenyUnencryptedUploads"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.secure_bucket.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.secure_bucket_pab]
}

########################
# CloudTrail Configuration
########################

# CloudTrail S3 bucket for logs
resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket        = "${local.bucket_name}-cloudtrail-logs"
  force_destroy = true

  tags = {
    Name              = "${local.bucket_name}-cloudtrail-logs"
    Environment       = var.environment
    EnvironmentSuffix = local.environment_suffix
    Project           = var.project_name
    Purpose           = "CloudTrail-Logs"
    ManagedBy         = "terraform"
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_logs_pab" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudTrail S3 bucket policy
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
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.cloudtrail_logs_pab]
}

# CloudWatch Log Group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail_log_group" {
  name              = "/aws/cloudtrail/${local.project_name_with_suffix}"
  retention_in_days = 90
  # CloudWatch Logs doesn't support DSSE-KMS, so we'll let it use default encryption

  tags = {
    Name              = "${local.project_name_with_suffix}-cloudtrail-logs"
    Environment       = var.environment
    EnvironmentSuffix = local.environment_suffix
    Project           = var.project_name
    ManagedBy         = "terraform"
  }
}

# IAM role for CloudTrail
resource "aws_iam_role" "cloudtrail_role" {
  name = "${local.project_name_with_suffix}-cloudtrail-role"

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
    Name              = "${local.project_name_with_suffix}-cloudtrail-role"
    Environment       = var.environment
    EnvironmentSuffix = local.environment_suffix
    Project           = var.project_name
    ManagedBy         = "terraform"
  }
}

# IAM policy for CloudTrail to write to CloudWatch
resource "aws_iam_role_policy" "cloudtrail_logs_policy" {
  name = "${local.project_name_with_suffix}-cloudtrail-logs-policy"
  role = aws_iam_role.cloudtrail_role.id

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
        Resource = "${aws_cloudwatch_log_group.cloudtrail_log_group.arn}:*"
      }
    ]
  })
}

# CloudTrail configuration - Commented due to AWS account limit (5 CloudTrails max per region)
# Note: The account already has 5 CloudTrails in us-west-2. Uncomment when limit is increased or trails are removed.
# resource "aws_cloudtrail" "s3_audit_trail" {
#   name                          = "${local.project_name_with_suffix}-audit-trail"
#   s3_bucket_name                = aws_s3_bucket.cloudtrail_logs.bucket
#   s3_key_prefix                 = "cloudtrail-logs"
#   include_global_service_events = true
#   is_multi_region_trail         = false
#   enable_logging                = true
#   enable_log_file_validation    = true
#   kms_key_id                    = aws_kms_key.s3_encryption_key.arn

#   cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail_log_group.arn}:*"
#   cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_role.arn

#   # Data events for S3 bucket
#   event_selector {
#     read_write_type           = "All"
#     include_management_events = true

#     data_resource {
#       type   = "AWS::S3::Object"
#       values = ["${aws_s3_bucket.secure_bucket.arn}/*"]
#     }
#   }

#   tags = {
#     Name              = "${local.project_name_with_suffix}-audit-trail"
#     Environment       = var.environment
#     EnvironmentSuffix = local.environment_suffix
#     Project           = var.project_name
#     ManagedBy         = "terraform"
#   }

#   depends_on = [
#     aws_s3_bucket_policy.cloudtrail_logs_policy,
#     aws_iam_role_policy.cloudtrail_logs_policy
#   ]
# }

########################
# CloudWatch Monitoring
########################

# CloudWatch Alarms for security monitoring
# Note: Alarms are conditionally created due to LocalStack compatibility issues
resource "aws_cloudwatch_metric_alarm" "unauthorized_s3_access" {
  count               = var.enable_cloudwatch_alarms ? 1 : 0
  alarm_name          = "${local.project_name_with_suffix}-unauthorized-s3-access"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ErrorCount"
  namespace           = "CloudWatchLogs"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors unauthorized S3 access attempts"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  dimensions = {
    LogGroupName = aws_cloudwatch_log_group.cloudtrail_log_group.name
  }

  tags = {
    Name              = "${local.project_name_with_suffix}-unauthorized-access-alarm"
    Environment       = var.environment
    EnvironmentSuffix = local.environment_suffix
    Project           = var.project_name
    ManagedBy         = "terraform"
  }
}

# Metric filter for unauthorized access
resource "aws_cloudwatch_log_metric_filter" "unauthorized_access_filter" {
  name           = "${local.project_name_with_suffix}-unauthorized-access"
  log_group_name = aws_cloudwatch_log_group.cloudtrail_log_group.name
  pattern        = "[timestamp, request_id, event_type=\"AwsApiCall\", event_source=\"s3.amazonaws.com\", event_name=\"GetObject\" || event_name=\"PutObject\", error_code=\"AccessDenied\" || error_code=\"Forbidden\"]"

  metric_transformation {
    name      = "UnauthorizedS3Access"
    namespace = "Security/S3"
    value     = "1"
  }
}

# SNS topic for security alerts
resource "aws_sns_topic" "security_alerts" {
  name              = "${local.project_name_with_suffix}-security-alerts"
  kms_master_key_id = aws_kms_key.s3_encryption_key.arn

  tags = {
    Name              = "${local.project_name_with_suffix}-security-alerts"
    Environment       = var.environment
    EnvironmentSuffix = local.environment_suffix
    Project           = var.project_name
    ManagedBy         = "terraform"
  }
}

# CloudWatch alarm for bucket policy violations
# Note: Alarms are conditionally created due to LocalStack compatibility issues
resource "aws_cloudwatch_metric_alarm" "bucket_policy_violations" {
  count               = var.enable_cloudwatch_alarms ? 1 : 0
  alarm_name          = "${local.project_name_with_suffix}-bucket-policy-violations"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "PolicyViolations"
  namespace           = "Security/S3"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors bucket policy violations"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = {
    Name              = "${local.project_name_with_suffix}-policy-violations-alarm"
    Environment       = var.environment
    EnvironmentSuffix = local.environment_suffix
    Project           = var.project_name
    ManagedBy         = "terraform"
  }
}

# Log metric filter for bucket policy violations
resource "aws_cloudwatch_log_metric_filter" "policy_violations_filter" {
  name           = "${local.project_name_with_suffix}-policy-violations"
  log_group_name = aws_cloudwatch_log_group.cloudtrail_log_group.name
  pattern        = "[timestamp, request_id, event_type=\"AwsApiCall\", event_source=\"s3.amazonaws.com\", error_code=\"AccessDenied\"]"

  metric_transformation {
    name      = "PolicyViolations"
    namespace = "Security/S3"
    value     = "1"
  }
}

########################
# Outputs
########################

output "s3_bucket_name" {
  description = "Name of the created S3 bucket"
  value       = aws_s3_bucket.secure_bucket.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the created S3 bucket"
  value       = aws_s3_bucket.secure_bucket.arn
}

output "kms_key_id" {
  description = "ID of the KMS key used for encryption"
  value       = aws_kms_key.s3_encryption_key.key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for encryption"
  value       = aws_kms_key.s3_encryption_key.arn
}

# output "cloudtrail_arn" {
#   description = "ARN of the CloudTrail"
#   value       = aws_cloudtrail.s3_audit_trail.arn
# }

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.cloudtrail_log_group.name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for security alerts"
  value       = aws_sns_topic.security_alerts.arn
}

output "replica_bucket_name" {
  description = "Name of the replica S3 bucket"
  value       = aws_s3_bucket.replica_bucket.bucket
}

output "replica_bucket_arn" {
  description = "ARN of the replica S3 bucket"
  value       = aws_s3_bucket.replica_bucket.arn
}

output "replica_kms_key_id" {
  description = "ID of the KMS key used for replica bucket encryption"
  value       = aws_kms_key.replica_encryption_key.key_id
}

output "cloudtrail_logs_bucket" {
  description = "Name of the CloudTrail logs S3 bucket"
  value       = aws_s3_bucket.cloudtrail_logs.bucket
}
