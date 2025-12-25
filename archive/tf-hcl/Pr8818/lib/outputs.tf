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

output "rds_endpoint" {
  description = "Endpoint of the RDS PostgreSQL instance"
  value       = aws_db_instance.postgres.endpoint
}

output "rds_address" {
  description = "Address of the RDS PostgreSQL instance"
  value       = aws_db_instance.postgres.address
}

output "rds_port" {
  description = "Port of the RDS PostgreSQL instance"
  value       = aws_db_instance.postgres.port
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.payment_processor.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.payment_processor.arn
}

output "api_gateway_id" {
  description = "ID of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.payment_api.id
}

output "api_gateway_endpoint" {
  description = "Endpoint URL of the API Gateway"
  value       = aws_api_gateway_stage.payment.invoke_url
}

output "api_gateway_stage_name" {
  description = "Name of the API Gateway stage"
  value       = aws_api_gateway_stage.payment.stage_name
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.transactions.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.transactions.arn
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.documents.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.documents.arn
}

output "kms_key_id_s3" {
  description = "ID of the KMS key for S3"
  value       = aws_kms_key.s3.id
}

output "kms_key_id_rds" {
  description = "ID of the KMS key for RDS"
  value       = aws_kms_key.rds.id
}

output "current_region" {
  description = "Current deployment region"
  value       = local.current_region
}

output "current_workspace" {
  description = "Current Terraform workspace"
  value       = terraform.workspace
}

output "health_check_id" {
  description = "Route53 health check ID"
  value       = aws_route53_health_check.payment_api.id
}
