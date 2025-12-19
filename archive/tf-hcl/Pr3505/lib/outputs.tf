output "api_gateway_url" {
  description = "URL of the API Gateway endpoint"
  value       = "https://${aws_api_gateway_rest_api.webhook_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.prod.stage_name}/webhook"
}

output "sqs_queue_url" {
  description = "URL of the SQS processing queue"
  value       = aws_sqs_queue.webhook_processing.url
}

output "dlq_url" {
  description = "URL of the Dead Letter Queue"
  value       = aws_sqs_queue.webhook_dlq.url
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table for webhook logs"
  value       = aws_dynamodb_table.webhook_logs.name
}

output "event_bus_name" {
  description = "Name of the EventBridge custom event bus"
  value       = aws_cloudwatch_event_bus.webhook_events.name
}

output "validation_lambda_function_name" {
  description = "Name of the validation Lambda function"
  value       = aws_lambda_function.webhook_validation.function_name
}

output "routing_lambda_function_name" {
  description = "Name of the routing Lambda function"
  value       = aws_lambda_function.webhook_routing.function_name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "secret_arn" {
  description = "ARN of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.webhook_secrets.arn
}