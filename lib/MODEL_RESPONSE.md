### Reasoning Trace
---

Alright, I'll create a complete Terraform script (`tap_stack.tf`) for a news platform content delivery system following AWS best practices. Let's break down what we need:

1. **Variables**: Define all necessary variables including those with default values. One critical variable is `aws_region` which is already passed from an external `provider.tf` file.

2. **Resources to create**:
   - S3 buckets (content and logging)
   - CloudFront distribution
   - AWS WAF
   - ACM certificates
   - Route 53 configurations
   - CloudWatch metrics and alarms
   - IAM roles and policies

3. **Security and Compliance**:
   - Encryption at rest (KMS)
   - HTTPS-only access
   - Restricted bucket access
   - Logging configurations

4. **Resource Tagging**:
   - Environment, Owner, Project tags

Let's start with the Terraform script:

```hcl
# ===== Variables =====

variable "aws_region" {
  description = "AWS region (passed from provider.tf)"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the news platform"
  type        = string
  default     = "news.example.com"
}

variable "environment" {
  description = "Environment tag for all resources"
  type        = string
  default     = "production"
}

variable "owner" {
  description = "Owner tag for all resources"
  type        = string
  default     = "NewsTeam"
}

variable "project" {
  description = "Project tag for all resources"
  type        = string
  default     = "NewsPlatform"
}

variable "log_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 90
}

variable "waf_request_threshold" {
  description = "Maximum requests per 5-minute period from a single IP"
  type        = number
  default     = 2000
}

# ===== KMS Key for S3 Encryption =====

resource "aws_kms_key" "s3_encryption" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_kms_alias" "s3_encryption_alias" {
  name          = "alias/news-platform-s3-encryption"
  target_key_id = aws_kms_key.s3_encryption.key_id
}

# ===== S3 Bucket for Logs =====

resource "aws_s3_bucket" "logs" {
  bucket = "news-platform-logs-${var.environment}"

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_s3_bucket_versioning" "logs_versioning" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs_lifecycle" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "log-expiration"
    status = "Enabled"

    expiration {
      days = var.log_retention_days
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs_encryption" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_encryption.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "logs_public_access" {
  bucket                  = aws_s3_bucket.logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "logs_policy" {
  bucket = aws_s3_bucket.logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowSSLRequestsOnly"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.logs.arn,
          "${aws_s3_bucket.logs.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# ===== S3 Bucket for Content =====

resource "aws_s3_bucket" "content" {
  bucket = "news-platform-content-${var.environment}"

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_s3_bucket_versioning" "content_versioning" {
  bucket = aws_s3_bucket.content.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "content_encryption" {
  bucket = aws_s3_bucket.content.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_encryption.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "content_public_access" {
  bucket                  = aws_s3_bucket.content.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "content_policy" {
  bucket = aws_s3_bucket.content.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipal"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.content.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.news_distribution.arn
          }
        }
      },
      {
        Sid       = "AllowSSLRequestsOnly"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.content.arn,
          "${aws_s3_bucket.content.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_logging" "content_logging" {
  bucket = aws_s3_bucket.content.id

  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "s3-content-logs/"
}

# ===== ACM Certificate =====

resource "aws_acm_certificate" "news_cert" {
  provider          = aws.us_east_1  # CloudFront requires certificates in us-east-1
  domain_name       = var.domain_name
  validation_method = "DNS"

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ===== Route 53 DNS Configuration =====

data "aws_route53_zone" "primary" {
  name         = join(".", slice(split(".", var.domain_name), length(split(".", var.domain_name)) - 2, length(split(".", var.domain_name))))
  private_zone = false
}

resource "aws_route53_record" "cert_validation" {
  provider = aws.us_east_1
  for_each = {
    for dvo in aws_acm_certificate.news_cert.domain_validation_options : dvo.domain_name => {
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
  zone_id         = data.aws_route53_zone.primary.zone_id
}

resource "aws_acm_certificate_validation" "cert" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.news_cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

resource "aws_route53_record" "news_platform" {
  zone_id = data.aws_route53_zone.primary.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.news_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.news_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

# ===== AWS WAF Web ACL =====

resource "aws_wafv2_web_acl" "news_platform" {
  provider    = aws.us_east_1  # CloudFront requires WAF in us-east-1
  name        = "news-platform-waf"
  description = "WAF for news platform CloudFront distribution"
  scope       = "CLOUDFRONT"

  default_action {
    block {}
  }

  # AWS Managed Rules - Core ruleset
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

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

  # SQL Injection protection
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesSQLiRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # Cross-site scripting protection
  rule {
    name     = "AWSManagedRulesXSSRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesXSSRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesXSSRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 4

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = var.waf_request_threshold
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRuleMetric"
      sampled_requests_enabled   = true
    }
  }

  # Allow rule for legitimate traffic
  rule {
    name     = "AllowLegitimateTraffic"
    priority = 5

    action {
      allow {}
    }

    statement {
      and_statement {
        statement {
          geo_match_statement {
            country_codes = ["US", "CA", "GB", "DE", "FR", "JP", "AU", "IN"]  # Example list of allowed countries
          }
        }
        statement {
          byte_match_statement {
            positional_constraint = "EXACTLY"
            search_string         = "GET"
            field_to_match {
              method {}
            }
            text_transformation {
              priority = 1
              type     = "NONE"
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AllowLegitimateTrafficMetric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "NewsPlatformWAFMetric"
    sampled_requests_enabled   = true
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# ===== CloudFront Origin Access Identity =====

resource "aws_cloudfront_origin_access_identity" "news_oai" {
  comment = "OAI for news platform content"
}

# ===== CloudFront Distribution =====

resource "aws_cloudfront_distribution" "news_distribution" {
  origin {
    domain_name = aws_s3_bucket.content.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.content.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.news_oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "News Platform Content Delivery"
  default_root_object = "index.html"
  price_class         = "PriceClass_All"  # Global distribution
  web_acl_id          = aws_wafv2_web_acl.news_platform.arn

  aliases = [var.domain_name]

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.content.id}"

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

  # Custom error responses for better user experience
  custom_error_response {
    error_code            = 403
    response_code         = 404
    response_page_path    = "/error/404.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_code         = 404
    response_page_path    = "/error/404.html"
    error_caching_min_ttl = 10
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
      # If you want to restrict to specific countries:
      # restriction_type = "whitelist"
      # locations = ["US", "CA", "GB", "DE"]
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.news_cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.logs.bucket_domain_name
    prefix          = "cloudfront-logs/"
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# ===== CloudWatch Alarms =====

resource "aws_cloudwatch_metric_alarm" "cloudfront_5xx_errors" {
  alarm_name          = "cloudfront-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 5
  alarm_description   = "This alarm monitors CloudFront 5XX error rate"
  alarm_actions       = [] # Add SNS topic ARN if you want notifications

  dimensions = {
    DistributionId = aws_cloudfront_distribution.news_distribution.id
    Region         = "Global"
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_metric_alarm" "waf_blocked_requests" {
  alarm_name          = "waf-blocked-requests-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "BlockedRequests"
  namespace           = "AWS/WAFV2"
  period              = 300
  statistic           = "Sum"
  threshold           = 1000
  alarm_description   = "This alarm monitors WAF blocked requests - high volume may indicate an attack"
  alarm_actions       = [] # Add SNS topic ARN if you want notifications

  dimensions = {
    WebACL = aws_wafv2_web_acl.news_platform.name
    Region = "Global"
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_metric_alarm" "s3_4xx_errors" {
  alarm_name          = "s3-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "4xxErrors"
  namespace           = "AWS/S3"
  period              = 300
  statistic           = "Sum"
  threshold           = 100
  alarm_description   = "This alarm monitors S3 4XX errors - high volume may indicate misconfiguration or security issues"
  alarm_actions       = [] # Add SNS topic ARN if you want notifications

  dimensions = {
    BucketName = aws_s3_bucket.content.id
    FilterId   = "EntireBucket"
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# ===== IAM Role for CloudFront to Access S3 =====

resource "aws_iam_role" "cloudfront_s3_access" {
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
        Condition = {
          StringEquals = {
            "aws:SourceArn" = aws_cloudfront_distribution.news_distribution.arn
          }
        }
      }
    ]
  })

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_policy" "cloudfront_s3_access" {
  name        = "cloudfront-s3-access-policy"
  description = "Allow CloudFront to access S3 content"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Effect   = "Allow"
        Resource = [
          aws_s3_bucket.content.arn,
          "${aws_s3_bucket.content.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "cloudfront_s3_access" {
  role       = aws_iam_role.cloudfront_s3_access.name
  policy_arn = aws_iam_policy.cloudfront_s3_access.arn
}

# ===== Output Values =====

output "content_bucket_name" {
  description = "Name of the S3 bucket storing news content"
  value       = aws_s3_bucket.content.id
}

output "logs_bucket_name" {
  description = "Name of the S3 bucket storing logs"
  value       = aws_s3_bucket.logs.id
}

output "cloudfront_domain_name" {
  description = "The domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.news_distribution.domain_name
}

output "website_domain" {
  description = "The domain name for the news platform"
  value       = var.domain_name
}

output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.news_platform.id
}

output "acm_certificate_arn" {
  description = "ARN of the ACM certificate"
  value       = aws_acm_certificate.news_cert.arn
}
```

Hmm, I just realized there's an issue with the US East 1 provider for ACM and WAF. Since we're accepting the aws_region from an external provider file, we need to add a provider block for us-east-1 specifically for CloudFront-related resources. Let me fix that:

```hcl
# Provider configuration for us-east-1 (required for ACM certificates used with CloudFront)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}
```

Also, I need to fix the CloudFront distribution S3 bucket policy, because there's a circular dependency. Let me revise the final file:

```hcl
# ===== Variables =====

variable "aws_region" {
  description = "AWS region (passed from provider.tf)"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the news platform"
  type        = string
  default     = "news.example.com"
}

variable "environment" {
  description = "Environment tag for all resources"
  type        = string
  default     = "production"
}

variable "owner" {
  description = "Owner tag for all resources"
  type        = string
  default     = "NewsTeam"
}

variable "project" {
  description = "Project tag for all resources"
  type        = string
  default     = "NewsPlatform"
}

variable "log_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 90
}

variable "waf_request_threshold" {
  description = "Maximum requests per 5-minute period from a single IP"
  type        = number
  default     = 2000
}

# Provider configuration for us-east-1 (required for ACM certificates used with CloudFront)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# ===== KMS Key for S3 Encryption =====

resource "aws_kms_key" "s3_encryption" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_kms_alias" "s3_encryption_alias" {
  name          = "alias/news-platform-s3-encryption"
  target_key_id = aws_kms_key.s3_encryption.key_id
}

# ===== S3 Bucket for Logs =====

resource "aws_s3_bucket" "logs" {
  bucket = "news-platform-logs-${var.environment}"

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_s3_bucket_versioning" "logs_versioning" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs_lifecycle" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "log-expiration"
    status = "Enabled"

    expiration {
      days = var.log_retention_days
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs_encryption" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_encryption.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "logs_public_access" {
  bucket                  = aws_s3_bucket.logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "logs_policy" {
  bucket = aws_s3_bucket.logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowSSLRequestsOnly"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.logs.arn,
          "${aws_s3_bucket.logs.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# ===== CloudFront Origin Access Identity =====

resource "aws_cloudfront_origin_access_identity" "news_oai" {
  comment = "OAI for news platform content"
}

# ===== S3 Bucket for Content =====

resource "aws_s3_bucket" "content" {
  bucket = "news-platform-content-${var.environment}"

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_s3_bucket_versioning" "content_versioning" {
  bucket = aws_s3_bucket.content.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "content_encryption" {
  bucket = aws_s3_bucket.content.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_encryption.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "content_public_access" {
  bucket                  = aws_s3_bucket.content.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "content_policy" {
  bucket = aws_s3_bucket.content.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipal"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.content.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.news_distribution.arn
          }
        }
      },
      {
        Sid       = "AllowSSLRequestsOnly"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.content.arn,
          "${aws_s3_bucket.content.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })

  # Avoid circular dependency between S3 and CloudFront
  depends_on = [aws_cloudfront_distribution.news_distribution]
}

resource "aws_s3_bucket_logging" "content_logging" {
  bucket = aws_s3_bucket.content.id

  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "s3-content-logs/"
}

# ===== ACM Certificate =====

resource "aws_acm_certificate" "news_cert" {
  provider          = aws.us_east_1  # CloudFront requires certificates in us-east-1
  domain_name       = var.domain_name
  validation_method = "DNS"

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ===== Route 53 DNS Configuration =====

data "aws_route53_zone" "primary" {
  name         = join(".", slice(split(".", var.domain_name), length(split(".", var.domain_name)) - 2, length(split(".", var.domain_name))))
  private_zone = false
}

resource "aws_route53_record" "cert_validation" {
  provider = aws.us_east_1
  for_each = {
    for dvo in aws_acm_certificate.news_cert.domain_validation_options : dvo.domain_name => {
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
  zone_id         = data.aws_route53_zone.primary.zone_id
}

resource "aws_acm_certificate_validation" "cert" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.news_cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

resource "aws_route53_record" "news_platform" {
  zone_id = data.aws_route53_zone.primary.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.news_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.news_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

# ===== AWS WAF Web ACL =====

resource "aws_wafv2_web_acl" "news_platform" {
  provider    = aws.us_east_1  # CloudFront requires WAF in us-east-1
  name        = "news-platform-waf"
  description = "WAF for news platform CloudFront distribution"
  scope       = "CLOUDFRONT"

  default_action {
    block {}
  }

  # AWS Managed Rules - Core ruleset
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

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

  # SQL Injection protection
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesSQLiRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # Cross-site scripting protection
  rule {
    name     = "AWSManagedRulesXSSRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesXSSRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesXSSRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 4

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = var.waf_request_threshold
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRuleMetric"
      sampled_requests_enabled   = true
    }
  }

  # Allow rule for legitimate traffic
  rule {
    name     = "AllowLegitimateTraffic"
    priority = 5

    action {
      allow {}
    }

    statement {
      and_statement {
        statement {
          geo_match_statement {
            country_codes = ["US", "CA", "GB", "DE", "FR", "JP", "AU", "IN"]  # Example list of allowed countries
          }
        }
        statement {
          byte_match_statement {
            positional_constraint = "EXACTLY"
            search_string         = "GET"
            field_to_match {
              method {}
            }
            text_transformation {
              priority = 1
              type     = "NONE"
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AllowLegitimateTrafficMetric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "NewsPlatformWAFMetric"
    sampled_requests_enabled   = true
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# ===== CloudFront Distribution =====

resource "aws_cloudfront_distribution" "news_distribution" {
  origin {
    domain_name = aws_s3_bucket.content.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.content.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.news_oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "News Platform Content Delivery"
  default_root_object = "index.html"
  price_class         = "PriceClass_All"  # Global distribution
  web_acl_id          = aws_wafv2_web_acl.news_platform.arn

  aliases = [var.domain_name]

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.content.id}"

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

  # Custom error responses for better user experience
  custom_error_response {
    error_code            = 403
    response_code         = 404
    response_page_path    = "/error/404.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_code         = 404
    response_page_path    = "/error/404.html"
    error_caching_min_ttl = 10
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
      # If you want to restrict to specific countries:
      # restriction_type = "whitelist"
      # locations = ["US", "CA", "GB", "DE"]
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.news_cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.logs.bucket_domain_name
    prefix          = "cloudfront-logs/"
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  # Ensure ACM certificate is validated before creating the distribution
  depends_on = [aws_acm_certificate_validation.cert]
}

# ===== CloudWatch Alarms =====

resource "aws_cloudwatch_metric_alarm" "cloudfront_5xx_errors" {
  alarm_name          = "cloudfront-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 5
  alarm_description   = "This alarm monitors CloudFront 5XX error rate"
  alarm_actions       = [] # Add SNS topic ARN if you want notifications

  dimensions = {
    DistributionId = aws_cloudfront_distribution.news_distribution.id
    Region         = "Global"
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_metric_alarm" "waf_blocked_requests" {
  alarm_name          = "waf-blocked-requests-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "BlockedRequests"
  namespace           = "AWS/WAFV2"
  period              = 300
  statistic           = "Sum"
  threshold           = 1000
  alarm_description   = "This alarm monitors WAF blocked requests - high volume may indicate an attack"
  alarm_actions       = [] # Add SNS topic ARN if you want notifications

  dimensions = {
    WebACL = aws_wafv2_web_acl.news_platform.name
    Region = "Global"
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_metric_alarm" "s3_4xx_errors" {
  alarm_name          = "s3-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "4xxErrors"
  namespace           = "AWS/S3"
  period              = 300
  statistic           = "Sum"
  threshold           = 100
  alarm_description   = "This alarm monitors S3 4XX errors - high volume may indicate misconfiguration or security issues"
  alarm_actions       = [] # Add SNS topic ARN if you want notifications

  dimensions = {
    BucketName = aws_s3_bucket.content.id
    FilterId   = "EntireBucket"
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# ===== IAM Role for CloudFront to Access S3 =====

resource "aws_iam_role" "cloudfront_s3_access" {
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
        Condition = {
          StringEquals = {
            "aws:SourceArn" = aws_cloudfront_distribution.news_distribution.arn
          }
        }
      }
    ]
  })

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_iam_policy" "cloudfront_s3_access" {
  name        = "cloudfront-s3-access-policy"
  description = "Allow CloudFront to access S3 content"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Effect   = "Allow"
        Resource = [
          aws_s3_bucket.content.arn,
          "${aws_s3_bucket.content.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "cloudfront_s3_access" {
  role       = aws_iam_role.cloudfront_s3_access.name
  policy_arn = aws_iam_policy.cloudfront_s3_access.arn
}

# ===== Output Values =====

output "content_bucket_name" {
  description = "Name of the S3 bucket storing news content"
  value       = aws_s3_bucket.content.id
}

output "logs_bucket_name" {
  description = "Name of the S3 bucket storing logs"
  value       = aws_s3_bucket.logs.id
}

output "cloudfront_domain_name" {
  description = "The domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.news_distribution.domain_name
}

output "website_domain" {
  description = "The domain name for the news platform"
  value       = var.domain_name
}

output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.news_platform.id
}

output "acm_certificate_arn" {
  description = "ARN of the ACM certificate"
  value       = aws_acm_certificate.news_cert.arn
}
```

I've rearranged the resources to handle circular dependencies and added a provider block for us-east-1 which is required for CloudFront-related resources (ACM certificates and WAF). I've also added proper dependencies to ensure the resources are created in the correct order.

This terraform script should fully address the business requirements:

1. **S3 Buckets**: 
   - Created separate buckets for content and logs
   - Enabled versioning, encryption, and secure access policies
   - Enforced TLS-only access

2. **CloudFront Distribution**:
   - Global distribution for low latency content delivery
   - WAF integration for security
   - HTTPS enforcement
   - Access logging

3. **WAF**:
   - Managed rules for security (SQLi, XSS)
   - Rate limiting protection
   - Default deny rule with explicit allow rules

4. **ACM Certificate**:
   - TLS certificate for HTTPS
   - DNS validation

5. **Route 53**:
   - DNS configuration with CloudFront alias

6. **CloudWatch**:
   - Alarms for monitoring errors and attacks

7. **IAM Roles & Policies**:
   - Least privilege access between services
   - S3 content only accessible via CloudFront

8. **Security & Compliance**:
   - Encryption everywhere
   - Access logs stored securely
   - Public access blocked to origin bucket

9. **Tagging**:
   - Environment, Owner, Project tags on all resources

The script is organized to be readable and maintainable, with resources grouped logically and clear comments.
### Answer 
---

# AWS News Platform Content Delivery System

Below is a complete, production-ready Terraform script (`tap_stack.tf`) that sets up a secure, globally distributed content delivery system for a news platform. This configuration follows AWS best practices for security, performance, and cost optimization.

```hcl
# ===== Variables =====

variable "aws_region" {
  description = "AWS region (passed from provider.tf)"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Domain name for the news platform"
  type        = string
  default     = "news.example.com"
}

variable "environment" {
  description = "Environment tag for all resources"
  type        = string
  default     = "production"
}

variable "owner" {
  description = "Owner tag for all resources"
  type        = string
  default     = "NewsTeam"
}

variable "project" {
  description = "Project tag for all resources"
  type        = string
  default     = "NewsPlatform"
}

variable "log_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 90
}

variable "waf_request_threshold" {
  description = "Maximum requests per 5-minute period from a single IP"
  type        = number
  default     = 2000
}

# Provider configuration for us-east-1 (required for ACM certificates used with CloudFront)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# ===== KMS Key for S3 Encryption =====

resource "aws_kms_key" "s3_encryption" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_kms_alias" "s3_encryption_alias" {
  name          = "alias/news-platform-s3-encryption"
  target_key_id = aws_kms_key.s3_encryption.key_id
}

# ===== S3 Bucket for Logs =====

resource "aws_s3_bucket" "logs" {
  bucket = "news-platform-logs-${var.environment}"

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_s3_bucket_versioning" "logs_versioning" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs_lifecycle" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "log-expiration"
    status = "Enabled"

    expiration {
      days = var.log_retention_days
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs_encryption" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_encryption.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "logs_public_access" {
  bucket                  = aws_s3_bucket.logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "logs_policy" {
  bucket = aws_s3_bucket.logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowSSLRequestsOnly"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.logs.arn,
          "${aws_s3_bucket.logs.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# ===== CloudFront Origin Access Identity =====

resource "aws_cloudfront_origin_access_identity" "news_oai" {
  comment = "OAI for news platform content"
}

# ===== S3 Bucket for Content =====

resource "aws_s3_bucket" "content" {
  bucket = "news-platform-content-${var.environment}"

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_s3_bucket_versioning" "content_versioning" {
  bucket = aws_s3_bucket.content.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "content_encryption" {
  bucket = aws_s3_bucket.content.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_encryption.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "content_public_access" {
  bucket                  = aws_s3_bucket.content.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_logging" "content_logging" {
  bucket = aws_s3_bucket.content.id

  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "s3-content-logs/"
}

# ===== ACM Certificate =====

resource "aws_acm_certificate" "news_cert" {
  provider          = aws.us_east_1  # CloudFront requires certificates in us-east-1
  domain_name       = var.domain_name
  validation_method = "DNS"

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ===== Route 53 DNS Configuration =====

data "aws_route53_zone" "primary" {
  name         = join(".", slice(split(".", var.domain_name), length(split(".", var.domain_name)) - 2, length(split(".", var.domain_name))))
  private_zone = false
}

resource "aws_route53_record" "cert_validation" {
  provider = aws.us_east_1
  for_each = {
    for dvo in aws_acm_certificate.news_cert.domain_validation_options : dvo.domain_name => {
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
  zone_id         = data.aws_route53_zone.primary.zone_id
}

resource "aws_acm_certificate_validation" "cert" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.news_cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# ===== AWS WAF Web ACL =====

resource "aws_wafv2_web_acl" "news_platform" {
  provider    = aws.us_east_1  # CloudFront requires WAF in us-east-1
  name        = "news-platform-waf"
  description = "WAF for news platform CloudFront distribution"
  scope       = "CLOUDFRONT"

  default_action {
    block {}
  }

  # AWS Managed Rules - Core ruleset
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

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

  # SQL Injection protection
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesSQLiRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # Cross-site scripting protection
  rule {
    name     = "AWSManagedRulesXSSRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesXSSRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesXSSRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 4

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = var.waf_request_threshold
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRuleMetric"
      sampled_requests_enabled   = true
    }
  }

  # Allow rule for legitimate traffic
  rule {
    name     = "AllowLegitimateTraffic"
    priority = 5

    action {
      allow {}
    }

    statement {
      and_statement {
        statement {
          geo_match_statement {
            country_codes = ["US", "CA", "GB", "DE", "FR", "JP", "AU", "IN"]  # Example list of allowed countries
          }
        }
        statement {
          byte_match_statement {
            positional_constraint = "EXACTLY"
            search_string         = "GET"
            field_to_match {
              method {}
            }
            text_transformation {
              priority = 1
              type     = "NONE"
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AllowLegitimateTrafficMetric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "NewsPlatformWAFMetric"
    sampled_requests_enabled   = true
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# ===== CloudFront Distribution =====

resource "aws_cloudfront_distribution" "news_distribution" {
  origin {
    domain_name = aws_s3_bucket.content.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.content.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.news_oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "News Platform Content Delivery"
  default_root_object = "index.html"
  price_class         = "PriceClass_All"  # Global distribution
  web_acl_id          = aws_wafv2_web_acl.news_platform.arn

  aliases = [var.domain_name]

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.content.id}"

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

  # Custom error responses for better user experience
  custom_error_response {
    error_code            = 403
    response_code         = 404
    response_page_path    = "/error/404.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_code         = 404
    response_page_path    = "/error/404.html"
    error_caching_min_ttl = 10
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.news_cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.logs.bucket_domain_name
    prefix          = "cloudfront-logs/"
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }

  # Ensure ACM certificate is validated before creating the distribution
  depends_on = [aws_acm_certificate_validation.cert]
}

# S3 bucket policy for content (added after CloudFront to avoid circular dependency)
resource "aws_s3_bucket_policy" "content_policy" {
  bucket = aws_s3_bucket.content.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipal"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.content.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.news_distribution.arn
          }
        }
      },
      {
        Sid       = "AllowSSLRequestsOnly"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.content.arn,
          "${aws_s3_bucket.content.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          