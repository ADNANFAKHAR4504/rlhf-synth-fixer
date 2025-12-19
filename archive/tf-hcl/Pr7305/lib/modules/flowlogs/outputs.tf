output "flow_log_id" {
  description = "VPC Flow Log ID"
  value       = aws_flow_log.main.id
}

output "log_group_name" {
  description = "CloudWatch Log Group name"
  value       = aws_cloudwatch_log_group.flow_logs.name
}

output "log_group_arn" {
  description = "CloudWatch Log Group ARN"
  value       = aws_cloudwatch_log_group.flow_logs.arn
}

output "iam_role_arn" {
  description = "IAM role ARN for Flow Logs"
  value       = aws_iam_role.flow_logs.arn
}