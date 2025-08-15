output "primary_bucket_name" {
  description = "Name of the primary S3 bucket"
  value       = aws_s3_bucket.primary_data_bucket.bucket
}

output "backup_bucket_name" {
  description = "Name of the backup S3 bucket"
  value       = aws_s3_bucket.backup_data_bucket.bucket
}

output "cloudtrail_bucket_name" {
  description = "Name of the CloudTrail logs bucket"
  value       = aws_s3_bucket.cloudtrail_logs.bucket
}

output "iam_role_arn" {
  description = "ARN of the S3 access IAM role"
  value       = aws_iam_role.s3_access_role.arn
}

output "instance_profile_name" {
  description = "Name of the IAM instance profile"
  value       = aws_iam_instance_profile.s3_access_profile.name
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = var.create_cloudtrail ? aws_cloudtrail.main_trail[0].arn : "CloudTrail not created due to limits"
}

output "sns_topic_arn" {
  description = "ARN of the security notifications SNS topic"
  value       = aws_sns_topic.security_notifications.arn
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for S3 encryption"
  value       = aws_kms_key.s3_encryption_key.arn
}