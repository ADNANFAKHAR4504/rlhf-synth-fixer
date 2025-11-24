output "api_endpoint" {
  description = "Public API Gateway endpoint for the webhook POST"
  value       = format("https://%s.execute-api.%s.amazonaws.com/%s/webhook", aws_api_gateway_rest_api.webhook_api.id, var.aws_region, aws_api_gateway_stage.webhook_stage.stage_name)
}

output "api_key_id" {
  value = aws_api_gateway_api_key.webhook_key.id
}

output "webhook_receiver_arn" {
  value = aws_lambda_function.webhook_receiver.arn
}

output "payload_validator_arn" {
  value = aws_lambda_function.payload_validator.arn
}

output "transaction_processor_arn" {
  value = aws_lambda_function.transaction_processor.arn
}

output "dynamodb_table_name" {
  value = aws_dynamodb_table.transactions.name
}

output "webhook_payloads_bucket" {
  value = aws_s3_bucket.webhook_payloads.id
}

output "failed_messages_bucket" {
  value = aws_s3_bucket.failed_messages.id
}

output "processing_queue_url" {
  value = aws_sqs_queue.webhook_processing_queue.id
}

output "validated_queue_url" {
  value = aws_sqs_queue.validated_queue.id
}

output "dlq_url" {
  value = aws_sqs_queue.webhook_dlq.id
}

output "random_suffix" {
  value = random_string.suffix.result
}
