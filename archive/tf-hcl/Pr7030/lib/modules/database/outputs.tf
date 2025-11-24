output "cluster_endpoint" {
  description = "RDS cluster endpoint"
  value       = aws_rds_cluster.main.endpoint
}

output "cluster_reader_endpoint" {
  description = "RDS cluster reader endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "cluster_id" {
  description = "RDS cluster ID"
  value       = aws_rds_cluster.main.id
}

output "secret_arn" {
  description = "Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.db_credentials.arn
}
