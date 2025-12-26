# passwords.tf - Secure password generation

# ✅ Generate random password for Aurora PostgreSQL
resource "random_password" "db_master_password" {
  length  = 32
  special = true
  # Exclude problematic characters for database passwords
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# ✅ Generate random password for Source Oracle database
resource "random_password" "source_db_password" {
  count = var.enable_dms ? 1 : 0

  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Store passwords in AWS Secrets Manager for secure access
resource "aws_secretsmanager_secret" "db_master_password" {
  name                    = "aurora-master-password-${var.environment_suffix}"
  description             = "Aurora PostgreSQL master password"
  recovery_window_in_days = 7

  tags = {
    Name           = "aurora-master-password-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

resource "aws_secretsmanager_secret_version" "db_master_password" {
  secret_id     = aws_secretsmanager_secret.db_master_password.id
  secret_string = random_password.db_master_password.result
}

resource "aws_secretsmanager_secret" "source_db_password" {
  count = var.enable_dms ? 1 : 0

  name                    = "source-oracle-password-${var.environment_suffix}"
  description             = "Source Oracle database password"
  recovery_window_in_days = 7

  tags = {
    Name           = "source-oracle-password-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

resource "aws_secretsmanager_secret_version" "source_db_password" {
  count = var.enable_dms ? 1 : 0

  secret_id     = aws_secretsmanager_secret.source_db_password[0].id
  secret_string = random_password.source_db_password[0].result
}
