# SAML Identity Provider (only create if metadata is provided)
resource "aws_iam_saml_provider" "main" {
  count                  = var.saml_metadata_document != "" ? 1 : 0
  name                   = "${var.project_name}-saml-provider-${var.environment}"
  saml_metadata_document = var.saml_metadata_document

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-saml-provider-${var.environment}"
    Type = "identity-provider"
  })
}

# IAM Role for SAML Federation (only create if SAML provider exists)
resource "aws_iam_role" "saml_role" {
  count = var.saml_metadata_document != "" ? 1 : 0
  name  = "${var.project_name}-saml-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_saml_provider.main[0].arn
        }
        Action = "sts:AssumeRoleWithSAML"
        Condition = {
          StringEquals = {
            "SAML:aud" = "https://signin.aws.amazon.com/saml"
          }
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-saml-role-${var.environment}"
    Type = "iam-role"
  })
}

# Attach MFA policy to SAML role
resource "aws_iam_role_policy_attachment" "saml_mfa_policy" {
  count      = var.saml_metadata_document != "" ? 1 : 0
  role       = aws_iam_role.saml_role[0].name
  policy_arn = aws_iam_policy.mfa_policy.arn
}

# IAM Policy requiring MFA
resource "aws_iam_policy" "mfa_policy" {
  name        = "${var.project_name}-mfa-policy-${var.environment}"
  description = "Policy requiring MFA for all actions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowViewAccountInfo"
        Effect = "Allow"
        Action = [
          "iam:GetAccountPasswordPolicy",
          "iam:GetAccountSummary",
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

# Admin Role with MFA requirement
resource "aws_iam_role" "admin_role" {
  name = "${var.project_name}-admin-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = "sts:AssumeRole"
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
          NumericLessThan = {
            "aws:MultiFactorAuthAge" = "3600"
          }
        }
      }
    ]
  })
}

# Attach policies to admin role
resource "aws_iam_role_policy_attachment" "admin_policy" {
  role       = aws_iam_role.admin_role.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

# ReadOnly Role for SAML Federation (only create if SAML provider exists)
resource "aws_iam_role" "readonly_role" {
  count = var.saml_metadata_document != "" ? 1 : 0
  name  = "${var.project_name}-readonly-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_saml_provider.main[0].arn
        }
        Action = "sts:AssumeRoleWithSAML"
        Condition = {
          StringEquals = {
            "SAML:aud" = "https://signin.aws.amazon.com/saml"
          }
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-readonly-role-${var.environment}"
    Type = "iam-role"
  })
}

resource "aws_iam_role_policy_attachment" "readonly_policy" {
  count      = var.saml_metadata_document != "" ? 1 : 0
  role       = aws_iam_role.readonly_role[0].name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

# Attach MFA policy to readonly role
resource "aws_iam_role_policy_attachment" "readonly_mfa_policy" {
  count      = var.saml_metadata_document != "" ? 1 : 0
  role       = aws_iam_role.readonly_role[0].name
  policy_arn = aws_iam_policy.mfa_policy.arn
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Password Policy
resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = 14
  require_lowercase_characters   = true
  require_numbers                = true
  require_uppercase_characters   = true
  require_symbols                = true
  allow_users_to_change_password = true
  max_password_age               = 90
  password_reuse_prevention      = 12
}
