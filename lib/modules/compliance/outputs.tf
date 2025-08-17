output "config_recorder_name" {
  description = "AWS Config recorder name"
  value       = aws_config_configuration_recorder.main.name
}

output "config_recorder_arn" {
  description = "AWS Config recorder ARN"
  value       = aws_config_configuration_recorder.main.id
}

output "guardduty_detector_id" {
  description = "GuardDuty detector ID"
  value       = aws_guardduty_detector.main.id
}

output "guardduty_detector_arn" {
  description = "GuardDuty detector ARN"
  value       = aws_guardduty_detector.main.arn
}

output "securityhub_account_id" {
  description = "Security Hub account ID"
  value       = aws_securityhub_account.main.id
}

output "config_role_arn" {
  description = "AWS Config IAM role ARN"
  value       = aws_iam_role.config_role.arn
}

output "config_log_group_name" {
  description = "CloudWatch log group name for AWS Config"
  value       = aws_cloudwatch_log_group.config.name
}
