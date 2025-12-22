
# S3 Bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket = "cloudtrail-logs-${var.environment_suffix}"
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    id     = "expire-old-logs"
    status = "Enabled"

    filter {}

    expiration {
      days = 90
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

resource "aws_s3_bucket_policy" "cloudtrail_logs" {
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
}

# CloudTrail for API audit logging
# Note: CloudTrail is not fully supported in LocalStack Community Edition
# Commented out for LocalStack compatibility
# resource "aws_cloudtrail" "payment_audit" {
#   name                          = "payment-audit-trail-${var.environment_suffix}"
#   s3_bucket_name                = aws_s3_bucket.cloudtrail_logs.id
#   include_global_service_events = true
#   is_multi_region_trail         = false
#   enable_log_file_validation    = true

#   event_selector {
#     read_write_type           = "All"
#     include_management_events = true
#   }

#   depends_on = [aws_s3_bucket_policy.cloudtrail_logs]
# }

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "payment_api_logs" {
  name              = "/aws/payment-api-${var.environment_suffix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.observability.arn
}

resource "aws_cloudwatch_log_group" "payment_processor_logs" {
  name              = "/aws/payment-processor-${var.environment_suffix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.observability.arn
}

resource "aws_cloudwatch_log_group" "payment_database_logs" {
  name              = "/aws/payment-database-${var.environment_suffix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.observability.arn
}

resource "aws_cloudwatch_log_group" "security_events_logs" {
  name              = "/aws/security-events-${var.environment_suffix}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.observability.arn
}

# KMS Key for encryption
resource "aws_kms_key" "observability" {
  description             = "KMS key for observability platform encryption"
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
          Service = "logs.${var.aws_region}.amazonaws.com"
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
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
          }
        }
      }
    ]
  })
}

resource "aws_kms_alias" "observability" {
  name          = "alias/observability-${var.environment_suffix}"
  target_key_id = aws_kms_key.observability.key_id
}

# X-Ray Sampling Rule
# Note: X-Ray is not fully supported in LocalStack Community Edition
# Commented out for LocalStack compatibility
# resource "aws_xray_sampling_rule" "payment_transactions" {
#   rule_name      = "pay-txn-${var.environment_suffix}"
#   priority       = 1000
#   version        = 1
#   reservoir_size = 1
#   fixed_rate     = var.xray_sampling_percentage
#   url_path       = "/api/payment/*"
#   host           = "*"
#   http_method    = "POST"
#   service_type   = "*"
#   service_name   = "*"
#   resource_arn   = "*"

#   attributes = {
#     Environment = var.environment_suffix
#   }
# }

# resource "aws_xray_sampling_rule" "default_sampling" {
#   rule_name      = "def-${var.environment_suffix}"
#   priority       = 5000
#   version        = 1
#   reservoir_size = 1
#   fixed_rate     = 0.05
#   url_path       = "*"
#   host           = "*"
#   http_method    = "*"
#   service_type   = "*"
#   service_name   = "*"
#   resource_arn   = "*"

#   attributes = {
#     Environment = var.environment_suffix
#   }
# }

# SNS Topic for Alerts
resource "aws_sns_topic" "payment_alerts" {
  name              = "payment-alerts-${var.environment_suffix}"
  kms_master_key_id = aws_kms_key.observability.id
}

resource "aws_sns_topic" "security_alerts" {
  name              = "security-alerts-${var.environment_suffix}"
  kms_master_key_id = aws_kms_key.observability.id
}

resource "aws_sns_topic_subscription" "payment_alerts_email" {
  count     = var.alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.payment_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_sns_topic_subscription" "security_alerts_email" {
  count     = var.alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "payment-high-error-rate-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "PaymentProcessing"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Alert when payment error rate exceeds threshold"
  alarm_actions       = [aws_sns_topic.payment_alerts.arn]

  dimensions = {
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "high_latency" {
  alarm_name          = "payment-high-latency-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "TransactionLatency"
  namespace           = "PaymentProcessing"
  period              = 300
  statistic           = "Average"
  threshold           = 500
  alarm_description   = "Alert when payment latency exceeds 500ms"
  alarm_actions       = [aws_sns_topic.payment_alerts.arn]

  dimensions = {
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "failed_transactions" {
  alarm_name          = "payment-failed-transactions-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FailedTransactions"
  namespace           = "PaymentProcessing"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Critical alert for failed payment transactions"
  alarm_actions       = [aws_sns_topic.payment_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    Environment = var.environment_suffix
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "payment_operations" {
  dashboard_name = "payment-operations-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["PaymentProcessing", "TransactionCount", { stat = "Sum", label = "Total Transactions" }],
            [".", "SuccessfulTransactions", { stat = "Sum", label = "Successful" }],
            [".", "FailedTransactions", { stat = "Sum", label = "Failed" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Payment Transaction Volume"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["PaymentProcessing", "TransactionLatency", { stat = "Average", label = "Avg Latency" }],
            ["...", { stat = "p50", label = "p50" }],
            ["...", { stat = "p95", label = "p95" }],
            ["...", { stat = "p99", label = "p99" }]
          ]
          period = 300
          region = var.aws_region
          title  = "Transaction Latency Distribution (ms)"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["PaymentProcessing", "Errors", { stat = "Sum", label = "Total Errors" }],
            [".", "AuthorizationErrors", { stat = "Sum", label = "Auth Errors" }],
            [".", "GatewayErrors", { stat = "Sum", label = "Gateway Errors" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Error Metrics"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "log"
        properties = {
          query   = "SOURCE '${aws_cloudwatch_log_group.payment_api_logs.name}' | fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 20"
          region  = var.aws_region
          title   = "Recent Errors"
          stacked = false
        }
      }
    ]
  })

  lifecycle {
    create_before_destroy = true
  }
}

# EventBridge Rule for Security Events
resource "aws_cloudwatch_event_rule" "security_config_changes" {
  name        = "security-config-changes-${var.environment_suffix}"
  description = "Capture AWS Config compliance changes"

  event_pattern = jsonencode({
    source      = ["aws.config"]
    detail-type = ["Config Rules Compliance Change"]
    detail = {
      messageType = ["ComplianceChangeNotification"]
    }
  })
}

resource "aws_cloudwatch_event_target" "security_config_sns" {
  rule      = aws_cloudwatch_event_rule.security_config_changes.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts.arn
}

resource "aws_sns_topic_policy" "security_alerts_eventbridge" {
  arn = aws_sns_topic.security_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.security_alerts.arn
      }
    ]
  })
}

# EventBridge Rule for CloudTrail Events
resource "aws_cloudwatch_event_rule" "unauthorized_api_calls" {
  name        = "unauthorized-api-calls-${var.environment_suffix}"
  description = "Detect unauthorized API calls"

  event_pattern = jsonencode({
    source      = ["aws.cloudtrail"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      errorCode = ["AccessDenied", "UnauthorizedOperation"]
    }
  })
}

resource "aws_cloudwatch_event_target" "unauthorized_api_sns" {
  rule      = aws_cloudwatch_event_rule.unauthorized_api_calls.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts.arn
}

# Systems Manager Parameters
resource "aws_ssm_parameter" "xray_sampling_rate" {
  name  = "/observability/${var.environment_suffix}/xray/sampling-rate"
  type  = "String"
  value = tostring(var.xray_sampling_percentage)

  description = "X-Ray sampling percentage for payment transactions"
}

resource "aws_ssm_parameter" "log_retention" {
  name  = "/observability/${var.environment_suffix}/logs/retention-days"
  type  = "String"
  value = tostring(var.log_retention_days)

  description = "CloudWatch log retention period in days"
}

resource "aws_ssm_parameter" "alert_threshold_latency" {
  name  = "/observability/${var.environment_suffix}/alerts/latency-threshold-ms"
  type  = "String"
  value = "500"

  description = "Latency threshold for payment transaction alerts"
}

# AWS Config (if enabled)
resource "aws_s3_bucket" "config_logs" {
  count  = var.enable_config ? 1 : 0
  bucket = "config-logs-${var.environment_suffix}"
}

resource "aws_s3_bucket_public_access_block" "config_logs" {
  count  = var.enable_config ? 1 : 0
  bucket = aws_s3_bucket.config_logs[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config_logs" {
  count  = var.enable_config ? 1 : 0
  bucket = aws_s3_bucket.config_logs[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_iam_role" "config_role" {
  count = var.enable_config ? 1 : 0
  name  = "config-role-${var.environment_suffix}"

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
}

resource "aws_iam_role_policy_attachment" "config_role_policy" {
  count      = var.enable_config ? 1 : 0
  role       = aws_iam_role.config_role[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

resource "aws_iam_role_policy" "config_s3_policy" {
  count = var.enable_config ? 1 : 0
  name  = "config-s3-policy"
  role  = aws_iam_role.config_role[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketVersioning",
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = [
          aws_s3_bucket.config_logs[0].arn,
          "${aws_s3_bucket.config_logs[0].arn}/*"
        ]
      }
    ]
  })
}

resource "aws_config_configuration_recorder" "main" {
  count    = var.enable_config ? 1 : 0
  name     = "config-recorder-${var.environment_suffix}"
  role_arn = aws_iam_role.config_role[0].arn

  recording_group {
    all_supported = true
  }
}

resource "aws_config_delivery_channel" "main" {
  count          = var.enable_config ? 1 : 0
  name           = "config-delivery-${var.environment_suffix}"
  s3_bucket_name = aws_s3_bucket.config_logs[0].bucket

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_configuration_recorder_status" "main" {
  count      = var.enable_config ? 1 : 0
  name       = aws_config_configuration_recorder.main[0].name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# Config Rules
resource "aws_config_config_rule" "encrypted_volumes" {
  count = var.enable_config ? 1 : 0
  name  = "encrypted-volumes-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "s3_bucket_encryption" {
  count = var.enable_config ? 1 : 0
  name  = "s3-bucket-encryption-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "iam_password_policy" {
  count = var.enable_config ? 1 : 0
  name  = "iam-password-policy-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "IAM_PASSWORD_POLICY"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# Security Hub (if enabled)
resource "aws_securityhub_account" "main" {
  count = var.enable_security_hub ? 1 : 0
}

resource "aws_securityhub_standards_subscription" "cis" {
  count         = var.enable_security_hub ? 1 : 0
  standards_arn = "arn:aws:securityhub:${var.aws_region}::standards/cis-aws-foundations-benchmark/v/1.4.0"

  depends_on = [aws_securityhub_account.main]
}

resource "aws_securityhub_standards_subscription" "pci_dss" {
  count         = var.enable_security_hub ? 1 : 0
  standards_arn = "arn:aws:securityhub:${var.aws_region}::standards/pci-dss/v/3.2.1"

  depends_on = [aws_securityhub_account.main]
}

# Data sources
data "aws_caller_identity" "current" {}

