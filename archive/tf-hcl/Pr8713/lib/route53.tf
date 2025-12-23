# Route53 Health Check for ALB
resource "aws_route53_health_check" "alb" {
  fqdn              = aws_lb.main.dns_name
  port              = 80
  type              = "HTTP"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30

  tags = merge(local.common_tags, {
    Name = "alb-health-check-${var.environment_suffix}"
  })
}

# CloudWatch Alarm for Health Check
resource "aws_cloudwatch_metric_alarm" "health_check" {
  alarm_name          = "route53-health-check-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1
  alarm_description   = "This metric monitors Route53 health check status"
  treat_missing_data  = "breaching"

  dimensions = {
    HealthCheckId = aws_route53_health_check.alb.id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "infrastructure-alerts-${var.environment_suffix}"

  tags = merge(local.common_tags, {
    Name = "sns-alerts-${var.environment_suffix}"
  })
}
