# cloudwatch.tf - CloudWatch alarms and dashboard for monitoring

# SNS topic for alarm notifications
resource "aws_sns_topic" "aurora_alerts" {
  name              = "${var.project_name}-${var.environment_suffix}-aurora-alerts"
  kms_master_key_id = aws_kms_key.aurora.id

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-alerts"
    }
  )
}

# SNS topic subscriptions for email notifications
resource "aws_sns_topic_subscription" "aurora_alerts_email" {
  for_each = toset(var.alarm_email_endpoints)

  topic_arn = aws_sns_topic.aurora_alerts.arn
  protocol  = "email"
  endpoint  = each.value
}

# Add SNS topic policy to allow EventBridge to publish
resource "aws_sns_topic_policy" "aurora_alerts" {
  arn = aws_sns_topic.aurora_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowEventBridgePublish"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.aurora_alerts.arn
      },
      {
        Sid    = "AllowCloudWatchAlarmsPublish"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.aurora_alerts.arn
      }
    ]
  })
}

# CloudWatch alarm for high CPU utilization
resource "aws_cloudwatch_metric_alarm" "aurora_cpu_high" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-aurora-cpu-high"
  alarm_description   = "Aurora cluster CPU utilization is too high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.cpu_scale_up_threshold

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora_serverless.cluster_identifier
  }

  alarm_actions = [aws_sns_topic.aurora_alerts.arn]
  ok_actions    = [aws_sns_topic.aurora_alerts.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-cpu-high"
    }
  )
}

# CloudWatch alarm for database connections
resource "aws_cloudwatch_metric_alarm" "aurora_connections_high" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-aurora-connections-high"
  alarm_description   = "Aurora database connections are approaching limit"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.connections_scale_up_threshold

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora_serverless.cluster_identifier
  }

  alarm_actions = [aws_sns_topic.aurora_alerts.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-connections-high"
    }
  )
}

# CloudWatch alarm for replication lag
resource "aws_cloudwatch_metric_alarm" "aurora_replica_lag" {
  count = var.aurora_instance_count > 1 ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment_suffix}-aurora-replica-lag"
  alarm_description   = "Aurora replica lag is too high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "AuroraReplicaLag"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Average"
  threshold           = "1000" # 1 second in milliseconds

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora_serverless.cluster_identifier
  }

  alarm_actions = [aws_sns_topic.aurora_alerts.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-replica-lag"
    }
  )
}

# CloudWatch alarm for storage space
resource "aws_cloudwatch_metric_alarm" "aurora_storage_space_low" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-aurora-storage-low"
  alarm_description   = "Aurora cluster free storage space is low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "10737418240" # 10 GB in bytes

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora_serverless.cluster_identifier
  }

  alarm_actions = [aws_sns_topic.aurora_alerts.arn]

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment_suffix}-aurora-storage-low"
    }
  )
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "aurora" {
  dashboard_name = "${var.project_name}-${var.environment_suffix}-aurora-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBClusterIdentifier", aws_rds_cluster.aurora_serverless.cluster_identifier, { stat = "Average" }],
            ["...", { stat = "Maximum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "CPU Utilization"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", "DBClusterIdentifier", aws_rds_cluster.aurora_serverless.cluster_identifier, { stat = "Average" }],
            ["...", { stat = "Maximum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Database Connections"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "ReadLatency", "DBClusterIdentifier", aws_rds_cluster.aurora_serverless.cluster_identifier, { stat = "Average" }],
            [".", "WriteLatency", ".", ".", { stat = "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Latency"
          period  = 300
          yAxis = {
            left = {
              label = "Milliseconds"
            }
          }
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "ReadThroughput", "DBClusterIdentifier", aws_rds_cluster.aurora_serverless.cluster_identifier, { stat = "Average" }],
            [".", "WriteThroughput", ".", ".", { stat = "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Throughput"
          period  = 300
          yAxis = {
            left = {
              label = "Bytes/Second"
            }
          }
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 24
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "ServerlessDatabaseCapacity", "DBClusterIdentifier", aws_rds_cluster.aurora_serverless.cluster_identifier, { stat = "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Serverless Database Capacity (ACUs)"
          period  = 300
        }
      }
    ]
  })
}