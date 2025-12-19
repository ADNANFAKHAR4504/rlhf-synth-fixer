output "api_gateway_url" {
  description = "API Gateway URL"
  value       = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com/${var.environment}"
}

output "api_gateway_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.main.id
}

output "health_check_endpoint" {
  description = "Health check endpoint URL"
  value       = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com/${var.environment}/health"
}

output "items_endpoint" {
  description = "Items API endpoint URL"
  value       = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com/${var.environment}/api/v1/items"
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.main.name
}

output "dynamodb_table_arn" {
  description = "DynamoDB table ARN"
  value       = aws_dynamodb_table.main.arn
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.main.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.main.arn
}

output "kms_key_id" {
  description = "KMS Key ID for encryption"
  value       = aws_kms_key.platform_key.key_id
}

output "kms_key_arn" {
  description = "KMS Key ARN for encryption"
  value       = aws_kms_key.platform_key.arn
}

output "waf_web_acl_id" {
  description = "WAF Web ACL ID"
  value       = aws_wafv2_web_acl.main.id
}

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = aws_wafv2_web_acl.main.arn
}

output "waf_web_acl_name" {
  description = "WAF Web ACL Name"
  value       = aws_wafv2_web_acl.main.name
}

output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "s3_analytics_bucket" {
  description = "S3 bucket for analytics data"
  value       = aws_s3_bucket.analytics.id
}

output "s3_analytics_bucket_arn" {
  description = "S3 bucket ARN for analytics data"
  value       = aws_s3_bucket.analytics.arn
}

output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = local.env_suffix
}

output "resource_prefix" {
  description = "Resource prefix used for all resources"
  value       = local.resource_prefix
}

