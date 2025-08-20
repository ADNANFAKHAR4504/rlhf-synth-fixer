# modules/storage/main.tf
resource "random_id" "bucket_suffix" {
  keepers = {
    environment = var.environment
  }
  byte_length = 4
}

resource "aws_s3_bucket" "main" {
  bucket = "myapp-${var.environment}-${random_id.bucket_suffix.hex}"

  versioning {
    enabled = true
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  tags = {
    Name        = "myapp-${var.environment}-bucket"
    Environment = var.environment
  }
}

output "bucket_name" {
  value = aws_s3_bucket.main.bucket
}

output "bucket_arn" {
  value = aws_s3_bucket.main.arn
}
