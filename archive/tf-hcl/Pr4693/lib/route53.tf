# route53.tf - Route53 DNS configuration (OPTIONAL - disabled by default)
# This file creates Route53 resources only when var.enable_route53 is set to true.
# By default, the API is accessed via the CloudFront domain name without custom DNS.

# Route53 Hosted Zone (conditional)
resource "aws_route53_zone" "main" {
  count = var.enable_route53 ? 1 : 0

  name = var.domain_name

  tags = merge(
    var.tags,
    {
      Name = "${var.environment_suffix}-hosted-zone"
    }
  )
}

# Route53 A Record pointing to CloudFront (conditional)
resource "aws_route53_record" "main" {
  count = var.enable_route53 ? 1 : 0

  zone_id = aws_route53_zone.main[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

# Route53 Health Check for API endpoint (conditional)
resource "aws_route53_health_check" "api" {
  count = var.enable_route53 ? 1 : 0

  fqdn              = var.domain_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/prod/profiles"
  failure_threshold = 3
  request_interval  = 30

  tags = merge(
    var.tags,
    {
      Name = "${var.environment_suffix}-api-health-check"
    }
  )

  depends_on = [
    aws_route53_record.main
  ]
}
