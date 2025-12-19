output "s3_bucket_name" {
  description = "Name of the S3 bucket for receipt uploads"
  value       = aws_s3_bucket.receipts.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.receipts.arn
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB expenses table"
  value       = aws_dynamodb_table.expenses.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB expenses table"
  value       = aws_dynamodb_table.expenses.arn
}

output "step_function_arn" {
  description = "ARN of the Step Functions state machine"
  value       = aws_sfn_state_machine.receipt_processing.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for notifications"
  value       = aws_sns_topic.processing_notifications.arn
}

output "dlq_url" {
  description = "URL of the Dead Letter Queue"
  value       = aws_sqs_queue.dlq.url
}

output "lambda_functions" {
  description = "Names of all Lambda functions"
  value = {
    trigger  = aws_lambda_function.process_trigger.function_name
    ocr      = aws_lambda_function.ocr_processor.function_name
    category = aws_lambda_function.category_detector.function_name
    saver    = aws_lambda_function.expense_saver.function_name
  }
}

output "cloudwatch_alarms" {
  description = "Names of CloudWatch alarms"
  value = {
    processing_errors = aws_cloudwatch_metric_alarm.processing_errors.alarm_name
    lambda_errors     = aws_cloudwatch_metric_alarm.lambda_errors.alarm_name
    dlq_messages      = aws_cloudwatch_metric_alarm.dlq_messages.alarm_name
  }
}