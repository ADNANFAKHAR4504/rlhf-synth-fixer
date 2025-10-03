# tap_stack.tf - News Platform Content Delivery System
# Complete Terraform configuration for secure, globally distributed content delivery

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
  bucket = "news-platform-logs-${var.environment}-${data.aws_caller_identity.current.account_id}"

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
      },
      {
        Sid       = "AllowCloudFrontLogging"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/cloudfront-logs/*"
      }
    ]
  })
}

# ===== CloudFront Origin Access Control =====

resource "aws_cloudfront_origin_access_control" "news_oac" {
  name                              = "news-platform-oac"
  description                       = "Origin Access Control for news platform content"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ===== S3 Bucket for Content =====

resource "aws_s3_bucket" "content" {
  bucket = "news-platform-content-${var.environment}-${data.aws_caller_identity.current.account_id}"

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

# ===== Data Sources =====

data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}

# ===== ACM Certificate (us-east-1 required for CloudFront) =====

# Note: ACM certificates for CloudFront must be in us-east-1
# This requires a provider alias configured in provider.tf
# For now, we'll use a placeholder - in production, this would reference
# a certificate created in us-east-1 via a separate provider block

# ===== AWS WAF Web ACL =====

resource "aws_wafv2_web_acl" "news_platform" {
  name        = "news-platform-waf-${var.environment}"
  description = "WAF for news platform CloudFront distribution"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
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
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
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
    domain_name              = aws_s3_bucket.content.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.content.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.news_oac.id
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "News Platform Content Delivery"
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # Cost-optimized for North America and Europe
  web_acl_id          = aws_wafv2_web_acl.news_platform.arn

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.content.id}"
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  # Custom error responses for better user experience
  custom_error_response {
    error_code            = 403
    response_code         = 404
    response_page_path    = "/error.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_code         = 404
    response_page_path    = "/error.html"
    error_caching_min_ttl = 10
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

# S3 bucket policy for content (added after CloudFront to avoid circular dependency)
resource "aws_s3_bucket_policy" "content_policy" {
  bucket = aws_s3_bucket.content.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
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

  depends_on = [aws_cloudfront_distribution.news_distribution]
}

# ===== CloudWatch Alarms =====

resource "aws_cloudwatch_metric_alarm" "cloudfront_5xx_errors" {
  alarm_name          = "cloudfront-5xx-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 5
  alarm_description   = "This alarm monitors CloudFront 5XX error rate"
  treat_missing_data  = "notBreaching"

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
  alarm_name          = "waf-blocked-requests-high-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "BlockedRequests"
  namespace           = "AWS/WAFV2"
  period              = 300
  statistic           = "Sum"
  threshold           = 1000
  alarm_description   = "This alarm monitors WAF blocked requests - high volume may indicate an attack"
  treat_missing_data  = "notBreaching"

  dimensions = {
    WebACL = aws_wafv2_web_acl.news_platform.name
    Region = "us-east-1"
    Rule   = "ALL"
  }

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

resource "aws_cloudwatch_metric_alarm" "s3_4xx_errors" {
  alarm_name          = "s3-4xx-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "4xxErrors"
  namespace           = "AWS/S3"
  period              = 300
  statistic           = "Sum"
  threshold           = 100
  alarm_description   = "This alarm monitors S3 4XX errors - high volume may indicate misconfiguration or security issues"
  treat_missing_data  = "notBreaching"

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

# ===== CloudWatch Log Group for Additional Monitoring =====

resource "aws_cloudwatch_log_group" "news_platform" {
  name              = "/aws/news-platform/${var.environment}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.s3_encryption.arn

  tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# ===== IAM Role for CloudFront to Access S3 =====

resource "aws_iam_role" "cloudfront_s3_access" {
  name = "cloudfront-s3-access-role-${var.environment}"

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
  name        = "cloudfront-s3-access-policy-${var.environment}"
  description = "Allow CloudFront to access S3 content"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Effect = "Allow"
        Resource = [
          aws_s3_bucket.content.arn,
          "${aws_s3_bucket.content.arn}/*"
        ]
      },
      {
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Effect = "Allow"
        Resource = [
          aws_kms_key.s3_encryption.arn
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

output "cloudfront_distribution_id" {
  description = "The ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.news_distribution.id
}

output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.news_platform.id
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.news_platform.arn
}

output "kms_key_id" {
  description = "ID of the KMS key for encryption"
  value       = aws_kms_key.s3_encryption.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key for encryption"
  value       = aws_kms_key.s3_encryption.arn
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.news_platform.name
}
