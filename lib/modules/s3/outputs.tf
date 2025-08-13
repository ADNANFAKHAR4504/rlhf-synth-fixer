output "cloudtrail_bucket_name" {
  description = "CloudTrail S3 bucket name"
  value       = aws_s3_bucket.cloudtrail.bucket
}

output "cloudtrail_bucket_arn" {
  description = "CloudTrail S3 bucket ARN"
  value       = aws_s3_bucket.cloudtrail.arn
}

output "app_data_bucket_name" {
  description = "Application data S3 bucket name"
  value       = aws_s3_bucket.app_data.bucket
}

output "app_data_bucket_arn" {
  description = "Application data S3 bucket ARN"
  value       = aws_s3_bucket.app_data.arn
}