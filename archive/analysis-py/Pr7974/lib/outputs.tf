output "dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.payment_monitoring.dashboard_name}"
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alert notifications"
  value       = aws_sns_topic.alerts.arn
}

output "log_group_names" {
  description = "Names of the CloudWatch log groups"
  value = {
    payment_api           = aws_cloudwatch_log_group.payment_api.name
    transaction_processor = aws_cloudwatch_log_group.transaction_processor.name
    fraud_detector        = aws_cloudwatch_log_group.fraud_detector.name
  }
}

output "alarm_names" {
  description = "Names of the CloudWatch alarms"
  value = {
    api_error_rate        = aws_cloudwatch_metric_alarm.api_error_rate.alarm_name
    api_response_time     = aws_cloudwatch_metric_alarm.api_response_time.alarm_name
    failed_transactions   = aws_cloudwatch_metric_alarm.failed_transactions.alarm_name
    multi_service_failure = aws_cloudwatch_composite_alarm.multi_service_failure.alarm_name
    high_load             = aws_cloudwatch_metric_alarm.high_load.alarm_name
  }
}

output "custom_metric_namespaces" {
  description = "Custom metric namespaces for business KPIs"
  value = [
    "FinTech/PaymentAPI/${var.environment}",
    "FinTech/TransactionProcessor/${var.environment}",
    "FinTech/FraudDetector/${var.environment}",
    "FinTech/Lambda/${var.environment}"
  ]
}
