resource "aws_secretsmanager_secret" "payment_gateway" {
  name                    = "${var.project_name}-payment-gateway-${local.env_suffix}"
  description             = "Payment gateway API credentials"
  recovery_window_in_days = 7

  tags = {
    Name        = "${var.project_name}-payment-gateway"
    Environment = local.env_suffix
  }
}

resource "aws_secretsmanager_secret_version" "payment_gateway" {
  secret_id = aws_secretsmanager_secret.payment_gateway.id
  secret_string = jsonencode({
    api_key    = var.payment_gateway_api_key
    api_secret = "placeholder-api-secret"
    endpoint   = "https://api.paymentgateway.com"
  })
}
