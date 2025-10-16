# modules/monitoring/main.tf - Monitoring Module Main Configuration

# ============================================================================
# CLOUDWATCH METRIC FILTERS
# ============================================================================

resource "aws_cloudwatch_log_metric_filter" "vpc_a_traffic_volume" {
  name           = "vpc-a-traffic-volume-${var.suffix}"
  log_group_name = var.vpc_a_log_group_name
  pattern        = "[version, account, eni, source, destination, srcport, destport, protocol, packets, bytes, windowstart, windowend, action, flowlogstatus]"

  metric_transformation {
    name      = "TrafficVolume"
    namespace = "Company/VPCPeering"
    value     = "1"
    unit      = "Count"
  }
}

resource "aws_cloudwatch_log_metric_filter" "vpc_a_rejected_connections" {
  name           = "vpc-a-rejected-connections-${var.suffix}"
  log_group_name = var.vpc_a_log_group_name
  pattern        = "[version, account, eni, source, destination, srcport, destport, protocol, packets, bytes, windowstart, windowend, action=REJECT, flowlogstatus]"

  metric_transformation {
    name      = "RejectedConnections"
    namespace = "Company/VPCPeering"
    value     = "1"
    unit      = "Count"
  }
}

resource "aws_cloudwatch_log_metric_filter" "vpc_b_traffic_volume" {
  name           = "vpc-b-traffic-volume-${var.suffix}"
  log_group_name = var.vpc_b_log_group_name
  pattern        = "[version, account, eni, source, destination, srcport, destport, protocol, packets, bytes, windowstart, windowend, action, flowlogstatus]"

  metric_transformation {
    name      = "TrafficVolume"
    namespace = "Company/VPCPeering"
    value     = "1"
    unit      = "Count"
  }
}

resource "aws_cloudwatch_log_metric_filter" "vpc_b_rejected_connections" {
  name           = "vpc-b-rejected-connections-${var.suffix}"
  log_group_name = var.vpc_b_log_group_name
  pattern        = "[version, account, eni, source, destination, srcport, destport, protocol, packets, bytes, windowstart, windowend, action=REJECT, flowlogstatus]"

  metric_transformation {
    name      = "RejectedConnections"
    namespace = "Company/VPCPeering"
    value     = "1"
    unit      = "Count"
  }
}

# ============================================================================
# SNS TOPIC FOR ALERTS
# ============================================================================

resource "aws_sns_topic" "alerts" {
  name_prefix       = "vpc-peering-alerts-${var.suffix}"
  kms_master_key_id = "alias/aws/sns"

  tags = merge(var.common_tags, {
    Name = "vpc-peering-alerts-${var.suffix}"
  })
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_sns_topic_policy" "alerts" {
  arn = aws_sns_topic.alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudWatchToPublish"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.alerts.arn
      },
      {
        Sid    = "AllowLambdaToPublish"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.alerts.arn
      },
      {
        Sid    = "AllowEventBridgeToPublish"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}

# ============================================================================
# CLOUDWATCH ALARMS
# ============================================================================

resource "aws_cloudwatch_metric_alarm" "vpc_a_traffic_volume" {
  alarm_name          = "vpc-a-high-traffic-volume-${var.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "TrafficVolume"
  namespace           = "Company/VPCPeering"
  period              = 300
  statistic           = "Sum"
  threshold           = var.traffic_volume_threshold
  alarm_description   = "Alert when VPC-A traffic volume exceeds threshold"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = merge(var.common_tags, {
    Name = "vpc-a-traffic-volume-alarm-${var.suffix}"
    VPC  = "VPC-A"
  })

  depends_on = [aws_cloudwatch_log_metric_filter.vpc_a_traffic_volume]
}

resource "aws_cloudwatch_metric_alarm" "vpc_a_rejected_connections" {
  alarm_name          = "vpc-a-high-rejected-connections-${var.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "RejectedConnections"
  namespace           = "Company/VPCPeering"
  period              = 300
  statistic           = "Sum"
  threshold           = var.rejected_connections_threshold
  alarm_description   = "Alert when VPC-A rejected connections exceed threshold"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = merge(var.common_tags, {
    Name = "vpc-a-rejected-connections-alarm-${var.suffix}"
    VPC  = "VPC-A"
  })

  depends_on = [aws_cloudwatch_log_metric_filter.vpc_a_rejected_connections]
}

resource "aws_cloudwatch_metric_alarm" "vpc_b_traffic_volume" {
  alarm_name          = "vpc-b-high-traffic-volume-${var.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "TrafficVolume"
  namespace           = "Company/VPCPeering"
  period              = 300
  statistic           = "Sum"
  threshold           = var.traffic_volume_threshold
  alarm_description   = "Alert when VPC-B traffic volume exceeds threshold"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = merge(var.common_tags, {
    Name = "vpc-b-traffic-volume-alarm-${var.suffix}"
    VPC  = "VPC-B"
  })

  depends_on = [aws_cloudwatch_log_metric_filter.vpc_b_traffic_volume]
}

resource "aws_cloudwatch_metric_alarm" "vpc_b_rejected_connections" {
  alarm_name          = "vpc-b-high-rejected-connections-${var.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "RejectedConnections"
  namespace           = "Company/VPCPeering"
  period              = 300
  statistic           = "Sum"
  threshold           = var.rejected_connections_threshold
  alarm_description   = "Alert when VPC-B rejected connections exceed threshold"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = merge(var.common_tags, {
    Name = "vpc-b-rejected-connections-alarm-${var.suffix}"
    VPC  = "VPC-B"
  })

  depends_on = [aws_cloudwatch_log_metric_filter.vpc_b_rejected_connections]
}

# ============================================================================
# CLOUDWATCH DASHBOARD
# ============================================================================

resource "aws_cloudwatch_dashboard" "vpc_peering" {
  count          = var.create_dashboard ? 1 : 0
  dashboard_name = "vpc-peering-monitoring-${var.suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["Company/VPCPeering", "TrafficVolume"]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "VPC Traffic Volume"
          yAxis = {
            left = {
              label = "Count"
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["Company/VPCPeering", "RejectedConnections"]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Rejected Connections"
          yAxis = {
            left = {
              label = "Count"
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = var.lambda_function_name != "" ? [
            ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_function_name],
            [".", "Errors", ".", "."],
            [".", "Duration", ".", "."]
          ] : []
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Lambda Execution Metrics"
        }
      },
      {
        type = "log"
        properties = {
          query  = "SOURCE '${var.vpc_a_log_group_name}' | fields @timestamp, srcaddr, dstaddr, srcport, dstport, action | filter action = 'REJECT' | sort @timestamp desc | limit 20"
          region = var.aws_region
          title  = "Recent Rejected Connections (VPC-A)"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["Company/VPCPeering", "UniqueSourceIPs"],
            [".", "ExternalTraffic"]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Traffic Sources"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["Company/VPCPeering", "TotalBytes"]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Data Transfer Volume"
          yAxis = {
            left = {
              label = "Bytes"
            }
          }
        }
      }
    ]
  })
}