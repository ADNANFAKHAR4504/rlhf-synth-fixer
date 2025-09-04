# secrets.tf
# AWS Secrets Manager configuration

# KMS Key for encrypting secrets
resource "aws_kms_key" "secrets_key" {
  description             = "KMS key for encrypting secrets"
  deletion_window_in_days = 7 # Minimum for testing - increase for production

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-secrets-key-${local.name_suffix}"
    Type = "KMSKey"
  })
}

# KMS Key Alias
resource "aws_kms_alias" "secrets_key_alias" {
  name          = "alias/${var.project_name}-secrets-${local.name_suffix}"
  target_key_id = aws_kms_key.secrets_key.key_id
}

# Secrets Manager Secret
resource "aws_secretsmanager_secret" "app_secret" {
  name                    = "${var.project_name}-app-secret-${local.name_suffix}"
  description             = "Application secrets for secure foundation infrastructure"
  kms_key_id              = aws_kms_key.secrets_key.arn
  recovery_window_in_days = 7 # Minimum for testing - increase for production

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-app-secret-${local.name_suffix}"
    Type = "Secret"
  })
}

# Secrets Manager Secret Version with placeholder values
resource "aws_secretsmanager_secret_version" "app_secret_version" {
  secret_id = aws_secretsmanager_secret.app_secret.id
  secret_string = jsonencode({
    database_username = "admin"
    database_password = "placeholder-password-change-immediately"
    api_key           = "placeholder-api-key-change-immediately"
    encryption_key    = "placeholder-encryption-key-change-immediately"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}