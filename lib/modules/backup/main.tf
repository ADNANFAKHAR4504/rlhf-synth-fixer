# AWS Backup Plan for Disaster Recovery

resource "aws_backup_vault" "main" {
  name = "${var.project_name}-backup-vault"

  tags = {
    Name        = "${var.project_name}-backup-vault"
    Environment = var.environment
    Purpose     = "Centralized backup storage"
  }
}

resource "aws_backup_plan" "daily" {
  name = "${var.project_name}-daily-backup-plan"

  rule {
    rule_name         = "daily_backup_rule"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 2 * * ? *)" # Daily at 2 AM UTC

    lifecycle {
      delete_after = 30 # Keep backups for 30 days
    }

    recovery_point_tags = {
      BackupType  = "Daily"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }

  tags = {
    Name        = "${var.project_name}-backup-plan"
    Environment = var.environment
  }
}

resource "aws_backup_selection" "aurora_backup" {
  name         = "${var.project_name}-aurora-backup-selection"
  plan_id      = aws_backup_plan.daily.id
  iam_role_arn = var.backup_role_arn

  resources = [
    var.primary_aurora_cluster_arn,
    var.dynamodb_table_arn
  ]
}

