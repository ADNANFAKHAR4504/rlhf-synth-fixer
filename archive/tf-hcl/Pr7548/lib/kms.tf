# KMS key for Lambda environment variables
resource "aws_kms_key" "lambda_env" {
  description             = "KMS key for Lambda environment variables encryption - ${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name = "lambda-env-key-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "lambda_env" {
  name          = "alias/lambda-env-${var.environment_suffix}"
  target_key_id = aws_kms_key.lambda_env.key_id
}

# KMS key for CloudWatch Logs
resource "aws_kms_key" "cloudwatch_logs" {
  description             = "KMS key for CloudWatch Logs encryption - ${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:${data.aws_partition.current.partition}:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      }
    ]
  })

  tags = {
    Name = "cloudwatch-logs-key-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "cloudwatch_logs" {
  name          = "alias/cloudwatch-logs-${var.environment_suffix}"
  target_key_id = aws_kms_key.cloudwatch_logs.key_id
}
