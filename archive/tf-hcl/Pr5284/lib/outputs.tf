# outputs.tf - Important outputs like role ARNs, KMS key IDs

# IAM Role ARNs
output "developer_role_arn" {
  description = "ARN of the developer IAM role"
  value       = aws_iam_role.developer.arn
}

output "operations_role_arn" {
  description = "ARN of the operations IAM role"
  value       = aws_iam_role.operations.arn
}

output "security_role_arn" {
  description = "ARN of the security IAM role"
  value       = aws_iam_role.security.arn
}

output "ssm_instance_profile_name" {
  description = "Name of the SSM instance profile for EC2"
  value       = aws_iam_instance_profile.ssm_instance.name
}

# KMS Key Information
output "kms_key_ids" {
  description = "Map of KMS key IDs by purpose"
  value = {
    s3  = aws_kms_key.s3.id
    rds = aws_kms_key.rds.id
    ebs = aws_kms_key.ebs.id
  }
}

output "kms_key_arns" {
  description = "Map of KMS key ARNs by purpose"
  value = {
    s3  = aws_kms_key.s3.arn
    rds = aws_kms_key.rds.arn
    ebs = aws_kms_key.ebs.arn
  }
}

output "kms_key_aliases" {
  description = "Map of KMS key aliases"
  value = {
    s3  = aws_kms_alias.s3.name
    rds = aws_kms_alias.rds.name
    ebs = aws_kms_alias.ebs.name
  }
}

# S3 Bucket Information
output "config_bucket_name" {
  description = "Name of the AWS Config S3 bucket"
  value       = aws_s3_bucket.config.id
}

output "config_bucket_arn" {
  description = "ARN of the AWS Config S3 bucket"
  value       = aws_s3_bucket.config.arn
}

output "session_logs_bucket_name" {
  description = "Name of the Session Manager logs S3 bucket"
  value       = aws_s3_bucket.session_logs.id
}

output "session_logs_bucket_arn" {
  description = "ARN of the Session Manager logs S3 bucket"
  value       = aws_s3_bucket.session_logs.arn
}

# CloudWatch Resources
output "security_alerts_topic_arn" {
  description = "ARN of the SNS topic for security alerts"
  value       = aws_sns_topic.security_alerts.arn
}

output "audit_log_group_name" {
  description = "Name of the CloudWatch log group for audit logs"
  value       = aws_cloudwatch_log_group.audit_logs.name
}

output "session_log_group_name" {
  description = "Name of the CloudWatch log group for session logs"
  value       = aws_cloudwatch_log_group.session_logs.name
}

# Session Manager
output "session_manager_document_name" {
  description = "Name of the Session Manager preferences document"
  value       = aws_ssm_document.session_manager_prefs.name
}

output "hybrid_activation_id" {
  description = "ID of the SSM hybrid activation (if enabled)"
  value       = var.enable_hybrid_activation ? aws_ssm_activation.hybrid[0].id : null
}

output "hybrid_activation_code" {
  description = "Activation code for hybrid servers (if enabled)"
  value       = var.enable_hybrid_activation ? aws_ssm_activation.hybrid[0].activation_code : null
  sensitive   = true
}

# Config Rules
output "config_recorder_name" {
  description = "Name of the AWS Config recorder"
  value       = var.enable_config_recorder ? aws_config_configuration_recorder.main[0].name : null
}

output "config_rules" {
  description = "List of enabled AWS Config rules"
  value = [
    aws_config_config_rule.iam_user_mfa_enabled.name,
    aws_config_config_rule.root_account_mfa_enabled.name,
    aws_config_config_rule.s3_bucket_encryption.name,
    aws_config_config_rule.rds_encryption_enabled.name,
    aws_config_config_rule.ebs_encryption_enabled.name,
    aws_config_config_rule.required_tags.name,
    aws_config_config_rule.iam_password_policy.name,
    aws_config_config_rule.cloudtrail_enabled.name,
    aws_config_config_rule.ec2_instance_type.name
  ]
}

# Organization Policies (when enabled)
output "scp_policy_ids" {
  description = "IDs of Service Control Policies"
  value = var.enable_organization_policies ? {
    region_restriction     = aws_organizations_policy.region_restriction[0].id
    encryption_enforcement = aws_organizations_policy.encryption_enforcement[0].id
  } : null
}

output "tag_policy_id" {
  description = "ID of the tag enforcement policy"
  value       = var.enable_organization_policies ? aws_organizations_policy.tagging[0].id : null
}

# Lambda Functions (when enabled)
output "auto_tagging_lambda_arn" {
  description = "ARN of the auto-tagging Lambda function"
  value       = var.enable_auto_tagging ? aws_lambda_function.auto_tagging[0].arn : null
}

# Audit Role (when enabled)
output "audit_role_arn" {
  description = "ARN of the cross-account audit role"
  value       = var.enable_audit_role && length(var.audit_account_ids) > 0 ? aws_iam_role.audit[0].arn : null
}

# Summary Information
output "deployment_summary" {
  description = "Summary of the security deployment"
  value = {
    environment          = var.environment
    project_name         = var.project_name
    allowed_regions      = join(", ", var.allowed_regions)
    kms_rotation_enabled = true
    log_retention_days   = var.cloudtrail_retention_days
    mfa_required         = true
    encryption_enforced  = true
  }
}