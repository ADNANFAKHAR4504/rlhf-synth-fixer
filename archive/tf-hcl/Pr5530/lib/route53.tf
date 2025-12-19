# route53.tf - DNS configuration with Route53

# Route53 Hosted Zone for environment-specific subdomain
resource "aws_route53_zone" "main" {
  name = "${local.environment}.${var.domain_name}"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-hosted-zone"
  })
}

# Route53 Record for ALB
resource "aws_route53_record" "alb" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "${local.environment}.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Route53 Record for API subdomain
resource "aws_route53_record" "api" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.${local.environment}.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Optional: Route53 Record in parent hosted zone (if exists)
resource "aws_route53_record" "parent_ns" {
  count = var.parent_hosted_zone_id != null ? 1 : 0

  zone_id = var.parent_hosted_zone_id
  name    = "${local.environment}.${var.domain_name}"
  type    = "NS"
  ttl     = 30

  records = aws_route53_zone.main.name_servers
}

# Health check for the ALB
resource "aws_route53_health_check" "alb" {
  fqdn                            = aws_lb.main.dns_name
  port                            = 80
  type                            = "HTTP"
  resource_path                   = "/"
  failure_threshold               = "5"
  request_interval                = "30"
  insufficient_data_health_status = "Unhealthy"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${local.environment}-alb-health-check"
  })
}