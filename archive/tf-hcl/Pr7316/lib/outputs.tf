output "global_cluster_id" {
  description = "ID of the Aurora Global Database cluster"
  value       = aws_rds_global_cluster.global.id
}

output "primary_cluster_endpoint" {
  description = "Endpoint for the primary Aurora cluster"
  value       = aws_rds_cluster.primary.endpoint
}

output "primary_cluster_reader_endpoint" {
  description = "Reader endpoint for the primary Aurora cluster"
  value       = aws_rds_cluster.primary.reader_endpoint
}

output "secondary_cluster_endpoint" {
  description = "Endpoint for the secondary Aurora cluster"
  value       = aws_rds_cluster.secondary.endpoint
}

output "secondary_cluster_reader_endpoint" {
  description = "Reader endpoint for the secondary Aurora cluster"
  value       = aws_rds_cluster.secondary.reader_endpoint
}

output "primary_backup_bucket" {
  description = "S3 bucket for primary region database exports"
  value       = aws_s3_bucket.primary_backup.id
}

output "secondary_backup_bucket" {
  description = "S3 bucket for secondary region database exports"
  value       = aws_s3_bucket.secondary_backup.id
}

output "primary_secret_arn" {
  description = "ARN of the Secrets Manager secret for primary database credentials"
  value       = aws_secretsmanager_secret.primary_db.arn
  sensitive   = true
}

output "secondary_secret_arn" {
  description = "ARN of the Secrets Manager secret for secondary database credentials"
  value       = aws_secretsmanager_secret.secondary_db.arn
  sensitive   = true
}

output "primary_sns_topic_arn" {
  description = "ARN of the SNS topic for primary database events"
  value       = aws_sns_topic.primary_db_events.arn
}

output "secondary_sns_topic_arn" {
  description = "ARN of the SNS topic for secondary database events"
  value       = aws_sns_topic.secondary_db_events.arn
}

output "primary_kms_key_id" {
  description = "ID of the KMS key for primary region encryption"
  value       = aws_kms_key.primary_db.id
}

output "secondary_kms_key_id" {
  description = "ID of the KMS key for secondary region encryption"
  value       = aws_kms_key.secondary_db.id
}
