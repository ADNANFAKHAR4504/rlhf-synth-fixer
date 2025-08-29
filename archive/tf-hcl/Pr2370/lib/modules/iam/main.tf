# Data source for current AWS account
data "aws_caller_identity" "current" {}

# IAM Policy for S3 Read-Only Access
resource "aws_iam_policy" "s3_read_only" {
  name        = "${var.project_name}-S3ReadOnly-${var.environment}"
  description = "Read-only access to specific S3 services"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [
          "arn:aws:s3:::${lower(var.project_name)}-*",
          "arn:aws:s3:::${lower(var.project_name)}-*/*"
        ]
      }
    ]
  })
}

# IAM Role for EC2 with S3 Read-Only Access
resource "aws_iam_role" "ec2_s3_readonly" {
  name = "${var.project_name}-EC2-S3ReadOnly-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
        }
      }
    ]
  })
}

# Attach S3 Read-Only Policy to Role
resource "aws_iam_role_policy_attachment" "ec2_s3_readonly" {
  role       = aws_iam_role.ec2_s3_readonly.name
  policy_arn = aws_iam_policy.s3_read_only.arn
}

# Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2_s3_readonly" {
  name = "${var.project_name}-EC2-S3ReadOnly-${var.environment}"
  role = aws_iam_role.ec2_s3_readonly.name
}

# IAM Policy for Terraform Operations
resource "aws_iam_policy" "terraform_policy" {
  name        = "${var.project_name}-TerraformPolicy-${var.environment}"
  description = "Policy for Terraform stack creation and management"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:*",
          "vpc:*",
          "iam:*",
          "s3:*",
          "kms:*",
          "cloudtrail:*",
          "cloudwatch:*",
          "logs:*",
          "guardduty:*",
          "config:*",
          "sns:*",
          "sts:GetCallerIdentity"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM User for Terraform
resource "aws_iam_user" "terraform_user" {
  name = "${var.project_name}-TerraformUser-${var.environment}"
  path = "/"

  tags = {
    Name        = "${var.project_name}-TerraformUser-${var.environment}"
    Description = "User for Terraform stack creation"
  }
}

# Attach Terraform Policy to User
resource "aws_iam_user_policy_attachment" "terraform_user_policy" {
  user       = aws_iam_user.terraform_user.name
  policy_arn = aws_iam_policy.terraform_policy.arn
}

# MFA Policy for Console Access
resource "aws_iam_policy" "mfa_policy" {
  name        = "${var.project_name}-MFAPolicy-${var.environment}"
  description = "Enforce MFA for console access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowViewAccountInfo"
        Effect = "Allow"
        Action = [
          "iam:GetAccountPasswordPolicy",
          "iam:ListVirtualMFADevices"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowManageOwnPasswords"
        Effect = "Allow"
        Action = [
          "iam:ChangePassword",
          "iam:GetUser"
        ]
        Resource = "arn:aws:iam::*:user/$${aws:username}"
      },
      {
        Sid    = "AllowManageOwnMFA"
        Effect = "Allow"
        Action = [
          "iam:CreateVirtualMFADevice",
          "iam:DeleteVirtualMFADevice",
          "iam:ListMFADevices",
          "iam:EnableMFADevice",
          "iam:ResyncMFADevice"
        ]
        Resource = [
          "arn:aws:iam::*:mfa/$${aws:username}",
          "arn:aws:iam::*:user/$${aws:username}"
        ]
      },
      {
        Sid    = "DenyAllExceptUnlessSignedInWithMFA"
        Effect = "Deny"
        NotAction = [
          "iam:CreateVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:GetUser",
          "iam:ListMFADevices",
          "iam:ListVirtualMFADevices",
          "iam:ResyncMFADevice",
          "sts:GetSessionToken"
        ]
        Resource = "*"
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      }
    ]
  })
}

# Attach MFA Policy to all roles that need console access
resource "aws_iam_role_policy_attachment" "ec2_mfa_policy" {
  role       = aws_iam_role.ec2_s3_readonly.name
  policy_arn = aws_iam_policy.mfa_policy.arn
}