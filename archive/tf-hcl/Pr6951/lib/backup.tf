# AWS Backup for Data Protection (Optional Enhancement)

# AWS Backup vault
resource "aws_backup_vault" "migration" {
  count    = var.enable_backup ? 1 : 0
  provider = aws.source
  name     = "doc-proc-${var.source_region}-backup-vault-${var.environment_suffix}"

  tags = {
    Name           = "doc-proc-${var.source_region}-backup-vault-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# Backup vault in target region
resource "aws_backup_vault" "migration_target" {
  count    = var.enable_backup ? 1 : 0
  provider = aws.target
  name     = "doc-proc-${var.target_region}-backup-vault-${var.environment_suffix}"

  tags = {
    Name           = "doc-proc-${var.target_region}-backup-vault-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# Backup plan for DynamoDB tables
resource "aws_backup_plan" "dynamodb" {
  count    = var.enable_backup ? 1 : 0
  provider = aws.source
  name     = "doc-proc-${var.source_region}-backup-plan-dynamodb-${var.environment_suffix}"

  rule {
    rule_name         = "daily_backup"
    target_vault_name = aws_backup_vault.migration[0].name
    schedule          = "cron(0 2 * * ? *)" # Daily at 2 AM UTC

    lifecycle {
      delete_after = 30
    }

    copy_action {
      destination_vault_arn = aws_backup_vault.migration_target[0].arn

      lifecycle {
        delete_after = 30
      }
    }
  }

  rule {
    rule_name         = "weekly_backup"
    target_vault_name = aws_backup_vault.migration[0].name
    schedule          = "cron(0 3 ? * SUN *)" # Weekly on Sunday at 3 AM UTC

    lifecycle {
      delete_after = 90
    }
  }

  tags = {
    Name           = "doc-proc-${var.source_region}-backup-plan-dynamodb-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# Backup selection for DynamoDB tables
resource "aws_backup_selection" "dynamodb" {
  count        = var.enable_backup ? 1 : 0
  provider     = aws.source
  name         = "doc-proc-${var.source_region}-backup-selection-dynamodb-${var.environment_suffix}"
  plan_id      = aws_backup_plan.dynamodb[0].id
  iam_role_arn = aws_iam_role.backup[0].arn

  resources = [
    aws_dynamodb_table.metadata.arn,
    aws_dynamodb_table.migration_state.arn
  ]

  selection_tag {
    type  = "STRINGEQUALS"
    key   = "MigrationPhase"
    value = var.migration_phase
  }
}

# Backup notification topic
resource "aws_sns_topic" "backup_notifications" {
  count    = var.enable_backup ? 1 : 0
  provider = aws.source
  name     = "doc-proc-${var.source_region}-sns-backup-${var.environment_suffix}"

  tags = {
    Name           = "doc-proc-${var.source_region}-sns-backup-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

resource "aws_sns_topic_subscription" "backup_notifications_email" {
  count     = var.enable_backup ? 1 : 0
  provider  = aws.source
  topic_arn = aws_sns_topic.backup_notifications[0].arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# Backup vault notifications
resource "aws_backup_vault_notifications" "migration" {
  count             = var.enable_backup ? 1 : 0
  provider          = aws.source
  backup_vault_name = aws_backup_vault.migration[0].name
  sns_topic_arn     = aws_sns_topic.backup_notifications[0].arn
  backup_vault_events = [
    "BACKUP_JOB_STARTED",
    "BACKUP_JOB_COMPLETED",
    "BACKUP_JOB_FAILED",
    "RESTORE_JOB_COMPLETED",
    "RESTORE_JOB_FAILED"
  ]
}
