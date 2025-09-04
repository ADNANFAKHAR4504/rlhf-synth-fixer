output "database_instance_id" {
  description = "ID of the primary database instance"
  value       = var.is_primary && length(aws_db_instance.main) > 0 ? aws_db_instance.main[0].id : null
}

output "database_instance_arn" {
  description = "ARN of the primary database instance"
  value       = var.is_primary && length(aws_db_instance.main) > 0 ? aws_db_instance.main[0].arn : null
}

output "database_endpoint" {
  description = "Endpoint of the primary database instance"
  value       = var.is_primary && length(aws_db_instance.main) > 0 ? aws_db_instance.main[0].endpoint : null
}

output "database_port" {
  description = "Port of the primary database instance"
  value       = var.is_primary && length(aws_db_instance.main) > 0 ? aws_db_instance.main[0].port : null
}

output "database_name" {
  description = "Name of the primary database"
  value       = var.is_primary && length(aws_db_instance.main) > 0 ? aws_db_instance.main[0].db_name : null
}

output "database_username" {
  description = "Username of the primary database"
  value       = var.is_primary && length(aws_db_instance.main) > 0 ? aws_db_instance.main[0].username : null
}

output "database_identifier" {
  description = "Identifier of the primary database instance"
  value       = var.is_primary && length(aws_db_instance.main) > 0 ? aws_db_instance.main[0].identifier : null
}

output "read_replica_id" {
  description = "ID of the read replica database instance"
  value       = var.is_primary ? null : (length(aws_db_instance.read_replica) > 0 ? aws_db_instance.read_replica[0].id : null)
}

output "read_replica_endpoint" {
  description = "Endpoint of the read replica database instance"
  value       = var.is_primary ? null : (length(aws_db_instance.read_replica) > 0 ? aws_db_instance.read_replica[0].endpoint : null)
}

output "read_replica_identifier" {
  description = "Identifier of the read replica database instance"
  value       = var.is_primary ? null : (length(aws_db_instance.read_replica) > 0 ? aws_db_instance.read_replica[0].identifier : null)
}

output "subnet_group_id" {
  description = "ID of the database subnet group"
  value       = aws_db_subnet_group.main.id
}

output "subnet_group_name" {
  description = "Name of the database subnet group"
  value       = aws_db_subnet_group.main.name
}

output "parameter_group_id" {
  description = "ID of the database parameter group"
  value       = aws_db_parameter_group.main.id
}

output "parameter_group_name" {
  description = "Name of the database parameter group"
  value       = aws_db_parameter_group.main.name
}

output "ssm_parameter_name" {
  description = "Name of the SSM parameter storing the database password"
  value       = aws_ssm_parameter.database_password.name
}

output "ssm_parameter_arn" {
  description = "ARN of the SSM parameter storing the database password"
  value       = aws_ssm_parameter.database_password.arn
}

output "database_engine_version" {
  description = "Engine version of the database"
  value       = var.is_primary && length(aws_db_instance.main) > 0 ? aws_db_instance.main[0].engine_version : null
}

output "database_instance_class" {
  description = "Instance class of the database"
  value       = var.db_instance_class
}

output "database_allocated_storage" {
  description = "Allocated storage of the database"
  value       = var.allocated_storage
}

output "database_encrypted" {
  description = "Whether the database storage is encrypted"
  value       = var.is_primary && length(aws_db_instance.main) > 0 ? aws_db_instance.main[0].storage_encrypted : null
}
