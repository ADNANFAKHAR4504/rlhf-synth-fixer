output "config_rule_arns" {
  description = "ARNs of AWS Config rules"
  value = {
    ec2_instance_type    = aws_config_config_rule.ec2_instance_type.arn
    s3_bucket_encryption = aws_config_config_rule.s3_bucket_encryption.arn
    rds_backup_retention = aws_config_config_rule.rds_backup_retention.arn
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

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table storing compliance results"
  value       = aws_dynamodb_table.compliance_results.name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for compliance alerts"
  value       = aws_sns_topic.compliance_alerts.arn
}
