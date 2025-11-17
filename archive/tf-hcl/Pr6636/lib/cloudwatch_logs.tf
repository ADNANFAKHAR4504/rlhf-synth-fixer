# CloudWatch Log Group for IAM activity
resource "aws_cloudwatch_log_group" "iam_activity" {
  name              = "/aws/iam/activity-${var.environment_suffix}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.infrastructure_secrets.arn

  depends_on = [aws_kms_key_policy.infrastructure_secrets]

  tags = merge(
    local.common_tags,
    {
      Name    = "iam-activity-logs-${var.environment_suffix}"
      Purpose = "IAMAudit"
    }
  )
}

# CloudWatch Log Group for SecurityAdmin role activity
resource "aws_cloudwatch_log_group" "security_admin_activity" {
  name              = "/aws/iam/security-admin-${var.environment_suffix}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.infrastructure_secrets.arn

  depends_on = [aws_kms_key_policy.infrastructure_secrets]

  tags = merge(
    local.common_tags,
    {
      Name    = "security-admin-activity-logs-${var.environment_suffix}"
      Purpose = "RoleAudit"
      Role    = "SecurityAdmin"
    }
  )
}

# CloudWatch Log Group for DevOps role activity
resource "aws_cloudwatch_log_group" "devops_activity" {
  name              = "/aws/iam/devops-${var.environment_suffix}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.infrastructure_secrets.arn

  depends_on = [aws_kms_key_policy.infrastructure_secrets]

  tags = merge(
    local.common_tags,
    {
      Name    = "devops-activity-logs-${var.environment_suffix}"
      Purpose = "RoleAudit"
      Role    = "DevOps"
    }
  )
}

# CloudWatch Log Group for Auditor role activity
resource "aws_cloudwatch_log_group" "auditor_activity" {
  name              = "/aws/iam/auditor-${var.environment_suffix}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.infrastructure_secrets.arn

  depends_on = [aws_kms_key_policy.infrastructure_secrets]

  tags = merge(
    local.common_tags,
    {
      Name    = "auditor-activity-logs-${var.environment_suffix}"
      Purpose = "RoleAudit"
      Role    = "Auditor"
    }
  )
}

# CloudWatch Log Group for KMS activity
resource "aws_cloudwatch_log_group" "kms_activity" {
  name              = "/aws/iam/kms/activity-${var.environment_suffix}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.infrastructure_secrets.arn

  depends_on = [aws_kms_key_policy.infrastructure_secrets]

  tags = merge(
    local.common_tags,
    {
      Name    = "kms-activity-logs-${var.environment_suffix}"
      Purpose = "KMSAudit"
    }
  )
}
