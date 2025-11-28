output "metric_stream_name" {
  description = "Name of the CloudWatch Metric Stream"
  value       = aws_cloudwatch_metric_stream.main.name
}

output "metric_stream_arn" {
  description = "ARN of the CloudWatch Metric Stream"
  value       = aws_cloudwatch_metric_stream.main.arn
}

output "s3_bucket_metrics" {
  description = "S3 bucket for metric storage"
  value       = aws_s3_bucket.metric_streams.id
}

output "s3_bucket_synthetics" {
  description = "S3 bucket for Synthetics artifacts"
  value       = aws_s3_bucket.synthetics_artifacts.id
}

output "lambda_processor_arn" {
  description = "ARN of the metric processor Lambda function"
  value       = aws_lambda_function.metric_processor.arn
}

output "lambda_alarm_processor_arn" {
  description = "ARN of the alarm processor Lambda function"
  value       = aws_lambda_function.alarm_processor.arn
}

output "sns_critical_topic_arn" {
  description = "ARN of the critical alarms SNS topic"
  value       = aws_sns_topic.critical_alarms.arn
}

output "sns_warning_topic_arn" {
  description = "ARN of the warning alarms SNS topic"
  value       = aws_sns_topic.warning_alarms.arn
}

output "sns_info_topic_arn" {
  description = "ARN of the info alarms SNS topic"
  value       = aws_sns_topic.info_alarms.arn
}

output "dashboard_url" {
  description = "URL to the main CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "composite_alarm_system_health" {
  description = "Name of the system health composite alarm"
  value       = aws_cloudwatch_composite_alarm.system_health.alarm_name
}

output "composite_alarm_performance" {
  description = "Name of the performance composite alarm"
  value       = aws_cloudwatch_composite_alarm.performance_degradation.alarm_name
}

output "canary_primary_name" {
  description = "Name of the primary region Synthetics canary"
  value       = aws_synthetics_canary.api_health_primary.name
}

output "canary_secondary_name" {
  description = "Name of the secondary region Synthetics canary"
  value       = aws_synthetics_canary.api_health_secondary.name
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster with Container Insights enabled"
  value       = aws_ecs_cluster.main.name
}

output "oam_sink_arn" {
  description = "ARN of the CloudWatch Observability Access Manager sink"
  value       = aws_oam_sink.main.arn
}

output "cross_account_role_arn" {
  description = "ARN of the cross-account sharing IAM role"
  value       = length(var.cross_account_ids) > 0 ? aws_iam_role.cross_account_sharing[0].arn : null
}

output "log_group_application" {
  description = "Name of the application CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.application.name
}
