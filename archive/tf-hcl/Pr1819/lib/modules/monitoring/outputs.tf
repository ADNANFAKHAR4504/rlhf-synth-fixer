output "flow_log_destination_arn" {
  description = "The ARN of the CloudWatch Log Group for VPC Flow Logs"
  value       = aws_cloudwatch_log_group.main.arn
}
