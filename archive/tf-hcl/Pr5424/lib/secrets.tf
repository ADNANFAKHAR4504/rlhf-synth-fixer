# Generate random password for RDS via AWS Secrets Manager (excludes unsupported characters)
data "aws_secretsmanager_random_password" "rds_password" {
  password_length     = 32
  exclude_characters  = "/@\" "
  exclude_numbers     = false
  exclude_punctuation = false
}

# Store RDS credentials in Secrets Manager
resource "aws_secretsmanager_secret" "rds_credentials" {
  name_prefix             = "${local.name_prefix}-rds-creds-"
  description             = "RDS master credentials for ${local.name_prefix}"
  recovery_window_in_days = 7

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-rds-credentials"
    }
  )
}

resource "aws_secretsmanager_secret_version" "rds_credentials" {
  secret_id = aws_secretsmanager_secret.rds_credentials.id
  secret_string = jsonencode({
    username          = var.database_master_username
    password          = data.aws_secretsmanager_random_password.rds_password.random_password
    engine            = "postgres"
    host              = aws_rds_cluster.aurora.endpoint
    reader_endpoint   = aws_rds_cluster.aurora.reader_endpoint
    port              = 5432
    dbname            = var.database_name
    connection_string = "postgresql://${var.database_master_username}:${data.aws_secretsmanager_random_password.rds_password.random_password}@${aws_rds_cluster.aurora.endpoint}:5432/${var.database_name}"
  })
}

# Application secrets placeholder
resource "aws_secretsmanager_secret" "app_secrets" {
  name_prefix             = "${local.name_prefix}-app-secrets-"
  description             = "Application secrets for ${local.name_prefix}"
  recovery_window_in_days = 7

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-app-secrets"
    }
  )
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    app_key = "placeholder-app-key"
  })
}
