output "application_log_group_name" {
  description = "Application log group name"
  value       = aws_cloudwatch_log_group.application.name
}

output "payment_log_group_name" {
  description = "Payment log group name"
  value       = aws_cloudwatch_log_group.payment.name
}
