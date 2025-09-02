# EC2 Module Outputs
output "launch_template_id" {
  description = "ID of the launch template"
  value       = aws_launch_template.web.id
}

output "launch_template_arn" {
  description = "ARN of the launch template"
  value       = aws_launch_template.web.arn
}

output "launch_template_latest_version" {
  description = "Latest version of the launch template"
  value       = aws_launch_template.web.latest_version
}

output "autoscaling_group_id" {
  description = "ID of the Auto Scaling Group"
  value       = aws_autoscaling_group.web.id
}

output "autoscaling_group_arn" {
  description = "ARN of the Auto Scaling Group"
  value       = aws_autoscaling_group.web.arn
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.web.name
}

output "autoscaling_group_min_size" {
  description = "Minimum size of the Auto Scaling Group"
  value       = aws_autoscaling_group.web.min_size
}

output "autoscaling_group_max_size" {
  description = "Maximum size of the Auto Scaling Group"
  value       = aws_autoscaling_group.web.max_size
}

output "autoscaling_group_desired_capacity" {
  description = "Desired capacity of the Auto Scaling Group"
  value       = aws_autoscaling_group.web.desired_capacity
}

output "scale_up_policy_arn" {
  description = "ARN of the scale up policy"
  value       = aws_autoscaling_policy.scale_up.arn
}

output "scale_down_policy_arn" {
  description = "ARN of the scale down policy"
  value       = aws_autoscaling_policy.scale_down.arn
}

output "cpu_high_alarm_arn" {
  description = "ARN of the CPU high alarm"
  value       = var.enable_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.cpu_high[0].arn : null
}

output "cpu_low_alarm_arn" {
  description = "ARN of the CPU low alarm"
  value       = var.enable_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.cpu_low[0].arn : null
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.app_logs.name
}

output "cloudwatch_log_group_arn" {
  description = "ARN of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.app_logs.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for notifications"
  value       = var.enable_notifications ? aws_sns_topic.notifications[0].arn : null
}