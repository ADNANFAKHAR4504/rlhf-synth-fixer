# modules/sqs/outputs.tf

output "transaction_validation_queue_arn" {
  description = "ARN of the transaction validation queue"
  value       = aws_sqs_queue.transaction_validation.arn
}

output "transaction_validation_queue_url" {
  description = "URL of the transaction validation queue"
  value       = aws_sqs_queue.transaction_validation.url
}

output "transaction_validation_queue_name" {
  description = "Name of the transaction validation queue"
  value       = aws_sqs_queue.transaction_validation.name
}

output "transaction_validation_dlq_arn" {
  description = "ARN of the transaction validation dead letter queue"
  value       = aws_sqs_queue.transaction_validation_dlq.arn
}

output "transaction_validation_dlq_name" {
  description = "Name of the transaction validation dead letter queue"
  value       = aws_sqs_queue.transaction_validation_dlq.name
}

output "fraud_detection_queue_arn" {
  description = "ARN of the fraud detection queue"
  value       = aws_sqs_queue.fraud_detection.arn
}

output "fraud_detection_queue_url" {
  description = "URL of the fraud detection queue"
  value       = aws_sqs_queue.fraud_detection.url
}

output "fraud_detection_queue_name" {
  description = "Name of the fraud detection queue"
  value       = aws_sqs_queue.fraud_detection.name
}

output "fraud_detection_dlq_arn" {
  description = "ARN of the fraud detection dead letter queue"
  value       = aws_sqs_queue.fraud_detection_dlq.arn
}

output "fraud_detection_dlq_name" {
  description = "Name of the fraud detection dead letter queue"
  value       = aws_sqs_queue.fraud_detection_dlq.name
}

output "payment_notification_queue_arn" {
  description = "ARN of the payment notification queue"
  value       = aws_sqs_queue.payment_notification.arn
}

output "payment_notification_queue_url" {
  description = "URL of the payment notification queue"
  value       = aws_sqs_queue.payment_notification.url
}

output "payment_notification_queue_name" {
  description = "Name of the payment notification queue"
  value       = aws_sqs_queue.payment_notification.name
}

output "payment_notification_dlq_arn" {
  description = "ARN of the payment notification dead letter queue"
  value       = aws_sqs_queue.payment_notification_dlq.arn
}

output "payment_notification_dlq_name" {
  description = "Name of the payment notification dead letter queue"
  value       = aws_sqs_queue.payment_notification_dlq.name
}

output "transaction_state_table_arn" {
  description = "ARN of the DynamoDB transaction state table"
  value       = aws_dynamodb_table.transaction_state.arn
}

output "transaction_state_table_name" {
  description = "Name of the DynamoDB transaction state table"
  value       = aws_dynamodb_table.transaction_state.name
}

output "validation_queue_url_parameter" {
  description = "SSM parameter name for validation queue URL"
  value       = aws_ssm_parameter.validation_queue_url.name
}

output "fraud_queue_url_parameter" {
  description = "SSM parameter name for fraud queue URL"
  value       = aws_ssm_parameter.fraud_queue_url.name
}

output "notification_queue_url_parameter" {
  description = "SSM parameter name for notification queue URL"
  value       = aws_ssm_parameter.notification_queue_url.name
}