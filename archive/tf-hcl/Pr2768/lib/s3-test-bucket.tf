# ================================
# S3 TEST BUCKET CONFIGURATION
# ================================
# This file contains a separate S3 bucket configuration for testing purposes
# It's isolated from the main infrastructure to avoid conflicts

# Test S3 bucket for integration testing
resource "aws_s3_bucket" "test_bucket" {
  bucket_prefix = "${terraform.workspace}-test-bucket-"

  tags = {
    Name        = "${terraform.workspace}-test-bucket"
    Environment = terraform.workspace
    Purpose     = "Testing"
    ManagedBy   = "Terraform"
  }
}

# Enable versioning for test bucket
resource "aws_s3_bucket_versioning" "test_bucket" {
  bucket = aws_s3_bucket.test_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Configure server-side encryption for test bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "test_bucket" {
  bucket = aws_s3_bucket.test_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# Block public access for security
resource "aws_s3_bucket_public_access_block" "test_bucket" {
  bucket = aws_s3_bucket.test_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Test objects for validation
resource "aws_s3_object" "test_file" {
  bucket       = aws_s3_bucket.test_bucket.id
  key          = "test-file.txt"
  content      = "This is a test file for integration testing - ${timestamp()}"
  content_type = "text/plain"

  tags = {
    Name        = "${terraform.workspace}-test-file"
    Environment = terraform.workspace
    Purpose     = "Testing"
  }
}

resource "aws_s3_object" "test_json" {
  bucket = aws_s3_bucket.test_bucket.id
  key    = "test-data.json"
  content = jsonencode({
    test_id     = "${terraform.workspace}-${random_id.test_id.hex}"
    timestamp   = timestamp()
    environment = terraform.workspace
    test_data = {
      message  = "Integration test data"
      version  = "1.0.0"
      features = ["encryption", "versioning", "tagging"]
    }
  })
  content_type = "application/json"

  tags = {
    Name        = "${terraform.workspace}-test-json"
    Environment = terraform.workspace
    Purpose     = "Testing"
  }
}

# Random ID for unique test identifiers
resource "random_id" "test_id" {
  byte_length = 4
}

# Test bucket policy for controlled access
resource "aws_s3_bucket_policy" "test_bucket_policy" {
  bucket = aws_s3_bucket.test_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowTestAccess"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.test_bucket.arn,
          "${aws_s3_bucket.test_bucket.arn}/*"
        ]
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = "us-east-1"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.test_bucket]
}

# Outputs for test bucket
output "test_bucket_name" {
  description = "Name of the test S3 bucket"
  value       = aws_s3_bucket.test_bucket.id
}

output "test_bucket_arn" {
  description = "ARN of the test S3 bucket"
  value       = aws_s3_bucket.test_bucket.arn
}

output "test_bucket_domain_name" {
  description = "Domain name of the test S3 bucket"
  value       = aws_s3_bucket.test_bucket.bucket_domain_name
}

output "test_file_key" {
  description = "Key of the test file in S3"
  value       = aws_s3_object.test_file.key
}

output "test_json_key" {
  description = "Key of the test JSON file in S3"
  value       = aws_s3_object.test_json.key
}
