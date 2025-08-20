output "kms_key_id" {
  description = "The ID of the KMS key"
  value       = aws_kms_key.main.id
}

output "kms_key_arn" {
  description = "The ARN of the KMS key"
  value       = aws_kms_key.main.arn
}


output "s3_logs_bucket_name" {
  description = "The name of the S3 logs bucket"
  value       = aws_s3_bucket.logs.bucket
}
