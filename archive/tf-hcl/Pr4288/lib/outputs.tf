output "region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}

output "log_bucket_name" {
  description = "Name of the S3 bucket storing logs"
  value       = aws_s3_bucket.log_storage.id
}

output "log_bucket_arn" {
  description = "ARN of the S3 bucket storing logs"
  value       = aws_s3_bucket.log_storage.arn
}

output "firehose_delivery_streams" {
  description = "Firehose delivery stream names by log type"
  value = {
    for k, v in aws_kinesis_firehose_delivery_stream.log_delivery_stream : k => v.name
  }
}

output "firehose_delivery_streams_arns" {
  description = "Firehose delivery stream ARNs by log type"
  value = {
    for k, v in aws_kinesis_firehose_delivery_stream.log_delivery_stream : k => v.arn
  }
}

output "lambda_function_name" {
  description = "Name of the log processing Lambda function"
  value       = aws_lambda_function.log_processor.function_name
}

output "lambda_function_arn" {
  description = "ARN of the log processing Lambda function"
  value       = aws_lambda_function.log_processor.arn
}

output "glue_database_name" {
  description = "Name of the Glue database for log analytics"
  value       = aws_glue_catalog_database.logs_database.name
}

output "glue_table_names" {
  description = "Names of Glue tables by log type"
  value = {
    for k, v in aws_glue_catalog_table.logs_table : k => v.name
  }
}

output "glue_crawler_name" {
  description = "Glue crawler name"
  value       = aws_glue_crawler.logs_crawler.name
}

output "athena_workgroup_name" {
  description = "Name of the Athena workgroup for log analysis"
  value       = aws_athena_workgroup.logs_analytics.name
}

output "athena_results_location" {
  description = "S3 location for Athena query results"
  value       = "s3://${aws_s3_bucket.log_storage.id}/athena-results/"
}

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.logs_dashboard.dashboard_name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alarm notifications"
  value       = aws_sns_topic.alarm_notifications.arn
}

output "iam_roles" {
  description = "Key IAM role ARNs created by this stack"
  value = {
    firehose = aws_iam_role.firehose_role.arn
    lambda   = aws_iam_role.lambda_role.arn
    glue     = aws_iam_role.glue_role.arn
    athena   = aws_iam_role.athena_role.arn
  }
}

output "iam_role_names" {
  description = "Key IAM role names created by this stack"
  value = {
    firehose = aws_iam_role.firehose_role.name
    lambda   = aws_iam_role.lambda_role.name
    glue     = aws_iam_role.glue_role.name
    athena   = aws_iam_role.athena_role.name
  }
}

output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = local.environment_suffix
}

output "quicksight_data_source_id" {
  description = "QuickSight data source ID"
  value       = aws_quicksight_data_source.logs_data_source.data_source_id
}

output "quicksight_data_source_arn" {
  description = "QuickSight data source ARN"
  value       = aws_quicksight_data_source.logs_data_source.arn
}

output "quicksight_dataset_id" {
  description = "QuickSight dataset ID"
  value       = aws_quicksight_data_set.logs_dataset.data_set_id
}

output "quicksight_dataset_arn" {
  description = "QuickSight dataset ARN"
  value       = aws_quicksight_data_set.logs_dataset.arn
}
