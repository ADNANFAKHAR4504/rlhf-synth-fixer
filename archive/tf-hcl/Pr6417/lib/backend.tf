# Backend configuration commented out for CI/CD compatibility
# The S3 backend creates a circular dependency - it requires resources that don't exist yet
# For production use, configure the backend after initial deployment using terraform init with -backend-config
# terraform {
#   backend "s3" {
#     bucket         = "terraform-state-bucket-${var.environmentSuffix}"
#     key            = "infrastructure/terraform.tfstate"
#     region         = "ap-southeast-1"
#     encrypt        = true
#     dynamodb_table = "terraform-state-lock-${var.environmentSuffix}"
#     kms_key_id     = "alias/terraform-state-${var.environmentSuffix}"
#   }
# }

resource "aws_s3_bucket" "terraform_state" {
  bucket = "terraform-state-bucket-${var.environmentSuffix}"

  tags = merge(local.common_tags, {
    Name        = "terraform-state-${var.environmentSuffix}"
    Description = "S3 bucket for Terraform state storage"
  })
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.terraform_state.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "terraform_lock" {
  name         = "terraform-state-lock-${var.environmentSuffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = merge(local.common_tags, {
    Name        = "terraform-lock-${var.environmentSuffix}"
    Description = "DynamoDB table for Terraform state locking"
  })
}

resource "aws_kms_key" "terraform_state" {
  description             = "KMS key for Terraform state encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "terraform-state-key-${var.environmentSuffix}"
  })
}

resource "aws_kms_alias" "terraform_state" {
  name          = "alias/terraform-state-${var.environmentSuffix}"
  target_key_id = aws_kms_key.terraform_state.key_id
}