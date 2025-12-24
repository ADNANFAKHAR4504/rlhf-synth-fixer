output "sns_topic_arn" {
  description = "ARN of the SNS topic for payment events"
  value       = aws_sns_topic.payment_events.arn
}

output "step_functions_arn" {
  description = "ARN of the Step Functions state machine"
  value       = aws_sfn_state_machine.event_processing.arn
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table for processed events"
  value       = aws_dynamodb_table.processed_events.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table for processed events"
  value       = aws_dynamodb_table.processed_events.arn
}

output "ecr_repository_url" {
  description = "URL of the ECR repository for Lambda container images"
  value       = aws_ecr_repository.lambda_images.repository_url
}

output "validator_lambda_arn" {
  description = "ARN of the event-validator Lambda function"
  value       = aws_lambda_function.validator.arn
}

output "processor_lambda_arn" {
  description = "ARN of the event-processor Lambda function"
  value       = aws_lambda_function.processor.arn
}

output "enricher_lambda_arn" {
  description = "ARN of the event-enricher Lambda function"
  value       = aws_lambda_function.enricher.arn
}

output "validator_dlq_url" {
  description = "URL of the validator dead letter queue"
  value       = aws_sqs_queue.validator_dlq.url
}

output "processor_dlq_url" {
  description = "URL of the processor dead letter queue"
  value       = aws_sqs_queue.processor_dlq.url
}

output "enricher_dlq_url" {
  description = "URL of the enricher dead letter queue"
  value       = aws_sqs_queue.enricher_dlq.url
}

output "kms_key_arn" {
  description = "ARN of the KMS key for CloudWatch Logs encryption"
  value       = aws_kms_key.cloudwatch_logs.arn
}

output "cloudwatch_log_groups" {
  description = "CloudWatch Log Group names for all Lambda functions"
  value = jsonencode({
    validator      = aws_cloudwatch_log_group.validator.name
    processor      = aws_cloudwatch_log_group.processor.name
    enricher       = aws_cloudwatch_log_group.enricher.name
    event_trigger  = aws_cloudwatch_log_group.event_trigger.name
    step_functions = aws_cloudwatch_log_group.step_functions.name
  })
}
