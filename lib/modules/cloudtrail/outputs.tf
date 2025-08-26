output "cloudtrail_id" {
  description = "ID of the CloudTrail"
  value       = aws_cloudtrail.this.id
}

output "cloudtrail_bucket_name" {
  description = "Name of the S3 bucket storing CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail_logs.id
}

output "cloudtrail_log_group_name" {
  description = "CloudWatch Log Group name for CloudTrail"
  value       = aws_cloudwatch_log_group.cloudtrail.name
}

output "cloudtrail_role_arn" {
  description = "IAM Role ARN used by CloudTrail to publish logs to CloudWatch"
  value       = aws_iam_role.cloudtrail_cw.arn
}
