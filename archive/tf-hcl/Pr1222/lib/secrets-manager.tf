# Secrets Manager for database credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  for_each = toset(["dev"])

  name                    = "${local.project_prefix}-${each.key}-db-credentials"
  description             = "Database credentials for ${each.key} environment"
  recovery_window_in_days = 0 # Immediate deletion for dev/test environments

  tags = merge(local.env_tags[each.key], {
    Name = "${local.project_prefix}-${each.key}-db-credentials"
  })
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  for_each = aws_secretsmanager_secret.db_credentials

  secret_id = each.value.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password[each.key].result
    endpoint = aws_db_instance.main[each.key].endpoint
    port     = aws_db_instance.main[each.key].port
  })
}