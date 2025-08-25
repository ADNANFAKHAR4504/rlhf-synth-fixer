########################
# KMS Keys for Encryption at Rest (Primary, Secondary, and CloudTrail)
########################

resource "aws_kms_key" "primary" {
  provider                = aws.primary
  description             = "${var.name_prefix}-${var.environment}-kms-key-primary"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Allow administration of the key"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs to use the key for CloudTrail"
        Effect = "Allow"
        Principal = {
          Service = "logs.us-east-1.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:us-east-1:${data.aws_caller_identity.current.account_id}:log-group:/aws/cloudtrail/${var.name_prefix}-${var.environment}"
          }
        }
      }
    ]
  })
  tags = {
    Name = "${var.name_prefix}-${var.environment}-kms-key-primary"
  }
}

resource "aws_kms_alias" "primary" {
  provider      = aws.primary
  name          = "alias/${var.name_prefix}-${var.environment}-primary"
  target_key_id = aws_kms_key.primary.key_id
}

resource "aws_kms_key" "secondary" {
  provider                = aws.secondary
  description             = "${var.name_prefix}-${var.environment}-kms-key-secondary"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Allow administration of the key"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs to use the key"
        Effect = "Allow"
        Principal = {
          Service = "logs.us-west-2.amazonaws.com"
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
    Name = "${var.name_prefix}-${var.environment}-kms-key-secondary"
  }
}

resource "aws_kms_alias" "secondary" {
  provider      = aws.secondary
  name          = "alias/${var.name_prefix}-${var.environment}-secondary"
  target_key_id = aws_kms_key.secondary.key_id
}

resource "aws_kms_key" "s3" {
  provider                = aws.primary
  description             = "${var.name_prefix}-${var.environment}-kms-key-s3"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Allow administration of the key"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail to use the key"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:Decrypt"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow S3 to use the key"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
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
    Name = "${var.name_prefix}-${var.environment}-kms-key-s3"
  }
}

resource "aws_kms_alias" "s3" {
  provider      = aws.primary
  name          = "alias/${var.name_prefix}-${var.environment}-s3"
  target_key_id = aws_kms_key.s3.key_id
}

resource "aws_kms_key" "cloudtrail" {
  provider                = aws.primary
  description             = "${var.name_prefix}-${var.environment}-kms-key-cloudtrail"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Allow administration of the key"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail to use the key"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:Decrypt"
        ]
        Resource = "*"
      }
    ]
  })
  tags = {
    Name = "${var.name_prefix}-${var.environment}-kms-key-cloudtrail"
  }
}

resource "aws_kms_alias" "cloudtrail" {
  provider      = aws.primary
  name          = "alias/${var.name_prefix}-${var.environment}-cloudtrail"
  target_key_id = aws_kms_key.cloudtrail.key_id
}

output "primary_kms_key_arn" {
  description = "ARN of the primary KMS key"
  value       = aws_kms_key.primary.arn
}

output "secondary_kms_key_arn" {
  description = "ARN of the secondary KMS key"
  value       = aws_kms_key.secondary.arn
}

output "s3_kms_key_arn" {
  description = "ARN of the S3 KMS key"
  value       = aws_kms_key.s3.arn
}

output "cloudtrail_kms_key_arn" {
  description = "ARN of the CloudTrail KMS key"
  value       = aws_kms_key.cloudtrail.arn
}
