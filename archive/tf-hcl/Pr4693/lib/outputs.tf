# outputs.tf - Important values for testing and integration

# API Gateway outputs
output "api_gateway_invoke_url" {
  description = "API Gateway invoke URL"
  value       = aws_api_gateway_stage.prod.invoke_url
}

output "api_gateway_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_gateway_arn" {
  description = "API Gateway REST API ARN"
  value       = aws_api_gateway_rest_api.main.arn
}

# CloudFront outputs
output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_url" {
  description = "CloudFront distribution URL"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

# Cognito outputs
output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = aws_cognito_user_pool.main.arn
}

output "cognito_user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = aws_cognito_user_pool_client.mobile_app.id
}

output "cognito_user_pool_domain" {
  description = "Cognito User Pool Domain"
  value       = aws_cognito_user_pool_domain.main.domain
}

# DynamoDB outputs
output "dynamodb_table_name" {
  description = "DynamoDB table name for user profiles"
  value       = aws_dynamodb_table.user_profiles.name
}

output "dynamodb_table_arn" {
  description = "DynamoDB table ARN"
  value       = aws_dynamodb_table.user_profiles.arn
}

output "dynamodb_table_stream_arn" {
  description = "DynamoDB table stream ARN"
  value       = aws_dynamodb_table.user_profiles.stream_arn
}

# Lambda outputs
output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.api_handler.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.api_handler.arn
}

output "lambda_log_group" {
  description = "Lambda CloudWatch log group name"
  value       = aws_cloudwatch_log_group.lambda.name
}

# Region outputs
output "primary_region" {
  description = "Primary AWS region"
  value       = var.primary_region
}

output "secondary_region" {
  description = "Secondary AWS region for Global Tables"
  value       = var.secondary_region
}

# Route53 outputs (conditional)
output "route53_zone_id" {
  description = "Route53 hosted zone ID (only if enabled)"
  value       = var.enable_route53 ? aws_route53_zone.main[0].zone_id : null
}

output "route53_name_servers" {
  description = "Route53 name servers (only if enabled)"
  value       = var.enable_route53 ? aws_route53_zone.main[0].name_servers : null
}

output "custom_domain_name" {
  description = "Custom domain name (only if Route53 enabled)"
  value       = var.enable_route53 ? var.domain_name : null
}

# Monitoring outputs
output "sns_topic_arn" {
  description = "SNS topic ARN for alarms"
  value       = aws_sns_topic.api_alarms.arn
}

output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

# Environment outputs
output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = var.environment_suffix
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}
