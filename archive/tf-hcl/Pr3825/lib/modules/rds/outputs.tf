output "primary_cluster_id" {
  description = "Primary cluster identifier"
  value       = aws_rds_cluster.primary.cluster_identifier
}

output "primary_endpoint" {
  description = "Primary Aurora cluster writer endpoint"
  value       = aws_rds_cluster.primary.endpoint
}

output "primary_reader_endpoint" {
  description = "Primary Aurora cluster reader endpoint"
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

# Compatibility outputs (return empty/null values)
output "global_cluster_id" {
  description = "Global cluster identifier (not used in simplified config)"
  value       = null
}

output "secondary_endpoint" {
  description = "Secondary Aurora cluster endpoint (not used in simplified config)"
  value       = null
}
