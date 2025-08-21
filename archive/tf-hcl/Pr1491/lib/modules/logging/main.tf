// Logging module: CloudTrail in both regions + S3 logging bucket policy

data "aws_caller_identity" "current" {}

# CloudTrail in primary region
resource "aws_cloudtrail" "primary" {
  count                         = var.create_cloudtrail ? 1 : 0
  name                          = "primary-cloudtrail-${random_string.suffix.result}"
  s3_bucket_name                = var.logging_bucket_id
  s3_key_prefix                 = var.s3_key_prefix
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true

  kms_key_id = var.primary_kms_key_arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true
    data_resource {
      type   = "AWS::S3::Object"
      values = ["${var.primary_data_bucket_arn}/*"]
    }
  }

  tags = var.tags
}

# CloudTrail in secondary region, logs still go to primary bucket/kms
resource "aws_cloudtrail" "secondary" {
  count    = var.create_cloudtrail ? 1 : 0
  provider = aws.eu_central_1

  name                          = "secondary-cloudtrail-${random_string.suffix.result}"
  s3_bucket_name                = var.logging_bucket_id
  s3_key_prefix                 = var.s3_key_prefix
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true

  kms_key_id = var.primary_kms_key_arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true
    data_resource {
      type   = "AWS::S3::Object"
      values = ["${var.secondary_data_bucket_arn}/*"]
    }
  }

  tags = var.tags
}

# S3 bucket controls and policy for logging bucket
resource "aws_s3_bucket_ownership_controls" "logging" {
  bucket = var.logging_bucket_id
  rule { object_ownership = "BucketOwnerEnforced" }
}

resource "aws_s3_bucket_public_access_block" "logging" {
  bucket                  = var.logging_bucket_id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "logging" {
  bucket = var.logging_bucket_id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "AWSCloudTrailAclCheck",
        Effect    = "Allow",
        Principal = { Service = "cloudtrail.amazonaws.com" },
        Action    = "s3:GetBucketAcl",
        Resource  = var.logging_bucket_arn,
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          },
          ArnLike = {
            "aws:SourceArn" = "arn:aws:cloudtrail:*:${data.aws_caller_identity.current.account_id}:trail/*"
          }
        }
      },
      {
        Sid       = "AWSCloudTrailWrite",
        Effect    = "Allow",
        Principal = { Service = "cloudtrail.amazonaws.com" },
        Action    = "s3:PutObject",
        Resource  = "${var.logging_bucket_arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/*",
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          },
          ArnLike = {
            "aws:SourceArn" = "arn:aws:cloudtrail:*:${data.aws_caller_identity.current.account_id}:trail/*"
          }
        }
      },
      {
        Sid       = "AWSCloudTrailGetBucketLocation",
        Effect    = "Allow",
        Principal = { Service = "cloudtrail.amazonaws.com" },
        Action    = "s3:GetBucketLocation",
        Resource  = var.logging_bucket_arn,
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          },
          ArnLike = {
            "aws:SourceArn" = "arn:aws:cloudtrail:*:${data.aws_caller_identity.current.account_id}:trail/*"
          }
        }
      }
    ]
  })
}

resource "random_string" "suffix" {
  length  = 6
  upper   = false
  special = false
}
