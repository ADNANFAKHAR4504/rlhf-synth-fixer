# S3 Bucket for AWS Config
resource "aws_s3_bucket" "config_bucket" {
  bucket = "compliance-config-${var.environment_suffix}"
}

resource "aws_s3_bucket_versioning" "config_bucket" {
  bucket = aws_s3_bucket.config_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_policy" "config_bucket_policy" {
  bucket = aws_s3_bucket.config_bucket.id

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
        Resource = aws_s3_bucket.config_bucket.arn
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config_bucket.arn
      },
      {
        Sid    = "AWSConfigBucketPutObject"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# IAM Role for AWS Config
resource "aws_iam_role" "config_role" {
  name = "config-role-${var.environment_suffix}"

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
}

resource "aws_iam_role_policy_attachment" "config_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
}

resource "aws_iam_role_policy" "config_s3_policy" {
  name = "config-s3-policy"
  role = aws_iam_role.config_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:PutObject",
        "s3:GetBucketLocation"
      ]
      Resource = [
        aws_s3_bucket.config_bucket.arn,
        "${aws_s3_bucket.config_bucket.arn}/*"
      ]
    }]
  })
}

# AWS Config Recorder
resource "aws_config_configuration_recorder" "main" {
  name     = "compliance-recorder-${var.environment_suffix}"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported = true
    recording_strategy {
      use_only = "ALL_SUPPORTED_RESOURCE_TYPES"
    }
  }
}

resource "aws_config_delivery_channel" "main" {
  name           = "compliance-channel-${var.environment_suffix}"
  s3_bucket_name = aws_s3_bucket.config_bucket.bucket

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# Config Rule: S3 Bucket Encryption
resource "aws_config_config_rule" "s3_encryption" {
  name = "s3-bucket-encryption-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# Config Rule: RDS Public Access
resource "aws_config_config_rule" "rds_public_access" {
  name = "rds-instance-public-access-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "RDS_INSTANCE_PUBLIC_ACCESS_CHECK"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# SNS Topics for Alerts
resource "aws_sns_topic" "critical_alerts" {
  name = "compliance-critical-${var.environment_suffix}"
}

resource "aws_sns_topic" "warning_alerts" {
  name = "compliance-warning-${var.environment_suffix}"
}

resource "aws_sns_topic_subscription" "critical_email" {
  count     = length(var.security_team_emails)
  topic_arn = aws_sns_topic.critical_alerts.arn
  protocol  = "email"
  endpoint  = var.security_team_emails[count.index]
}

resource "aws_sns_topic_subscription" "warning_email" {
  count     = length(var.security_team_emails)
  topic_arn = aws_sns_topic.warning_alerts.arn
  protocol  = "email"
  endpoint  = var.security_team_emails[count.index]
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "compliance_lambda_logs" {
  name              = "/aws/lambda/compliance-analyzer-${var.environment_suffix}"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "tagging_lambda_logs" {
  name              = "/aws/lambda/compliance-tagger-${var.environment_suffix}"
  retention_in_days = 14
}

# IAM Role for Lambda Functions
resource "aws_iam_role" "lambda_role" {
  name = "compliance-lambda-role-${var.environment_suffix}"

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
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "compliance-lambda-policy"
  role = aws_iam_role.lambda_role.id

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
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "config:DescribeComplianceByConfigRule",
          "config:GetComplianceDetailsByConfigRule",
          "config:DescribeConfigRules"
        ]
        Resource = "*"
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
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.critical_alerts.arn,
          aws_sns_topic.warning_alerts.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateTags",
          "s3:PutBucketTagging",
          "rds:AddTagsToResource"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda Function: Compliance Analyzer
resource "aws_lambda_function" "compliance_analyzer" {
  filename         = "${path.module}/lambda/compliance_analyzer.zip"
  function_name    = "compliance-analyzer-${var.environment_suffix}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  timeout          = var.lambda_timeout
  source_code_hash = filebase64sha256("${path.module}/lambda/compliance_analyzer.zip")

  environment {
    variables = {
      CRITICAL_TOPIC_ARN = aws_sns_topic.critical_alerts.arn
      WARNING_TOPIC_ARN  = aws_sns_topic.warning_alerts.arn
      ENVIRONMENT_SUFFIX = var.environment_suffix
    }
  }

  depends_on = [aws_cloudwatch_log_group.compliance_lambda_logs]
}

# Lambda Function: Resource Tagger
resource "aws_lambda_function" "compliance_tagger" {
  filename         = "${path.module}/lambda/compliance_tagger.zip"
  function_name    = "compliance-tagger-${var.environment_suffix}"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  timeout          = var.lambda_timeout
  source_code_hash = filebase64sha256("${path.module}/lambda/compliance_tagger.zip")

  environment {
    variables = {
      ENVIRONMENT_SUFFIX = var.environment_suffix
    }
  }

  depends_on = [aws_cloudwatch_log_group.tagging_lambda_logs]
}

# EventBridge Rule: Daily Compliance Analysis
resource "aws_cloudwatch_event_rule" "daily_compliance_check" {
  name                = "daily-compliance-check-${var.environment_suffix}"
  description         = "Trigger compliance analysis daily"
  schedule_expression = "rate(1 day)"
}

resource "aws_cloudwatch_event_target" "compliance_analyzer_target" {
  rule      = aws_cloudwatch_event_rule.daily_compliance_check.name
  target_id = "ComplianceAnalyzerTarget"
  arn       = aws_lambda_function.compliance_analyzer.arn
}

resource "aws_lambda_permission" "allow_eventbridge_analyzer" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.compliance_analyzer.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_compliance_check.arn
}

# EventBridge Rule: Config Compliance Change
resource "aws_cloudwatch_event_rule" "config_compliance_change" {
  name        = "config-compliance-change-${var.environment_suffix}"
  description = "Trigger on Config compliance changes"

  event_pattern = jsonencode({
    source      = ["aws.config"]
    detail-type = ["Config Rules Compliance Change"]
  })
}

resource "aws_cloudwatch_event_target" "tagger_target" {
  rule      = aws_cloudwatch_event_rule.config_compliance_change.name
  target_id = "ComplianceTaggerTarget"
  arn       = aws_lambda_function.compliance_tagger.arn
}

resource "aws_lambda_permission" "allow_eventbridge_tagger" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.compliance_tagger.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.config_compliance_change.arn
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "compliance_dashboard" {
  dashboard_name = "compliance-dashboard-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["ComplianceMetrics", "CompliancePercentage", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Overall Compliance Percentage"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["ComplianceMetrics", "NonCompliantResources", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Non-Compliant Resources"
        }
      }
    ]
  })
}

# CloudWatch Metric Alarms
resource "aws_cloudwatch_metric_alarm" "low_compliance" {
  alarm_name          = "low-compliance-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CompliancePercentage"
  namespace           = "ComplianceMetrics"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alert when compliance falls below 80%"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
}
