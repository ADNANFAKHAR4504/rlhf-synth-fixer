resource "aws_secretsmanager_secret" "github_token" {
  name        = "${var.environment_suffix}-${var.project_name}/github-token"
  description = "GitHub personal access token for CodePipeline"

  tags = merge(var.common_tags, {
    Name        = "${var.environment_suffix}-${var.project_name}-github-token"
    Environment = var.environment_suffix
  })
}

resource "aws_secretsmanager_secret" "app_config" {
  name        = "${var.environment_suffix}-${var.project_name}/app-config"
  description = "Application configuration secrets"

  tags = merge(var.common_tags, {
    Name        = "${var.environment_suffix}-${var.project_name}-app-config"
    Environment = var.environment_suffix
  })
}

resource "aws_secretsmanager_secret_version" "app_config" {
  secret_id = aws_secretsmanager_secret.app_config.id
  secret_string = jsonencode({
    database_url = "encrypted-database-url"
    api_key      = "encrypted-api-key"
  })
}