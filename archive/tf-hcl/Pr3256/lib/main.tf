# main.tf

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# CloudFront managed cache policy for static website optimization
data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

# CloudFront managed origin request policy for CORS-S3Origin
data "aws_cloudfront_origin_request_policy" "cors_s3_origin" {
  name = "Managed-CORS-S3Origin"
}

# Local values for referencing the correct CloudFront distribution and enhanced tags
locals {
  cloudfront_distribution = var.domain_name != "" && var.create_dns_records ? aws_cloudfront_distribution.website_with_domain[0] : aws_cloudfront_distribution.website_default[0]
  
  # Enhanced tags with cost allocation
  common_tags = merge(var.tags, {
    Environment = var.environment
    CostCenter  = var.cost_center
    Owner       = var.owner
  })
}

# Random suffix for unique bucket names
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket for website content
resource "aws_s3_bucket" "website" {
  bucket = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-website-${random_string.bucket_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-website"
    Type = "website-content"
  })
}

# Enable versioning for content protection
resource "aws_s3_bucket_versioning" "website" {
  bucket = aws_s3_bucket.website.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket for CloudFront logs
resource "aws_s3_bucket" "logs" {
  bucket = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-logs-${random_string.bucket_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-logs"
    Type = "access-logs"
  })
}

# Enable server-side encryption for website bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Enable server-side encryption for logs bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Lifecycle policy for logs archival
resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "archive-logs"
    status = "Enabled"

    filter {}

    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

# Block public access for website bucket (using OAC for secure access)
resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Ownership Controls for website bucket
resource "aws_s3_bucket_ownership_controls" "website" {
  bucket = aws_s3_bucket.website.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

# Block public access for logs bucket
resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Ownership Controls for logs bucket
resource "aws_s3_bucket_ownership_controls" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "website" {
  name                              = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-oac"
  description                       = "OAC for ${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ACM Certificate for CloudFront (must be in us-east-1)
resource "aws_acm_certificate" "website" {
  count = var.domain_name != "" && var.create_dns_records ? 1 : 0

  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "www.${var.domain_name}"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-certificate"
  })
}

# CloudFront Distribution with custom domain
resource "aws_cloudfront_distribution" "website_with_domain" {
  count = var.domain_name != "" && var.create_dns_records ? 1 : 0

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""} CloudFront Distribution"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  aliases = [var.domain_name, "www.${var.domain_name}"]

  # Ensure certificate validation is complete before creating distribution
  depends_on = [aws_acm_certificate_validation.website[0]]

  origin {
    domain_name              = aws_s3_bucket.website.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.website.id
    origin_id                = "S3-${aws_s3_bucket.website.id}"
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.website.id}"

    # Use managed cache policy for optimized static website caching
    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_optimized.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.cors_s3_origin.id

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.website[0].arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.logs.bucket_domain_name
    prefix          = "cloudfront/"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 404
    response_page_path = "/404.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 403
    response_page_path = "/403.html"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-distribution"
  })
}

# CloudFront Distribution without custom domain
resource "aws_cloudfront_distribution" "website_default" {
  count = var.domain_name == "" || !var.create_dns_records ? 1 : 0

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""} CloudFront Distribution"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.website.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.website.id
    origin_id                = "S3-${aws_s3_bucket.website.id}"
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.website.id}"

    # Use managed cache policy for optimized static website caching
    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_optimized.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.cors_s3_origin.id

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.logs.bucket_domain_name
    prefix          = "cloudfront/"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 404
    response_page_path = "/404.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 403
    response_page_path = "/403.html"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-distribution"
  })
}

# S3 Bucket Policy for CloudFront OAC access
resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAC"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.website.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = local.cloudfront_distribution.arn
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.website]
}

# S3 Bucket Policy for CloudFront logs
resource "aws_s3_bucket_policy" "logs" {
  bucket = aws_s3_bucket.logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontLogs"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action = [
          "s3:PutObject",
          "s3:GetBucketAcl"
        ]
        Resource = [
          aws_s3_bucket.logs.arn,
          "${aws_s3_bucket.logs.arn}/*"
        ]
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# Route 53 Hosted Zone (assuming it exists)
data "aws_route53_zone" "main" {
  count = var.domain_name != "" && var.create_dns_records ? 1 : 0

  name = var.hosted_zone_name != "" ? var.hosted_zone_name : (
    # Extract root domain from domain_name (e.g., "example.com" from "www.example.com")
    length(split(".", var.domain_name)) > 2 ? 
    join(".", slice(split(".", var.domain_name), -2, length(split(".", var.domain_name)))) : 
    var.domain_name
  )
  private_zone = false
}

# Route 53 A Record for root domain
resource "aws_route53_record" "website" {
  count = var.domain_name != "" && var.create_dns_records ? 1 : 0

  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = local.cloudfront_distribution.domain_name
    zone_id                = local.cloudfront_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

# Route 53 A Record for www subdomain
resource "aws_route53_record" "www" {
  count = var.domain_name != "" && var.create_dns_records ? 1 : 0

  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = local.cloudfront_distribution.domain_name
    zone_id                = local.cloudfront_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

# ACM Certificate Validation
resource "aws_acm_certificate_validation" "website" {
  count = var.domain_name != "" && var.create_dns_records ? 1 : 0

  certificate_arn         = aws_acm_certificate.website[0].arn
  validation_record_fqdns = [for record in aws_route53_record.certificate_validation : record.fqdn]
}

# Route 53 records for ACM certificate validation
resource "aws_route53_record" "certificate_validation" {
  for_each = var.domain_name != "" && var.create_dns_records ? {
    for dvo in aws_acm_certificate.website[0].domain_validation_options : dvo.domain_name => {
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
  zone_id         = data.aws_route53_zone.main[0].zone_id
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "website" {
  dashboard_name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-dashboard"

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
            [".", "BytesDownloaded", { stat = "Sum", label = "Bytes Downloaded", yAxis = "right" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "CloudFront Traffic"
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
              min = 0
              max = 100
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
            ["AWS/S3", "BucketSizeBytes", {
              dimensions = {
                BucketName  = aws_s3_bucket.website.id
                StorageType = "StandardStorage"
              }
              stat  = "Average"
              label = "Website Bucket Size"
            }],
            [".", "NumberOfObjects", {
              dimensions = {
                BucketName  = aws_s3_bucket.website.id
                StorageType = "AllStorageTypes"
              }
              stat  = "Average"
              label = "Number of Objects"
              yAxis = "right"
            }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "S3 Storage Metrics"
          period  = 86400
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
            ["AWS/CloudFront", "CacheHitRate", { stat = "Average", label = "Cache Hit Rate" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Cache Performance"
          period  = 300
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
        }
      }
    ]
  })
}

# SNS Topic for CloudWatch Alarms
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-alerts"

  tags = local.common_tags
}

# SNS Topic Email Subscription (optional)
resource "aws_sns_topic_subscription" "email_alerts" {
  count = var.alert_email != "" ? 1 : 0

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_4xx_errors" {
  alarm_name          = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-high-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "This metric monitors 4xx error rate"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DistributionId = local.cloudfront_distribution.id
  }

  tags = var.tags
}

# CloudWatch Application Signals
resource "aws_applicationinsights_application" "website" {
  resource_group_name = aws_resourcegroups_group.website.name
  auto_config_enabled = true

  tags = var.tags
}

# Resource Group for Application Signals
resource "aws_resourcegroups_group" "website" {
  name = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-resources"

  resource_query {
    query = jsonencode({
      ResourceTypeFilters = [
        "AWS::CloudFront::Distribution",
        "AWS::S3::Bucket"
      ]
      TagFilters = [
        {
          Key    = "Name"
          Values = ["${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}*"]
        }
      ]
    })
  }

  tags = var.tags
}

# CloudWatch Composite Alarm for overall health
resource "aws_cloudwatch_composite_alarm" "website_health" {
  alarm_name        = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-composite-health"
  alarm_description = "Composite alarm monitoring overall website health"

  alarm_rule = format("(ALARM(%s) OR ALARM(%s))",
    aws_cloudwatch_metric_alarm.high_4xx_errors.alarm_name,
    aws_cloudwatch_metric_alarm.high_5xx_errors.alarm_name
  )

  actions_enabled = true
  alarm_actions   = [aws_sns_topic.alerts.arn]

  tags = var.tags
}

# CloudWatch Logs for Application Insights
resource "aws_cloudwatch_log_group" "application_insights" {
  name              = "/aws/applicationinsights/${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}"
  retention_in_days = var.log_retention_days

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "high_5xx_errors" {
  alarm_name          = "${var.project_name}${var.environment_suffix != "" ? "-${var.environment_suffix}" : ""}-high-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors 5xx error rate"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DistributionId = local.cloudfront_distribution.id
  }

  tags = var.tags
}