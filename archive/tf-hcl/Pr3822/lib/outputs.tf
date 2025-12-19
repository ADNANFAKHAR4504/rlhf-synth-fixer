# outputs.tf

output "s3_bucket_name" {
  description = "Name of the S3 bucket for log storage"
  value       = aws_s3_bucket.log_storage.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket for log storage"
  value       = aws_s3_bucket.log_storage.arn
}

output "kms_key_id" {
  description = "ID of the KMS key for encryption"
  value       = aws_kms_key.logging_key.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key for encryption"
  value       = aws_kms_key.logging_key.arn
}

output "firehose_delivery_stream_name" {
  description = "Name of the Kinesis Firehose delivery stream"
  value       = aws_kinesis_firehose_delivery_stream.logs.name
}

output "firehose_delivery_stream_arn" {
  description = "ARN of the Kinesis Firehose delivery stream"
  value       = aws_kinesis_firehose_delivery_stream.logs.arn
}

output "lambda_function_name" {
  description = "Name of the Lambda function for log transformation"
  value       = aws_lambda_function.log_transformer.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function for log transformation"
  value       = aws_lambda_function.log_transformer.arn
}

output "cloudwatch_log_groups" {
  description = "Map of application names to CloudWatch Log Group names"
  value = {
    for idx, lg in aws_cloudwatch_log_group.applications :
    "app-${format("%02d", idx + 1)}" => lg.name
  }
}

output "cloudwatch_log_group_arns" {
  description = "List of CloudWatch Log Group ARNs"
  value       = [for lg in aws_cloudwatch_log_group.applications : lg.arn]
}

output "cross_account_role_arn" {
  description = "ARN of the cross-account audit role"
  value       = length(var.cross_account_ids) > 0 ? aws_iam_role.cross_account_audit[0].arn : null
}

output "cloudwatch_insights_queries" {
  description = "CloudWatch Insights query definition names"
  value = {
    error_logs            = aws_cloudwatch_query_definition.error_logs.name
    application_stats     = aws_cloudwatch_query_definition.application_stats.name
    hourly_log_volume     = aws_cloudwatch_query_definition.hourly_log_volume.name
    errors_by_application = aws_cloudwatch_query_definition.application_errors_by_type.name
    recent_logs_all_apps  = aws_cloudwatch_query_definition.recent_logs_all_apps.name
  }
}

output "firehose_cloudwatch_log_group" {
  description = "CloudWatch Log Group for Firehose monitoring"
  value       = aws_cloudwatch_log_group.firehose.name
}
