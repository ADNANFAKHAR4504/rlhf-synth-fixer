# outputs.tf - Output values for the IAM security configuration

output "iam_roles" {
  description = "Map of created IAM roles with their names and ARNs"
  value = {
    app_deploy_role = {
      name = aws_iam_role.app_deploy_role.name
      arn  = aws_iam_role.app_deploy_role.arn
      id   = aws_iam_role.app_deploy_role.id
    }
    readonly_role = {
      name = aws_iam_role.readonly_role.name
      arn  = aws_iam_role.readonly_role.arn
      id   = aws_iam_role.readonly_role.id
    }
    audit_role = {
      name = aws_iam_role.audit_role.name
      arn  = aws_iam_role.audit_role.arn
      id   = aws_iam_role.audit_role.id
    }
  }
}

output "iam_policies" {
  description = "Map of created IAM policies with their names and ARNs"
  value = {
    app_deploy_policy = {
      name = aws_iam_policy.app_deploy_policy.name
      arn  = aws_iam_policy.app_deploy_policy.arn
      id   = aws_iam_policy.app_deploy_policy.id
    }
    readonly_policy = {
      name = aws_iam_policy.readonly_policy.name
      arn  = aws_iam_policy.readonly_policy.arn
      id   = aws_iam_policy.readonly_policy.id
    }
    audit_policy = {
      name = aws_iam_policy.audit_policy.name
      arn  = aws_iam_policy.audit_policy.arn
      id   = aws_iam_policy.audit_policy.id
    }
    cloudwatch_readonly_policy = {
      name = aws_iam_policy.cloudwatch_readonly_policy.name
      arn  = aws_iam_policy.cloudwatch_readonly_policy.arn
      id   = aws_iam_policy.cloudwatch_readonly_policy.id
    }
    s3_upload_policy = {
      name = aws_iam_policy.s3_upload_policy.name
      arn  = aws_iam_policy.s3_upload_policy.arn
      id   = aws_iam_policy.s3_upload_policy.id
    }
    cloudtrail_write_policy = {
      name = aws_iam_policy.cloudtrail_write_policy.name
      arn  = aws_iam_policy.cloudtrail_write_policy.arn
      id   = aws_iam_policy.cloudtrail_write_policy.id
    }
  }
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail for security auditing"
  value       = aws_cloudtrail.security_trail.arn
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail for security auditing"
  value       = aws_cloudtrail.security_trail.name
}

output "log_bucket_name" {
  description = "Name of the S3 bucket storing CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail_logs.bucket
}

output "log_bucket_arn" {
  description = "ARN of the S3 bucket storing CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail_logs.arn
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group for CloudTrail"
  value       = aws_cloudwatch_log_group.cloudtrail_log_group.name
}

output "cloudwatch_log_group_arn" {
  description = "ARN of the CloudWatch log group for CloudTrail"
  value       = aws_cloudwatch_log_group.cloudtrail_log_group.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for IAM notifications (if enabled)"
  value       = var.enable_sns_notifications ? aws_sns_topic.iam_notifications[0].arn : null
}

output "sns_topic_name" {
  description = "Name of the SNS topic for IAM notifications (if enabled)"
  value       = var.enable_sns_notifications ? aws_sns_topic.iam_notifications[0].name : null
}

output "eventbridge_rule_arn" {
  description = "ARN of the EventBridge rule for IAM monitoring (if enabled)"
  value       = var.enable_sns_notifications ? aws_cloudwatch_event_rule.iam_changes[0].arn : null
}

output "cross_account_assume_role_commands" {
  description = "AWS CLI commands to assume the created roles from trusted accounts"
  value = {
    app_deploy_role = "aws sts assume-role --role-arn ${aws_iam_role.app_deploy_role.arn} --role-session-name AppDeploySession --external-id ${var.environment}-cross-account"
    readonly_role   = "aws sts assume-role --role-arn ${aws_iam_role.readonly_role.arn} --role-session-name ReadOnlySession --external-id ${var.environment}-cross-account"
    audit_role      = "aws sts assume-role --role-arn ${aws_iam_role.audit_role.arn} --role-session-name AuditSession --external-id ${var.environment}-cross-account"
  }
}

output "security_configuration_summary" {
  description = "Summary of the security configuration deployed"
  value = {
    environment             = var.environment
    account_id             = var.account_id
    trusted_accounts       = var.trusted_account_ids
    roles_created         = length(keys(local.iam_roles_output))
    policies_created      = length(keys(local.iam_policies_output))
    cloudtrail_enabled    = true
    sns_notifications     = var.enable_sns_notifications
    data_events_logging   = var.cloudtrail_enable_data_events
    log_retention_days    = var.cloudtrail_retention_days
  }
}

# Local values for internal reference
locals {
  iam_roles_output = {
    app_deploy_role = aws_iam_role.app_deploy_role
    readonly_role   = aws_iam_role.readonly_role
    audit_role      = aws_iam_role.audit_role
  }
  
  iam_policies_output = {
    app_deploy_policy          = aws_iam_policy.app_deploy_policy
    readonly_policy           = aws_iam_policy.readonly_policy
    audit_policy             = aws_iam_policy.audit_policy
    cloudwatch_readonly_policy = aws_iam_policy.cloudwatch_readonly_policy
    s3_upload_policy         = aws_iam_policy.s3_upload_policy
    cloudtrail_write_policy  = aws_iam_policy.cloudtrail_write_policy
  }
}
