# route53.tf - Route53 Health Checks and DNS Configuration

# Route53 Hosted Zone (only create if domain is not reserved by AWS)
# Skip if domain is "example.com" which is reserved by AWS
resource "aws_route53_zone" "main" {
  count = var.domain_name != "example.com" ? 1 : 0
  name  = var.domain_name

  tags = {
    Name = "route53-zone-${var.environment_suffix}"
  }
}

# Route53 Record for ALB (only if hosted zone exists)
resource "aws_route53_record" "alb" {
  count   = var.domain_name != "example.com" ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Route53 Health Check for Blue Environment (using ALB DNS name directly)
resource "aws_route53_health_check" "blue" {
  type              = "HTTPS"
  resource_path     = "/health"
  fqdn              = aws_lb.main.dns_name
  port              = 443
  request_interval  = 30
  failure_threshold = 3
  measure_latency   = true
  disabled          = false

  tags = {
    Name = "health-check-blue-${var.environment_suffix}"
  }
}

# Route53 Health Check for Green Environment
resource "aws_route53_health_check" "green" {
  type              = "HTTPS"
  resource_path     = "/health"
  fqdn              = aws_lb.main.dns_name
  port              = 443
  request_interval  = 30
  failure_threshold = 3
  measure_latency   = true

  tags = {
    Name = "health-check-green-${var.environment_suffix}"
  }
}

# Route53 Health Check for On-Premises (Fallback)
resource "aws_route53_health_check" "onprem" {
  type              = "HTTPS"
  resource_path     = "/health"
  fqdn              = var.onprem_db_endpoint
  port              = 443
  request_interval  = 30
  failure_threshold = 3
  measure_latency   = true

  tags = {
    Name = "health-check-onprem-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for Route53 Health Check (Blue)
resource "aws_cloudwatch_metric_alarm" "route53_health_blue" {
  alarm_name          = "route53-health-blue-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1
  alarm_description   = "This metric monitors Route53 health check for blue environment"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    HealthCheckId = aws_route53_health_check.blue.id
  }

  tags = {
    Name = "route53-health-blue-alarm-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for Route53 Health Check (Green)
resource "aws_cloudwatch_metric_alarm" "route53_health_green" {
  alarm_name          = "route53-health-green-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1
  alarm_description   = "This metric monitors Route53 health check for green environment"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    HealthCheckId = aws_route53_health_check.green.id
  }

  tags = {
    Name = "route53-health-green-alarm-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for High Error Rate (triggers failback to on-premises)
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "high-error-rate-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 50 # Adjust based on traffic volume
  alarm_description   = "This metric monitors high error rate for automatic failback"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name = "high-error-rate-alarm-${var.environment_suffix}"
  }
}

# CloudWatch Metric Math for Error Rate Percentage
resource "aws_cloudwatch_metric_alarm" "error_rate_percentage" {
  alarm_name          = "error-rate-percentage-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  threshold           = var.health_check_threshold
  alarm_description   = "This metric monitors error rate percentage exceeding ${var.health_check_threshold}%"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  metric_query {
    id          = "error_rate"
    expression  = "(m1 / m2) * 100"
    label       = "Error Rate Percentage"
    return_data = true
  }

  metric_query {
    id = "m1"
    metric {
      metric_name = "HTTPCode_Target_5XX_Count"
      namespace   = "AWS/ApplicationELB"
      period      = 60
      stat        = "Sum"

      dimensions = {
        LoadBalancer = aws_lb.main.arn_suffix
      }
    }
  }

  metric_query {
    id = "m2"
    metric {
      metric_name = "RequestCount"
      namespace   = "AWS/ApplicationELB"
      period      = 60
      stat        = "Sum"

      dimensions = {
        LoadBalancer = aws_lb.main.arn_suffix
      }
    }
  }

  tags = {
    Name = "error-rate-percentage-alarm-${var.environment_suffix}"
  }
}
