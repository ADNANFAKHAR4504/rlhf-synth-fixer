output "api_gateway_url" {
  description = "API Gateway endpoint URL"
  value       = aws_api_gateway_stage.main.invoke_url
}

# output "pipeline_name" {
#   description = "CodePipeline name"
#   value       = aws_codepipeline.main.name
# }

output "artifacts_bucket" {
  description = "S3 bucket for artifacts"
  value       = aws_s3_bucket.artifacts.bucket
}

output "static_assets_bucket" {
  description = "S3 bucket for static assets"
  value       = aws_s3_bucket.static_assets.bucket
}

output "lambda_function_names" {
  description = "Lambda function names"
  value       = [for fn in aws_lambda_function.services : fn.function_name]
}

output "dynamodb_tables" {
  description = "DynamoDB table names"
  value = {
    users         = aws_dynamodb_table.users.name
    orders        = aws_dynamodb_table.orders.name
    notifications = aws_dynamodb_table.notifications.name
  }
}

output "sns_topic_arn" {
  description = "SNS topic ARN for deployment notifications"
  value       = aws_sns_topic.deployment_notifications.arn
}

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = aws_kms_key.pipeline_key.key_id
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}