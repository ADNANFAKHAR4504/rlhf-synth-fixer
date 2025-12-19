# outputs.tf
# Output values for CloudWatch analytics system

output "api_gateway_invoke_url" {
  description = "API Gateway invoke URL"
  value       = aws_api_gateway_stage.main.invoke_url
}

output "api_gateway_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_gateway_name" {
  description = "API Gateway REST API name"
  value       = aws_api_gateway_rest_api.main.name
}

output "cloudwatch_dashboard_url" {
  description = "URL to access the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.cloudwatch_alerts.arn
}

output "sns_topic_name" {
  description = "Name of the SNS topic for alerts"
  value       = aws_sns_topic.cloudwatch_alerts.name
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table for aggregated logs"
  value       = aws_dynamodb_table.aggregated_logs.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.aggregated_logs.arn
}

output "lambda_api_handler_arn" {
  description = "ARN of the API handler Lambda function"
  value       = aws_lambda_function.api_handler.arn
}

output "lambda_api_handler_name" {
  description = "Name of the API handler Lambda function"
  value       = aws_lambda_function.api_handler.function_name
}

output "lambda_aggregator_arn" {
  description = "ARN of the metric aggregator Lambda function"
  value       = aws_lambda_function.metric_aggregator.arn
}

output "lambda_aggregator_name" {
  description = "Name of the metric aggregator Lambda function"
  value       = aws_lambda_function.metric_aggregator.function_name
}

output "eventbridge_rule_arn" {
  description = "ARN of the EventBridge rule for metric aggregation"
  value       = aws_cloudwatch_event_rule.metric_aggregation.arn
}

output "eventbridge_rule_name" {
  description = "Name of the EventBridge rule"
  value       = aws_cloudwatch_event_rule.metric_aggregation.name
}

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = aws_kms_key.monitoring.id
}

output "kms_key_arn" {
  description = "KMS key ARN for encryption"
  value       = aws_kms_key.monitoring.arn
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_instance_id" {
  description = "RDS instance identifier"
  value       = aws_db_instance.main.identifier
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "alarm_arns" {
  description = "Map of alarm names to their ARNs"
  value = {
    api_latency         = aws_cloudwatch_metric_alarm.api_latency.arn
    api_errors          = aws_cloudwatch_metric_alarm.api_errors.arn
    lambda_api_errors   = aws_cloudwatch_metric_alarm.lambda_api_handler_errors.arn
    lambda_api_duration = aws_cloudwatch_metric_alarm.lambda_api_handler_duration.arn
    lambda_agg_errors   = aws_cloudwatch_metric_alarm.lambda_aggregator_errors.arn
    rds_cpu             = aws_cloudwatch_metric_alarm.rds_cpu.arn
    rds_connections     = aws_cloudwatch_metric_alarm.rds_connections.arn
  }
}

output "log_group_names" {
  description = "CloudWatch log group names"
  value = {
    api_gateway       = aws_cloudwatch_log_group.api_gateway.name
    lambda_api        = aws_cloudwatch_log_group.lambda_api_handler.name
    lambda_aggregator = aws_cloudwatch_log_group.lambda_aggregator.name
  }
}
