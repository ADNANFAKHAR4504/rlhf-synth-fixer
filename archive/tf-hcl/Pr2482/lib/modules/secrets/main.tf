# KMS key for secrets encryption
resource "aws_kms_key" "secrets" {
  description             = "KMS key for secrets encryption in ${var.region}"
  deletion_window_in_days = 7

  tags = {
    Name = "${var.project_name}-${var.environment}-secrets-kms-${var.region}"
  }
}

resource "aws_kms_alias" "secrets" {
  name          = "alias/${var.project_name}-${var.environment}-secrets-${var.region}"
  target_key_id = aws_kms_key.secrets.key_id
}

# Database password secret
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "${var.project_name}-${var.environment}-db-password-${var.region}"
  description             = "Database password for ${var.region}"
  kms_key_id              = aws_kms_key.secrets.arn
  recovery_window_in_days = 7

  tags = {
    Name = "${var.project_name}-${var.environment}-db-password-${var.region}"
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    password = var.db_password
  })
}

# API keys secret
resource "aws_secretsmanager_secret" "api_keys" {
  name                    = "${var.project_name}-${var.environment}-api-keys-${var.region}"
  description             = "API keys for ${var.region}"
  kms_key_id              = aws_kms_key.secrets.arn
  recovery_window_in_days = 7

  tags = {
    Name = "${var.project_name}-${var.environment}-api-keys-${var.region}"
  }
}

resource "aws_secretsmanager_secret_version" "api_keys" {
  secret_id = aws_secretsmanager_secret.api_keys.id
  secret_string = jsonencode({
    api_key_1 = "placeholder-key-1"
    api_key_2 = "placeholder-key-2"
  })
}