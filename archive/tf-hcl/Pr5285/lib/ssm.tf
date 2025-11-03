# Generate random auth token
resource "random_password" "auth_token" {
  length  = 32
  special = true
}

# Auth Token Parameter
resource "aws_ssm_parameter" "auth_token" {
  name        = "/${var.project_name}/${var.environment_suffix}/auth-token"
  description = "Authentication token for API access"
  type        = "SecureString"
  value       = random_password.auth_token.result

  tags = local.common_tags
}

# Database Connection String
resource "aws_ssm_parameter" "db_connection" {
  name        = "/${var.project_name}/${var.environment_suffix}/db-connection"
  description = "Database connection parameters"
  type        = "SecureString"
  value = jsonencode({
    table_name = aws_dynamodb_table.events.name
    region     = data.aws_region.current.id
  })

  tags = local.common_tags

  depends_on = [aws_dynamodb_table.events]
}

# API Configuration
resource "aws_ssm_parameter" "api_config" {
  name        = "/${var.project_name}/${var.environment_suffix}/api-config"
  description = "API configuration parameters"
  type        = "String"
  value = jsonencode({
    throttle_limit = var.api_throttle_rate_limit
    burst_limit    = var.api_throttle_burst_limit
    timeout        = 30
  })

  tags = local.common_tags
}

# Event Processing Configuration
resource "aws_ssm_parameter" "processing_config" {
  name        = "/${var.project_name}/${var.environment_suffix}/processing-config"
  description = "Event processing configuration"
  type        = "String"
  value = jsonencode({
    batch_size     = 10
    retry_attempts = 3
    dlq_url        = aws_sqs_queue.dlq.url
  })

  tags = local.common_tags

  depends_on = [aws_sqs_queue.dlq]
}