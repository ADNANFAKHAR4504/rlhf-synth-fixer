resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}|;:,.<>?~`"
  # Excludes '/', '@', '"', and space which are not allowed in RDS master passwords
}

resource "aws_secretsmanager_secret" "db_credentials" {
  name_prefix             = "db-credentials-${var.environment_suffix}-"
  description             = "Database credentials for trading dashboard"
  recovery_window_in_days = 0

  tags = {
    Name = "db-credentials-${var.environment_suffix}"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_master_username
    password = random_password.db_password.result
    engine   = "postgres"
    host     = aws_rds_cluster.main.endpoint
    port     = 5432
    dbname   = var.db_name
  })
}

resource "aws_secretsmanager_secret_rotation" "db_credentials" {
  secret_id           = aws_secretsmanager_secret.db_credentials.id
  rotation_lambda_arn = aws_lambda_function.secrets_rotation.arn

  rotation_rules {
    automatically_after_days = 30
  }
}
