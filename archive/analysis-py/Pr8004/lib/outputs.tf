# outputs.tf

output "api_invoke_url" {
  description = "API Gateway invoke URL for testing"
  value       = "${aws_api_gateway_stage.v1.invoke_url}/convert"
}

output "api_key" {
  description = "API key for authentication"
  value       = aws_api_gateway_api_key.currency_api_key.value
  sensitive   = true
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.currency_converter.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.currency_converter.arn
}

output "api_gateway_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.currency_api.id
}

output "cloudwatch_log_group_lambda" {
  description = "CloudWatch Log Group for Lambda"
  value       = aws_cloudwatch_log_group.lambda_logs.name
}

output "cloudwatch_log_group_api" {
  description = "CloudWatch Log Group for API Gateway"
  value       = aws_cloudwatch_log_group.api_gateway_logs.name
}
