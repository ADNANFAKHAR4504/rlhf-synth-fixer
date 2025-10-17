# ============================================================================
# S3 Cross-Region Replication with Monitoring - Complete Infrastructure v2
# ============================================================================
# Retail Platform: us-east-1 (source) to eu-west-1 (replica)
# 100,000 daily users with comprehensive monitoring and audit logging
# ============================================================================


# ============================================================================
# VARIABLES
# ============================================================================

variable "region" {
  description = "Primary AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "retail-v2"
}

variable "replication_latency_threshold" {
  description = "Replication latency alarm threshold in seconds"
  type        = number
  default     = 900 # 15 minutes
}

variable "pending_replication_threshold" {
  description = "Pending replication bytes alarm threshold"
  type        = number
  default     = 107374182400 # 100GB in bytes
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention period in days"
  type        = number
  default     = 90
}

variable "lifecycle_noncurrent_expiration_days" {
  description = "Days after which to expire non-current object versions"
  type        = number
  default     = 90
}

variable "lifecycle_multipart_expiration_days" {
  description = "Days after which to delete incomplete multipart uploads"
  type        = number
  default     = 7
}

# ============================================================================
# DATA SOURCES
# ============================================================================

data "aws_caller_identity" "current" {}

# ============================================================================
# LOCALS
# ============================================================================

locals {
  account_id = data.aws_caller_identity.current.account_id

  # Bucket names with account ID and v2 suffix
  source_bucket_name     = "retail-data-source-v2-${local.account_id}-us-east-1"
  replica_bucket_name    = "retail-data-replica-v2-${local.account_id}-eu-west-1"
  cloudtrail_bucket_name = "retail-cloudtrail-logs-v2-${local.account_id}"

  # Common tags for all resources
  common_tags = {
    Project            = var.project_name
    Environment        = var.environment
    ManagedBy          = "Terraform"
    DataClassification = "Confidential"
  }
}

# ============================================================================
# KMS KEYS - Customer-managed encryption key
# ============================================================================

# KMS key in us-east-1 for source bucket
resource "aws_kms_key" "source_key" {
  provider                = aws.us_east_1
  description             = "KMS key for retail data source bucket encryption v2"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  tags                    = local.common_tags

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
        Sid    = "Allow S3 Service"
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
        Sid    = "Allow Replication Role"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.replication_role.arn
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey",
          "kms:DecryptDataKey"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_kms_alias" "source_key_alias" {
  provider      = aws.us_east_1
  name          = "alias/retail-data-source-key-v2"
  target_key_id = aws_kms_key.source_key.key_id
}

# KMS key in eu-west-1 for replica bucket
resource "aws_kms_key" "replica_key" {
  provider                = aws.eu_west_1
  description             = "KMS key for retail data replica bucket encryption v2"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  tags                    = local.common_tags

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
        Sid    = "Allow S3 Service"
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
        Sid    = "Allow Replication Role"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.replication_role.arn
        }
        Action = [
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_kms_alias" "replica_key_alias" {
  provider      = aws.eu_west_1
  name          = "alias/retail-data-replica-key-v2"
  target_key_id = aws_kms_key.replica_key.key_id
}

# ============================================================================
# IAM ROLES AND POLICIES - Replication role with least privilege
# ============================================================================

resource "aws_iam_role" "replication_role" {
  name = "retail-s3-replication-role-v2"
  tags = local.common_tags

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
}

resource "aws_iam_role_policy" "replication_policy" {
  name = "retail-s3-replication-policy-v2"
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
        Resource = aws_s3_bucket.source.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = "${aws_s3_bucket.source.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = "${aws_s3_bucket.replica.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.source_key.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.replica_key.arn
      }
    ]
  })
}

# ============================================================================
# S3 SOURCE BUCKET - us-east-1
# ============================================================================

resource "aws_s3_bucket" "source" {
  provider = aws.us_east_1
  bucket   = local.source_bucket_name
  tags     = local.common_tags
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
      kms_master_key_id = aws_kms_key.source_key.arn
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


# ============================================================================
# S3 REPLICA BUCKET - eu-west-1
# ============================================================================

resource "aws_s3_bucket" "replica" {
  provider = aws.eu_west_1
  bucket   = local.replica_bucket_name
  tags     = local.common_tags
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
      kms_master_key_id = aws_kms_key.replica_key.arn
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
# S3 REPLICATION CONFIGURATION
# ============================================================================

resource "aws_s3_bucket_replication_configuration" "replication" {
  provider   = aws.us_east_1
  depends_on = [aws_s3_bucket_versioning.source]

  role   = aws_iam_role.replication_role.arn
  bucket = aws_s3_bucket.source.id

  rule {
    id       = "replicate-all-objects"
    status   = "Enabled"
    priority = 1

    filter {}

    delete_marker_replication {
      status = "Enabled"
    }

    # CRITICAL: Source selection criteria for KMS encrypted objects
    source_selection_criteria {
      sse_kms_encrypted_objects {
        status = "Enabled"
      }
    }

    destination {
      bucket        = aws_s3_bucket.replica.arn
      storage_class = "STANDARD"

      encryption_configuration {
        replica_kms_key_id = aws_kms_key.replica_key.arn
      }

      # Replication Time Control - 15-minute guarantee
      replication_time {
        status = "Enabled"
        time {
          minutes = 15
        }
      }

      # Replication metrics for monitoring
      metrics {
        status = "Enabled"
        event_threshold {
          minutes = 15
        }
      }
    }
  }
}

# ============================================================================
# CLOUDWATCH ALARMS - Replication monitoring
# ============================================================================

resource "aws_cloudwatch_metric_alarm" "replication_latency" {
  provider            = aws.us_east_1
  alarm_name          = "retail-s3-replication-latency-critical-v2"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ReplicationLatency"
  namespace           = "AWS/S3"
  period              = 300
  statistic           = "Maximum"
  threshold           = var.replication_latency_threshold
  alarm_description   = "S3 replication latency exceeds 15 minutes"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
  tags                = local.common_tags

  dimensions = {
    SourceBucket      = aws_s3_bucket.source.id
    DestinationBucket = aws_s3_bucket.replica.id
    RuleId            = "replicate-all-objects"
  }
}

resource "aws_cloudwatch_metric_alarm" "bytes_pending_replication" {
  provider            = aws.us_east_1
  alarm_name          = "retail-s3-bytes-pending-critical-v2"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "BytesPendingReplication"
  namespace           = "AWS/S3"
  period              = 300
  statistic           = "Maximum"
  threshold           = var.pending_replication_threshold
  alarm_description   = "More than 100GB pending replication for 15 minutes"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
  tags                = local.common_tags

  dimensions = {
    SourceBucket      = aws_s3_bucket.source.id
    DestinationBucket = aws_s3_bucket.replica.id
    RuleId            = "replicate-all-objects"
  }
}

resource "aws_cloudwatch_metric_alarm" "source_4xx_errors" {
  provider            = aws.us_east_1
  alarm_name          = "retail-s3-source-4xx-errors-warning-v2"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "4xxErrors"
  namespace           = "AWS/S3"
  period              = 300
  statistic           = "Sum"
  threshold           = 100
  alarm_description   = "High 4xx error rate on source bucket"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]
  tags                = local.common_tags

  dimensions = {
    BucketName = aws_s3_bucket.source.id
  }
}

resource "aws_cloudwatch_metric_alarm" "source_5xx_errors" {
  provider            = aws.us_east_1
  alarm_name          = "retail-s3-source-5xx-errors-critical-v2"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5xxErrors"
  namespace           = "AWS/S3"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Critical 5xx error rate on source bucket"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
  tags                = local.common_tags

  dimensions = {
    BucketName = aws_s3_bucket.source.id
  }
}

# ============================================================================
# CLOUDWATCH DASHBOARD - Multi-region metrics
# ============================================================================

resource "aws_cloudwatch_dashboard" "replication" {
  provider       = aws.us_east_1
  dashboard_name = "retail-s3-replication-dashboard-v2"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/S3", "ReplicationLatency", { stat = "Maximum", label = "Replication Latency" }]
          ]
          period = 300
          stat   = "Maximum"
          region = "us-east-1"
          title  = "Replication Latency (seconds)"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/S3", "BytesPendingReplication", { stat = "Sum", label = "Bytes Pending" }]
          ]
          period = 300
          stat   = "Sum"
          region = "us-east-1"
          title  = "Bytes Pending Replication"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/S3", "OperationsPendingReplication", { stat = "Sum", label = "Operations Pending" }]
          ]
          period = 300
          stat   = "Sum"
          region = "us-east-1"
          title  = "Operations Pending Replication"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/S3", "4xxErrors", { stat = "Sum", label = "4xx Errors" }],
            [".", "5xxErrors", { stat = "Sum", label = "5xx Errors" }]
          ]
          period = 300
          stat   = "Sum"
          region = "us-east-1"
          title  = "S3 Error Rates"
        }
      }
    ]
  })
}

# ============================================================================
# SNS TOPICS - Alert notifications based on severity
# ============================================================================

resource "aws_sns_topic" "critical_alerts" {
  provider = aws.us_east_1
  name     = "retail-s3-critical-alerts-v2"
  tags     = local.common_tags
}

resource "aws_sns_topic" "warning_alerts" {
  provider = aws.us_east_1
  name     = "retail-s3-warning-alerts-v2"
  tags     = local.common_tags
}

resource "aws_sns_topic" "info_alerts" {
  provider = aws.us_east_1
  name     = "retail-s3-info-alerts-v2"
  tags     = local.common_tags
}

# SNS Topic Policies to allow EventBridge and CloudWatch to publish
resource "aws_sns_topic_policy" "critical_alerts_policy" {
  provider = aws.us_east_1
  arn      = aws_sns_topic.critical_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowEventBridgePublish"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.critical_alerts.arn
      },
      {
        Sid    = "AllowCloudWatchPublish"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.critical_alerts.arn
      }
    ]
  })
}

resource "aws_sns_topic_policy" "warning_alerts_policy" {
  provider = aws.us_east_1
  arn      = aws_sns_topic.warning_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowEventBridgePublish"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.warning_alerts.arn
      },
      {
        Sid    = "AllowCloudWatchPublish"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.warning_alerts.arn
      }
    ]
  })
}

resource "aws_sns_topic_policy" "info_alerts_policy" {
  provider = aws.us_east_1
  arn      = aws_sns_topic.info_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowEventBridgePublish"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.info_alerts.arn
      }
    ]
  })
}

# ============================================================================
# CLOUDWATCH LOG GROUPS - For EventBridge and CloudTrail
# ============================================================================

resource "aws_cloudwatch_log_group" "eventbridge_logs" {
  provider          = aws.us_east_1
  name              = "/aws/events/retail-s3-events-v2"
  retention_in_days = var.log_retention_days
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "cloudtrail_logs" {
  provider          = aws.us_east_1
  name              = "/aws/cloudtrail/retail-s3-audit-v2"
  retention_in_days = var.log_retention_days
  tags              = local.common_tags
}

# ============================================================================
# EVENTBRIDGE RULES - Capture S3 events
# ============================================================================

resource "aws_cloudwatch_event_rule" "s3_object_events" {
  provider    = aws.us_east_1
  name        = "retail-s3-object-events-v2"
  description = "Capture S3 object events"
  tags        = local.common_tags

  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = ["Object Created", "Object Deleted", "Object Restore Completed"]
    detail = {
      bucket = {
        name = [aws_s3_bucket.source.id, aws_s3_bucket.replica.id]
      }
    }
  })
}

resource "aws_cloudwatch_event_target" "s3_object_events_log" {
  provider = aws.us_east_1
  rule     = aws_cloudwatch_event_rule.s3_object_events.name
  arn      = aws_cloudwatch_log_group.eventbridge_logs.arn
}

resource "aws_cloudwatch_event_target" "s3_object_events_sns" {
  provider  = aws.us_east_1
  rule      = aws_cloudwatch_event_rule.s3_object_events.name
  target_id = "SendToSNSInfo"
  arn       = aws_sns_topic.info_alerts.arn
}

resource "aws_cloudwatch_event_rule" "s3_replication_events" {
  provider    = aws.us_east_1
  name        = "retail-s3-replication-events-v2"
  description = "Capture S3 replication failures"
  tags        = local.common_tags

  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = ["S3 Replication Time Missed"]
  })
}

resource "aws_cloudwatch_event_target" "s3_replication_events_log" {
  provider = aws.us_east_1
  rule     = aws_cloudwatch_event_rule.s3_replication_events.name
  arn      = aws_cloudwatch_log_group.eventbridge_logs.arn
}

resource "aws_cloudwatch_event_target" "s3_replication_events_sns" {
  provider  = aws.us_east_1
  rule      = aws_cloudwatch_event_rule.s3_replication_events.name
  target_id = "SendToSNSCritical"
  arn       = aws_sns_topic.critical_alerts.arn
}

resource "aws_cloudwatch_event_rule" "s3_security_events" {
  provider    = aws.us_east_1
  name        = "retail-s3-security-events-v2"
  description = "Capture S3 security configuration changes"
  tags        = local.common_tags

  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventName = [
        "PutBucketPolicy",
        "DeleteBucketPolicy",
        "PutBucketAcl",
        "PutBucketVersioning",
        "PutBucketEncryption"
      ]
    }
  })
}

resource "aws_cloudwatch_event_target" "s3_security_events_log" {
  provider = aws.us_east_1
  rule     = aws_cloudwatch_event_rule.s3_security_events.name
  arn      = aws_cloudwatch_log_group.eventbridge_logs.arn
}

resource "aws_cloudwatch_event_target" "s3_security_events_sns" {
  provider  = aws.us_east_1
  rule      = aws_cloudwatch_event_rule.s3_security_events.name
  target_id = "SendToSNSCritical"
  arn       = aws_sns_topic.critical_alerts.arn
}

# ============================================================================
# CLOUDTRAIL - Audit logging
# ============================================================================

resource "aws_s3_bucket" "cloudtrail" {
  provider = aws.us_east_1
  bucket   = local.cloudtrail_bucket_name
  tags     = local.common_tags
}

resource "aws_s3_bucket_versioning" "cloudtrail" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.cloudtrail.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.cloudtrail.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.source_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.cloudtrail.id

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

resource "aws_iam_role" "cloudtrail" {
  name = "retail-cloudtrail-role-v2"
  tags = local.common_tags

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

resource "aws_iam_role_policy" "cloudtrail" {
  name = "retail-cloudtrail-policy-v2"
  role = aws_iam_role.cloudtrail.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.cloudtrail_logs.arn}:*"
      }
    ]
  })
}

resource "aws_cloudtrail" "main" {
  provider                      = aws.us_east_1
  depends_on                    = [aws_s3_bucket_policy.cloudtrail]
  name                          = "retail-s3-audit-trail-v2"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  tags                          = local.common_tags

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail_logs.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.source.arn}/", "${aws_s3_bucket.replica.arn}/"]
    }
  }
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "source_bucket_name" {
  description = "Source S3 bucket name in us-east-1"
  value       = aws_s3_bucket.source.id
}

output "source_bucket_arn" {
  description = "Source S3 bucket ARN"
  value       = aws_s3_bucket.source.arn
}

output "replica_bucket_name" {
  description = "Replica S3 bucket name in eu-west-1"
  value       = aws_s3_bucket.replica.id
}

output "replica_bucket_arn" {
  description = "Replica S3 bucket ARN"
  value       = aws_s3_bucket.replica.arn
}

output "replication_role_arn" {
  description = "IAM replication role ARN"
  value       = aws_iam_role.replication_role.arn
}

output "source_kms_key_arn" {
  description = "Source region KMS key ARN (us-east-1)"
  value       = aws_kms_key.source_key.arn
}

output "replica_kms_key_arn" {
  description = "Replica region KMS key ARN (eu-west-1)"
  value       = aws_kms_key.replica_key.arn
}

output "cloudtrail_arn" {
  description = "CloudTrail trail ARN"
  value       = aws_cloudtrail.main.arn
}

output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.replication.dashboard_name
}

output "sns_critical_topic_arn" {
  description = "SNS topic ARN for critical alerts"
  value       = aws_sns_topic.critical_alerts.arn
}

output "sns_warning_topic_arn" {
  description = "SNS topic ARN for warning alerts"
  value       = aws_sns_topic.warning_alerts.arn
}

output "sns_info_topic_arn" {
  description = "SNS topic ARN for info alerts"
  value       = aws_sns_topic.info_alerts.arn
}