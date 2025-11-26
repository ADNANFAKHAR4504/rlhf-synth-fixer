resource "aws_s3_bucket" "access_logs" {
  bucket = "${lower(replace(var.environment_tag, "-", ""))}-access-logs-${random_id.bucket_suffix.hex}"
  tags = {
    Name        = "${var.environment_tag}-access-logs-bucket"
    Environment = var.environment_tag
    Purpose     = "AccessLogs"
  }
}

resource "aws_s3_bucket" "app_data" {
  bucket = "${lower(replace(var.environment_tag, "-", ""))}-app-data-${random_id.bucket_suffix.hex}"
  tags = {
    Name        = "${var.environment_tag}-app-data-bucket"
    Environment = var.environment_tag
    Purpose     = "ApplicationData"
  }
}

resource "aws_s3_bucket_versioning" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_logging" "app_data" {
  bucket        = aws_s3_bucket.app_data.id
  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "app-data-access-logs/"
}

resource "aws_s3_bucket_public_access_block" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}