# outputs.tf

output "cloudtrail_arn" {
  description = "ARN of the multi-region CloudTrail"
  value       = aws_cloudtrail.main.arn
}

output "guardduty_detector_id" {
  description = "GuardDuty detector ID (only when enabled)"
  value       = try(aws_guardduty_detector.this[0].id, null)
}

output "sns_topic_arn" {
  description = "SNS topic for security alarms"
  value       = aws_sns_topic.security.arn
}

# outputs.tf
output "logs_bucket_name" {
  description = "Name of the S3 bucket storing CloudTrail/Config logs"
  value       = aws_s3_bucket.logs_bucket.bucket
}
