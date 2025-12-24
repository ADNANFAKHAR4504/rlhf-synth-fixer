output "event_bus_name" {
  description = "Name of the EventBridge event bus"
  value       = aws_cloudwatch_event_bus.market_data.name
}

output "event_bus_arn" {
  description = "ARN of the EventBridge event bus"
  value       = aws_cloudwatch_event_bus.market_data.arn
}

output "lambda_function_name" {
  description = "Name of the market processor Lambda function"
  value       = aws_lambda_function.market_processor.function_name
}

output "lambda_function_arn" {
  description = "ARN of the market processor Lambda function"
  value       = aws_lambda_function.market_processor.arn
}

output "market_data_table_name" {
  description = "Name of the DynamoDB market data table"
  value       = aws_dynamodb_table.market_data.name
}

output "market_data_table_arn" {
  description = "ARN of the DynamoDB market data table"
  value       = aws_dynamodb_table.market_data.arn
}

output "audit_trail_table_name" {
  description = "Name of the DynamoDB audit trail table"
  value       = aws_dynamodb_table.audit_trail.name
}

output "audit_trail_table_arn" {
  description = "ARN of the DynamoDB audit trail table"
  value       = aws_dynamodb_table.audit_trail.arn
}

output "dlq_url" {
  description = "URL of the dead letter queue"
  value       = aws_sqs_queue.dlq.url
}

output "dlq_arn" {
  description = "ARN of the dead letter queue"
  value       = aws_sqs_queue.dlq.arn
}

output "log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.market_processor.name
}

output "trade_events_rule_arn" {
  description = "ARN of the trade events EventBridge rule"
  value       = aws_cloudwatch_event_rule.trade_events.arn
}

output "quote_events_rule_arn" {
  description = "ARN of the quote events EventBridge rule"
  value       = aws_cloudwatch_event_rule.quote_events.arn
}
