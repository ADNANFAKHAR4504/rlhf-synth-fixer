### Reasoning Trace
---

I need to define a complete Terraform configuration for a secure and efficient content delivery system for e-books. Let me break down the requirements and implement them step by step:

1. Create an S3 bucket for storing e-books with restricted public access
2. Set up CloudFront distribution with OAI to securely deliver content
3. Configure Route 53 for DNS routing
4. Provision SSL certificates with ACM
5. Set up CloudWatch for monitoring access and metrics
6. Create a logging S3 bucket with KMS encryption
7. Define IAM roles and policies with least privilege

Let me start with the provider configuration and then implement each component:

```terraform
provider "aws" {
  region = "us-east-1"  # Primary region for CloudFront and ACM
}
```

Next, I'll create the S3 bucket for storing e-books:

```terraform
resource "aws_s3_bucket" "ebooks_bucket" {
  bucket = "premium-ebooks-content"
  acl    = "private"  # Ensure the bucket is private

  versioning {
    enabled = true  # Enable versioning for content safety
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  tags = {
    Name        = "Premium E-Books Content"
    Environment = "Production"
  }
}

# Block public access to the S3 bucket
resource "aws_s3_bucket_public_access_block" "ebooks_bucket_public_access_block" {
  bucket = aws_s3_bucket.ebooks_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

Now, I need to create a separate S3 bucket for access logging with KMS encryption:

```terraform
resource "aws_kms_key" "logs_key" {
  description             = "KMS key for encrypting S3 access logs"
  deletion_window_in_days = 10
  enable_key_rotation     = true
}

resource "aws_s3_bucket" "logs_bucket" {
  bucket = "premium-ebooks-logs"
  acl    = "log-delivery-write"  # Grant log delivery permission

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.logs_key.arn
        sse_algorithm     = "aws:kms"
      }
    }
  }

  lifecycle_rule {
    enabled = true

    expiration {
      days = 365  # Keep logs for one year
    }
  }

  tags = {
    Name        = "E-Books Access Logs"
    Environment = "Production"
  }
}

# Block public access to the logs bucket
resource "aws_s3_bucket_public_access_block" "logs_bucket_public_access_block" {
  bucket = aws_s3_bucket.logs_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

Next, let me create the ACM certificate for secure HTTPS:

```terraform
resource "aws_acm_certificate" "ebooks_cert" {
  domain_name       = "ebooks.example.com"
  validation_method = "DNS"

  tags = {
    Environment = "Production"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Create Route 53 record for certificate validation
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

# Certificate validation
resource "aws_acm_certificate_validation" "ebooks_cert" {
  certificate_arn         = aws_acm_certificate.ebooks_cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}
```

Now I need to create the Route 53 zone:

```terraform
resource "aws_route53_zone" "main" {
  name = "example.com"
}

resource "aws_route53_record" "ebooks" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "ebooks.example.com"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.ebooks_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.ebooks_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}
```

Next, let's create the CloudFront OAI and distribution:

```terraform
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for E-Books distribution"
}

resource "aws_cloudfront_distribution" "ebooks_distribution" {
  origin {
    domain_name = aws_s3_bucket.ebooks_bucket.bucket_regional_domain_name
    origin_id   = "S3-premium-ebooks-content"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_All"  # Distribute to all edge locations for global coverage

  logging_config {
    include_cookies = true
    bucket          = aws_s3_bucket.logs_bucket.bucket_domain_name
    prefix          = "cloudfront-logs/"
  }

  aliases = ["ebooks.example.com"]

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3-premium-ebooks-content"

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

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.ebooks_cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Environment = "Production"
  }
}
```

Now, let's update the S3 bucket policy to allow CloudFront OAI access:

```terraform
resource "aws_s3_bucket_policy" "ebooks_bucket_policy" {
  bucket = aws_s3_bucket.ebooks_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "s3:GetObject"
        Effect    = "Allow"
        Resource  = "${aws_s3_bucket.ebooks_bucket.arn}/*"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.oai.iam_arn
        }
      }
    ]
  })
}
```

Finally, let's set up CloudWatch metrics and alarms:

```terraform
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "high-error-rate-ebooks"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "60"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "This metric monitors CloudFront error rates"
  alarm_actions       = []  # Add SNS topic ARN here if needed

  dimensions = {
    DistributionId = aws_cloudfront_distribution.ebooks_distribution.id
    Region         = "Global"
  }
}

resource "aws_cloudwatch_dashboard" "ebooks_dashboard" {
  dashboard_name = "Ebooks-Distribution-Metrics"

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
            ["AWS/CloudFront", "Requests", "DistributionId", aws_cloudfront_distribution.ebooks_distribution.id, "Region", "Global"],
            ["AWS/CloudFront", "BytesDownloaded", "DistributionId", aws_cloudfront_distribution.ebooks_distribution.id, "Region", "Global"],
            ["AWS/CloudFront", "4xxErrorRate", "DistributionId", aws_cloudfront_distribution.ebooks_distribution.id, "Region", "Global"],
            ["AWS/CloudFront", "5xxErrorRate", "DistributionId", aws_cloudfront_distribution.ebooks_distribution.id, "Region", "Global"]
          ]
          view    = "timeSeries"
          stacked = false
          title   = "CloudFront Metrics"
          region  = "us-east-1"
        }
      }
    ]
  })
}
```

Let's also create IAM roles and policies for least privilege:

```terraform
resource "aws_iam_role" "cloudfront_logging_role" {
  name = "cloudfront-logging-role"

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
}

resource "aws_iam_policy" "cloudfront_logging_policy" {
  name        = "cloudfront-logging-policy"
  description = "Allow CloudFront to write logs to S3"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:PutObject"
        ]
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.logs_bucket.arn}/cloudfront-logs/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "cloudfront_logging_attachment" {
  role       = aws_iam_role.cloudfront_logging_role.name
  policy_arn = aws_iam_policy.cloudfront_logging_policy.arn
}
```

Let's include some additional WAF rules for enhanced security:

```terraform
resource "aws_wafv2_web_acl" "ebooks_waf" {
  name        = "ebooks-waf"
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
        limit              = 1000
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
    metric_name                = "ebooks-waf"
    sampled_requests_enabled   = true
  }
}

# Associate WAF with CloudFront
resource "aws_wafv2_web_acl_association" "cloudfront_waf" {
  resource_arn = aws_cloudfront_distribution.ebooks_distribution.arn
  web_acl_arn  = aws_wafv2_web_acl.ebooks_waf.arn
}
```

Now, let me check if I've met all the requirements:
- S3 bucket for e-books with private access ✅
- CloudFront with OAI for secure delivery ✅
- Route 53 for DNS routing ✅
- SSL certificates with ACM ✅
- CloudWatch for monitoring ✅
- Logging S3 bucket with KMS encryption ✅
- IAM roles and policies with least privilege ✅
- WAF for additional security ✅

I believe I've covered everything. Let me now compile the complete Terraform configuration file.

The final Terraform file would be quite extensive. Let me put it all together into a single `tap_stack.tf` file as requested:

```terraform
provider "aws" {
  region = "us-east-1"  # Primary region for CloudFront and ACM
}

# S3 bucket for storing e-books
resource "aws_s3_bucket" "ebooks_bucket" {
  bucket = "premium-ebooks-content"
  acl    = "private"

  versioning {
    enabled = true
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  tags = {
    Name        = "Premium E-Books Content"
    Environment = "Production"
  }
}

# Block public access to the e-books bucket
resource "aws_s3_bucket_public_access_block" "ebooks_bucket_public_access_block" {
  bucket = aws_s3_bucket.ebooks_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# KMS key for log encryption
resource "aws_kms_key" "logs_key" {
  description             = "KMS key for encrypting S3 access logs"
  deletion_window_in_days = 10
  enable_key_rotation     = true
}

# S3 bucket for access logs
resource "aws_s3_bucket" "logs_bucket" {
  bucket = "premium-ebooks-logs"
  acl    = "log-delivery-write"

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.logs_key.arn
        sse_algorithm     = "aws:kms"
      }
    }
  }

  lifecycle_rule {
    enabled = true

    expiration {
      days = 365
    }
  }

  tags = {
    Name        = "E-Books Access Logs"
    Environment = "Production"
  }
}

# Block public access to the logs bucket
resource "aws_s3_bucket_public_access_block" "logs_bucket_public_access_block" {
  bucket = aws_s3_bucket.logs_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Route 53 zone
resource "aws_route53_zone" "main" {
  name = "example.com"
}

# ACM certificate for HTTPS
resource "aws_acm_certificate" "ebooks_cert" {
  domain_name       = "ebooks.example.com"
  validation_method = "DNS"

  tags = {
    Environment = "Production"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Route 53 record for certificate validation
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

# Certificate validation
resource "aws_acm_certificate_validation" "ebooks_cert" {
  certificate_arn         = aws_acm_certificate.ebooks_cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for E-Books distribution"
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "ebooks_distribution" {
  origin {
    domain_name = aws_s3_bucket.ebooks_bucket.bucket_regional_domain_name
    origin_id   = "S3-premium-ebooks-content"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_All"

  logging_config {
    include_cookies = true
    bucket          = aws_s3_bucket.logs_bucket.bucket_domain_name
    prefix          = "cloudfront-logs/"
  }

  aliases = ["ebooks.example.com"]

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3-premium-ebooks-content"

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

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.ebooks_cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Environment = "Production"
  }
}

# Route 53 record for the CloudFront distribution
resource "aws_route53_record" "ebooks" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "ebooks.example.com"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.ebooks_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.ebooks_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

# S3 bucket policy to allow CloudFront OAI access
resource "aws_s3_bucket_policy" "ebooks_bucket_policy" {
  bucket = aws_s3_bucket.ebooks_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "s3:GetObject"
        Effect    = "Allow"
        Resource  = "${aws_s3_bucket.ebooks_bucket.arn}/*"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.oai.iam_arn
        }
      }
    ]
  })
}

# CloudWatch alarm for high error rate
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "high-error-rate-ebooks"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "60"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "This metric monitors CloudFront error rates"
  alarm_actions       = []

  dimensions = {
    DistributionId = aws_cloudfront_distribution.ebooks_distribution.id
    Region         = "Global"
  }
}

# CloudWatch dashboard
resource "aws_cloudwatch_dashboard" "ebooks_dashboard" {
  dashboard_name = "Ebooks-Distribution-Metrics"

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
            ["AWS/CloudFront", "Requests", "DistributionId", aws_cloudfront_distribution.ebooks_distribution.id, "Region", "Global"],
            ["AWS/CloudFront", "BytesDownloaded", "DistributionId", aws_cloudfront_distribution.ebooks_distribution.id, "Region", "Global"],
            ["AWS/CloudFront", "4xxErrorRate", "DistributionId", aws_cloudfront_distribution.ebooks_distribution.id, "Region", "Global"],
            ["AWS/CloudFront", "5xxErrorRate", "DistributionId", aws_cloudfront_distribution.ebooks_distribution.id, "Region", "Global"]
          ]
          view    = "timeSeries"
          stacked = false
          title   = "CloudFront Metrics"
          region  = "us-east-1"
        }
      }
    ]
  })
}

# IAM role for CloudFront logging
resource "aws_iam_role" "cloudfront_logging_role" {
  name = "cloudfront-logging-role"

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
}

# IAM policy for CloudFront logging
resource "aws_iam_policy" "cloudfront_logging_policy" {
  name        = "cloudfront-logging-policy"
  description = "Allow CloudFront to write logs to S3"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:PutObject"
        ]
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.logs_bucket.arn}/cloudfront-logs/*"
      }
    ]
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "cloudfront_logging_attachment" {
  role       = aws_iam_role.cloudfront_logging_role.name
  policy_arn = aws_iam_policy.cloudfront_logging_policy.arn
}

# WAF Web ACL for additional security
resource "aws_wafv2_web_acl" "ebooks_waf" {
  name        = "ebooks-waf"
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
        limit              = 1000
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
    metric_name                = "ebooks-waf"
    sampled_requests_enabled   = true
  }
}

# Associate WAF with CloudFront
resource "aws_wafv2_web_acl_association" "cloudfront_waf" {
  resource_arn = aws_cloudfront_distribution.ebooks_distribution.arn
  web_acl_arn  = aws_wafv2_web_acl.ebooks_waf.arn
}
```

This Terraform configuration provides all the required infrastructure for a secure e-books content delivery system. 

I've included:
1. S3 bucket for e-books storage with private access
2. S3 bucket for logs with KMS encryption
3. CloudFront distribution with OAI
4. ACM certificate for HTTPS
5. Route 53 for DNS
6. CloudWatch metrics and alarms
7. IAM roles with least privilege
8. WAF for enhanced security

The configuration follows best practices for security, performance, and maintainability.

I see that the S3 ACL configuration might be deprecated in newer Terraform AWS provider versions. I'll update it to use the newer syntax:

```terraform
resource "aws_s3_bucket" "ebooks_bucket" {
  bucket = "premium-ebooks-content"

  tags = {
    Name        = "Premium E-Books Content"
    Environment = "Production"
  }
}

resource "aws_s3_bucket_acl" "ebooks_bucket_acl" {
  bucket = aws_s3_bucket.ebooks_bucket.id
  acl    = "private"
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
```

I'll make the same changes for the logs bucket as well. Since I need to provide a single, complete Terraform configuration, let me revise the entire file with these updates:
### Answer 
---

```terraform
provider "aws" {
  region = "us-east-1"
}

resource "aws_s3_bucket" "ebooks_bucket" {
  bucket = "premium-ebooks-content"
  
  tags = {
    Name        = "Premium E-Books Content"
    Environment = "Production"
  }
}

resource "aws_s3_bucket_acl" "ebooks_bucket_acl" {
  bucket = aws_s3_bucket.ebooks_bucket.id
  acl    = "private"
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

resource "aws_kms_key" "logs_key" {
  description             = "KMS key for encrypting S3 access logs"
  deletion_window_in_days = 10
  enable_key_rotation     = true
}

resource "aws_s3_bucket" "logs_bucket" {
  bucket = "premium-ebooks-logs"
  
  tags = {
    Name        = "E-Books Access Logs"
    Environment = "Production"
  }
}

resource "aws_s3_bucket_acl" "logs_bucket_acl" {
  bucket = aws_s3_bucket.logs_bucket.id
  acl    = "log-delivery-write"
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

resource "aws_route53_zone" "main" {
  name = "example.com"
}

resource "aws_acm_certificate" "ebooks_cert" {
  domain_name       = "ebooks.example.com"
  validation_method = "DNS"

  tags = {
    Environment = "Production"
  }

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
  certificate_arn         = aws_acm_certificate.ebooks_cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for E-Books distribution"
}

resource "aws_cloudfront_distribution" "ebooks_distribution" {
  origin {
    domain_name = aws_s3_bucket.ebooks_bucket.bucket_regional_domain_name
    origin_id   = "S3-premium-ebooks-content"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_All"

  logging_config {
    include_cookies = true
    bucket          = aws_s3_bucket.logs_bucket.bucket_domain_name
    prefix          = "cloudfront-logs/"
  }

  aliases = ["ebooks.example.com"]

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3-premium-ebooks-content"

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

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.ebooks_cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Environment = "Production"
  }
}

resource "aws_route53_record" "ebooks" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "ebooks.example.com"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.ebooks_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.ebooks_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_s3_bucket_policy" "ebooks_bucket_policy" {
  bucket = aws_s3_bucket.ebooks_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "s3:GetObject"
        Effect    = "Allow"
        Resource  = "${aws_s3_bucket.ebooks_bucket.arn}/*"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.oai.iam_arn
        }
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "high-error-rate-ebooks"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "60"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "This metric monitors CloudFront error rates"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.ebooks_distribution.id
    Region         = "Global"
  }
}

resource "aws_cloudwatch_dashboard" "ebooks_dashboard" {
  dashboard_name = "Ebooks-Distribution-Metrics"

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
            ["AWS/CloudFront", "Requests", "DistributionId", aws_cloudfront_distribution.ebooks_distribution.id, "Region", "Global"],
            ["AWS/CloudFront", "BytesDownloaded", "DistributionId", aws_cloudfront_distribution.ebooks_distribution.id, "Region", "Global"],
            ["AWS/CloudFront", "4xxErrorRate", "DistributionId", aws_cloudfront_distribution.ebooks_distribution.id, "Region", "Global"],
            ["AWS/CloudFront", "5xxErrorRate", "DistributionId", aws_cloudfront_distribution.ebooks_distribution.id, "Region", "Global"]
          ]
          view    = "timeSeries"
          stacked = false
          title   = "CloudFront Metrics"
          region  = "us-east-1"
        }
      }
    ]
  })
}

resource "aws_iam_role" "cloudfront_logging_role" {
  name = "cloudfront-logging-role"

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
}

resource "aws_iam_policy" "cloudfront_logging_policy" {
  name        = "cloudfront-logging-policy"
  description = "Allow CloudFront to write logs to S3"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:PutObject"
        ]
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.logs_bucket.arn}/cloudfront-logs/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "cloudfront_logging_attachment" {
  role       = aws_iam_role.cloudfront_logging_role.name
  policy_arn = aws_iam_policy.cloudfront_logging_policy.arn
}

resource "aws_wafv2_web_acl" "ebooks_waf" {
  name        = "ebooks-waf"
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
        limit              = 1000
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
    metric_name                = "ebooks-waf"
    sampled_requests_enabled   = true
  }
}

resource "aws_wafv2_web_acl_association" "cloudfront_waf" {
  resource_arn = aws_cloudfront_distribution.ebooks_distribution.arn
  web_acl_arn  = aws_wafv2_web_acl.ebooks_waf.arn
}
```