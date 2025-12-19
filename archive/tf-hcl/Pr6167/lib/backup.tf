# AWS Backup Vault
resource "aws_backup_vault" "main" {
  name = "backup-vault-${var.environment_suffix}"

  tags = {
    Name = "backup-vault-${var.environment_suffix}"
  }
}

# AWS Backup Plan
resource "aws_backup_plan" "main" {
  name = "backup-plan-${var.environment_suffix}"

  rule {
    rule_name         = "daily-backup-rule"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 5 * * ? *)"
    start_window      = 60
    completion_window = 120

    lifecycle {
      delete_after = 30
    }

    recovery_point_tags = {
      Environment = var.environment_suffix
      Project     = var.project_name
      BackupType  = "daily"
    }
  }

  tags = {
    Name = "backup-plan-${var.environment_suffix}"
  }
}

# IAM Role for AWS Backup
resource "aws_iam_role" "backup" {
  name = "backup-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "backup-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "backup" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

resource "aws_iam_role_policy_attachment" "backup_restore" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
}

# Backup Selection for RDS
resource "aws_backup_selection" "rds" {
  name         = "backup-selection-rds-${var.environment_suffix}"
  plan_id      = aws_backup_plan.main.id
  iam_role_arn = aws_iam_role.backup.arn

  resources = [
    aws_rds_cluster.main.arn
  ]

  selection_tag {
    type  = "STRINGEQUALS"
    key   = "Environment"
    value = var.environment_suffix
  }
}

# Backup Selection for ECS (configuration backup via SSM)
resource "aws_backup_selection" "ecs_config" {
  name         = "backup-selection-ecs-${var.environment_suffix}"
  plan_id      = aws_backup_plan.main.id
  iam_role_arn = aws_iam_role.backup.arn

  resources = [
    "arn:aws:ssm:${var.aws_region}:*:parameter/trading-app/${var.environment_suffix}/*"
  ]
}