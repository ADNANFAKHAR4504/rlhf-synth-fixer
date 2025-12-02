# modules/rds/outputs.tf
output "cluster_id" {
  description = "RDS cluster ID"
  value       = aws_rds_cluster.main.id
}

output "cluster_endpoint" {
  description = "RDS cluster endpoint"
  value       = aws_rds_cluster.main.endpoint
}

output "cluster_reader_endpoint" {
  description = "RDS cluster reader endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "cluster_port" {
  description = "RDS cluster port"
  value       = aws_rds_cluster.main.port
}

output "database_name" {
  description = "Database name"
  value       = aws_rds_cluster.main.database_name
}

output "security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}
