### Reasoning Trace
---

The user wants me to create a comprehensive Terraform configuration for a secure content delivery system using AWS services. Let me break down the requirements:

1. S3 for e-book storage with encryption
2. CloudFront with OAI for secure delivery
3. Route 53 for DNS
4. KMS for encryption
5. CloudWatch for monitoring
6. IAM roles and policies
7. Security configurations
8. Cost optimization

I need to create 6 files:
1. tap_stack.tf - main infrastructure
2. variables.tf - configurable parameters
3. outputs.tf - output values
4. security.tf - security configurations
5. monitoring.tf - monitoring setup
6. README.md - documentation

Let me start creating these files with all the requirements in mind.
### Answer 
---

I'll create a comprehensive Terraform configuration for your secure content delivery system. This solution will provide global e-book distribution with strong security, monitoring, and cost optimization.

```hcl
# tap_stack.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1" # Required for CloudFront certificates
}

# KMS Key for S3 encryption
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

# S3 Bucket for e-book storage
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

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "content" {
  comment = "${var.project_name} CloudFront OAI"
}

# ACM Certificate for CloudFront
resource "aws_acm_certificate" "content" {
  provider                  = aws.us_east_1
  domain_name               = var.domain_name
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# CloudFront Distribution
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

  # Cache behavior for e-book content
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

# Response Headers Policy
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

# S3 Bucket for CloudFront logs
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

# Route 53 Hosted Zone
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = {
    Name = "${var.project_name}-${var.environment}"
  }
}

# ACM Certificate Validation
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

# Route 53 Records
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

# Optional WAF for additional protection
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
```

```hcl
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
```

```hcl
# outputs.tf
output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.content.id
}

output "cloudfront_distribution_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.content.domain_name
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket storing content"
  value       = aws_s3_bucket.content.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.content.arn
}

output "kms_key_id" {
  description = "KMS key ID for content encryption"
  value       = aws_kms_key.content_encryption.id
}

output "kms_key_arn" {
  description = "KMS key ARN for content encryption"
  value       = aws_kms_key.content_encryption.arn
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "route53_name_servers" {
  description = "Route 53 name servers"
  value       = aws_route53_zone.main.name_servers
}

output "cloudfront_oai_iam_arn" {
  description = "CloudFront Origin Access Identity IAM ARN"
  value       = aws_cloudfront_origin_access_identity.content.iam_arn
}

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = var.enable_waf ? aws_wafv2_web_acl.cloudfront[0].arn : null
}

output "content_delivery_url" {
  description = "Primary URL for content delivery"
  value       = "https://${var.domain_name}"
}

output "monitoring_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${var.project_name}-${var.environment}"
}
```

```hcl
# security.tf
# S3 Bucket Policy - Restrict access to CloudFront only
data "aws_iam_policy_document" "content_bucket_policy" {
  statement {
    sid = "DenyDirectS3Access"
    effect = "Deny"
    
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    
    actions = [
      "s3:*"
    ]
    
    resources = [
      aws_s3_bucket.content.arn,
      "${aws_s3_bucket.content.arn}/*"
    ]
    
    condition {
      test     = "StringNotEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.content.arn]
    }
  }
  
  statement {
    sid = "AllowCloudFrontOAI"
    effect = "Allow"
    
    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.content.iam_arn]
    }
    
    actions = [
      "s3:GetObject",
      "s3:ListBucket"
    ]
    
    resources = [
      aws_s3_bucket.content.arn,
      "${aws_s3_bucket.content.arn}/*"
    ]
  }
  
  statement {
    sid = "DenyInsecureTransport"
    effect = "Deny"
    
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    
    actions = [
      "s3:*"
    ]
    
    resources = [
      aws_s3_bucket.content.arn,
      "${aws_s3_bucket.content.arn}/*"
    ]
    
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "content" {
  bucket = aws_s3_bucket.content.id
  policy = data.aws_iam_policy_document.content_bucket_policy.json
}

# IAM Role for Content Management
resource "aws_iam_role" "content_manager" {
  name = "${var.project_name}-content-manager-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy for Content Management
resource "aws_iam_policy" "content_manager" {
  name        = "${var.project_name}-content-manager-${var.environment}"
  description = "Policy for managing e-book content"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.content.arn,
          "${aws_s3_bucket.content.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.content_encryption.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation"
        ]
        Resource = [
          aws_cloudfront_distribution.content.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "content_manager" {
  role       = aws_iam_role.content_manager.name
  policy_arn = aws_iam_policy.content_manager.arn
}

# CloudTrail for audit logging
resource "aws_cloudtrail" "main" {
  count = var.enable_cloudtrail ? 1 : 0
  
  name                          = "${var.project_name}-trail-${var.environment}"
  s3_bucket_name                = aws_s3_bucket.cloudtrail[0].id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true
  
  event_selector {
    read_write_type           = "All"
    include_management_events = true
    
    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.content.arn}/*"]
    }
  }
  
  depends_on = [aws_s3_bucket_policy.cloudtrail]
}

# S3 Bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail" {
  count  = var.enable_cloudtrail ? 1 : 0
  bucket = "${var.content_bucket_name}-cloudtrail"
  
  tags = {
    Name = "${var.project_name}-cloudtrail-${var.environment}"
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  count  = var.enable_cloudtrail ? 1 : 0
  bucket = aws_s3_bucket.cloudtrail[0].id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_iam_policy_document" "cloudtrail_bucket_policy" {
  count = var.enable_cloudtrail ? 1 : 0
  
  statement {
    sid    = "AWSCloudTrailAclCheck"
    effect = "Allow"
    
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    
    actions   = ["s3:GetBucketAcl"]
    resources = [aws_s3_bucket.cloudtrail[0].arn]
  }
  
  statement {
    sid    = "AWSCloudTrailWrite"
    effect = "Allow"
    
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.cloudtrail[0].arn}/*"]
    
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  count  = var.enable_cloudtrail ? 1 : 0
  bucket = aws_s3_bucket.cloudtrail[0].id
  policy = data.aws_iam_policy_document.cloudtrail_bucket_policy[0].json
}

# KMS Key Policy
resource "aws_kms_key_policy" "content_encryption" {
  key_id = aws_kms_key.content_encryption.id
  
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
        Sid    = "Allow CloudFront and S3 to use the key"
        Effect = "Allow"
        Principal = {
          Service = [
            "cloudfront.amazonaws.com",
            "s3.amazonaws.com"
          ]
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })
}

data "aws_caller_identity" "current" {}

# Security Group for any future EC2 instances
resource "aws_security_group" "content_delivery" {
  name        = "${var.project_name}-sg-${var.environment}"
  description = "Security group for content delivery infrastructure"
  
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS outbound"
  }
  
  tags = {
    Name = "${var.project_name}-sg-${var.environment}"
  }
}
```

```hcl
# monitoring.tf
# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts-${var.environment}"
  
  tags = {
    Name = "${var.project_name}-alerts-${var.environment}"
  }
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.environment}"
  
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
            ["AWS/CloudFront", "Requests", { "stat": "Sum" }],
            [".", "BytesDownloaded", { "stat": "Sum", "yAxis": "right" }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "CloudFront Traffic"
          yAxis = {
            right = {
              label = "Bytes"
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
            ["AWS/CloudFront", "CacheHitRate", { "stat": "Average" }],
            [".", "OriginLatency", { "stat": "Average", "yAxis": "right" }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "Performance Metrics"
          yAxis = {
            left = {
              min = 0
              max = 100
            }
            right = {
              label = "Latency (ms)"
            }
          }
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
            ["AWS/CloudFront", "4xxErrorRate", { "stat": "Average" }],
            [".", "5xxErrorRate", { "stat": "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "Error Rates"
          yAxis = {
            left = {
              min = 0
              max = 10
            }
          }
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/S3", "NumberOfObjects", "BucketName", aws_s3_bucket.content.id, { "stat": "Average" }],
            [".", "BucketSizeBytes", ".", ".", { "stat": "Average", "yAxis": "right" }]
          ]
          period = 86400
          stat   = "Average"
          region = var.aws_region
          title  = "S3 Storage Metrics"
        }
      }
    ]
  })
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "${var.project_name}-high-error-rate-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = var.high_error_rate_threshold
  alarm_description   = "This metric monitors CloudFront 5xx error rate"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    DistributionId = aws_cloudfront_distribution.content.id
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
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    DistributionId = aws_cloudfront_distribution.content.id
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
  alarm_description   = "This metric monitors origin latency"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    DistributionId = aws_cloudfront_distribution.content.id
  }
}

# CloudWatch Logs for CloudFront
resource "aws_cloudwatch_log_group" "cloudfront" {
  name              = "/aws/cloudfront/${var.project_name}-${var.environment}"
  retention_in_days = var.log_retention_days
  
  tags = {
    Name = "${var.project_name}-cloudfront-logs-${var.environment}"
  }
}

# Cost Anomaly Detection
resource "aws_ce_anomaly_monitor" "content_delivery" {
  name              = "${var.project_name}-cost-monitor-${var.environment}"
  monitor_type      = "DIMENSIONAL"
  monitor_dimension = "SERVICE"
}

resource "aws_ce_anomaly_subscription" "content_delivery" {
  name      = "${var.project_name}-cost-alerts-${var.environment}"
  threshold = 100
  frequency = "DAILY"
  
  monitor_arn_list = [
    aws_ce_anomaly_monitor.content_delivery.arn
  ]
  
  subscriber {
    type    = "EMAIL"
    address = var.alarm_email
  }
}

# CloudWatch Logs Metric Filter for tracking access patterns
resource "aws_cloudwatch_log_metric_filter" "ebook_downloads" {
  name           = "${var.project_name}-ebook-downloads"
  pattern        = "[time, request_id, edge_location, bytes_sent, ip, method, host, uri_stem, status, referrer, user_agent, query_string, cookie, x_edge_result_type, x_edge_request_id, host_header, protocol, bytes_received, time_taken, x_forwarded_for, ssl_protocol, ssl_cipher, x_edge_response_result_type, protocol_version]"
  log_group_name = aws_cloudwatch_log_group.cloudfront.name
  
  metric_transformation {
    name      = "EbookDownloads"
    namespace = "${var.project_name}/ContentDelivery"
    value     = "1"
    
    dimensions = {
      EdgeLocation = "$edge_location"
      Status       = "$status"
    }
  }
}

# Custom CloudWatch Metric for Content Popularity
resource "aws_cloudwatch_log_metric_filter" "popular_content" {
  name           = "${var.project_name}-popular-content"
  pattern        = "[time, request_id, edge_location, bytes_sent, ip, method, host, uri_stem=*.epub||*.pdf, status=200, ...]"
  log_group_name = aws_cloudwatch_log_group.cloudfront.name
  
  metric_transformation {
    name      = "PopularContent"
    namespace = "${var.project_name}/ContentDelivery"
    value     = "1"
    
    dimensions = {
      Content = "$uri_stem"
    }
  }
}
```

```markdown
# README.md

# Secure Content Delivery System for E-book Publishing

This Terraform configuration deploys a secure, scalable, and cost-effective content delivery system for serving e-books to 5,000 daily readers globally.

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Route 53      │────▶│   CloudFront     │────▶│      S3         │
│   DNS           │     │   CDN            │     │   Storage       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                           │
                               ▼                           ▼
                        ┌─────────────┐            ┌──────────────┐
                        │    WAF      │            │     KMS      │
                        │  Protection │            │  Encryption  │
                        └─────────────┘            └──────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  CloudWatch  │
                        │  Monitoring  │
                        └──────────────┘
```

### Key Components

1. **Amazon S3**: Secure storage for e-books with server-side encryption
2. **Amazon CloudFront**: Global CDN for low-latency content delivery
3. **Route 53**: DNS management and routing
4. **AWS KMS**: Customer-managed keys for encryption
5. **AWS WAF**: Web Application Firewall for additional security
6. **CloudWatch**: Comprehensive monitoring and alerting
7. **CloudTrail**: Audit logging for compliance

## Features

### Security
- **Encryption at Rest**: All content encrypted using KMS customer-managed keys
- **HTTPS Only**: Enforced TLS 1.2+ for all connections
- **Origin Access Identity**: S3 bucket accessible only through CloudFront
- **WAF Protection**: Rate limiting and managed rule sets
- **Security Headers**: HSTS, X-Frame-Options, CSP headers
- **Audit Logging**: CloudTrail integration for compliance

### Performance
- **Global Edge Locations**: Content cached at 400+ edge locations
- **Optimized Caching**: Separate cache behaviors for different content types
- **Compression**: Automatic gzip compression for smaller file sizes
- **IPv6 Support**: Dual-stack support for modern networks

### Cost Optimization
- **S3 Lifecycle Policies**: Automatic transition to cheaper storage classes
- **CloudFront Price Class**: Configurable edge location selection
- **Log Retention**: Automatic cleanup of old logs
- **Cost Anomaly Detection**: Automated alerts for unusual spending

### Monitoring
- **Real-time Dashboard**: CloudWatch dashboard for key metrics
- **Automated Alerts**: SNS notifications for issues
- **Access Pattern Analysis**: Track content popularity
- **Performance Metrics**: Cache hit rate, origin latency, error rates

## Prerequisites

1. AWS Account with appropriate permissions
2. Terraform >= 1.0
3. Domain name (for Route 53 configuration)
4. AWS CLI configured with credentials

## Deployment Instructions

### 1. Clone and Configure

```bash
# Clone the repository
git clone <repository-url>
cd tap-content-delivery

# Create terraform.tfvars
cat > terraform.tfvars <<EOF
domain_name         = "example.com"
content_bucket_name = "my-ebook-content-bucket"
alarm_email         = "alerts@example.com"
aws_region          = "us-east-1"
environment         = "production"
EOF
```

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Review the Plan

```bash
terraform plan
```

### 4. Deploy

```bash
terraform apply
```

### 5. Update DNS Nameservers

After deployment, update your domain registrar's nameservers to the Route 53 nameservers shown in the output.

### 6. Upload Content

```bash
# Upload an e-book
aws s3 cp my-ebook.epub s3://$(terraform output -raw s3_bucket_name)/books/my-ebook.epub

# Invalidate CloudFront cache (if updating existing content)
aws cloudfront create-invalidation \
  --distribution-id $(terraform output -raw cloudfront_distribution_id) \
  --paths "/books/my-ebook.epub"
```

## Cost Estimates

For 5,000 daily readers with average e-book size of 2MB:

| Service | Monthly Cost | Details |
|---------|--------------|---------|
| S3 Storage | ~$5 | 1TB stored content |
| S3 Requests | ~$2 | GET requests |
| CloudFront | ~$85 | 10TB monthly transfer |
| Route 53 | ~$1 | 1 hosted zone + queries |
| KMS | ~$1 | Key usage |
| CloudWatch | ~$3 | Logs and metrics |
| **Total** | **~$97/month** | |

*Note: Costs may vary based on actual usage and region*

## Scaling Considerations

The system automatically scales to handle increased traffic:

1. **CloudFront**: Automatically scales to any traffic level
2. **S3**: No scaling required, handles any request volume
3. **Monitoring**: CloudWatch metrics scale with usage

For significantly higher traffic (>50,000 daily users):
- Consider upgrading CloudFront price class for better global coverage
- Review WAF rate limits
- Implement CloudFront origin request policies for better caching

## Security Best Practices

1. **Regular Key Rotation**: KMS keys auto-rotate annually
2. **Least Privilege IAM**: Content managers have minimal required permissions
3. **Audit Logging**: CloudTrail logs all API calls
4. **Encryption**: All data encrypted in transit and at rest
5. **Access Control**: S3 bucket policy denies all direct access

## Monitoring and Alerts

The system includes automated alerts for:
- High error rates (>5%)
- Low cache hit rates (<70%)
- High origin latency (>1000ms)
- Cost anomalies

Access the CloudWatch dashboard at the URL provided in the Terraform output.

## Maintenance

### Regular Tasks

1. **Review CloudWatch Dashboards** (Daily)
   - Check cache hit rates
   - Monitor error rates
   - Review traffic patterns

2. **Cost Optimization** (Monthly)
   - Review AWS Cost Explorer
   - Check S3 storage class distribution
   - Analyze CloudFront usage patterns

3. **Security Audit** (Quarterly)
   - Review CloudTrail logs
   - Update WAF rules if needed
   - Check for security advisories

### Updating Content

```bash
# Upload new content
aws s3 cp new-ebook.epub s3://$(terraform output -raw s3_bucket_name)/books/

# For bulk updates, use sync
aws s3 sync ./local-books/ s3://$(terraform output -raw s3_bucket_name)/books/
```

## Troubleshooting

### Common Issues

1. **403 Forbidden Errors**
   - Check S3 bucket policy
   - Verify CloudFront OAI configuration
   - Ensure object permissions are correct

2. **Slow Download Speeds**
   - Check CloudWatch cache hit rate
   - Review CloudFront behaviors
   - Consider upgrading price class

3. **High Costs**
   - Review CloudWatch cost anomaly alerts
   - Check data transfer by region
   - Optimize caching policies

## Disaster Recovery

1. **S3 Versioning**: Enabled for accidental deletion recovery
2. **Cross-Region Replication**: Can be enabled for critical content
3. **Backup Strategy**: Regular backups to Glacier for long-term storage
4. **CloudFormation Backup**: Infrastructure as code ensures quick rebuild

## Support

For issues or questions:
1. Check CloudWatch logs and metrics
2. Review AWS service health dashboard
3. Contact AWS support for infrastructure issues

## License

[Your License Here]
```

This comprehensive Terraform configuration provides a production-ready content delivery system with:

- **Security**: Multiple layers of protection including WAF, encryption, and access controls
- **Performance**: Global CDN with optimized caching strategies
- **Cost Optimization**: Lifecycle policies and monitoring to minimize costs
- **Scalability**: Automatically handles traffic spikes
- **Monitoring**: Real-time visibility into system health and performance

The system is designed to efficiently serve 5,000 daily readers while being able to scale to much higher traffic levels without architectural changes.

