output "cluster_id" {
  description = "ID of RDS Aurora cluster"
  value       = aws_rds_cluster.main.id
}

output "cluster_endpoint" {
  description = "Writer endpoint of RDS Aurora cluster"
  value       = aws_rds_cluster.main.endpoint
}

output "cluster_reader_endpoint" {
  description = "Reader endpoint of RDS Aurora cluster"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "cluster_port" {
  description = "Port of RDS Aurora cluster"
  value       = aws_rds_cluster.main.port
}

output "database_name" {
  description = "Name of the database"
  value       = aws_rds_cluster.main.database_name
}

output "master_username" {
  description = "Master username for the database"
  value       = aws_rds_cluster.main.master_username
  sensitive   = true
}

output "password_ssm_parameter" {
  description = "SSM parameter name containing database password"
  value       = aws_ssm_parameter.db_password.name
  sensitive   = true
}
