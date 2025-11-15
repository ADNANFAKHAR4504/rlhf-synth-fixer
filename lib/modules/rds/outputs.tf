output "db_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "db_connection_string" {
  description = "Database connection string"
  value       = "postgresql://${var.db_username}:${urlencode(random_password.db_password.result)}@${aws_db_instance.main.endpoint}/${var.db_name}"
  sensitive   = true
}

output "db_security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}
