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

output "dynamodb_table_arn" {
  description = "DynamoDB table ARN"
  value       = aws_dynamodb_table.metadata.arn
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