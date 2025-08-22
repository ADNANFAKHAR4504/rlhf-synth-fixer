# Main Terraform configuration file


# Data source to get current AWS account ID
data "aws_caller_identity" "current" {}

# Data source to get current AWS region
data "aws_region" "current" {}

# Create S3 bucket for Terraform state (if not exists)
# modules/s3-backend/vars.tf (inlined via root variables: bucket_name, aws_region)
# modules/s3-backend/main.tf (inlined)
# S3 backend module for Terraform state management
# This inlines the original module implementation to avoid separate module usage.
# It creates an encrypted, versioned S3 bucket and a DynamoDB table for state locking.
resource "aws_s3_bucket" "terraform_state" {
  bucket = "${var.project_name}-terraform-state-${random_id.bucket_suffix.hex}"
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "terraform_state_lock" {
  name         = "${var.project_name}-terraform-state-${random_id.bucket_suffix.hex}-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name = "Terraform State Lock Table"
  }
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
# modules/iam-users/main.tf (inlined)
# IAM Users module with MFA enforcement
resource "aws_iam_user" "users" {
  for_each = { for user in var.iam_users : user.username => user }

  name          = each.value.username
  force_destroy = true

  tags = {
    Name        = each.value.username
    Environment = terraform.workspace
    Project     = var.project_name
  }
}

# Add users to their respective groups
resource "aws_iam_user_group_membership" "user_groups" {
  for_each = { for user in var.iam_users : user.username => user }

  user   = aws_iam_user.users[each.key].name
  groups = [for group in each.value.groups : "${var.project_name}-${group}-${terraform.workspace}"]
}

# Create access keys for users (optional)
resource "aws_iam_access_key" "user_keys" {
  for_each = { for user in var.iam_users : user.username => user }

  user = aws_iam_user.users[each.key].name
}

# Attach IP restriction policy to users
resource "aws_iam_user_policy_attachment" "ip_restriction" {
  for_each = { for user in var.iam_users : user.username => user }

  user       = aws_iam_user.users[each.key].name
  policy_arn = aws_iam_policy.ip_restriction.arn
}

# Attach MFA policy to users if enabled
resource "aws_iam_user_policy_attachment" "mfa_policy" {
  for_each = var.force_mfa ? { for user in var.iam_users : user.username => user } : {}

  user       = aws_iam_user.users[each.key].name
  policy_arn = aws_iam_policy.force_mfa[0].arn
}

# Create IAM roles using the module
# modules/iam-roles/main.tf (inlined)
# Data source for assume role policies
data "aws_iam_policy_document" "assume_role" {
  for_each = { for role in var.iam_roles : role.name => role }

  statement {
    effect = "Allow"

    principals {
      type = each.value.assume_role_policy == "ec2" ? "Service" : "AWS"
      identifiers = each.value.assume_role_policy == "ec2" ? [
        "ec2.amazonaws.com"
        ] : [
        "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
      ]
    }

    actions = ["sts:AssumeRole"]
  }
}

# Create IAM roles
resource "aws_iam_role" "roles" {
  for_each = { for role in var.iam_roles : role.name => role }

  name               = "${var.project_name}-${each.value.name}-${terraform.workspace}"
  description        = each.value.description
  assume_role_policy = data.aws_iam_policy_document.assume_role[each.key].json

  tags = {
    Name        = each.value.name
    Environment = terraform.workspace
    Project     = var.project_name
  }
}

# Attach managed policies to roles
resource "aws_iam_role_policy_attachment" "role_policies" {
  for_each = {
    for pair in flatten([
      for role_key, role in { for r in var.iam_roles : r.name => r } : [
        for policy in role.managed_policies : {
          role_key   = role_key
          policy_arn = policy
          key        = "${role_key}-${policy}"
        }
      ]
    ]) : pair.key => pair
  }

  role       = aws_iam_role.roles[each.value.role_key].name
  policy_arn = each.value.policy_arn
}

# Create instance profiles for EC2 roles
resource "aws_iam_instance_profile" "role_profiles" {
  for_each = {
    for role in var.iam_roles : role.name => role
    if role.assume_role_policy == "ec2"
  }

  name = "${var.project_name}-${each.value.name}-profile-${terraform.workspace}"
  role = aws_iam_role.roles[each.key].name
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
  # modules/iam-users/outputs.tf -> user_names
  value = [for user in aws_iam_user.users : user.name]
}

output "created_roles" {
  description = "List of created IAM roles"
  # modules/iam-roles/outputs.tf -> role_names
  value = [for role in aws_iam_role.roles : role.name]
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
  # modules/s3-backend/outputs.tf -> bucket_name
  value = aws_s3_bucket.terraform_state.bucket
}