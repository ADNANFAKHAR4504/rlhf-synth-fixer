# modules/database/outputs.tf

output "db_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "db_port" {
  description = "Database port"
  value       = aws_db_instance.main.port
}

output "kms_key_id" {
  description = "KMS key ID used for encryption"
  value       = aws_kms_key.rds.id
}
