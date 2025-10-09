# main.tf

# Local variables
locals {
  name_prefix = var.environment_suffix != "" ? "${var.project_name}-${var.environment_suffix}" : var.project_name
}

# KMS key for encryption
resource "aws_kms_key" "logging_key" {
  description             = "KMS key for centralized logging encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-kms-key"
  })
}

resource "aws_kms_alias" "logging_key_alias" {
  name          = "alias/${local.name_prefix}"
  target_key_id = aws_kms_key.logging_key.key_id
}

# S3 bucket for log storage
resource "aws_s3_bucket" "log_storage" {
  bucket = "${local.name_prefix}-logs-${data.aws_caller_identity.current.account_id}"

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-log-storage"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "log_storage" {
  bucket = aws_s3_bucket.log_storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.logging_key.arn
    }
  }
}

resource "aws_s3_bucket_versioning" "log_storage" {
  bucket = aws_s3_bucket.log_storage.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "log_storage" {
  bucket = aws_s3_bucket.log_storage.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 180
      storage_class = "DEEP_ARCHIVE"
    }

    expiration {
      days = 2555
    }
  }
}

resource "aws_s3_bucket_public_access_block" "log_storage" {
  bucket = aws_s3_bucket.log_storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudWatch Log Groups for each application
resource "aws_cloudwatch_log_group" "applications" {
  count = var.application_count

  name              = "/aws/application/${local.name_prefix}-app-${format("%02d", count.index + 1)}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.logging_key.arn

  tags = merge(var.tags, {
    Name        = "${local.name_prefix}-app-${format("%02d", count.index + 1)}"
    Application = "app-${format("%02d", count.index + 1)}"
  })

  depends_on = [aws_kms_key_policy.logging_key]
}

# CloudWatch Log subscription filters to send logs to Kinesis Firehose
resource "aws_cloudwatch_log_subscription_filter" "firehose" {
  count = var.application_count

  name            = "${local.name_prefix}-firehose-subscription-app-${format("%02d", count.index + 1)}"
  log_group_name  = aws_cloudwatch_log_group.applications[count.index].name
  filter_pattern  = ""
  destination_arn = aws_kinesis_firehose_delivery_stream.logs.arn
  role_arn        = aws_iam_role.cloudwatch_to_firehose.arn

  depends_on = [aws_iam_role_policy.cloudwatch_to_firehose]
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}
