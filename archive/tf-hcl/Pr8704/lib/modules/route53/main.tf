resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = {
    Name = "dr-payment-hosted-zone-${var.environment_suffix}"
  }
}

locals {
  # Extract hostname from Lambda Function URL (remove https://, http://, and trailing slash)
  primary_hostname   = replace(replace(replace(var.primary_endpoint, "https://", ""), "http://", ""), "/", "")
  secondary_hostname = replace(replace(replace(var.secondary_endpoint, "https://", ""), "http://", ""), "/", "")
}

resource "aws_route53_health_check" "primary" {
  fqdn              = local.primary_hostname
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
  name    = "api.${var.domain_name}"
  type    = "CNAME"
  ttl     = 60

  records = [local.primary_hostname]
}

resource "aws_route53_record" "secondary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "secondary.${var.domain_name}"
  type    = "CNAME"
  ttl     = 60

  records = [local.secondary_hostname]
}
