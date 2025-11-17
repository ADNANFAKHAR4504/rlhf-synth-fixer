# Route 53 Hosted Zone
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = {
    Name = "zone-${var.environment_suffix}"
  }
}

# Health Check for Primary Region
resource "aws_route53_health_check" "primary" {
  fqdn              = var.primary_endpoint
  port              = 80
  type              = "HTTP"
  resource_path     = var.health_check_path
  failure_threshold = 3
  request_interval  = var.health_check_interval

  tags = {
    Name    = "health-check-primary-${var.environment_suffix}"
    DR-Role = "primary"
  }
}

# Health Check for Secondary Region
resource "aws_route53_health_check" "secondary" {
  fqdn              = var.secondary_endpoint
  port              = 80
  type              = "HTTP"
  resource_path     = var.health_check_path
  failure_threshold = 3
  request_interval  = var.health_check_interval

  tags = {
    Name    = "health-check-secondary-${var.environment_suffix}"
    DR-Role = "secondary"
  }
}

# Route 53 Record - Primary (Failover Primary)
resource "aws_route53_record" "primary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  set_identifier = "primary"

  failover_routing_policy {
    type = "PRIMARY"
  }

  health_check_id = aws_route53_health_check.primary.id

  alias {
    name                   = var.primary_endpoint
    zone_id                = var.primary_alb_zone_id
    evaluate_target_health = true
  }
}

# Route 53 Record - Secondary (Failover Secondary)
resource "aws_route53_record" "secondary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  set_identifier = "secondary"

  failover_routing_policy {
    type = "SECONDARY"
  }

  health_check_id = aws_route53_health_check.secondary.id

  alias {
    name                   = var.secondary_endpoint
    zone_id                = var.secondary_alb_zone_id
    evaluate_target_health = true
  }
}

# CloudWatch Alarm for Primary Health Check
resource "aws_cloudwatch_metric_alarm" "primary_health" {
  alarm_name          = "route53-primary-health-${var.environment_suffix}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1
  alarm_description   = "Primary region health check failing"
  treat_missing_data  = "breaching"

  dimensions = {
    HealthCheckId = aws_route53_health_check.primary.id
  }

  tags = {
    Name    = "alarm-route53-primary-${var.environment_suffix}"
    DR-Role = "primary"
  }
}
