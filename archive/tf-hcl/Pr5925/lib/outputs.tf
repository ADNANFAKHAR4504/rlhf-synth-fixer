# API Endpoints
output "primary_api_endpoint" {
  description = "Primary region API Gateway endpoint"
  value       = "${aws_api_gateway_deployment.primary.invoke_url}/payment"
}

output "dr_api_endpoint" {
  description = "DR region API Gateway endpoint"
  value       = "${aws_api_gateway_deployment.dr.invoke_url}/payment"
}

output "primary_health_check_endpoint" {
  description = "Primary region health check endpoint"
  value       = "${aws_api_gateway_deployment.primary.invoke_url}/health"
}

output "dr_health_check_endpoint" {
  description = "DR region health check endpoint"
  value       = "${aws_api_gateway_deployment.dr.invoke_url}/health"
}

# Aurora Endpoints
output "primary_aurora_cluster_endpoint" {
  description = "Primary Aurora cluster endpoint"
  value       = aws_rds_cluster.primary.endpoint
}

output "primary_aurora_reader_endpoint" {
  description = "Primary Aurora reader endpoint"
  value       = aws_rds_cluster.primary.reader_endpoint
}

output "dr_aurora_cluster_endpoint" {
  description = "DR Aurora cluster endpoint"
  value       = aws_rds_cluster.dr.endpoint
}

output "dr_aurora_reader_endpoint" {
  description = "DR Aurora reader endpoint"
  value       = aws_rds_cluster.dr.reader_endpoint
}

# S3 Buckets
output "primary_s3_bucket_name" {
  description = "Primary S3 bucket name"
  value       = aws_s3_bucket.primary.id
}

output "dr_s3_bucket_name" {
  description = "DR S3 bucket name"
  value       = aws_s3_bucket.dr.id
}

# Lambda Functions
output "primary_lambda_function_name" {
  description = "Primary Lambda function name"
  value       = aws_lambda_function.payment_processor_primary.function_name
}

output "dr_lambda_function_name" {
  description = "DR Lambda function name"
  value       = aws_lambda_function.payment_processor_dr.function_name
}

# VPC IDs
output "primary_vpc_id" {
  description = "Primary VPC ID"
  value       = aws_vpc.primary.id
}

output "dr_vpc_id" {
  description = "DR VPC ID"
  value       = aws_vpc.dr.id
}

# Health Check
output "route53_health_check_id" {
  description = "Route 53 health check ID"
  value       = aws_route53_health_check.primary.id
}

# Database Secret
output "db_secret_arn" {
  description = "ARN of the database password secret"
  value       = aws_secretsmanager_secret.db_password.arn
  sensitive   = true
}

# SNS Topics
output "health_check_alerts_topic_arn" {
  description = "SNS topic ARN for health check alerts"
  value       = aws_sns_topic.health_check_alerts.arn
}

output "cloudwatch_alarms_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarms"
  value       = aws_sns_topic.cloudwatch_alarms.arn
}

output "cloudwatch_alarms_dr_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarms in DR region"
  value       = aws_sns_topic.cloudwatch_alarms_dr.arn
}