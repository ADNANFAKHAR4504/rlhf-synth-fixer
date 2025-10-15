```terraform
# provider.tf
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}
```

```terraform
# tap-stack.tf
variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
}

variable "domain_name" {
  description = "Base domain name for the application"
  type        = string
  default     = "example.com"
}

variable "tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}

locals {
  name_prefix = "ebooks-${var.environment_suffix}"
  
  common_tags = merge(
    {
      Environment = var.environment_suffix
      ManagedBy   = "Terraform"
      Project     = "EbooksDelivery"
    },
    var.tags
  )
}

data "aws_caller_identity" "current" {}

resource "aws_kms_key" "logs_key" {
  description             = "KMS key for encrypting S3 access logs"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-logs-key"
    }
  )
}

resource "aws_kms_alias" "logs_key_alias" {
  name          = "alias/${local.name_prefix}-logs-key"
  target_key_id = aws_kms_key.logs_key.key_id
}

resource "aws_s3_bucket" "ebooks_bucket" {
  bucket = "${local.name_prefix}-content-${data.aws_caller_identity.current.account_id}"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-ebooks-content"
    }
  )
}

resource "aws_s3_bucket_versioning" "ebooks_bucket_versioning" {
  bucket = aws_s3_bucket.ebooks_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "ebooks_bucket_encryption" {
  bucket = aws_s3_bucket.ebooks_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "ebooks_bucket_public_access_block" {
  bucket = aws_s3_bucket.ebooks_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket" "logs_bucket" {
  bucket = "${local.name_prefix}-logs-${data.aws_caller_identity.current.account_id}"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-access-logs"
    }
  )
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs_bucket_encryption" {
  bucket = aws_s3_bucket.logs_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.logs_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs_bucket_lifecycle" {
  bucket = aws_s3_bucket.logs_bucket.id

  rule {
    id     = "log-expiration"
    status = "Enabled"

    expiration {
      days = 365
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs_bucket_public_access_block" {
  bucket = aws_s3_bucket.logs_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "logs_bucket_ownership" {
  bucket = aws_s3_bucket.logs_bucket.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "logs_bucket_acl" {
  depends_on = [aws_s3_bucket_ownership_controls.logs_bucket_ownership]
  bucket     = aws_s3_bucket.logs_bucket.id
  acl        = "log-delivery-write"
}

resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-zone"
    }
  )
}

resource "aws_acm_certificate" "ebooks_cert" {
  provider          = aws.us_east_1
  domain_name       = "ebooks.${var.domain_name}"
  validation_method = "DNS"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-certificate"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.ebooks_cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id = aws_route53_zone.main.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 60
  records = [each.value.record]
}

resource "aws_acm_certificate_validation" "ebooks_cert" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.ebooks_cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]

  timeouts {
    create = "5m"
  }
}

resource "aws_wafv2_web_acl" "ebooks_waf" {
  provider    = aws.us_east_1
  name        = "${local.name_prefix}-waf"
  description = "WAF for e-books distribution"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "RateLimit"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimit"
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
      metric_name                = "AWSManagedRulesCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name_prefix}-waf"
    sampled_requests_enabled   = true
  }

  tags = local.common_tags
}

resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for ${local.name_prefix} e-books distribution"
}

resource "aws_s3_bucket_policy" "ebooks_bucket_policy" {
  bucket = aws_s3_bucket.ebooks_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAI"
        Action = "s3:GetObject"
        Effect = "Allow"
        Resource = "${aws_s3_bucket.ebooks_bucket.arn}/*"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.oai.iam_arn
        }
      }
    ]
  })
}

resource "aws_s3_bucket_policy" "logs_bucket_policy" {
  bucket = aws_s3_bucket.logs_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontLogging"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs_bucket.arn}/cloudfront-logs/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.ebooks_distribution.arn
          }
        }
      }
    ]
  })
}

resource "aws_cloudfront_distribution" "ebooks_distribution" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CDN for ${local.name_prefix} e-books"
  default_root_object = "index.html"
  price_class         = "PriceClass_All"
  web_acl_id         = aws_wafv2_web_acl.ebooks_waf.arn

  origin {
    domain_name = aws_s3_bucket.ebooks_bucket.bucket_regional_domain_name
    origin_id   = "S3-${local.name_prefix}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = "S3-${local.name_prefix}"
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

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.logs_bucket.bucket_domain_name
    prefix          = "cloudfront-logs/"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  aliases = ["ebooks.${var.domain_name}"]

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.ebooks_cert.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-distribution"
    }
  )
}

resource "aws_route53_record" "ebooks" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "ebooks.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.ebooks_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.ebooks_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_sns_topic" "alerts" {
  name              = "${local.name_prefix}-alerts"
  kms_master_key_id = aws_kms_key.logs_key.id

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "${local.name_prefix}-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 5
  alarm_description   = "This metric monitors CloudFront 5xx error rates"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    DistributionId = aws_cloudfront_distribution.ebooks_distribution.id
    Region         = "Global"
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "low_request_count" {
  alarm_name          = "${local.name_prefix}-low-request-count"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Requests"
  namespace           = "AWS/CloudFront"
  period              = 3600
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "This metric monitors CloudFront request count"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    DistributionId = aws_cloudfront_distribution.ebooks_distribution.id
    Region         = "Global"
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_dashboard" "ebooks_dashboard" {
  dashboard_name = "${local.name_prefix}-metrics"

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
            ["AWS/CloudFront", "Requests", "DistributionId", aws_cloudfront_distribution.ebooks_distribution.id, "Region", "Global", { stat = "Sum", label = "Total Requests" }],
            [".", "BytesDownloaded", ".", ".", ".", ".", { stat = "Sum", label = "Bytes Downloaded" }],
            [".", "4xxErrorRate", ".", ".", ".", ".", { stat = "Average", label = "4xx Error Rate" }],
            [".", "5xxErrorRate", ".", ".", ".", ".", { stat = "Average", label = "5xx Error Rate" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "CloudFront Distribution Metrics"
          period  = 300
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      }
    ]
  })
}

resource "aws_iam_role" "cloudwatch_logs_role" {
  name = "${local.name_prefix}-cloudwatch-logs-role"

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

  tags = local.common_tags
}

resource "aws_iam_policy" "cloudwatch_logs_policy" {
  name        = "${local.name_prefix}-cloudwatch-logs"
  description = "Policy for CloudWatch Logs access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/cloudfront/${local.name_prefix}*"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "cloudwatch_logs_attachment" {
  role       = aws_iam_role.cloudwatch_logs_role.name
  policy_arn = aws_iam_policy.cloudwatch_logs_policy.arn
}

output "aws_region" {
  description = "The AWS region where resources are deployed"
  value       = var.aws_region
}

output "domain_name" {
  description = "Base domain name"
  value       = var.domain_name
}

output "ebooks_url" {
  description = "URL for accessing the e-books application"
  value       = "https://ebooks.${var.domain_name}"
}

output "ebooks_bucket_name" {
  description = "Name of the S3 bucket storing e-books"
  value       = aws_s3_bucket.ebooks_bucket.id
}

output "ebooks_bucket_arn" {
  description = "ARN of the S3 bucket storing e-books"
  value       = aws_s3_bucket.ebooks_bucket.arn
}

output "logs_bucket_name" {
  description = "Name of the S3 bucket storing access logs"
  value       = aws_s3_bucket.logs_bucket.id
}

output "logs_bucket_arn" {
  description = "ARN of the S3 bucket storing access logs"
  value       = aws_s3_bucket.logs_bucket.arn
}

output "kms_key_id" {
  description = "ID of the KMS key used for log encryption"
  value       = aws_kms_key.logs_key.key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for log encryption"
  value       = aws_kms_key.logs_key.arn
}

output "route53_zone_id" {
  description = "ID of the Route 53 hosted zone"
  value       = aws_route53_zone.main.zone_id
}

output "acm_certificate_arn" {
  description = "ARN of the ACM SSL certificate"
  value       = aws_acm_certificate_validation.ebooks_cert.certificate_arn
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.ebooks_distribution.id
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.ebooks_distribution.arn
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.ebooks_distribution.domain_name
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.ebooks_waf.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.ebooks_dashboard.dashboard_name
}
```