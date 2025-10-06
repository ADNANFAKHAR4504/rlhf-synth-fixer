# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "tap-content-delivery"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "domain_name" {
  description = "Domain name for the content delivery"
  type        = string
}

variable "content_bucket_name" {
  description = "Name for the S3 bucket storing e-books"
  type        = string
}

variable "cloudfront_price_class" {
  description = "CloudFront distribution price class"
  type        = string
  default     = "PriceClass_100" # US, Canada, Europe, Israel
}

variable "geo_restriction_type" {
  description = "Type of geo restriction (none, whitelist, blacklist)"
  type        = string
  default     = "none"
}

variable "geo_restriction_locations" {
  description = "List of country codes for geo restriction"
  type        = list(string)
  default     = []
}

variable "log_retention_days" {
  description = "Number of days to retain CloudFront logs"
  type        = number
  default     = 30
}

variable "enable_waf" {
  description = "Enable AWS WAF for additional protection"
  type        = bool
  default     = true
}

variable "waf_rate_limit" {
  description = "Rate limit for WAF rule (requests per 5 minutes)"
  type        = number
  default     = 2000
}

variable "alarm_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
}

variable "high_error_rate_threshold" {
  description = "Threshold for high error rate alarm (%)"
  type        = number
  default     = 5
}

variable "low_cache_hit_rate_threshold" {
  description = "Threshold for low cache hit rate alarm (%)"
  type        = number
  default     = 70
}

variable "high_origin_latency_threshold" {
  description = "Threshold for high origin latency alarm (ms)"
  type        = number
  default     = 1000
}

variable "enable_cloudtrail" {
  description = "Enable CloudTrail for audit logging"
  type        = bool
  default     = true
}

## tap_stack.tf

### KMS Key for S3 encryption

resource "aws_kms_key" "content_encryption" {
  description             = "KMS key for encrypting e-book content"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = {
    Name = "${var.project_name}-content-encryption-${var.environment}"
  }
}

resource "aws_kms_alias" "content_encryption" {
  name          = "alias/${var.project_name}-content-${var.environment}"
  target_key_id = aws_kms_key.content_encryption.key_id
}

### S3 Bucket for e-book storage

resource "aws_s3_bucket" "content" {
  bucket = var.content_bucket_name

  tags = {
    Name = "${var.project_name}-content-${var.environment}"
  }
}

resource "aws_s3_bucket_versioning" "content" {
  bucket = aws_s3_bucket.content.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "content" {
  bucket = aws_s3_bucket.content.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.content_encryption.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "content" {
  bucket = aws_s3_bucket.content.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "content" {
  bucket = aws_s3_bucket.content.id

  rule {
    id     = "transition-old-content"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER_FLEXIBLE_RETRIEVAL"
    }

    noncurrent_version_transition {
      storage_class = "STANDARD_IA"
      noncurrent_days = 30
    }

    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }
}

### CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "content" {
  comment = "${var.project_name} CloudFront OAI"
}

### ACM Certificate for CloudFront
resource "aws_acm_certificate" "content" {
  provider                  = aws.us_east_1
  domain_name               = var.domain_name
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

### CloudFront Distribution
resource "aws_cloudfront_distribution" "content" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name} Content Distribution"
  default_root_object = "index.html"
  price_class         = var.cloudfront_price_class
  aliases             = [var.domain_name, "www.${var.domain_name}"]

  origin {
    domain_name = aws_s3_bucket.content.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.content.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.content.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.content.id}"

    forwarded_values {
      query_string = false
      headers      = []
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    compress               = true

    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
  }

### Cache behavior for e-book content

  ordered_cache_behavior {
    path_pattern     = "*.epub"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3-${aws_s3_bucket.content.id}"

    forwarded_values {
      query_string = false
      headers      = ["Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "https-only"
    min_ttl                = 0
    default_ttl            = 604800  # 7 days
    max_ttl                = 31536000 # 1 year
    compress               = true
  }

  ordered_cache_behavior {
    path_pattern     = "*.pdf"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3-${aws_s3_bucket.content.id}"

    forwarded_values {
      query_string = false
      headers      = ["Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "https-only"
    min_ttl                = 0
    default_ttl            = 604800  # 7 days
    max_ttl                = 31536000 # 1 year
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = var.geo_restriction_type
      locations        = var.geo_restriction_locations
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.content.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.logs.bucket_domain_name
    prefix          = "cloudfront/"
  }

  web_acl_id = var.enable_waf ? aws_wafv2_web_acl.cloudfront[0].arn : null

  depends_on = [aws_acm_certificate_validation.content]
}

### Response Headers Policy
resource "aws_cloudfront_response_headers_policy" "security_headers" {
  name    = "${var.project_name}-security-headers-${var.environment}"
  comment = "Security headers for content delivery"

  security_headers_config {
    content_type_options {
      override = true
    }
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }
    strict_transport_security {
      access_control_max_age_sec = 63072000
      include_subdomains         = true
      override                   = true
      preload                    = true
    }
  }
}

### S3 Bucket for CloudFront logs
resource "aws_s3_bucket" "logs" {
  bucket = "${var.content_bucket_name}-logs"

  tags = {
    Name = "${var.project_name}-logs-${var.environment}"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"

    expiration {
      days = var.log_retention_days
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

### Route 53 Hosted Zone
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = {
    Name = "${var.project_name}-${var.environment}"
  }
}

### ACM Certificate Validation
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.content.domain_validation_options : dvo.domain_name => {
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

resource "aws_acm_certificate_validation" "content" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.content.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

### Route 53 Records
resource "aws_route53_record" "root" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.content.domain_name
    zone_id                = aws_cloudfront_distribution.content.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.content.domain_name
    zone_id                = aws_cloudfront_distribution.content.hosted_zone_id
    evaluate_target_health = false
  }
}

### S3 Bucket Policy - Restrict access only through CloudFront
resource "aws_s3_bucket_policy" "content" {
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
            "AWS:SourceArn" = aws_cloudfront_distribution.content.arn
          }
        }
      },
      {
        Sid    = "DenyInsecureConnections"
        Effect = "Deny"
        Principal = "*"
        Action   = "s3:*"
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

### CloudTrail for audit logging
resource "aws_cloudtrail" "content_delivery" {
  count = var.enable_cloudtrail ? 1 : 0
  
  name                          = "${var.project_name}-cloudtrail-${var.environment}"
  s3_bucket_name                = aws_s3_bucket.logs.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.content.arn}/*"]
    }
  }

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    data_resource {
      type   = "AWS::CloudFront::Distribution"
      values = [aws_cloudfront_distribution.content.arn]
    }
  }

  depends_on = [aws_s3_bucket_policy.logs]
}

### S3 Bucket Policy for CloudTrail logs
resource "aws_s3_bucket_policy" "logs" {
  count = var.enable_cloudtrail ? 1 : 0
  
  bucket = aws_s3_bucket.logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.logs.arn
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-cloudtrail-${var.environment}"
          }
        }
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/cloudtrail/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-cloudtrail-${var.environment}"
          }
        }
      }
    ]
  })
}

### Data source for current AWS account ID
data "aws_caller_identity" "current" {}

### CloudWatch Log Group for CloudFront logs
resource "aws_cloudwatch_log_group" "cloudfront" {
  name              = "/aws/cloudfront/${var.project_name}-${var.environment}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "${var.project_name}-cloudfront-logs-${var.environment}"
  }
}

### SNS Topic for CloudWatch alarms
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts-${var.environment}"

  tags = {
    Name = "${var.project_name}-alerts-${var.environment}"
  }
}

resource "aws_sns_topic_subscription" "email_alerts" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

### CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "${var.project_name}-high-error-rate-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = var.high_error_rate_threshold
  alarm_description   = "This metric monitors CloudFront 4xx error rate"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DistributionId = aws_cloudfront_distribution.content.id
  }

  tags = {
    Name = "${var.project_name}-high-error-rate-${var.environment}"
  }
}

resource "aws_cloudwatch_metric_alarm" "low_cache_hit_rate" {
  alarm_name          = "${var.project_name}-low-cache-hit-rate-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CacheHitRate"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = var.low_cache_hit_rate_threshold
  alarm_description   = "This metric monitors CloudFront cache hit rate"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DistributionId = aws_cloudfront_distribution.content.id
  }

  tags = {
    Name = "${var.project_name}-low-cache-hit-rate-${var.environment}"
  }
}

resource "aws_cloudwatch_metric_alarm" "high_origin_latency" {
  alarm_name          = "${var.project_name}-high-origin-latency-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "OriginLatency"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = var.high_origin_latency_threshold
  alarm_description   = "This metric monitors CloudFront origin latency"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DistributionId = aws_cloudfront_distribution.content.id
  }

  tags = {
    Name = "${var.project_name}-high-origin-latency-${var.environment}"
  }
}

### CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "content_delivery" {
  dashboard_name = "${var.project_name}-dashboard-${var.environment}"

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
            ["AWS/CloudFront", "Requests", "DistributionId", aws_cloudfront_distribution.content.id],
            [".", "BytesDownloaded", ".", "."],
            [".", "BytesUploaded", ".", "."]
          ]
          period = 300
          stat   = "Sum"
          region = "us-east-1"
          title  = "CloudFront Requests and Data Transfer"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/CloudFront", "CacheHitRate", "DistributionId", aws_cloudfront_distribution.content.id],
            [".", "4xxErrorRate", ".", "."],
            [".", "5xxErrorRate", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "CloudFront Performance Metrics"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/CloudFront", "OriginLatency", "DistributionId", aws_cloudfront_distribution.content.id]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "CloudFront Origin Latency"
        }
      }
    ]
  })
}

### Optional WAF for additional protection
resource "aws_wafv2_web_acl" "cloudfront" {
  count    = var.enable_waf ? 1 : 0
  provider = aws.us_east_1

  name  = "${var.project_name}-waf-${var.environment}"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = var.waf_rate_limit
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2

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
      metric_name                = "${var.project_name}-common-rules"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-waf"
    sampled_requests_enabled   = true
  }
}

## outputs.tf

### Output values for the secure content delivery system

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.content.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.content.domain_name
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.content.arn
}

output "s3_bucket_name" {
  description = "S3 bucket name for content storage"
  value       = aws_s3_bucket.content.id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN for content storage"
  value       = aws_s3_bucket.content.arn
}

output "s3_bucket_domain_name" {
  description = "S3 bucket domain name"
  value       = aws_s3_bucket.content.bucket_domain_name
}

output "s3_bucket_regional_domain_name" {
  description = "S3 bucket regional domain name"
  value       = aws_s3_bucket.content.bucket_regional_domain_name
}

output "kms_key_id" {
  description = "KMS key ID for content encryption"
  value       = aws_kms_key.content_encryption.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN for content encryption"
  value       = aws_kms_key.content_encryption.arn
}

output "kms_alias_name" {
  description = "KMS alias name for content encryption"
  value       = aws_kms_alias.content_encryption.name
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "route53_name_servers" {
  description = "Route 53 name servers"
  value       = aws_route53_zone.main.name_servers
}

output "acm_certificate_arn" {
  description = "ACM certificate ARN"
  value       = aws_acm_certificate.content.arn
}

output "cloudfront_origin_access_identity_id" {
  description = "CloudFront Origin Access Identity ID"
  value       = aws_cloudfront_origin_access_identity.content.id
}

output "cloudfront_origin_access_identity_iam_arn" {
  description = "CloudFront Origin Access Identity IAM ARN"
  value       = aws_cloudfront_origin_access_identity.content.iam_arn
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.content_delivery.dashboard_name}"
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "cloudtrail_arn" {
  description = "CloudTrail ARN for audit logging"
  value       = var.enable_cloudtrail ? aws_cloudtrail.content_delivery[0].arn : null
}

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = var.enable_waf ? aws_wafv2_web_acl.cloudfront[0].arn : null
}

output "website_url" {
  description = "Website URL"
  value       = "https://${var.domain_name}"
}

output "content_delivery_summary" {
  description = "Summary of the content delivery system"
  value = {
    domain_name           = var.domain_name
    cloudfront_domain     = aws_cloudfront_distribution.content.domain_name
    s3_bucket            = aws_s3_bucket.content.id
    encryption_enabled   = true
    waf_enabled          = var.enable_waf
    cloudtrail_enabled   = var.enable_cloudtrail
    monitoring_enabled   = true
    cost_optimization    = "Lifecycle policies configured for S3 storage classes"
  }
}
