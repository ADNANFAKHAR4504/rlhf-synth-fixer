# AWS Backup for post-migration protection
resource "aws_backup_vault" "main" {
  name        = "backup-vault-${var.environment_suffix}"
  kms_key_arn = aws_kms_key.backup.arn

  tags = {
    Name           = "backup-vault-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Project        = var.project_name
    MigrationPhase = var.migration_phase
  }
}

# KMS key for backup encryption
resource "aws_kms_key" "backup" {
  description             = "KMS key for AWS Backup encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name           = "backup-kms-key-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Project        = var.project_name
    MigrationPhase = var.migration_phase
  }
}

resource "aws_kms_alias" "backup" {
  name          = "alias/backup-${var.environment_suffix}"
  target_key_id = aws_kms_key.backup.key_id
}

# Backup plan for RDS Aurora
resource "aws_backup_plan" "rds" {
  name = "rds-backup-plan-${var.environment_suffix}"

  rule {
    rule_name         = "daily-backup"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 3 * * ? *)"

    lifecycle {
      delete_after = 30
    }

    recovery_point_tags = {
      Environment    = var.environment_suffix
      Project        = var.project_name
      MigrationPhase = var.migration_phase
      BackupType     = "daily"
    }
  }

  tags = {
    Name           = "rds-backup-plan-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Project        = var.project_name
    MigrationPhase = var.migration_phase
  }
}

# Backup plan for ECS configuration
resource "aws_backup_plan" "ecs" {
  name = "ecs-backup-plan-${var.environment_suffix}"

  rule {
    rule_name         = "daily-backup"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 4 * * ? *)"

    lifecycle {
      delete_after = 30
    }

    recovery_point_tags = {
      Environment    = var.environment_suffix
      Project        = var.project_name
      MigrationPhase = var.migration_phase
      BackupType     = "daily"
    }
  }

  tags = {
    Name           = "ecs-backup-plan-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Project        = var.project_name
    MigrationPhase = var.migration_phase
  }
}

# IAM role for AWS Backup
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
    Name           = "backup-role-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Project        = var.project_name
    MigrationPhase = var.migration_phase
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

# Backup selection for RDS
resource "aws_backup_selection" "rds" {
  iam_role_arn = aws_iam_role.backup.arn
  name         = "rds-backup-selection-${var.environment_suffix}"
  plan_id      = aws_backup_plan.rds.id

  resources = [
    aws_rds_cluster.main.arn
  ]
}

# Backup selection for ECS (S3 bucket containing ECS configurations)
resource "aws_backup_selection" "ecs" {
  iam_role_arn = aws_iam_role.backup.arn
  name         = "ecs-backup-selection-${var.environment_suffix}"
  plan_id      = aws_backup_plan.ecs.id

  selection_tag {
    type  = "STRINGEQUALS"
    key   = "BackupTarget"
    value = "ecs-config"
  }
}

# S3 bucket for ECS configuration backups
resource "aws_s3_bucket" "ecs_config" {
  bucket        = "ecs-config-backup-${var.environment_suffix}"
  force_destroy = true

  tags = {
    Name           = "ecs-config-backup-${var.environment_suffix}"
    Environment    = var.environment_suffix
    Project        = var.project_name
    MigrationPhase = var.migration_phase
    BackupTarget   = "ecs-config"
  }
}

resource "aws_s3_bucket_versioning" "ecs_config" {
  bucket = aws_s3_bucket.ecs_config.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "ecs_config" {
  bucket = aws_s3_bucket.ecs_config.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.backup.arn
      sse_algorithm     = "aws:kms"
    }
  }
}
