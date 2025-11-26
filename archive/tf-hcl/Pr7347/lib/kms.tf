# kms.tf - Customer-managed KMS key for SNS topic encryption

resource "aws_kms_key" "sns" {
  description             = "KMS key for SNS topic encryption - ${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "sns-encryption-key-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "sns" {
  name          = "alias/sns-encryption-${var.environment_suffix}"
  target_key_id = aws_kms_key.sns.key_id
}

resource "aws_kms_key_policy" "sns" {
  key_id = aws_kms_key.sns.id

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
        Sid    = "Allow SNS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch to use the key"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })
}
