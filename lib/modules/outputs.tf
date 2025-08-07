output "bucket_id" {
  value       = aws_s3_bucket.bucket.id
  description = "The name of the S3 bucket"
}

output "bucket_arn" {
  value       = aws_s3_bucket.bucket.arn
  description = "The ARN of the S3 bucket"
}

output "bucket_region" {
  value       = aws_s3_bucket.bucket.region
  description = "The AWS region this bucket resides in"
}

output "bucket_domain_name" {
  value       = aws_s3_bucket.bucket.bucket_domain_name
  description = "The bucket domain name"
}

output "bucket_regional_domain_name" {
  value       = aws_s3_bucket.bucket.bucket_regional_domain_name
  description = "The bucket region-specific domain name"
}
