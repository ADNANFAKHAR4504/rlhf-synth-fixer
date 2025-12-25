# Terraform Infrastructure - Ideal Response

This is the refined and production-ready Terraform configuration for a secure S3 bucket with comprehensive monitoring and compliance features.

## provider.tf
```hcl
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}

# Secondary AWS provider for replication
provider "aws" {
  alias  = "replica"
  region = "us-east-1"
}
```

## tap_stack.tf
```hcl
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

locals {
  environment_suffix       = var.environment_suffix != "" ? var.environment_suffix : "synthtrainr902"
  bucket_name              = "${var.bucket_name}-${local.environment_suffix}"
  project_name_with_suffix = "${var.project_name}-${local.environment_suffix}"
}

########################
# Data Sources
########################
data "aws_caller_identity" "current" {}

########################
# KMS Key for Encryption
########################
resource "aws_kms_key" "s3_encryption_key" {
  description             = "KMS key for S3 bucket encryption with DSSE-KMS - ${local.environment_suffix}"
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
    Purpose           = "S3-DSSE-KMS-Encryption"
    ManagedBy         = "terraform"
  }
}

resource "aws_kms_alias" "s3_encryption_key_alias" {
  name          = "alias/${local.project_name_with_suffix}-s3-key"
  target_key_id = aws_kms_key.s3_encryption_key.key_id
}

########################
# S3 Buckets
########################
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

resource "aws_s3_bucket_public_access_block" "secure_bucket_pab" {
  bucket = aws_s3_bucket.secure_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "secure_bucket_versioning" {
  bucket = aws_s3_bucket.secure_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "secure_bucket_encryption" {
  bucket = aws_s3_bucket.secure_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_encryption_key.arn
      sse_algorithm     = "aws:kms:dsse"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "secure_bucket_lifecycle" {
  bucket = aws_s3_bucket.secure_bucket.id

  rule {
    id     = "comprehensive_lifecycle_rule"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "INTELLIGENT_TIERING"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 180
      storage_class = "DEEP_ARCHIVE"
    }

    expiration {
      days = 2555
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }

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
            "s3:x-amz-server-side-encryption" = "aws:kms:dsse"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.secure_bucket_pab]
}

########################
# CloudTrail Support
########################
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
      sse_algorithm     = "aws:kms:dsse"
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

########################
# CloudWatch Monitoring
########################
resource "aws_cloudwatch_log_group" "cloudtrail_log_group" {
  name              = "/aws/cloudtrail/${local.project_name_with_suffix}"
  retention_in_days = 90

  tags = {
    Name              = "${local.project_name_with_suffix}-cloudtrail-logs"
    Environment       = var.environment
    EnvironmentSuffix = local.environment_suffix
    Project           = var.project_name
    ManagedBy         = "terraform"
  }
}

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

# CloudTrail resource commented out due to AWS account limits
# Uncomment when limits are increased or in production deployment
# resource "aws_cloudtrail" "s3_audit_trail" {
#   name                          = "${local.project_name_with_suffix}-audit-trail"
#   s3_bucket_name                = aws_s3_bucket.cloudtrail_logs.bucket
#   s3_key_prefix                 = "cloudtrail-logs"
#   include_global_service_events = true
#   is_multi_region_trail         = false
#   enable_logging                = true
#   enable_log_file_validation    = true
#   kms_key_id                    = aws_kms_key.s3_encryption_key.arn
#   cloud_watch_logs_group_arn    = "${aws_cloudwatch_log_group.cloudtrail_log_group.arn}:*"
#   cloud_watch_logs_role_arn     = aws_iam_role.cloudtrail_role.arn
#
#   event_selector {
#     read_write_type           = "All"
#     include_management_events = true
#     data_resource {
#       type   = "AWS::S3::Object"
#       values = ["${aws_s3_bucket.secure_bucket.arn}/*"]
#     }
#   }
#
#   tags = {
#     Name              = "${local.project_name_with_suffix}-audit-trail"
#     Environment       = var.environment
#     EnvironmentSuffix = local.environment_suffix
#     Project           = var.project_name
#     ManagedBy         = "terraform"
#   }
#
#   depends_on = [
#     aws_s3_bucket_policy.cloudtrail_logs_policy,
#     aws_iam_role_policy.cloudtrail_logs_policy
#   ]
# }

########################
# CloudWatch Alarms
########################
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

resource "aws_cloudwatch_metric_alarm" "unauthorized_s3_access" {
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

resource "aws_cloudwatch_metric_alarm" "bucket_policy_violations" {
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

# output "cloudtrail_arn" {
#   description = "ARN of the CloudTrail"
#   value       = aws_cloudtrail.s3_audit_trail.arn
# }
```

## Key Features

1. **DSSE-KMS Encryption**: Implements dual-layer server-side encryption using AWS KMS for maximum security
2. **Cross-Region Replication**: Automatic replication to us-east-1 for disaster recovery and compliance
3. **Complete Access Control**: All public access is blocked, TLS is enforced, and unencrypted uploads are denied
4. **Versioning with MFA Delete Support**: Enabled to protect against accidental deletions (MFA Delete requires manual configuration)
5. **Comprehensive Lifecycle Management**: 
   - Intelligent Tiering after 30 days
   - Glacier after 90 days
   - Deep Archive after 180 days
   - Expiration after 7 years
   - Multipart upload cleanup after 7 days
6. **Advanced Monitoring & Alerting**: 
   - CloudWatch log groups for audit trails
   - Metric filters for security events
   - CloudWatch alarms for unauthorized access
   - SNS notifications with KMS encryption
7. **Environment Isolation**: Uses environment suffix for unique resource naming across deployments
8. **Infrastructure as Code Best Practices**: 
   - Modular design with separated provider configuration
   - Comprehensive tagging strategy
   - Proper dependency management
   - Force destroy for clean teardown

## Deployment Notes

- CloudTrail is prepared but commented out due to AWS account limits (5 CloudTrails max per region)
- All resources are tagged appropriately for cost tracking and management
- KMS keys include policies for all necessary AWS services (S3, CloudTrail, CloudWatch Logs)
- Bucket policies enforce both TLS and encryption requirements
- Cross-region replication requires versioning on both source and destination buckets
- MFA Delete must be enabled manually after deployment using AWS CLI with MFA authentication