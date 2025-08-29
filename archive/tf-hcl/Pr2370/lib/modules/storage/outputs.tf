output "s3_bucket_name" {
  description = "Name of the secure S3 bucket"
  value       = aws_s3_bucket.secure_bucket.id
}

output "s3_bucket_arn" {
  description = "ARN of the secure S3 bucket"
  value       = aws_s3_bucket.secure_bucket.arn
}

output "kms_key_id" {
  description = "ID of the KMS key for S3 encryption"
  value       = aws_kms_key.s3_encryption.key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS key for S3 encryption"
  value       = aws_kms_key.s3_encryption.arn
}

output "ebs_kms_key_id" {
  description = "ID of the KMS key for EBS encryption"
  value       = aws_kms_key.ebs_encryption.key_id
}