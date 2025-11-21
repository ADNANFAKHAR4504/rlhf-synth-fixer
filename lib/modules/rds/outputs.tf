output "endpoint" {
  value       = aws_db_instance.main.endpoint
  description = "RDS instance endpoint"
  sensitive   = true
}

output "database_name" {
  value       = aws_db_instance.main.db_name
  description = "Name of the database"
}

output "port" {
  value       = aws_db_instance.main.port
  description = "Database port"
}

output "db_identifier" {
  value       = aws_db_instance.main.identifier
  description = "RDS instance identifier"
}