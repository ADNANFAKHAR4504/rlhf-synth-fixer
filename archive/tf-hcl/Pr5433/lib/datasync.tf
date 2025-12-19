# IAM role for DataSync S3 access
resource "aws_iam_role" "datasync_s3_access" {
  name = "datasync-s3-access-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "datasync.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name           = "datasync-s3-access-${var.environment_suffix}"
    Environment    = terraform.workspace
    MigrationPhase = var.migration_phase
  }
}

resource "aws_iam_role_policy" "datasync_s3_access" {
  name = "datasync-s3-access-policy"
  role = aws_iam_role.datasync_s3_access.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketLocation",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads"
        ]
        Resource = aws_s3_bucket.imported_bucket.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:AbortMultipartUpload",
          "s3:DeleteObject",
          "s3:GetObject",
          "s3:ListMultipartUploadParts",
          "s3:PutObject",
          "s3:GetObjectTagging",
          "s3:PutObjectTagging"
        ]
        Resource = "${aws_s3_bucket.imported_bucket.arn}/*"
      }
    ]
  })
}

# DataSync location for S3
resource "aws_datasync_location_s3" "target" {
  s3_bucket_arn = aws_s3_bucket.imported_bucket.arn
  subdirectory  = "/migrated-data"

  s3_config {
    bucket_access_role_arn = aws_iam_role.datasync_s3_access.arn
  }

  tags = {
    Name           = "s3-target-${var.environment_suffix}"
    Environment    = terraform.workspace
    MigrationPhase = var.migration_phase
  }
}

# Note: DataSync agent and NFS location require manual setup
# Agent must be activated before creating the task
# This is a placeholder configuration showing the required structure
