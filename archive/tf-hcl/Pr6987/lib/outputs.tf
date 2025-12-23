# outputs.tf - Main Infrastructure Outputs

# ================================
# SQS QUEUE OUTPUTS
# ================================

output "transaction_validation_queue_arn" {
  description = "ARN of the transaction validation queue"
  value       = module.sqs.transaction_validation_queue_arn
}

output "transaction_validation_queue_url" {
  description = "URL of the transaction validation queue"
  value       = module.sqs.transaction_validation_queue_url
}

output "fraud_detection_queue_arn" {
  description = "ARN of the fraud detection queue"
  value       = module.sqs.fraud_detection_queue_arn
}

output "fraud_detection_queue_url" {
  description = "URL of the fraud detection queue"
  value       = module.sqs.fraud_detection_queue_url
}

output "payment_notification_queue_arn" {
  description = "ARN of the payment notification queue"
  value       = module.sqs.payment_notification_queue_arn
}

output "payment_notification_queue_url" {
  description = "URL of the payment notification queue"
  value       = module.sqs.payment_notification_queue_url
}

# ================================
# IAM ROLE OUTPUTS
# ================================

output "lambda_validation_role_arn" {
  description = "ARN of the Lambda validation role"
  value       = module.iam.lambda_validation_role_arn
}

output "lambda_fraud_role_arn" {
  description = "ARN of the Lambda fraud detection role"
  value       = module.iam.lambda_fraud_role_arn
}

output "lambda_notification_role_arn" {
  description = "ARN of the Lambda notification role"
  value       = module.iam.lambda_notification_role_arn
}

output "eventbridge_role_arn" {
  description = "ARN of the EventBridge role"
  value       = module.iam.eventbridge_role_arn
}

# ================================
# MONITORING OUTPUTS
# ================================

output "sns_alerts_topic_arn" {
  description = "ARN of the SNS alerts topic"
  value       = module.monitoring.sns_topic_arn
}

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = module.monitoring.dashboard_name
}

# ================================
# DYNAMODB OUTPUTS
# ================================

output "transaction_state_table_arn" {
  description = "ARN of the DynamoDB transaction state table"
  value       = module.sqs.transaction_state_table_arn
}

output "transaction_state_table_name" {
  description = "Name of the DynamoDB transaction state table"
  value       = module.sqs.transaction_state_table_name
}

# ================================
# S3 OUTPUTS
# ================================

output "dr_events_bucket_name" {
  description = "Name of the S3 bucket for DR events"
  value       = aws_s3_bucket.dr_events.bucket
}

output "dr_events_bucket_arn" {
  description = "ARN of the S3 bucket for DR events"
  value       = aws_s3_bucket.dr_events.arn
}

# ================================
# VPC OUTPUTS
# ================================

output "vpc_endpoint_id" {
  description = "ID of the SQS VPC endpoint"
  value       = length(aws_vpc_endpoint.sqs) > 0 ? aws_vpc_endpoint.sqs[0].id : null
}

output "vpc_endpoint_security_group_id" {
  description = "ID of the VPC endpoint security group"
  value       = module.iam.vpc_endpoint_security_group_id
}

# ================================
# ENVIRONMENT INFORMATION
# ================================

output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = local.env_suffix
}

output "name_prefix" {
  description = "Prefix used for all resource names"
  value       = local.name_prefix
}

output "account_id" {
  description = "AWS account ID"
  value       = local.account_id
}

output "aws_region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}