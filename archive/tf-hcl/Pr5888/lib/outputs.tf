output "api_gateway_url" {
  description = "API Gateway invoke URL"
  value       = "${aws_api_gateway_stage.webhook_stage.invoke_url}/webhooks"
}

output "custom_domain_url" {
  description = "Custom domain URL for API Gateway"
  value       = "https://${aws_api_gateway_domain_name.webhook_domain.domain_name}/webhooks"
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.webhooks.name
}

output "sqs_queue_url" {
  description = "SQS FIFO queue URL"
  value       = aws_sqs_queue.webhook_queue.id
}

output "sns_topic_arn" {
  description = "SNS topic ARN"
  value       = aws_sns_topic.webhook_notifications.arn
}

output "validation_lambda_arn" {
  description = "Validation Lambda function ARN"
  value       = aws_lambda_function.webhook_validation.arn
}

output "processing_lambda_arn" {
  description = "Processing Lambda function ARN"
  value       = aws_lambda_function.webhook_processing.arn
}

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = aws_kms_key.webhook_kms.id
}

output "dlq_url" {
  description = "Dead letter queue URL"
  value       = aws_sqs_queue.webhook_dlq.id
}

output "regional_domain_name" {
  description = "Regional domain name for Route53 alias"
  value       = aws_api_gateway_domain_name.webhook_domain.regional_domain_name
}

output "regional_zone_id" {
  description = "Regional zone ID for Route53 alias"
  value       = aws_api_gateway_domain_name.webhook_domain.regional_zone_id
}
