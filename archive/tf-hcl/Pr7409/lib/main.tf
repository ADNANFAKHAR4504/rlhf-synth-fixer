# main.tf - Payment Processing Observability Platform

# Data sources
data "aws_caller_identity" "current" {}

# SNS Topics for different alert severities

resource "aws_sns_topic" "critical_alerts" {
  name              = "payment-monitoring-critical-${var.environment_suffix}"
  display_name      = "Critical Payment Processing Alerts"
  kms_master_key_id = aws_kms_key.sns_encryption.id

  tags = {
    Name     = "critical-alerts-${var.environment_suffix}"
    Severity = "Critical"
  }
}

resource "aws_sns_topic" "warning_alerts" {
  name              = "payment-monitoring-warning-${var.environment_suffix}"
  display_name      = "Warning Payment Processing Alerts"
  kms_master_key_id = aws_kms_key.sns_encryption.id

  tags = {
    Name     = "warning-alerts-${var.environment_suffix}"
    Severity = "Warning"
  }
}

resource "aws_sns_topic" "info_alerts" {
  name              = "payment-monitoring-info-${var.environment_suffix}"
  display_name      = "Info Payment Processing Alerts"
  kms_master_key_id = aws_kms_key.sns_encryption.id

  tags = {
    Name     = "info-alerts-${var.environment_suffix}"
    Severity = "Info"
  }
}

# KMS key for SNS encryption
resource "aws_kms_key" "sns_encryption" {
  description             = "KMS key for SNS topic encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "sns-encryption-key-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "sns_encryption" {
  name          = "alias/sns-encryption-${var.environment_suffix}"
  target_key_id = aws_kms_key.sns_encryption.key_id
}

# SNS Topic Policy for CloudWatch Alarms
resource "aws_sns_topic_policy" "critical_alerts" {
  arn    = aws_sns_topic.critical_alerts.arn
  policy = data.aws_iam_policy_document.sns_topic_policy.json
}

resource "aws_sns_topic_policy" "warning_alerts" {
  arn    = aws_sns_topic.warning_alerts.arn
  policy = data.aws_iam_policy_document.sns_topic_policy.json
}

resource "aws_sns_topic_policy" "info_alerts" {
  arn    = aws_sns_topic.info_alerts.arn
  policy = data.aws_iam_policy_document.sns_topic_policy.json
}

data "aws_iam_policy_document" "sns_topic_policy" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudwatch.amazonaws.com"]
    }

    actions = [
      "SNS:Publish"
    ]

    resources = ["*"]
  }
}

# Email subscriptions for critical alerts
resource "aws_sns_topic_subscription" "critical_email" {
  count     = length(var.critical_email_endpoints)
  topic_arn = aws_sns_topic.critical_alerts.arn
  protocol  = "email"
  endpoint  = var.critical_email_endpoints[count.index]
}

# SMS subscriptions for critical alerts
resource "aws_sns_topic_subscription" "critical_sms" {
  count     = length(var.critical_sms_endpoints)
  topic_arn = aws_sns_topic.critical_alerts.arn
  protocol  = "sms"
  endpoint  = var.critical_sms_endpoints[count.index]
}

# Email subscriptions for warning alerts
resource "aws_sns_topic_subscription" "warning_email" {
  count     = length(var.warning_email_endpoints)
  topic_arn = aws_sns_topic.warning_alerts.arn
  protocol  = "email"
  endpoint  = var.warning_email_endpoints[count.index]
}

# Email subscriptions for info alerts
resource "aws_sns_topic_subscription" "info_email" {
  count     = length(var.info_email_endpoints)
  topic_arn = aws_sns_topic.info_alerts.arn
  protocol  = "email"
  endpoint  = var.info_email_endpoints[count.index]
}

# CloudWatch Log Groups with retention policy
resource "aws_cloudwatch_log_group" "application_logs" {
  count             = length(var.log_group_names)
  name              = var.log_group_names[count.index]
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  tags = {
    Name = "${var.log_group_names[count.index]}-${var.environment_suffix}"
  }
}

# KMS key for CloudWatch Logs encryption
resource "aws_kms_key" "cloudwatch_logs" {
  description             = "KMS key for CloudWatch Logs encryption"
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
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      }
    ]
  })

  tags = {
    Name = "cloudwatch-logs-key-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "cloudwatch_logs" {
  name          = "alias/cloudwatch-logs-${var.environment_suffix}"
  target_key_id = aws_kms_key.cloudwatch_logs.key_id
}

# Metric filters to extract error rates and latency
resource "aws_cloudwatch_log_metric_filter" "error_rate" {
  count          = length(var.log_group_names)
  name           = "error-rate-${var.environment_suffix}-${count.index}"
  log_group_name = var.log_group_names[count.index]
  pattern        = "[time, request_id, level = ERROR*, msg]"

  metric_transformation {
    name          = "ErrorCount"
    namespace     = "PaymentProcessing/${var.environment_suffix}"
    value         = "1"
    default_value = "0"
    unit          = "Count"
  }

  depends_on = [aws_cloudwatch_log_group.application_logs]
}

resource "aws_cloudwatch_log_metric_filter" "latency" {
  count          = length(var.log_group_names)
  name           = "latency-${var.environment_suffix}-${count.index}"
  log_group_name = var.log_group_names[count.index]
  pattern        = "[time, request_id, level, msg, latency_field = latency*, latency_value]"

  metric_transformation {
    name          = "RequestLatency"
    namespace     = "PaymentProcessing/${var.environment_suffix}"
    value         = "$latency_value"
    default_value = "0"
    unit          = "Milliseconds"
  }

  depends_on = [aws_cloudwatch_log_group.application_logs]
}

# Cross-account log sharing (if security account ID provided)
resource "aws_cloudwatch_log_resource_policy" "cross_account_sharing" {
  count           = var.security_account_id != "" ? 1 : 0
  policy_name     = "cross-account-log-sharing-${var.environment_suffix}"
  policy_document = data.aws_iam_policy_document.cross_account_logs[0].json
}

data "aws_iam_policy_document" "cross_account_logs" {
  count = var.security_account_id != "" ? 1 : 0

  statement {
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${var.security_account_id}:root"]
    }

    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:GetLogEvents",
      "logs:FilterLogEvents"
    ]

    resources = [
      for lg in var.log_group_names : "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:${lg}:*"
    ]
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "payment_processing" {
  dashboard_name = "payment-processing-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", { stat = "Average", label = "ECS CPU" }],
            [".", "MemoryUtilization", { stat = "Average", label = "ECS Memory" }]
          ]
          period = 60
          region = var.aws_region
          title  = "ECS Cluster Performance"
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average" }],
            [".", "DatabaseConnections", { stat = "Average" }],
            [".", "ReadLatency", { stat = "Average" }],
            [".", "WriteLatency", { stat = "Average" }]
          ]
          period = 60
          region = var.aws_region
          title  = "RDS Aurora Performance"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average" }],
            [".", "RequestCount", { stat = "Sum" }],
            [".", "HTTPCode_Target_4XX_Count", { stat = "Sum" }],
            [".", "HTTPCode_Target_5XX_Count", { stat = "Sum" }]
          ]
          period = 60
          region = var.aws_region
          title  = "ALB Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["PaymentProcessing/${var.environment_suffix}", "ErrorCount", { stat = "Sum" }],
            [".", "RequestLatency", { stat = "Average" }]
          ]
          period = 60
          region = var.aws_region
          title  = "Custom Application Metrics"
        }
      },
      {
        type = "log"
        properties = {
          query  = <<-EOT
            SOURCE ${length(var.log_group_names) > 0 ? var.log_group_names[0] : "/aws/ecs/payment-processing"}
            | fields @timestamp, @message
            | filter @message like /ERROR/
            | sort @timestamp desc
            | limit 20
          EOT
          region = var.aws_region
          title  = "Recent Errors"
        }
      }
    ]
  })
}

# ECS CPU Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "ecs-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = var.cpu_alarm_threshold
  alarm_description   = "ECS cluster CPU utilization is too high"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
  ok_actions          = [aws_sns_topic.info_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = var.ecs_cluster_name
  }

  tags = {
    Name = "ecs-cpu-alarm-${var.environment_suffix}"
  }
}

# ECS Memory Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  alarm_name          = "ecs-memory-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = var.memory_alarm_threshold
  alarm_description   = "ECS cluster memory utilization is too high"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
  ok_actions          = [aws_sns_topic.info_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = var.ecs_cluster_name
  }

  tags = {
    Name = "ecs-memory-alarm-${var.environment_suffix}"
  }
}

# RDS CPU Alarm
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "rds-cpu-high-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 75
  alarm_description   = "RDS CPU utilization is too high"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]
  ok_actions          = [aws_sns_topic.info_alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = var.rds_cluster_identifier
  }

  tags = {
    Name = "rds-cpu-alarm-${var.environment_suffix}"
  }
}

# Application Error Rate Alarm
resource "aws_cloudwatch_metric_alarm" "app_error_rate" {
  count               = length(var.log_group_names)
  alarm_name          = "app-error-rate-high-${var.environment_suffix}-${count.index}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorCount"
  namespace           = "PaymentProcessing/${var.environment_suffix}"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Application error rate is too high"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
  ok_actions          = [aws_sns_topic.info_alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Name = "error-rate-alarm-${var.environment_suffix}"
  }

  depends_on = [aws_cloudwatch_log_metric_filter.error_rate]
}

# Composite Alarm - Critical System State
resource "aws_cloudwatch_composite_alarm" "critical_system_state" {
  alarm_name        = "critical-system-state-${var.environment_suffix}"
  alarm_description = "Multiple critical conditions detected simultaneously"
  actions_enabled   = true
  alarm_actions     = [aws_sns_topic.critical_alerts.arn]
  ok_actions        = [aws_sns_topic.info_alerts.arn]

  alarm_rule = "ALARM(${aws_cloudwatch_metric_alarm.ecs_cpu_high.alarm_name}) AND ALARM(${aws_cloudwatch_metric_alarm.ecs_memory_high.alarm_name})"

  tags = {
    Name = "composite-alarm-${var.environment_suffix}"
  }
}

# CloudWatch Synthetics Canary IAM Role
resource "aws_iam_role" "canary_role" {
  name               = "canary-execution-role-${var.environment_suffix}"
  assume_role_policy = data.aws_iam_policy_document.canary_assume_role.json

  tags = {
    Name = "canary-role-${var.environment_suffix}"
  }
}

data "aws_iam_policy_document" "canary_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role_policy_attachment" "canary_execution" {
  role       = aws_iam_role.canary_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchSyntheticsFullAccess"
}

resource "aws_iam_role_policy" "canary_cloudwatch_logs" {
  name   = "canary-cloudwatch-logs-${var.environment_suffix}"
  role   = aws_iam_role.canary_role.id
  policy = data.aws_iam_policy_document.canary_logs.json
}

data "aws_iam_policy_document" "canary_logs" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/cwsyn-*"]
  }
}

# S3 bucket for canary artifacts
resource "aws_s3_bucket" "canary_artifacts" {
  bucket        = "canary-artifacts-${var.environment_suffix}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = {
    Name = "canary-artifacts-${var.environment_suffix}"
  }
}

resource "aws_s3_bucket_public_access_block" "canary_artifacts" {
  bucket = aws_s3_bucket.canary_artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "canary_artifacts" {
  bucket = aws_s3_bucket.canary_artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "canary_artifacts" {
  bucket = aws_s3_bucket.canary_artifacts.id

  rule {
    id     = "cleanup-old-artifacts"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = 30
    }
  }
}

# S3 bucket for canary code
resource "aws_s3_bucket" "canary_code" {
  bucket        = "canary-code-${var.environment_suffix}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = {
    Name = "canary-code-${var.environment_suffix}"
  }
}

resource "aws_s3_bucket_public_access_block" "canary_code" {
  bucket = aws_s3_bucket.canary_code.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Canary code package
data "archive_file" "canary_code" {
  type        = "zip"
  output_path = "${path.module}/canary.zip"

  source {
    content  = <<-EOT
      const synthetics = require('Synthetics');
      const log = require('SyntheticsLogger');

      const apiCanaryBlueprint = async function () {
          const url = '${var.api_endpoint_url}';

          let page = await synthetics.getPage();
          const response = await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 30000});

          if (!response) {
              throw "Failed to load page!";
          }

          let statusCode = response.status();
          log.info('Response status code: ' + statusCode);

          if (statusCode < 200 || statusCode > 299) {
              throw "Failed page load with status: " + statusCode;
          }

          log.info('API endpoint check successful');
      };

      exports.handler = async () => {
          return await apiCanaryBlueprint();
      };
    EOT
    filename = "nodejs/node_modules/apiCanaryBlueprint.js"
  }
}

resource "aws_s3_object" "canary_code" {
  bucket = aws_s3_bucket.canary_code.id
  key    = "canary-code.zip"
  source = data.archive_file.canary_code.output_path
  etag   = data.archive_file.canary_code.output_md5
}

# CloudWatch Synthetics Canary
resource "aws_synthetics_canary" "api_monitor" {
  name                 = "api-monitor-${var.environment_suffix}"
  artifact_s3_location = "s3://${aws_s3_bucket.canary_artifacts.id}/canary-results"
  execution_role_arn   = aws_iam_role.canary_role.arn
  handler              = "apiCanaryBlueprint.handler"
  runtime_version      = "syn-nodejs-puppeteer-7.0"
  start_canary         = true

  schedule {
    expression          = "rate(${var.canary_check_interval} minutes)"
    duration_in_seconds = 0
  }

  run_config {
    timeout_in_seconds = 60
    memory_in_mb       = 960
    active_tracing     = var.enable_xray
  }

  artifact_config {
    s3_encryption {
      encryption_mode = "SSE_S3"
    }
  }

  s3_bucket = aws_s3_bucket.canary_code.id
  s3_key    = aws_s3_object.canary_code.key

  tags = {
    Name = "api-canary-${var.environment_suffix}"
  }

  depends_on = [
    aws_iam_role_policy_attachment.canary_execution,
    aws_iam_role_policy.canary_cloudwatch_logs
  ]
}

# Canary Failure Alarm
resource "aws_cloudwatch_metric_alarm" "canary_failed" {
  alarm_name          = "canary-check-failed-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "SuccessPercent"
  namespace           = "CloudWatchSynthetics"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "API endpoint canary check is failing"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
  ok_actions          = [aws_sns_topic.info_alerts.arn]
  treat_missing_data  = "breaching"

  dimensions = {
    CanaryName = aws_synthetics_canary.api_monitor.name
  }

  tags = {
    Name = "canary-alarm-${var.environment_suffix}"
  }
}

# Note: Container Insights should be enabled at ECS cluster creation time
# This configuration monitors existing ECS clusters with Container Insights already enabled
# To enable Container Insights on an existing cluster, use AWS CLI:
# aws ecs update-cluster-settings --cluster <cluster-name> --settings name=containerInsights,value=enabled

# CloudWatch Logs Insights saved queries
resource "aws_cloudwatch_query_definition" "error_analysis" {
  name = "error-analysis-${var.environment_suffix}"

  log_group_names = var.log_group_names

  query_string = <<-EOT
    fields @timestamp, @message, @logStream
    | filter @message like /ERROR/
    | stats count() by bin(5m)
    | sort @timestamp desc
  EOT
}

resource "aws_cloudwatch_query_definition" "latency_percentiles" {
  name = "latency-percentiles-${var.environment_suffix}"

  log_group_names = var.log_group_names

  query_string = <<-EOT
    fields @timestamp, latency
    | filter ispresent(latency)
    | stats avg(latency), pct(latency, 50), pct(latency, 95), pct(latency, 99) by bin(5m)
    | sort @timestamp desc
  EOT
}

resource "aws_cloudwatch_query_definition" "request_volume" {
  name = "request-volume-${var.environment_suffix}"

  log_group_names = var.log_group_names

  query_string = <<-EOT
    fields @timestamp, request_id
    | stats count() as request_count by bin(1m)
    | sort @timestamp desc
  EOT
}
