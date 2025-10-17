variable "aws_region" {
  type        = string
  description = "AWS region for resources"
  default     = "us-east-1"
}

variable "environment_suffix" {
  type        = string
  description = "Environment suffix for resource naming"
  default     = "dev"
}

variable "domain_name" {
  type        = string
  description = "Domain name for the media platform"
  default     = "media.example.com"
}

variable "allowed_countries" {
  type        = list(string)
  description = "List of countries allowed to access content"
  default     = ["US", "CA", "GB"]
}

data "aws_caller_identity" "current" {}

resource "aws_kms_key" "logs" {
  description             = "KMS key for CloudFront access logs encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
}

resource "aws_kms_alias" "logs" {
  name          = "alias/media-logs-${var.environment_suffix}"
  target_key_id = aws_kms_key.logs.key_id
}

resource "aws_s3_bucket" "media_content" {
  bucket        = "media-content-${data.aws_caller_identity.current.account_id}-${var.environment_suffix}"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "media_content" {
  bucket                  = aws_s3_bucket.media_content.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "media_content" {
  bucket = aws_s3_bucket.media_content.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket" "access_logs" {
  bucket        = "access-logs-${data.aws_caller_identity.current.account_id}-${var.environment_suffix}"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "access_logs" {
  bucket                  = aws_s3_bucket.access_logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.logs.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_ownership_controls" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "access_logs" {
  depends_on = [aws_s3_bucket_ownership_controls.access_logs]
  bucket     = aws_s3_bucket.access_logs.id
  acl        = "private"
}

resource "aws_cloudfront_origin_access_identity" "media_oai" {
  comment = "OAI for media content access"
}

resource "aws_s3_bucket_policy" "media_content" {
  bucket = aws_s3_bucket.media_content.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAI"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.media_oai.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.media_content.arn}/*"
      }
    ]
  })
}

resource "aws_acm_certificate" "cdn" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_cloudfront_distribution" "media" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Media delivery CDN with geo-restrictions"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  origin {
    domain_name = aws_s3_bucket.media_content.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.media_content.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.media_oai.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.media_content.id}"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = var.allowed_countries
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cdn.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.access_logs.bucket_domain_name
    prefix          = "cloudfront-logs/"
  }

  aliases = [var.domain_name]

  depends_on = [
    aws_acm_certificate.cdn,
    aws_s3_bucket_policy.media_content
  ]
}

resource "aws_route53_zone" "main" {
  name = var.domain_name

  force_destroy = true
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cdn.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.main.zone_id
}

resource "aws_acm_certificate_validation" "cdn" {
  certificate_arn         = aws_acm_certificate.cdn.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

resource "aws_route53_record" "cdn" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.media.domain_name
    zone_id                = aws_cloudfront_distribution.media.hosted_zone_id
    evaluate_target_health = false
  }

  depends_on = [aws_cloudfront_distribution.media]
}

resource "aws_cloudwatch_metric_alarm" "high_5xx_errors" {
  alarm_name          = "cloudfront-high-5xx-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 5
  alarm_description   = "Triggers when 5xx error rate exceeds 5%"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.media.id
  }
}

resource "aws_cloudwatch_metric_alarm" "high_4xx_errors" {
  alarm_name          = "cloudfront-high-4xx-errors-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "4xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 10
  alarm_description   = "Triggers when 4xx error rate exceeds 10% (may indicate geo-restriction blocks)"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.media.id
  }
}

resource "aws_cloudwatch_dashboard" "media_platform" {
  dashboard_name = "media-platform-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/CloudFront", "Requests", { stat = "Sum", label = "Total Requests" }],
            [".", "BytesDownloaded", { stat = "Sum", label = "Bytes Downloaded" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "CloudFront Traffic"
          period  = 300
          yAxis = {
            left = {
              label = "Count"
            }
          }
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/CloudFront", "4xxErrorRate", { stat = "Average", label = "4xx Error Rate" }],
            [".", "5xxErrorRate", { stat = "Average", label = "5xx Error Rate" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Error Rates"
          period  = 300
          yAxis = {
            left = {
              label = "Percentage"
            }
          }
        }
      }
    ]
  })
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.media.id
}

output "cloudfront_distribution_domain" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.media.domain_name
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.media.arn
}

output "media_bucket_name" {
  description = "S3 bucket name for media content"
  value       = aws_s3_bucket.media_content.bucket
}

output "media_bucket_arn" {
  description = "S3 bucket ARN for media content"
  value       = aws_s3_bucket.media_content.arn
}

output "logs_bucket_name" {
  description = "S3 bucket name for access logs"
  value       = aws_s3_bucket.access_logs.bucket
}

output "logs_bucket_arn" {
  description = "S3 bucket ARN for access logs"
  value       = aws_s3_bucket.access_logs.arn
}

output "kms_key_id" {
  description = "KMS key ID for log encryption"
  value       = aws_kms_key.logs.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN for log encryption"
  value       = aws_kms_key.logs.arn
}

output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "route53_zone_name_servers" {
  description = "Route53 hosted zone name servers"
  value       = aws_route53_zone.main.name_servers
}

output "acm_certificate_arn" {
  description = "ACM certificate ARN"
  value       = aws_acm_certificate.cdn.arn
}

output "domain_name" {
  description = "Configured domain name"
  value       = var.domain_name
}

output "website_url" {
  description = "Website URL"
  value       = "https://${var.domain_name}"
}
