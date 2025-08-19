########################
# KMS Keys for Encryption at Rest (Primary and Secondary Regions)
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
        Sid      = "Allow administration of the key",
        Effect   = "Allow",
        Principal = {
          AWS = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
        },
        Action   = ["kms:*"]
        Resource = "*"
      },
        {
          Sid      = "Allow CloudWatch Logs to use the key"
          Effect   = "Allow"
          Principal = {
            Service = "logs.us-east-1.amazonaws.com"
          }
          Action   = [
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
        Sid      = "Allow administration of the key",
        Effect   = "Allow",
        Principal = {
          AWS = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
        },
        Action   = ["kms:*"]
        Resource = "*"
      },
        {
          Sid      = "Allow CloudWatch Logs to use the key"
          Effect   = "Allow"
          Principal = {
            Service = "logs.us-west-2.amazonaws.com"
          }
          Action   = [
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

data "aws_caller_identity" "current" {}


output "primary_kms_key_arn" {
  description = "ARN of the primary KMS key"
  value       = aws_kms_key.primary.arn
}

output "secondary_kms_key_arn" {
  description = "ARN of the secondary KMS key"
  value       = aws_kms_key.secondary.arn
}