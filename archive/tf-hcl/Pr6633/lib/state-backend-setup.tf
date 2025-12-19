# This file sets up the S3 bucket and DynamoDB table for Terraform state
# Run this FIRST before configuring the backend in backend.tf

# S3 Bucket for State
resource "aws_s3_bucket" "terraform_state" {
  bucket = "terraform-state-fintech-app-${var.environment_suffix}"

  tags = merge(
    local.common_tags,
    {
      Name = "terraform-state-${var.environment_suffix}"
    }
  )

  lifecycle {
    prevent_destroy = false
  }
}

# Enable Versioning
resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block Public Access
resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DynamoDB Table for State Locking
resource "aws_dynamodb_table" "terraform_state_lock" {
  name         = "terraform-state-lock-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "terraform-state-lock-${var.environment_suffix}"
    }
  )

  lifecycle {
    prevent_destroy = false
  }
}
