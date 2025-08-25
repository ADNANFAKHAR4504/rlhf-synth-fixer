# outputs.tf

output "cloudtrail_arn" {
  description = "ARN of the multi-region CloudTrail"
  value       = aws_cloudtrail.main.arn
}

output "guardduty_detector_id" {
  description = "GuardDuty detector ID (null if disabled or pre-existing)"
  value       = length(aws_guardduty_detector.this) > 0 ? aws_guardduty_detector.this[0].id : null
}

output "sns_topic_arn" {
  description = "SNS topic for security alarms"
  value       = aws_sns_topic.security.arn
}

output "logs_bucket_name" {
  description = "Primary S3 logs bucket name"
  value       = aws_s3_bucket.logs.bucket
}
