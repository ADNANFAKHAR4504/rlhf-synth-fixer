output "sns_topic_arn" {
  description = "ARN of the SNS topic for alarms"
  value       = aws_sns_topic.alarms.arn
}

output "ec2_log_group_name" {
  description = "Name of the CloudWatch log group for EC2 instances"
  value       = aws_cloudwatch_log_group.ec2_logs.name
}
