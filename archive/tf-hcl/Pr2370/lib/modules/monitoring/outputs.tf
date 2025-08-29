output "config_recorder_name" {
  description = "Name of the Config recorder"
  value       = aws_config_configuration_recorder.main.name
}

output "config_delivery_channel_name" {
  description = "Name of the Config delivery channel"
  value       = aws_config_delivery_channel.main.name
}

output "security_alerts_topic_arn" {
  description = "ARN of the security alerts SNS topic"
  value       = aws_sns_topic.security_alerts.arn
}

output "cloudwatch_alarm_name" {
  description = "Name of the CloudWatch alarm for login attempts"
  value       = aws_cloudwatch_metric_alarm.excessive_login_attempts.alarm_name
}

output "config_rules" {
  description = "List of Config rule names"
  value = [
    aws_config_config_rule.s3_bucket_server_side_encryption_enabled.name,
    aws_config_config_rule.encrypted_volumes.name,
    aws_config_config_rule.s3_bucket_public_read_prohibited.name,
    aws_config_config_rule.root_access_key_check.name,
    aws_config_config_rule.mfa_enabled_for_iam_console_access.name
  ]
}

#output "cloudtrail_arn" {
#  description = "ARN of the CloudTrail"
#  value       = module.monitoring.cloudtrail_arn
#}
#
#output "guardduty_detector_id" {
#  description = "ID of the GuardDuty detector"
#  value       = module.monitoring.guardduty_detector_id
#}