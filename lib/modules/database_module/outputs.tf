output "db_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "db_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "db_instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.main.identifier
}

output "db_instance_arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.main.arn
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "db_engine_version" {
  description = "Database engine version"
  value       = aws_db_instance.main.engine_version
}

output "parameter_store_username" {
  description = "Parameter Store path for database username"
  value       = aws_ssm_parameter.db_username.name
}

output "parameter_store_password" {
  description = "Parameter Store path for database password"
  value       = aws_ssm_parameter.db_password.name
  sensitive   = true
}

output "db_parameter_group_name" {
  description = "Database parameter group name"
  value       = aws_db_parameter_group.main.name
}

output "db_option_group_name" {
  description = "Database option group name"
  value       = aws_db_option_group.main.name
}