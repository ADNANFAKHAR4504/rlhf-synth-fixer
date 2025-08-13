# Data sources
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# S3 bucket policy for CloudTrail
resource "aws_s3_bucket_policy" "cloudtrail_policy" {
  bucket = var.s3_bucket_name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = "arn:aws:s3:::${var.s3_bucket_name}"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${var.environment}-${var.organization_name}-cloudtrail"
          }
        }
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "arn:aws:s3:::${var.s3_bucket_name}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"  = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${var.environment}-${var.organization_name}-cloudtrail"
          }
        }
      }
    ]
  })
}

# CloudTrail for logging all API calls
resource "aws_cloudtrail" "main" {
  name           = "${var.environment}-${var.organization_name}-cloudtrail"
  s3_bucket_name = var.s3_bucket_name

  event_selector {
    read_write_type                  = "All"
    include_management_events        = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }

    data_resource {
      type   = "AWS::Lambda::Function"
      values = ["arn:aws:lambda:*"]
    }
  }

  # Enable encryption using KMS
  kms_key_id = var.kms_key_arn

  # Enable log file validation
  enable_log_file_validation = true

  # Enable logging
  enable_logging = true

  # Include global service events
  include_global_service_events = true

  # Multi-region trail
  is_multi_region_trail = true

  # Organization trail (if using AWS Organizations)
  is_organization_trail = false

  tags = {
    Name        = "${var.environment}-${var.organization_name}-cloudtrail"
    Environment = var.environment
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail_policy]

  lifecycle {
    prevent_destroy = true
  }
}

# CloudWatch Log Group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${var.environment}-${var.organization_name}"
  retention_in_days = 90
  kms_key_id        = var.kms_key_arn

  tags = {
    Name        = "${var.environment}-${var.organization_name}-cloudtrail-logs"
    Environment = var.environment
  }

  lifecycle {
    prevent_destroy = true
  }
}

# IAM role for CloudTrail to write to CloudWatch Logs
resource "aws_iam_role" "cloudtrail_logs_role" {
  name = "${var.environment}-${var.organization_name}-cloudtrail-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
      }
    ]
  })
}

# IAM policy for CloudTrail to write to CloudWatch Logs
resource "aws_iam_role_policy" "cloudtrail_logs_policy" {
  name = "${var.environment}-${var.organization_name}-cloudtrail-logs-policy"
  role = aws_iam_role.cloudtrail_logs_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]

        Resource = [
          "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/cloudtrail/${var.environment}-${var.organization_name}:*"
        ]
      }
    ]
  })
}
