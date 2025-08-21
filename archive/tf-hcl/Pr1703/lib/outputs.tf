output "bucket_names" {
  description = "Names of created S3 buckets"
  value       = [for bucket in aws_s3_bucket.secure_buckets : bucket.id]
}

output "bucket_arns" {
  description = "ARNs of created S3 buckets"
  value       = [for bucket in aws_s3_bucket.secure_buckets : bucket.arn]
}

output "kms_key_id" {
  description = "ID of the KMS key used for S3 encryption"
  value       = aws_kms_key.s3_encryption_key.key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for S3 encryption"
  value       = aws_kms_key.s3_encryption_key.arn
}

output "iam_role_arn" {
  description = "ARN of the IAM role for S3 access"
  value       = aws_iam_role.s3_access_role.arn
}

output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = local.guardduty_detector_id
}