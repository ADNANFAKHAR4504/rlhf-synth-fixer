output "api_gateway_url" {
  description = "API Gateway webhook endpoint URL"
  value       = "${aws_api_gateway_stage.production.invoke_url}/webhook"
}

output "lambda_function_name" {
  description = "Name of the fraud detector Lambda function"
  value       = aws_lambda_function.fraud_detector.function_name
}

output "lambda_function_arn" {
  description = "ARN of the fraud detector Lambda function"
  value       = aws_lambda_function.fraud_detector.arn
}

output "dynamodb_table_name" {
  description = "Name of the fraud patterns DynamoDB table"
  value       = aws_dynamodb_table.fraud_patterns.name
}

output "s3_audit_bucket" {
  description = "S3 bucket name for audit trail storage"
  value       = aws_s3_bucket.audit_trail.id
}

output "ecr_repository_url" {
  description = "ECR repository URL for Lambda container images"
  value       = aws_ecr_repository.lambda_fraud_detector.repository_url
}

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = aws_kms_key.fraud_detection.id
}

output "dlq_url" {
  description = "Dead letter queue URL"
  value       = aws_sqs_queue.fraud_detection_dlq.url
}

output "eventbridge_rule_name" {
  description = "EventBridge rule name for batch processing"
  value       = aws_cloudwatch_event_rule.batch_processing.name
}
