# KMS key for S3 encryption
resource "aws_kms_key" "s3_encryption_key" {
  description             = "${var.application_name} S3 encryption key"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow use of the key for S3"
        Effect = "Allow"
        Principal = {
          AWS = [
            aws_iam_role.s3_access_role.arn,
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
          ]
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "${var.application_name}-s3-kms-key-${var.environment}-${var.environment_suffix}"
    Environment = var.environment
    Application = var.application_name
    Suffix      = var.environment_suffix
  }
}

resource "aws_kms_alias" "s3_encryption_key_alias" {
  name          = "alias/${var.application_name}-s3-key-${var.environment}-${var.environment_suffix}"
  target_key_id = aws_kms_key.s3_encryption_key.key_id
}