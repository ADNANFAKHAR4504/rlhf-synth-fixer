# Required variable for provider.tf consumption
variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

# KMS Key for CloudWatch Log Group encryption
# KMS Key for CloudWatch Log Group encryption with proper policy
resource "aws_kms_key" "cloudwatch_logs" {
  description             = "KMS key for CloudWatch log encryption"
  deletion_window_in_days = 7
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
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnEquals = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.name_prefix}-function"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "${var.name_prefix}-cloudwatch-kms-key"
    Environment = var.environment
    Project     = "secureApp"
  }
}

# Add data source for current AWS account
data "aws_caller_identity" "current" {}

resource "aws_kms_alias" "cloudwatch_logs" {
  name          = "alias/secureApp-cloudwatch-logs"
  target_key_id = aws_kms_key.cloudwatch_logs.key_id
}

# S3 Bucket with AES-256 encryption and blocked public access
resource "aws_s3_bucket" "secure_bucket" {
  bucket = "${lower(var.name_prefix)}-${random_string.bucket_suffix.result}"

  tags = {
    Name        = "${var.name_prefix}-secure-bucket"
    Environment = var.environment
    Project     = "secureApp"
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket_server_side_encryption_configuration" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# IAM Role for Lambda with least privilege and cross-account access
data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }

  # Cross-account access
  dynamic "statement" {
    for_each = var.trusted_account_ids
    content {
      effect = "Allow"

      principals {
        type        = "AWS"
        identifiers = ["arn:aws:iam::${each.value}:root"]
      }

      actions = ["sts:AssumeRole"]

      condition {
        test     = "StringEquals"
        variable = "sts:ExternalId"
        values   = [var.external_id]
      }
    }
  }
}

resource "aws_iam_role" "lambda_role" {
  name               = "${var.name_prefix}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json

  tags = {
    Name        = "${var.name_prefix}-lambda-role"
    Environment = var.environment
    Project     = "secureApp"
  }
}

# Least privilege policy for Lambda
data "aws_iam_policy_document" "lambda_policy" {
  statement {
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]

    resources = ["arn:aws:logs:${var.aws_region}:*:*"]
  }

  statement {
    effect = "Allow"

    actions = [
      "s3:GetObject",
      "s3:PutObject"
    ]

    resources = ["${aws_s3_bucket.secure_bucket.arn}/*"]
  }

  statement {
    effect = "Allow"

    actions = [
      "s3:ListBucket"
    ]

    resources = [aws_s3_bucket.secure_bucket.arn]
  }
}

resource "aws_iam_role_policy" "lambda_policy" {
  name   = "secureApp-lambda-policy"
  role   = aws_iam_role.lambda_role.id
  policy = data.aws_iam_policy_document.lambda_policy.json
}

# CloudWatch Log Group with KMS encryption
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/secureApp-function"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  depends_on = [
    aws_kms_key.cloudwatch_logs
  ]

  tags = {
    Name        = "${var.name_prefix}-lambda-logs"
    Environment = var.environment
    Project     = "secureApp"
  }
}

# Lambda Function
resource "aws_lambda_function" "secure_function" {
  filename         = "lambda/function.zip"
  function_name    = "secureApp-function"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "nodejs14.x"
  timeout          = var.lambda_timeout

  environment {
    variables = var.lambda_environment_variables
  }

  depends_on = [
    aws_iam_role_policy.lambda_policy,
    aws_cloudwatch_log_group.lambda_logs,
    aws_kms_key.cloudwatch_logs
  ]

  tags = {
    Name        = "${var.name_prefix}-function"
    Environment = var.environment
    Project     = "secureApp"
  }
}
# Lambda deployment package
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "lambda/index.js"
  output_path = "lambda/function.zip"
}

# CloudWatch Alarm for Lambda errors
resource "aws_cloudwatch_metric_alarm" "lambda_error_alarm" {
  alarm_name          = "secureApp-lambda-error-alarm"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "60"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors lambda errors"
  alarm_actions       = var.alarm_actions

  dimensions = {
    FunctionName = aws_lambda_function.secure_function.function_name
  }

  tags = {
    Name        = "${var.name_prefix}-lambda-error-alarm"
    Environment = var.environment
    Project     = "secureApp"
  }
}

resource "aws_wafv2_web_acl" "main" {

  # provider = aws.us_east_1
  name  = "${var.name_prefix}-waf"
  scope = "CLOUDFRONT"
  default_action {

    allow {}

  }


  rule {
    name     = "secureApp-rate-limit"
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
      metric_name                = "${var.name_prefix}RateLimit"
      sampled_requests_enabled   = true
    }

  }

  rule {
    name     = "secureApp-ip-reputation"
    priority = 2

    action {

      block {}

    }

    statement {

      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }

    }


    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}IPReputation"
      sampled_requests_enabled   = true
    }

  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.name_prefix}WAF"
    sampled_requests_enabled   = true
  }


  tags = {
    Name        = "${var.name_prefix}-waf"
    Environment = var.environment
    Project     = "secureApp"
  }

}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  origin {
    domain_name = aws_s3_bucket.secure_bucket.bucket_regional_domain_name
    origin_id   = "${var.name_prefix}-S3-${aws_s3_bucket.secure_bucket.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  web_acl_id          = aws_wafv2_web_acl.main.arn

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "${var.name_prefix}-S3-${aws_s3_bucket.secure_bucket.id}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

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

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = ["US", "CA", "GB", "DE"]
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  tags = {
    Name        = "${var.name_prefix}-distribution"
    Environment = var.environment
    Project     = "secureApp"
  }
}

resource "aws_cloudfront_origin_access_identity" "main" {
  comment = "${var.name_prefix} origin access identity"
}

# S3 bucket policy for CloudFront
data "aws_iam_policy_document" "s3_policy" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.secure_bucket.arn}/*"]

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.main.iam_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id
  policy = data.aws_iam_policy_document.s3_policy.json
}
