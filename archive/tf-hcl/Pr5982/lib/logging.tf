# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/application/payment-${var.environment_suffix}"
  retention_in_days = 30

  lifecycle {
    prevent_destroy = false
    ignore_changes  = []
  }

  tags = merge(
    local.common_tags,
    {
      Name = "application-logs-${var.environment_suffix}"
    }
  )
}

resource "aws_cloudwatch_log_group" "infrastructure" {
  name              = "/aws/infrastructure/payment-${var.environment_suffix}"
  retention_in_days = 30

  lifecycle {
    prevent_destroy = false
    ignore_changes  = []
  }

  tags = merge(
    local.common_tags,
    {
      Name = "infrastructure-logs-${var.environment_suffix}"
    }
  )
}

# IAM Role for CloudWatch Logs to Kinesis Firehose
resource "aws_iam_role" "cloudwatch_to_firehose" {
  name_prefix = "cloudwatch-firehose-${var.environment_suffix}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "logs.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "cloudwatch-firehose-role-${var.environment_suffix}"
    }
  )
}

resource "aws_iam_role_policy" "cloudwatch_to_firehose" {
  name_prefix = "cloudwatch-firehose-${var.environment_suffix}-"
  role        = aws_iam_role.cloudwatch_to_firehose.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "firehose:PutRecord",
          "firehose:PutRecordBatch"
        ]
        Resource = aws_kinesis_firehose_delivery_stream.onprem_logs.arn
      }
    ]
  })
}

# S3 Bucket for Backup Logs
resource "aws_s3_bucket" "logs_backup" {
  bucket = "payment-logs-backup-${var.environment_suffix}"

  tags = merge(
    local.common_tags,
    {
      Name = "logs-backup-${var.environment_suffix}"
    }
  )
}

resource "aws_s3_bucket_lifecycle_configuration" "logs_backup" {
  bucket = aws_s3_bucket.logs_backup.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs_backup" {
  bucket = aws_s3_bucket.logs_backup.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# IAM Role for Kinesis Firehose
resource "aws_iam_role" "firehose" {
  name_prefix = "firehose-${var.environment_suffix}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "firehose.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "firehose-role-${var.environment_suffix}"
    }
  )
}

resource "aws_iam_role_policy" "firehose_s3" {
  name_prefix = "firehose-s3-${var.environment_suffix}-"
  role        = aws_iam_role.firehose.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:AbortMultipartUpload",
          "s3:GetBucketLocation",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:PutObject"
        ]
        Resource = [
          aws_s3_bucket.logs_backup.arn,
          "${aws_s3_bucket.logs_backup.arn}/*"
        ]
      }
    ]
  })
}

# Kinesis Firehose for Log Forwarding
resource "aws_kinesis_firehose_delivery_stream" "onprem_logs" {
  name        = "payment-logs-onprem-${var.environment_suffix}"
  destination = "http_endpoint"

  http_endpoint_configuration {
    url                = "https://${var.onprem_syslog_endpoint}/logs"
    name               = "OnPremisesSyslog"
    access_key         = "placeholder-access-key"
    buffering_size     = 5
    buffering_interval = 300
    retry_duration     = 300
    role_arn           = aws_iam_role.firehose.arn

    s3_backup_mode = "FailedDataOnly"

    request_configuration {
      content_encoding = "GZIP"

      common_attributes {
        name  = "Environment"
        value = local.environment
      }

      common_attributes {
        name  = "Source"
        value = "AWS"
      }
    }

    cloudwatch_logging_options {
      enabled         = true
      log_group_name  = aws_cloudwatch_log_group.firehose.name
      log_stream_name = "HTTPEndpointDelivery"
    }

    s3_configuration {
      role_arn           = aws_iam_role.firehose.arn
      bucket_arn         = aws_s3_bucket.logs_backup.arn
      buffering_size     = 5
      buffering_interval = 300
      compression_format = "GZIP"

      cloudwatch_logging_options {
        enabled         = true
        log_group_name  = aws_cloudwatch_log_group.firehose.name
        log_stream_name = "S3Delivery"
      }
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "onprem-logs-firehose-${var.environment_suffix}"
    }
  )
}

# CloudWatch Log Group for Firehose
resource "aws_cloudwatch_log_group" "firehose" {
  name              = "/aws/kinesisfirehose/payment-${var.environment_suffix}"
  retention_in_days = 7

  tags = merge(
    local.common_tags,
    {
      Name = "firehose-logs-${var.environment_suffix}"
    }
  )
}

# CloudWatch Log Subscription Filter
resource "aws_cloudwatch_log_subscription_filter" "application_to_onprem" {
  name            = "application-to-onprem-${var.environment_suffix}"
  log_group_name  = aws_cloudwatch_log_group.ecs_payment.name
  filter_pattern  = ""
  destination_arn = aws_kinesis_firehose_delivery_stream.onprem_logs.arn
  role_arn        = aws_iam_role.cloudwatch_to_firehose.arn

  depends_on = [aws_iam_role_policy.cloudwatch_to_firehose]
}

resource "aws_cloudwatch_log_subscription_filter" "infrastructure_to_onprem" {
  name            = "infrastructure-to-onprem-${var.environment_suffix}"
  log_group_name  = aws_cloudwatch_log_group.infrastructure.name
  filter_pattern  = ""
  destination_arn = aws_kinesis_firehose_delivery_stream.onprem_logs.arn
  role_arn        = aws_iam_role.cloudwatch_to_firehose.arn

  depends_on = [aws_iam_role_policy.cloudwatch_to_firehose]
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "alb-5xx-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "This metric monitors ALB 5xx errors"

  dimensions = {
    LoadBalancer = aws_lb.payment.arn_suffix
  }

  tags = merge(
    local.common_tags,
    {
      Name = "alb-5xx-alarm-${var.environment_suffix}"
    }
  )
}

resource "aws_cloudwatch_metric_alarm" "aurora_cpu" {
  alarm_name          = "aurora-high-cpu-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors Aurora CPU utilization"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.payment.cluster_identifier
  }

  tags = merge(
    local.common_tags,
    {
      Name = "aurora-cpu-alarm-${var.environment_suffix}"
    }
  )
}

resource "aws_cloudwatch_metric_alarm" "ecs_cpu" {
  alarm_name          = "ecs-high-cpu-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors ECS CPU utilization"

  dimensions = {
    ClusterName = aws_ecs_cluster.payment.name
    ServiceName = aws_ecs_service.payment_blue.name
  }

  tags = merge(
    local.common_tags,
    {
      Name = "ecs-cpu-alarm-${var.environment_suffix}"
    }
  )
}