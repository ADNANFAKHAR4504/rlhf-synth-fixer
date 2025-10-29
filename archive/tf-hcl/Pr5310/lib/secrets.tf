# secrets.tf

# Secrets Manager Secret for Stripe Webhook Signing Key
resource "aws_secretsmanager_secret" "stripe_secret" {
  name        = local.secret_stripe_name
  description = "Stripe webhook signing secret"

  tags = merge(
    local.common_tags,
    {
      Name     = local.secret_stripe_name
      Provider = "stripe"
    }
  )
}

# Placeholder secret version for Stripe (to be updated manually)
resource "aws_secretsmanager_secret_version" "stripe_secret" {
  secret_id = aws_secretsmanager_secret.stripe_secret.id
  secret_string = jsonencode({
    signing_secret = "PLACEHOLDER_UPDATE_MANUALLY"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# Secrets Manager Secret for PayPal Webhook Signing Key
resource "aws_secretsmanager_secret" "paypal_secret" {
  name        = local.secret_paypal_name
  description = "PayPal webhook signing secret"

  tags = merge(
    local.common_tags,
    {
      Name     = local.secret_paypal_name
      Provider = "paypal"
    }
  )
}

# Placeholder secret version for PayPal (to be updated manually)
resource "aws_secretsmanager_secret_version" "paypal_secret" {
  secret_id = aws_secretsmanager_secret.paypal_secret.id
  secret_string = jsonencode({
    signing_secret = "PLACEHOLDER_UPDATE_MANUALLY"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# Secrets Manager Secret for Square Webhook Signing Key
resource "aws_secretsmanager_secret" "square_secret" {
  name        = local.secret_square_name
  description = "Square webhook signing secret"

  tags = merge(
    local.common_tags,
    {
      Name     = local.secret_square_name
      Provider = "square"
    }
  )
}

# Placeholder secret version for Square (to be updated manually)
resource "aws_secretsmanager_secret_version" "square_secret" {
  secret_id = aws_secretsmanager_secret.square_secret.id
  secret_string = jsonencode({
    signing_secret = "PLACEHOLDER_UPDATE_MANUALLY"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}
