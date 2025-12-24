# main.tf - Infrastructure Drift Detection System

# Data source for current AWS account
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# S3 Bucket for Drift Reports
resource "aws_s3_bucket" "drift_reports" {
  bucket = "drift-detection-reports-${var.environment_suffix}"

  tags = {
    Name        = "drift-detection-reports-${var.environment_suffix}"
    Purpose     = "Store infrastructure drift analysis reports"
    Environment = var.environment_suffix
  }
}

resource "aws_s3_bucket_versioning" "drift_reports" {
  bucket = aws_s3_bucket.drift_reports.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "drift_reports" {
  bucket = aws_s3_bucket.drift_reports.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "drift_reports" {
  bucket = aws_s3_bucket.drift_reports.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "drift_reports" {
  bucket = aws_s3_bucket.drift_reports.id

  rule {
    id     = "transition-old-reports"
    status = "Enabled"

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
  }
}

# S3 Bucket for AWS Config
resource "aws_s3_bucket" "config" {
  bucket = "drift-detection-config-${var.environment_suffix}"

  tags = {
    Name        = "drift-detection-config-${var.environment_suffix}"
    Purpose     = "AWS Config delivery channel"
    Environment = var.environment_suffix
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
        Sid    = "AWSConfigBucketPutObject"
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

# DynamoDB Table for State Locking
resource "aws_dynamodb_table" "state_lock" {
  name         = "drift-detection-state-lock-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "drift-detection-state-lock-${var.environment_suffix}"
    Purpose     = "Terraform state locking"
    Environment = var.environment_suffix
  }
}

# IAM Role for AWS Config
resource "aws_iam_role" "config" {
  name = "drift-detection-config-role-${var.environment_suffix}"

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

  tags = {
    Name        = "drift-detection-config-role-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

# AWS Config Recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "drift-detection-recorder-${var.environment_suffix}"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported = false
    resource_types = [
      "AWS::EC2::Instance",
      "AWS::EC2::SecurityGroup",
      "AWS::EC2::Volume",
      "AWS::RDS::DBInstance",
      "AWS::RDS::DBSecurityGroup",
      "AWS::S3::Bucket"
    ]
  }
}

# AWS Config Delivery Channel
resource "aws_config_delivery_channel" "main" {
  name           = "drift-detection-delivery-${var.environment_suffix}"
  s3_bucket_name = aws_s3_bucket.config.bucket

  depends_on = [aws_config_configuration_recorder.main]
}

# AWS Config Recorder Status
resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# AWS Config Rules
resource "aws_config_config_rule" "ec2_monitoring" {
  name = "drift-detection-ec2-monitoring-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "EC2_INSTANCE_MANAGED_BY_SSM"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "rds_encryption" {
  name = "drift-detection-rds-encryption-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "s3_versioning" {
  name = "drift-detection-s3-versioning-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_VERSIONING_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# SNS Topic for Notifications
resource "aws_sns_topic" "drift_alerts" {
  name = "drift-detection-alerts-${var.environment_suffix}"

  tags = {
    Name        = "drift-detection-alerts-${var.environment_suffix}"
    Purpose     = "Critical drift notifications"
    Environment = var.environment_suffix
  }
}

resource "aws_sns_topic_subscription" "drift_email" {
  topic_arn = aws_sns_topic.drift_alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "drift_detector" {
  name              = "/aws/lambda/drift-detector-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name        = "drift-detector-logs-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "drift_detector" {
  name = "drift-detector-lambda-role-${var.environment_suffix}"

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

  tags = {
    Name        = "drift-detector-lambda-role-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_iam_role_policy" "drift_detector" {
  name = "drift-detector-lambda-policy-${var.environment_suffix}"
  role = aws_iam_role.drift_detector.id

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
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/drift-detector-${var.environment_suffix}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.drift_reports.arn,
          "${aws_s3_bucket.drift_reports.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem"
        ]
        Resource = aws_dynamodb_table.state_lock.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.drift_alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "config:GetResourceConfigHistory",
          "config:ListDiscoveredResources"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda Function for Drift Detection
resource "aws_lambda_function" "drift_detector" {
  filename         = "${path.module}/lambda/drift_detector.zip"
  function_name    = "drift-detector-${var.environment_suffix}"
  role             = aws_iam_role.drift_detector.arn
  handler          = "drift_detector.lambda_handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/drift_detector.zip")
  runtime          = "python3.11"
  timeout          = 300
  memory_size      = 512

  environment {
    variables = {
      DRIFT_REPORTS_BUCKET = aws_s3_bucket.drift_reports.id
      SNS_TOPIC_ARN        = aws_sns_topic.drift_alerts.arn
      ENVIRONMENT_SUFFIX   = var.environment_suffix
      STATE_LOCK_TABLE     = aws_dynamodb_table.state_lock.name
    }
  }

  tags = {
    Name        = "drift-detector-${var.environment_suffix}"
    Purpose     = "Infrastructure drift detection"
    Environment = var.environment_suffix
  }

  depends_on = [aws_cloudwatch_log_group.drift_detector]
}

# EventBridge Rule for Scheduling
resource "aws_cloudwatch_event_rule" "drift_detection_schedule" {
  name                = "drift-detection-schedule-${var.environment_suffix}"
  description         = "Trigger drift detection every 6 hours"
  schedule_expression = "rate(6 hours)"

  tags = {
    Name        = "drift-detection-schedule-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_event_target" "drift_detector" {
  rule      = aws_cloudwatch_event_rule.drift_detection_schedule.name
  target_id = "DriftDetectorLambda"
  arn       = aws_lambda_function.drift_detector.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.drift_detector.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.drift_detection_schedule.arn
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "drift_monitoring" {
  dashboard_name = "drift-detection-dashboard-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", label = "Lambda Invocations" }],
            [".", "Errors", { stat = "Sum", label = "Lambda Errors" }],
            [".", "Duration", { stat = "Average", label = "Avg Duration (ms)" }]
          ]
          period = 300
          stat   = "Average"
          region = data.aws_region.current.name
          title  = "Drift Detection Lambda Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["DriftDetection", "DriftDetected", { stat = "Sum", label = "Drift Events Detected" }],
            [".", "CriticalDrift", { stat = "Sum", label = "Critical Drift Events" }]
          ]
          period = 3600
          stat   = "Sum"
          region = data.aws_region.current.name
          title  = "Drift Detection Summary"
        }
      },
      {
        type = "log"
        properties = {
          query  = "SOURCE '/aws/lambda/drift-detector-${var.environment_suffix}' | fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 20"
          region = data.aws_region.current.name
          title  = "Recent Errors"
        }
      }
    ]
  })
}
