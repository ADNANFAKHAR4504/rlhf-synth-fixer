output "db_instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.main.id
}

output "db_instance_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "db_instance_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "db_security_group_id" {
  description = "Security group ID for RDS"
  value       = aws_security_group.rds.id
}

output "db_parameter_group_name" {
  description = "Name of the main RDS parameter group"
  value       = aws_db_parameter_group.main.name
}

output "db_custom_parameter_group_name" {
  description = "Name of the custom RDS parameter group"
  value       = aws_db_parameter_group.custom.name
}

output "db_custom_parameter_group_id" {
  description = "ID of the custom RDS parameter group"
  value       = aws_db_parameter_group.custom.id
}

output "db_subnet_group_name" {
  description = "Name of the main RDS subnet group"
  value       = aws_db_subnet_group.main.name
}

output "db_custom_subnet_group_name" {
  description = "Name of the custom RDS subnet group"
  value       = aws_db_subnet_group.custom.name
}

output "db_custom_subnet_group_id" {
  description = "ID of the custom RDS subnet group"
  value       = aws_db_subnet_group.custom.id
}
