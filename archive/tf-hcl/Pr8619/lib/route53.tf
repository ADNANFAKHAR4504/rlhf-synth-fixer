# Route53 Hosted Zone
resource "aws_route53_zone" "main" {
  name = var.route53_zone_name

  tags = {
    Name = "route53-zone-${var.environment_suffix}"
  }
}

# Weighted routing for gradual migration - AWS environment
resource "aws_route53_record" "app_aws" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.${var.route53_zone_name}"
  type    = "A"

  weighted_routing_policy {
    weight = var.aws_weighted_routing_weight
  }

  set_identifier = "aws-${var.environment_suffix}"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Weighted routing for gradual migration - On-premises environment
resource "aws_route53_record" "app_onprem" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.${var.route53_zone_name}"
  type    = "CNAME"

  weighted_routing_policy {
    weight = 100 - var.aws_weighted_routing_weight
  }

  set_identifier = "onprem"

  ttl     = 60
  records = [var.onpremises_endpoint]
}

# Health check for ALB
resource "aws_route53_health_check" "alb" {
  fqdn              = aws_lb.main.dns_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30

  tags = {
    Name = "alb-health-check-${var.environment_suffix}"
  }
}

# CloudWatch alarm for health check
resource "aws_cloudwatch_metric_alarm" "route53_health" {
  alarm_name          = "route53-health-alarm-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1
  alarm_description   = "Route53 health check failed"
  alarm_actions       = [aws_sns_topic.migration_alerts.arn]

  dimensions = {
    HealthCheckId = aws_route53_health_check.alb.id
  }

  tags = {
    Name = "route53-health-alarm-${var.environment_suffix}"
  }
}