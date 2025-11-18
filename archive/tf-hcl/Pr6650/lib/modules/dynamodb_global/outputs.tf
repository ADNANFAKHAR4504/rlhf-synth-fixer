output "session_table_name" {
  description = "Name of the session state DynamoDB table"
  value       = aws_dynamodb_table.session_state.name
}

output "session_table_arn" {
  description = "ARN of the session state DynamoDB table"
  value       = aws_dynamodb_table.session_state.arn
}

output "app_state_table_name" {
  description = "Name of the application state DynamoDB table"
  value       = aws_dynamodb_table.app_state.name
}

output "app_state_table_arn" {
  description = "ARN of the application state DynamoDB table"
  value       = aws_dynamodb_table.app_state.arn
}

output "dynamodb_policy_arn" {
  description = "ARN of the IAM policy for DynamoDB access"
  value       = aws_iam_policy.dynamodb_access.arn
}

output "session_table_stream_arn" {
  description = "Stream ARN of the session state table"
  value       = aws_dynamodb_table.session_state.stream_arn
}

output "app_state_table_stream_arn" {
  description = "Stream ARN of the application state table"
  value       = aws_dynamodb_table.app_state.stream_arn
}