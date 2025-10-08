# Terraform Infrastructure for Donation Platform Static Website

Here's the complete Terraform infrastructure code for the donation platform static website with all requested features:

```hcl
# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Domain name for the website"
  type        = string
  default     = "donate.example.com"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "donation-platform"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "production"
    Project     = "donation-platform"
    ManagedBy   = "terraform"
  }
}
```

```hcl
# main.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.1"
    }
  }
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Local values for conditional resource references
locals {
  # Use the appropriate CloudFront distribution based on domain and DNS configuration
  cloudfront_distribution = var.domain_name != "" && var.create_dns_records ? aws_cloudfront_distribution.website_with_domain[0] : aws_cloudfront_distribution.website_default[0]
}

# CloudFront managed cache policy for static website optimization
data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

# CloudFront managed origin request policy for CORS-S3Origin
data "aws_cloudfront_origin_request_policy" "cors_s3_origin" {
  name = "Managed-CORS-S3Origin"
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

  tags = merge(var.tags, {
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

  tags = merge(var.tags, {
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

    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

# Block public access for website bucket (will use OAC instead)
resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket ownership controls for website bucket
resource "aws_s3_bucket_ownership_controls" "website" {
  bucket = aws_s3_bucket.website.id

  rule {
    object_ownership = "BucketOwnerPreferred"
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

# S3 bucket ownership controls for logs bucket
resource "aws_s3_bucket_ownership_controls" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "website" {
  name                              = "${var.project_name}-oac"
  description                       = "OAC for ${var.project_name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ACM Certificate for CloudFront (must be in us-east-1) - only when domain is provided and DNS records are created
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
    Name = "${var.project_name}-certificate"
  })
}

# CloudFront Distribution with domain (conditional)
resource "aws_cloudfront_distribution" "website_with_domain" {
  count = var.domain_name != "" && var.create_dns_records ? 1 : 0

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name} CloudFront Distribution with Domain"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  aliases = [var.domain_name, "www.${var.domain_name}"]

  origin {
    domain_name              = aws_s3_bucket.website.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.website.id
    origin_id                = "S3-${aws_s3_bucket.website.id}"
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.website.id}"
    cache_policy_id        = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"  # CachingOptimized
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
    Name = "${var.project_name}-distribution-with-domain"
  })

  depends_on = [aws_acm_certificate_validation.website]
}

# CloudFront Distribution without domain (default)
resource "aws_cloudfront_distribution" "website_default" {
  count = var.domain_name == "" || !var.create_dns_records ? 1 : 0

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name} CloudFront Distribution (Default)"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.website.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.website.id
    origin_id                = "S3-${aws_s3_bucket.website.id}"
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.website.id}"
    cache_policy_id        = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"  # CachingOptimized
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
    Name = "${var.project_name}-distribution-default"
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
        Action = "s3:GetObject"
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

# Route 53 Hosted Zone (only when domain is provided and DNS records are created)
data "aws_route53_zone" "main" {
  count = var.domain_name != "" && var.create_dns_records ? 1 : 0

  name         = replace(var.domain_name, "/^[^.]+\\./", "")
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

# ACM Certificate Validation (only when domain is provided and DNS records are created)
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
  dashboard_name = "${var.project_name}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        x    = 0
        y    = 0
        width = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/CloudFront", "Requests", { stat = "Sum", label = "Total Requests" }],
            [".", "BytesDownloaded", { stat = "Sum", label = "Bytes Downloaded", yAxis = "right" }]
          ]
          view = "timeSeries"
          stacked = false
          region = "us-east-1"
          title = "CloudFront Traffic"
          period = 300
        }
      },
      {
        type = "metric"
        x = 12
        y = 0
        width = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/CloudFront", "4xxErrorRate", { stat = "Average", label = "4xx Error Rate" }],
            [".", "5xxErrorRate", { stat = "Average", label = "5xx Error Rate" }]
          ]
          view = "timeSeries"
          stacked = false
          region = "us-east-1"
          title = "Error Rates"
          period = 300
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
        }
      },
      {
        type = "metric"
        x = 0
        y = 6
        width = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/S3", "BucketSizeBytes", {
              dimensions = {
                BucketName = aws_s3_bucket.website.id
                StorageType = "StandardStorage"
              }
              stat = "Average"
              label = "Website Bucket Size"
            }],
            [".", "NumberOfObjects", {
              dimensions = {
                BucketName = aws_s3_bucket.website.id
                StorageType = "AllStorageTypes"
              }
              stat = "Average"
              label = "Number of Objects"
              yAxis = "right"
            }]
          ]
          view = "timeSeries"
          stacked = false
          region = var.aws_region
          title = "S3 Storage Metrics"
          period = 86400
        }
      },
      {
        type = "metric"
        x = 12
        y = 6
        width = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/CloudFront", "CacheHitRate", { stat = "Average", label = "Cache Hit Rate" }]
          ]
          view = "timeSeries"
          stacked = false
          region = "us-east-1"
          title = "Cache Performance"
          period = 300
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

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_4xx_errors" {
  alarm_name          = "${var.project_name}-high-4xx-errors"
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

resource "aws_cloudwatch_metric_alarm" "high_5xx_errors" {
  alarm_name          = "${var.project_name}-high-5xx-errors"
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

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts"

  tags = var.tags
}

# Application Signals Service Map (Preview)
resource "aws_applicationinsights_application" "website" {
  resource_group_name = aws_resourcegroups_group.website.name
  auto_config_enabled = true
  auto_create         = true

  log_patterns {
    pattern_name = "cloudfront-access-logs"
    pattern      = "[timestamp, request_id, client_ip = /\\S+/, edge_location, method, host, uri, status, referrer, user_agent, query_string, cookie, x_edge_result_type, x_edge_request_id, x_host_header, protocol, bytes, time_taken, x_forwarded_for, ssl_protocol, ssl_cipher, x_edge_response_result_type, http_version, fle_status, fle_encrypted_fields, c_port, time_to_first_byte, x_edge_detailed_result_type, sc_content_type, sc_content_len, sc_range_start, sc_range_end]"
    rank         = 1
  }

  tags = var.tags
}

# Resource Group for Application Insights
resource "aws_resourcegroups_group" "website" {
  name = "${var.project_name}-resources"

  resource_query {
    query = jsonencode({
      ResourceTypeFilters = ["AWS::AllSupported"]
      TagFilters = [
        {
          Key    = "Project"
          Values = [var.project_name]
        }
      ]
    })
  }

  tags = var.tags
}
```

```hcl
# outputs.tf

output "website_bucket_name" {
  description = "Name of the S3 bucket hosting the website"
  value       = aws_s3_bucket.website.id
}

output "website_bucket_arn" {
  description = "ARN of the S3 bucket hosting the website"
  value       = aws_s3_bucket.website.arn
}

output "logs_bucket_name" {
  description = "Name of the S3 bucket for logs"
  value       = aws_s3_bucket.logs.id
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = local.cloudfront_distribution.id
}

output "cloudfront_distribution_domain" {
  description = "Domain name of the CloudFront distribution"
  value       = local.cloudfront_distribution.domain_name
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = local.cloudfront_distribution.arn
}

output "website_url" {
  description = "URL of the website"
  value       = "https://${var.domain_name}"
}

output "acm_certificate_arn" {
  description = "ARN of the ACM certificate"
  value       = aws_acm_certificate.website.arn
}

output "route53_zone_id" {
  description = "Route 53 Hosted Zone ID (only when domain is configured and DNS records are created)"
  value       = var.domain_name != "" && var.create_dns_records ? data.aws_route53_zone.main[0].zone_id : null
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "cloudwatch_dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.website.dashboard_name}"
}
```

```hcl
# sample-content.tf

# Sample index.html file for initial deployment
resource "aws_s3_object" "index" {
  bucket       = aws_s3_bucket.website.id
  key          = "index.html"
  content_type = "text/html"

  content = <<-EOT
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Donation Platform</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        h1 {
            color: #333;
            margin-bottom: 1rem;
        }
        p {
            color: #666;
            margin-bottom: 2rem;
        }
        .donate-btn {
            display: inline-block;
            padding: 12px 30px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            transition: background 0.3s;
        }
        .donate-btn:hover {
            background: #764ba2;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to Our Donation Platform</h1>
        <p>Your generosity makes a difference. Help us support those in need.</p>
        <a href="#" class="donate-btn">Make a Donation</a>
    </div>
</body>
</html>
EOT

  tags = var.tags
}

# Sample 404 error page
resource "aws_s3_object" "error_404" {
  bucket       = aws_s3_bucket.website.id
  key          = "404.html"
  content_type = "text/html"

  content = <<-EOT
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Not Found</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #f5f5f5;
            margin: 0;
        }
        .error-container {
            text-align: center;
            padding: 2rem;
        }
        h1 {
            font-size: 72px;
            color: #667eea;
            margin: 0;
        }
        h2 {
            color: #333;
            margin: 1rem 0;
        }
        p {
            color: #666;
            margin-bottom: 2rem;
        }
        a {
            color: #667eea;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you are looking for doesn't exist.</p>
        <a href="/">Return to Home</a>
    </div>
</body>
</html>
EOT

  tags = var.tags
}

# Sample 403 error page
resource "aws_s3_object" "error_403" {
  bucket       = aws_s3_bucket.website.id
  key          = "403.html"
  content_type = "text/html"

  content = <<-EOT
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Access Forbidden</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #f5f5f5;
            margin: 0;
        }
        .error-container {
            text-align: center;
            padding: 2rem;
        }
        h1 {
            font-size: 72px;
            color: #e74c3c;
            margin: 0;
        }
        h2 {
            color: #333;
            margin: 1rem 0;
        }
        p {
            color: #666;
            margin-bottom: 2rem;
        }
        a {
            color: #667eea;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>403</h1>
        <h2>Access Forbidden</h2>
        <p>You don't have permission to access this resource.</p>
        <a href="/">Return to Home</a>
    </div>
</body>
</html>
EOT

  tags = var.tags
}
```