# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  name              = "/aws/vpc/flowlogs-${var.environment_suffix}"
  retention_in_days = 14

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-vpc-flow-logs"
  })
}

resource "aws_cloudwatch_log_group" "alb_logs" {
  name              = "/aws/alb/access-logs"
  retention_in_days = 14

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-alb-logs"
  })
}

# CloudWatch Alarms for EC2 CPU Usage
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  for_each = aws_instance.web

  alarm_name          = "${local.project_prefix}-${split("-", each.key)[0]}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    InstanceId = each.value.id
  }

  tags = merge(local.env_tags[split("-", each.key)[0]], {
    Name = "${local.project_prefix}-${split("-", each.key)[0]}-high-cpu-alarm"
  })
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "${local.project_prefix}-alerts"

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-alerts"
  })
}