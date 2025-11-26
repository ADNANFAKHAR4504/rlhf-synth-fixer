# CloudWatch log group for primary RDS cluster
resource "aws_cloudwatch_log_group" "primary_db" {
  name              = "/aws/rds/cluster/aurora-primary-${var.environment_suffix}/postgresql"
  retention_in_days = 30

  tags = merge(
    var.common_tags,
    {
      Name   = "rds-logs-primary-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

# CloudWatch log group for secondary RDS cluster
resource "aws_cloudwatch_log_group" "secondary_db" {
  provider          = aws.secondary
  name              = "/aws/rds/cluster/aurora-secondary-${var.environment_suffix}/postgresql"
  retention_in_days = 30

  tags = merge(
    var.common_tags,
    {
      Name   = "rds-logs-secondary-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}

# CloudWatch alarm for replication lag in primary region
resource "aws_cloudwatch_metric_alarm" "primary_replication_lag" {
  alarm_name          = "aurora-replication-lag-primary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "AuroraGlobalDBReplicationLag"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 60000 # 60 seconds in milliseconds
  alarm_description   = "Alert when replication lag exceeds 60 seconds"
  alarm_actions       = [aws_sns_topic.primary_db_events.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.id
  }

  tags = merge(
    var.common_tags,
    {
      Name   = "replication-lag-alarm-primary-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

# CloudWatch alarm for CPU utilization in primary region
resource "aws_cloudwatch_metric_alarm" "primary_cpu" {
  alarm_name          = "aurora-cpu-primary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alert when CPU utilization exceeds 80%"
  alarm_actions       = [aws_sns_topic.primary_db_events.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.id
  }

  tags = merge(
    var.common_tags,
    {
      Name   = "cpu-alarm-primary-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

# CloudWatch alarm for database connections in primary region
resource "aws_cloudwatch_metric_alarm" "primary_connections" {
  alarm_name          = "aurora-connections-primary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "Alert when database connections exceed 100"
  alarm_actions       = [aws_sns_topic.primary_db_events.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.id
  }

  tags = merge(
    var.common_tags,
    {
      Name   = "connections-alarm-primary-${var.environment_suffix}"
      Region = var.primary_region
    }
  )
}

# CloudWatch alarm for replication lag in secondary region
resource "aws_cloudwatch_metric_alarm" "secondary_replication_lag" {
  provider            = aws.secondary
  alarm_name          = "aurora-replication-lag-secondary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "AuroraGlobalDBReplicationLag"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 60000
  alarm_description   = "Alert when replication lag exceeds 60 seconds in secondary region"
  alarm_actions       = [aws_sns_topic.secondary_db_events.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.secondary.id
  }

  tags = merge(
    var.common_tags,
    {
      Name   = "replication-lag-alarm-secondary-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}

# CloudWatch alarm for CPU utilization in secondary region
resource "aws_cloudwatch_metric_alarm" "secondary_cpu" {
  provider            = aws.secondary
  alarm_name          = "aurora-cpu-secondary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alert when CPU utilization exceeds 80% in secondary region"
  alarm_actions       = [aws_sns_topic.secondary_db_events.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.secondary.id
  }

  tags = merge(
    var.common_tags,
    {
      Name   = "cpu-alarm-secondary-${var.environment_suffix}"
      Region = var.secondary_region
    }
  )
}
