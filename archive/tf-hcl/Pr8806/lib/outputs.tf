# outputs.tf - Terraform outputs

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.postgres.endpoint
  sensitive   = true
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.postgres.db_name
}

output "s3_data_bucket" {
  description = "S3 bucket for application data"
  value       = aws_s3_bucket.data.id
}

output "s3_flow_logs_bucket" {
  description = "S3 bucket for VPC flow logs"
  value       = aws_s3_bucket.flow_logs.id
}

output "lambda_function_name" {
  description = "Name of the Lambda payment processor function"
  value       = aws_lambda_function.payment_processor.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda payment processor function"
  value       = aws_lambda_function.payment_processor.arn
}

output "kms_key_ids" {
  description = "Map of KMS key IDs"
  value = {
    rds        = aws_kms_key.rds.id
    s3         = aws_kms_key.s3.id
    cloudwatch = aws_kms_key.cloudwatch.id
    lambda     = aws_kms_key.lambda.id
  }
}

output "cloudwatch_log_groups" {
  description = "Map of CloudWatch log group names"
  value = {
    lambda    = aws_cloudwatch_log_group.lambda.name
    flow_logs = aws_cloudwatch_log_group.flow_logs.name
    rds       = aws_cloudwatch_log_group.rds.name
  }
}

output "security_group_ids" {
  description = "Map of security group IDs"
  value = {
    lambda       = aws_security_group.lambda.id
    rds          = aws_security_group.rds.id
    vpc_endpoint = aws_security_group.vpc_endpoint.id
  }
}
