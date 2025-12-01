# Route 53 Health Checks and DNS Failover
# Optional - only created if domain_name is provided

resource "aws_route53_health_check" "primary" {
  count             = var.domain_name != "" ? 1 : 0
  provider          = aws.primary
  fqdn              = aws_lb.primary.dns_name
  port              = 80
  type              = "HTTP"
  resource_path     = var.health_check_path
  failure_threshold = 3
  request_interval  = 30

  tags = {
    Name = "health-check-primary-${var.environment_suffix}"
  }
}

resource "aws_route53_health_check" "secondary" {
  count             = var.domain_name != "" ? 1 : 0
  provider          = aws.primary
  fqdn              = aws_lb.secondary.dns_name
  port              = 80
  type              = "HTTP"
  resource_path     = var.health_check_path
  failure_threshold = 3
  request_interval  = 30

  tags = {
    Name = "health-check-secondary-${var.environment_suffix}"
  }
}

data "aws_route53_zone" "main" {
  count        = var.domain_name != "" ? 1 : 0
  provider     = aws.primary
  name         = var.domain_name
  private_zone = false
}

resource "aws_route53_record" "primary" {
  count    = var.domain_name != "" ? 1 : 0
  provider = aws.primary
  zone_id  = data.aws_route53_zone.main[0].zone_id
  name     = "app-${var.environment_suffix}.${var.domain_name}"
  type     = "A"

  set_identifier = "primary-${var.environment_suffix}"
  failover_routing_policy {
    type = "PRIMARY"
  }

  alias {
    name                   = aws_lb.primary.dns_name
    zone_id                = aws_lb.primary.zone_id
    evaluate_target_health = true
  }

  health_check_id = aws_route53_health_check.primary[0].id
}

resource "aws_route53_record" "secondary" {
  count    = var.domain_name != "" ? 1 : 0
  provider = aws.primary
  zone_id  = data.aws_route53_zone.main[0].zone_id
  name     = "app-${var.environment_suffix}.${var.domain_name}"
  type     = "A"

  set_identifier = "secondary-${var.environment_suffix}"
  failover_routing_policy {
    type = "SECONDARY"
  }

  alias {
    name                   = aws_lb.secondary.dns_name
    zone_id                = aws_lb.secondary.zone_id
    evaluate_target_health = true
  }

  health_check_id = aws_route53_health_check.secondary[0].id
}
