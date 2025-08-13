output "cloudtrail_name" {
  description = "CloudTrail name"
  value       = aws_cloudtrail.main.name
}

output "cloudtrail_arn" {
  description = "CloudTrail ARN"
  value       = aws_cloudtrail.main.arn
}

output "cloudtrail_home_region" {
  description = "CloudTrail home region"
  value       = aws_cloudtrail.main.home_region
}

output "cloudwatch_log_group_name" {
  description = "CloudWatch Log Group name for CloudTrail"
  value       = aws_cloudwatch_log_group.cloudtrail.name
}

output "cloudwatch_log_group_arn" {
  description = "CloudWatch Log Group ARN for CloudTrail"
  value       = aws_cloudwatch_log_group.cloudtrail.arn
}

output "cloudtrail_logs_role_arn" {
  description = "IAM role ARN for CloudTrail to write to CloudWatch Logs"
  value       = aws_iam_role.cloudtrail_logs_role.arn
}
