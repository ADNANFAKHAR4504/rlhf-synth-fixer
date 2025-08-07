output "bucket_id" {
  value       = module.s3.bucket_id
  description = "The name of the S3 bucket"
}

output "bucket_arn" {
  value       = module.s3.bucket_arn
  description = "The ARN of the S3 bucket"
}

output "bucket_region" {
  value       = module.s3.bucket_region
  description = "The AWS region this bucket resides in"
}
