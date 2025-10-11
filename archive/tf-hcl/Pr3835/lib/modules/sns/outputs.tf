# SNS Module Outputs

output "topic_arn" {
  description = "ARN of SNS topic"
  value       = aws_sns_topic.failover_notifications.arn
}

output "topic_id" {
  description = "ID of SNS topic"
  value       = aws_sns_topic.failover_notifications.id
}

output "topic_name" {
  description = "Name of SNS topic"
  value       = aws_sns_topic.failover_notifications.name
}

