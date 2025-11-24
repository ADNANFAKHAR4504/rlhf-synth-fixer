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

output "db_secret_arn" {
  description = "ARN of the Secrets Manager secret containing DB credentials"
  value       = aws_secretsmanager_secret.db_password.arn
}

output "db_secret_name" {
  description = "Name of the Secrets Manager secret containing DB credentials"
  value       = aws_secretsmanager_secret.db_password.name
}
