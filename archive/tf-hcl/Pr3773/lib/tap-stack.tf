# tap-stack.tf
# Secure e-books content delivery infrastructure using Terraform

# ===========================
# VARIABLES
# ===========================

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming (e.g., pr123, dev)"
  type        = string
  default     = "dev"
}

variable "tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}

# ===========================
# LOCALS
# ===========================

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

# ===========================
# KMS KEY FOR LOG ENCRYPTION
# ===========================

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

# ===========================
# S3 BUCKETS
# ===========================

# E-books content bucket
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

# Logs bucket
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

# ===========================
# CLOUDFRONT DISTRIBUTION
# ===========================

resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for ${local.name_prefix} e-books distribution"
}

# S3 bucket policy to allow CloudFront OAI access
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

# CloudFront distribution
resource "aws_cloudfront_distribution" "ebooks_distribution" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CDN for ${local.name_prefix} e-books"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

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

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-distribution"
    }
  )
}

# ===========================
# CLOUDWATCH MONITORING
# ===========================

# CloudWatch alarm for high error rate
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

  dimensions = {
    DistributionId = aws_cloudfront_distribution.ebooks_distribution.id
    Region         = "Global"
  }

  tags = local.common_tags
}

# CloudWatch alarm for request count
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

  dimensions = {
    DistributionId = aws_cloudfront_distribution.ebooks_distribution.id
    Region         = "Global"
  }

  tags = local.common_tags
}

# CloudWatch dashboard
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
            ["AWS/CloudFront", "Requests", { stat = "Sum", label = "Total Requests" }],
            [".", "BytesDownloaded", { stat = "Sum", label = "Bytes Downloaded" }],
            [".", "4xxErrorRate", { stat = "Average", label = "4xx Error Rate" }],
            [".", "5xxErrorRate", { stat = "Average", label = "5xx Error Rate" }]
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

# ===========================
# IAM ROLES AND POLICIES
# ===========================

# IAM policy for CloudWatch Logs
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

# ===========================
# DATA SOURCES
# ===========================

data "aws_caller_identity" "current" {}

# ===========================
# OUTPUTS
# ===========================

output "aws_region" {
  description = "The AWS region where resources are deployed"
  value       = var.aws_region
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

output "cloudfront_oai_iam_arn" {
  description = "IAM ARN of the CloudFront Origin Access Identity"
  value       = aws_cloudfront_origin_access_identity.oai.iam_arn
}

output "cloudwatch_alarm_error_rate_arn" {
  description = "ARN of the CloudWatch alarm for high error rate"
  value       = aws_cloudwatch_metric_alarm.high_error_rate.arn
}

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.ebooks_dashboard.dashboard_name
}
