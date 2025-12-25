# Data source for current AWS account
data "aws_caller_identity" "current" {}

# IAM role for S3 access
resource "aws_iam_role" "s3_access_role" {
  name = "${var.project_name}${local.suffix_string}-s3-access-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# IAM policy for S3 access with minimal permissions
resource "aws_iam_policy" "s3_access_policy" {
  name        = "${var.project_name}${local.suffix_string}-s3-access-policy"
  description = "Policy for secure S3 access with minimal permissions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.primary_data_bucket.arn,
          "${aws_s3_bucket.primary_data_bucket.arn}/*",
          aws_s3_bucket.backup_data_bucket.arn,
          "${aws_s3_bucket.backup_data_bucket.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.s3_encryption_key.arn
        ]
      }
    ]
  })

  tags = local.common_tags
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "s3_access_attachment" {
  role       = aws_iam_role.s3_access_role.name
  policy_arn = aws_iam_policy.s3_access_policy.arn
}

# Instance profile for EC2 instances
resource "aws_iam_instance_profile" "s3_access_profile" {
  name = "${var.project_name}${local.suffix_string}-s3-access-profile"
  role = aws_iam_role.s3_access_role.name

  tags = local.common_tags
}