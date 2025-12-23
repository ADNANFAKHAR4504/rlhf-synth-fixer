# outputs.tf - Output values for drift detection system

output "drift_reports_bucket_name" {
  description = "Name of the S3 bucket storing drift reports"
  value       = aws_s3_bucket.drift_reports.bucket
}

output "drift_reports_bucket_arn" {
  description = "ARN of the S3 bucket storing drift reports"
  value       = aws_s3_bucket.drift_reports.arn
}

output "state_lock_table_name" {
  description = "Name of the DynamoDB table for state locking"
  value       = aws_dynamodb_table.terraform_state_lock.name
}

output "state_lock_table_arn" {
  description = "ARN of the DynamoDB table for state locking"
  value       = aws_dynamodb_table.terraform_state_lock.arn
}

output "drift_detector_function_name" {
  description = "Name of the Lambda function for drift detection"
  value       = aws_lambda_function.drift_detector.function_name
}

output "drift_detector_function_arn" {
  description = "ARN of the Lambda function for drift detection"
  value       = aws_lambda_function.drift_detector.arn
}

output "drift_alerts_topic_arn" {
  description = "ARN of the SNS topic for drift alerts"
  value       = aws_sns_topic.drift_alerts.arn
}

output "config_bucket_name" {
  description = "Name of the S3 bucket for AWS Config"
  value       = aws_s3_bucket.config_bucket.bucket
}

output "cross_account_role_arn" {
  description = "ARN of the IAM role for cross-account access"
  value       = aws_iam_role.cross_account_drift_analysis.arn
}

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard for drift metrics"
  value       = aws_cloudwatch_dashboard.drift_metrics.dashboard_name
}

output "drift_reports_us_west_2_bucket" {
  description = "Name of drift reports bucket in us-west-2"
  value       = aws_s3_bucket.drift_reports_us_west_2.bucket
}

output "drift_reports_eu_central_1_bucket" {
  description = "Name of drift reports bucket in eu-central-1"
  value       = aws_s3_bucket.drift_reports_eu_central_1.bucket
}
