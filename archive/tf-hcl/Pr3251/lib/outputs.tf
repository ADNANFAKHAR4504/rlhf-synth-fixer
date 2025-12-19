output "sqs_queue_url" {
  description = "URL of the SQS FIFO queue"
  value       = aws_sqs_queue.quiz_submissions_fifo.id
}

output "sqs_queue_arn" {
  description = "ARN of the SQS FIFO queue"
  value       = aws_sqs_queue.quiz_submissions_fifo.arn
}

output "dlq_url" {
  description = "URL of the Dead Letter Queue"
  value       = aws_sqs_queue.quiz_submissions_dlq.id
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.quiz_results.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.quiz_results.arn
}

output "lambda_function_arn" {
  description = "ARN of the quiz processor Lambda function"
  value       = aws_lambda_function.quiz_processor.arn
}

output "health_check_lambda_arn" {
  description = "ARN of the health check Lambda function"
  value       = aws_lambda_function.health_check.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "cloudwatch_alarm_name" {
  description = "Name of the CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.queue_depth_alarm.alarm_name
}