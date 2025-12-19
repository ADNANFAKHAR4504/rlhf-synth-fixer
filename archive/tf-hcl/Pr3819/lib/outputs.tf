output "api_endpoint" {
  description = "API Gateway endpoint URL for feedback submission"
  value       = "${aws_api_gateway_stage.prod.invoke_url}/feedback"
}

output "api_gateway_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.feedback_api.id
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.feedback_processor.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.feedback_processor.arn
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.feedback.name
}

output "dynamodb_table_arn" {
  description = "DynamoDB table ARN"
  value       = aws_dynamodb_table.feedback.arn
}

output "s3_data_lake_bucket" {
  description = "S3 bucket for data lake"
  value       = aws_s3_bucket.feedback_data_lake.id
}

output "s3_data_lake_arn" {
  description = "S3 data lake bucket ARN"
  value       = aws_s3_bucket.feedback_data_lake.arn
}

output "s3_athena_results_bucket" {
  description = "S3 bucket for Athena query results"
  value       = aws_s3_bucket.athena_results.id
}

output "glue_database_name" {
  description = "Glue catalog database name"
  value       = aws_glue_catalog_database.feedback_db.name
}

output "glue_crawler_name" {
  description = "Glue crawler name"
  value       = aws_glue_crawler.feedback_crawler.name
}

output "athena_workgroup_name" {
  description = "Athena workgroup name"
  value       = aws_athena_workgroup.feedback_analytics.name
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group for Lambda"
  value       = aws_cloudwatch_log_group.feedback_processor.name
}
