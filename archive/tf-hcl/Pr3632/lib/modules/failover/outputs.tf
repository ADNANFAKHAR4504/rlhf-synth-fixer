output "global_accelerator_ip_addresses" {
  description = "IP addresses of the Global Accelerator"
  value       = aws_globalaccelerator_accelerator.main.ip_sets
}

output "global_accelerator_dns_name" {
  description = "DNS name of the Global Accelerator"
  value       = aws_globalaccelerator_accelerator.main.dns_name
}

output "global_accelerator_arn" {
  description = "ARN of the Global Accelerator"
  value       = aws_globalaccelerator_accelerator.main.arn
}

output "lambda_function_arn" {
  description = "ARN of the failover Lambda function"
  value       = aws_lambda_function.failover.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for failover alerts"
  value       = aws_sns_topic.failover_alerts.arn
}

output "endpoint_group_arn" {
  description = "ARN of the primary endpoint group"
  value       = aws_globalaccelerator_endpoint_group.primary.arn
}
