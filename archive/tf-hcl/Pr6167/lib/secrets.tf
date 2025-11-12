# Generate random password for RDS
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Store RDS master password in Secrets Manager
resource "aws_secretsmanager_secret" "db_master_password" {
  name        = "rds-master-password-${var.environment_suffix}"
  description = "Master password for RDS Aurora PostgreSQL cluster"

  tags = {
    Name = "rds-master-password-${var.environment_suffix}"
  }
}

resource "aws_secretsmanager_secret_version" "db_master_password" {
  secret_id = aws_secretsmanager_secret.db_master_password.id
  secret_string = jsonencode({
    username = var.db_master_username
    password = random_password.db_password.result
    engine   = "postgres"
    host     = aws_rds_cluster.main.endpoint
    port     = 5432
    dbname   = "trading"
  })
}

# Store DMS source credentials
resource "aws_secretsmanager_secret" "dms_source_credentials" {
  name        = "dms-source-credentials-${var.environment_suffix}"
  description = "Credentials for DMS source database"

  tags = {
    Name = "dms-source-credentials-${var.environment_suffix}"
  }
}

resource "aws_secretsmanager_secret_version" "dms_source_credentials" {
  secret_id = aws_secretsmanager_secret.dms_source_credentials.id
  secret_string = jsonencode({
    username = "source_admin"
    password = "PLACEHOLDER_TO_BE_UPDATED"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# Store API keys
resource "aws_secretsmanager_secret" "api_keys" {
  name        = "api-keys-${var.environment_suffix}"
  description = "API keys for trading application"

  tags = {
    Name = "api-keys-${var.environment_suffix}"
  }
}

resource "aws_secretsmanager_secret_version" "api_keys" {
  secret_id = aws_secretsmanager_secret.api_keys.id
  secret_string = jsonencode({
    api_key        = "PLACEHOLDER_TO_BE_UPDATED"
    api_secret     = "PLACEHOLDER_TO_BE_UPDATED"
    encryption_key = "PLACEHOLDER_TO_BE_UPDATED"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}