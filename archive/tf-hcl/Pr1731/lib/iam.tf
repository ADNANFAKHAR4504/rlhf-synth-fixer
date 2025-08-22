variable "aws_region_primary" {
  description = "Primary AWS region for resource ARNs"
  type        = string
  default     = "us-east-1"
}

variable "aws_region_secondary" {
  description = "Secondary AWS region for resource ARNs"
  type        = string
  default     = "us-west-2"
}
########################
# IAM Roles and Policies (Least-Privilege, Explicit)
########################

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_log" {
  name = "${var.name_prefix}-${var.environment}-vpc-flow-log-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  tags = {
    Name = "${var.name_prefix}-${var.environment}-vpc-flow-log-role"
  }
}

resource "aws_iam_role_policy" "vpc_flow_log" {
  name = "${var.name_prefix}-${var.environment}-vpc-flow-log-policy"
  role = aws_iam_role.vpc_flow_log.id
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
        Resource = [
          "arn:aws:logs:${var.aws_region_primary}:*:*",
          "arn:aws:logs:${var.aws_region_secondary}:*:*"
        ]
      }
    ]
  })
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${var.name_prefix}-${var.environment}-lambda-role"
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
  tags = {
    Name = "${var.name_prefix}-${var.environment}-lambda-role"
  }
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.name_prefix}-${var.environment}-lambda-policy"
  role = aws_iam_role.lambda_role.id
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
        Resource = [
          "arn:aws:logs:${var.aws_region_primary}:*:*",
          "arn:aws:logs:${var.aws_region_secondary}:*:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [aws_kms_key.primary.arn, aws_kms_key.secondary.arn]
      }
    ]
  })
}

# IAM Role for EC2
resource "aws_iam_role" "ec2_role" {
  name = "${var.name_prefix}-${var.environment}-ec2-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  tags = {
    Name = "${var.name_prefix}-${var.environment}-ec2-role"
  }
}

resource "aws_iam_role_policy" "ec2_policy" {
  name = "${var.name_prefix}-${var.environment}-ec2-policy"
  role = aws_iam_role.ec2_role.id
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
        Resource = [
          "arn:aws:logs:${var.aws_region_primary}:*:*",
          "arn:aws:logs:${var.aws_region_secondary}:*:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [aws_kms_key.primary.arn, aws_kms_key.secondary.arn]
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.name_prefix}-${var.environment}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

output "lambda_role_name" {
  value = aws_iam_role.lambda_role.name
}
output "lambda_policy_name" {
  value = aws_iam_role_policy.lambda_policy.name
}