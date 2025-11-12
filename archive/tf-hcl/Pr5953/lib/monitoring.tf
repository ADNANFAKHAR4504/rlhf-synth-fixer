# monitoring.tf - VPC Flow Logs and CloudWatch Alarms

# -----------------------------------------------------------------------------
# S3 BUCKET FOR FLOW LOGS
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "flow_logs" {
  provider = aws.primary
  bucket   = "vpc-flow-logs-${data.aws_caller_identity.current.account_id}-${var.environment_suffix}"

  tags = merge(local.common_tags, {
    Name = "vpc-flow-logs-${var.environment_suffix}"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "flow_logs" {
  provider = aws.primary
  bucket   = aws_s3_bucket.flow_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "flow_logs" {
  provider = aws.primary
  bucket   = aws_s3_bucket.flow_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "flow_logs" {
  provider = aws.primary
  bucket   = aws_s3_bucket.flow_logs.id

  rule {
    id     = "expire-old-logs"
    status = "Enabled"

    filter {}

    expiration {
      days = var.flow_log_retention_days
    }
  }
}

# S3 bucket policy for VPC Flow Logs
resource "aws_s3_bucket_policy" "flow_logs" {
  provider = aws.primary
  bucket   = aws_s3_bucket.flow_logs.id
  policy   = data.aws_iam_policy_document.flow_logs_bucket_policy.json
}

data "aws_iam_policy_document" "flow_logs_bucket_policy" {
  provider = aws.primary

  statement {
    sid    = "AWSLogDeliveryWrite"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["delivery.logs.amazonaws.com"]
    }

    actions = [
      "s3:PutObject"
    ]

    resources = [
      "${aws_s3_bucket.flow_logs.arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
    ]

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }

  statement {
    sid    = "AWSLogDeliveryAclCheck"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["delivery.logs.amazonaws.com"]
    }

    actions = [
      "s3:GetBucketAcl"
    ]

    resources = [
      aws_s3_bucket.flow_logs.arn
    ]
  }
}

# -----------------------------------------------------------------------------
# VPC FLOW LOGS
# -----------------------------------------------------------------------------

# Production VPC Flow Logs
resource "aws_flow_log" "production_vpc" {
  provider             = aws.primary
  log_destination_type = "s3"
  log_destination      = aws_s3_bucket.flow_logs.arn
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.production.id

  # 1-minute aggregation interval as required
  max_aggregation_interval = local.flow_log_aggregation_interval

  tags = merge(local.common_tags, {
    Name = "production-vpc-flow-log-${var.environment_suffix}"
  })

  depends_on = [aws_s3_bucket_policy.flow_logs]
}

# Partner VPC Flow Logs
resource "aws_flow_log" "partner_vpc" {
  provider             = aws.partner
  log_destination_type = "s3"
  log_destination      = aws_s3_bucket.flow_logs.arn
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.partner.id

  # 1-minute aggregation interval as required
  max_aggregation_interval = local.flow_log_aggregation_interval

  tags = merge(local.common_tags, {
    Name = "partner-vpc-flow-log-${var.environment_suffix}"
  })

  depends_on = [aws_s3_bucket_policy.flow_logs]
}

# -----------------------------------------------------------------------------
# CLOUDWATCH ALARMS
# -----------------------------------------------------------------------------

# SNS topic for alarm notifications
resource "aws_sns_topic" "peering_alarms" {
  provider = aws.primary
  name     = "vpc-peering-alarms-${var.environment_suffix}"

  tags = merge(local.common_tags, {
    Name = "vpc-peering-alarms-${var.environment_suffix}"
  })
}

resource "aws_sns_topic_subscription" "alarm_email" {
  provider  = aws.primary
  topic_arn = aws_sns_topic.peering_alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email_endpoint
}

# CloudWatch Log Group for peering connection metrics
resource "aws_cloudwatch_log_group" "peering_metrics" {
  provider          = aws.primary
  name              = "/aws/vpc/peering/${var.environment_suffix}"
  retention_in_days = var.flow_log_retention_days

  tags = merge(local.common_tags, {
    Name = "peering-metrics-${var.environment_suffix}"
  })
}

# CloudWatch metric filter for peering connection state changes
resource "aws_cloudwatch_log_metric_filter" "peering_state_change" {
  provider       = aws.primary
  name           = "peering-state-changes-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.peering_metrics.name
  pattern        = "[time, request_id, event_type=PeeringConnectionStateChange*, ...]"

  metric_transformation {
    name      = "PeeringConnectionStateChanges"
    namespace = "CustomVPC/Peering"
    value     = "1"
  }
}

# Alarm for peering connection state changes
resource "aws_cloudwatch_metric_alarm" "peering_state_change" {
  provider            = aws.primary
  alarm_name          = "peering-state-change-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "PeeringConnectionStateChanges"
  namespace           = "CustomVPC/Peering"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Alert when VPC peering connection state changes"
  alarm_actions       = [aws_sns_topic.peering_alarms.arn]

  tags = merge(local.common_tags, {
    Name = "peering-state-change-alarm-${var.environment_suffix}"
  })
}

# CloudWatch metric filter for traffic anomalies (rejected connections)
resource "aws_cloudwatch_log_metric_filter" "rejected_traffic" {
  provider       = aws.primary
  name           = "rejected-peering-traffic-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.peering_metrics.name
  pattern        = "[version, account, eni, source, destination, srcport, destport, protocol, packets, bytes, start, end, action=REJECT*, flow_log_status]"

  metric_transformation {
    name      = "RejectedPeeringConnections"
    namespace = "CustomVPC/Peering"
    value     = "1"
  }
}

# Alarm for traffic anomalies (high rejection rate)
resource "aws_cloudwatch_metric_alarm" "traffic_anomaly" {
  provider            = aws.primary
  alarm_name          = "peering-traffic-anomaly-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "RejectedPeeringConnections"
  namespace           = "CustomVPC/Peering"
  period              = "300"
  statistic           = "Sum"
  threshold           = "100"
  alarm_description   = "Alert when rejected peering traffic exceeds threshold"
  alarm_actions       = [aws_sns_topic.peering_alarms.arn]
  treat_missing_data  = "notBreaching"

  tags = merge(local.common_tags, {
    Name = "peering-traffic-anomaly-alarm-${var.environment_suffix}"
  })
}