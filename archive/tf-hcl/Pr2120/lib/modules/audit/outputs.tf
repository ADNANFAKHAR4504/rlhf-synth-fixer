output "cloudtrail_arn" {
  description = "ARN of the CloudTrail trail"
  value       = aws_cloudtrail.main.arn
}

output "cloudtrail_s3_bucket_name" {
  description = "Name of the S3 bucket where CloudTrail logs are stored"
  value       = aws_s3_bucket.cloudtrail.id
}

output "cloudtrail_log_group_name" {
  description = "Name of the CloudWatch Log Group for CloudTrail"
  value       = aws_cloudwatch_log_group.cloudtrail.name
}

output "cloudtrail_role_arn" {
  description = "ARN of the IAM role used by CloudTrail for CloudWatch integration"
  value       = aws_iam_role.cloudtrail_cloudwatch.arn
}

output "cloudtrail_dashboard_name" {
  description = "Name of the CloudWatch Dashboard for CloudTrail insights"
  value       = aws_cloudwatch_dashboard.cloudtrail.dashboard_name
}
