# ProjectX Serverless Stack Outputs
# Exports important ARNs and resource identifiers for external reference

output "api_gateway_endpoint" {
  description = "API Gateway endpoint URL for ProjectX"
  value       = aws_apigatewayv2_stage.main.invoke_url
}

output "api_gateway_id" {
  description = "API Gateway ID"
  value       = aws_apigatewayv2_api.main.id
}

output "lambda_api_handler_arn" {
  description = "ARN of the API handler Lambda function"
  value       = aws_lambda_function.api_handler.arn
}

output "lambda_api_handler_name" {
  description = "Name of the API handler Lambda function"
  value       = aws_lambda_function.api_handler.function_name
}

output "lambda_data_processor_arn" {
  description = "ARN of the data processor Lambda function"
  value       = aws_lambda_function.data_processor.arn
}

output "lambda_data_processor_name" {
  description = "Name of the data processor Lambda function"
  value       = aws_lambda_function.data_processor.function_name
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table for application data"
  value       = aws_dynamodb_table.app_data.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.app_data.arn
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for application assets"
  value       = aws_s3_bucket.app_assets.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket for application assets"
  value       = aws_s3_bucket.app_assets.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for Lambda error notifications"
  value       = aws_sns_topic.lambda_errors.arn
}
