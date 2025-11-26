output "primary_cluster_endpoint" {
  description = "Primary Aurora cluster endpoint"
  value       = aws_rds_cluster.primary.endpoint
}

output "primary_cluster_reader_endpoint" {
  description = "Primary Aurora cluster reader endpoint"
  value       = aws_rds_cluster.primary.reader_endpoint
}

output "secondary_cluster_endpoint" {
  description = "Secondary Aurora cluster endpoint"
  value       = aws_rds_cluster.secondary.endpoint
}

output "secondary_cluster_reader_endpoint" {
  description = "Secondary Aurora cluster reader endpoint"
  value       = aws_rds_cluster.secondary.reader_endpoint
}

output "route53_failover_dns" {
  description = "Route 53 failover DNS name"
  value       = "db.${var.domain_name}"
}

output "primary_s3_bucket" {
  description = "Primary S3 bucket for backups"
  value       = aws_s3_bucket.primary.id
}

output "secondary_s3_bucket" {
  description = "Secondary S3 bucket for backups"
  value       = aws_s3_bucket.secondary.id
}

output "primary_secret_arn" {
  description = "Primary Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.db_password_primary.arn
  sensitive   = true
}

output "secondary_secret_arn" {
  description = "Secondary Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.db_password_secondary.arn
  sensitive   = true
}

output "primary_sns_topic_arn" {
  description = "Primary SNS topic ARN for alerts"
  value       = aws_sns_topic.primary.arn
}

output "secondary_sns_topic_arn" {
  description = "Secondary SNS topic ARN for alerts"
  value       = aws_sns_topic.secondary.arn
}

output "replication_lag_alarm_arn" {
  description = "CloudWatch alarm ARN for replication lag monitoring"
  value       = aws_cloudwatch_metric_alarm.primary_replication_lag.arn
}