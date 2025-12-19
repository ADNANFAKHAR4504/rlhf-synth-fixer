# API Gateway Outputs
output "api_gateway_url" {
  description = "URL of the API Gateway endpoint"
  value       = "${aws_api_gateway_stage.production.invoke_url}/webhook"
}

output "api_gateway_id" {
  description = "ID of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.webhook_api.id
}

# Lambda Function Outputs
output "validator_lambda_arn" {
  description = "ARN of the validator Lambda function"
  value       = aws_lambda_function.validator.arn
}

output "processor_lambda_arn" {
  description = "ARN of the processor Lambda function"
  value       = aws_lambda_function.processor.arn
}

output "notifier_lambda_arn" {
  description = "ARN of the notifier Lambda function"
  value       = aws_lambda_function.notifier.arn
}

# SQS Queue Outputs
output "validation_queue_url" {
  description = "URL of the validation queue"
  value       = aws_sqs_queue.validation_queue.url
}

output "processing_queue_url" {
  description = "URL of the processing queue"
  value       = aws_sqs_queue.processing_queue.url
}

output "notification_queue_url" {
  description = "URL of the notification queue"
  value       = aws_sqs_queue.notification_queue.url
}

# DLQ Outputs
output "validation_dlq_url" {
  description = "URL of the validation dead-letter queue"
  value       = aws_sqs_queue.validation_dlq.url
}

output "processing_dlq_url" {
  description = "URL of the processing dead-letter queue"
  value       = aws_sqs_queue.processing_dlq.url
}

output "notification_dlq_url" {
  description = "URL of the notification dead-letter queue"
  value       = aws_sqs_queue.notification_dlq.url
}

# SNS Topic Output (will be added in iteration)
output "alarm_topic_arn" {
  description = "ARN of the SNS topic for CloudWatch alarms"
  value       = var.enable_alarms ? aws_sns_topic.alarms[0].arn : null
}
