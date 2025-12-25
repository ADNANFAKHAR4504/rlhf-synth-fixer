terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "environment_suffix" { type = string }
variable "region" { type = string }
variable "replication_region" { type = string }
variable "replication_role_arn" { type = string }
variable "is_primary" { type = bool }

resource "aws_s3_bucket" "assets" {
  bucket = "transaction-assets-${var.region}-${var.environment_suffix}"

  tags = {
    Name   = "transaction-assets-${var.region}-${var.environment_suffix}"
    Region = var.region
  }
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_kms_key" "s3_encryption" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "transaction-s3-kms-${var.region}-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "s3_encryption" {
  name          = "alias/transaction-s3-${var.region}-${var.environment_suffix}"
  target_key_id = aws_kms_key.s3_encryption.key_id
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3_encryption.arn
    }
  }
}

resource "aws_s3_bucket_replication_configuration" "assets" {
  count  = var.is_primary ? 1 : 0
  bucket = aws_s3_bucket.assets.id
  role   = var.replication_role_arn

  rule {
    id     = "replicate-all"
    status = "Enabled"

    destination {
      bucket        = "arn:aws:s3:::transaction-assets-${var.replication_region}-${var.environment_suffix}"
      storage_class = "STANDARD"
    }
  }

  depends_on = [aws_s3_bucket_versioning.assets]
}

resource "aws_s3_bucket" "lambda_source" {
  bucket = "transaction-lambda-source-${var.region}-${var.environment_suffix}"

  tags = {
    Name   = "transaction-lambda-source-${var.region}-${var.environment_suffix}"
    Region = var.region
  }
}

resource "aws_s3_bucket_versioning" "lambda_source" {
  bucket = aws_s3_bucket.lambda_source.id

  versioning_configuration {
    status = "Enabled"
  }
}

output "bucket_name" { value = aws_s3_bucket.assets.bucket }
output "bucket_arn" { value = aws_s3_bucket.assets.arn }
output "lambda_source_bucket_name" { value = aws_s3_bucket.lambda_source.bucket }
