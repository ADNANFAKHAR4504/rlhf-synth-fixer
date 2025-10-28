# security.tf

# WAF Web ACL for CloudFront
resource "aws_wafv2_web_acl" "api_protection" {
  provider = aws.global
  name     = "${var.project_name}-${var.environment_suffix}-waf-acl-v2"
  scope    = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # Rate limiting rule
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
      metric_name                = "${var.project_name}-${var.environment_suffix}-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  # SQL Injection protection
  rule {
    name     = "SQLInjectionRule"
    priority = 2

    action {
      block {}
    }

    statement {
      or_statement {
        statement {
          sqli_match_statement {
            field_to_match {
              body {}
            }
            text_transformation {
              priority = 1
              type     = "URL_DECODE"
            }
            text_transformation {
              priority = 2
              type     = "HTML_ENTITY_DECODE"
            }
          }
        }
        statement {
          sqli_match_statement {
            field_to_match {
              query_string {}
            }
            text_transformation {
              priority = 1
              type     = "URL_DECODE"
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-${var.environment_suffix}-sql-injection"
      sampled_requests_enabled   = true
    }
  }

  # XSS protection
  rule {
    name     = "XSSRule"
    priority = 3

    action {
      block {}
    }

    statement {
      or_statement {
        statement {
          xss_match_statement {
            field_to_match {
              body {}
            }
            text_transformation {
              priority = 1
              type     = "URL_DECODE"
            }
            text_transformation {
              priority = 2
              type     = "HTML_ENTITY_DECODE"
            }
          }
        }
        statement {
          xss_match_statement {
            field_to_match {
              query_string {}
            }
            text_transformation {
              priority = 1
              type     = "URL_DECODE"
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-${var.environment_suffix}-xss"
      sampled_requests_enabled   = true
    }
  }

  # IP Whitelist rule (if configured)
  dynamic "rule" {
    for_each = length(var.waf_ip_whitelist) > 0 ? [1] : []

    content {
      name     = "IPWhitelistRule"
      priority = 0

      action {
        allow {}
      }

      statement {
        ip_set_reference_statement {
          arn = aws_wafv2_ip_set.whitelist[0].arn
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${var.project_name}-${var.environment_suffix}-ip-whitelist"
        sampled_requests_enabled   = true
      }
    }
  }

  # Size constraint rule
  rule {
    name     = "SizeRestrictionRule"
    priority = 4

    action {
      block {}
    }

    statement {
      or_statement {
        statement {
          size_constraint_statement {
            field_to_match {
              body {}
            }
            comparison_operator = "GT"
            size                = 8192 # 8KB limit
            text_transformation {
              priority = 1
              type     = "NONE"
            }
          }
        }
        statement {
          size_constraint_statement {
            field_to_match {
              single_header {
                name = "content-length"
              }
            }
            comparison_operator = "GT"
            size                = 8192
            text_transformation {
              priority = 1
              type     = "NONE"
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-${var.environment_suffix}-size-restriction"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-${var.environment_suffix}-waf"
    sampled_requests_enabled   = true
  }

  tags = var.common_tags
}

# IP Set for whitelist (if configured)
resource "aws_wafv2_ip_set" "whitelist" {
  count    = length(var.waf_ip_whitelist) > 0 ? 1 : 0
  provider = aws.global

  name               = "${var.project_name}-${var.environment_suffix}-ip-whitelist-v2"
  scope              = "CLOUDFRONT"
  ip_address_version = "IPV4"
  addresses          = var.waf_ip_whitelist

  tags = var.common_tags
}

# VPC for Lambda functions (optional - only if VPC access needed)
resource "aws_vpc" "main" {
  count = var.enable_vpc ? 1 : 0

  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-vpc"
  })
}

# Private subnets for Lambda
resource "aws_subnet" "private" {
  count = var.enable_vpc ? 2 : 0

  vpc_id            = aws_vpc.main[0].id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Security Groups for Lambda functions (VPC mode if needed)
resource "aws_security_group" "lambda" {
  count = var.enable_vpc ? 1 : 0

  name        = "${var.project_name}-${var.environment_suffix}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main[0].id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment_suffix}-lambda-sg"
  })
}

# Data source for AZs
data "aws_availability_zones" "available" {
  provider = aws.primary
  state    = "available"
}

# IAM policy for encryption - Not needed with AWS-managed encryption
# Uncomment if migrating to customer-managed KMS keys
# resource "aws_iam_policy" "encryption" {
#   name        = "${var.project_name}-encryption-policy"
#   description = "Policy for encryption operations"
#
#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect = "Allow"
#         Action = [
#           "kms:Decrypt",
#           "kms:DescribeKey"
#         ]
#         Resource = [
#           aws_kms_key.dynamodb.arn,
#           aws_kms_key.dynamodb_secondary.arn
#         ]
#       }
#     ]
#   })
# }
#
# # Attach encryption policy to Lambda role
# resource "aws_iam_role_policy_attachment" "lambda_encryption" {
#   role       = aws_iam_role.lambda_execution.name
#   policy_arn = aws_iam_policy.encryption.arn
# }

# S3 bucket for WAF logs
# Bucket name must start with 'aws-waf-logs-' for WAF v2 logging
resource "aws_s3_bucket" "waf_logs" {
  provider = aws.global
  bucket   = "aws-waf-logs-${var.project_name}-${var.environment_suffix}-${data.aws_caller_identity.current.account_id}"

  # Allow bucket to be destroyed even if it contains objects
  force_destroy = true

  tags = var.common_tags
}

resource "aws_s3_bucket_versioning" "waf_logs" {
  provider = aws.global
  bucket   = aws_s3_bucket.waf_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "waf_logs" {
  provider = aws.global
  bucket   = aws_s3_bucket.waf_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "waf_logs" {
  provider = aws.global
  bucket   = aws_s3_bucket.waf_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "waf_logs" {
  provider = aws.global
  bucket   = aws_s3_bucket.waf_logs.id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    expiration {
      days = 90
    }
  }
}

# S3 bucket policy for WAF logging
resource "aws_s3_bucket_policy" "waf_logs" {
  provider = aws.global
  bucket   = aws_s3_bucket.waf_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSLogDeliveryWrite"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.waf_logs.arn}/*"
      },
      {
        Sid    = "AWSLogDeliveryAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.waf_logs.arn
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.waf_logs]
}

# WAF logging configuration
# Note: WAF v2 logging to S3 requires the bucket ARN without path suffix
resource "aws_wafv2_web_acl_logging_configuration" "api_protection" {
  provider                = aws.global
  resource_arn            = aws_wafv2_web_acl.api_protection.arn
  log_destination_configs = [aws_s3_bucket.waf_logs.arn]

  redacted_fields {
    single_header {
      name = "authorization"
    }
  }

  depends_on = [
    aws_s3_bucket_policy.waf_logs,
    aws_s3_bucket_public_access_block.waf_logs
  ]
}

# Data source for current account
data "aws_caller_identity" "current" {
  provider = aws.global
}