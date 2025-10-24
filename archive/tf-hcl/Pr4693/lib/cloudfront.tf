# cloudfront.tf - CloudFront distribution for global edge delivery
# Note: CloudFront is enabled by default and works without a custom domain.
# Custom domain configuration via Route53 is optional and disabled by default.

# CloudFront Origin Access Identity (not used for API Gateway but kept for reference)
# API Gateway uses direct origin with HTTPS only

# CloudFront distribution
resource "aws_cloudfront_distribution" "main" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "CloudFront for global edge delivery - custom domain optional, disabled by default"
  price_class     = "PriceClass_100" # US, Canada, Europe

  # Origin - API Gateway
  origin {
    domain_name = replace(aws_api_gateway_stage.prod.invoke_url, "/^https?://([^/]*).*/", "$1")
    origin_id   = "api-gateway"
    origin_path = "/prod"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Default cache behavior
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "api-gateway"

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Accept", "Content-Type"]

      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 60
    max_ttl                = 300
    compress               = true
  }

  # Restrictions
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # SSL Certificate (use default CloudFront certificate when no custom domain)
  viewer_certificate {
    cloudfront_default_certificate = var.enable_route53 ? false : true
    acm_certificate_arn            = var.enable_route53 ? var.certificate_arn : null
    ssl_support_method             = var.enable_route53 ? "sni-only" : null
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  # Custom error responses
  custom_error_response {
    error_code            = 403
    response_code         = 403
    response_page_path    = "/error.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_code         = 404
    response_page_path    = "/error.html"
    error_caching_min_ttl = 10
  }

  # Aliases (custom domain names) - only if Route53 is enabled
  aliases = var.enable_route53 && var.domain_name != null ? [var.domain_name] : []

  tags = merge(
    var.tags,
    {
      Name = "${var.environment_suffix}-cloudfront"
    }
  )

  depends_on = [
    aws_api_gateway_stage.prod
  ]
}
