output "endpoint" {
  description = "RDS instance endpoint"
  value       = var.is_primary ? aws_db_instance.primary[0].endpoint : aws_db_instance.replica[0].endpoint
}

output "port" {
  description = "RDS instance port"
  value       = var.is_primary ? aws_db_instance.primary[0].port : aws_db_instance.replica[0].port
}

output "db_arn" {
  description = "ARN of the RDS instance"
  value       = var.is_primary ? aws_db_instance.primary[0].arn : aws_db_instance.replica[0].arn
}

output "db_id" {
  description = "ID of the RDS instance"
  value       = var.is_primary ? aws_db_instance.primary[0].id : aws_db_instance.replica[0].id
}

output "security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "kms_key_id" {
  description = "ID of the KMS key for encryption"
  value       = aws_kms_key.rds.key_id
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for database alerts"
  value       = aws_sns_topic.database_alerts.arn
}
