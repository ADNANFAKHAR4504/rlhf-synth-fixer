output "config_recorder_name" {
  description = "AWS Config recorder name"
  value       = local.config_recorder_name
}

output "config_recorder_arn" {
  description = "AWS Config recorder ARN"
  value       = var.use_existing_config_recorder ? "arn:aws:config:us-east-1:${var.account_id}:configuration-recorder/${local.config_recorder_name}" : aws_config_configuration_recorder.main[0].id
}

output "guardduty_detector_id" {
  description = "GuardDuty detector ID"
  value       = var.use_existing_guardduty_detector ? "existing-guardduty-detector" : aws_guardduty_detector.main[0].id
}

output "guardduty_detector_arn" {
  description = "GuardDuty detector ARN"
  value       = var.use_existing_guardduty_detector ? "arn:aws:guardduty:us-east-1:${var.account_id}:detector/existing" : aws_guardduty_detector.main[0].arn
}

output "securityhub_account_id" {
  description = "Security Hub account ID"
  value       = var.use_existing_securityhub ? var.account_id : aws_securityhub_account.main[0].id
}

output "config_role_arn" {
  description = "AWS Config IAM role ARN"
  value       = aws_iam_role.config_role.arn
}

output "config_log_group_name" {
  description = "CloudWatch log group name for AWS Config"
  value       = aws_cloudwatch_log_group.config.name
}
