# modules/monitoring/outputs.tf

output "sns_topic_arn" {
  description = "ARN of the SNS alerts topic"
  value       = aws_sns_topic.payment_alerts.arn
}

output "sns_topic_name" {
  description = "Name of the SNS alerts topic"
  value       = aws_sns_topic.payment_alerts.name
}

output "validation_queue_depth_alarm_arn" {
  description = "ARN of the validation queue depth alarm"
  value       = aws_cloudwatch_metric_alarm.validation_queue_depth.arn
}

output "fraud_queue_depth_alarm_arn" {
  description = "ARN of the fraud queue depth alarm"
  value       = aws_cloudwatch_metric_alarm.fraud_queue_depth.arn
}

output "notification_queue_depth_alarm_arn" {
  description = "ARN of the notification queue depth alarm"
  value       = aws_cloudwatch_metric_alarm.notification_queue_depth.arn
}

output "validation_dlq_alarm_arn" {
  description = "ARN of the validation DLQ messages alarm"
  value       = aws_cloudwatch_metric_alarm.validation_dlq_messages.arn
}

output "fraud_dlq_alarm_arn" {
  description = "ARN of the fraud DLQ messages alarm"
  value       = aws_cloudwatch_metric_alarm.fraud_dlq_messages.arn
}

output "notification_dlq_alarm_arn" {
  description = "ARN of the notification DLQ messages alarm"
  value       = aws_cloudwatch_metric_alarm.notification_dlq_messages.arn
}

output "validation_log_group_name" {
  description = "Name of the validation Lambda log group"
  value       = aws_cloudwatch_log_group.validation_lambda.name
}

output "fraud_log_group_name" {
  description = "Name of the fraud detection Lambda log group"
  value       = aws_cloudwatch_log_group.fraud_lambda.name
}

output "notification_log_group_name" {
  description = "Name of the notification Lambda log group"
  value       = aws_cloudwatch_log_group.notification_lambda.name
}

output "dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.payment_processing.dashboard_name
}