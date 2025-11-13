# Secrets Manager for RDS credentials
# Note: Secret must be created as part of deployment for self-sufficiency

resource "aws_secretsmanager_secret" "db_credentials" {
  name_prefix             = "rds-db-credentials-${var.environmentSuffix}-"
  description             = "Database credentials for RDS instance"
  recovery_window_in_days = 0 # Immediate deletion for CI/CD compatibility

  tags = merge(local.common_tags, {
    Name = "rds-db-credentials-${var.environmentSuffix}"
  })
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.db_password.result
  })
}

resource "random_password" "db_password" {
  length  = 32
  special = true
  # Avoid characters that might cause issues in connection strings
  override_special = "!#$%&*()-_=+[]{}<>:?"
}
