# monitoring.tf
# CloudWatch and SNS configurations for monitoring and alerting

locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

# SNS topic for alarm notifications
resource "aws_sns_topic" "alarms" {
  name = "${local.name_prefix}-alarms-topic"

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-alarms-topic"
    Type = "monitoring"
  })
}

# SNS topic subscription for email notifications
resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# CloudWatch log group for EC2 instances
resource "aws_cloudwatch_log_group" "ec2_logs" {
  name = "/aws/ec2/${local.name_prefix}-${var.random_suffix}"

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-ec2-log-group"
    Type = "monitoring"
  })
}

# CloudWatch alarm for high CPU utilization on EC2 instances
resource "aws_cloudwatch_metric_alarm" "ec2_cpu" {
  alarm_name          = "${local.name_prefix}-ec2-high-cpu"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 CPU utilization"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  ok_actions          = [aws_sns_topic.alarms.arn]

  dimensions = {
    AutoScalingGroupName = var.asg_name
  }

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-ec2-cpu-alarm"
    Type = "monitoring"
  })
}
