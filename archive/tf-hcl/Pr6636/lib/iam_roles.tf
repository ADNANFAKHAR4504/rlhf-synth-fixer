# SecurityAdmin IAM Role
resource "aws_iam_role" "security_admin" {
  name                 = "security-admin-${var.environment_suffix}"
  description          = "SecurityAdmin role with MFA enforcement"
  max_session_duration = 3600 # 1 hour
  permissions_boundary = aws_iam_policy.permission_boundary.arn

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AssumeRoleWithMFA"
        Effect = "Allow"
        Principal = {
          AWS = length(var.trusted_account_ids) > 0 ? [
            for account_id in var.trusted_account_ids : "arn:aws:iam::${account_id}:root"
          ] : ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
        }
        Action = "sts:AssumeRole"
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
          StringEquals = {
            "sts:ExternalId" = random_string.external_id.result
          }
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name        = "security-admin-${var.environment_suffix}"
      Role        = "SecurityAdmin"
      SessionName = "security-admin-session"
    }
  )
}

# DevOps IAM Role
resource "aws_iam_role" "devops" {
  name                 = "devops-${var.environment_suffix}"
  description          = "DevOps role with MFA enforcement"
  max_session_duration = 3600 # 1 hour
  permissions_boundary = aws_iam_policy.permission_boundary.arn

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AssumeRoleWithMFA"
        Effect = "Allow"
        Principal = {
          AWS = length(var.trusted_account_ids) > 0 ? [
            for account_id in var.trusted_account_ids : "arn:aws:iam::${account_id}:root"
          ] : ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
        }
        Action = "sts:AssumeRole"
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
          StringEquals = {
            "sts:ExternalId" = random_string.external_id.result
          }
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name        = "devops-${var.environment_suffix}"
      Role        = "DevOps"
      SessionName = "devops-session"
    }
  )
}

# Auditor IAM Role
resource "aws_iam_role" "auditor" {
  name                 = "auditor-${var.environment_suffix}"
  description          = "Auditor role with MFA enforcement and read-only access"
  max_session_duration = 3600 # 1 hour
  permissions_boundary = aws_iam_policy.permission_boundary.arn

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AssumeRoleWithMFA"
        Effect = "Allow"
        Principal = {
          AWS = length(var.trusted_account_ids) > 0 ? [
            for account_id in var.trusted_account_ids : "arn:aws:iam::${account_id}:root"
          ] : ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
        }
        Action = "sts:AssumeRole"
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
          StringEquals = {
            "sts:ExternalId" = random_string.external_id.result
          }
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name        = "auditor-${var.environment_suffix}"
      Role        = "Auditor"
      SessionName = "auditor-session"
    }
  )
}
