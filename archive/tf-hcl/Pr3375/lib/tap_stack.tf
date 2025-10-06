# tap_stack.tf
# Random ID for unique bucket naming
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Local values for dynamic naming
locals {
  content_bucket_name = var.content_bucket_name != "" ? var.content_bucket_name : "${var.project_name}-${var.region_prefix}-${random_id.bucket_suffix.hex}"
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
  name          = "alias/${var.project_name}-${var.region_prefix}-content-${var.environment}"
  target_key_id = aws_kms_key.content_encryption.key_id
}

# S3 Bucket for e-book storage
resource "aws_s3_bucket" "content" {
  bucket = local.content_bucket_name

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

    filter {}

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    noncurrent_version_transition {
      storage_class   = "STANDARD_IA"
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

# ACM Certificate for CloudFront (only if domain is provided)
resource "aws_acm_certificate" "content" {
  count                     = var.domain_name != "" ? 1 : 0
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
  aliases             = var.domain_name != "" ? [var.domain_name, "www.${var.domain_name}"] : []

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
    default_ttl            = 604800   # 7 days
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
    default_ttl            = 604800   # 7 days
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
    acm_certificate_arn            = var.domain_name != "" ? aws_acm_certificate_validation.content[0].certificate_arn : null
    ssl_support_method             = var.domain_name != "" ? "sni-only" : null
    minimum_protocol_version       = var.domain_name != "" ? "TLSv1.2_2021" : null
    cloudfront_default_certificate = var.domain_name == "" ? true : null
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
  name    = "${var.project_name}-${var.region_prefix}-security-headers-${var.environment}"
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
  bucket = "${local.content_bucket_name}-logs"

  tags = {
    Name = "${var.project_name}-logs-${var.environment}"
  }
}

# Enable ACLs for CloudFront logging
resource "aws_s3_bucket_acl" "logs" {
  bucket = aws_s3_bucket.logs.id
  acl    = "private"

  depends_on = [aws_s3_bucket_ownership_controls.logs]
}

# Sample content for testing
resource "aws_s3_object" "sample_content" {
  bucket       = aws_s3_bucket.content.id
  key          = "index.html"
  content      = <<-EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Secure Content Delivery System</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; color: #333; margin-bottom: 30px; }
        .status { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50; }
        .info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196F3; }
        .feature { margin: 15px 0; padding: 10px; background: #f9f9f9; border-radius: 5px; }
        .success { color: #4CAF50; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Secure Content Delivery System</h1>
            <p>Successfully deployed with Terraform</p>
        </div>
        
        <div class="status">
            <h3 class="success">✅ System Status: OPERATIONAL</h3>
            <p>Your secure content delivery infrastructure is live and ready to serve content globally.</p>
        </div>
        
        <div class="info">
            <h3>📊 System Configuration</h3>
            <div class="feature"><strong>CloudFront Distribution:</strong> Global CDN with HTTPS</div>
            <div class="feature"><strong>S3 Storage:</strong> Encrypted with KMS</div>
            <div class="feature"><strong>WAF Protection:</strong> Web Application Firewall enabled</div>
            <div class="feature"><strong>Monitoring:</strong> CloudWatch alarms and dashboard</div>
            <div class="feature"><strong>Security:</strong> Origin Access Identity (OAI) configured</div>
            <div class="feature"><strong>Cost Optimization:</strong> S3 lifecycle policies enabled</div>
        </div>
        
        <div class="info">
            <h3>🔗 Access Information</h3>
            <p><strong>Test URL:</strong> <a href="https://${aws_cloudfront_distribution.content.domain_name}" target="_blank">https://${aws_cloudfront_distribution.content.domain_name}</a></p>
            <p><strong>CloudFront Domain:</strong> ${aws_cloudfront_distribution.content.domain_name}</p>
            <p><strong>S3 Bucket:</strong> ${aws_s3_bucket.content.bucket}</p>
        </div>
        
        <div class="info">
            <h3>📝 Next Steps</h3>
            <p>1. Upload your e-books and content to the S3 bucket</p>
            <p>2. Configure your domain name (if not using CloudFront default)</p>
            <p>3. Set up monitoring alerts</p>
            <p>4. Test content delivery performance</p>
        </div>
    </div>
</body>
</html>
EOF
  content_type = "text/html"

  tags = {
    Name        = "${var.project_name}-sample-content-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Set ownership controls to allow ACLs
resource "aws_s3_bucket_ownership_controls" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"

    filter {}

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

# Route 53 Hosted Zone (only if domain is provided)
resource "aws_route53_zone" "main" {
  count = var.domain_name != "" ? 1 : 0
  name  = var.domain_name

  tags = {
    Name = "${var.project_name}-${var.environment}"
  }
}

# ACM Certificate Validation (only if domain is provided)
resource "aws_route53_record" "cert_validation" {
  for_each = var.domain_name != "" ? {
    for dvo in aws_acm_certificate.content[0].domain_validation_options : dvo.domain_name => {
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
  zone_id         = aws_route53_zone.main[0].zone_id
}

resource "aws_acm_certificate_validation" "content" {
  count                   = var.domain_name != "" ? 1 : 0
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.content[0].arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# Route 53 Records (only if domain is provided)
resource "aws_route53_record" "root" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.content.domain_name
    zone_id                = aws_cloudfront_distribution.content.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.content.domain_name
    zone_id                = aws_cloudfront_distribution.content.hosted_zone_id
    evaluate_target_health = false
  }
}

# S3 Bucket Policy - Restrict access only through CloudFront
resource "aws_s3_bucket_policy" "content" {
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
            "AWS:SourceArn" = aws_cloudfront_distribution.content.arn
          }
        }
      },
      {
        Sid       = "DenyInsecureConnections"
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

# CloudTrail for audit logging (disabled by default due to AWS 5-trail limit)
resource "aws_cloudtrail" "content_delivery" {
  count = var.enable_cloudtrail && !local.skip_cloudtrail_creation ? 1 : 0

  name                          = "${var.project_name}-cloudtrail-${var.environment}"
  s3_bucket_name                = aws_s3_bucket.logs.id
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

  # CloudFront management events are tracked by default in CloudTrail
  # Data-level events for CloudFront distributions are not supported

  depends_on = [aws_s3_bucket_policy.cloudtrail_logs]
}

# S3 Bucket Policy for CloudFront logs (always needed)
resource "aws_s3_bucket_policy" "logs" {
  bucket = aws_s3_bucket.logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudFrontLogsDelivery"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/cloudfront/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.content.arn
          }
        }
      },
      {
        Sid    = "AWSCloudFrontLogsDeliveryAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.logs.arn
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.content.arn
          }
        }
      }
    ]
  })
}

# S3 Bucket Policy for CloudTrail logs (conditional)
resource "aws_s3_bucket_policy" "cloudtrail_logs" {
  count = var.enable_cloudtrail && !local.skip_cloudtrail_creation ? 1 : 0

  bucket = aws_s3_bucket.logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
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
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"  = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-cloudtrail-${var.environment}"
          }
        }
      },
      {
        Sid    = "AWSCloudTrailWriteDigest"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs.arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/CloudTrail-Digest/${var.aws_region}/*/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-cloudtrail-${var.environment}"
          }
        }
      }
    ]
  })
}

# Data source for current AWS account ID
data "aws_caller_identity" "current" {}

# Check if we can create CloudTrail (limit is 5 trails per region)
locals {
  # CloudTrail creation should be skipped if we hit the limit
  skip_cloudtrail_creation = var.enable_cloudtrail && false # Set to true if hitting trail limit
}

# CloudWatch Log Group for CloudFront logs
resource "aws_cloudwatch_log_group" "cloudfront" {
  name              = "/aws/cloudfront/${var.project_name}-${var.environment}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "${var.project_name}-cloudfront-logs-${var.environment}"
  }
}

# SNS Topic for CloudWatch alarms
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

# CloudWatch Alarms
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

# CloudWatch Dashboard
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

# Optional WAF for additional protection
resource "aws_wafv2_web_acl" "cloudfront" {
  count    = var.enable_waf ? 1 : 0
  provider = aws.us_east_1

  name  = "${var.project_name}-${var.region_prefix}-waf-${var.environment}"
  scope = "CLOUDFRONT"

  lifecycle {
    create_before_destroy = true
  }

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
      metric_name                = "${var.project_name}-${var.region_prefix}-rate-limit"
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
      metric_name                = "${var.project_name}-${var.region_prefix}-common-rules"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-${var.region_prefix}-waf"
    sampled_requests_enabled   = true
  }
}