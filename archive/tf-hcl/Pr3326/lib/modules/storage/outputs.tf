output "s3_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.video_storage.bucket_regional_domain_name
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.video_storage.arn
}

output "bucket_id" {
  description = "ID of the S3 bucket"
  value       = aws_s3_bucket.video_storage.id
}

output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.video_storage.bucket
}
