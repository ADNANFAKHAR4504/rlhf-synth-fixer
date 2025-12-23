# outputs.tf - Output values for all created resources

output "kinesis_stream_name" {
  description = "Name of the Kinesis Data Stream"
  value       = aws_kinesis_stream.transactions.name
}

output "kinesis_stream_arn" {
  description = "ARN of the Kinesis Data Stream"
  value       = aws_kinesis_stream.transactions.arn
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.processor.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.processor.arn
}

output "ecr_repository_url" {
  description = "ECR repository URL for Lambda container"
  value       = aws_ecr_repository.lambda.repository_url
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alarms"
  value       = aws_sns_topic.alarms.arn
}

output "kms_key_id" {
  description = "ID of the customer-managed KMS key"
  value       = aws_kms_key.sns.id
}

output "kms_key_arn" {
  description = "ARN of the customer-managed KMS key"
  value       = aws_kms_key.sns.arn
}

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.observability.dashboard_name
}

output "cloudwatch_dashboard_url" {
  description = "URL to access the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.observability.dashboard_name}"
}

output "composite_alarm_processing_health" {
  description = "Name of the processing health composite alarm"
  value       = aws_cloudwatch_composite_alarm.processing_health.alarm_name
}

output "composite_alarm_system_capacity" {
  description = "Name of the system capacity composite alarm"
  value       = aws_cloudwatch_composite_alarm.system_capacity.alarm_name
}

output "xray_group_name" {
  description = "Name of the X-Ray group"
  value       = aws_xray_group.payment_transactions.group_name
}

output "xray_console_url" {
  description = "URL to access X-Ray service map"
  value       = "https://console.aws.amazon.com/xray/home?region=${var.aws_region}#/service-map"
}

output "dlq_url" {
  description = "URL of the dead letter queue"
  value       = aws_sqs_queue.dlq.url
}

output "dlq_arn" {
  description = "ARN of the dead letter queue"
  value       = aws_sqs_queue.dlq.arn
}

output "eventbridge_rules" {
  description = "Names of EventBridge rules"
  value = {
    high_value_transactions = aws_cloudwatch_event_rule.high_value_transactions.name
    failed_transactions     = aws_cloudwatch_event_rule.failed_transactions.name
    fraud_patterns          = aws_cloudwatch_event_rule.fraud_patterns.name
    velocity_checks         = aws_cloudwatch_event_rule.velocity_checks.name
  }
}
