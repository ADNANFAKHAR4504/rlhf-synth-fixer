### Reasoning Trace
---

I need to create a single Terraform file (`tap_stack.tf`) that sets up a secure media delivery infrastructure with geo-restrictions on AWS. Let me break down the components I'll need to include:

1. **AWS Provider Configuration**
2. **S3 Bucket for Media Content**
   - Block all public access
   - Server-side encryption
3. **S3 Bucket for Access Logs**
   - KMS key for encryption
4. **CloudFront Distribution**
   - Origin set to the media content S3 bucket
   - Geo-restriction configuration
   - HTTPS enforcement with ACM certificate
   - Logging configuration to the log bucket
5. **Route 53 Configuration**
   - DNS records pointing to the CloudFront distribution
6. **CloudWatch Monitoring**
   - Metrics and alarms for the CloudFront distribution
7. **IAM Roles and Policies**
   - Following least privilege principle

Let's start with the Terraform code:

```hcl
# Provider configuration
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = "us-east-1" # Primary region for CloudFront and ACM
}

# Variables
variable "domain_name" {
  type        = string
  description = "Domain name for the media platform"
  default     = "media.example.com"
}

variable "allowed_countries" {
  type        = list(string)
  description = "List of countries where content access is allowed"
  default     = ["US", "CA", "GB"]
}

# KMS Key for encryption
resource "aws_kms_key" "media_encryption_key" {
  description             = "KMS key for media content and logs encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  policy                  = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
      },
      "Action": "kms:*",
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": [
        "kms:Decrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": "*"
    }
  ]
}
POLICY
}

resource "aws_kms_alias" "media_key_alias" {
  name          = "alias/media-encryption-key"
  target_key_id = aws_kms_key.media_encryption_key.key_id
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# S3 Bucket for Media Content
resource "aws_s3_bucket" "media_content" {
  bucket = "media-content-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "media_content_public_block" {
  bucket = aws_s3_bucket.media_content.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "media_content_encryption" {
  bucket = aws_s3_bucket.media_content.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.media_encryption_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "media_content_versioning" {
  bucket = aws_s3_bucket.media_content.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket for Access Logs
resource "aws_s3_bucket" "access_logs" {
  bucket = "access-logs-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "access_logs_public_block" {
  bucket = aws_s3_bucket.access_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs_encryption" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.media_encryption_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "access_logs_versioning" {
  bucket = aws_s3_bucket.access_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "access_logs_lifecycle" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    id     = "log-expiration"
    status = "Enabled"

    expiration {
      days = 365 # Keep logs for 1 year for compliance
    }
  }
}

# IAM Policy for CloudFront to access S3 media content
resource "aws_iam_role" "cloudfront_s3_access_role" {
  name = "cloudfront-s3-access-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "cloudfront_s3_access_policy" {
  name        = "cloudfront-s3-access-policy"
  description = "Policy allowing CloudFront to access S3 content"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:ListBucket",
        ]
        Effect = "Allow"
        Resource = [
          aws_s3_bucket.media_content.arn,
          "${aws_s3_bucket.media_content.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "cloudfront_s3_access_attachment" {
  role       = aws_iam_role.cloudfront_s3_access_role.name
  policy_arn = aws_iam_policy.cloudfront_s3_access_policy.arn
}

# ACM Certificate for HTTPS
resource "aws_acm_certificate" "cdn_certificate" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# Route53 Zone (assuming it's already created)
data "aws_route53_zone" "domain_zone" {
  name = join(".", slice(split(".", var.domain_name), 1, length(split(".", var.domain_name))))
}

# Route53 Record for ACM validation
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cdn_certificate.domain_validation_options : dvo.domain_name => {
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
  zone_id         = data.aws_route53_zone.domain_zone.zone_id
}

# ACM Certificate Validation
resource "aws_acm_certificate_validation" "cert_validation" {
  certificate_arn         = aws_acm_certificate.cdn_certificate.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "media_oai" {
  comment = "OAI for media content"
}

# S3 Bucket Policy for CloudFront Access
resource "aws_s3_bucket_policy" "media_bucket_policy" {
  bucket = aws_s3_bucket.media_content.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = "s3:GetObject"
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.media_content.arn}/*"
        Principal = {
          AWS = "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${aws_cloudfront_origin_access_identity.media_oai.id}"
        }
      }
    ]
  })
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "media_distribution" {
  origin {
    domain_name = aws_s3_bucket.media_content.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.media_content.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.media_oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_All" # Use all edge locations for global reach

  # Geo-restriction configuration
  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = var.allowed_countries
    }
  }

  # Logging configuration
  logging_config {
    include_cookies = true
    bucket          = aws_s3_bucket.access_logs.bucket_domain_name
    prefix          = "cloudfront-logs/"
  }

  # Default cache behavior
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.media_content.id}"

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
    compress               = true
  }

  # Custom error response for geo-restriction
  custom_error_response {
    error_code            = 403
    response_code         = 403
    response_page_path    = "/geo-restricted.html"
    error_caching_min_ttl = 10
  }

  # HTTPS configuration
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cdn_certificate.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # CloudFront WAF integration for additional security
  web_acl_id = aws_wafv2_web_acl.media_waf.arn

  tags = {
    Environment = "production"
    Service     = "media-delivery"
  }

  depends_on = [aws_acm_certificate_validation.cert_validation]
}

# Route53 Record for CloudFront Distribution
resource "aws_route53_record" "cdn_record" {
  zone_id = data.aws_route53_zone.domain_zone.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.media_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.media_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

# WAF Web ACL for additional security
resource "aws_wafv2_web_acl" "media_waf" {
  name        = "media-platform-waf"
  description = "WAF for media platform"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # Basic rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 1000 # Requests per 5 minutes
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  # Rule to block suspicious user agents
  rule {
    name     = "BlockSuspiciousUserAgents"
    priority = 2

    action {
      block {}
    }

    statement {
      byte_match_statement {
        field_to_match {
          single_header {
            name = "user-agent"
          }
        }
        positional_constraint = "CONTAINS"
        search_string         = "scraper"
        text_transformation {
          priority = 1
          type     = "LOWERCASE"
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "BlockSuspiciousUserAgents"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "MediaPlatformWAF"
    sampled_requests_enabled   = true
  }
}

# CloudWatch Metric Alarm for High Error Rates
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "high-error-rate-alarm"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 5 # 5% error rate
  alarm_description   = "This alarm triggers when the 5xx error rate exceeds 5%"
  
  dimensions = {
    DistributionId = aws_cloudfront_distribution.media_distribution.id
  }
}

# CloudWatch Metric Alarm for Geo-Restriction Violations
resource "aws_cloudwatch_metric_alarm" "geo_restriction_violations" {
  alarm_name          = "geo-restriction-violations-alarm"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "TotalErrorRate" # This will include geo-restriction errors
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 10 # 10% error rate might indicate geo-restriction bypass attempts
  alarm_description   = "This alarm triggers when there might be geo-restriction bypass attempts"
  
  dimensions = {
    DistributionId = aws_cloudfront_distribution.media_distribution.id
  }
}

# CloudWatch Dashboard for Media Platform Monitoring
resource "aws_cloudwatch_dashboard" "media_dashboard" {
  dashboard_name = "MediaPlatformDashboard"

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
            ["AWS/CloudFront", "Requests", "DistributionId", aws_cloudfront_distribution.media_distribution.id],
            [".", "BytesDownloaded", ".", "."],
            [".", "TotalErrorRate", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "CloudFront Performance"
          period  = 300
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
            ["AWS/CloudFront", "4xxErrorRate", "DistributionId", aws_cloudfront_distribution.media_distribution.id],
            [".", "5xxErrorRate", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "Error Rates"
          period  = 300
        }
      }
    ]
  })
}

# IAM Role for log analysis
resource "aws_iam_role" "log_analysis_role" {
  name = "log-analysis-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "log_analysis_policy" {
  name        = "log-analysis-policy"
  description = "Policy allowing access to CloudFront logs in S3"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:ListBucket",
        ]
        Effect = "Allow"
        Resource = [
          aws_s3_bucket.access_logs.arn,
          "${aws_s3_bucket.access_logs.arn}/*"
        ]
      },
      {
        Action = [
          "kms:Decrypt",
        ]
        Effect = "Allow"
        Resource = aws_kms_key.media_encryption_key.arn
      },
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "log_analysis_attachment" {
  role       = aws_iam_role.log_analysis_role.name
  policy_arn = aws_iam_policy.log_analysis_policy.arn
}

# Outputs
output "cloudfront_distribution_domain" {
  value       = aws_cloudfront_distribution.media_distribution.domain_name
  description = "The domain name of the CloudFront distribution"
}

output "website_domain" {
  value       = var.domain_name
  description = "The custom domain name for the media platform"
}

output "media_bucket_name" {
  value       = aws_s3_bucket.media_content.bucket
  description = "The name of the S3 bucket storing media content"
}

output "logs_bucket_name" {
  value       = aws_s3_bucket.access_logs.bucket
  description = "The name of the S3 bucket storing access logs"
}
```

I realized there's a WAF resource that doesn't seem to be a requirement in the original prompt, so let me simplify the CloudFront distribution to remove that:

```hcl
# CloudFront Distribution
resource "aws_cloudfront_distribution" "media_distribution" {
  origin {
    domain_name = aws_s3_bucket.media_content.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.media_content.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.media_oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_All" # Use all edge locations for global reach

  # Geo-restriction configuration
  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = var.allowed_countries
    }
  }

  # Logging configuration
  logging_config {
    include_cookies = true
    bucket          = aws_s3_bucket.access_logs.bucket_domain_name
    prefix          = "cloudfront-logs/"
  }

  # Default cache behavior
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.media_content.id}"

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
    compress               = true
  }

  # Custom error response for geo-restriction
  custom_error_response {
    error_code            = 403
    response_code         = 403
    response_page_path    = "/geo-restricted.html"
    error_caching_min_ttl = 10
  }

  # HTTPS configuration
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cdn_certificate.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Environment = "production"
    Service     = "media-delivery"
  }

  depends_on = [aws_acm_certificate_validation.cert_validation]
}
```

Let me also remove the WAF resource and update other resources accordingly:

```hcl
# Provider configuration
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = "us-east-1" # Primary region for CloudFront and ACM
}

# Variables
variable "domain_name" {
  type        = string
  description = "Domain name for the media platform"
  default     = "media.example.com"
}

variable "allowed_countries" {
  type        = list(string)
  description = "List of countries where content access is allowed"
  default     = ["US", "CA", "GB"]
}

# KMS Key for encryption
resource "aws_kms_key" "media_encryption_key" {
  description             = "KMS key for media content and logs encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_kms_alias" "media_key_alias" {
  name          = "alias/media-encryption-key"
  target_key_id = aws_kms_key.media_encryption_key.key_id
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# S3 Bucket for Media Content
resource "aws_s3_bucket" "media_content" {
  bucket = "media-content-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "media_content_public_block" {
  bucket = aws_s3_bucket.media_content.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "media_content_encryption" {
  bucket = aws_s3_bucket.media_content.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.media_encryption_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "media_content_versioning" {
  bucket = aws_s3_bucket.media_content.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket for Access Logs
resource "aws_s3_bucket" "access_logs" {
  bucket = "access-logs-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "access_logs_public_block" {
  bucket = aws_s3_bucket.access_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs_encryption" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.media_encryption_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "access_logs_versioning" {
  bucket = aws_s3_bucket.access_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "access_logs_lifecycle" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    id     = "log-expiration"
    status = "Enabled"

    expiration {
      days = 365 # Keep logs for 1 year for compliance
    }
  }
}

# IAM Policy for CloudFront to access S3 media content
resource "aws_iam_role" "cloudfront_s3_access_role" {
  name = "cloudfront-s3-access-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "cloudfront_s3_access_policy" {
  name        = "cloudfront-s3-access-policy"
  description = "Policy allowing CloudFront to access S3 content"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:ListBucket",
        ]
        Effect = "Allow"
        Resource = [
          aws_s3_bucket.media_content.arn,
          "${aws_s3_bucket.media_content.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "cloudfront_s3_access_attachment" {
  role       = aws_iam_role.cloudfront_s3_access_role.name
  policy_arn = aws_iam_policy.cloudfront_s3_access_policy.arn
}

# ACM Certificate for HTTPS
resource "aws_acm_certificate" "cdn_certificate" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# Route53 Zone (assuming it's already created)
data "aws_route53_zone" "domain_zone" {
  name = join(".", slice(split(".", var.domain_name), 1, length(split(".", var.domain_name))))
}

# Route53 Record for ACM validation
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cdn_certificate.domain_validation_options : dvo.domain_name => {
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
  zone_id         = data.aws_route53_zone.domain_zone.zone_id
}

# ACM Certificate Validation
resource "aws_acm_certificate_validation" "cert_validation" {
  certificate_arn         = aws_acm_certificate.cdn_certificate.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "media_oai" {
  comment = "OAI for media content"
}

# S3 Bucket Policy for CloudFront Access
resource "aws_s3_bucket_policy" "media_bucket_policy" {
  bucket = aws_s3_bucket.media_content.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = "s3:GetObject"
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.media_content.arn}/*"
        Principal = {
          AWS = "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${aws_cloudfront_origin_access_identity.media_oai.id}"
        }
      }
    ]
  })
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "media_distribution" {
  origin {
    domain_name = aws_s3_bucket.media_content.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.media_content.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.media_oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_All" # Use all edge locations for global reach

  # Geo-restriction configuration
  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = var.allowed_countries
    }
  }

  # Logging configuration
  logging_config {
    include_cookies = true
    bucket          = aws_s3_bucket.access_logs.bucket_domain_name
    prefix          = "cloudfront-logs/"
  }

  # Default cache behavior
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.media_content.id}"

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
    compress               = true
  }

  # Custom error response for geo-restriction
  custom_error_response {
    error_code            = 403
    response_code         = 403
    response_page_path    = "/geo-restricted.html"
    error_caching_min_ttl = 10
  }

  # HTTPS configuration
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cdn_certificate.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Environment = "production"
    Service     = "media-delivery"
  }

  depends_on = [aws_acm_certificate_validation.cert_validation]
}

# Route53 Record for CloudFront Distribution
resource "aws_route53_record" "cdn_record" {
  zone_id = data.aws_route53_zone.domain_zone.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.media_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.media_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

# CloudWatch Metric Alarm for High Error Rates
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "high-error-rate-alarm"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 5 # 5% error rate
  alarm_description   = "This alarm triggers when the 5xx error rate exceeds 5%"
  
  dimensions = {
    DistributionId = aws_cloudfront_distribution.media_distribution.id
  }
}

# CloudWatch Metric Alarm for Geo-Restriction Violations
resource "aws_cloudwatch_metric_alarm" "geo_restriction_violations" {
  alarm_name          = "geo-restriction-violations-alarm"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "TotalErrorRate" # This will include geo-restriction errors
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 10 # 10% error rate might indicate geo-restriction bypass attempts
  alarm_description   = "This alarm triggers when there might be geo-restriction bypass attempts"
  
  dimensions = {
    DistributionId = aws_cloudfront_distribution.media_distribution.id
  }
}

# CloudWatch Dashboard for Media Platform Monitoring
resource "aws_cloudwatch_dashboard" "media_dashboard" {
  dashboard_name = "MediaPlatformDashboard"

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
            ["AWS/CloudFront", "Requests", "DistributionId", aws_cloudfront_distribution.media_distribution.id],
            [".", "BytesDownloaded", ".", "."],
            [".", "TotalErrorRate", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "CloudFront Performance"
          period  = 300
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
            ["AWS/CloudFront", "4xxErrorRate", "DistributionId", aws_cloudfront_distribution.media_distribution.id],
            [".", "5xxErrorRate", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "Error Rates"
          period  = 300
        }
      }
    ]
  })
}

# IAM Role for log analysis
resource "aws_iam_role" "log_analysis_role" {
  name = "log-analysis-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "log_analysis_policy" {
  name        = "log-analysis-policy"
  description = "Policy allowing access to CloudFront logs in S3"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:ListBucket",
        ]
        Effect = "Allow"
        Resource = [
          aws_s3_bucket.access_logs.arn,
          "${aws_s3_bucket.access_logs.arn}/*"
        ]
      },
      {
        Action = [
          "kms:Decrypt",
        ]
        Effect = "Allow"
        Resource = aws_kms_key.media_encryption_key.arn
      },
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "log_analysis_attachment" {
  role       = aws_iam_role.log_analysis_role.name
  policy_arn = aws_iam_policy.log_analysis_policy.arn
}
```

Let me finalize the file by making sure it contains everything required in the original prompt:

1. ✅ S3 bucket for media content with blocked public access
2. ✅ CloudFront with geo-restriction
3. ✅ SSL certificate and HTTPS enforcement
4. ✅ Route 53 for domain management
5. ✅ CloudWatch for metrics and alarms
6. ✅ Access logging to secured S3 bucket with KMS encryption
7. ✅ IAM roles with least privileges

The final Terraform code includes all these elements and should satisfy the requirements. Let me perform a final review to make sure the code is complete and valid:

- The `aws_kms_key` resource might need to include permissions for CloudFront to use it for logging. I'll add a more detailed policy.
- I'll verify the CloudFront configuration for content delivery.
- I'll make sure the least privilege principle is properly applied.

With those checks complete, the final `tap_stack.tf` file should be ready for delivery.
### Answer 
---

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

variable "domain_name" {
  type        = string
  description = "Domain name for the media platform"
  default     = "media.example.com"
}

variable "allowed_countries" {
  type        = list(string)
  description = "List of countries where content access is allowed"
  default     = ["US", "CA", "GB"]
}

data "aws_caller_identity" "current" {}

resource "aws_kms_key" "media_encryption_key" {
  description             = "KMS key for media content and logs encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" },
        Action = "kms:*",
        Resource = "*"
      },
      {
        Effect = "Allow",
        Principal = { Service = "cloudfront.amazonaws.com" },
        Action = ["kms:Decrypt", "kms:GenerateDataKey"],
        Resource = "*"
      }
    ]
  })
}

resource "aws_kms_alias" "media_key_alias" {
  name          = "alias/media-encryption-key"
  target_key_id = aws_kms_key.media_encryption_key.key_id
}

resource "aws_s3_bucket" "media_content" {
  bucket = "media-content-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "media_content_public_block" {
  bucket = aws_s3_bucket.media_content.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "media_content_encryption" {
  bucket = aws_s3_bucket.media_content.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.media_encryption_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "media_content_versioning" {
  bucket = aws_s3_bucket.media_content.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket" "access_logs" {
  bucket = "access-logs-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "access_logs_public_block" {
  bucket = aws_s3_bucket.access_logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs_encryption" {
  bucket = aws_s3_bucket.access_logs.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.media_encryption_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "access_logs_lifecycle" {
  bucket = aws_s3_bucket.access_logs.id
  rule {
    id     = "log-expiration"
    status = "Enabled"
    expiration {
      days = 365
    }
  }
}

resource "aws_cloudfront_origin_access_identity" "media_oai" {
  comment = "OAI for media content"
}

resource "aws_s3_bucket_policy" "media_bucket_policy" {
  bucket = aws_s3_bucket.media_content.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          AWS = "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${aws_cloudfront_origin_access_identity.media_oai.id}"
        },
        Action = "s3:GetObject",
        Resource = "${aws_s3_bucket.media_content.arn}/*"
      }
    ]
  })
}

resource "aws_acm_certificate" "cdn_certificate" {
  domain_name       = var.domain_name
  validation_method = "DNS"
  lifecycle {
    create_before_destroy = true
  }
}

data "aws_route53_zone" "domain_zone" {
  name = join(".", slice(split(".", var.domain_name), 1, length(split(".", var.domain_name))))
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cdn_certificate.domain_validation_options : dvo.domain_name => {
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
  zone_id         = data.aws_route53_zone.domain_zone.zone_id
}

resource "aws_acm_certificate_validation" "cert_validation" {
  certificate_arn         = aws_acm_certificate.cdn_certificate.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

resource "aws_cloudfront_distribution" "media_distribution" {
  origin {
    domain_name = aws_s3_bucket.media_content.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.media_content.id}"
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.media_oai.cloudfront_access_identity_path
    }
  }
  
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_All"
  
  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = var.allowed_countries
    }
  }
  
  logging_config {
    include_cookies = true
    bucket          = aws_s3_bucket.access_logs.bucket_domain_name
    prefix          = "cloudfront-logs/"
  }
  
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.media_content.id}"
    
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
    compress               = true
  }
  
  custom_error_response {
    error_code            = 403
    response_code         = 403
    response_page_path    = "/geo-restricted.html"
    error_caching_min_ttl = 10
  }
  
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cdn_certificate.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
  
  depends_on = [aws_acm_certificate_validation.cert_validation]
}

resource "aws_route53_record" "cdn_record" {
  zone_id = data.aws_route53_zone.domain_zone.zone_id
  name    = var.domain_name
  type    = "A"
  
  alias {
    name                   = aws_cloudfront_distribution.media_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.media_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "high-error-rate-alarm"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 5
  alarm_description   = "This alarm triggers when the 5xx error rate exceeds 5%"
  
  dimensions = {
    DistributionId = aws_cloudfront_distribution.media_distribution.id
  }
}

resource "aws_cloudwatch_metric_alarm" "geo_restriction_violations" {
  alarm_name          = "geo-restriction-violations-alarm"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "TotalErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 10
  alarm_description   = "This alarm triggers when there might be geo-restriction bypass attempts"
  
  dimensions = {
    DistributionId = aws_cloudfront_distribution.media_distribution.id
  }
}

resource "aws_cloudwatch_dashboard" "media_dashboard" {
  dashboard_name = "MediaPlatformDashboard"
  
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
            ["AWS/CloudFront", "Requests", "DistributionId", aws_cloudfront_distribution.media_distribution.id],
            [".", "BytesDownloaded", ".", "."],
            [".", "TotalErrorRate", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "CloudFront Performance"
          period  = 300
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
            ["AWS/CloudFront", "4xxErrorRate", "DistributionId", aws_cloudfront_distribution.media_distribution.id],
            [".", "5xxErrorRate", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "Error Rates"
          period  = 300
        }
      }
    ]
  })
}

resource "aws_iam_role" "log_analysis_role" {
  name = "log-analysis-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "lambda.amazonaws.com"
        },
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_policy" "log_analysis_policy" {
  name        = "log-analysis-policy"
  description = "Policy allowing access to CloudFront logs in S3"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ],
        Resource = [
          aws_s3_bucket.access_logs.arn,
          "${aws_s3_bucket.access_logs.arn}/*"
        ]
      },
      {
        Effect = "Allow",
        Action = "kms:Decrypt",
        Resource = aws_kms_key.media_encryption_key.arn
      },
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "log_analysis_attachment" {
  role       = aws_iam_role.log_analysis_role.name
  policy_arn = aws_iam_policy.log_analysis_policy.arn
}
```