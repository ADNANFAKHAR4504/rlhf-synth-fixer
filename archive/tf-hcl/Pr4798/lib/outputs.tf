# ============================================================================
# S3 Bucket Outputs
# ============================================================================

output "primary_bucket_name" {
  description = "Name of the primary document storage bucket"
  value       = aws_s3_bucket.primary.id
}

output "primary_bucket_arn" {
  description = "ARN of the primary document storage bucket"
  value       = aws_s3_bucket.primary.arn
}

output "audit_bucket_name" {
  description = "Name of the audit logs bucket"
  value       = aws_s3_bucket.audit.id
}

output "audit_bucket_arn" {
  description = "ARN of the audit logs bucket"
  value       = aws_s3_bucket.audit.arn
}

output "reporting_bucket_name" {
  description = "Name of the reporting bucket"
  value       = aws_s3_bucket.reporting.id
}

output "reporting_bucket_arn" {
  description = "ARN of the reporting bucket"
  value       = aws_s3_bucket.reporting.arn
}

# ============================================================================
# KMS Key Outputs
# ============================================================================

output "primary_kms_key_id" {
  description = "ID of the primary KMS key"
  value       = aws_kms_key.primary.id
}

output "primary_kms_key_arn" {
  description = "ARN of the primary KMS key"
  value       = aws_kms_key.primary.arn
  sensitive   = true
}

output "audit_kms_key_id" {
  description = "ID of the audit KMS key (if separate key is enabled)"
  value       = var.enable_separate_audit_kms_key ? aws_kms_key.audit[0].id : aws_kms_key.primary.id
}

output "audit_kms_key_arn" {
  description = "ARN of the audit KMS key (if separate key is enabled)"
  value       = local.audit_kms_key_arn
  sensitive   = true
}

# ============================================================================
# IAM Role Outputs
# ============================================================================

output "uploader_role_name" {
  description = "Name of the uploader IAM role"
  value       = aws_iam_role.uploader.name
}

output "uploader_role_arn" {
  description = "ARN of the uploader IAM role"
  value       = aws_iam_role.uploader.arn
}

output "auditor_role_name" {
  description = "Name of the auditor IAM role"
  value       = aws_iam_role.auditor.name
}

output "auditor_role_arn" {
  description = "ARN of the auditor IAM role"
  value       = aws_iam_role.auditor.arn
}

output "admin_role_name" {
  description = "Name of the admin IAM role"
  value       = aws_iam_role.admin.name
}

output "admin_role_arn" {
  description = "ARN of the admin IAM role (requires MFA for delete operations)"
  value       = aws_iam_role.admin.arn
}

# ============================================================================
# Lambda Function Outputs
# ============================================================================

output "compliance_lambda_function_name" {
  description = "Name of the compliance check Lambda function"
  value       = aws_lambda_function.compliance_check.function_name
}

output "compliance_lambda_function_arn" {
  description = "ARN of the compliance check Lambda function"
  value       = aws_lambda_function.compliance_check.arn
}

output "reporting_lambda_function_name" {
  description = "Name of the monthly reporting Lambda function"
  value       = aws_lambda_function.monthly_report.function_name
}

output "reporting_lambda_function_arn" {
  description = "ARN of the monthly reporting Lambda function"
  value       = aws_lambda_function.monthly_report.arn
}

# ============================================================================
# CloudTrail Outputs
# ============================================================================

output "cloudtrail_name" {
  description = "Name of the CloudTrail trail"
  value       = var.enable_cloudtrail ? aws_cloudtrail.main[0].name : null
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail trail"
  value       = var.enable_cloudtrail ? aws_cloudtrail.main[0].arn : null
}

# ============================================================================
# CloudWatch Outputs
# ============================================================================

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = var.enable_cloudwatch_dashboard ? aws_cloudwatch_dashboard.storage[0].dashboard_name : null
}

output "compliance_check_rule_name" {
  description = "Name of the EventBridge rule for compliance checks"
  value       = aws_cloudwatch_event_rule.compliance_check.name
}

output "monthly_report_rule_name" {
  description = "Name of the EventBridge rule for monthly reports"
  value       = aws_cloudwatch_event_rule.monthly_report.name
}

# ============================================================================
# Configuration Outputs
# ============================================================================

output "object_lock_enabled" {
  description = "Whether Object Lock is enabled on the primary bucket"
  value       = var.enable_object_lock
}

output "object_lock_retention_days" {
  description = "Default Object Lock retention period in days"
  value       = var.object_lock_retention_days
}

output "legal_retention_years" {
  description = "Legal retention period in years"
  value       = var.legal_retention_years
}

output "legal_retention_days" {
  description = "Legal retention period in days"
  value       = local.legal_retention_days
}

# ============================================================================
# Access Instructions
# ============================================================================

output "assume_uploader_role_command" {
  description = "AWS CLI command to assume the uploader role"
  value       = "aws sts assume-role --role-arn ${aws_iam_role.uploader.arn} --role-session-name uploader-session --external-id uploader-role"
}

output "assume_auditor_role_command" {
  description = "AWS CLI command to assume the auditor role"
  value       = "aws sts assume-role --role-arn ${aws_iam_role.auditor.arn} --role-session-name auditor-session --external-id auditor-role"
}

output "assume_admin_role_command" {
  description = "AWS CLI command to assume the admin role (requires MFA)"
  value       = "aws sts assume-role --role-arn ${aws_iam_role.admin.arn} --role-session-name admin-session --serial-number <MFA_DEVICE_ARN> --token-code <MFA_CODE>"
}

output "upload_document_command" {
  description = "Example command to upload a document with KMS encryption"
  value       = "aws s3 cp document.pdf s3://${aws_s3_bucket.primary.id}/ --sse aws:kms --sse-kms-key-id ${aws_kms_key.primary.id}"
}

output "view_dashboard_url" {
  description = "URL to view the CloudWatch dashboard"
  value       = var.enable_cloudwatch_dashboard ? "https://console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#dashboards:name=${local.dashboard_name}" : null
}
