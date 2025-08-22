# CloudTrail, VPC Flow Logs, and S3 bucket configurations

# S3 bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket        = "${var.project_name}-cloudtrail-logs-${random_id.bucket_suffix.hex}-${var.region}"
  force_destroy = true # Allow destruction for testing - remove in production

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-cloudtrail-logs-${local.name_suffix}"
    Purpose = "CloudTrail-Logs"
    Type    = "S3Bucket"
  })
}

# S3 bucket for access logs (separate bucket for S3 access logging)
resource "aws_s3_bucket" "access_logs" {
  bucket        = "${var.project_name}-access-logs-${random_id.bucket_suffix.hex}-${var.region}"
  force_destroy = true # Allow destruction for testing - remove in production

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-access-logs-${local.name_suffix}"
    Purpose = "Access-Logs"
    Type    = "S3Bucket"
  })
}

# S3 bucket versioning for CloudTrail logs
resource "aws_s3_bucket_versioning" "cloudtrail_logs_versioning" {
  bucket = aws_s3_bucket.cloudtrail_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket versioning for access logs
resource "aws_s3_bucket_versioning" "access_logs_versioning" {
  bucket = aws_s3_bucket.access_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket encryption for CloudTrail logs
resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs_encryption" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 bucket encryption for access logs
resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs_encryption" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 bucket public access block for CloudTrail logs
resource "aws_s3_bucket_public_access_block" "cloudtrail_logs_pab" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket public access block for access logs
resource "aws_s3_bucket_public_access_block" "access_logs_pab" {
  bucket = aws_s3_bucket.access_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket logging configuration for CloudTrail bucket
resource "aws_s3_bucket_logging" "cloudtrail_logs_logging" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "cloudtrail-bucket-logs/"
}

# S3 bucket policy for CloudTrail
resource "aws_s3_bucket_policy" "cloudtrail_logs_policy" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

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
        Resource = aws_s3_bucket.cloudtrail_logs.arn
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:${var.region}:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-trail-${local.name_suffix}"
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
        Resource = "${aws_s3_bucket.cloudtrail_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"  = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:aws:cloudtrail:${var.region}:${data.aws_caller_identity.current.account_id}:trail/${var.project_name}-trail-${local.name_suffix}"
          }
        }
      }
    ]
  })
}

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/flowlogs/${var.project_name}-${local.name_suffix}"
  retention_in_days = 30

  tags = merge(local.common_tags, {
    Name    = "${var.project_name}-vpc-flow-logs-${local.name_suffix}"
    Purpose = "VPC-Flow-Logs"
    Type    = "CloudWatchLogGroup"
  })
}

# VPC Flow Logs
resource "aws_flow_log" "vpc_flow_logs" {
  iam_role_arn    = aws_iam_role.flow_log_role.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-vpc-flow-logs-${local.name_suffix}"
    Type = "VPCFlowLog"
  })
}

# CloudTrail
resource "aws_cloudtrail" "main" {
  name           = "${var.project_name}-trail-${local.name_suffix}"
  s3_bucket_name = aws_s3_bucket.cloudtrail_logs.id
  s3_key_prefix  = "cloudtrail-logs"

  enable_logging                = true
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true

  # Log management events
  event_selector {
    read_write_type                  = "All"
    include_management_events        = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.cloudtrail_logs.arn}/*"]
    }
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail_logs_policy]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-trail-${local.name_suffix}"
    Type = "CloudTrail"
  })
}
