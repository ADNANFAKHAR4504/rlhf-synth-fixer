output "config_bucket_name" {
  description = "Name of the S3 bucket for AWS Config"
  value       = aws_s3_bucket.config_bucket.bucket
}

output "critical_alerts_topic_arn" {
  description = "ARN of the critical alerts SNS topic"
  value       = aws_sns_topic.critical_alerts.arn
}

output "warning_alerts_topic_arn" {
  description = "ARN of the warning alerts SNS topic"
  value       = aws_sns_topic.warning_alerts.arn
}

output "compliance_analyzer_function_name" {
  description = "Name of the compliance analyzer Lambda function"
  value       = aws_lambda_function.compliance_analyzer.function_name
}

output "compliance_tagger_function_name" {
  description = "Name of the compliance tagger Lambda function"
  value       = aws_lambda_function.compliance_tagger.function_name
}

output "compliance_dashboard_url" {
  description = "URL to the CloudWatch compliance dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.compliance_dashboard.dashboard_name}"
}
