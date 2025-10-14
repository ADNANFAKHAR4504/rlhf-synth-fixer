### Reasoning Trace
---

This is a comprehensive request for setting up S3 cross-region replication with full monitoring and audit logging. Let me break down the requirements:

1. **S3 Buckets**:
   - Source bucket in us-east-1: retail-data-source-{account-id}-us-east-1
   - Replica bucket in eu-west-1: retail-data-replica-{account-id}-eu-west-1
   - Versioning enabled (required for replication)
   - Customer-managed KMS encryption
   - Block all public access
   - Intelligent-Tiering for cost optimization
   - Lifecycle policies:
     - Delete incomplete multipart uploads after 7 days
     - Expire non-current versions after 90 days

2. **Cross-Region Replication**:
   - Replicate all objects including existing ones
   - Include delete markers, metadata, and tags
   - Use SSE-KMS encryption
   - Enable Replication Time Control (15 minutes)
   - Enable replication metrics
   - Create IAM replication role with least privilege

3. **KMS Keys**:
   - One key in each region
   - Aliases: alias/retail-data-source-key and alias/retail-data-replica-key
   - Enable automatic annual rotation
   - Allow S3 service, replication role, and CloudTrail

4. **CloudWatch Monitoring**:
   - Alarms for:
     - Replication latency > 15 minutes
     - Pending replication > 100GB for > 15 minutes
     - 4xx errors > 100 in 5 minutes
     - 5xx errors > 10 in 5 minutes
   - Dashboard showing all metrics

5. **EventBridge Rules**:
   - Capture S3 events (PutObject, DeleteObject, etc.)
   - Capture replication events
   - Capture security events
   - Route to CloudWatch Logs

I'll focus on the CloudTrail and Terraform configuration, outlining key implementation strategies. The audit trail will provide comprehensive logging across both S3 buckets, ensuring complete visibility and compliance. Terraform will enable infrastructure as code, with multi-region support and consistent resource management. The configuration will prioritize security, monitoring, and reproducible deployments across different environments.
### Answer 
---

I'll create a comprehensive Terraform configuration for S3 cross-region replication with full monitoring and audit logging. This setup will ensure high availability and compliance for your retail platform.

## main.tf

```hcl
# ============================================================================
# Terraform and Provider Configuration
# ============================================================================
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Primary region provider
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# Replica region provider
provider "aws" {
  alias  = "eu_west_1"
  region = "eu-west-1"
}

# Default provider for global services
provider "aws" {
  region = "us-east-1"
}

# ============================================================================
# Variables
# ============================================================================
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "retail"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "replication_time_minutes" {
  description = "Maximum minutes for replication time control"
  type        = number
  default     = 15
}

variable "cloudwatch_log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 90
}

variable "noncurrent_version_expiration_days" {
  description = "Days after which to expire non-current object versions"
  type        = number
  default     = 90
}

variable "incomplete_multipart_days" {
  description = "Days after which to abort incomplete multipart uploads"
  type        = number
  default     = 7
}

# ============================================================================
# Data Sources and Locals
# ============================================================================
data "aws_caller_identity" "current" {}
data "aws_region" "us_east_1" { provider = aws.us_east_1 }
data "aws_region" "eu_west_1" { provider = aws.eu_west_1 }

locals {
  account_id = data.aws_caller_identity.current.account_id
  
  common_tags = {
    Project             = var.project_name
    Environment        = var.environment
    ManagedBy          = "Terraform"
    DataClassification = "Confidential"
  }
  
  source_bucket_name     = "retail-data-source-${local.account_id}-us-east-1"
  replica_bucket_name    = "retail-data-replica-${local.account_id}-eu-west-1"
  cloudtrail_bucket_name = "retail-cloudtrail-logs-${local.account_id}"
  
  source_kms_alias  = "alias/retail-data-source-key"
  replica_kms_alias = "alias/retail-data-replica-key"
}

# ============================================================================
# KMS Keys
# ============================================================================

# Source region KMS key
resource "aws_kms_key" "source" {
  provider                = aws.us_east_1
  description             = "KMS key for retail data source bucket encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = merge(local.common_tags, {
    Name = "retail-data-source-key"
  })
}

resource "aws_kms_alias" "source" {
  provider      = aws.us_east_1
  name          = local.source_kms_alias
  target_key_id = aws_kms_key.source.key_id
}

# Replica region KMS key
resource "aws_kms_key" "replica" {
  provider                = aws.eu_west_1
  description             = "KMS key for retail data replica bucket encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = merge(local.common_tags, {
    Name = "retail-data-replica-key"
  })
}

resource "aws_kms_alias" "replica" {
  provider      = aws.eu_west_1
  name          = local.replica_kms_alias
  target_key_id = aws_kms_key.replica.key_id
}

# KMS key policies
resource "aws_kms_key_policy" "source" {
  provider = aws.us_east_1
  key_id   = aws_kms_key.source.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${local.account_id}:root"
        }
        Action   = "kms:*"
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
      },
      {
        Sid    = "Allow replication role to use the key"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.replication.arn
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:GenerateDataKey"
        ]
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
        Condition = {
          StringLike = {
            "kms:EncryptionContext:aws:cloudtrail:arn" = "arn:aws:cloudtrail:*:${local.account_id}:trail/*"
          }
        }
      }
    ]
  })
}

resource "aws_kms_key_policy" "replica" {
  provider = aws.eu_west_1
  key_id   = aws_kms_key.replica.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${local.account_id}:root"
        }
        Action   = "kms:*"
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
      },
      {
        Sid    = "Allow replication role to use the key"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.replication.arn
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
}

# ============================================================================
# IAM Roles and Policies for Replication
# ============================================================================

# Replication role
resource "aws_iam_role" "replication" {
  name = "retail-s3-replication-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  
  tags = merge(local.common_tags, {
    Name = "retail-s3-replication-role"
  })
}

# Replication policy
resource "aws_iam_role_policy" "replication" {
  name = "retail-s3-replication-policy"
  role = aws_iam_role.replication.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "GetReplicationConfiguration"
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.source.arn
      },
      {
        Sid    = "GetObjectVersionForReplication"
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = "${aws_s3_bucket.source.arn}/*"
      },
      {
        Sid    = "ReplicateObjects"
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = "${aws_s3_bucket.replica.arn}/*"
      },
      {
        Sid    = "SourceKMSDecrypt"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.source.arn
        Condition = {
          StringLike = {
            "kms:ViaService" = "s3.us-east-1.amazonaws.com"
          }
        }
      },
      {
        Sid    = "DestinationKMSEncrypt"
        Effect = "Allow"
        Action = [
          "kms:GenerateDataKey",
          "kms:Encrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.replica.arn
        Condition = {
          StringLike = {
            "kms:ViaService" = "s3.eu-west-1.amazonaws.com"
          }
        }
      }
    ]
  })
}

# ============================================================================
# S3 Buckets
# ============================================================================

# Source bucket in us-east-1
resource "aws_s3_bucket" "source" {
  provider = aws.us_east_1
  bucket   = local.source_bucket_name
  
  tags = merge(local.common_tags, {
    Name = local.source_bucket_name
    Type = "source"
  })
}

resource "aws_s3_bucket_versioning" "source" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.source.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "source" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.source.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.source.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "source" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.source.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_intelligent_tiering_configuration" "source" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.source.id
  name     = "EntireBucket"
  
  tiering {
    access_tier = "ARCHIVE_ACCESS"
    days        = 90
  }
  
  tiering {
    access_tier = "DEEP_ARCHIVE_ACCESS"
    days        = 180
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "source" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.source.id

  rule {
    id     = "delete-incomplete-multipart-uploads"
    status = "Enabled"

    filter {}

    abort_incomplete_multipart_upload {
      days_after_initiation = var.lifecycle_multipart_expiration_days
    }
  }

  rule {
    id     = "expire-noncurrent-versions"
    status = "Enabled"

    filter {}

    noncurrent_version_expiration {
      noncurrent_days = var.lifecycle_noncurrent_expiration_days
    }
  }
}


# Replica bucket in eu-west-1
resource "aws_s3_bucket" "replica" {
  provider = aws.eu_west_1
  bucket   = local.replica_bucket_name
  
  tags = merge(local.common_tags, {
    Name = local.replica_bucket_name
    Type = "replica"
  })
}

resource "aws_s3_bucket_versioning" "replica" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.replica.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "replica" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.replica.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.replica.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "replica" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.replica.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_intelligent_tiering_configuration" "replica" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.replica.id
  name     = "EntireBucket"
  
  tiering {
    access_tier = "ARCHIVE_ACCESS"
    days        = 90
  }
  
  tiering {
    access_tier = "DEEP_ARCHIVE_ACCESS"
    days        = 180
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "replica" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.replica.id
  
  rule {
    id     = "delete-incomplete-multipart-uploads"
    status = "Enabled"
    
    filter {}
    
    abort_incomplete_multipart_upload {
      days_after_initiation = var.lifecycle_multipart_expiration_days
    }
  }
  
  rule {
    id     = "expire-noncurrent-versions"
    status = "Enabled"
    
    filter {}
    
    noncurrent_version_expiration {
      noncurrent_days = var.lifecycle_noncurrent_expiration_days
    }
  }
}


# ============================================================================
# S3 Replication Configuration
# ============================================================================

resource "aws_s3_bucket_replication_configuration" "replication" {
  provider = aws.us_east_1
  role     = aws_iam_role.replication.arn
  bucket   = aws_s3_bucket.source.id
  
  depends_on = [
    aws_s3_bucket_versioning.source,
    aws_s3_bucket_versioning.replica
  ]
  
  rule {
    id       = "replicate-all-objects"
    status   = "Enabled"
    priority = 1
    
    delete_marker_replication {
      status = "Enabled"
    }
    
    filter {}
    
    destination {
      bucket        = aws_s3_bucket.replica.arn
      storage_class = "INTELLIGENT_TIERING"
      
      encryption_configuration {
        replica_kms_key_id = aws_kms_key.replica.arn
      }
      
      replication_time {
        status = "Enabled"
        time {
          minutes = var.replication_time_minutes
        }
      }
      
      metrics {
        status = "Enabled"
        event_threshold {
          minutes = var.replication_time_minutes
        }
      }
    }
    
    source_selection_criteria {
      sse_kms_encrypted_objects {
        status = "Enabled"
      }
    }
    
    existing_object_replication {
      status = "Enabled"
    }
  }
}

# ============================================================================
# CloudWatch Log Groups
# ============================================================================

resource "aws_cloudwatch_log_group" "s3_events" {
  name              = "/aws/events/s3/retail"
  retention_in_days = var.cloudwatch_log_retention_days
  
  tags = merge(local.common_tags, {
    Name = "retail-s3-events"
  })
}

resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/retail"
  retention_in_days = var.cloudwatch_log_retention_days
  
  tags = merge(local.common_tags, {
    Name = "retail-cloudtrail-logs"
  })
}

# ============================================================================
# CloudWatch Alarms
# ============================================================================

# Replication latency alarm
resource "aws_cloudwatch_metric_alarm" "replication_latency" {
  provider            = aws.us_east_1
  alarm_name          = "retail-s3-replication-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ReplicationLatency"
  namespace           = "AWS/S3"
  period              = "300"
  statistic           = "Maximum"
  threshold           = "900"
  alarm_description   = "Alert when replication latency exceeds 15 minutes"
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    SourceBucket      = aws_s3_bucket.source.id
    DestinationBucket = aws_s3_bucket.replica.id
    RuleName          = "replicate-all-objects"
  }
  
  tags = merge(local.common_tags, {
    Name = "retail-s3-replication-latency"
  })
}

# Pending replication bytes alarm
resource "aws_cloudwatch_metric_alarm" "pending_bytes" {
  provider            = aws.us_east_1
  alarm_name          = "retail-s3-pending-replication-bytes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "PendingReplicationBytes"
  namespace           = "AWS/S3"
  period              = "300"
  statistic           = "Maximum"
  threshold           = "107374182400"
  alarm_description   = "Alert when pending replication exceeds 100GB for 15 minutes"
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    SourceBucket      = aws_s3_bucket.source.id
    DestinationBucket = aws_s3_bucket.replica.id
    RuleName          = "replicate-all-objects"
  }
  
  tags = merge(local.common_tags, {
    Name = "retail-s3-pending-replication-bytes"
  })
}

# 4xx errors alarm for source bucket
resource "aws_cloudwatch_metric_alarm" "source_4xx_errors" {
  provider            = aws.us_east_1
  alarm_name          = "retail-s3-source-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "4xxErrors"
  namespace           = "AWS/S3"
  period              = "300"
  statistic           = "Sum"
  threshold           = "100"
  alarm_description   = "Alert when source bucket has more than 100 4xx errors in 5 minutes"
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    BucketName = aws_s3_bucket.source.id
    FilterId   = "EntireBucket"
  }
  
  tags = merge(local.common_tags, {
    Name = "retail-s3-source-4xx-errors"
  })
}

# 5xx errors alarm for source bucket
resource "aws_cloudwatch_metric_alarm" "source_5xx_errors" {
  provider            = aws.us_east_1
  alarm_name          = "retail-s3-source-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "5xxErrors"
  namespace           = "AWS/S3"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Alert when source bucket has more than 10 5xx errors in 5 minutes"
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    BucketName = aws_s3_bucket.source.id
    FilterId   = "EntireBucket"
  }
  
  tags = merge(local.common_tags, {
    Name = "retail-s3-source-5xx-errors"
  })
}

# 4xx errors alarm for replica bucket
resource "aws_cloudwatch_metric_alarm" "replica_4xx_errors" {
  provider            = aws.eu_west_1
  alarm_name          = "retail-s3-replica-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "4xxErrors"
  namespace           = "AWS/S3"
  period              = "300"
  statistic           = "Sum"
  threshold           = "100"
  alarm_description   = "Alert when replica bucket has more than 100 4xx errors in 5 minutes"
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    BucketName = aws_s3_bucket.replica.id
    FilterId   = "EntireBucket"
  }
  
  tags = merge(local.common_tags, {
    Name = "retail-s3-replica-4xx-errors"
  })
}

# 5xx errors alarm for replica bucket
resource "aws_cloudwatch_metric_alarm" "replica_5xx_errors" {
  provider            = aws.eu_west_1
  alarm_name          = "retail-s3-replica-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "5xxErrors"
  namespace           = "AWS/S3"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Alert when replica bucket has more than 10 5xx errors in 5 minutes"
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    BucketName = aws_s3_bucket.replica.id
    FilterId   = "EntireBucket"
  }
  
  tags = merge(local.common_tags, {
    Name = "retail-s3-replica-5xx-errors"
  })
}

# ============================================================================
# CloudWatch Dashboard
# ============================================================================

resource "aws_cloudwatch_dashboard" "replication" {
  dashboard_name = "retail-s3-replication-dashboard"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/S3", "ReplicationLatency", {
              stat = "Maximum"
              dimensions = {
                SourceBucket      = aws_s3_bucket.source.id
                DestinationBucket = aws_s3_bucket.replica.id
                RuleName          = "replicate-all-objects"
              }
            }],
            [".", ".", {
              stat = "Average"
              dimensions = {
                SourceBucket      = aws_s3_bucket.source.id
                DestinationBucket = aws_s3_bucket.replica.id
                RuleName          = "replicate-all-objects"
              }
            }]
          ]
          period = 300
          stat   = "Maximum"
          region = "us-east-1"
          title  = "Replication Latency"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/S3", "PendingReplicationBytes", {
              stat = "Maximum"
              dimensions = {
                SourceBucket      = aws_s3_bucket.source.id
                DestinationBucket = aws_s3_bucket.replica.id
                RuleName          = "replicate-all-objects"
              }
            }]
          ]
          period = 300
          stat   = "Maximum"
          region = "us-east-1"
          title  = "Pending Replication Bytes"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/S3", "PendingReplicationOperations", {
              stat = "Maximum"
              dimensions = {
                SourceBucket      = aws_s3_bucket.source.id
                DestinationBucket = aws_s3_bucket.replica.id
                RuleName          = "replicate-all-objects"
              }
            }]
          ]
          period = 300
          stat   = "Maximum"
          region = "us-east-1"
          title  = "Pending Replication Operations"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/S3", "BucketSizeBytes", {
              stat = "Average"
              dimensions = {
                BucketName  = aws_s3_bucket.source.id
                StorageType = "StandardStorage"
              }
            }],
            ["...", {
              stat = "Average"
              dimensions = {
                BucketName  = aws_s3_bucket.replica.id
                StorageType = "StandardStorage"
              }
              region = "eu-west-1"
            }]
          ]
          period = 86400
          stat   = "Average"
          region = "us-east-1"
          title  = "Bucket Sizes"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/S3", "4xxErrors", {
              stat = "Sum"
              dimensions = {
                BucketName = aws_s3_bucket.source.id
                FilterId   = "EntireBucket"
              }
            }],
            [".", "5xxErrors", ".", ".", {
              stat = "Sum"
            }]
          ]
          period = 300
          stat   = "Sum"
          region = "us-east-1"
          title  = "Source Bucket Errors"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/S3", "4xxErrors", {
              stat = "Sum"
              dimensions = {
                BucketName = aws_s3_bucket.replica.id
                FilterId   = "EntireBucket"
              }
              region = "eu-west-1"
            }],
            [".", "5xxErrors", ".", ".", {
              stat   = "Sum"
              region = "eu-west-1"
            }]
          ]
          period = 300
          stat   = "Sum"
          region = "eu-west-1"
          title  = "Replica Bucket Errors"
        }
      }
    ]
  })
}

# ============================================================================
# EventBridge Rules
# ============================================================================

# IAM role for EventBridge
resource "aws_iam_role" "eventbridge" {
  name = "retail-s3-eventbridge-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  
  tags = merge(local.common_tags, {
    Name = "retail-s3-eventbridge-role"
  })
}

resource "aws_iam_role_policy" "eventbridge_logs" {
  name = "retail-s3-eventbridge-logs-policy"
  role = aws_iam_role.eventbridge.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.s3_events.arn}:*"
      }
    ]
  })
}

# EventBridge rule for S3 object events
resource "aws_cloudwatch_event_rule" "s3_object_events" {
  name        = "retail-s3-object-events"
  description = "Capture S3 object events for retail buckets"
  
  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = [
      "Object Created",
      "Object Deleted",
      "Object Restore Completed"
    ]
    detail = {
      bucket = {
        name = [
          aws_s3_bucket.source.id,
          aws_s3_bucket.replica.id
        ]
      }
    }
  })
  
  tags = merge(local.common_tags, {
    Name = "retail-s3-object-events"
  })
}

resource "aws_cloudwatch_event_target" "s3_object_events_logs" {
  rule      = aws_cloudwatch_event_rule.s3_object_events.name
  target_id = "SendToCloudWatchLogs"
  arn       = aws_cloudwatch_log_group.s3_events.arn
  role_arn  = aws_iam_role.eventbridge.arn
}

# EventBridge rule for S3 security events
resource "aws_cloudwatch_event_rule" "s3_security_events" {
  name        = "retail-s3-security-events"
  description = "Capture S3 security events for retail buckets"
  
  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["s3.amazonaws.com"]
      eventName = [
        "PutBucketPolicy",
        "DeleteBucketPolicy",
        "PutBucketAcl",
        "PutBucketEncryption",
        "DeleteBucketEncryption",
        "PutBucketVersioning"
      ]
      requestParameters = {
        bucketName = [
          aws_s3_bucket.source.id,
          aws_s3_bucket.replica.id
        ]
      }
    }
  })
  
  tags = merge(local.common_tags, {
    Name = "retail-s3-security-events"
  })
}

resource "aws_cloudwatch_event_target" "s3_security_events_logs" {
  rule      = aws_cloudwatch_event_rule.s3_security_events.name
  target_id = "SendToCloudWatchLogs"
  arn       = aws_cloudwatch_log_group.s3_events.arn
  role_arn  = aws_iam_role.eventbridge.arn
}

# ============================================================================
# CloudTrail Configuration
# ============================================================================

# CloudTrail bucket
resource "aws_s3_bucket" "cloudtrail" {
  bucket = local.cloudtrail_bucket_name
  
  tags = merge(local.common_tags, {
    Name = local.cloudtrail_bucket_name
    Type = "audit-logs"
  })
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
      kms_master_key_id = aws_kms_key.source.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  
  rule {
    id     = "expire-old-logs"
    status = "Enabled"
    
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
    
    expiration {
      days = 365
    }
  }
}

# CloudTrail bucket policy
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

# IAM role for CloudTrail CloudWatch Logs
resource "aws_iam_role" "cloudtrail_cloudwatch" {
  name = "retail-cloudtrail-cloudwatch-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  
  tags = merge(local.common_tags, {
    Name = "retail-cloudtrail-cloudwatch-role"
  })
}

resource "aws_iam_role_policy" "cloudtrail_cloudwatch" {
  name = "retail-cloudtrail-cloudwatch-policy"
  role = aws_iam_role.cloudtrail_cloudwatch.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
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
  name                          = "retail-s3-audit-trail"
  s3_bucket_name               = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail        = true
  enable_log_file_validation   = true
  cloud_watch_logs_group_arn   = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn    = aws_iam_role.cloudtrail_cloudwatch.arn
  kms_key_id                   = aws_kms_key.source.arn
  
  event_selector {
    read_write_type           = "All"
    include_management_events = true
    
    data_resource {
      type   = "AWS::S3::Object"
      values = [
        "${aws_s3_bucket.source.arn}/",
        "${aws_s3_bucket.replica.arn}/"
      ]
    }
  }
  
  depends_on = [
    aws_s3_bucket_policy.cloudtrail
  ]
  
  tags = merge(local.common_tags, {
    Name = "retail-s3-audit-trail"
  })
}

# ============================================================================
# S3 Request Metrics for Monitoring
# ============================================================================

resource "aws_s3_bucket_metric" "source_entire_bucket" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.source.id
  name     = "EntireBucket"
}

resource "aws_s3_bucket_metric" "replica_entire_bucket" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.replica.id
  name     = "EntireBucket"
}

# ============================================================================
# Outputs
# ============================================================================

output "source_bucket_name" {
  description = "Name of the source S3 bucket"
  value       = aws_s3_bucket.source.id
}

output "source_bucket_arn" {
  description = "ARN of the source S3 bucket"
  value       = aws_s3_bucket.source.arn
}

output "replica_bucket_name" {
  description = "Name of the replica S3 bucket"
  value       = aws_s3_bucket.replica.id
}

output "replica_bucket_arn" {
  description = "ARN of the replica S3 bucket"
  value       = aws_s3_bucket.replica.arn
}

output "replication_role_arn" {
  description = "ARN of the S3 replication IAM role"
  value       = aws_iam_role.replication.arn
}

output "source_kms_key_arn" {
  description = "ARN of the source region KMS key"
  value       = aws_kms_key.source.arn
}

output "replica_kms_key_arn" {
  description = "ARN of the replica region KMS key"
  value       = aws_kms_key.replica.arn
}

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.replication.dashboard_name
}

output "cloudtrail_trail_arn" {
  description = "ARN of the CloudTrail trail"
  value       = aws_cloudtrail.main.arn
}

output "cloudtrail_bucket_name" {
  description = "Name of the CloudTrail logs bucket"
  value       = aws_s3_bucket.cloudtrail.id
}
```

## Key Features of This Configuration

### 1. **Cross-Region Replication Setup**
- Automatic replication from us-east-1 to eu-west-1
- Replication Time Control (RTC) guarantees 15-minute replication
- Replicates existing objects, delete markers, and metadata
- KMS encryption support with proper key policies

### 2. **Security & Compliance**
- Customer-managed KMS keys with automatic rotation
- All public access blocked
- CloudTrail logging with data events
- Log file validation enabled
- Least privilege IAM policies

### 3. **Cost Optimization**
- Intelligent-Tiering automatically moves data to cheaper tiers
- Lifecycle policies clean up old data
- Bucket Key enabled for reduced KMS costs
- Archive tiers configured for long-term storage

### 4. **Comprehensive Monitoring**
- CloudWatch alarms for replication latency and errors
- Dashboard showing all key metrics
- EventBridge rules capturing security and operational events
- All events logged to CloudWatch Logs

### 5. **Operational Excellence**
- Proper resource tagging for cost allocation
- Organized code with clear sections
- Configurable variables for environment-specific values
- Outputs for integration with other systems

## Usage Instructions

1. **Initialize Terraform:**
```bash
terraform init
```

2. **Review the plan:**
```bash
terraform plan
```

3. **Apply the configuration:**
```bash
terraform apply
```

## Testing Recommendations

During development and testing:
- Start with small test files (< 1GB) to verify replication
- Monitor the CloudWatch dashboard for replication metrics
- Check CloudTrail logs to verify audit trail
- Test failover scenarios by accessing data from the replica bucket
- Verify encryption by checking object properties in both buckets

## Cost Considerations

- **S3 Storage:** Intelligent-Tiering optimizes costs automatically
- **Data Transfer:** Cross-region replication incurs transfer charges
- **KMS:** Each encryption/decryption operation has a small cost
- **CloudWatch:** Logs and metrics storage costs
- **CloudTrail:** Data events add cost based on API call volume

This configuration provides a production-ready, highly available S3 cross-region replication setup with enterprise-grade monitoring and security for your retail platform.