# outputs.tf

# API Gateway Outputs
output "api_gateway_id" {
  description = "The ID of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.webhook_api.id
}

output "api_gateway_name" {
  description = "The name of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.webhook_api.name
}

output "api_gateway_endpoint" {
  description = "The invoke URL for the API Gateway stage"
  value       = aws_api_gateway_stage.main.invoke_url
}

output "api_gateway_stage_name" {
  description = "The name of the API Gateway stage"
  value       = aws_api_gateway_stage.main.stage_name
}

output "stripe_webhook_endpoint" {
  description = "Full URL for Stripe webhook endpoint"
  value       = "${aws_api_gateway_stage.main.invoke_url}/api/v1/webhooks/stripe"
}

output "paypal_webhook_endpoint" {
  description = "Full URL for PayPal webhook endpoint"
  value       = "${aws_api_gateway_stage.main.invoke_url}/api/v1/webhooks/paypal"
}

output "square_webhook_endpoint" {
  description = "Full URL for Square webhook endpoint"
  value       = "${aws_api_gateway_stage.main.invoke_url}/api/v1/webhooks/square"
}

output "transactions_query_endpoint" {
  description = "Full URL for transactions query endpoint"
  value       = "${aws_api_gateway_stage.main.invoke_url}/api/v1/transactions"
}

# API Keys (Sensitive)
output "stripe_api_key_id" {
  description = "The ID of the Stripe API key"
  value       = aws_api_gateway_api_key.stripe.id
  sensitive   = true
}

output "paypal_api_key_id" {
  description = "The ID of the PayPal API key"
  value       = aws_api_gateway_api_key.paypal.id
  sensitive   = true
}

output "square_api_key_id" {
  description = "The ID of the Square API key"
  value       = aws_api_gateway_api_key.square.id
  sensitive   = true
}

# Lambda Function Outputs
output "stripe_validator_function_name" {
  description = "Name of the Stripe validator Lambda function"
  value       = aws_lambda_function.stripe_validator.function_name
}

output "stripe_validator_function_arn" {
  description = "ARN of the Stripe validator Lambda function"
  value       = aws_lambda_function.stripe_validator.arn
}

output "paypal_validator_function_name" {
  description = "Name of the PayPal validator Lambda function"
  value       = aws_lambda_function.paypal_validator.function_name
}

output "paypal_validator_function_arn" {
  description = "ARN of the PayPal validator Lambda function"
  value       = aws_lambda_function.paypal_validator.arn
}

output "square_validator_function_name" {
  description = "Name of the Square validator Lambda function"
  value       = aws_lambda_function.square_validator.function_name
}

output "square_validator_function_arn" {
  description = "ARN of the Square validator Lambda function"
  value       = aws_lambda_function.square_validator.arn
}

output "processor_function_name" {
  description = "Name of the webhook processor Lambda function"
  value       = aws_lambda_function.processor.function_name
}

output "processor_function_arn" {
  description = "ARN of the webhook processor Lambda function"
  value       = aws_lambda_function.processor.arn
}

output "query_function_name" {
  description = "Name of the query Lambda function"
  value       = aws_lambda_function.query.function_name
}

output "query_function_arn" {
  description = "ARN of the query Lambda function"
  value       = aws_lambda_function.query.arn
}

# DynamoDB Outputs
output "dynamodb_table_name" {
  description = "Name of the DynamoDB transactions table"
  value       = aws_dynamodb_table.transactions.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB transactions table"
  value       = aws_dynamodb_table.transactions.arn
}

output "dynamodb_table_stream_arn" {
  description = "ARN of the DynamoDB table stream"
  value       = aws_dynamodb_table.transactions.stream_arn
}

# S3 Bucket Outputs
output "raw_payloads_bucket_name" {
  description = "Name of the S3 bucket for raw webhook payloads"
  value       = aws_s3_bucket.raw_payloads.id
}

output "raw_payloads_bucket_arn" {
  description = "ARN of the S3 bucket for raw webhook payloads"
  value       = aws_s3_bucket.raw_payloads.arn
}

output "processed_logs_bucket_name" {
  description = "Name of the S3 bucket for processed transaction logs"
  value       = aws_s3_bucket.processed_logs.id
}

output "processed_logs_bucket_arn" {
  description = "ARN of the S3 bucket for processed transaction logs"
  value       = aws_s3_bucket.processed_logs.arn
}

# SQS Outputs
output "dlq_name" {
  description = "Name of the dead letter queue"
  value       = aws_sqs_queue.dlq.name
}

output "dlq_arn" {
  description = "ARN of the dead letter queue"
  value       = aws_sqs_queue.dlq.arn
}

output "dlq_url" {
  description = "URL of the dead letter queue"
  value       = aws_sqs_queue.dlq.url
}

# Secrets Manager Outputs
output "stripe_secret_arn" {
  description = "ARN of the Stripe webhook secret in Secrets Manager"
  value       = aws_secretsmanager_secret.stripe_secret.arn
  sensitive   = true
}

output "paypal_secret_arn" {
  description = "ARN of the PayPal webhook secret in Secrets Manager"
  value       = aws_secretsmanager_secret.paypal_secret.arn
  sensitive   = true
}

output "square_secret_arn" {
  description = "ARN of the Square webhook secret in Secrets Manager"
  value       = aws_secretsmanager_secret.square_secret.arn
  sensitive   = true
}

# CloudWatch Outputs
output "sns_topic_arn" {
  description = "ARN of the SNS topic for alarms"
  value       = aws_sns_topic.alarms.arn
}

output "sns_topic_name" {
  description = "Name of the SNS topic for alarms"
  value       = aws_sns_topic.alarms.name
}

# IAM Role Outputs
output "validator_role_arn" {
  description = "ARN of the validator Lambda IAM role"
  value       = aws_iam_role.validator_lambda_role.arn
}

output "processor_role_arn" {
  description = "ARN of the processor Lambda IAM role"
  value       = aws_iam_role.processor_lambda_role.arn
}

output "query_role_arn" {
  description = "ARN of the query Lambda IAM role"
  value       = aws_iam_role.query_lambda_role.arn
}

# Environment Suffix
output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = local.env_suffix
}

# Region
output "aws_region" {
  description = "AWS region where resources are deployed"
  value       = data.aws_region.current.id
}

# Account ID
output "aws_account_id" {
  description = "AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}
