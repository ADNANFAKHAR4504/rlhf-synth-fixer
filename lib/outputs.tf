output "config_rule_arns" {
  description = "ARNs of AWS Config rules"
  value = {
    ec2_instance_type    = aws_config_config_rule.ec2_instance_type.arn
    s3_bucket_encryption = aws_config_config_rule.s3_bucket_encryption.arn
    rds_backup_retention = aws_config_config_rule.rds_backup_retention.arn
  }
}

output "config_rule_names" {
  description = "Names of AWS Config rules"
  value = {
    ec2_instance_type    = aws_config_config_rule.ec2_instance_type.name
    s3_bucket_encryption = aws_config_config_rule.s3_bucket_encryption.name
    rds_backup_retention = aws_config_config_rule.rds_backup_retention.name
  }
}

output "lambda_function_name" {
  description = "Name of the compliance scanner Lambda function"
  value       = aws_lambda_function.compliance_scanner.function_name
}

output "reports_bucket_name" {
  description = "Name of the S3 bucket storing compliance reports"
  value       = aws_s3_bucket.reports.id
}

output "config_bucket_name" {
  description = "Name of the S3 bucket storing AWS Config data"
  value       = aws_s3_bucket.config.id
}

output "state_files_bucket_name" {
  description = "Name of the S3 bucket storing Terraform state files"
  value       = aws_s3_bucket.state_files.id
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table storing compliance results"
  value       = aws_dynamodb_table.compliance_results.name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for compliance alerts"
  value       = aws_sns_topic.compliance_alerts.arn
}

output "config_recorder_name" {
  description = "Name of the AWS Config configuration recorder"
  value       = aws_config_configuration_recorder.main.name
}

output "eventbridge_rule_name" {
  description = "Name of the EventBridge rule for scheduled compliance scans"
  value       = aws_cloudwatch_event_rule.compliance_scan.name
}

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard for compliance monitoring"
  value       = aws_cloudwatch_dashboard.compliance.dashboard_name
}

output "lambda_iam_role_name" {
  description = "Name of the IAM role for the Lambda function"
  value       = aws_iam_role.compliance_lambda.name
}

output "config_iam_role_name" {
  description = "Name of the IAM role for AWS Config"
  value       = aws_iam_role.config.name
}
