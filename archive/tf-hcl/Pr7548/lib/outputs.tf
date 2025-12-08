output "api_gateway_url" {
  description = "API Gateway endpoint URL"
  value       = "${aws_api_gateway_stage.prod.invoke_url}/webhook/{provider}"
}

output "api_gateway_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.webhook_api.id
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.webhook_processor.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.webhook_processor.arn
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.webhooks.name
}

output "dynamodb_table_arn" {
  description = "DynamoDB table ARN"
  value       = aws_dynamodb_table.webhooks.arn
}

output "step_functions_arn" {
  description = "Step Functions state machine ARN"
  value       = aws_sfn_state_machine.webhook_orchestration.arn
}

output "dlq_url" {
  description = "Dead Letter Queue URL"
  value       = aws_sqs_queue.lambda_dlq.url
}

output "dlq_arn" {
  description = "Dead Letter Queue ARN"
  value       = aws_sqs_queue.lambda_dlq.arn
}

output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.webhook_monitoring.dashboard_name
}

output "kms_key_lambda_env_id" {
  description = "KMS key ID for Lambda environment variables"
  value       = aws_kms_key.lambda_env.id
}

output "kms_key_cloudwatch_logs_id" {
  description = "KMS key ID for CloudWatch Logs"
  value       = aws_kms_key.cloudwatch_logs.id
}
