# SNS Topic for Alerts - Primary Region
resource "aws_sns_topic" "alerts" {
  provider = aws.primary
  name     = "${local.resource_prefix}-alerts"

  tags = local.common_tags
}

# SNS Topic for Alerts - Secondary Region
resource "aws_sns_topic" "alerts_secondary" {
  provider = aws.secondary
  name     = "${local.resource_prefix}-alerts-secondary"

  tags = local.common_tags
}

# SNS Topic Subscription for Primary Region
resource "aws_sns_topic_subscription" "email_alerts" {
  provider  = aws.primary
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# SNS Topic Subscription for Secondary Region
resource "aws_sns_topic_subscription" "email_alerts_secondary" {
  provider  = aws.secondary
  topic_arn = aws_sns_topic.alerts_secondary.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# CloudWatch Alarms for Auto Scaling - Primary Region
resource "aws_cloudwatch_metric_alarm" "primary_high_cpu" {
  provider            = aws.primary
  alarm_name          = "${local.resource_prefix}-primary-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.primary_scale_up.arn, aws_sns_topic.alerts.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.primary.name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "primary_low_cpu" {
  provider            = aws.primary
  alarm_name          = "${local.resource_prefix}-primary-low-cpu"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "20"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.primary_scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.primary.name
  }

  tags = local.common_tags
}

# CloudWatch Alarms for Auto Scaling - Secondary Region
resource "aws_cloudwatch_metric_alarm" "secondary_high_cpu" {
  provider            = aws.secondary
  alarm_name          = "${local.resource_prefix}-secondary-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.secondary_scale_up.arn, aws_sns_topic.alerts_secondary.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.secondary.name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "secondary_low_cpu" {
  provider            = aws.secondary
  alarm_name          = "${local.resource_prefix}-secondary-low-cpu"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "20"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.secondary_scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.secondary.name
  }

  tags = local.common_tags
}

# CloudWatch Alarm for RDS CPU - Primary
resource "aws_cloudwatch_metric_alarm" "primary_rds_cpu" {
  provider            = aws.primary
  alarm_name          = "${local.resource_prefix}-primary-rds-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.id
  }

  tags = local.common_tags
}

# CloudWatch Alarm for RDS CPU - Secondary Replica
resource "aws_cloudwatch_metric_alarm" "secondary_rds_cpu" {
  provider            = aws.secondary
  alarm_name          = "${local.resource_prefix}-secondary-rds-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS replica CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts_secondary.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.secondary_replica.id
  }

  tags = local.common_tags
}

# CloudWatch Alarm for Route 53 Health Check Failures
resource "aws_cloudwatch_metric_alarm" "route53_health_check_primary" {
  alarm_name          = "${local.resource_prefix}-route53-health-primary"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = "60"
  statistic           = "Minimum"
  threshold           = "1"
  alarm_description   = "Route 53 health check failure for primary region"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "breaching"

  dimensions = {
    HealthCheckId = aws_route53_health_check.primary_alb.id
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "route53_health_check_secondary" {
  alarm_name          = "${local.resource_prefix}-route53-health-secondary"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = "60"
  statistic           = "Minimum"
  threshold           = "1"
  alarm_description   = "Route 53 health check failure for secondary region"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "breaching"

  dimensions = {
    HealthCheckId = aws_route53_health_check.secondary_alb.id
  }

  tags = local.common_tags
}