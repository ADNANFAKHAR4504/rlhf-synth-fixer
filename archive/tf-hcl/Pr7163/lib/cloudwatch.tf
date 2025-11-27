# SNS topic for alarms
resource "aws_sns_topic" "rds_alerts" {
  name = "rds-alerts-${var.environment_suffix}"

  tags = merge(
    local.common_tags,
    {
      Name = "rds-alerts-${var.environment_suffix}"
    }
  )
}

# Primary DB CPU alarm
resource "aws_cloudwatch_metric_alarm" "primary_cpu" {
  alarm_name          = "rds-primary-cpu-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Primary RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.rds_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "rds-primary-cpu-${var.environment_suffix}"
    }
  )
}

# Primary DB connections alarm
resource "aws_cloudwatch_metric_alarm" "primary_connections" {
  alarm_name          = "rds-primary-connections-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Primary RDS database connections"
  alarm_actions       = [aws_sns_topic.rds_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "rds-primary-connections-${var.environment_suffix}"
    }
  )
}

# DR Replica lag alarm
resource "aws_cloudwatch_metric_alarm" "dr_replica_lag" {
  provider            = aws.us-west-2
  alarm_name          = "rds-dr-replica-lag-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ReplicaLag"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 30
  alarm_description   = "DR replica replication lag"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.dr_replica.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "rds-dr-replica-lag-${var.environment_suffix}"
    }
  )
}

# DR Replica CPU alarm
resource "aws_cloudwatch_metric_alarm" "dr_cpu" {
  provider            = aws.us-west-2
  alarm_name          = "rds-dr-cpu-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "DR RDS CPU utilization"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.dr_replica.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "rds-dr-cpu-${var.environment_suffix}"
    }
  )
}
