# tap_stack.tf

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
    allowed_origins = ["*"]
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
    allowed_origins = ["*"]
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

# IAM Role for S3 Replication
data "aws_iam_policy_document" "s3_replication_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["s3.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "s3_replication" {
  provider           = aws.primary
  name               = "${var.project_name}-s3-replication-role"
  assume_role_policy = data.aws_iam_policy_document.s3_replication_assume_role.json

  tags = var.common_tags
}

data "aws_iam_policy_document" "s3_replication_policy" {
  statement {
    sid = "S3ReplicationPermissions"

    actions = [
      "s3:GetReplicationConfiguration",
      "s3:ListBucket"
    ]

    resources = [aws_s3_bucket.primary_content.arn]
  }

  statement {
    sid = "S3ReplicationSourcePermissions"

    actions = [
      "s3:GetObjectVersionForReplication",
      "s3:GetObjectVersionAcl",
      "s3:GetObjectVersionTagging"
    ]

    resources = ["${aws_s3_bucket.primary_content.arn}/*"]
  }

  statement {
    sid = "S3ReplicationDestinationPermissions"

    actions = [
      "s3:ReplicateObject",
      "s3:ReplicateDelete",
      "s3:ReplicateTags"
    ]

    resources = ["${aws_s3_bucket.secondary_content.arn}/*"]
  }

  statement {
    sid = "S3ReplicationKMSPermissions"

    actions = [
      "kms:Decrypt",
      "kms:DescribeKey"
    ]

    resources = [aws_kms_key.primary_s3_key.arn]
  }

  statement {
    sid = "S3ReplicationKMSEncryptPermissions"

    actions = [
      "kms:Encrypt",
      "kms:GenerateDataKey"
    ]

    resources = [aws_kms_key.secondary_s3_key.arn]
  }
}

resource "aws_iam_policy" "s3_replication" {
  provider = aws.primary
  name     = "${var.project_name}-s3-replication-policy"
  policy   = data.aws_iam_policy_document.s3_replication_policy.json

  tags = var.common_tags
}

resource "aws_iam_role_policy_attachment" "s3_replication" {
  provider   = aws.primary
  role       = aws_iam_role.s3_replication.name
  policy_arn = aws_iam_policy.s3_replication.arn
}

# S3 Replication Configuration
resource "aws_s3_bucket_replication_configuration" "primary_to_secondary" {
  count    = var.enable_s3_replication ? 1 : 0
  provider = aws.primary
  bucket   = aws_s3_bucket.primary_content.id
  role     = aws_iam_role.s3_replication.arn

  rule {
    id     = "replicate-all-content"
    status = "Enabled"

    filter {}

    destination {
      bucket        = aws_s3_bucket.secondary_content.arn
      storage_class = "STANDARD"

      encryption_configuration {
        replica_kms_key_id = aws_kms_key.secondary_s3_key.arn
      }
    }

    source_selection_criteria {
      sse_kms_encrypted_objects {
        status = "Enabled"
      }
    }

    delete_marker_replication {
      status = "Enabled"
    }
  }

  depends_on = [
    aws_s3_bucket_versioning.primary_content_versioning,
    aws_s3_bucket_versioning.secondary_content_versioning,
    aws_iam_role_policy_attachment.s3_replication
  ]
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

# Enable ACL for CloudFront logging
resource "aws_s3_bucket_ownership_controls" "cloudfront_logs_ownership" {
  provider = aws.primary
  bucket   = aws_s3_bucket.cloudfront_logs.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "cloudfront_logs_acl" {
  provider = aws.primary
  bucket   = aws_s3_bucket.cloudfront_logs.id
  acl      = "log-delivery-write"

  depends_on = [aws_s3_bucket_ownership_controls.cloudfront_logs_ownership]
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


# Archive Lambda@Edge functions
data "archive_file" "lambda_edge_viewer_request" {
  type        = "zip"
  source_dir  = "${path.module}/lambda-edge-viewer-request"
  output_path = "${path.module}/lambda-edge-viewer-request.zip"
}

data "archive_file" "lambda_edge_viewer_response" {
  type        = "zip"
  source_dir  = "${path.module}/lambda-edge-viewer-response"
  output_path = "${path.module}/lambda-edge-viewer-response.zip"
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
  provider      = aws.cloudfront
  function_name = "${var.project_name}-viewer-request"
  role          = aws_iam_role.lambda_edge_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 5
  publish       = true

  filename         = data.archive_file.lambda_edge_viewer_request.output_path
  source_code_hash = data.archive_file.lambda_edge_viewer_request.output_base64sha256

  tags = var.common_tags

  depends_on = [aws_iam_role_policy_attachment.lambda_edge_basic]
}

# Lambda@Edge function for viewer response (security headers)
resource "aws_lambda_function" "viewer_response" {
  provider      = aws.cloudfront
  function_name = "${var.project_name}-viewer-response"
  role          = aws_iam_role.lambda_edge_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 5
  publish       = true

  filename         = data.archive_file.lambda_edge_viewer_response.output_path
  source_code_hash = data.archive_file.lambda_edge_viewer_response.output_base64sha256

  tags = var.common_tags

  depends_on = [aws_iam_role_policy_attachment.lambda_edge_basic]
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
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  logging_config {
    bucket          = aws_s3_bucket.cloudfront_logs.bucket_domain_name
    prefix          = "cf-logs/"
    include_cookies = false
  }

  tags = var.common_tags

  depends_on = [
    aws_wafv2_web_acl.cloudfront_waf,
    aws_lambda_function.viewer_request,
    aws_lambda_function.viewer_response,
    aws_s3_bucket.cloudfront_logs
  ]
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
            ["AWS/CloudFront", "Requests", { "stat" : "Sum" }],
            [".", "BytesDownloaded", { "stat" : "Sum" }],
            [".", "BytesUploaded", { "stat" : "Sum" }]
          ]
          view   = "timeSeries"
          region = "us-east-1"
          title  = "CloudFront Traffic"
          period = 300
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
            ["AWS/CloudFront", "4xxErrorRate", { "stat" : "Average" }],
            [".", "5xxErrorRate", { "stat" : "Average" }]
          ]
          view   = "timeSeries"
          region = "us-east-1"
          title  = "CloudFront Error Rates"
          period = 300
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
            ["AWS/WAFV2", "BlockedRequests"],
            [".", "AllowedRequests"]
          ]
          view   = "timeSeries"
          region = "us-east-1"
          title  = "WAF Requests"
          period = 300
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

# QuickSight IAM Role
data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "quicksight_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["quicksight.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "quicksight" {
  provider           = aws.primary
  name               = "${var.project_name}-quicksight-role"
  assume_role_policy = data.aws_iam_policy_document.quicksight_assume_role.json

  tags = var.common_tags
}

data "aws_iam_policy_document" "quicksight_s3_policy" {
  statement {
    sid = "QuickSightS3Access"

    actions = [
      "s3:GetObject",
      "s3:GetObjectVersion",
      "s3:ListBucket",
      "s3:ListBucketVersions"
    ]

    resources = [
      aws_s3_bucket.analytics.arn,
      "${aws_s3_bucket.analytics.arn}/*",
      aws_s3_bucket.cloudfront_logs.arn,
      "${aws_s3_bucket.cloudfront_logs.arn}/*"
    ]
  }

  statement {
    sid = "QuickSightKMSAccess"

    actions = [
      "kms:Decrypt",
      "kms:DescribeKey"
    ]

    resources = [aws_kms_key.primary_s3_key.arn]
  }
}

resource "aws_iam_policy" "quicksight_s3" {
  provider = aws.primary
  name     = "${var.project_name}-quicksight-s3-policy"
  policy   = data.aws_iam_policy_document.quicksight_s3_policy.json

  tags = var.common_tags
}

resource "aws_iam_role_policy_attachment" "quicksight_s3" {
  provider   = aws.primary
  role       = aws_iam_role.quicksight.name
  policy_arn = aws_iam_policy.quicksight_s3.arn
}

# QuickSight Data Source for CloudFront Logs
resource "aws_quicksight_data_source" "cloudfront_logs" {
  count          = var.enable_quicksight ? 1 : 0
  provider       = aws.primary
  data_source_id = "${var.project_name}-cloudfront-logs"
  name           = "${var.project_name}-cloudfront-logs"

  parameters {
    s3 {
      manifest_file_location {
        bucket = aws_s3_bucket.analytics.id
        key    = "quicksight-manifest.json"
      }
    }
  }

  type = "S3"

  tags = var.common_tags

  depends_on = [
    aws_s3_bucket.analytics,
    aws_iam_role_policy_attachment.quicksight_s3
  ]
}

# QuickSight Data Set
resource "aws_quicksight_data_set" "content_analytics" {
  count       = var.enable_quicksight ? 1 : 0
  provider    = aws.primary
  data_set_id = "${var.project_name}-content-analytics"
  name        = "${var.project_name}-content-analytics"
  import_mode = "SPICE"

  physical_table_map {
    physical_table_map_id = "cloudfront-logs"

    s3_source {
      data_source_arn = var.enable_quicksight ? aws_quicksight_data_source.cloudfront_logs[0].arn : ""
      upload_settings {
        format = "JSON"
      }
      input_columns {
        name = "timestamp"
        type = "DATETIME"
      }
      input_columns {
        name = "edge_location"
        type = "STRING"
      }
      input_columns {
        name = "bytes"
        type = "INTEGER"
      }
      input_columns {
        name = "request_ip"
        type = "STRING"
      }
      input_columns {
        name = "method"
        type = "STRING"
      }
      input_columns {
        name = "uri"
        type = "STRING"
      }
      input_columns {
        name = "status"
        type = "INTEGER"
      }
    }
  }

  tags = var.common_tags

  depends_on = [aws_quicksight_data_source.cloudfront_logs]
}

# CloudTrail for audit logging (optional due to account limits)
resource "aws_cloudtrail" "main" {
  count                         = var.enable_cloudtrail ? 1 : 0
  provider                      = aws.primary
  name                          = "${var.project_name}-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail[0].id
  enable_logging                = true
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type = "AWS::S3::Object"
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
  count    = var.enable_cloudtrail ? 1 : 0
  provider = aws.primary
  bucket   = "${var.project_name}-cloudtrail-${random_string.unique_id.result}"

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-cloudtrail"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_encryption" {
  count    = var.enable_cloudtrail ? 1 : 0
  provider = aws.primary
  bucket   = aws_s3_bucket.cloudtrail[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_pab" {
  count    = var.enable_cloudtrail ? 1 : 0
  provider = aws.primary
  bucket   = aws_s3_bucket.cloudtrail[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_iam_policy_document" "cloudtrail_bucket_policy" {
  count = var.enable_cloudtrail ? 1 : 0

  statement {
    sid = "AWSCloudTrailAclCheck"

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }

    actions = ["s3:GetBucketAcl"]

    resources = [aws_s3_bucket.cloudtrail[0].arn]
  }

  statement {
    sid = "AWSCloudTrailWrite"

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }

    actions = ["s3:PutObject"]

    resources = ["${aws_s3_bucket.cloudtrail[0].arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  count    = var.enable_cloudtrail ? 1 : 0
  provider = aws.primary
  bucket   = aws_s3_bucket.cloudtrail[0].id
  policy   = data.aws_iam_policy_document.cloudtrail_bucket_policy[0].json
}

# Outputs
output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name (use this URL to access content)"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "cloudfront_url" {
  description = "CloudFront HTTPS URL"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "s3_bucket_primary" {
  description = "Primary S3 bucket name"
  value       = aws_s3_bucket.primary_content.id
}

output "s3_bucket_primary_arn" {
  description = "Primary S3 bucket ARN"
  value       = aws_s3_bucket.primary_content.arn
}

output "s3_bucket_secondary" {
  description = "Secondary S3 bucket name"
  value       = aws_s3_bucket.secondary_content.id
}

output "s3_bucket_secondary_arn" {
  description = "Secondary S3 bucket ARN"
  value       = aws_s3_bucket.secondary_content.arn
}

output "waf_web_acl_id" {
  description = "WAF Web ACL ID"
  value       = aws_wafv2_web_acl.cloudfront_waf.id
}

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = aws_wafv2_web_acl.cloudfront_waf.arn
}

output "cloudtrail_name" {
  description = "CloudTrail name (if enabled)"
  value       = var.enable_cloudtrail ? aws_cloudtrail.main[0].name : ""
}

output "cloudtrail_arn" {
  description = "CloudTrail ARN (if enabled)"
  value       = var.enable_cloudtrail ? aws_cloudtrail.main[0].arn : ""
}

output "cloudtrail_enabled" {
  description = "Whether CloudTrail is enabled"
  value       = var.enable_cloudtrail
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

output "cloudfront_logs_bucket" {
  description = "S3 bucket for CloudFront logs"
  value       = aws_s3_bucket.cloudfront_logs.id
}

output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://${var.primary_region}.console.aws.amazon.com/cloudwatch/home?region=${var.primary_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "quicksight_data_source_arn" {
  description = "QuickSight data source ARN"
  value       = var.enable_quicksight ? aws_quicksight_data_source.cloudfront_logs[0].arn : ""
}

output "quicksight_dataset_arn" {
  description = "QuickSight dataset ARN"
  value       = var.enable_quicksight ? aws_quicksight_data_set.content_analytics[0].arn : ""
}

output "primary_region" {
  description = "Primary AWS region"
  value       = var.primary_region
}

output "secondary_region" {
  description = "Secondary AWS region"
  value       = var.secondary_region
}

output "s3_replication_enabled" {
  description = "Whether S3 cross-region replication is enabled"
  value       = var.enable_s3_replication
}

output "deployment_instructions" {
  description = "Post-deployment instructions"
  value       = <<-EOT
    Deployment Complete! 
    
    1. CloudFront Distribution URL:
       ${aws_cloudfront_distribution.main.domain_name}
       Access content at: https://${aws_cloudfront_distribution.main.domain_name}
    
    2. Upload content to S3 buckets:
       - Primary (${var.primary_region}): ${aws_s3_bucket.primary_content.id}
       - Secondary (${var.secondary_region}): ${aws_s3_bucket.secondary_content.id}
       ${var.enable_s3_replication ? "- S3 Cross-Region Replication is ENABLED" : ""}
    
    3. Security & WAF:
       - WAF Web ACL: ${aws_wafv2_web_acl.cloudfront_waf.id}
       - Rate Limit: ${var.waf_rate_limit} requests per 5 minutes
    
    4. Monitoring:
       - CloudWatch Dashboard: ${aws_cloudwatch_dashboard.main.dashboard_name}
       - SNS Topic for Alerts: ${aws_sns_topic.alerts.name}
       ${var.enable_cloudtrail ? "- CloudTrail: ${aws_cloudtrail.main[0].name}" : "- CloudTrail: DISABLED (enable with enable_cloudtrail=true)"}
    
    5. Analytics:
       - Analytics Bucket: ${aws_s3_bucket.analytics.id}
       - CloudFront Logs: ${aws_s3_bucket.cloudfront_logs.id}
       ${var.enable_quicksight ? "- QuickSight is ENABLED" : ""}
    
    6. Lambda@Edge Functions:
       - Viewer Request: ${aws_lambda_function.viewer_request.function_name}
       - Viewer Response: ${aws_lambda_function.viewer_response.function_name}
    
    7. Test the CDN:
       Upload a test file to: aws s3 cp test.html s3://${aws_s3_bucket.primary_content.id}/
       Access at: https://${aws_cloudfront_distribution.main.domain_name}/test.html
  EOT
}