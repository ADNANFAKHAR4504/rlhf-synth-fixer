# EC2 Instance Role
resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}-ec2-role"

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
    Name        = "${var.project_name}-ec2-role"
    Environment = var.environment
  }
}

# CloudWatch Logs Policy
resource "aws_iam_role_policy" "ec2_cloudwatch_logs" {
  name = "${var.project_name}-ec2-cloudwatch-logs"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      }
    ]
  })
}

# S3 Access Policy for Logs
resource "aws_iam_role_policy" "ec2_s3_logs" {
  name = "${var.project_name}-ec2-s3-logs"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.logs.arn,
          "${aws_s3_bucket.logs.arn}/*"
        ]
      }
    ]
  })
}

# KMS Policy - Removed since using AWS default encryption
# EBS: Uses AWS-managed default key
# S3: Uses SSE-S3 (AES256)
# If you need KMS access in the future, uncomment and update this policy
# resource "aws_iam_role_policy" "ec2_kms" {
#   name = "${var.project_name}-ec2-kms"
#   role = aws_iam_role.ec2_role.id
#
#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect = "Allow"
#         Action = [
#           "kms:CreateGrant",
#           "kms:Decrypt",
#           "kms:DescribeKey",
#           "kms:GenerateDataKey",
#           "kms:GenerateDataKeyWithoutPlaintext",
#           "kms:ReEncrypt*"
#         ]
#         Resource = ["*"]
#       }
#     ]
#   })
# }

# CloudWatch Metrics Policy
resource "aws_iam_role_policy" "ec2_cloudwatch_metrics" {
  name = "${var.project_name}-ec2-cloudwatch-metrics"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricData",
          "cloudwatch:ListMetrics"
        ]
        Resource = "*"
      }
    ]
  })
}

# Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

