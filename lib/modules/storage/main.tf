# modules/storage/main.tf
resource "aws_s3_bucket" "video_storage" {
  bucket = var.bucket_name
  
  tags = {
    Name = "media-streaming-video-storage"
  }
}

resource "aws_s3_bucket_ownership_controls" "video_storage" {
  bucket = aws_s3_bucket.video_storage.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "video_storage" {
  depends_on = [aws_s3_bucket_ownership_controls.video_storage]
  bucket     = aws_s3_bucket.video_storage.id
  acl        = "private"
}

resource "aws_s3_bucket_versioning" "video_storage" {
  bucket = aws_s3_bucket.video_storage.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "video_storage" {
  bucket = aws_s3_bucket.video_storage.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_intelligent_tiering_configuration" "video_storage" {
  bucket = aws_s3_bucket.video_storage.id
  name   = "EntireBucket"
  
  tiering {
    access_tier = "DEEP_ARCHIVE_ACCESS"
    days        = 180
  }
  
  tiering {
    access_tier = "ARCHIVE_ACCESS"
    days        = 90
  }
}

resource "aws_s3_bucket_accelerate_configuration" "video_storage" {
  bucket = aws_s3_bucket.video_storage.id
  status = "Enabled"
}

resource "aws_s3_bucket_cors_configuration" "video_storage" {
  bucket = aws_s3_bucket.video_storage.id
  
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "video_storage" {
  bucket = aws_s3_bucket.video_storage.id
  
  rule {
    id     = "transition-to-intelligent-tiering"
    status = "Enabled"
    
    filter {
      prefix = "videos/"
    }
    
    transition {
      days          = 30
      storage_class = "INTELLIGENT_TIERING"
    }
  }
}

resource "aws_s3_bucket_policy" "video_storage" {
  count  = var.cloudfront_oai_iam_arn != "" ? 1 : 0
  bucket = aws_s3_bucket.video_storage.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = "s3:GetObject"
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.video_storage.arn}/*"
        Principal = {
          AWS = var.cloudfront_oai_iam_arn
        }
      }
    ]
  })
}