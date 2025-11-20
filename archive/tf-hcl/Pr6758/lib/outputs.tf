output "input_bucket_name" {
  description = "Name of the S3 input bucket"
  value       = aws_s3_bucket.input.bucket
}

output "output_bucket_name" {
  description = "Name of the S3 output bucket"
  value       = aws_s3_bucket.output.bucket
}

output "audit_bucket_name" {
  description = "Name of the S3 audit bucket"
  value       = aws_s3_bucket.audit.bucket
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.processor.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.processor.arn
}

output "dlq_url" {
  description = "URL of the dead letter queue"
  value       = aws_sqs_queue.dlq.url
}

output "dlq_arn" {
  description = "ARN of the dead letter queue"
  value       = aws_sqs_queue.dlq.arn
}

output "log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.lambda_logs.name
}

output "eventbridge_rule_name" {
  description = "Name of the EventBridge rule"
  value       = aws_cloudwatch_event_rule.s3_object_created.name
}
