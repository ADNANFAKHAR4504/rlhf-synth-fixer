resource "aws_route53_zone" "main" {
  name = "payment-dr-${var.environment_suffix}.example.com"

  tags = merge(var.tags, {
    Name = "payment-dr-zone-${var.environment_suffix}"
  })
}

resource "aws_route53_health_check" "primary" {
  fqdn              = var.primary_lb_dns
  type              = "HTTPS_STR_MATCH"
  resource_path     = "/"
  failure_threshold = 3
  request_interval  = var.health_check_interval
  search_string     = "200"
  measure_latency   = true

  tags = merge(var.tags, {
    Name = "primary-health-check-${var.environment_suffix}"
  })
}

resource "aws_cloudwatch_metric_alarm" "primary_health_check" {
  alarm_name          = "primary-health-check-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1
  alarm_description   = "This metric monitors primary region health"
  treat_missing_data  = "breaching"

  dimensions = {
    HealthCheckId = aws_route53_health_check.primary.id
  }

  tags = merge(var.tags, {
    Name = "primary-health-check-alarm-${var.environment_suffix}"
  })
}

resource "aws_route53_record" "primary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.payment-dr-${var.environment_suffix}.example.com"
  type    = "A"

  set_identifier = "primary"

  failover_routing_policy {
    type = "PRIMARY"
  }

  alias {
    name                   = var.primary_lb_dns
    zone_id                = var.primary_lb_zone_id
    evaluate_target_health = true
  }

  health_check_id = aws_route53_health_check.primary.id
}

resource "aws_route53_record" "dr" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.payment-dr-${var.environment_suffix}.example.com"
  type    = "A"

  set_identifier = "dr"

  failover_routing_policy {
    type = "SECONDARY"
  }

  alias {
    name                   = var.dr_lb_dns
    zone_id                = var.dr_lb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_sns_topic" "route53_alarms" {
  name = "route53-alarms-${var.environment_suffix}"

  tags = merge(var.tags, {
    Name = "route53-alarms-${var.environment_suffix}"
  })
}

resource "aws_sns_topic_subscription" "route53_alarms_email" {
  topic_arn = aws_sns_topic.route53_alarms.arn
  protocol  = "email"
  endpoint  = "ops@example.com"
}
