# outputs.tf

# API Gateway Endpoints
output "api_gateway_url_primary" {
  description = "Primary region API Gateway endpoint URL"
  value       = "${aws_api_gateway_rest_api.main_primary.id}.execute-api.${var.primary_region}.amazonaws.com/${var.api_stage}-${var.environment_suffix}"
}

output "api_gateway_url_secondary" {
  description = "Secondary region API Gateway endpoint URL"
  value       = "${aws_api_gateway_rest_api.main_secondary.id}.execute-api.${var.secondary_region}.amazonaws.com/${var.api_stage}-${var.environment_suffix}"
}

output "api_gateway_id_primary" {
  description = "Primary API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.main_primary.id
}

output "api_gateway_id_secondary" {
  description = "Secondary API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.main_secondary.id
}

# CloudFront Distribution
output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.api.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.api.id
}

output "cloudfront_url" {
  description = "Full CloudFront URL for API access"
  value       = "https://${aws_cloudfront_distribution.api.domain_name}"
}

# DynamoDB Table
output "dynamodb_table_name" {
  description = "DynamoDB Global Table name"
  value       = aws_dynamodb_table.transactions.name
}

output "dynamodb_table_arn" {
  description = "DynamoDB table ARN"
  value       = aws_dynamodb_table.transactions.arn
}

# Lambda Functions
output "lambda_authorizer_name_primary" {
  description = "Lambda authorizer function name (primary)"
  value       = aws_lambda_function.authorizer_primary.function_name
}

output "lambda_authorizer_arn_primary" {
  description = "Lambda authorizer function ARN (primary)"
  value       = aws_lambda_function.authorizer_primary.arn
}

output "lambda_transaction_name_primary" {
  description = "Lambda transaction function name (primary)"
  value       = aws_lambda_function.transaction_primary.function_name
}

output "lambda_transaction_arn_primary" {
  description = "Lambda transaction function ARN (primary)"
  value       = aws_lambda_function.transaction_primary.arn
}

output "lambda_authorizer_name_secondary" {
  description = "Lambda authorizer function name (secondary)"
  value       = aws_lambda_function.authorizer_secondary.function_name
}

output "lambda_transaction_name_secondary" {
  description = "Lambda transaction function name (secondary)"
  value       = aws_lambda_function.transaction_secondary.function_name
}

# Secrets Manager
output "secrets_manager_secret_name" {
  description = "Secrets Manager secret name for API keys"
  value       = aws_secretsmanager_secret.api_keys.name
}

output "secrets_manager_secret_arn" {
  description = "Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.api_keys.arn
}

# CloudWatch
output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "cloudwatch_log_group_api_primary" {
  description = "CloudWatch log group for primary API Gateway"
  value       = aws_cloudwatch_log_group.api_gateway_primary.name
}

output "cloudwatch_log_group_lambda_primary" {
  description = "CloudWatch log group for primary Lambda transaction function"
  value       = aws_cloudwatch_log_group.lambda_transaction_primary.name
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alarms"
  value       = aws_sns_topic.alarms.arn
}

# WAF
output "waf_web_acl_id" {
  description = "WAF Web ACL ID"
  value       = aws_wafv2_web_acl.api_protection.id
}

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = aws_wafv2_web_acl.api_protection.arn
}

# Route 53 (optional)
output "route53_record_name" {
  description = "Route 53 record name (if enabled)"
  value       = var.enable_route53 ? aws_route53_record.api_primary[0].name : "Route 53 not enabled"
}

# General
output "primary_region" {
  description = "Primary AWS region"
  value       = var.primary_region
}

output "secondary_region" {
  description = "Secondary AWS region"
  value       = var.secondary_region
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}
