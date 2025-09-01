output "bucket_name" {
  description = "Name of the central logging S3 bucket"
  value       = aws_s3_bucket.central_logging.bucket
}

output "bucket_arn" {
  description = "ARN of the central logging S3 bucket"
  value       = aws_s3_bucket.central_logging.arn
}

output "kms_key_arn" {
  description = "ARN of the KMS key for logging"
  value       = aws_kms_key.logging.arn
}