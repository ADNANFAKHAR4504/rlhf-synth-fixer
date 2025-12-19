# CloudWatch alarm for primary database CPU
resource "aws_cloudwatch_metric_alarm" "primary_db_cpu" {
  provider            = aws.primary
  alarm_name          = "rds-cpu-primary-${var.environment_suffix}"
  alarm_description   = "Alert when primary database CPU exceeds threshold"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }

  tags = {
    Name              = "alarm-cpu-primary-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

# CloudWatch alarm for primary database connections
resource "aws_cloudwatch_metric_alarm" "primary_db_connections" {
  provider            = aws.primary
  alarm_name          = "rds-connections-primary-${var.environment_suffix}"
  alarm_description   = "Alert when primary database connections exceed threshold"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }

  tags = {
    Name              = "alarm-connections-primary-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

# CloudWatch alarm for primary replication lag
resource "aws_cloudwatch_metric_alarm" "primary_replication_lag" {
  provider            = aws.primary
  alarm_name          = "rds-replication-lag-primary-${var.environment_suffix}"
  alarm_description   = "Alert when replication lag exceeds 60 seconds"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ReplicaLag"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 60

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.dr.id
  }

  tags = {
    Name              = "alarm-replication-lag-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

# CloudWatch alarm for DR database CPU
resource "aws_cloudwatch_metric_alarm" "dr_db_cpu" {
  provider            = aws.dr
  alarm_name          = "rds-cpu-dr-${var.environment_suffix}"
  alarm_description   = "Alert when DR database CPU exceeds threshold"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.dr.id
  }

  tags = {
    Name              = "alarm-cpu-dr-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}

# CloudWatch alarm for DR database connections
resource "aws_cloudwatch_metric_alarm" "dr_db_connections" {
  provider            = aws.dr
  alarm_name          = "rds-connections-dr-${var.environment_suffix}"
  alarm_description   = "Alert when DR database connections exceed threshold"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.dr.id
  }

  tags = {
    Name              = "alarm-connections-dr-${var.environment_suffix}"
    Environment       = "DR"
    CostCenter        = "Infrastructure"
    environmentSuffix = var.environment_suffix
  }
}
