output "cloudtrail_arn" {
  description = "CloudTrail ARN"
  value       = aws_cloudtrail.main.arn
}

output "cloudtrail_logs_bucket_name" {
  description = "CloudTrail logs S3 bucket name"
  value       = aws_s3_bucket.cloudtrail_logs.bucket
}