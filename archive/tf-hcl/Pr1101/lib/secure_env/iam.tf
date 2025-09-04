# Random ID for unique resource naming
resource "random_id" "resource_suffix" {
  byte_length = 4

  keepers = {
    # Change the suffix when Terraform configuration changes
    timestamp = timestamp()
  }
}

# IAM role for cross-account access with least privilege
resource "aws_iam_role" "cross_account_role" {
  name = "SecureCrossAccountRole-${local.env_suffix}"

  # Trust policy allowing the specified account to assume this role
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          "AWS" : "arn:aws:iam::${var.trusted_account_id}:root"
        }
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "secure-environment-access"
          }
          IpAddress = {
            "aws:SourceIp" = var.allowed_cidr_blocks
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "cross-account-access-role"
    Type = "IAMRole"
  })
}

# Least privilege policy for the cross-account role
resource "aws_iam_policy" "cross_account_policy" {
  name        = "SecureCrossAccountPolicy-${local.env_suffix}"
  description = "Least privilege policy for cross-account access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ReadOnlyEC2Access"
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeInstanceStatus",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeVpcs",
          "ec2:DescribeSubnets"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = data.aws_region.current.name
          }
        }
      },
      {
        Sid    = "LimitedS3Access"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::secure-environment-*",
          "arn:aws:s3:::secure-environment-*/*"
        ]
      },
      {
        Sid    = "CloudWatchLogsRead"
        Effect = "Allow"
        Action = [
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:GetLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/ec2/secure-environment*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "cross-account-access-policy"
    Type = "IAMPolicy"
  })
}

# Attach the policy to the role
resource "aws_iam_role_policy_attachment" "cross_account_attachment" {
  role       = aws_iam_role.cross_account_role.name
  policy_arn = aws_iam_policy.cross_account_policy.arn
}

# IAM role for EC2 instance
resource "aws_iam_role" "ec2_role" {
  name = "SecureEC2Role-${local.env_suffix}"

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

  tags = merge(local.common_tags, {
    Name = "secure-ec2-role"
    Type = "IAMRole"
  })
}

# Instance profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "SecureEC2Profile-${local.env_suffix}"
  role = aws_iam_role.ec2_role.name

  tags = merge(local.common_tags, {
    Name = "secure-ec2-instance-profile"
    Type = "IAMInstanceProfile"
  })
}
