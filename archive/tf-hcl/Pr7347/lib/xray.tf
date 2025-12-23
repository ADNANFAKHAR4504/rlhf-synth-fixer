# xray.tf - X-Ray sampling rules and groups

# X-Ray sampling rule for 100% capture (Constraint #7)
resource "aws_xray_sampling_rule" "payment_transactions" {
  rule_name      = "PaymentTransactions-${var.environment_suffix}"
  priority       = 1000
  version        = 1
  reservoir_size = 1
  fixed_rate     = var.xray_sampling_rate # 1.0 = 100%
  url_path       = "*"
  host           = "*"
  http_method    = "*"
  service_type   = "*"
  service_name   = "*"
  resource_arn   = "*"

  attributes = {
    Environment = var.environment_suffix
    Service     = "PaymentProcessing"
  }
}

# X-Ray group for payment transactions
resource "aws_xray_group" "payment_transactions" {
  group_name        = "PaymentTransactions-${var.environment_suffix}"
  filter_expression = "service(\"transaction-processor-${var.environment_suffix}\")"

  insights_configuration {
    insights_enabled      = true
    notifications_enabled = false
  }

  tags = {
    Name = "xray-group-${var.environment_suffix}"
  }
}
