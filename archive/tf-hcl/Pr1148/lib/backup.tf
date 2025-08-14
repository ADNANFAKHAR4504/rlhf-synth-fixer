# AWS Backup policies for critical resources

# IAM Role for AWS Backup
resource "aws_iam_role" "backup_role" {
  name_prefix = "backup-role-${local.name_suffix}"

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

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-backup-role-${local.name_suffix}"
    Type = "IAMRole"
  })
}

# Attach AWS managed backup policy
resource "aws_iam_role_policy_attachment" "backup_policy" {
  role       = aws_iam_role.backup_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

# AWS Backup Vault with KMS encryption
resource "aws_backup_vault" "main" {
  name        = "${var.project_name}-backup-vault-${local.name_suffix}"
  kms_key_arn = aws_kms_key.backup.arn

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-backup-vault-${local.name_suffix}"
    Type = "BackupVault"
  })
}

# KMS Key for backup encryption
resource "aws_kms_key" "backup" {
  description             = "KMS key for backup encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow use of the key for AWS Backup"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-backup-kms-${local.name_suffix}"
    Type = "KMSKey"
  })
}

# KMS Key Alias for backup
resource "aws_kms_alias" "backup" {
  name          = "alias/${var.project_name}-backup-${local.name_suffix}"
  target_key_id = aws_kms_key.backup.key_id
}

# Backup Plan with multiple schedules
resource "aws_backup_plan" "main" {
  name = "${var.project_name}-backup-plan-${local.name_suffix}"

  # Daily backups with 30-day retention
  rule {
    rule_name         = "daily_backups"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 2 ? * * *)" # Daily at 2 AM UTC

    lifecycle {
      cold_storage_after = 30
      delete_after       = 365
    }

    recovery_point_tags = merge(local.common_tags, {
      BackupType = "Daily"
    })
  }

  # Weekly backups with longer retention
  rule {
    rule_name         = "weekly_backups"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 3 ? * SUN *)" # Weekly on Sunday at 3 AM UTC

    lifecycle {
      cold_storage_after = 90
      delete_after       = 2555 # 7 years
    }

    recovery_point_tags = merge(local.common_tags, {
      BackupType = "Weekly"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-backup-plan-${local.name_suffix}"
    Type = "BackupPlan"
  })
}

# Backup Selection for S3 buckets (Secrets Manager not supported by AWS Backup)
resource "aws_backup_selection" "critical_resources" {
  iam_role_arn = aws_iam_role.backup_role.arn
  name         = "${var.project_name}-critical-resources-${local.name_suffix}"
  plan_id      = aws_backup_plan.main.id

  # Backup only S3 buckets (AWS Backup doesn't support Secrets Manager)
  resources = [
    aws_s3_bucket.cloudtrail_logs.arn,
    aws_s3_bucket.access_logs.arn
  ]

  # Backup selection with tags
  selection_tag {
    type  = "STRINGEQUALS"
    key   = "ManagedBy"
    value = "Terraform"
  }

  selection_tag {
    type  = "STRINGEQUALS"
    key   = "Owner"
    value = var.owner
  }
}

# S3 bucket versioning for additional protection (already enabled, but adding lifecycle)
resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail_logs_lifecycle" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    id     = "cloudtrail_lifecycle"
    status = "Enabled"

    filter {}

    # Transition to IA after 30 days
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    # Transition to Glacier after 90 days
    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    # Transition to Deep Archive after 365 days
    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }

    # Keep current versions for 7 years
    expiration {
      days = 2555
    }

    # Manage non-current versions
    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_transition {
      noncurrent_days = 90
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }
}

# S3 bucket lifecycle for access logs bucket
resource "aws_s3_bucket_lifecycle_configuration" "access_logs_lifecycle" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    id     = "access_logs_lifecycle"
    status = "Enabled"

    filter {}

    # Transition to IA after 30 days
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    # Transition to Glacier after 90 days
    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    # Delete after 1 year (access logs don't need long-term retention)
    expiration {
      days = 365
    }
  }
}
