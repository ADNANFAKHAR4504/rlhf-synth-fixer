output "secret_arn" {
  description = "ARN of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "secret_name" {
  description = "Name of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.db_credentials.name
}

output "db_password" {
  description = "Database password (sensitive)"
  value       = random_password.db_master_password.result
  sensitive   = true
}

output "rotation_enabled" {
  description = "Whether rotation is enabled"
  value       = var.enable_rotation
}