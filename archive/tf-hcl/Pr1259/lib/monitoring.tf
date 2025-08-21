# CloudTrail for audit logging
# NOTE: Commented out due to AWS account limit (max 6 trails per region)
# resource "aws_cloudtrail" "main" {
#   depends_on = [aws_s3_bucket_policy.cloudtrail]
#
#   name           = "${var.resource_prefix}-${var.environment_suffix}-trail"
#   s3_bucket_name = aws_s3_bucket.cloudtrail.id
#
#   event_selector {
#     read_write_type           = "All"
#     include_management_events = true
#
#     data_resource {
#       type   = "AWS::S3::Object"
#       values = ["${aws_s3_bucket.main.arn}/*"]
#     }
#   }
#
#   kms_key_id                    = aws_kms_key.main.arn
#   include_global_service_events = true
#   is_multi_region_trail         = true
#   enable_log_file_validation    = true
#
#   tags = {
#     Name = "${var.resource_prefix}-${var.environment_suffix}-cloudtrail"
#   }
# }

# Config configuration recorder
# NOTE: Commented out due to dependency issues with delivery channel
# resource "aws_config_configuration_recorder" "main" {
#   name     = "${var.resource_prefix}-${var.environment_suffix}-recorder"
#   role_arn = aws_iam_role.config_role.arn
#
#   recording_group {
#     all_supported                 = true
#     include_global_resource_types = true
#   }
#
#   depends_on = [aws_config_delivery_channel.main]
# }

# Config delivery channel
# resource "aws_config_delivery_channel" "main" {
#   name           = "${var.resource_prefix}-${var.environment_suffix}-delivery-channel"
#   s3_bucket_name = aws_s3_bucket.config.id
# }

# Config S3 bucket
resource "aws_s3_bucket" "config" {
  bucket        = "${lower(var.resource_prefix)}-${var.environment_suffix}-config-${random_string.config_suffix.result}"
  force_destroy = true

  tags = {
    Name = "${var.resource_prefix}-${var.environment_suffix}-config-bucket"
  }
}

resource "random_string" "config_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config" {
  bucket = aws_s3_bucket.config.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_policy" "config" {
  bucket = aws_s3_bucket.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"      = "bucket-owner-full-control"
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# resource "aws_config_configuration_recorder_status" "main" {
#   name       = aws_config_configuration_recorder.main.name
#   is_enabled = true
#   depends_on = [aws_config_delivery_channel.main]
# }