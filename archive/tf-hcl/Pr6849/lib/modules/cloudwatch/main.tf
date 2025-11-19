resource "aws_sns_topic" "alerts" {
  name = var.sns_topic_name

  tags = {
    Name = var.sns_topic_name
  }
}

resource "aws_sns_topic_subscription" "email" {
  count     = length(var.email_endpoints)
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.email_endpoints[count.index]
}

resource "aws_cloudwatch_metric_alarm" "cpu_utilization" {
  alarm_name          = "${var.alarm_prefix}-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBClusterIdentifier = var.cluster_identifier
  }

  tags = {
    Name = "${var.alarm_prefix}-cpu-utilization"
  }
}

resource "aws_cloudwatch_metric_alarm" "database_connections" {
  alarm_name          = "${var.alarm_prefix}-database-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "This metric monitors RDS database connections"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBClusterIdentifier = var.cluster_identifier
  }

  tags = {
    Name = "${var.alarm_prefix}-database-connections"
  }
}

resource "aws_cloudwatch_metric_alarm" "aurora_replica_lag" {
  alarm_name          = "${var.alarm_prefix}-aurora-replica-lag"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "AuroraGlobalDBReplicationLag"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Maximum"
  threshold           = 1000
  alarm_description   = "This metric monitors Aurora global replication lag"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBClusterIdentifier = var.cluster_identifier
  }

  tags = {
    Name = "${var.alarm_prefix}-aurora-replica-lag"
  }
}
