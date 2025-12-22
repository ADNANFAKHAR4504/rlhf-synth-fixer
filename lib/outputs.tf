output "api_gateway_url" {
  description = "Base URL of the API Gateway"
  value       = aws_api_gateway_stage.main.invoke_url
}

output "api_gateway_stage_url" {
  description = "Stage URL of the API Gateway"
  value       = aws_api_gateway_stage.main.invoke_url
}

output "lambda_function_names" {
  description = "Names of the Lambda functions"
  value       = { for k, v in aws_lambda_function.microservice_functions : k => v.function_name }
}

output "lambda_function_arns" {
  description = "ARNs of the Lambda functions"
  value       = { for k, v in aws_lambda_function.microservice_functions : k => v.arn }
}

output "secrets_manager_secret_arn" {
  description = "ARN of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.api_keys.arn
}

output "api_endpoints" {
  description = "API endpoint URLs"
  value = {
    health        = "${aws_api_gateway_stage.main.invoke_url}/health"
    users         = "${aws_api_gateway_stage.main.invoke_url}/users"
    user_by_id    = "${aws_api_gateway_stage.main.invoke_url}/users/{id}"
    notifications = "${aws_api_gateway_stage.main.invoke_url}/notifications"
  }
}

output "cloudwatch_log_groups" {
  description = "CloudWatch Log Group names"
  value = {
    api_gateway = aws_cloudwatch_log_group.api_gateway_logs.name
    lambda_logs = { for k, v in aws_cloudwatch_log_group.lambda_logs : k => v.name }
  }
}

output "api_gateway_id" {
  description = "ID of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.microservices_api.id
}

output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = var.environment_suffix
}