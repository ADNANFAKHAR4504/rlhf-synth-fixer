output "config_bucket_name" {
  description = "Name of the S3 bucket for Config data"
  value       = aws_s3_bucket.config_bucket.id
}

output "config_bucket_arn" {
  description = "ARN of the S3 bucket for Config data"
  value       = aws_s3_bucket.config_bucket.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for compliance notifications"
  value       = aws_sns_topic.compliance_notifications.arn
}

output "config_role_arn" {
  description = "ARN of the IAM role for AWS Config"
  value       = aws_iam_role.config_role.arn
}

output "lambda_role_arn" {
  description = "ARN of the IAM role for Lambda functions"
  value       = aws_iam_role.lambda_role.arn
}

output "config_aggregator_arn" {
  description = "ARN of the Config aggregator"
  value       = aws_config_configuration_aggregator.organization.arn
}

output "encryption_lambda_arns" {
  description = "ARNs of encryption check Lambda functions"
  value       = { for region, func in aws_lambda_function.encryption_check : region => func.arn }
}

output "tagging_lambda_arns" {
  description = "ARNs of tagging check Lambda functions"
  value       = { for region, func in aws_lambda_function.tagging_check : region => func.arn }
}

output "backup_lambda_arns" {
  description = "ARNs of backup check Lambda functions"
  value       = { for region, func in aws_lambda_function.backup_check : region => func.arn }
}

output "config_recorder_names" {
  description = "Names of Config recorders by region"
  value = {
    "us-east-1" = aws_config_configuration_recorder.us_east_1.name
    "us-west-2" = aws_config_configuration_recorder.us_west_2.name
    "eu-west-1" = aws_config_configuration_recorder.eu_west_1.name
  }
}
