# Main Terraform configuration file

# Data source to get current AWS account ID
data "aws_caller_identity" "current" {}

# Data source to get current AWS region
data "aws_region" "current" {}

# Create S3 bucket for Terraform state (if not exists)
module "s3_backend" {
  source = "./modules/s3-backend"

  bucket_name = "${var.project_name}-terraform-state-${random_id.bucket_suffix.hex}"
  aws_region  = var.aws_region
}

# Random ID for unique bucket naming
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# IAM Password Policy - Enforce strong passwords
resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = 12
  require_lowercase_characters   = true
  require_numbers                = true
  require_uppercase_characters   = true
  require_symbols                = true
  allow_users_to_change_password = true
  max_password_age               = 90
  password_reuse_prevention      = 5
}

# Create IAM policy for IP restriction
resource "aws_iam_policy" "ip_restriction" {
  name        = "${var.project_name}-ip-restriction-${terraform.workspace}"
  description = "Policy that restricts access to specific IP range"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Deny"
        Action   = "*"
        Resource = "*"
        Condition = {
          IpAddressIfExists = {
            "aws:SourceIp" = [var.allowed_ip_cidr]
          }
          Bool = {
            "aws:ViaAWSService" = "false"
          }
        }
      }
    ]
  })
}

# Create IAM policy for MFA enforcement
resource "aws_iam_policy" "force_mfa" {
  count = var.force_mfa ? 1 : 0

  name        = "${var.project_name}-force-mfa-${terraform.workspace}"
  description = "Policy that enforces MFA for all actions except MFA setup"

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

# Create IAM users using the module
module "iam_users" {
  source = "./modules/iam-users"

  users                     = var.iam_users
  project_name              = var.project_name
  environment               = terraform.workspace
  force_mfa                 = var.force_mfa
  ip_restriction_policy_arn = aws_iam_policy.ip_restriction.arn
  mfa_policy_arn            = var.force_mfa ? aws_iam_policy.force_mfa[0].arn : null
}

# Create IAM roles using the module
module "iam_roles" {
  source = "./modules/iam-roles"

  roles        = var.iam_roles
  project_name = var.project_name
  environment  = terraform.workspace
  account_id   = data.aws_caller_identity.current.account_id
}

# Create IAM groups with appropriate policies
resource "aws_iam_group" "developers" {
  name = "${var.project_name}-developers-${terraform.workspace}"
}

resource "aws_iam_group" "administrators" {
  name = "${var.project_name}-administrators-${terraform.workspace}"
}

# Attach policies to groups following least privilege principle
resource "aws_iam_group_policy_attachment" "developers_readonly" {
  group      = aws_iam_group.developers.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

resource "aws_iam_group_policy_attachment" "administrators_admin" {
  group      = aws_iam_group.administrators.name
  policy_arn = "arn:aws:iam::aws:policy/IAMFullAccess"
}

# Attach IP restriction policy to all groups
resource "aws_iam_group_policy_attachment" "developers_ip_restriction" {
  group      = aws_iam_group.developers.name
  policy_arn = aws_iam_policy.ip_restriction.arn
}

resource "aws_iam_group_policy_attachment" "administrators_ip_restriction" {
  group      = aws_iam_group.administrators.name
  policy_arn = aws_iam_policy.ip_restriction.arn
}

# Attach MFA policy to all groups if enabled
resource "aws_iam_group_policy_attachment" "developers_mfa" {
  count = var.force_mfa ? 1 : 0

  group      = aws_iam_group.developers.name
  policy_arn = aws_iam_policy.force_mfa[0].arn
}

resource "aws_iam_group_policy_attachment" "administrators_mfa" {
  count = var.force_mfa ? 1 : 0

  group      = aws_iam_group.administrators.name
  policy_arn = aws_iam_policy.force_mfa[0].arn
}


# Output values for the Terraform configuration

output "account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "region" {
  description = "AWS Region"
  value       = data.aws_region.current.id
}

output "environment" {
  description = "Current Terraform workspace"
  value       = terraform.workspace
}

output "created_users" {
  description = "List of created IAM users"
  value       = module.iam_users.user_names
}

output "created_roles" {
  description = "List of created IAM roles"
  value       = module.iam_roles.role_names
}

output "ip_restriction_policy_arn" {
  description = "ARN of the IP restriction policy"
  value       = aws_iam_policy.ip_restriction.arn
}

output "mfa_policy_arn" {
  description = "ARN of the MFA enforcement policy"
  value       = var.force_mfa ? aws_iam_policy.force_mfa[0].arn : null
}

output "s3_backend_bucket" {
  description = "S3 bucket for Terraform state"
  value       = module.s3_backend.bucket_name
}