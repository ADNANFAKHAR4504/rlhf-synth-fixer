output "application_log_group_name" {
  description = "Name of the application CloudWatch log group"
  value       = aws_cloudwatch_log_group.application_logs.name
}

output "application_log_group_arn" {
  description = "ARN of the application CloudWatch log group"
  value       = aws_cloudwatch_log_group.application_logs.arn
}

output "rds_log_group_name" {
  description = "Name of the RDS CloudWatch log group"
  value       = aws_cloudwatch_log_group.rds_logs.name
}

output "rds_log_group_arn" {
  description = "ARN of the RDS CloudWatch log group"
  value       = aws_cloudwatch_log_group.rds_logs.arn
}

output "dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "dashboard_arn" {
  description = "ARN of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_arn
}

output "log_retention_days" {
  description = "Log retention period in days"
  value       = var.log_retention_days
}
