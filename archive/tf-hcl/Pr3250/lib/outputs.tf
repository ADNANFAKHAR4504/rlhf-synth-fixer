# outputs.tf

output "patient_data_bucket_name" {
  description = "Name of the patient data S3 bucket"
  value       = aws_s3_bucket.patient_data.id
}

output "patient_data_bucket_arn" {
  description = "ARN of the patient data S3 bucket"
  value       = aws_s3_bucket.patient_data.arn
}

output "kms_key_id" {
  description = "ID of the KMS key for encryption"
  value       = aws_kms_key.patient_data.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key for encryption"
  value       = aws_kms_key.patient_data.arn
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.audit.name
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.audit.arn
}

output "cloudtrail_bucket_name" {
  description = "Name of the CloudTrail logs bucket"
  value       = aws_s3_bucket.cloudtrail_logs.id
}

output "iam_role_arn" {
  description = "ARN of the IAM role for patient data access"
  value       = aws_iam_role.patient_data_access.arn
}

output "iam_role_name" {
  description = "Name of the IAM role for patient data access"
  value       = aws_iam_role.patient_data_access.name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for security alerts"
  value       = aws_sns_topic.alerts.arn
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group for CloudTrail"
  value       = aws_cloudwatch_log_group.cloudtrail.name
}

output "region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}