# AWS Backup Vault
resource "aws_backup_vault" "main" {
  name        = "${local.project_prefix}-backup-vault"
  kms_key_arn = aws_kms_key.ebs_key.arn

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-backup-vault"
  })
}

# Backup Plan
resource "aws_backup_plan" "main" {
  name = "${local.project_prefix}-backup-plan"

  rule {
    rule_name         = "${local.project_prefix}-backup-rule"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 5 ? * * *)" # Daily at 5 AM

    lifecycle {
      delete_after = 30
    }

    recovery_point_tags = merge(local.common_tags, {
      BackupPlan = "${local.project_prefix}-backup-plan"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${local.project_prefix}-backup-plan"
  })
}

# Backup Selection
resource "aws_backup_selection" "main" {
  iam_role_arn = aws_iam_role.backup_role.arn
  name         = "${local.project_prefix}-backup-selection"
  plan_id      = aws_backup_plan.main.id

  resources = [
    "*"
  ]

  condition {
    string_equals {
      key   = "aws:ResourceTag/environment"
      value = "dev"
    }
  }

  condition {
    string_equals {
      key   = "aws:ResourceTag/environment"
      value = "test"
    }
  }
}