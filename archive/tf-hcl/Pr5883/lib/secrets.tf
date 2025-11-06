# Secrets Manager - Database Connection String
resource "aws_secretsmanager_secret" "db_connection" {
  name                    = "secret-db-connection-${var.environment_suffix}"
  description             = "Database connection string for microservices"
  recovery_window_in_days = 7

  tags = {
    Name = "secret-db-connection-${var.environment_suffix}"
  }
}

resource "aws_secretsmanager_secret_version" "db_connection" {
  secret_id = aws_secretsmanager_secret.db_connection.id
  secret_string = jsonencode({
    host     = "db.example.com"
    port     = 5432
    database = "payments"
    username = "dbuser"
    password = "PLACEHOLDER_PASSWORD"
  })
}

# Secrets Manager - API Credentials
resource "aws_secretsmanager_secret" "api_credentials" {
  name                    = "secret-api-credentials-${var.environment_suffix}"
  description             = "Third-party API credentials for microservices"
  recovery_window_in_days = 7

  tags = {
    Name = "secret-api-credentials-${var.environment_suffix}"
  }
}

resource "aws_secretsmanager_secret_version" "api_credentials" {
  secret_id = aws_secretsmanager_secret.api_credentials.id
  secret_string = jsonencode({
    stripe_api_key   = "PLACEHOLDER_STRIPE_KEY"
    sendgrid_api_key = "PLACEHOLDER_SENDGRID_KEY"
    twilio_api_key   = "PLACEHOLDER_TWILIO_KEY"
    fraud_api_key    = "PLACEHOLDER_FRAUD_KEY"
  })
}

# Secrets Manager - Webhook Secrets
resource "aws_secretsmanager_secret" "webhook_secrets" {
  name                    = "secret-webhook-secrets-${var.environment_suffix}"
  description             = "Webhook signing secrets"
  recovery_window_in_days = 7

  tags = {
    Name = "secret-webhook-secrets-${var.environment_suffix}"
  }
}

resource "aws_secretsmanager_secret_version" "webhook_secrets" {
  secret_id = aws_secretsmanager_secret.webhook_secrets.id
  secret_string = jsonencode({
    webhook_signing_secret = "PLACEHOLDER_SIGNING_SECRET"
    webhook_encryption_key = "PLACEHOLDER_ENCRYPTION_KEY"
  })
}
