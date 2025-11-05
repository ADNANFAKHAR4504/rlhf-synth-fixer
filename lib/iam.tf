# EC2 IAM Role
resource "aws_iam_role" "ec2" {
  name_prefix = "ec2-role-${var.environment_suffix}-"

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
    Name = "ec2-role-${var.environment_suffix}"
  }
}

# S3 Access Policy
resource "aws_iam_role_policy" "s3_access" {
  name_prefix = "s3-access-${var.environment_suffix}-"
  role        = aws_iam_role.ec2.id

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
        Resource = [
          aws_s3_bucket.static_assets.arn,
          "${aws_s3_bucket.static_assets.arn}/*"
        ]
      }
    ]
  })
}

# CloudWatch Logs Policy
resource "aws_iam_role_policy" "cloudwatch_logs" {
  name_prefix = "cloudwatch-logs-${var.environment_suffix}-"
  role        = aws_iam_role.ec2.id

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
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/ec2/*"
      }
    ]
  })
}

# CloudWatch Metrics Policy
resource "aws_iam_role_policy" "cloudwatch_metrics" {
  name_prefix = "cloudwatch-metrics-${var.environment_suffix}-"
  role        = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "cloudwatch:namespace" = "ECommerce/Application"
          }
        }
      }
    ]
  })
}

# Instance Profile
resource "aws_iam_instance_profile" "ec2" {
  name_prefix = "ec2-profile-${var.environment_suffix}-"
  role        = aws_iam_role.ec2.name

  tags = {
    Name = "ec2-profile-${var.environment_suffix}"
  }
}
