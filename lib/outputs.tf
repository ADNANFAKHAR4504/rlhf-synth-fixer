output "cloudtrail_arn" {
  value       = aws_cloudtrail.main.arn
  description = "ARN of the multi-region CloudTrail"
}

output "guardduty_detector_id" {
  value       = aws_guardduty_detector.this.id
  description = "GuardDuty detector ID"
}

output "sns_topic_arn" {
  value       = aws_sns_topic.security.arn
  description = "SNS topic for security alarms"
}

output "logs_bucket_name" {
  value       = aws_s3_bucket.logs.bucket
  description = "Primary S3 logs bucket name"
}
