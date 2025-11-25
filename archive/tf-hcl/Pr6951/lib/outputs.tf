# Terraform Outputs

output "source_bucket_name" {
  description = "Name of the source S3 bucket"
  value       = aws_s3_bucket.source_documents.id
}

output "source_bucket_arn" {
  description = "ARN of the source S3 bucket"
  value       = aws_s3_bucket.source_documents.arn
}

output "target_bucket_name" {
  description = "Name of the target S3 bucket"
  value       = aws_s3_bucket.target_documents.id
}

output "target_bucket_arn" {
  description = "ARN of the target S3 bucket"
  value       = aws_s3_bucket.target_documents.arn
}

output "metadata_table_name" {
  description = "Name of the DynamoDB metadata table"
  value       = aws_dynamodb_table.metadata.name
}

output "metadata_table_arn" {
  description = "ARN of the DynamoDB metadata table"
  value       = aws_dynamodb_table.metadata.arn
}

output "migration_state_table_name" {
  description = "Name of the DynamoDB migration state table"
  value       = aws_dynamodb_table.migration_state.name
}

output "data_sync_lambda_arn" {
  description = "ARN of the data synchronization Lambda function"
  value       = aws_lambda_function.data_sync.arn
}

output "validation_lambda_arn" {
  description = "ARN of the validation Lambda function"
  value       = aws_lambda_function.validation.arn
}

output "cloudwatch_dashboard_url" {
  description = "URL to CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.source_region}#dashboards:name=${aws_cloudwatch_dashboard.migration.dashboard_name}"
}

output "step_functions_arn" {
  description = "ARN of the Step Functions state machine (if enabled)"
  value       = var.enable_step_functions ? aws_sfn_state_machine.migration_workflow[0].arn : null
}

output "eventbridge_bus_name" {
  description = "Name of the EventBridge custom event bus (if enabled)"
  value       = var.enable_eventbridge ? aws_cloudwatch_event_bus.migration[0].name : null
}

output "backup_vault_name" {
  description = "Name of the AWS Backup vault (if enabled)"
  value       = var.enable_backup ? aws_backup_vault.migration[0].name : null
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alarms"
  value       = aws_sns_topic.migration_alarms.arn
}

output "replication_role_arn" {
  description = "ARN of the S3 replication IAM role"
  value       = aws_iam_role.s3_replication.arn
}

output "migration_phase" {
  description = "Current migration phase"
  value       = var.migration_phase
}

output "cutover_date" {
  description = "Planned cutover date"
  value       = var.cutover_date
}

output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = var.environment_suffix
}
