# S3 bucket in current region
resource "aws_s3_bucket" "documents" {
  provider = aws.primary
  bucket   = "${local.resource_prefix}-documents-${local.current_region}"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-documents-${local.current_region}"
    }
  )
}

# Enable versioning for replication
resource "aws_s3_bucket_versioning" "documents" {
  provider = aws.primary
  bucket   = aws_s3_bucket.documents.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Encryption configuration
resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  provider = aws.primary
  bucket   = aws_s3_bucket.documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
    bucket_key_enabled = true
  }
}

# Public access block
resource "aws_s3_bucket_public_access_block" "documents" {
  provider = aws.primary
  bucket   = aws_s3_bucket.documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Cross-region replication (only from primary to secondary)
# Commented out for initial deployment - requires destination bucket to exist first
# resource "aws_s3_bucket_replication_configuration" "documents" {
#   provider = aws.primary
#   count    = local.is_primary ? 1 : 0
#
#   depends_on = [aws_s3_bucket_versioning.documents]
#
#   role   = data.aws_iam_role.s3_replication.arn
#   bucket = aws_s3_bucket.documents.id
#
#   rule {
#     id     = "replicate-all"
#     status = "Enabled"
#
#     destination {
#       bucket        = "arn:aws:s3:::${local.resource_prefix}-documents-${local.other_region}"
#       storage_class = "STANDARD"
#
#       encryption_configuration {
#         replica_kms_key_id = "arn:aws:kms:${local.other_region}:${data.aws_caller_identity.current.account_id}:alias/${local.resource_prefix}-s3-${local.other_region}"
#       }
#     }
#   }
# }

# Data source for current account
data "aws_caller_identity" "current" {
  provider = aws.primary
}
