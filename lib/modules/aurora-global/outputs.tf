output "global_cluster_id" {
  description = "Global cluster ID"
  value       = aws_rds_global_cluster.main.id
}

output "global_cluster_arn" {
  description = "Global cluster ARN"
  value       = aws_rds_global_cluster.main.arn
}

output "primary_cluster_id" {
  description = "Primary cluster ID"
  value       = aws_rds_cluster.primary.id
}

output "primary_cluster_arn" {
  description = "Primary cluster ARN"
  value       = aws_rds_cluster.primary.arn
}

output "primary_cluster_endpoint" {
  description = "Primary cluster endpoint"
  value       = aws_rds_cluster.primary.endpoint
}

output "secondary_cluster_id" {
  description = "Secondary cluster ID"
  value       = aws_rds_cluster.secondary.id
}

output "secondary_cluster_arn" {
  description = "Secondary cluster ARN"
  value       = aws_rds_cluster.secondary.arn
}

output "secondary_cluster_endpoint" {
  description = "Secondary cluster endpoint"
  value       = aws_rds_cluster.secondary.endpoint
}
