# Route 53 Health Check for Primary Region
resource "aws_route53_health_check" "primary" {
  fqdn              = "${aws_api_gateway_rest_api.primary.id}.execute-api.${var.primary_region}.amazonaws.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/prod/health"
  failure_threshold = "3"
  request_interval  = "30"

  tags = {
    Name = "payment-api-health-check-primary-${var.environment_suffix}"
  }
}

# SNS Topic for Health Check Alarms
resource "aws_sns_topic" "health_check_alerts" {
  name = "payment-api-health-alerts-${var.environment_suffix}"

  tags = {
    Name = "payment-api-health-alerts-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for Health Check
resource "aws_cloudwatch_metric_alarm" "health_check" {
  alarm_name          = "payment-api-health-check-alarm-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = "60"
  statistic           = "Minimum"
  threshold           = "1"
  alarm_description   = "This metric monitors primary API health"
  alarm_actions       = [aws_sns_topic.health_check_alerts.arn]

  dimensions = {
    HealthCheckId = aws_route53_health_check.primary.id
  }
}

# Route 53 Hosted Zone for failover routing
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = {
    Name = "payment-api-zone-${var.environment_suffix}"
  }
}

# Primary endpoint DNS record with failover routing
resource "aws_route53_record" "primary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  set_identifier = "primary"
  failover_routing_policy {
    type = "PRIMARY"
  }

  alias {
    name                   = "${aws_api_gateway_rest_api.primary.id}.execute-api.${var.primary_region}.amazonaws.com"
    zone_id                = aws_api_gateway_rest_api.primary.id
    evaluate_target_health = false
  }

  health_check_id = aws_route53_health_check.primary.id
}

# DR endpoint DNS record with failover routing
resource "aws_route53_record" "secondary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  set_identifier = "secondary"
  failover_routing_policy {
    type = "SECONDARY"
  }

  alias {
    name                   = "${aws_api_gateway_rest_api.dr.id}.execute-api.${var.dr_region}.amazonaws.com"
    zone_id                = aws_api_gateway_rest_api.dr.id
    evaluate_target_health = false
  }
}
