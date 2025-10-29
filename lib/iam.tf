# iam.tf - IAM roles, policies, and permission boundaries

# Password policy for the account
resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = 14
  require_uppercase_characters   = true
  require_lowercase_characters   = true
  require_numbers                = true
  require_symbols                = true
  allow_users_to_change_password = true
  max_password_age               = 90
  password_reuse_prevention      = 24
  hard_expiry                    = false
}

# Permission boundary for developers
resource "aws_iam_policy" "developer_permission_boundary" {
  name        = "${local.name_prefix}-developer-permission-boundary"
  description = "Permission boundary for developer roles to prevent privilege escalation"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowViewAccountInfo"
        Effect = "Allow"
        Action = [
          "iam:GetAccountPasswordPolicy",
          "iam:ListUsers",
          "iam:ListRoles"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowManageOwnAccessKeys"
        Effect = "Allow"
        Action = [
          "iam:CreateAccessKey",
          "iam:DeleteAccessKey",
          "iam:ListAccessKeys",
          "iam:UpdateAccessKey"
        ]
        Resource = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:user/$${aws:username}"
      },
      {
        Sid    = "DenyAdminActions"
        Effect = "Deny"
        Action = [
          "iam:CreateRole",
          "iam:DeleteRole",
          "iam:AttachRolePolicy",
          "iam:DetachRolePolicy",
          "iam:PutRolePolicy",
          "iam:DeleteRolePolicy",
          "iam:CreatePolicyVersion",
          "iam:DeletePolicy",
          "iam:CreateUser",
          "iam:DeleteUser",
          "iam:AttachUserPolicy",
          "iam:DetachUserPolicy",
          "organizations:*",
          "account:*"
        ]
        Resource = "*"
      },
      {
        Sid    = "DenyPermissionBoundaryDeletion"
        Effect = "Deny"
        Action = [
          "iam:DeleteRolePermissionsBoundary",
          "iam:DeleteUserPermissionsBoundary"
        ]
        Resource = "*"
      }
    ]
  })
}

# Trust policy for assuming roles with MFA
data "aws_iam_policy_document" "assume_role_with_mfa" {
  statement {
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }

    actions = ["sts:AssumeRole"]

    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }

    condition {
      test     = "NumericLessThan"
      variable = "aws:MultiFactorAuthAge"
      values   = ["3600"] # MFA must be used within last hour
    }
  }
}

# Developer role
resource "aws_iam_role" "developer" {
  name                 = "${local.name_prefix}-developer-role"
  assume_role_policy   = data.aws_iam_policy_document.assume_role_with_mfa.json
  permissions_boundary = aws_iam_policy.developer_permission_boundary.arn
  max_session_duration = 14400 # 4 hours

  tags = local.mandatory_tags
}

# Developer policy
resource "aws_iam_policy" "developer_policy" {
  name        = "${local.name_prefix}-developer-policy"
  description = "Policy for developer role with restricted permissions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EC2ReadOnly"
        Effect = "Allow"
        Action = [
          "ec2:Describe*",
          "ec2:List*",
          "ec2:Get*"
        ]
        Resource = "*"
      },
      {
        Sid    = "EC2ManageOwnInstances"
        Effect = "Allow"
        Action = [
          "ec2:StartInstances",
          "ec2:StopInstances",
          "ec2:RebootInstances",
          "ec2:TerminateInstances"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestedRegion"   = var.allowed_regions
            "ec2:ResourceTag/Owner" = "$${aws:username}"
          }
        }
      },
      {
        Sid    = "S3ListBuckets"
        Effect = "Allow"
        Action = [
          "s3:ListAllMyBuckets",
          "s3:GetBucketLocation"
        ]
        Resource = "*"
      },
      {
        Sid    = "S3DevBucketAccess"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "arn:aws:s3:::${local.name_prefix}-dev-*",
          "arn:aws:s3:::${local.name_prefix}-dev-*/*"
        ]
        Condition = {
          StringEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid      = "RequireEncryption"
        Effect   = "Deny"
        Action   = "s3:PutObject"
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:${data.aws_caller_identity.current.account_id}:log-group:/aws/application/${local.name_prefix}-*"
      }
    ]
  })
}

# Attach policy to developer role
resource "aws_iam_role_policy_attachment" "developer_policy" {
  role       = aws_iam_role.developer.name
  policy_arn = aws_iam_policy.developer_policy.arn
}

# Operations role
resource "aws_iam_role" "operations" {
  name                 = "${local.name_prefix}-operations-role"
  assume_role_policy   = data.aws_iam_policy_document.assume_role_with_mfa.json
  max_session_duration = 28800 # 8 hours

  tags = local.mandatory_tags
}

# Operations policy
resource "aws_iam_policy" "operations_policy" {
  name        = "${local.name_prefix}-operations-policy"
  description = "Policy for operations role with production access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EC2Management"
        Effect = "Allow"
        Action = [
          "ec2:*"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = var.allowed_regions
          }
          StringNotEquals = {
            "ec2:InstanceType" = var.prohibited_instance_types
          }
        }
      },
      {
        Sid    = "RDSManagement"
        Effect = "Allow"
        Action = [
          "rds:Describe*",
          "rds:List*",
          "rds:CreateDBSnapshot",
          "rds:RestoreDBInstanceFromDBSnapshot",
          "rds:ModifyDBInstance",
          "rds:RebootDBInstance"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = var.allowed_regions
          }
        }
      },
      {
        Sid    = "S3Management"
        Effect = "Allow"
        Action = [
          "s3:*"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "private"
          }
        }
      },
      {
        Sid      = "DenyUnencryptedUploads"
        Effect   = "Deny"
        Action   = "s3:PutObject"
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid    = "CloudWatchFullAccess"
        Effect = "Allow"
        Action = [
          "cloudwatch:*",
          "logs:*"
        ]
        Resource = "*"
      },
      {
        Sid    = "SystemsManagerAccess"
        Effect = "Allow"
        Action = [
          "ssm:*",
          "ssmmessages:*",
          "ec2messages:*"
        ]
        Resource = "*"
      },
      {
        Sid    = "KMSUsage"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey",
          "kms:ListKeys",
          "kms:ListAliases"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = [
              "s3.${var.allowed_regions[0]}.amazonaws.com",
              "s3.${var.allowed_regions[1]}.amazonaws.com",
              "rds.${var.allowed_regions[0]}.amazonaws.com",
              "rds.${var.allowed_regions[1]}.amazonaws.com"
            ]
          }
        }
      }
    ]
  })
}

# Attach policy to operations role
resource "aws_iam_role_policy_attachment" "operations_policy" {
  role       = aws_iam_role.operations.name
  policy_arn = aws_iam_policy.operations_policy.arn
}

# Security team role
resource "aws_iam_role" "security" {
  name                 = "${local.name_prefix}-security-role"
  assume_role_policy   = data.aws_iam_policy_document.assume_role_with_mfa.json
  max_session_duration = 43200 # 12 hours

  tags = local.mandatory_tags
}

# Security team policy
resource "aws_iam_policy" "security_policy" {
  name        = "${local.name_prefix}-security-policy"
  description = "Policy for security team with audit and compliance capabilities"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SecurityAuditAccess"
        Effect = "Allow"
        Action = [
          "access-analyzer:*",
          "cloudtrail:LookupEvents",
          "cloudtrail:GetTrailStatus",
          "cloudtrail:DescribeTrails",
          "cloudtrail:GetEventSelectors",
          "cloudtrail:ListTags",
          "cloudwatch:Describe*",
          "cloudwatch:Get*",
          "cloudwatch:List*",
          "config:Describe*",
          "config:Get*",
          "config:List*",
          "guardduty:Get*",
          "guardduty:List*",
          "iam:GenerateCredentialReport",
          "iam:GetCredentialReport",
          "iam:List*",
          "iam:GetAccountAuthorizationDetails",
          "iam:GetAccountPasswordPolicy",
          "iam:GetAccountSummary",
          "iam:GetLoginProfile",
          "iam:GetRole",
          "iam:GetRolePolicy",
          "iam:GetUser",
          "iam:GetUserPolicy",
          "inspector:*",
          "securityhub:*",
          "ssm:GetComplianceSummary",
          "ssm:ListComplianceItems",
          "ssm:ListAssociations",
          "ssm:DescribeInstanceInformation",
          "trustedadvisor:*"
        ]
        Resource = "*"
      },
      {
        Sid    = "KMSKeyManagement"
        Effect = "Allow"
        Action = [
          "kms:CreateGrant",
          "kms:CreateKey",
          "kms:DescribeKey",
          "kms:EnableKeyRotation",
          "kms:GetKeyPolicy",
          "kms:GetKeyRotationStatus",
          "kms:ListKeys",
          "kms:ListAliases",
          "kms:ListGrants",
          "kms:ListKeyPolicies",
          "kms:PutKeyPolicy",
          "kms:ScheduleKeyDeletion",
          "kms:CancelKeyDeletion"
        ]
        Resource = "*"
      },
      {
        Sid    = "ConfigRuleManagement"
        Effect = "Allow"
        Action = [
          "config:PutConfigRule",
          "config:DeleteConfigRule",
          "config:PutConfigurationRecorder",
          "config:PutDeliveryChannel"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach policy to security role
resource "aws_iam_role_policy_attachment" "security_policy" {
  role       = aws_iam_role.security.name
  policy_arn = aws_iam_policy.security_policy.arn
}

# Attach AWS managed SecurityAudit policy
resource "aws_iam_role_policy_attachment" "security_audit" {
  role       = aws_iam_role.security.name
  policy_arn = "arn:aws:iam::aws:policy/SecurityAudit"
}