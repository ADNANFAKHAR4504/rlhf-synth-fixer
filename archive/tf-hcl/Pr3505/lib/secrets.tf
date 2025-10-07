resource "aws_secretsmanager_secret" "webhook_secrets" {
  name                    = "${local.resource_prefix}-webhook-secrets"
  description             = "Webhook validation secrets"
  recovery_window_in_days = 7

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "webhook_secrets" {
  secret_id = aws_secretsmanager_secret.webhook_secrets.id

  secret_string = jsonencode({
    github_secret = "placeholder-github-secret"
    stripe_secret = "placeholder-stripe-secret"
    slack_secret  = "placeholder-slack-secret"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}