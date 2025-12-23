# SecurityAdmin Policy with time-based restrictions
resource "aws_iam_policy" "security_admin" {
  name        = "security-admin-policy-${var.environment_suffix}"
  description = "SecurityAdmin policy with business hours restrictions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowSecurityOperationsDuringBusinessHours"
        Effect = "Allow"
        Action = [
          "iam:*",
          "kms:*",
          "logs:*",
          "sts:*"
        ]
        Resource = "*"
      },
      {
        Sid    = "DenySensitiveOperationsOutsideBusinessHours"
        Effect = "Deny"
        Action = [
          "iam:DeleteRole",
          "iam:DeleteRolePolicy",
          "iam:DeletePolicy",
          "iam:DeleteUser",
          "kms:ScheduleKeyDeletion",
          "kms:DisableKey"
        ]
        Resource = "*"
        Condition = {
          DateLessThan = {
            "aws:CurrentTime" = "2024-01-01T14:00:00Z" # Before 9 AM EST
          }
        }
      },
      {
        Sid    = "DenySensitiveOperationsAfterBusinessHours"
        Effect = "Deny"
        Action = [
          "iam:DeleteRole",
          "iam:DeleteRolePolicy",
          "iam:DeletePolicy",
          "iam:DeleteUser",
          "kms:ScheduleKeyDeletion",
          "kms:DisableKey"
        ]
        Resource = "*"
        Condition = {
          DateGreaterThan = {
            "aws:CurrentTime" = "2024-01-01T23:00:00Z" # After 6 PM EST
          }
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "security-admin-policy-${var.environment_suffix}"
    }
  )
}

resource "aws_iam_role_policy_attachment" "security_admin" {
  role       = aws_iam_role.security_admin.name
  policy_arn = aws_iam_policy.security_admin.arn
}

# DevOps Policy with time-based restrictions
resource "aws_iam_policy" "devops" {
  name        = "devops-policy-${var.environment_suffix}"
  description = "DevOps policy with business hours restrictions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowDevOpsOperationsDuringBusinessHours"
        Effect = "Allow"
        Action = [
          "ec2:*",
          "s3:*",
          "rds:*",
          "ecs:*",
          "cloudwatch:*",
          "logs:*",
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "DenySensitiveOperationsOutsideBusinessHours"
        Effect = "Deny"
        Action = [
          "rds:DeleteDBInstance",
          "rds:DeleteDBCluster",
          "ec2:TerminateInstances",
          "s3:DeleteBucket"
        ]
        Resource = "*"
        Condition = {
          DateLessThan = {
            "aws:CurrentTime" = "2024-01-01T14:00:00Z" # Before 9 AM EST
          }
        }
      },
      {
        Sid    = "DenySensitiveOperationsAfterBusinessHours"
        Effect = "Deny"
        Action = [
          "rds:DeleteDBInstance",
          "rds:DeleteDBCluster",
          "ec2:TerminateInstances",
          "s3:DeleteBucket"
        ]
        Resource = "*"
        Condition = {
          DateGreaterThan = {
            "aws:CurrentTime" = "2024-01-01T23:00:00Z" # After 6 PM EST
          }
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "devops-policy-${var.environment_suffix}"
    }
  )
}

resource "aws_iam_role_policy_attachment" "devops" {
  role       = aws_iam_role.devops.name
  policy_arn = aws_iam_policy.devops.arn
}

# Auditor Policy - Read-only access
resource "aws_iam_policy" "auditor" {
  name        = "auditor-policy-${var.environment_suffix}"
  description = "Auditor read-only policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowReadOnlyAccess"
        Effect = "Allow"
        Action = [
          "iam:Get*",
          "iam:List*",
          "kms:Describe*",
          "kms:Get*",
          "kms:List*",
          "logs:Describe*",
          "logs:Get*",
          "logs:FilterLogEvents",
          "cloudtrail:LookupEvents",
          "cloudtrail:Get*",
          "cloudtrail:Describe*"
        ]
        Resource = "*"
      },
      {
        Sid    = "DenyAllWriteOperations"
        Effect = "Deny"
        NotAction = [
          "iam:Get*",
          "iam:List*",
          "kms:Describe*",
          "kms:Get*",
          "kms:List*",
          "logs:Describe*",
          "logs:Get*",
          "logs:FilterLogEvents"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "auditor-policy-${var.environment_suffix}"
    }
  )
}

resource "aws_iam_role_policy_attachment" "auditor" {
  role       = aws_iam_role.auditor.name
  policy_arn = aws_iam_policy.auditor.arn
}
