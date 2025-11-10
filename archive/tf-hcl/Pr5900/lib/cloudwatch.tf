# CloudWatch Log Groups for each service
resource "aws_cloudwatch_log_group" "payment_service" {
  name              = "/ecs/fintech/payment-service-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name    = "payment-service-logs-${var.environment_suffix}"
    Service = "payment-service"
  }
}

resource "aws_cloudwatch_log_group" "auth_service" {
  name              = "/ecs/fintech/auth-service-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name    = "auth-service-logs-${var.environment_suffix}"
    Service = "auth-service"
  }
}

resource "aws_cloudwatch_log_group" "analytics_service" {
  name              = "/ecs/fintech/analytics-service-${var.environment_suffix}"
  retention_in_days = var.log_retention_days

  tags = {
    Name    = "analytics-service-logs-${var.environment_suffix}"
    Service = "analytics-service"
  }
}
