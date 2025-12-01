# CloudWatch Monitoring and Alarms

resource "aws_sns_topic" "primary_alarms" {
  provider = aws.primary
  name     = "alarms-primary-${var.environment_suffix}"

  tags = {
    Name = "alarms-primary-${var.environment_suffix}"
  }
}

resource "aws_sns_topic" "secondary_alarms" {
  provider = aws.secondary
  name     = "alarms-secondary-${var.environment_suffix}"

  tags = {
    Name = "alarms-secondary-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "primary_aurora_cpu" {
  provider            = aws.primary
  alarm_name          = "aurora-cpu-high-primary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Aurora CPU utilization"
  alarm_actions       = [aws_sns_topic.primary_alarms.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.cluster_identifier
  }

  tags = {
    Name = "aurora-cpu-high-primary-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "primary_aurora_replication_lag" {
  provider            = aws.primary
  alarm_name          = "aurora-replication-lag-primary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "AuroraGlobalDBReplicationLag"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "10000"
  alarm_description   = "Aurora Global DB replication lag"
  alarm_actions       = [aws_sns_topic.primary_alarms.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.cluster_identifier
  }

  tags = {
    Name = "aurora-replication-lag-primary-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "primary_alb_unhealthy_hosts" {
  provider            = aws.primary
  alarm_name          = "alb-unhealthy-hosts-primary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "ALB unhealthy host count"
  alarm_actions       = [aws_sns_topic.primary_alarms.arn]

  dimensions = {
    LoadBalancer = aws_lb.primary.arn_suffix
    TargetGroup  = aws_lb_target_group.primary.arn_suffix
  }

  tags = {
    Name = "alb-unhealthy-hosts-primary-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "secondary_aurora_cpu" {
  provider            = aws.secondary
  alarm_name          = "aurora-cpu-high-secondary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Aurora CPU utilization"
  alarm_actions       = [aws_sns_topic.secondary_alarms.arn]

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.secondary.cluster_identifier
  }

  tags = {
    Name = "aurora-cpu-high-secondary-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_metric_alarm" "secondary_alb_unhealthy_hosts" {
  provider            = aws.secondary
  alarm_name          = "alb-unhealthy-hosts-secondary-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "ALB unhealthy host count"
  alarm_actions       = [aws_sns_topic.secondary_alarms.arn]

  dimensions = {
    LoadBalancer = aws_lb.secondary.arn_suffix
    TargetGroup  = aws_lb_target_group.secondary.arn_suffix
  }

  tags = {
    Name = "alb-unhealthy-hosts-secondary-${var.environment_suffix}"
  }
}
