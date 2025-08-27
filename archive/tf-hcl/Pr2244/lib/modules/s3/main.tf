# AWS Config S3 Buckets (continued from previous)
resource "aws_s3_bucket" "config_us_east_1" {
  provider = aws.us_east_1
  bucket   = "prod-config-logs-us-east-1-${random_id.bucket_suffix.hex}"

  tags = {
    Name = "prod-config-logs-us-east-1"
  }
}

resource "aws_s3_bucket_versioning" "config_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.config_us_east_1.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.config_us_east_1.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_policy" "config_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.config_us_east_1.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config_us_east_1.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config_us_east_1.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config_us_east_1.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"      = "bucket-owner-full-control"
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket" "config_us_west_2" {
  provider = aws.us_west_2
  bucket   = "prod-config-logs-us-west-2-${random_id.bucket_suffix.hex}"

  tags = {
    Name = "prod-config-logs-us-west-2"
  }
}

resource "aws_s3_bucket_versioning" "config_us_west_2" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.config_us_west_2.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config_us_west_2" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.config_us_west_2.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_policy" "config_us_west_2" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.config_us_west_2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config_us_west_2.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config_us_west_2.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config_us_west_2.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"      = "bucket-owner-full-control"
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# Application Data S3 Buckets
resource "aws_s3_bucket" "app_data_us_east_1" {
  provider = aws.us_east_1
  bucket   = "prod-app-data-us-east-1-${random_id.bucket_suffix.hex}"

  tags = {
    Name = "prod-app-data-us-east-1"
  }
}

resource "aws_s3_bucket_versioning" "app_data_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.app_data_us_east_1.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_data_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.app_data_us_east_1.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket" "app_data_us_west_2" {
  provider = aws.us_west_2
  bucket   = "prod-app-data-us-west-2-${random_id.bucket_suffix.hex}"

  tags = {
    Name = "prod-app-data-us-west-2"
  }
}

resource "aws_s3_bucket_versioning" "app_data_us_west_2" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.app_data_us_west_2.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_data_us_west_2" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.app_data_us_west_2.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# CloudTrail S3 Bucket
resource "aws_s3_bucket" "cloudtrail" {
  provider = aws.us_east_1
  bucket   = "prod-cloudtrail-logs-${random_id.bucket_suffix.hex}"

  tags = {
    Name = "prod-cloudtrail-logs"
  }
}

resource "aws_s3_bucket_versioning" "cloudtrail" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.cloudtrail.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.cloudtrail.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Random ID for unique bucket names
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}
