# modules/storage/main.tf
resource "random_id" "bucket_suffix" {
  keepers = {
    environment = var.environment
  }
  byte_length = var.bucket_byte_length
}

resource "aws_s3_bucket" "main" {
  bucket = "${var.bucket_name_prefix}-${var.environment}-${random_id.bucket_suffix.hex}"
  force_destroy = var.bucket_force_destroy

  tags = merge({
    Name        = "${var.bucket_name_prefix}-${var.environment}-bucket"
    Environment = var.environment
  }, var.bucket_tags)
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = var.encryption_algorithm
    }
  }
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration {
    status = "Enabled"
  }
}

output "bucket_name" {
  value = aws_s3_bucket.main.bucket
}

output "bucket_arn" {
  value = aws_s3_bucket.main.arn
}
