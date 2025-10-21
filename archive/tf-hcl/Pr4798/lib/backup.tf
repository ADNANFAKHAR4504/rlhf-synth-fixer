# ============================================================================
# AWS Backup - Automated Backup Management
# ============================================================================

# Backup Vault
resource "aws_backup_vault" "main" {
  count = var.enable_aws_backup ? 1 : 0

  name        = "${local.name_prefix}-backup-vault-${local.name_suffix}"
  kms_key_arn = aws_kms_key.primary.arn

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-backup-vault"
      Type = "Backup Vault"
    }
  )
}

# Backup Plan
resource "aws_backup_plan" "main" {
  count = var.enable_aws_backup ? 1 : 0

  name = "${local.name_prefix}-backup-plan-${local.name_suffix}"

  rule {
    rule_name         = "daily-backups"
    target_vault_name = aws_backup_vault.main[0].name
    schedule          = var.backup_schedule

    lifecycle {
      delete_after       = var.backup_retention_days
      cold_storage_after = var.backup_cold_storage_after_days
    }

    recovery_point_tags = merge(
      local.common_tags,
      {
        Name       = "Automated Backup"
        BackupType = "Scheduled"
        Compliance = "Legal Retention"
      }
    )
  }

  advanced_backup_setting {
    backup_options = {
      WindowsVSS = "enabled"
    }
    resource_type = "EC2"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-backup-plan"
      Type = "Backup Plan"
    }
  )
}

# IAM Role for AWS Backup
resource "aws_iam_role" "backup" {
  count = var.enable_aws_backup ? 1 : 0

  name = "${local.name_prefix}-backup-role-${local.name_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-backup-role"
      Type = "Backup Service Role"
    }
  )
}

# Attach AWS Backup service role policies
resource "aws_iam_role_policy_attachment" "backup_service" {
  count = var.enable_aws_backup ? 1 : 0

  role       = aws_iam_role.backup[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

resource "aws_iam_role_policy_attachment" "backup_restores" {
  count = var.enable_aws_backup ? 1 : 0

  role       = aws_iam_role.backup[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
}

# Backup Selection - Tag-based resource selection
resource "aws_backup_selection" "main" {
  count = var.enable_aws_backup ? 1 : 0

  name         = "${local.name_prefix}-backup-selection"
  iam_role_arn = aws_iam_role.backup[0].arn
  plan_id      = aws_backup_plan.main[0].id

  selection_tag {
    type  = "STRINGEQUALS"
    key   = "BackupEnabled"
    value = "true"
  }

  selection_tag {
    type  = "STRINGEQUALS"
    key   = "Project"
    value = var.project_name
  }
}

# Vault Lock Policy (Optional - WORM protection for backups)
resource "aws_backup_vault_lock_configuration" "main" {
  count = var.enable_aws_backup ? 1 : 0

  backup_vault_name   = aws_backup_vault.main[0].name
  min_retention_days  = 7
  max_retention_days  = var.backup_retention_days
  changeable_for_days = 3
}

# Backup Vault Notifications
resource "aws_backup_vault_notifications" "main" {
  count = var.enable_aws_backup && length(var.alarm_email_endpoints) > 0 ? 1 : 0

  backup_vault_name = aws_backup_vault.main[0].name
  sns_topic_arn     = aws_sns_topic.alerts.arn
  backup_vault_events = [
    "BACKUP_JOB_STARTED",
    "BACKUP_JOB_COMPLETED",
    "BACKUP_JOB_FAILED",
    "RESTORE_JOB_STARTED",
    "RESTORE_JOB_COMPLETED",
    "RESTORE_JOB_FAILED"
  ]
}
