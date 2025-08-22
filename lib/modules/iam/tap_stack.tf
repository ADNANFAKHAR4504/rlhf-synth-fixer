variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
}

variable "random_prefix" {
  description = "Random prefix for unique resource naming"
  type        = string
  default     = ""
}


# EC2 Instance Role
resource "aws_iam_role" "ec2_role" {
  name = var.random_prefix != "" ? "${var.random_prefix}-ec2-role" : "${var.common_tags.Environment}-ec2-role"

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

  tags = var.common_tags
}

# EC2 Instance Policy
resource "aws_iam_policy" "ec2_policy" {
  name        = var.random_prefix != "" ? "${var.random_prefix}-ec2-policy" : "${var.common_tags.Environment}-ec2-policy"
  description = "Policy for EC2 instances with least privilege access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.common_tags.Environment}-*",
          "arn:aws:s3:::${var.common_tags.Environment}-*/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = "arn:aws:secretsmanager:*:*:secret:${var.common_tags.Environment}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })

  tags = var.common_tags
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "ec2_policy_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_policy.arn
}

# Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = var.random_prefix != "" ? "${var.random_prefix}-ec2-profile" : "${var.common_tags.Environment}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = var.common_tags
}

# CloudTrail Role
resource "aws_iam_role" "cloudtrail_role" {
  name = var.random_prefix != "" ? "${var.random_prefix}-cloudtrail-role" : "${var.common_tags.Environment}-cloudtrail-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
      }
    ]
  })

  tags = var.common_tags
}

# CloudTrail Policy
resource "aws_iam_policy" "cloudtrail_policy" {
  name        = var.random_prefix != "" ? "${var.random_prefix}-cloudtrail-policy" : "${var.common_tags.Environment}-cloudtrail-policy"
  description = "Policy for CloudTrail logging"

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
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })

  tags = var.common_tags
}

resource "aws_iam_role_policy_attachment" "cloudtrail_policy_attachment" {
  role       = aws_iam_role.cloudtrail_role.name
  policy_arn = aws_iam_policy.cloudtrail_policy.arn
}

# Outputs
output "ec2_instance_role_arn" {
  description = "ARN of the EC2 instance role"
  value       = aws_iam_role.ec2_role.arn
}

output "ec2_instance_role_name" {
  description = "Name of the EC2 instance role"
  value       = aws_iam_role.ec2_role.name
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "ec2_instance_profile_arn" {
  description = "ARN of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.arn
}

output "cloudtrail_role_arn" {
  description = "ARN of the CloudTrail role"
  value       = aws_iam_role.cloudtrail_role.arn
}
