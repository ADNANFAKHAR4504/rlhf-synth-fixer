# provider.tf

```terraform
terraform {
  backend "s3" {}

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.0"
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}
```

# tap_stack.tf

```terraform
variable "environment_suffix" {
  description = "Suffix to differentiate resources across deployments"
  type        = string
  default     = "dev"
}

variable "domain_name" {
  description = "Domain name for the e-book delivery system"
  type        = string
  default     = "ebooks.example.com"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "enable_custom_domain" {
  description = "Enable custom domain with Route53 and ACM certificate"
  type        = bool
  default     = false
}

data "aws_caller_identity" "current" {}

resource "aws_kms_key" "content_key" {
  description             = "KMS key for e-book content encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudFront to use the key for content encryption"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/*"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "ebook-content-key"
    Environment = var.environment
  }
}

resource "aws_kms_key" "logs_key" {
  description             = "KMS key for log encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudFront to use the key for log encryption"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:Decrypt"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "ebook-logs-key"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "content_key_alias" {
  name          = "alias/ebook-content-key-${var.environment_suffix}"
  target_key_id = aws_kms_key.content_key.key_id
}

resource "aws_kms_alias" "logs_key_alias" {
  name          = "alias/ebook-logs-key-${var.environment_suffix}"
  target_key_id = aws_kms_key.logs_key.key_id
}

resource "aws_s3_bucket" "ebook_bucket" {
  bucket_prefix = "ebook-content-${var.environment}-"

  tags = {
    Name        = "ebook-content-bucket"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_public_access_block" "ebook_bucket_block" {
  bucket = aws_s3_bucket.ebook_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "ebook_bucket_encryption" {
  bucket = aws_s3_bucket.ebook_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.content_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_versioning" "ebook_bucket_versioning" {
  bucket = aws_s3_bucket.ebook_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket" "logs_bucket" {
  bucket_prefix = "ebook-logs-${var.environment}-"

  tags = {
    Name        = "ebook-logs-bucket"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_public_access_block" "logs_bucket_block" {
  bucket = aws_s3_bucket.logs_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs_bucket_encryption" {
  bucket = aws_s3_bucket.logs_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.logs_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs_lifecycle" {
  bucket = aws_s3_bucket.logs_bucket.id

  rule {
    id     = "log-rotation"
    status = "Enabled"

    filter {}

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

resource "aws_cloudfront_origin_access_identity" "ebook_oai" {
  comment = "OAI for eBooks content access"
}

data "aws_iam_policy_document" "s3_policy" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.ebook_bucket.arn}/*"]

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.ebook_oai.iam_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "ebook_bucket_policy" {
  bucket = aws_s3_bucket.ebook_bucket.id
  policy = data.aws_iam_policy_document.s3_policy.json
}

resource "aws_acm_certificate" "ebook_cert" {
  count = var.enable_custom_domain ? 1 : 0

  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "ebook-certificate"
    Environment = var.environment
  }
}

resource "aws_route53_zone" "primary" {
  count = var.enable_custom_domain ? 1 : 0

  name = "example.com"

  tags = {
    Name        = "ebook-zone"
    Environment = var.environment
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = var.enable_custom_domain ? {
    for dvo in aws_acm_certificate.ebook_cert[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.primary[0].zone_id
}

resource "aws_acm_certificate_validation" "ebook_cert_validation" {
  count = var.enable_custom_domain ? 1 : 0

  certificate_arn         = aws_acm_certificate.ebook_cert[0].arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

resource "aws_wafv2_web_acl" "ebook_waf" {
  name        = "ebook-waf-${var.environment}-${var.environment_suffix}"
  description = "WAF for eBook distribution"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 0

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "eBookWAFMetric"
    sampled_requests_enabled   = true
  }

  tags = {
    Name        = "ebook-waf"
    Environment = var.environment
  }
}

resource "aws_cloudfront_distribution" "ebook_distribution" {
  origin {
    domain_name = aws_s3_bucket.ebook_bucket.bucket_regional_domain_name
    origin_id   = "S3-ebooks"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.ebook_oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.logs_bucket.bucket_regional_domain_name
    prefix          = "cloudfront/"
  }

  aliases = var.enable_custom_domain ? [var.domain_name] : []

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-ebooks"

    forwarded_values {
      query_string = true
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400

    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers_policy.id
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn            = var.enable_custom_domain ? aws_acm_certificate_validation.ebook_cert_validation[0].certificate_arn : null
    cloudfront_default_certificate = var.enable_custom_domain ? false : true
    ssl_support_method             = var.enable_custom_domain ? "sni-only" : null
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  web_acl_id = aws_wafv2_web_acl.ebook_waf.arn

  tags = {
    Name        = "ebook-distribution"
    Environment = var.environment
  }
}

resource "aws_cloudfront_response_headers_policy" "security_headers_policy" {
  name = "ebook-security-headers-${var.environment}-${var.environment_suffix}"

  security_headers_config {
    content_type_options {
      override = true
    }
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      override                   = true
      preload                    = true
    }
    xss_protection {
      mode_block = true
      override   = true
      protection = true
    }
    referrer_policy {
      referrer_policy = "same-origin"
      override        = true
    }
  }
}

resource "aws_route53_record" "ebook_record" {
  count = var.enable_custom_domain ? 1 : 0

  zone_id = aws_route53_zone.primary[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.ebook_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.ebook_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_cloudwatch_dashboard" "ebook_dashboard" {
  dashboard_name = "eBooks-Metrics-${var.environment}-${var.environment_suffix}"

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
            ["AWS/CloudFront", "Requests", "DistributionId", aws_cloudfront_distribution.ebook_distribution.id],
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          period  = 300
          title   = "CloudFront Requests"
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
            ["AWS/CloudFront", "TotalErrorRate", "DistributionId", aws_cloudfront_distribution.ebook_distribution.id],
            ["AWS/CloudFront", "4xxErrorRate", "DistributionId", aws_cloudfront_distribution.ebook_distribution.id],
            ["AWS/CloudFront", "5xxErrorRate", "DistributionId", aws_cloudfront_distribution.ebook_distribution.id]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          period  = 300
          title   = "CloudFront Error Rates"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 24
        height = 6
        properties = {
          metrics = [
            ["AWS/CloudFront", "BytesDownloaded", "DistributionId", aws_cloudfront_distribution.ebook_distribution.id],
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          period  = 300
          title   = "CloudFront Data Transfer"
        }
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "ebook-high-error-rate-${var.environment}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "60"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "This alarm monitors CloudFront 5xx error rates"
  dimensions = {
    DistributionId = aws_cloudfront_distribution.ebook_distribution.id
    Region         = "Global"
  }

  tags = {
    Name        = "ebook-high-error-rate-alarm"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "high_4xx_rate" {
  alarm_name          = "ebook-high-4xx-rate-${var.environment}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "60"
  statistic           = "Average"
  threshold           = "10"
  alarm_description   = "This alarm monitors CloudFront 4xx error rates"
  dimensions = {
    DistributionId = aws_cloudfront_distribution.ebook_distribution.id
    Region         = "Global"
  }

  tags = {
    Name        = "ebook-high-4xx-rate-alarm"
    Environment = var.environment
  }
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.ebook_distribution.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.ebook_distribution.domain_name
}

output "s3_bucket_name" {
  description = "S3 bucket name for e-books"
  value       = aws_s3_bucket.ebook_bucket.id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN for e-books"
  value       = aws_s3_bucket.ebook_bucket.arn
}

output "logs_bucket_name" {
  description = "S3 bucket name for logs"
  value       = aws_s3_bucket.logs_bucket.id
}

output "logs_bucket_arn" {
  description = "S3 bucket ARN for logs"
  value       = aws_s3_bucket.logs_bucket.arn
}

output "kms_content_key_id" {
  description = "KMS key ID for content encryption"
  value       = aws_kms_key.content_key.key_id
}

output "kms_logs_key_id" {
  description = "KMS key ID for logs encryption"
  value       = aws_kms_key.logs_key.key_id
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = var.enable_custom_domain ? aws_route53_zone.primary[0].zone_id : null
}

output "acm_certificate_arn" {
  description = "ACM certificate ARN"
  value       = var.enable_custom_domain ? aws_acm_certificate.ebook_cert[0].arn : null
}

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = aws_wafv2_web_acl.ebook_waf.arn
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.ebook_dashboard.dashboard_name}"
}
```
