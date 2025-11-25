output "s3_bucket_name" {
  description = "Name of the S3 bucket for reconciliation data"
  value       = aws_s3_bucket.reconciliation_data.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.reconciliation_data.arn
}

output "state_machine_arn" {
  description = "ARN of the Step Functions state machine"
  value       = aws_sfn_state_machine.reconciliation_workflow.arn
}

output "state_machine_name" {
  description = "Name of the Step Functions state machine"
  value       = aws_sfn_state_machine.reconciliation_workflow.name
}

output "transaction_table_name" {
  description = "Name of the DynamoDB transaction records table"
  value       = aws_dynamodb_table.transaction_records.name
}

output "results_table_name" {
  description = "Name of the DynamoDB reconciliation results table"
  value       = aws_dynamodb_table.reconciliation_results.name
}

output "sns_topic_arn" {
  description = "ARN of the SNS notification topic"
  value       = aws_sns_topic.reconciliation_notifications.arn
}

output "dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.reconciliation_dashboard.dashboard_name
}

output "file_parser_function_name" {
  description = "Name of the file parser Lambda function"
  value       = aws_lambda_function.file_parser.function_name
}

output "transaction_validator_function_name" {
  description = "Name of the transaction validator Lambda function"
  value       = aws_lambda_function.transaction_validator.function_name
}

output "report_generator_function_name" {
  description = "Name of the report generator Lambda function"
  value       = aws_lambda_function.report_generator.function_name
}
