data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# IAM Role for EC2 instances with least privilege
resource "aws_iam_role" "ec2_role" {
  name = "${var.environment}-ec2-role"

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

# IAM Policy for S3 access with least privilege
resource "aws_iam_policy" "s3_limited_access" {
  name        = "${var.environment}-s3-limited-access"
  description = "Limited S3 access policy following least privilege principle"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "${var.s3_bucket_arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          var.s3_bucket_arn
        ]
        Condition = {
          StringLike = {
            "s3:prefix" = [
              "${var.environment}/*"
            ]
          }
        }
      }
    ]
  })

  tags = var.tags
}

# IAM Policy for KMS access with least privilege
resource "aws_iam_policy" "kms_limited_access" {
  name        = "${var.environment}-kms-limited-access"
  description = "Limited KMS access policy following least privilege principle"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = var.kms_key_arns
        Condition = {
          StringEquals = {
            "kms:ViaService" = "s3.${data.aws_region.current.name}.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = var.tags
}

# CloudWatch Logs policy for application logging
resource "aws_iam_policy" "cloudwatch_logs" {
  name        = "${var.environment}-cloudwatch-logs"
  description = "CloudWatch Logs access for application logging"

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
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/ec2/${var.environment}*"
      }
    ]
  })

  tags = var.tags
}

# Attach policies to role
resource "aws_iam_role_policy_attachment" "s3_access" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.s3_limited_access.arn
}

resource "aws_iam_role_policy_attachment" "kms_access" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.kms_limited_access.arn
}

resource "aws_iam_role_policy_attachment" "cloudwatch_logs" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.cloudwatch_logs.arn
}

# Instance profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.environment}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = var.tags
}

# Validation: Check for overly permissive policies
resource "null_resource" "validate_iam_policies" {
  triggers = {
    s3_policy_hash = sha256(aws_iam_policy.s3_limited_access.policy)
    kms_policy_hash = sha256(aws_iam_policy.kms_limited_access.policy)
  }

  provisioner "local-exec" {
    command = "python3 ${path.root}/scripts/validate-iam.py --policy-arn ${aws_iam_policy.s3_limited_access.arn} --policy-arn ${aws_iam_policy.kms_limited_access.arn}"
  }

  depends_on = [
    aws_iam_policy.s3_limited_access,
    aws_iam_policy.kms_limited_access
  ]
}