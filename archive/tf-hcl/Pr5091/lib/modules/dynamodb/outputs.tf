output "table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.feature_flags.name
}

output "table_arn" {
  description = "DynamoDB table ARN"
  value       = aws_dynamodb_table.feature_flags.arn
}

output "stream_arn" {
  description = "DynamoDB stream ARN"
  value       = aws_dynamodb_table.feature_flags.stream_arn
}

output "stream_processor_role_arn" {
  description = "Stream processor role ARN"
  value       = aws_iam_role.stream_processor.arn
}
