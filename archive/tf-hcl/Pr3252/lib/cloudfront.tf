# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "${var.project_name}-${var.environment}-oac-${var.aws_region}"
  description                       = "Origin Access Control for ${var.project_name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name} ${var.environment} distribution"
  default_root_object = "index.html"

  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "alb-origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "alb-origin"

    forwarded_values {
      query_string = true
      headers      = ["Host", "Origin"]

      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }


  # web_acl_id = aws_wafv2_web_acl.cloudfront.arn  # Commented out - CloudFront WAF must be in us-east-1

  tags = {
    Name = "${var.project_name}-${var.environment}-cf-${var.aws_region}"
  }
}

# Shield Advanced association (requires Shield Advanced subscription)
# Uncomment the following if you have Shield Advanced subscription:
# resource "aws_shield_protection" "cloudfront" {
#   name         = "${var.project_name}-${var.environment}-cf-shield-${var.aws_region}"
#   resource_arn = aws_cloudfront_distribution.main.arn
#   
#   tags = {
#     Name = "${var.project_name}-${var.environment}-cf-shield-${var.aws_region}"
#   }
# }
