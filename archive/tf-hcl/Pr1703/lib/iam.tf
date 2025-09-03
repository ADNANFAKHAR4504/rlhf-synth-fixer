# IAM role for S3 access with least privilege
resource "aws_iam_role" "s3_access_role" {
  name = "${var.application_name}-s3-role-${var.environment}-${var.environment_suffix}"

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

  tags = {
    Name        = "${var.application_name}-s3-role-${var.environment}-${var.environment_suffix}"
    Environment = var.environment
    Application = var.application_name
    Suffix      = var.environment_suffix
  }
}

# IAM policy for S3 bucket access
resource "aws_iam_role_policy" "s3_access_policy" {
  name = "${var.application_name}-s3-policy-${var.environment}-${var.environment_suffix}"
  role = aws_iam_role.s3_access_role.id

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
        Resource = concat(
          [for bucket in aws_s3_bucket.secure_buckets : bucket.arn],
          [for bucket in aws_s3_bucket.secure_buckets : "${bucket.arn}/*"]
        )
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [aws_kms_key.s3_encryption_key.arn]
      }
    ]
  })
}

# Instance profile for EC2 instances
resource "aws_iam_instance_profile" "s3_access_profile" {
  name = "${var.application_name}-s3-profile-${var.environment}-${var.environment_suffix}"
  role = aws_iam_role.s3_access_role.name

  tags = {
    Name        = "${var.application_name}-s3-profile-${var.environment}-${var.environment_suffix}"
    Environment = var.environment
    Application = var.application_name
    Suffix      = var.environment_suffix
  }
}