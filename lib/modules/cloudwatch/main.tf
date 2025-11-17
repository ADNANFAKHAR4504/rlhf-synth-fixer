terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 5.0"
      configuration_aliases = [aws.primary, aws.secondary]
    }
  }
}

# SNS Topic for Alerts (Primary Region)
resource "aws_sns_topic" "alerts" {
  provider = aws.primary

  name = "dr-alerts-${var.environment_suffix}"

  tags = {
    Name = "sns-dr-alerts-${var.environment_suffix}"
  }
}

# SNS Topic Subscription
resource "aws_sns_topic_subscription" "alerts_email" {
  provider = aws.primary

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.sns_email
}

# CloudWatch Alarm - Primary RDS Replication Lag
resource "aws_cloudwatch_metric_alarm" "primary_replication_lag" {
  provider = aws.primary

  alarm_name          = "rds-replication-lag-primary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "AuroraGlobalDBReplicationLag"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = var.replication_lag_threshold
  alarm_description   = "RDS replication lag exceeded threshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBClusterIdentifier = var.primary_cluster_id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name    = "alarm-rds-lag-primary-${var.environment_suffix}"
    DR-Role = "primary"
  }
}

# CloudWatch Alarm - Primary RDS CPU
resource "aws_cloudwatch_metric_alarm" "primary_cpu" {
  provider = aws.primary

  alarm_name          = "rds-cpu-primary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU utilization high"

  dimensions = {
    DBClusterIdentifier = var.primary_cluster_id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name    = "alarm-rds-cpu-primary-${var.environment_suffix}"
    DR-Role = "primary"
  }
}

# CloudWatch Alarm - Primary RDS Connections
resource "aws_cloudwatch_metric_alarm" "primary_connections" {
  provider = aws.primary

  alarm_name          = "rds-connections-primary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "RDS database connections high"

  dimensions = {
    DBClusterIdentifier = var.primary_cluster_id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name    = "alarm-rds-connections-primary-${var.environment_suffix}"
    DR-Role = "primary"
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "dr_monitoring" {
  provider = aws.primary

  dashboard_name = "dr-monitoring-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "AuroraGlobalDBReplicationLag", { stat = "Average", label = "Replication Lag" }]
          ]
          period = 60
          stat   = "Average"
          region = "us-east-1"
          title  = "RDS Replication Lag"
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
            ["AWS/RDS", "CPUUtilization", { stat = "Average", label = "Primary CPU" }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "RDS CPU Utilization"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", { stat = "Sum", label = "Connections" }]
          ]
          period = 300
          stat   = "Sum"
          region = "us-east-1"
          title  = "Database Connections"
        }
      }
    ]
  })
}
