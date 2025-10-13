# RDS Module Outputs

output "cluster_id" {
  description = "ID of the Aurora cluster"
  value       = aws_rds_cluster.primary.id
}

output "cluster_identifier" {
  description = "Identifier of the Aurora cluster"
  value       = aws_rds_cluster.primary.cluster_identifier
}

output "cluster_endpoint" {
  description = "Writer endpoint of the Aurora cluster"
  value       = aws_rds_cluster.primary.endpoint
}

output "cluster_reader_endpoint" {
  description = "Reader endpoint of the Aurora cluster"
  value       = aws_rds_cluster.primary.reader_endpoint
}

output "cluster_arn" {
  description = "ARN of the Aurora cluster"
  value       = aws_rds_cluster.primary.arn
}

output "cluster_port" {
  description = "Port of the Aurora cluster"
  value       = aws_rds_cluster.primary.port
}

output "instance_ids" {
  description = "IDs of Aurora instances"
  value       = aws_rds_cluster_instance.primary[*].id
}

output "instance_endpoints" {
  description = "Endpoints of Aurora instances"
  value       = aws_rds_cluster_instance.primary[*].endpoint
}

output "db_subnet_group_name" {
  description = "Name of DB subnet group"
  value       = aws_db_subnet_group.aurora.name
}

