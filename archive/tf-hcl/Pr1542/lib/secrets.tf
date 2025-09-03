# Secrets Manager secret for API keys
resource "aws_secretsmanager_secret" "api_keys" {
  name        = "${var.api_key_secret_name}${local.name_suffix}"
  description = "API keys for serverless microservices"

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "api_keys" {
  secret_id = aws_secretsmanager_secret.api_keys.id
  secret_string = jsonencode({
    api_key                  = "default-api-key-${random_password.api_key.result}"
    notification_service_key = "notif-key-${random_password.notification_key.result}"
  })
}

resource "random_password" "api_key" {
  length  = 32
  special = true
}

resource "random_password" "notification_key" {
  length  = 32
  special = true
}