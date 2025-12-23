output "endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "address" {
  description = "RDS instance address"
  value       = aws_db_instance.main.address
}

output "port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "id" {
  description = "RDS instance ID"
  value       = aws_db_instance.main.id
}

output "instance_id" {
  description = "RDS instance identifier"
  value       = aws_db_instance.main.identifier
}

output "instance_arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.main.arn
}

output "engine" {
  description = "RDS engine type"
  value       = aws_db_instance.main.engine
}

output "engine_version" {
  description = "RDS engine version"
  value       = aws_db_instance.main.engine_version_actual
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "username" {
  description = "RDS master username"
  value       = aws_db_instance.main.username
  sensitive   = true
}

output "db_subnet_group_name" {
  description = "DB subnet group name"
  value       = aws_db_subnet_group.main.name
}
