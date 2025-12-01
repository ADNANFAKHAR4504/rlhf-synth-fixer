# AWS Backup Configuration

resource "aws_backup_vault" "primary" {
  provider = aws.primary
  name     = "backup-vault-primary-${var.environment_suffix}"

  tags = {
    Name = "backup-vault-primary-${var.environment_suffix}"
  }
}

resource "aws_backup_vault" "secondary" {
  provider = aws.secondary
  name     = "backup-vault-secondary-${var.environment_suffix}"

  tags = {
    Name = "backup-vault-secondary-${var.environment_suffix}"
  }
}

resource "aws_iam_role" "backup" {
  provider = aws.primary
  name     = "backup-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "backup.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "backup-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy_attachment" "backup" {
  provider   = aws.primary
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

resource "aws_iam_role_policy_attachment" "backup_restore" {
  provider   = aws.primary
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
}

resource "aws_backup_plan" "primary" {
  provider = aws.primary
  name     = "backup-plan-primary-${var.environment_suffix}"

  rule {
    rule_name         = "daily-backups"
    target_vault_name = aws_backup_vault.primary.name
    schedule          = "cron(0 3 * * ? *)"

    lifecycle {
      delete_after = var.backup_retention_days
    }

    copy_action {
      destination_vault_arn = aws_backup_vault.secondary.arn

      lifecycle {
        delete_after = var.backup_retention_days
      }
    }
  }

  tags = {
    Name = "backup-plan-primary-${var.environment_suffix}"
  }
}

resource "aws_backup_selection" "primary_aurora" {
  provider     = aws.primary
  name         = "backup-selection-aurora-primary-${var.environment_suffix}"
  iam_role_arn = aws_iam_role.backup.arn
  plan_id      = aws_backup_plan.primary.id

  resources = [
    aws_rds_cluster.primary.arn
  ]
}
