# Optional Route53 custom domain configuration
# Only created if var.create_route53 is true

# ACM Certificate for custom domain
resource "aws_acm_certificate" "api" {
  count = var.create_route53 ? 1 : 0

  domain_name       = var.domain_name
  validation_method = "DNS"

  tags = local.common_tags

  lifecycle {
    create_before_destroy = true
  }
}

# Custom domain name for API Gateway
resource "aws_api_gateway_domain_name" "main" {
  count = var.create_route53 ? 1 : 0

  domain_name              = var.domain_name
  regional_certificate_arn = aws_acm_certificate.api[0].arn

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = local.common_tags

  depends_on = [aws_acm_certificate.api]
}

# Base path mapping
resource "aws_api_gateway_base_path_mapping" "main" {
  count = var.create_route53 ? 1 : 0

  api_id      = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  domain_name = aws_api_gateway_domain_name.main[0].domain_name

  depends_on = [
    aws_api_gateway_domain_name.main,
    aws_api_gateway_stage.main
  ]
}

# Route53 record
resource "aws_route53_record" "api" {
  count = var.create_route53 ? 1 : 0

  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_api_gateway_domain_name.main[0].regional_domain_name
    zone_id                = aws_api_gateway_domain_name.main[0].regional_zone_id
    evaluate_target_health = false
  }

  depends_on = [aws_api_gateway_domain_name.main]
}

