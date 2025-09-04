data "aws_region" "current" {}


# IAM role for application access with least privilege
resource "aws_iam_role" "app_role" {
  name = "${var.environment}-${var.service}-${var.resource}-role-hclrlhf"

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

# IAM policy for S3 read-only access
resource "aws_iam_policy" "s3_read_policy" {
  name        = "${var.environment}-${var.service}-s3-read-policy-hclrlhf"
  description = "Policy for S3 read access in ${var.environment} environment"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = "${var.s3_bucket_arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = var.s3_bucket_arn
      }
    ]
  })

  tags = var.tags
}

# IAM policy for CloudWatch logs
resource "aws_iam_policy" "cloudwatch_logs_policy" {
  name        = "${var.environment}-${var.service}-cloudwatch-logs-policy-hclrlhf"
  description = "Policy for CloudWatch logs access in ${var.environment} environment"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams",
          "logs:DescribeLogGroups"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
      }
    ]
  })

  tags = var.tags
}

# Attach policies to role
resource "aws_iam_role_policy_attachment" "s3_read_attachment" {
  role       = aws_iam_role.app_role.name
  policy_arn = aws_iam_policy.s3_read_policy.arn
}

resource "aws_iam_role_policy_attachment" "cloudwatch_logs_attachment" {
  role       = aws_iam_role.app_role.name
  policy_arn = aws_iam_policy.cloudwatch_logs_policy.arn
}

# Instance profile for EC2 instances
resource "aws_iam_instance_profile" "app_profile" {
  name = "${var.environment}-${var.service}-${var.resource}-profile-hclrlhf"
  role = aws_iam_role.app_role.name

  tags = var.tags
}

# IAM user for programmatic access (if needed)
resource "aws_iam_user" "app_user" {
  name = "${var.environment}-${var.service}-${var.resource}-user-hclrlhf"
  path = "/"

  tags = var.tags
}

# Attach policies to user
resource "aws_iam_user_policy_attachment" "user_s3_read_attachment" {
  user       = aws_iam_user.app_user.name
  policy_arn = aws_iam_policy.s3_read_policy.arn
}

# Data source for current AWS account ID
data "aws_caller_identity" "current" {}