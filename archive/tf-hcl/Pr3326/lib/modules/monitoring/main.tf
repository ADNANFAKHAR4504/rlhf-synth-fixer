# modules/monitoring/main.tf
# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "high-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "60"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    AutoScalingGroupName = var.asg_name
  }
}

resource "aws_cloudwatch_metric_alarm" "high_memory" {
  alarm_name          = "high-memory-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "CWAgent"
  period              = "60"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 memory utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    AutoScalingGroupName = var.asg_name
  }
}

resource "aws_cloudwatch_metric_alarm" "error_rate" {
  alarm_name          = "high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors ALB 5XX error count"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    LoadBalancer = var.alb_name
  }
}

resource "aws_cloudwatch_metric_alarm" "high_latency" {
  alarm_name          = "high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors ALB target response time"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    LoadBalancer = var.alb_name
    TargetGroup  = var.target_group_arn
  }
}

# Custom CloudWatch dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "MediaStreamingPlatform"
  
  dashboard_body = templatefile("${path.module}/dashboard.json", {
    region = var.aws_region
    asg_name = var.asg_name
    alb_name = var.alb_name
    target_group_arn = var.target_group_arn
    cloudfront_distribution_id = var.cloudfront_distribution_id
  })
}

# CloudWatch Logs
resource "aws_cloudwatch_log_group" "app" {
  name              = "/media-streaming/application"
  retention_in_days = 30
  
  tags = {
    Name = "media-streaming-app-logs"
  }
}

resource "aws_cloudwatch_log_group" "alb" {
  name              = "/aws/alb/media-streaming-alb/access"
  retention_in_days = 30
  
  tags = {
    Name = "media-streaming-alb-logs"
  }
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "media-streaming-alerts"
}

# Custom metrics
resource "aws_cloudwatch_log_metric_filter" "concurrent_viewers" {
  name           = "ConcurrentViewers"
  pattern        = "{ $.event = \"session_start\" }"
  log_group_name = aws_cloudwatch_log_group.app.name
  
  metric_transformation {
    name      = "ConcurrentViewers"
    namespace = "AWS/MediaStreaming"
    value     = "1"
    default_value = "0"
  }
}

# AWS Systems Manager Parameter Store
resource "aws_ssm_parameter" "app_config" {
  name        = "/media-streaming/config"
  description = "Media Streaming Platform Configuration"
  type        = "SecureString"
  value       = jsonencode(var.app_config)
  
  tags = {
    Name = "media-streaming-app-config"
  }
}

# CloudWatch Events for monitoring
resource "aws_cloudwatch_event_rule" "asg_changes" {
  name        = "asg-changes"
  description = "Capture Auto Scaling Group changes"
  
  event_pattern = jsonencode({
    source      = ["aws.autoscaling"]
    detail_type = ["EC2 Instance Launch Successful", "EC2 Instance Terminate Successful"]
    detail      = {
      AutoScalingGroupName = [var.asg_name]
    }
  })
}

resource "aws_cloudwatch_event_target" "sns" {
  rule      = aws_cloudwatch_event_rule.asg_changes.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.alerts.arn
}