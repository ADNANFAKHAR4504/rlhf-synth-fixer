output "cluster_id" {
  description = "ID of the RDS cluster"
  value       = aws_rds_cluster.cluster.id
}

output "cluster_arn" {
  description = "ARN of the RDS cluster"
  value       = aws_rds_cluster.cluster.arn
}

output "cluster_endpoint" {
  description = "Writer endpoint of the RDS cluster"
  value       = aws_rds_cluster.cluster.endpoint
}

output "cluster_reader_endpoint" {
  description = "Reader endpoint of the RDS cluster"
  value       = aws_rds_cluster.cluster.reader_endpoint
}

output "cluster_port" {
  description = "Port of the RDS cluster"
  value       = aws_rds_cluster.cluster.port
}

output "cluster_database_name" {
  description = "Name of the default database"
  value       = aws_rds_cluster.cluster.database_name
}

output "cluster_master_username" {
  description = "Master username of the cluster"
  value       = aws_rds_cluster.cluster.master_username
  sensitive   = true
}

output "security_group_id" {
  description = "ID of the cluster security group"
  value       = aws_security_group.cluster.id
}

output "instance_ids" {
  description = "Map of instance identifiers"
  value       = { for k, v in aws_rds_cluster_instance.instances : k => v.id }
}

output "instance_endpoints" {
  description = "Map of instance endpoints"
  value       = { for k, v in aws_rds_cluster_instance.instances : k => v.endpoint }
}