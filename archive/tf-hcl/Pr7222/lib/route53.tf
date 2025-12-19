# route53.tf - Route 53 Health Checks and Failover Routing

# Route 53 Health Check for ALB
resource "aws_route53_health_check" "alb_primary" {
  type              = "HTTPS_STR_MATCH"
  resource_path     = "/health"
  fqdn              = aws_lb.main.dns_name
  port              = 80
  request_interval  = 30
  failure_threshold = 3
  search_string     = "OK"
  measure_latency   = true

  tags = {
    Name = "payment-alb-health-check-${var.environment_suffix}"
  }
}

# CloudWatch Alarm for Route 53 Health Check
resource "aws_cloudwatch_metric_alarm" "route53_health_check" {
  alarm_name          = "payment-route53-health-check-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1
  alarm_description   = "Route 53 health check failed for payment ALB"
  treat_missing_data  = "breaching"

  dimensions = {
    HealthCheckId = aws_route53_health_check.alb_primary.id
  }

  alarm_actions = []

  tags = {
    Name = "payment-route53-health-check-${var.environment_suffix}"
  }
}

# SNS Topic for Route 53 Notifications
resource "aws_sns_topic" "route53_alerts" {
  name              = "payment-route53-alerts-${var.environment_suffix}"
  kms_master_key_id = aws_kms_key.cloudwatch.id

  tags = {
    Name = "payment-route53-alerts-${var.environment_suffix}"
  }
}

# Note: Route 53 hosted zone and records would typically be created here
# However, they require a registered domain name which may not be available
# in a CI/CD environment. Below is a commented example:

# resource "aws_route53_zone" "main" {
#   name = var.domain_name
#
#   tags = {
#     Name = "payment-zone-${var.environment_suffix}"
#   }
# }
#
# resource "aws_route53_record" "primary" {
#   zone_id = aws_route53_zone.main.zone_id
#   name    = "api.${var.domain_name}"
#   type    = "A"
#
#   alias {
#     name                   = aws_lb.main.dns_name
#     zone_id                = aws_lb.main.zone_id
#     evaluate_target_health = true
#   }
#
#   set_identifier = "primary"
#
#   failover_routing_policy {
#     type = "PRIMARY"
#   }
#
#   health_check_id = aws_route53_health_check.alb_primary.id
# }
#
# resource "aws_route53_record" "secondary" {
#   zone_id = aws_route53_zone.main.zone_id
#   name    = "api.${var.domain_name}"
#   type    = "A"
#
#   alias {
#     name                   = aws_lb.main.dns_name
#     zone_id                = aws_lb.main.zone_id
#     evaluate_target_health = true
#   }
#
#   set_identifier = "secondary"
#
#   failover_routing_policy {
#     type = "SECONDARY"
#   }
# }
