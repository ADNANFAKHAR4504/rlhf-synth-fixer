locals {
  resource_prefix = var.environment_suffix != "" ? "${var.project_name}-${var.environment_suffix}" : var.project_name
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Compliance  = "Audit-Logs"
  }
}

# KMS Key for encryption
resource "aws_kms_key" "audit_logs" {
  description             = "KMS key for audit log encryption"
  deletion_window_in_days = 30
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
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      },
      {
        Sid    = "Allow CloudTrail"
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
        Sid    = "Allow S3"
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

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-kms-key"
  })
}

resource "aws_kms_alias" "audit_logs" {
  name          = "alias/${local.resource_prefix}-audits-log"
  target_key_id = aws_kms_key.audit_logs.key_id
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "audit_events" {
  name              = "/aws/${local.resource_prefix}/audits-event"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.audit_logs.arn

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-audit-events"
  })
}

# CloudWatch Logs Insights Query Definition
resource "aws_cloudwatch_query_definition" "audit_query" {
  name = "${local.resource_prefix}-audit-insights-new"

  log_group_names = [
    aws_cloudwatch_log_group.audit_events.name
  ]

  query_string = <<-QUERY
    fields @timestamp, requestId, transactionId, eventType, userId, @message
    | filter eventType = "CRITICAL" or eventType = "SECURITY"
    | sort @timestamp desc
    | limit 1000
  QUERY
}

# S3 Bucket for immutable log storage with Object Lock
resource "aws_s3_bucket" "audit_logs" {
  bucket = "${local.resource_prefix}-new-log-${data.aws_caller_identity.current.account_id}"

  object_lock_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-audit-logs-bucket"
  })
}

resource "aws_s3_bucket_versioning" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.audit_logs.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_object_lock_configuration" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  rule {
    default_retention {
      mode  = "GOVERNANCE"
      years = var.s3_retention_years
    }
  }
}

resource "aws_s3_bucket_public_access_block" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 180
      storage_class = "DEEP_ARCHIVE"
    }
  }
}

# S3 Bucket Policy
resource "aws_s3_bucket_policy" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyUnencryptedObjectUploads"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.audit_logs.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.audit_logs.arn,
          "${aws_s3_bucket.audit_logs.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# IAM Role for Lambda log processor
resource "aws_iam_role" "lambda_log_processor" {
  name = "${local.resource_prefix}-lambda-logs-processor-new"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "lambda_log_processor" {
  name = "${local.resource_prefix}-lambda-log-processor-policy"
  role = aws_iam_role.lambda_log_processor.id

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
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.resource_prefix}-*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:GetLogEvents",
          "logs:FilterLogEvents"
        ]
        Resource = aws_cloudwatch_log_group.audit_events.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectRetention"
        ]
        Resource = "${aws_s3_bucket.audit_logs.arn}/processed-logs/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.audit_logs.arn
      }
    ]
  })
}

# Lambda function for log processing
resource "aws_lambda_function" "log_processor" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${local.resource_prefix}-log-processor-new"
  role             = aws_iam_role.lambda_log_processor.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "python3.11"
  timeout          = 300
  memory_size      = 512

  environment {
    variables = {
      S3_BUCKET  = aws_s3_bucket.audit_logs.id
      S3_PREFIX  = "processed-logs"
      LOG_GROUP  = aws_cloudwatch_log_group.audit_events.name
      KMS_KEY_ID = aws_kms_key.audit_logs.arn
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-log-processor"
  })
}

resource "aws_cloudwatch_log_group" "lambda_log_processor" {
  name              = "/aws/lambda/${aws_lambda_function.log_processor.function_name}-log"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.audit_logs.arn

  tags = local.common_tags
}

# CloudWatch Log subscription filter to trigger Lambda
resource "aws_cloudwatch_log_subscription_filter" "lambda_processor" {
  name            = "${local.resource_prefix}-log-processor-filter"
  log_group_name  = aws_cloudwatch_log_group.audit_events.name
  filter_pattern  = ""
  destination_arn = aws_lambda_function.log_processor.arn

  depends_on = [aws_lambda_permission.allow_cloudwatch]
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.log_processor.function_name
  principal     = "logs.amazonaws.com"
  source_arn    = "${aws_cloudwatch_log_group.audit_events.arn}:*"
}

# EventBridge for real-time alerts
resource "aws_cloudwatch_event_rule" "critical_events" {
  name        = "${local.resource_prefix}-critical-events"
  description = "Capture critical audit events"

  event_pattern = jsonencode({
    source      = ["aws.logs"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventName = [
        "DeleteLogGroup",
        "DeleteLogStream",
        "PutBucketPolicy",
        "DeleteBucket",
        "PutBucketObjectLockConfiguration"
      ]
    }
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "eventbridge_logs" {
  name              = "/aws/event/${local.resource_prefix}-critical-event-new"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.audit_logs.arn

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-eventbridge-logs"
  })
}

# EventBridge target - SNS for alerts
resource "aws_sns_topic" "critical_alerts" {
  name              = "${local.resource_prefix}-critical-alerts"
  kms_master_key_id = aws_kms_key.audit_logs.id

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-critical-alerts"
  })
}

resource "aws_sns_topic_policy" "critical_alerts" {
  arn = aws_sns_topic.critical_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.critical_alerts.arn
      }
    ]
  })
}

resource "aws_cloudwatch_event_target" "sns" {
  rule      = aws_cloudwatch_event_rule.critical_events.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.critical_alerts.arn
}

resource "aws_cloudwatch_event_target" "cloudwatch_logs" {
  rule      = aws_cloudwatch_event_rule.critical_events.name
  target_id = "SendToCloudWatchLogs"
  arn       = aws_cloudwatch_log_group.eventbridge_logs.arn
}

# AppSync API for real-time monitoring
resource "aws_appsync_graphql_api" "monitoring" {
  name                = "${local.resource_prefix}-monitoring-api"
  authentication_type = "API_KEY"

  log_config {
    cloudwatch_logs_role_arn = aws_iam_role.appsync_logs.arn
    field_log_level          = "ERROR"
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-monitoring-api"
  })
}

resource "aws_appsync_api_key" "monitoring" {
  api_id  = aws_appsync_graphql_api.monitoring.id
  expires = timeadd(timestamp(), "8760h") # 1 year
}

resource "aws_cloudwatch_log_group" "appsync" {
  name              = "/aws/appsync/${local.resource_prefix}-monitoring-event-new"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.audit_logs.arn

  tags = local.common_tags
}

# IAM role for AppSync logging
resource "aws_iam_role" "appsync_logs" {
  name = "${local.resource_prefix}-appsync-new-log"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "appsync.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "appsync_logs" {
  name = "${local.resource_prefix}-appsync-logs-policy"
  role = aws_iam_role.appsync_logs.id

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
        Resource = "${aws_cloudwatch_log_group.appsync.arn}:*"
      }
    ]
  })
}

# EventBridge rule to send events to AppSync


# IAM role for EventBridge to invoke AppSync



# Data sources
data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}

# Lambda function code
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda_function.zip"

  source {
    content  = file("${path.module}/lambda_function.py")
    filename = "index.py"
  }
}
