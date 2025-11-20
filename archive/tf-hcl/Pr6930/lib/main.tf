# main.tf - Main infrastructure for drift detection system

# S3 Bucket for drift reports storage (Requirement 1)
resource "aws_s3_bucket" "drift_reports" {
  bucket = "drift-reports-${var.environment_suffix}"

  tags = {
    Name        = "drift-reports-${var.environment_suffix}"
    Purpose     = "Drift Analysis Reports Storage"
    Environment = var.environment_suffix
  }
}

resource "aws_s3_bucket_versioning" "drift_reports" {
  bucket = aws_s3_bucket.drift_reports.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "drift_reports" {
  bucket = aws_s3_bucket.drift_reports.id

  rule {
    id     = "transition-old-reports"
    status = "Enabled"

    filter {}

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

resource "aws_s3_bucket_server_side_encryption_configuration" "drift_reports" {
  bucket = aws_s3_bucket.drift_reports.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# DynamoDB table for Terraform state locking (Requirement 2)
resource "aws_dynamodb_table" "terraform_state_lock" {
  name         = "terraform-state-lock-${var.environment_suffix}"
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
    Name        = "terraform-state-lock-${var.environment_suffix}"
    Purpose     = "Terraform State Locking"
    Environment = var.environment_suffix
  }
}

# S3 bucket for AWS Config (Requirement 3)
resource "aws_s3_bucket" "config_bucket" {
  bucket = "aws-config-bucket-${var.environment_suffix}"

  tags = {
    Name        = "aws-config-bucket-${var.environment_suffix}"
    Purpose     = "AWS Config Storage"
    Environment = var.environment_suffix
  }
}

resource "aws_s3_bucket_versioning" "config_bucket" {
  bucket = aws_s3_bucket.config_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config_bucket" {
  bucket = aws_s3_bucket.config_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# IAM role for AWS Config
resource "aws_iam_role" "config_role" {
  name = "aws-config-role-${var.environment_suffix}"

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

  tags = {
    Name        = "aws-config-role-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_iam_role_policy_attachment" "config_role_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

resource "aws_iam_role_policy" "config_s3_policy" {
  name = "config-s3-policy-${var.environment_suffix}"
  role = aws_iam_role.config_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:PutObject",
        "s3:GetBucketVersioning"
      ]
      Resource = [
        aws_s3_bucket.config_bucket.arn,
        "${aws_s3_bucket.config_bucket.arn}/*"
      ]
    }]
  })
}

# AWS Config recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "config-recorder-${var.environment_suffix}"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported = false
    resource_types = [
      "AWS::EC2::Instance",
      "AWS::EC2::SecurityGroup",
      "AWS::EC2::Volume",
      "AWS::RDS::DBInstance",
      "AWS::RDS::DBCluster",
      "AWS::S3::Bucket"
    ]
  }
}

resource "aws_config_delivery_channel" "main" {
  name           = "config-delivery-${var.environment_suffix}"
  s3_bucket_name = aws_s3_bucket.config_bucket.bucket

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# AWS Config Rules (Requirement 3)
resource "aws_config_config_rule" "ec2_instance_monitoring" {
  name = "ec2-instance-monitoring-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "EC2_INSTANCE_DETAILED_MONITORING_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "rds_encryption_enabled" {
  name = "rds-encryption-enabled-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "s3_bucket_versioning" {
  name = "s3-bucket-versioning-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_VERSIONING_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# IAM role for Lambda drift detection (Requirement 4)
resource "aws_iam_role" "drift_detection_lambda" {
  name = "drift-detection-lambda-${var.environment_suffix}"

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

  tags = {
    Name        = "drift-detection-lambda-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.drift_detection_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_drift_detection_policy" {
  name = "lambda-drift-detection-policy-${var.environment_suffix}"
  role = aws_iam_role.drift_detection_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
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
        Resource = aws_dynamodb_table.terraform_state_lock.arn
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
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# Lambda function for drift detection (Requirement 4)
resource "aws_lambda_function" "drift_detector" {
  filename         = "${path.module}/lambda/drift-detector.zip"
  function_name    = "drift-detector-${var.environment_suffix}"
  role             = aws_iam_role.drift_detection_lambda.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/drift-detector.zip")
  runtime          = "nodejs18.x"
  timeout          = 300
  memory_size      = 512

  environment {
    variables = {
      DRIFT_REPORTS_BUCKET = aws_s3_bucket.drift_reports.bucket
      SNS_TOPIC_ARN        = aws_sns_topic.drift_alerts.arn
      ENVIRONMENT_SUFFIX   = var.environment_suffix
    }
  }

  tags = {
    Name        = "drift-detector-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "drift_detector_logs" {
  name              = "/aws/lambda/drift-detector-${var.environment_suffix}"
  retention_in_days = 14

  tags = {
    Name        = "drift-detector-logs-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# SNS topic for drift notifications (Requirement 6)
resource "aws_sns_topic" "drift_alerts" {
  name = "drift-alerts-${var.environment_suffix}"

  tags = {
    Name        = "drift-alerts-${var.environment_suffix}"
    Purpose     = "Drift Detection Notifications"
    Environment = var.environment_suffix
  }
}

resource "aws_sns_topic_subscription" "drift_alerts_email" {
  topic_arn = aws_sns_topic.drift_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# EventBridge rule for scheduled drift checks (Requirement 5)
resource "aws_cloudwatch_event_rule" "drift_check_schedule" {
  name                = "drift-check-schedule-${var.environment_suffix}"
  description         = "Trigger drift detection every 6 hours"
  schedule_expression = "rate(6 hours)"

  tags = {
    Name        = "drift-check-schedule-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_cloudwatch_event_target" "drift_detector_target" {
  rule      = aws_cloudwatch_event_rule.drift_check_schedule.name
  target_id = "DriftDetectorLambda"
  arn       = aws_lambda_function.drift_detector.arn

  retry_policy {
    maximum_retry_attempts = 2
  }
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.drift_detector.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.drift_check_schedule.arn
}

# IAM role for cross-account access (Requirement 7)
resource "aws_iam_role" "cross_account_drift_analysis" {
  name = "cross-account-drift-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
      }
      Condition = {
        StringEquals = {
          "sts:ExternalId" = var.environment_suffix
        }
      }
    }]
  })

  tags = {
    Name        = "cross-account-drift-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

resource "aws_iam_role_policy" "cross_account_policy" {
  name = "cross-account-drift-policy-${var.environment_suffix}"
  role = aws_iam_role.cross_account_drift_analysis.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::terraform-state-*",
          "arn:aws:s3:::terraform-state-*/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        Resource = "arn:aws:dynamodb:*:*:table/terraform-state-lock-*"
      }
    ]
  })
}

# CloudWatch Dashboard for drift metrics (Requirement 8)
resource "aws_cloudwatch_dashboard" "drift_metrics" {
  dashboard_name = "drift-metrics-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", label = "Drift Checks" }],
            [".", "Errors", { stat = "Sum", label = "Failed Checks" }],
            [".", "Duration", { stat = "Average", label = "Avg Duration" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Drift Detection Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/SNS", "NumberOfMessagesPublished", { stat = "Sum", label = "Drift Alerts Sent" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Drift Alert Notifications"
        }
      },
      {
        type = "log"
        properties = {
          query  = "SOURCE '/aws/lambda/drift-detector-${var.environment_suffix}' | fields @timestamp, @message | filter @message like /DRIFT_DETECTED/ | sort @timestamp desc | limit 20"
          region = var.aws_region
          title  = "Recent Drift Detections"
        }
      }
    ]
  })
}

# CloudWatch Alarms for drift detection
resource "aws_cloudwatch_metric_alarm" "drift_detection_failures" {
  alarm_name          = "drift-detection-failures-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 3
  alarm_description   = "Alert when drift detection Lambda fails multiple times"
  alarm_actions       = [aws_sns_topic.drift_alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.drift_detector.function_name
  }

  tags = {
    Name        = "drift-detection-failures-${var.environment_suffix}"
    Environment = var.environment_suffix
  }
}

# Data sources for validation (Requirement 9)
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# Data source to validate S3 bucket exists
data "aws_s3_bucket" "drift_reports_validation" {
  bucket = aws_s3_bucket.drift_reports.bucket

  depends_on = [aws_s3_bucket.drift_reports]
}

# Data source to validate DynamoDB table
data "aws_dynamodb_table" "state_lock_validation" {
  name = aws_dynamodb_table.terraform_state_lock.name

  depends_on = [aws_dynamodb_table.terraform_state_lock]
}

# Null resource for drift check trigger (Requirement 2 - Special Constraint)
resource "null_resource" "drift_check_trigger" {
  triggers = {
    timestamp = timestamp()
  }

  provisioner "local-exec" {
    command = "echo 'Drift check infrastructure deployed at ${timestamp()}'"
  }
}

# Multi-region S3 buckets for drift reports
resource "aws_s3_bucket" "drift_reports_us_west_2" {
  provider = aws.us_west_2
  bucket   = "drift-reports-usw2-${var.environment_suffix}"

  tags = {
    Name        = "drift-reports-usw2-${var.environment_suffix}"
    Purpose     = "Drift Analysis Reports Storage"
    Environment = var.environment_suffix
    Region      = "us-west-2"
  }
}

resource "aws_s3_bucket" "drift_reports_eu_central_1" {
  provider = aws.eu_central_1
  bucket   = "drift-reports-euc1-${var.environment_suffix}"

  tags = {
    Name        = "drift-reports-euc1-${var.environment_suffix}"
    Purpose     = "Drift Analysis Reports Storage"
    Environment = var.environment_suffix
    Region      = "eu-central-1"
  }
}
