terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "environment_suffix" { type = string }
variable "region" { type = string }
variable "cluster_identifier" { type = string }
variable "sns_topic_arn" { type = string }

resource "aws_cloudwatch_metric_alarm" "replication_lag" {
  alarm_name          = "transaction-replication-lag-${var.region}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "AuroraGlobalDBReplicationLag"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 60000
  alarm_description   = "Alert when replication lag exceeds 60 seconds"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    DBClusterIdentifier = var.cluster_identifier
  }

  tags = {
    Name = "transaction-replication-lag-${var.region}-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "db_connections" {
  alarm_name          = "transaction-db-connections-${var.region}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "Alert when database connections exceed threshold"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    DBClusterIdentifier = var.cluster_identifier
  }
}

resource "aws_cloudwatch_metric_alarm" "cpu_utilization" {
  alarm_name          = "transaction-cpu-utilization-${var.region}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alert when CPU utilization exceeds 80%"
  alarm_actions       = [var.sns_topic_arn]

  dimensions = {
    DBClusterIdentifier = var.cluster_identifier
  }
}

output "replication_lag_alarm_arn" { value = aws_cloudwatch_metric_alarm.replication_lag.arn }
