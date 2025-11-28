output "primary_endpoint" {
  description = "Primary RDS endpoint"
  value       = aws_db_instance.primary.endpoint
}

output "dr_replica_endpoint" {
  description = "DR replica endpoint"
  value       = aws_db_instance.dr_replica.endpoint
}

output "primary_arn" {
  description = "Primary RDS ARN"
  value       = aws_db_instance.primary.arn
}

output "dr_replica_arn" {
  description = "DR replica ARN"
  value       = aws_db_instance.dr_replica.arn
}

output "kms_key_primary" {
  description = "KMS key ID for primary region"
  value       = aws_kms_key.primary.id
}

output "kms_key_dr" {
  description = "KMS key ID for DR region"
  value       = aws_kms_key.dr.id
}

output "lambda_function_name" {
  description = "Lambda function name for failover monitoring"
  value       = aws_lambda_function.failover_monitor.function_name
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.rds_alerts.arn
}

output "vpc_peering_id" {
  description = "VPC peering connection ID"
  value       = aws_vpc_peering_connection.primary_to_dr.id
}

output "secret_arn" {
  description = "Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.db_password.arn
  sensitive   = true
}
