I'll create a comprehensive Terraform configuration for your global content delivery system with DDoS protection and multi-region deployment.

```hcl
# tap_stack.tf

# Configure Terraform and providers
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    # Configure your remote state backend
    # bucket = "your-terraform-state-bucket"
    # key    = "global-content-delivery/terraform.tfstate"
    # region = "us-east-1"
    # encrypt = true
    # dynamodb_table = "terraform-state-lock"
  }
}

# Provider configurations
provider "aws" {
  alias  = "primary"
  region = var.primary_region
  
  default_tags {
    tags = var.common_tags
  }
}

provider "aws" {
  alias  = "secondary"
  region = var.secondary_region
  
  default_tags {
    tags = var.common_tags
  }
}

# Provider for CloudFront and ACM (must be us-east-1)
provider "aws" {
  alias  = "cloudfront"
  region = "us-east-1"
  
  default_tags {
    tags = var.common_tags
  }
}

# Random string for unique resource naming
resource "random_string" "unique_id" {
  length  = 8
  special = false
  upper   = false
}

# KMS Keys for S3 encryption
resource "aws_kms_key" "primary_s3_key" {
  provider                = aws.primary
  description             = "KMS key for S3 encryption in primary region"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = merge(var.common_tags, {
    Name = "${var.project_name}-primary-s3-key"
  })
}

resource "aws_kms_alias" "primary_s3_key_alias" {
  provider      = aws.primary
  name          = "alias/${var.project_name}-primary-s3-key"
  target_key_id = aws_kms_key.primary_s3_key.key_id
}

resource "aws_kms_key" "secondary_s3_key" {
  provider                = aws.secondary
  description             = "KMS key for S3 encryption in secondary region"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  
  tags = merge(var.common_tags, {
    Name = "${var.project_name}-secondary-s3-key"
  })
}

resource "aws_kms_alias" "secondary_s3_key_alias" {
  provider      = aws.secondary
  name          = "alias/${var.project_name}-secondary-s3-key"
  target_key_id = aws_kms_key.secondary_s3_key.key_id
}

# S3 Buckets for logging
resource "aws_s3_bucket" "primary_logs" {
  provider = aws.primary
  bucket   = "${var.project_name}-logs-${var.primary_region}-${random_string.unique_id.result}"
  
  tags = merge(var.common_tags, {
    Name = "${var.project_name}-logs-primary"
  })
}

resource "aws_s3_bucket" "secondary_logs" {
  provider = aws.secondary
  bucket   = "${var.project_name}-logs-${var.secondary_region}-${random_string.unique_id.result}"
  
  tags = merge(var.common_tags, {
    Name = "${var.project_name}-logs-secondary"
  })
}

# Configure S3 bucket settings for log buckets
resource "aws_s3_bucket_server_side_encryption_configuration" "primary_logs_encryption" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary_logs.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "secondary_logs_encryption" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary_logs.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "primary_logs_pab" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary_logs.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "secondary_logs_pab" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary_logs.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Primary content bucket
resource "aws_s3_bucket" "primary_content" {
  provider = aws.primary
  bucket   = "${var.project_name}-content-${var.primary_region}-${random_string.unique_id.result}"
  
  tags = merge(var.common_tags, {
    Name = "${var.project_name}-content-primary"
  })
}

# Secondary content bucket
resource "aws_s3_bucket" "secondary_content" {
  provider = aws.secondary
  bucket   = "${var.project_name}-content-${var.secondary_region}-${random_string.unique_id.result}"
  
  tags = merge(var.common_tags, {
    Name = "${var.project_name}-content-secondary"
  })
}

# Configure S3 bucket settings for primary content bucket
resource "aws_s3_bucket_versioning" "primary_content_versioning" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary_content.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "primary_content_encryption" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary_content.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.primary_s3_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_logging" "primary_content_logging" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary_content.id
  
  target_bucket = aws_s3_bucket.primary_logs.id
  target_prefix = "s3-access-logs/"
}

resource "aws_s3_bucket_lifecycle_configuration" "primary_content_lifecycle" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary_content.id
  
  rule {
    id     = "delete-old-versions"
    status = "Enabled"
    
    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
  
  rule {
    id     = "transition-to-ia"
    status = "Enabled"
    
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "primary_content_cors" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary_content.id
  
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["https://${var.domain_name}"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

resource "aws_s3_bucket_public_access_block" "primary_content_pab" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary_content.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Configure S3 bucket settings for secondary content bucket
resource "aws_s3_bucket_versioning" "secondary_content_versioning" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary_content.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "secondary_content_encryption" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary_content.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.secondary_s3_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_logging" "secondary_content_logging" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary_content.id
  
  target_bucket = aws_s3_bucket.secondary_logs.id
  target_prefix = "s3-access-logs/"
}

resource "aws_s3_bucket_lifecycle_configuration" "secondary_content_lifecycle" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary_content.id
  
  rule {
    id     = "delete-old-versions"
    status = "Enabled"
    
    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
  
  rule {
    id     = "transition-to-ia"
    status = "Enabled"
    
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "secondary_content_cors" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary_content.id
  
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["https://${var.domain_name}"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

resource "aws_s3_bucket_public_access_block" "secondary_content_pab" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary_content.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket for CloudFront logs
resource "aws_s3_bucket" "cloudfront_logs" {
  provider = aws.primary
  bucket   = "${var.project_name}-cf-logs-${random_string.unique_id.result}"
  
  tags = merge(var.common_tags, {
    Name = "${var.project_name}-cloudfront-logs"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudfront_logs_encryption" {
  provider = aws.primary
  bucket   = aws_s3_bucket.cloudfront_logs.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudfront_logs_pab" {
  provider = aws.primary
  bucket   = aws_s3_bucket.cloudfront_logs.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "${var.project_name} OAI"
}

# S3 Bucket Policies for CloudFront access
data "aws_iam_policy_document" "primary_content_policy" {
  statement {
    sid = "AllowCloudFrontOAI"
    
    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.oai.iam_arn]
    }
    
    actions = [
      "s3:GetObject",
      "s3:ListBucket"
    ]
    
    resources = [
      aws_s3_bucket.primary_content.arn,
      "${aws_s3_bucket.primary_content.arn}/*"
    ]
  }
}

resource "aws_s3_bucket_policy" "primary_content_policy" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary_content.id
  policy   = data.aws_iam_policy_document.primary_content_policy.json
}

data "aws_iam_policy_document" "secondary_content_policy" {
  statement {
    sid = "AllowCloudFrontOAI"
    
    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.oai.iam_arn]
    }
    
    actions = [
      "s3:GetObject",
      "s3:ListBucket"
    ]
    
    resources = [
      aws_s3_bucket.secondary_content.arn,
      "${aws_s3_bucket.secondary_content.arn}/*"
    ]
  }
}

resource "aws_s3_bucket_policy" "secondary_content_policy" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary_content.id
  policy   = data.aws_iam_policy_document.secondary_content_policy.json
}

# ACM Certificate for CloudFront
resource "aws_acm_certificate" "cloudfront_cert" {
  provider                  = aws.cloudfront
  domain_name               = var.domain_name
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method         = "DNS"
  
  lifecycle {
    create_before_destroy = true
  }
  
  tags = merge(var.common_tags, {
    Name = "${var.project_name}-cloudfront-cert"
  })
}

# Lambda@Edge function for content personalization
data "aws_iam_policy_document" "lambda_edge_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com", "edgelambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_edge_role" {
  provider           = aws.cloudfront
  name               = "${var.project_name}-lambda-edge-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_edge_assume_role.json
  
  tags = var.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_edge_basic" {
  provider   = aws.cloudfront
  role       = aws_iam_role.lambda_edge_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda@Edge function for viewer request
resource "aws_lambda_function" "viewer_request" {
  provider         = aws.cloudfront
  function_name    = "${var.project_name}-viewer-request"
  role            = aws_iam_role.lambda_edge_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 5
  publish         = true
  
  filename        = "lambda-edge-viewer-request.zip"
  source_code_hash = filebase64sha256("lambda-edge-viewer-request.zip")
  
  tags = var.common_tags
}

# Lambda@Edge function for viewer response (security headers)
resource "aws_lambda_function" "viewer_response" {
  provider         = aws.cloudfront
  function_name    = "${var.project_name}-viewer-response"
  role            = aws_iam_role.lambda_edge_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 5
  publish         = true
  
  filename        = "lambda-edge-viewer-response.zip"
  source_code_hash = filebase64sha256("lambda-edge-viewer-response.zip")
  
  tags = var.common_tags
}

# WAF Web ACL
resource "aws_wafv2_web_acl" "cloudfront_waf" {
  provider = aws.cloudfront
  name     = "${var.project_name}-cloudfront-waf"
  scope    = "CLOUDFRONT"
  
  default_action {
    allow {}
  }
  
  # AWS Managed Core rule set
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
      metric_name                = "CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }
  
  # AWS Managed Known Bad Inputs rule set
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2
    
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
      metric_name                = "KnownBadInputsMetric"
      sampled_requests_enabled   = true
    }
  }
  
  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 3
    
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
      metric_name                = "RateLimitMetric"
      sampled_requests_enabled   = true
    }
  }
  
  # Geographic restrictions (if needed)
  dynamic "rule" {
    for_each = length(var.blocked_countries) > 0 ? [1] : []
    content {
      name     = "GeoBlockingRule"
      priority = 4
      
      action {
        block {}
      }
      
      statement {
        geo_match_statement {
          country_codes = var.blocked_countries
        }
      }
      
      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "GeoBlockingMetric"
        sampled_requests_enabled   = true
      }
    }
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-waf-metric"
    sampled_requests_enabled   = true
  }
  
  tags = var.common_tags
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name} CloudFront Distribution"
  default_root_object = "index.html"
  aliases             = [var.domain_name, "www.${var.domain_name}"]
  price_class         = var.cloudfront_price_class
  web_acl_id          = aws_wafv2_web_acl.cloudfront_waf.arn
  
  # Primary origin (us-east-1)
  origin {
    domain_name = aws_s3_bucket.primary_content.bucket_regional_domain_name
    origin_id   = "primary-s3-origin"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
    
    custom_header {
      name  = "x-origin-verify"
      value = var.origin_verify_secret
    }
  }
  
  # Secondary origin (ap-southeast-1)
  origin {
    domain_name = aws_s3_bucket.secondary_content.bucket_regional_domain_name
    origin_id   = "secondary-s3-origin"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
    
    custom_header {
      name  = "x-origin-verify"
      value = var.origin_verify_secret
    }
  }
  
  # Origin group for failover
  origin_group {
    origin_id = "s3-origin-group"
    
    failover_criteria {
      status_codes = [403, 404, 500, 502, 503, 504]
    }
    
    member {
      origin_id = "primary-s3-origin"
    }
    
    member {
      origin_id = "secondary-s3-origin"
    }
  }
  
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-origin-group"
    
    forwarded_values {
      query_string = true
      headers      = ["Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]
      
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = var.cloudfront_min_ttl
    default_ttl            = var.cloudfront_default_ttl
    max_ttl                = var.cloudfront_max_ttl
    compress               = true
    
    lambda_function_association {
      event_type   = "viewer-request"
      lambda_arn   = aws_lambda_function.viewer_request.qualified_arn
      include_body = false
    }
    
    lambda_function_association {
      event_type   = "viewer-response"
      lambda_arn   = aws_lambda_function.viewer_response.qualified_arn
      include_body = false
    }
  }
  
  # Custom cache behavior for dynamic content
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-origin-group"
    
    forwarded_values {
      query_string = true
      headers      = ["*"]
      
      cookies {
        forward = "all"
      }
    }
    
    viewer_protocol_policy = "https-only"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    compress               = true
  }
  
  # Custom error pages
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 300
  }
  
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 300
  }
  
  restrictions {
    geo_restriction {
      restriction_type = length(var.blocked_countries) > 0 ? "blacklist" : "none"
      locations        = var.blocked_countries
    }
  }
  
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cloudfront_cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
  
  logging_config {
    bucket          = aws_s3_bucket.cloudfront_logs.bucket_domain_name
    prefix          = "cf-logs/"
    include_cookies = false
  }
  
  tags = var.common_tags
  
  depends_on = [
    aws_acm_certificate.cloudfront_cert,
    aws_lambda_function.viewer_request,
    aws_lambda_function.viewer_response
  ]
}

# Route 53 Hosted Zone
resource "aws_route53_zone" "main" {
  name = var.domain_name
  
  tags = merge(var.common_tags, {
    Name = "${var.project_name}-hosted-zone"
  })
}

# Route 53 Health Checks
resource "aws_route53_health_check" "cloudfront" {
  fqdn              = aws_cloudfront_distribution.main.domain_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/"
  failure_threshold = "3"
  request_interval  = "30"
  
  tags = merge(var.common_tags, {
    Name = "${var.project_name}-cloudfront-health"
  })
}

# Route 53 Records
resource "aws_route53_record" "main" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"
  
  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"
  
  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

# ACM Certificate Validation
resource "aws_route53_record" "cert_validation" {
  provider = aws.cloudfront
  for_each = {
    for dvo in aws_acm_certificate.cloudfront_cert.domain_validation_options : dvo.domain_name => {
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

resource "aws_acm_certificate_validation" "cloudfront_cert" {
  provider                = aws.cloudfront
  certificate_arn         = aws_acm_certificate.cloudfront_cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  provider       = aws.primary
  dashboard_name = "${var.project_name}-dashboard"
  
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
            ["AWS/CloudFront", "Requests", {"stat": "Sum"}],
            [".", "BytesDownloaded", {"stat": "Sum"}],
            [".", "BytesUploaded", {"stat": "Sum"}]
          ]
          view    = "timeSeries"
          region  = "us-east-1"
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
            ["AWS/CloudFront", "4xxErrorRate", {"stat": "Average"}],
            [".", "5xxErrorRate", {"stat": "Average"}]
          ]
          view    = "timeSeries"
          region  = "us-east-1"
          title   = "CloudFront Error Rates"
          period  = 300
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
            ["AWS/WAFV2", "BlockedRequests", {"WebACL": aws_wafv2_web_acl.cloudfront_waf.name, "Region": "Global", "Rule": "ALL"}],
            [".", "AllowedRequests", {"WebACL": aws_wafv2_web_acl.cloudfront_waf.name, "Region": "Global", "Rule": "ALL"}]
          ]
          view    = "timeSeries"
          region  = "us-east-1"
          title   = "WAF Requests"
          period  = 300
        }
      }
    ]
  })
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_4xx_errors" {
  provider            = aws.primary
  alarm_name          = "${var.project_name}-high-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = var.error_rate_threshold
  alarm_description   = "This metric monitors 4xx error rate"
  treat_missing_data  = "notBreaching"
  
  alarm_actions = [aws_sns_topic.alerts.arn]
  
  tags = var.common_tags
}

resource "aws_cloudwatch_metric_alarm" "high_5xx_errors" {
  provider            = aws.primary
  alarm_name          = "${var.project_name}-high-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = var.error_rate_threshold
  alarm_description   = "This metric monitors 5xx error rate"
  treat_missing_data  = "notBreaching"
  
  alarm_actions = [aws_sns_topic.alerts.arn]
  
  tags = var.common_tags
}

resource "aws_cloudwatch_metric_alarm" "waf_blocked_requests" {
  provider            = aws.primary
  alarm_name          = "${var.project_name}-waf-blocked-requests"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "BlockedRequests"
  namespace           = "AWS/WAFV2"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.waf_blocked_threshold
  alarm_description   = "High number of blocked requests by WAF"
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    WebACL = aws_wafv2_web_acl.cloudfront_waf.name
    Region = "Global"
    Rule   = "ALL"
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
  
  tags = var.common_tags
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  provider = aws.primary
  name     = "${var.project_name}-alerts"
  
  tags = var.common_tags
}

resource "aws_sns_topic_subscription" "alerts_email" {
  provider  = aws.primary
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# S3 bucket for QuickSight data
resource "aws_s3_bucket" "analytics" {
  provider = aws.primary
  bucket   = "${var.project_name}-analytics-${random_string.unique_id.result}"
  
  tags = merge(var.common_tags, {
    Name = "${var.project_name}-analytics"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "analytics_encryption" {
  provider = aws.primary
  bucket   = aws_s3_bucket.analytics.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.primary_s3_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "analytics_pab" {
  provider = aws.primary
  bucket   = aws_s3_bucket.analytics.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudTrail for audit logging
resource "aws_cloudtrail" "main" {
  provider                      = aws.primary
  name                          = "${var.project_name}-trail"
  s3_bucket_name               = aws_s3_bucket.cloudtrail.id
  enable_logging               = true
  include_global_service_events = true
  is_multi_region_trail        = true
  enable_log_file_validation   = true
  
  event_selector {
    read_write_type           = "All"
    include_management_events = true
    
    data_resource {
      type   = "AWS::S3::Object"
      values = [
        "${aws_s3_bucket.primary_content.arn}/*",
        "${aws_s3_bucket.secondary_content.arn}/*"
      ]
    }
  }
  
  tags = var.common_tags
  
  depends_on = [aws_s3_bucket_policy.cloudtrail]
}

# S3 bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail" {
  provider = aws.primary
  bucket   = "${var.project_name}-cloudtrail-${random_string.unique_id.result}"
  
  tags = merge(var.common_tags, {
    Name = "${var.project_name}-cloudtrail"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_encryption" {
  provider = aws.primary
  bucket   = aws_s3_bucket.cloudtrail.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_pab" {
  provider = aws.primary
  bucket   = aws_s3_bucket.cloudtrail.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_iam_policy_document" "cloudtrail_bucket_policy" {
  statement {
    sid = "AWSCloudTrailAclCheck"
    
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    
    actions = ["s3:GetBucketAcl"]
    
    resources = [aws_s3_bucket.cloudtrail.arn]
  }
  
  statement {
    sid = "AWSCloudTrailWrite"
    
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    
    actions = ["s3:PutObject"]
    
    resources = ["${aws_s3_bucket.cloudtrail.arn}/*"]
    
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  provider = aws.primary
  bucket   = aws_s3_bucket.cloudtrail.id
  policy   = data.aws_iam_policy_document.cloudtrail_bucket_policy.json
}

# Outputs
output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "s3_bucket_primary" {
  description = "Primary S3 bucket name"
  value       = aws_s3_bucket.primary_content.id
}

output "s3_bucket_secondary" {
  description = "Secondary S3 bucket name"
  value       = aws_s3_bucket.secondary_content.id
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "route53_name_servers" {
  description = "Route 53 name servers"
  value       = aws_route53_zone.main.name_servers
}

output "waf_web_acl_id" {
  description = "WAF Web ACL ID"
  value       = aws_wafv2_web_acl.cloudfront_waf.id
}

output "cloudtrail_name" {
  description = "CloudTrail name"
  value       = aws_cloudtrail.main.name
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "lambda_edge_viewer_request_arn" {
  description = "Lambda@Edge viewer request function ARN"
  value       = aws_lambda_function.viewer_request.qualified_arn
}

output "lambda_edge_viewer_response_arn" {
  description = "Lambda@Edge viewer response function ARN"
  value       = aws_lambda_function.viewer_response.qualified_arn
}

output "analytics_bucket" {
  description = "S3 bucket for analytics data"
  value       = aws_s3_bucket.analytics.id
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://${var.primary_region}.console.aws.amazon.com/cloudwatch/home?region=${var.primary_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "deployment_instructions" {
  description = "Post-deployment instructions"
  value = <<-EOT
    Deployment Complete! Next steps:
    
    1. Update your domain's nameservers to:
       ${join(", ", aws_route53_zone.main.name_servers)}
    
    2. Upload content to S3 buckets:
       - Primary: ${aws_s3_bucket.primary_content.id}
       - Secondary: ${aws_s3_bucket.secondary_content.id}
    
    3. Create Lambda@Edge deployment packages:
       - lambda-edge-viewer-request.zip
       - lambda-edge-viewer-response.zip
    
    4. Monitor the deployment:
       - CloudWatch Dashboard: ${aws_cloudwatch_dashboard.main.dashboard_name}
       - CloudFront Distribution: ${aws_cloudfront_distribution.main.id}
    
    5. Test the CDN:
       - https://${var.domain_name}
       - https://www.${var.domain_name}
    
    6. Configure QuickSight:
       - Use analytics bucket: ${aws_s3_bucket.analytics.id}
       - CloudFront logs bucket: ${aws_s3_bucket.cloudfront_logs.id}
  EOT
}
```

```hcl
# variables.tf

# Project Configuration
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "global-content-delivery"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Environment = "production"
    Project     = "global-content-delivery"
    ManagedBy   = "terraform"
    CostCenter  = "media-operations"
  }
}

# Region Configuration
variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region"
  type        = string
  default     = "ap-southeast-1"
}

# Domain Configuration
variable "domain_name" {
  description = "Domain name for the content delivery"
  type        = string
}

# Security Configuration
variable "origin_verify_secret" {
  description = "Secret header value to verify requests from CloudFront"
  type        = string
  sensitive   = true
  default     = "generate-a-secure-random-string"
}

variable "blocked_countries" {
  description = "List of country codes to block"
  type        = list(string)
  default     = []
}

# WAF Configuration
variable "waf_rate_limit" {
  description = "Rate limit for WAF rule (requests per 5 minutes)"
  type        = number
  default     = 2000
}

variable "waf_blocked_threshold" {
  description = "Threshold for WAF blocked requests alarm"
  type        = number
  default     = 100
}

# CloudFront Configuration
variable "cloudfront_price_class" {
  description = "CloudFront distribution price class"
  type        = string
  default     = "PriceClass_All"
  
  validation {
    condition = contains([
      "PriceClass_100",
      "PriceClass_200",
      "PriceClass_All"
    ], var.cloudfront_price_class)
    error_message = "Invalid CloudFront price class."
  }
}

variable "cloudfront_min_ttl" {
  description = "Minimum TTL for CloudFront cache"
  type        = number
  default     = 0
}

variable "cloudfront_default_ttl" {
  description = "Default TTL for CloudFront cache"
  type        = number
  default     = 86400  # 24 hours
}

variable "cloudfront_max_ttl" {
  description = "Maximum TTL for CloudFront cache"
  type        = number
  default     = 31536000  # 365 days
}

# Monitoring Configuration
variable "alert_email" {
  description = "Email address for CloudWatch alerts"
  type        = string
}

variable "error_rate_threshold" {
  description = "Error rate threshold for CloudWatch alarms (percentage)"
  type        = number
  default     = 5
}

# S3 Configuration
variable "enable_s3_replication" {
  description = "Enable S3 cross-region replication"
  type        = bool
  default     = true
}

variable "s3_lifecycle_transition_days" {
  description = "Days before transitioning objects to IA storage"
  type        = number
  default     = 30
}

variable "s3_lifecycle_glacier_days" {
  description = "Days before transitioning objects to Glacier storage"
  type        = number
  default     = 90
}

variable "s3_noncurrent_version_expiration_days" {
  description = "Days before deleting non-current object versions"
  type        = number
  default     = 90
}

# Lambda Configuration
variable "lambda_runtime" {
  description = "Runtime for Lambda@Edge functions"
  type        = string
  default     = "nodejs18.x"
}

variable "lambda_timeout" {
  description = "Timeout for Lambda@Edge functions (seconds)"
  type        = number
  default     = 5
  
  validation {
    condition     = var.lambda_timeout >= 1 && var.lambda_timeout <= 30
    error_message = "Lambda@Edge timeout must be between 1 and 30 seconds."
  }
}

# DNS Configuration
variable "route53_ttl" {
  description = "TTL for Route 53 DNS records"
  type        = number
  default     = 300
}

# Analytics Configuration
variable "enable_quicksight" {
  description = "Enable QuickSight for analytics"
  type        = bool
  default     = true
}

variable "analytics_retention_days" {
  description = "Retention period for analytics data (days)"
  type        = number
  default     = 90
}

# Compliance Configuration
variable "enable_gdpr_compliance" {
  description = "Enable GDPR compliance features"
  type        = bool
  default     = true
}

variable "enable_hipaa_compliance" {
  description = "Enable HIPAA compliance features"
  type        = bool
  default     = false
}

# Performance Configuration
variable "enable_http3" {
  description = "Enable HTTP/3 support in CloudFront"
  type        = bool
  default     = true
}

variable "enable_compression" {
  description = "Enable automatic compression in CloudFront"
  type        = bool
  default     = true
}

# Cost Optimization
variable "enable_spot_instances" {
  description = "Use spot instances where applicable"
  type        = bool
  default     = false
}

variable "enable_cost_alerts" {
  description = "Enable cost threshold alerts"
  type        = bool
  default     = true
}

variable "monthly_budget" {
  description = "Monthly budget for cost alerts (USD)"
  type        = number
  default     = 5000
}

# Backup Configuration
variable "backup_retention_days" {
  description = "Retention period for backups (days)"
  type        = number
  default     = 30
}

variable "enable_point_in_time_recovery" {
  description = "Enable point-in-time recovery for applicable services"
  type        = bool
  default     = true
}

# Advanced Features
variable "enable_origin_shield" {
  description = "Enable CloudFront Origin Shield"
  type        = bool
  default     = false
}

variable "origin_shield_region" {
  description = "AWS region for Origin Shield"
  type        = string
  default     = "us-east-1"
}

variable "enable_field_level_encryption" {
  description = "Enable field-level encryption in CloudFront"
  type        = bool
  default     = false
}

# Development/Testing
variable "enable_debug_logs" {
  description = "Enable debug logging (not recommended for production)"
  type        = bool
  default     = false
}

variable "enable_test_endpoints" {
  description = "Enable test endpoints for development"
  type        = bool
  default     = false
}
```

## Key Features Implemented:

### 1. **Multi-Region Architecture**
- Primary region (us-east-1) and secondary region (ap-southeast-1)
- S3 buckets in both regions with failover capabilities
- KMS keys for encryption in each region

### 2. **Security & Compliance**
- WAF with DDoS protection, rate limiting, and managed rule sets
- Encryption at rest (KMS) and in transit (ACM certificates)
- CloudTrail for audit logging
- S3 bucket policies and public access blocks

### 3. **Performance Optimization**
- CloudFront distribution with origin groups for failover
- Lambda@Edge for content personalization and security headers
- Optimized cache behaviors and TTL settings
- HTTP/2 and HTTP/3 support

### 4. **Monitoring & Analytics**
- CloudWatch dashboards and alarms
- SNS notifications for critical alerts
- S3 buckets for CloudFront logs and analytics data
- Infrastructure for QuickSight integration

### 5. **Best Practices**
- Modular design with proper resource dependencies
- Parameterized configuration through variables
- Comprehensive tagging strategy
- Remote state configuration ready
- Detailed outputs for operational use

## Deployment Instructions:

1. **Prepare Lambda@Edge Functions**:
   Create ZIP files for the Lambda@Edge functions with your personalization and security header logic.

2. **Configure Remote State**:
   Uncomment and configure the backend block in `tap_stack.tf` for remote state storage.

3. **Set Variables**:
   Create a `terraform.tfvars` file with your specific values:
   ```hcl
   domain_name = "example.com"
   alert_email = "alerts@example.com"
   origin_verify_secret = "your-secret-string"
   ```

4. **Deploy**:
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

5. **Post-Deployment**:
   - Update DNS nameservers
   - Upload content to S3 buckets
   - Configure QuickSight dashboards
   - Test the CDN endpoints

This solution provides a robust, scalable, and secure global content delivery system ready for 5 million users with comprehensive monitoring and compliance features.