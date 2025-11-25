# AWS Backup Vault (Primary)
resource "aws_backup_vault" "primary" {
  provider = aws.primary
  name     = "backup-vault-primary-${var.environment_suffix}"

  tags = merge(local.common_tags, {
    Name    = "backup-vault-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# AWS Backup Vault (Secondary)
resource "aws_backup_vault" "secondary" {
  provider = aws.secondary
  name     = "backup-vault-secondary-${var.environment_suffix}"

  tags = merge(local.common_tags, {
    Name    = "backup-vault-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# AWS Backup Plan (Primary)
resource "aws_backup_plan" "primary" {
  provider = aws.primary
  name     = "backup-plan-primary-${var.environment_suffix}"

  rule {
    rule_name         = "daily-backup-rule"
    target_vault_name = aws_backup_vault.primary.name
    schedule          = "cron(0 2 * * ? *)" # Daily at 2 AM UTC

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

  advanced_backup_setting {
    backup_options = {
      WindowsVSS = "enabled"
    }
    resource_type = "EC2"
  }

  tags = merge(local.common_tags, {
    Name    = "backup-plan-primary-${var.environment_suffix}"
    Region  = "primary"
    DR-Role = "primary"
  })
}

# AWS Backup Plan (Secondary)
resource "aws_backup_plan" "secondary" {
  provider = aws.secondary
  name     = "backup-plan-secondary-${var.environment_suffix}"

  rule {
    rule_name         = "daily-backup-rule"
    target_vault_name = aws_backup_vault.secondary.name
    schedule          = "cron(0 2 * * ? *)" # Daily at 2 AM UTC

    lifecycle {
      delete_after = var.backup_retention_days
    }
  }

  advanced_backup_setting {
    backup_options = {
      WindowsVSS = "enabled"
    }
    resource_type = "EC2"
  }

  tags = merge(local.common_tags, {
    Name    = "backup-plan-secondary-${var.environment_suffix}"
    Region  = "secondary"
    DR-Role = "secondary"
  })
}

# Backup Selection (Primary) - EC2 Instances
resource "aws_backup_selection" "primary_ec2" {
  provider     = aws.primary
  name         = "backup-selection-ec2-primary-${var.environment_suffix}"
  plan_id      = aws_backup_plan.primary.id
  iam_role_arn = aws_iam_role.backup_role.arn

  selection_tag {
    type  = "STRINGEQUALS"
    key   = "Environment"
    value = var.environment_suffix
  }

  selection_tag {
    type  = "STRINGEQUALS"
    key   = "DR-Role"
    value = "primary"
  }

  resources = ["*"]
}

# Backup Selection (Primary) - Aurora Cluster
resource "aws_backup_selection" "primary_aurora" {
  provider     = aws.primary
  name         = "backup-selection-aurora-primary-${var.environment_suffix}"
  plan_id      = aws_backup_plan.primary.id
  iam_role_arn = aws_iam_role.backup_role.arn

  resources = [
    aws_rds_cluster.primary.arn
  ]
}

# Backup Selection (Secondary) - EC2 Instances
resource "aws_backup_selection" "secondary_ec2" {
  provider     = aws.secondary
  name         = "backup-selection-ec2-secondary-${var.environment_suffix}"
  plan_id      = aws_backup_plan.secondary.id
  iam_role_arn = aws_iam_role.backup_role.arn

  selection_tag {
    type  = "STRINGEQUALS"
    key   = "Environment"
    value = var.environment_suffix
  }

  selection_tag {
    type  = "STRINGEQUALS"
    key   = "DR-Role"
    value = "secondary"
  }

  resources = ["*"]
}

# Backup Selection (Secondary) - Aurora Cluster
resource "aws_backup_selection" "secondary_aurora" {
  provider     = aws.secondary
  name         = "backup-selection-aurora-secondary-${var.environment_suffix}"
  plan_id      = aws_backup_plan.secondary.id
  iam_role_arn = aws_iam_role.backup_role.arn

  resources = [
    aws_rds_cluster.secondary.arn
  ]
}
