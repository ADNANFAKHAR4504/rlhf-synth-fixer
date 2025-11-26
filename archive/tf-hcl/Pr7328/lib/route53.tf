# Route 53 Hosted Zone
resource "aws_route53_zone" "main" {
  provider = aws.primary
  name     = var.domain_name

  tags = merge(local.common_tags, {
    Name    = "hosted-zone-${var.environment_suffix}"
    DR-Role = "both"
  })
}

# Route 53 Health Check for Primary ALB
resource "aws_route53_health_check" "primary" {
  provider          = aws.primary
  type              = "HTTPS"
  resource_path     = "/health"
  fqdn              = aws_lb.primary.dns_name
  port              = 443
  failure_threshold = 3
  request_interval  = 30

  tags = merge(local.common_tags, {
    Name    = "health-check-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# Route 53 Health Check for Secondary ALB
resource "aws_route53_health_check" "secondary" {
  provider          = aws.primary
  type              = "HTTPS"
  resource_path     = "/health"
  fqdn              = aws_lb.secondary.dns_name
  port              = 443
  failure_threshold = 3
  request_interval  = 30

  tags = merge(local.common_tags, {
    Name    = "health-check-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# Route 53 Primary Record with Failover Routing
resource "aws_route53_record" "primary" {
  provider = aws.primary
  zone_id  = aws_route53_zone.main.zone_id
  name     = "app.${var.domain_name}"
  type     = "A"

  failover_routing_policy {
    type = "PRIMARY"
  }

  set_identifier  = "primary"
  health_check_id = aws_route53_health_check.primary.id

  alias {
    name                   = aws_lb.primary.dns_name
    zone_id                = aws_lb.primary.zone_id
    evaluate_target_health = true
  }
}

# Route 53 Secondary Record with Failover Routing
resource "aws_route53_record" "secondary" {
  provider = aws.primary
  zone_id  = aws_route53_zone.main.zone_id
  name     = "app.${var.domain_name}"
  type     = "A"

  failover_routing_policy {
    type = "SECONDARY"
  }

  set_identifier  = "secondary"
  health_check_id = aws_route53_health_check.secondary.id

  alias {
    name                   = aws_lb.secondary.dns_name
    zone_id                = aws_lb.secondary.zone_id
    evaluate_target_health = true
  }
}
