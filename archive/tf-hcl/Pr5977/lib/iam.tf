# IAM Role for Lambda Functions
resource "aws_iam_role" "lambda_execution" {
  name = "lambda-execution-role-${var.environment}-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "lambda-execution-role-${var.environment}-${var.environment_suffix}"
    }
  )
}

# IAM Policy for Lambda - CloudWatch Logs
resource "aws_iam_policy" "lambda_logging" {
  name        = "lambda-logging-policy-${var.environment}-${var.environment_suffix}"
  description = "IAM policy for Lambda CloudWatch logging"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.region}:*:*"
      },
      {
        Effect = "Deny"
        Action = [
          "logs:DeleteLogGroup",
          "logs:DeleteLogStream"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for Lambda - VPC Access
resource "aws_iam_policy" "lambda_vpc" {
  name        = "lambda-vpc-policy-${var.environment}-${var.environment_suffix}"
  description = "IAM policy for Lambda VPC access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for Lambda - S3 Access
resource "aws_iam_policy" "lambda_s3" {
  name        = "lambda-s3-policy-${var.environment}-${var.environment_suffix}"
  description = "IAM policy for Lambda S3 access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.transaction_logs.arn}/*",
          "${aws_s3_bucket.customer_documents.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.transaction_logs.arn,
          aws_s3_bucket.customer_documents.arn
        ]
      },
      {
        Effect = "Deny"
        Action = [
          "s3:DeleteBucket",
          "s3:DeleteBucketPolicy"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for Lambda - Secrets Manager Access
resource "aws_iam_policy" "lambda_secrets" {
  name        = "lambda-secrets-policy-${var.environment}-${var.environment_suffix}"
  description = "IAM policy for Lambda Secrets Manager access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.db_password.arn
      },
      {
        Effect = "Deny"
        Action = [
          "secretsmanager:DeleteSecret",
          "secretsmanager:PutSecretValue"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for Lambda - KMS Access
resource "aws_iam_policy" "lambda_kms" {
  name        = "lambda-kms-policy-${var.environment}-${var.environment_suffix}"
  description = "IAM policy for Lambda KMS access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.s3.arn,
          aws_kms_key.rds.arn
        ]
      }
    ]
  })

  tags = local.common_tags
}

# Attach policies to Lambda execution role
resource "aws_iam_role_policy_attachment" "lambda_logging" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_logging.arn
}

resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_vpc.arn
}

resource "aws_iam_role_policy_attachment" "lambda_s3" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_s3.arn
}

resource "aws_iam_role_policy_attachment" "lambda_secrets" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_secrets.arn
}

resource "aws_iam_role_policy_attachment" "lambda_kms" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_kms.arn
}