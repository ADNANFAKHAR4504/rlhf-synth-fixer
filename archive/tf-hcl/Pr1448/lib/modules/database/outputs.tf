output "database_id" {
  description = "ID of the RDS instance"
  value       = aws_db_instance.main.id
}

output "database_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = aws_db_instance.main.endpoint
}

output "database_arn" {
  description = "ARN of the RDS instance"
  value       = aws_db_instance.main.arn
}

output "database_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "database_parameter_group_name" {
  description = "Name of the RDS parameter group"
  value       = aws_db_parameter_group.main.name
}

output "database_password" {
  description = "The generated database password (sensitive)"
  value       = random_password.database.result
  sensitive   = true
}

output "ssm_parameter_arn" {
  description = "ARN of the SSM parameter storing the database password"
  value       = aws_ssm_parameter.database_password.arn
}

output "ssm_parameter_name" {
  description = "Name of the SSM parameter storing the database password"
  value       = aws_ssm_parameter.database_password.name
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for database encryption"
  value       = aws_kms_key.database.arn
}

output "kms_key_id" {
  description = "ID of the KMS key used for database encryption"
  value       = aws_kms_key.database.key_id
}

output "read_replica_endpoint" {
  description = "Endpoint of the RDS read replica (if exists)"
  value       = var.environment == "production" ? aws_db_instance.read_replica[0].endpoint : null
}

output "read_replica_id" {
  description = "ID of the RDS read replica (if exists)"
  value       = var.environment == "production" ? aws_db_instance.read_replica[0].id : null
}
