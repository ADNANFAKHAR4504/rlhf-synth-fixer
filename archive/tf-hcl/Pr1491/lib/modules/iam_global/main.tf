// IAM Global module: creates a role and least-privilege policy, attaches it

resource "aws_iam_role" "global_role" {
  name = "tap-stack-global-role-${var.resource_suffix}"

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

  tags = var.tags
}

resource "aws_iam_policy" "global_policy" {
  name        = "tap-stack-global-policy-${var.resource_suffix}"
  description = "Least privilege policy for tap stack resources"

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
          "${var.primary_bucket_arn}/*",
          "${var.secondary_bucket_arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          var.primary_table_arn,
          var.secondary_table_arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          var.primary_kms_key_arn,
          var.secondary_kms_key_arn
        ]
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "global_policy_attachment" {
  role       = aws_iam_role.global_role.name
  policy_arn = aws_iam_policy.global_policy.arn
}
