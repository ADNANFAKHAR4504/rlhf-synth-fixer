# S3 bucket for Terraform state (to be created before initializing backend)
resource "aws_s3_bucket" "terraform_state" {
  bucket = "terraform-state-migration-${var.environment_suffix}"

  tags = {
    Name           = "terraform-state-migration-${var.environment_suffix}"
    Purpose        = "TerraformStateStorage"
    Environment    = terraform.workspace
    MigrationPhase = var.migration_phase
  }

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
      sse_algorithm = "AES256"
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

# DynamoDB table for state locking
resource "aws_dynamodb_table" "terraform_state_lock" {
  name         = "terraform-state-lock-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name           = "terraform-state-lock-${var.environment_suffix}"
    Purpose        = "TerraformStateLocking"
    Environment    = terraform.workspace
    MigrationPhase = var.migration_phase
  }

}
