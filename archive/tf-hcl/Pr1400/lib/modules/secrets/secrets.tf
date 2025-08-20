resource "random_password" "db_password" {
  length  = var.db_password_length
  special = true
}

resource "aws_secretsmanager_secret" "app_secrets" {
  name        = "${var.project}-app-secrets"
  description = "App secrets"
  tags        = var.common_tags
}

resource "aws_secretsmanager_secret_version" "app_secrets_version" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    db_password = random_password.db_password.result
    api_key     = "production-api-key-placeholder"
  })
}
