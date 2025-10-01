data "aws_caller_identity" "current" {}

resource "random_id" "bucket" {
  byte_length = 4
}

locals {
  raw_name   = format("app-storage-%s-%s-%s", data.aws_caller_identity.current.account_id, lower(var.resource_suffix), random_id.bucket.hex)
  bucket_name = substr(local.raw_name, 0, 63)  # S3 bucket name max length 63
}

resource "aws_s3_bucket" "app_bucket" {
  bucket = local.bucket_name
  acl    = "private"

  tags = {
    Name = "app-storage-${var.resource_suffix}"
  }
}

resource "aws_s3_bucket_versioning" "app_bucket_versioning" {
  bucket = aws_s3_bucket.app_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_bucket_encryption" {
  bucket = aws_s3_bucket.app_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "app_bucket_public_access" {
  bucket                  = aws_s3_bucket.app_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}