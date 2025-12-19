# outputs.tf
output "api_endpoint" {
  description = "HTTP API endpoint URL"
  value       = aws_apigatewayv2_stage.api_stage.invoke_url
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.transactions.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.transactions.arn
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.transaction_processor.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.transaction_processor.arn
}

output "cloudwatch_dashboard_url" {
  description = "URL to CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.fintech_dashboard.dashboard_name}"
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "xray_service_map_url" {
  description = "URL to X-Ray service map"
  value       = "https://console.aws.amazon.com/xray/home?region=${var.aws_region}#/service-map"
}

output "xray_group_arn" {
  description = "ARN of the X-Ray group"
  value       = aws_xray_group.fintech_api_group.arn
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.fintech_api_waf.arn
}

output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.fintech_api_waf.id
}