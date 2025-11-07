output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of database subnets"
  value       = aws_subnet.database[*].id
}

output "rds_cluster_endpoint" {
  description = "Writer endpoint for the RDS cluster"
  value       = aws_rds_cluster.main.endpoint
}

output "rds_cluster_reader_endpoint" {
  description = "Reader endpoint for the RDS cluster"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "rds_cluster_id" {
  description = "ID of the RDS cluster"
  value       = aws_rds_cluster.main.id
}

output "rds_secret_arn" {
  description = "ARN of the Secrets Manager secret containing RDS credentials"
  value       = aws_secretsmanager_secret.db_password.arn
  sensitive   = true
}

output "transaction_logs_bucket_name" {
  description = "Name of the S3 bucket for transaction logs"
  value       = aws_s3_bucket.transaction_logs.id
}

output "transaction_logs_bucket_arn" {
  description = "ARN of the S3 bucket for transaction logs"
  value       = aws_s3_bucket.transaction_logs.arn
}

output "customer_documents_bucket_name" {
  description = "Name of the S3 bucket for customer documents"
  value       = aws_s3_bucket.customer_documents.id
}

output "customer_documents_bucket_arn" {
  description = "ARN of the S3 bucket for customer documents"
  value       = aws_s3_bucket.customer_documents.arn
}

output "payment_validation_lambda_arn" {
  description = "ARN of the payment validation Lambda function"
  value       = aws_lambda_function.payment_validation.arn
}

output "transaction_processing_lambda_arn" {
  description = "ARN of the transaction processing Lambda function"
  value       = aws_lambda_function.transaction_processing.arn
}

output "api_gateway_id" {
  description = "ID of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_gateway_endpoint" {
  description = "Invoke URL of the API Gateway"
  value       = aws_api_gateway_stage.main.invoke_url
}

output "api_gateway_stage_name" {
  description = "Name of the API Gateway stage"
  value       = aws_api_gateway_stage.main.stage_name
}

output "transaction_alerts_topic_arn" {
  description = "ARN of the SNS topic for transaction alerts"
  value       = aws_sns_topic.transaction_alerts.arn
}

output "system_errors_topic_arn" {
  description = "ARN of the SNS topic for system errors"
  value       = aws_sns_topic.system_errors.arn
}

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.api_gateway.arn
}