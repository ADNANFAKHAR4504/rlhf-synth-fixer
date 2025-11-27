# Route53 A Record (optional)
resource "aws_route53_record" "app" {
  count = var.enable_route53 ? 1 : 0

  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Route53 Health Check (optional)
resource "aws_route53_health_check" "app" {
  count = var.enable_route53 ? 1 : 0

  fqdn              = var.domain_name
  port              = var.enable_https ? 443 : 80
  type              = var.enable_https ? "HTTPS" : "HTTP"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-health-check"
    }
  )
}
