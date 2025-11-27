# CloudFront Distribution for Static Assets
resource "aws_cloudfront_distribution" "static_assets" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront distribution for loan processing static assets - ${local.env_suffix}"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.static_assets.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.static_assets.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.static_assets.id
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.static_assets.id}"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  tags = {
    Name = "loan-processing-cloudfront-${local.env_suffix}"
  }
}
