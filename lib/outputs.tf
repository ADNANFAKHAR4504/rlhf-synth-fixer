# API Gateway Outputs
output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = aws_api_gateway_stage.main.invoke_url
}

output "api_id" {
  description = "API Gateway ID"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_stage_name" {
  description = "API Gateway stage name"
  value       = aws_api_gateway_stage.main.stage_name
}

# Lambda Function ARNs
output "lambda_authorizer_arn" {
  description = "Lambda Authorizer function ARN"
  value       = aws_lambda_function.authorizer.arn
}

output "lambda_ingestion_arn" {
  description = "Lambda Ingestion function ARN"
  value       = aws_lambda_function.event_ingestion.arn
}

output "lambda_processing_arn" {
  description = "Lambda Processing function ARN"
  value       = aws_lambda_function.event_processing.arn
}

output "lambda_storage_arn" {
  description = "Lambda Storage function ARN"
  value       = aws_lambda_function.event_storage.arn
}

# Lambda Function Names
output "lambda_function_names" {
  description = "Map of Lambda function names"
  value = {
    authorizer = aws_lambda_function.authorizer.function_name
    ingestion  = aws_lambda_function.event_ingestion.function_name
    processing = aws_lambda_function.event_processing.function_name
    storage    = aws_lambda_function.event_storage.function_name
  }
}

# SQS Queue URLs
output "sqs_queue_url" {
  description = "Main SQS queue URL"
  value       = aws_sqs_queue.event_queue.url
}

output "sqs_dlq_url" {
  description = "Dead letter queue URL"
  value       = aws_sqs_queue.dlq.url
}

# DynamoDB Table Names
output "dynamodb_events_table" {
  description = "DynamoDB events table name"
  value       = aws_dynamodb_table.events.name
}

output "dynamodb_audit_table" {
  description = "DynamoDB audit trail table name"
  value       = aws_dynamodb_table.audit_trail.name
}

# EventBridge Bus Name
output "eventbridge_bus_name" {
  description = "EventBridge custom bus name"
  value       = aws_cloudwatch_event_bus.main.name
}

# EventBridge Rule ARNs
output "eventbridge_rules" {
  description = "Map of EventBridge rule ARNs"
  value = {
    transaction_events = aws_cloudwatch_event_rule.transaction_events.arn
    payment_events     = aws_cloudwatch_event_rule.payment_events.arn
    processed_events   = aws_cloudwatch_event_rule.processed_events.arn
    failed_events      = aws_cloudwatch_event_rule.failed_events.arn
  }
}

# CloudWatch Log Groups
output "cloudwatch_log_groups" {
  description = "Map of CloudWatch log group names"
  value = {
    api_gateway = aws_cloudwatch_log_group.api_gateway.name
    authorizer  = aws_cloudwatch_log_group.lambda_authorizer.name
    ingestion   = aws_cloudwatch_log_group.lambda_ingestion.name
    processing  = aws_cloudwatch_log_group.lambda_processing.name
    storage     = aws_cloudwatch_log_group.lambda_storage.name
  }
}

# SSM Parameter Names
output "ssm_parameters" {
  description = "Map of SSM parameter names"
  value = {
    auth_token        = aws_ssm_parameter.auth_token.name
    db_connection     = aws_ssm_parameter.db_connection.name
    api_config        = aws_ssm_parameter.api_config.name
    processing_config = aws_ssm_parameter.processing_config.name
  }
}

# Lambda Layer Version ARN
output "lambda_layer_arn" {
  description = "Common dependencies Lambda layer ARN"
  value       = aws_lambda_layer_version.common_dependencies.arn
}

# Region Output
output "region" {
  description = "AWS region where resources are deployed"
  value       = data.aws_region.current.id
}

# Flattened outputs for integration testing
output "event_post_url" {
  description = "API Gateway event POST endpoint"
  value       = "${aws_api_gateway_stage.main.invoke_url}/events"
}

output "x_ray_enabled" {
  description = "Whether X-Ray tracing is enabled"
  value       = true
}

# Integration Testing Endpoints (nested for compatibility)
output "integration_test_config" {
  description = "Configuration for integration testing"
  value = {
    api_endpoint   = aws_api_gateway_stage.main.invoke_url
    event_post_url = "${aws_api_gateway_stage.main.invoke_url}/events"
    region         = data.aws_region.current.id
    x_ray_enabled  = true
  }
}