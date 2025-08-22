output "cloudtrail_arn" {
  description = "CloudTrail ARN"
  value       = aws_cloudtrail.main.arn
}

output "cloudtrail_name" {
  description = "CloudTrail name"
  value       = aws_cloudtrail.main.name
}

output "sns_topic_arn" {
  description = "SNS topic ARN for notifications"
  value       = aws_sns_topic.main.arn
}

output "sns_topic_name" {
  description = "SNS topic name"
  value       = aws_sns_topic.main.name
}

output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "cloudwatch_log_group_name" {
  description = "CloudWatch log group name for CloudTrail"
  value       = aws_cloudwatch_log_group.cloudtrail.name
}
