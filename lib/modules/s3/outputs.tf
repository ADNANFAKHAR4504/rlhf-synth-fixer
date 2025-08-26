output "s3_bucket_id" {
  description = "The ID of the CloudTrail log bucket"
  value       = aws_s3_bucket.cloudtrail_logs.id
}

output "s3_bucket_arn" {
  description = "The ARN of the CloudTrail log bucket"
  value       = aws_s3_bucket.cloudtrail_logs.arn
}
