########################
# S3 Bucket Encryption (Primary and Secondary Regions)
########################

resource "aws_s3_bucket_server_side_encryption_configuration" "primary" {
  bucket = aws_s3_bucket.primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
      kms_master_key_id = aws_kms_key.primary.arn
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "secondary" {
  bucket = aws_s3_bucket.secondary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
      kms_master_key_id = aws_kms_key.secondary.arn
    }
  }
}
