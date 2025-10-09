output "global_cluster_id" {
  description = "Global cluster identifier"
  value       = aws_rds_global_cluster.main.id
}

output "primary_cluster_id" {
  description = "Primary cluster identifier"
  value       = aws_rds_cluster.primary.cluster_identifier
}

output "primary_endpoint" {
  description = "Primary Aurora cluster endpoint"
  value       = aws_rds_cluster.primary.endpoint
}

output "secondary_endpoint" {
  description = "Secondary Aurora cluster endpoint"
  value       = aws_rds_cluster.secondary.endpoint
}

