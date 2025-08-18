output "kms_key_id" {
  description = "KMS key ID"
  value       = aws_kms_key.main.arn
}

output "kms_key_arn" {
  description = "KMS key ARN"
  value       = aws_kms_key.main.arn
}

output "sensitive_data_bucket_name" {
  description = "S3 bucket name for sensitive data"
  value       = aws_s3_bucket.sensitive_data.bucket
}

output "sensitive_data_bucket_arn" {
  description = "S3 bucket ARN for sensitive data"
  value       = aws_s3_bucket.sensitive_data.arn
}

output "cloudtrail_bucket_name" {
  description = "S3 bucket name for CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail.bucket
}

output "cloudtrail_bucket_arn" {
  description = "S3 bucket ARN for CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail.arn
}

output "config_bucket_name" {
  description = "S3 bucket name for AWS Config logs"
  value       = aws_s3_bucket.config.bucket
}

output "config_bucket_arn" {
  description = "S3 bucket ARN for AWS Config logs"
  value       = aws_s3_bucket.config.arn
}
