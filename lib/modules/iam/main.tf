# SAML Identity Provider (commented out - requires metadata file)
# resource "aws_iam_saml_provider" "main" {
#   name                   = "${var.project_name}-saml-provider-${var.environment}"
#   saml_metadata_document = file("${path.module}/saml-metadata.xml")
# }

# IAM Role for SAML Federation (commented out - requires SAML provider)
# resource "aws_iam_role" "saml_role" {
#   name = "${var.project_name}-saml-role-${var.environment}"
# 
#   assume_role_policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect = "Allow"
#         Principal = {
#           Federated = aws_iam_saml_provider.main.arn
#         }
#         Action = "sts:AssumeRoleWithSAML"
#         Condition = {
#           StringEquals = {
#             "SAML:aud" = "https://signin.aws.amazon.com/saml"
#           }
#         }
#       }
#     ]
#   })
# }

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

# ReadOnly Role (commented out - requires SAML provider)
# resource "aws_iam_role" "readonly_role" {
#   name = "${var.project_name}-readonly-role-${var.environment}"
# 
#   assume_role_policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect = "Allow"
#         Principal = {
#           Federated = aws_iam_saml_provider.main.arn
#         }
#         Action = "sts:AssumeRoleWithSAML"
#         Condition = {
#           StringEquals = {
#             "SAML:aud" = "https://signin.aws.amazon.com/saml"
#           }
#         }
#       }
#     ]
#   })
# }
# 
# resource "aws_iam_role_policy_attachment" "readonly_policy" {
#   role       = aws_iam_role.readonly_role.name
#   policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
# }

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
