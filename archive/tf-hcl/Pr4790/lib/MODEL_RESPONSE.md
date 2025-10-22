### Reasoning Trace
---

Okay, I need to create a Terraform configuration file that sets up a secure and efficient content delivery system for e-books. Let me break down the requirements:

1. S3 bucket for e-books:
   - Public access blocked
   - KMS encryption at rest
   - Only accessible via CloudFront

2. CloudFront distribution:
   - Origin Access Identity for S3 access
   - HTTPS with ACM certificate
   - Access logging enabled

3. Route 53 DNS record:
   - Points to CloudFront distribution

4. Logging:
   - S3 bucket for CloudFront logs
   - KMS encryption for logs
   - CloudWatch metrics

5. IAM policies:
   - Least privilege for all components
   - Controlled access to content, logs, and keys

Let me create the file:

First, I'll define the provider and required versions:

```terraform
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
```

Next, I'll define the KMS keys for content and logs encryption:

```terraform
resource "aws_kms_key" "content_key" {
  description             = "KMS key for e-book content encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_kms_key" "logs_key" {
  description             = "KMS key for log encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_kms_alias" "content_key_alias" {
  name          = "alias/ebook-content-key"
  target_key_id = aws_kms_key.content_key.key_id
}

resource "aws_kms_alias" "logs_key_alias" {
  name          = "alias/ebook-logs-key"
  target_key_id = aws_kms_key.logs_key.key_id
}
```

Now I'll create the S3 bucket for e-books with proper security settings:

```terraform
resource "aws_s3_bucket" "ebook_bucket" {
  bucket_prefix = "ebook-content-"
}

resource "aws_s3_bucket_public_access_block" "ebook_bucket_block" {
  bucket = aws_s3_bucket.ebook_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "ebook_bucket_encryption" {
  bucket = aws_s3_bucket.ebook_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.content_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_versioning" "ebook_bucket_versioning" {
  bucket = aws_s3_bucket.ebook_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}
```

Next, I'll create the logging bucket:

```terraform
resource "aws_s3_bucket" "logs_bucket" {
  bucket_prefix = "ebook-logs-"
}

resource "aws_s3_bucket_public_access_block" "logs_bucket_block" {
  bucket = aws_s3_bucket.logs_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs_bucket_encryption" {
  bucket = aws_s3_bucket.logs_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.logs_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs_lifecycle" {
  bucket = aws_s3_bucket.logs_bucket.id

  rule {
    id     = "log-rotation"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}
```

Now, I'll create the CloudFront Origin Access Identity:

```terraform
resource "aws_cloudfront_origin_access_identity" "ebook_oai" {
  comment = "OAI for eBooks content access"
}
```

Let's set up the S3 bucket policy to allow CloudFront access:

```terraform
data "aws_iam_policy_document" "s3_policy" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.ebook_bucket.arn}/*"]

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.ebook_oai.iam_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "ebook_bucket_policy" {
  bucket = aws_s3_bucket.ebook_bucket.id
  policy = data.aws_iam_policy_document.s3_policy.json
}
```

Now I'll set up the ACM certificate for HTTPS:

```terraform
resource "aws_acm_certificate" "ebook_cert" {
  domain_name       = "ebooks.example.com"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}
```

Let's set up a Route 53 zone and record:

```terraform
resource "aws_route53_zone" "primary" {
  name = "example.com"
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.ebook_cert.domain_validation_options : dvo.domain_name => {
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
  zone_id         = aws_route53_zone.primary.zone_id
}

resource "aws_acm_certificate_validation" "ebook_cert_validation" {
  certificate_arn         = aws_acm_certificate.ebook_cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}
```

Now let's create the CloudFront distribution:

```terraform
resource "aws_cloudfront_distribution" "ebook_distribution" {
  origin {
    domain_name = aws_s3_bucket.ebook_bucket.bucket_regional_domain_name
    origin_id   = "S3-ebooks"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.ebook_oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.logs_bucket.bucket_regional_domain_name
    prefix          = "cloudfront/"
  }

  aliases = ["ebooks.example.com"]

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-ebooks"

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
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.ebook_cert_validation.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  web_acl_id = aws_wafv2_web_acl.ebook_waf.arn
}
```

Let's set up CloudWatch metrics:

```terraform
resource "aws_cloudwatch_dashboard" "ebook_dashboard" {
  dashboard_name = "eBooks-Metrics"

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
            ["AWS/CloudFront", "Requests", "DistributionId", aws_cloudfront_distribution.ebook_distribution.id],
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          period  = 300
          title   = "CloudFront Requests"
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
            ["AWS/CloudFront", "TotalErrorRate", "DistributionId", aws_cloudfront_distribution.ebook_distribution.id],
            ["AWS/CloudFront", "4xxErrorRate", "DistributionId", aws_cloudfront_distribution.ebook_distribution.id],
            ["AWS/CloudFront", "5xxErrorRate", "DistributionId", aws_cloudfront_distribution.ebook_distribution.id]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          period  = 300
          title   = "CloudFront Error Rates"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 24
        height = 6
        properties = {
          metrics = [
            ["AWS/CloudFront", "BytesDownloaded", "DistributionId", aws_cloudfront_distribution.ebook_distribution.id],
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          period  = 300
          title   = "CloudFront Data Transfer"
        }
      }
    ]
  })
}
```

Let's add a basic WAF configuration for security:

```terraform
resource "aws_wafv2_web_acl" "ebook_waf" {
  name        = "ebook-waf"
  description = "WAF for eBook distribution"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 0

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

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "eBookWAFMetric"
    sampled_requests_enabled   = true
  }
}
```

Let's add a CloudFront to Route 53 record:

```terraform
resource "aws_route53_record" "ebook_record" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = "ebooks.example.com"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.ebook_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.ebook_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}
```

Now I'll add CloudWatch alarms for monitoring:

```terraform
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "ebook-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "60"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "This alarm monitors CloudFront 5xx error rates"
  alarm_actions       = []
  dimensions = {
    DistributionId = aws_cloudfront_distribution.ebook_distribution.id
    Region         = "Global"
  }
}

resource "aws_cloudwatch_metric_alarm" "high_4xx_rate" {
  alarm_name          = "ebook-high-4xx-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "60"
  statistic           = "Average"
  threshold           = "10"
  alarm_description   = "This alarm monitors CloudFront 4xx error rates"
  alarm_actions       = []
  dimensions = {
    DistributionId = aws_cloudfront_distribution.ebook_distribution.id
    Region         = "Global"
  }
}
```

Putting it all together, I have created the necessary Terraform configuration for a secure and efficient e-book delivery system. The configuration includes:

1. S3 bucket with KMS encryption for e-books
2. A dedicated S3 bucket with KMS encryption for logs
3. CloudFront distribution with OAI for secure access to S3
4. ACM certificate for HTTPS
5. Route 53 DNS configuration
6. CloudWatch metrics and alarms
7. WAF for added security

The configuration follows best practices for security, including:
- Encryption at rest for content and logs
- Public access blocking for S3 buckets
- CloudFront OAI for S3 access
- HTTPS-only access
- Comprehensive logging
- Monitoring and alerting

Let me now finalize the complete tap_stack.tf file. Looking back at the requirements, I see that I need to strictly avoid comments in my file, keep it as a single file, and ensure it's valid Terraform.

Let's review my final configuration. There are some components that may not be necessary for the core requirements, like WAF. I'll simplify a bit to make sure the file is focused on the primary requirements.

Actually, I think WAF adds important security to the solution, so I'll keep that. Let me create the final file without any comments.

Everything looks good, but I need to ensure I'm returning a valid, clean Terraform file without any comments or explanations.

I'll review once more to ensure all the components are properly configured:

- Terraform and provider configuration ✓
- KMS keys for content and logs ✓
- S3 bucket for e-books with security settings ✓ 
- S3 bucket for logs with security settings ✓
- CloudFront OAI ✓
- S3 bucket policy for CloudFront access ✓
- ACM certificate ✓
- Route 53 configuration ✓
- CloudFront distribution ✓
- CloudWatch dashboard and alarms ✓
- WAF configuration ✓
- DNS record linking to CloudFront ✓

This covers all the requirements, and the Terraform configuration is valid. I'll now provide the complete tap_stack.tf file.

Let me make a few more adjustments to ensure the configuration is clean and optimal:
- Ensure KMS key policies follow least privilege principles
- Add tags to resources for better management
- Ensure proper lifecycle rules for the log bucket

After these adjustments, I'll finalize the file.
### Answer 
---

```terraform
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

resource "aws_kms_key" "content_key" {
  description             = "KMS key for e-book content encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
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
      }
    ]
  })
}

resource "aws_kms_key" "logs_key" {
  description             = "KMS key for log encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
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
        Sid    = "Allow CloudFront to use the key for log encryption"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:Decrypt"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_kms_alias" "content_key_alias" {
  name          = "alias/ebook-content-key"
  target_key_id = aws_kms_key.content_key.key_id
}

resource "aws_kms_alias" "logs_key_alias" {
  name          = "alias/ebook-logs-key"
  target_key_id = aws_kms_key.logs_key.key_id
}

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "ebook_bucket" {
  bucket_prefix = "ebook-content-"
}

resource "aws_s3_bucket_public_access_block" "ebook_bucket_block" {
  bucket = aws_s3_bucket.ebook_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "ebook_bucket_encryption" {
  bucket = aws_s3_bucket.ebook_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.content_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_versioning" "ebook_bucket_versioning" {
  bucket = aws_s3_bucket.ebook_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket" "logs_bucket" {
  bucket_prefix = "ebook-logs-"
}

resource "aws_s3_bucket_public_access_block" "logs_bucket_block" {
  bucket = aws_s3_bucket.logs_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs_bucket_encryption" {
  bucket = aws_s3_bucket.logs_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.logs_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs_lifecycle" {
  bucket = aws_s3_bucket.logs_bucket.id

  rule {
    id     = "log-rotation"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

resource "aws_cloudfront_origin_access_identity" "ebook_oai" {
  comment = "OAI for eBooks content access"
}

data "aws_iam_policy_document" "s3_policy" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.ebook_bucket.arn}/*"]

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.ebook_oai.iam_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "ebook_bucket_policy" {
  bucket = aws_s3_bucket.ebook_bucket.id
  policy = data.aws_iam_policy_document.s3_policy.json
}

resource "aws_acm_certificate" "ebook_cert" {
  domain_name       = "ebooks.example.com"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_zone" "primary" {
  name = "example.com"
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.ebook_cert.domain_validation_options : dvo.domain_name => {
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
  zone_id         = aws_route53_zone.primary.zone_id
}

resource "aws_acm_certificate_validation" "ebook_cert_validation" {
  certificate_arn         = aws_acm_certificate.ebook_cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

resource "aws_wafv2_web_acl" "ebook_waf" {
  name        = "ebook-waf"
  description = "WAF for eBook distribution"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 0

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

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "eBookWAFMetric"
    sampled_requests_enabled   = true
  }
}

resource "aws_cloudfront_distribution" "ebook_distribution" {
  origin {
    domain_name = aws_s3_bucket.ebook_bucket.bucket_regional_domain_name
    origin_id   = "S3-ebooks"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.ebook_oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.logs_bucket.bucket_regional_domain_name
    prefix          = "cloudfront/"
  }

  aliases = ["ebooks.example.com"]

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-ebooks"

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
    
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers_policy.id
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.ebook_cert_validation.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  web_acl_id = aws_wafv2_web_acl.ebook_waf.arn
}

resource "aws_cloudfront_response_headers_policy" "security_headers_policy" {
  name = "ebook-security-headers"

  security_headers_config {
    content_type_options {
      override = true
    }
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      override                   = true
      preload                    = true
    }
    xss_protection {
      mode_block = true
      override   = true
      protection = true
    }
    referrer_policy {
      referrer_policy = "same-origin"
      override        = true
    }
  }
}

resource "aws_route53_record" "ebook_record" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = "ebooks.example.com"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.ebook_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.ebook_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_cloudwatch_dashboard" "ebook_dashboard" {
  dashboard_name = "eBooks-Metrics"

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
            ["AWS/CloudFront", "Requests", "DistributionId", aws_cloudfront_distribution.ebook_distribution.id],
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          period  = 300
          title   = "CloudFront Requests"
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
            ["AWS/CloudFront", "TotalErrorRate", "DistributionId", aws_cloudfront_distribution.ebook_distribution.id],
            ["AWS/CloudFront", "4xxErrorRate", "DistributionId", aws_cloudfront_distribution.ebook_distribution.id],
            ["AWS/CloudFront", "5xxErrorRate", "DistributionId", aws_cloudfront_distribution.ebook_distribution.id]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          period  = 300
          title   = "CloudFront Error Rates"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 24
        height = 6
        properties = {
          metrics = [
            ["AWS/CloudFront", "BytesDownloaded", "DistributionId", aws_cloudfront_distribution.ebook_distribution.id],
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          period  = 300
          title   = "CloudFront Data Transfer"
        }
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "ebook-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "60"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "This alarm monitors CloudFront 5xx error rates"
  dimensions = {
    DistributionId = aws_cloudfront_distribution.ebook_distribution.id
    Region         = "Global"
  }
}

resource "aws_cloudwatch_metric_alarm" "high_4xx_rate" {
  alarm_name          = "ebook-high-4xx-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "60"
  statistic           = "Average"
  threshold           = "10"
  alarm_description   = "This alarm monitors CloudFront 4xx error rates"
  dimensions = {
    DistributionId = aws_cloudfront_distribution.ebook_distribution.id
    Region         = "Global"
  }
}
```