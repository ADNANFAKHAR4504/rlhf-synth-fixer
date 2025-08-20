#######################
# CloudWatch & SNS
#######################

resource "aws_cloudwatch_log_group" "web" {
  name              = "/aws/ec2/${var.name_prefix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = var.kms_key_main_arn
  tags              = merge(var.common_tags, { Name = "${var.name_prefix}-web-logs" })
}

resource "aws_cloudwatch_log_group" "alb" {
  name              = "/aws/alb/${var.name_prefix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = var.kms_key_main_arn
  tags              = merge(var.common_tags, { Name = "${var.name_prefix}-alb-logs" })
}

resource "aws_sns_topic" "alerts" {
  name              = "${var.name_prefix}-alerts"
  kms_master_key_id = var.kms_key_main_arn
  tags              = merge(var.common_tags, { Name = "${var.name_prefix}-alerts" })
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

#######################
# Alarms
#######################

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.name_prefix}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 70
  alarm_description   = "EC2 CPU high"
  alarm_actions       = [var.web_scale_up_policy_arn, aws_sns_topic.alerts.arn]
  dimensions = { AutoScalingGroupName = var.autoscaling_group_name }
  tags = merge(var.common_tags, { Name = "${var.name_prefix}-cpu-high" })
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "${var.name_prefix}-alb-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "ALB 5XX errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  dimensions = { LoadBalancer = var.alb_arn_suffix }
  tags = merge(var.common_tags, { Name = "${var.name_prefix}-alb-5xx-errors" })
}
