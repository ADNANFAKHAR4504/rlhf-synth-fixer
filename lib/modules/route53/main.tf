resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = {
    Name = "dr-payment-hosted-zone-${var.environment_suffix}"
  }
}

resource "aws_route53_health_check" "primary" {
  fqdn              = var.primary_endpoint
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = var.failure_threshold
  request_interval  = var.health_check_interval

  tags = {
    Name = "dr-payment-primary-health-check-${var.environment_suffix}"
  }
}

resource "aws_route53_record" "primary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  set_identifier = "primary"
  failover_routing_policy {
    type = "PRIMARY"
  }

  alias {
    name                   = var.primary_endpoint
    zone_id                = aws_route53_zone.main.zone_id
    evaluate_target_health = true
  }

  health_check_id = aws_route53_health_check.primary.id
}

resource "aws_route53_record" "secondary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  set_identifier = "secondary"
  failover_routing_policy {
    type = "SECONDARY"
  }

  alias {
    name                   = var.secondary_endpoint
    zone_id                = aws_route53_zone.main.zone_id
    evaluate_target_health = false
  }
}
