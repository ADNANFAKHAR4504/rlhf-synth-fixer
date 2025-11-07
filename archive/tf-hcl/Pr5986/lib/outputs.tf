output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "data_bucket_name" {
  description = "Data S3 bucket name"
  value       = aws_s3_bucket.data.id
}

output "data_bucket_arn" {
  description = "Data S3 bucket ARN"
  value       = aws_s3_bucket.data.arn
}

output "logs_bucket_name" {
  description = "Logs S3 bucket name"
  value       = aws_s3_bucket.logs.id
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.metadata.name
}


output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.processor.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.processor.arn
}

output "kms_s3_key_id" {
  description = "KMS key ID for S3 encryption"
  value       = aws_kms_key.s3.key_id
}

output "kms_cloudwatch_key_id" {
  description = "KMS key ID for CloudWatch encryption"
  value       = aws_kms_key.cloudwatch.key_id
}

output "guardduty_detector_id" {
  description = "GuardDuty detector ID"
  value       = data.aws_guardduty_detector.main.id
}

output "sns_topic_arn" {
  description = "SNS topic ARN for GuardDuty alerts"
  value       = aws_sns_topic.guardduty_alerts.arn
}

output "secrets_manager_secret_arn" {
  description = "Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "lambda_security_group_id" {
  description = "Lambda security group ID"
  value       = aws_security_group.lambda.id
}

output "s3_vpc_endpoint_id" {
  description = "S3 VPC endpoint ID"
  value       = aws_vpc_endpoint.s3.id
}

output "dynamodb_vpc_endpoint_id" {
  description = "DynamoDB VPC endpoint ID"
  value       = aws_vpc_endpoint.dynamodb.id
}

# VPC Outputs
output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

# Private Subnets Outputs
output "private_subnet_cidr_blocks" {
  description = "CIDR blocks of private subnets"
  value       = aws_subnet.private[*].cidr_block
}

# Route Table Outputs
output "private_route_table_id" {
  description = "Route table ID for private subnets"
  value       = aws_route_table.private.id
}

# VPC Endpoints Outputs
output "s3_vpc_endpoint_dns_entry" {
  description = "DNS entry for S3 VPC endpoint"
  value       = aws_vpc_endpoint.s3.dns_entry
}

output "dynamodb_vpc_endpoint_dns_entry" {
  description = "DNS entry for DynamoDB VPC endpoint"
  value       = aws_vpc_endpoint.dynamodb.dns_entry
}

# Network ACL Outputs
output "private_network_acl_id" {
  description = "Network ACL ID for private subnets"
  value       = aws_network_acl.private.id
}

# Security Group Outputs
output "lambda_security_group_name" {
  description = "Name of the Lambda security group"
  value       = aws_security_group.lambda.name
}

# IAM Role Outputs
output "lambda_execution_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda.arn
}

output "vpc_flow_logs_role_arn" {
  description = "ARN of the VPC flow logs IAM role"
  value       = aws_iam_role.vpc_flow_logs.arn
}

output "secrets_rotation_role_arn" {
  description = "ARN of the secrets rotation IAM role"
  value       = aws_iam_role.secrets_rotation.arn
}

# IAM Policy Outputs


output "lambda_policy_id" {
  description = "ID of the Lambda IAM role policy"
  value       = aws_iam_role_policy.lambda.id
}

output "vpc_flow_logs_policy_id" {
  description = "ID of the VPC flow logs IAM role policy"
  value       = aws_iam_role_policy.vpc_flow_logs.id
}

output "secrets_rotation_policy_id" {
  description = "ID of the secrets rotation IAM role policy"
  value       = aws_iam_role_policy.secrets_rotation.id
}

# CloudWatch Log Groups Outputs
output "lambda_log_group_arn" {
  description = "ARN of the Lambda CloudWatch log group"
  value       = aws_cloudwatch_log_group.lambda.arn
}

output "vpc_flow_logs_log_group_arn" {
  description = "ARN of the VPC flow logs CloudWatch log group"
  value       = aws_cloudwatch_log_group.vpc_flow_logs.arn
}

# S3 Bucket Outputs

output "logs_bucket_arn" {
  description = "ARN of the logs S3 bucket"
  value       = aws_s3_bucket.logs.arn
}

# DynamoDB Table Outputs
output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.metadata.arn
}

# KMS Key Outputs
output "kms_s3_key_arn" {
  description = "ARN of the KMS key for S3 encryption"
  value       = aws_kms_key.s3.arn
}

output "kms_cloudwatch_key_arn" {
  description = "ARN of the KMS key for CloudWatch encryption"
  value       = aws_kms_key.cloudwatch.arn
}

# SNS Topic Outputs
output "guardduty_alerts_topic_arn" {
  description = "ARN of the GuardDuty alerts SNS topic"
  value       = aws_sns_topic.guardduty_alerts.arn
}

# EventBridge Outputs
output "guardduty_findings_rule_arn" {
  description = "ARN of the GuardDuty findings EventBridge rule"
  value       = aws_cloudwatch_event_rule.guardduty_findings.arn
}

# VPC Flow Logs Outputs
output "vpc_flow_logs_id" {
  description = "ID of the VPC flow logs"
  value       = aws_flow_log.main.id
}

# Secrets Manager Outputs
output "db_credentials_secret_arn" {
  description = "ARN of the Secrets Manager secret for database credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "db_credentials_secret_version_id" {
  description = "Version ID of the Secrets Manager secret for database credentials"
  value       = aws_secretsmanager_secret_version.db_credentials.version_id
}

# Lambda Outputs
output "secrets_rotation_lambda_arn" {
  description = "ARN of the secrets rotation Lambda function"
  value       = aws_lambda_function.secrets_rotation.arn
}

output "processor_lambda_arn" {
  description = "ARN of the data processor Lambda function"
  value       = aws_lambda_function.processor.arn
}

