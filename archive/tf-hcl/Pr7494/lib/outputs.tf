output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "aurora_cluster_id" {
  description = "Aurora cluster identifier"
  value       = aws_rds_cluster.aurora.id
}

output "aurora_cluster_endpoint" {
  description = "Aurora cluster writer endpoint"
  value       = aws_rds_cluster.aurora.endpoint
}

output "aurora_cluster_reader_endpoint" {
  description = "Aurora cluster reader endpoint"
  value       = aws_rds_cluster.aurora.reader_endpoint
}

output "aurora_cluster_port" {
  description = "Aurora cluster port"
  value       = aws_rds_cluster.aurora.port
}

output "aurora_database_name" {
  description = "Aurora database name"
  value       = aws_rds_cluster.aurora.database_name
}

output "dms_replication_instance_arn" {
  description = "DMS replication instance ARN"
  value       = aws_dms_replication_instance.main.replication_instance_arn
}

output "dms_replication_instance_private_ip" {
  description = "DMS replication instance private IP addresses"
  value       = aws_dms_replication_instance.main.replication_instance_private_ips
}

output "dms_source_endpoint_arn" {
  description = "DMS source endpoint ARN"
  value       = aws_dms_endpoint.source.endpoint_arn
}

output "dms_target_endpoint_arn" {
  description = "DMS target endpoint ARN"
  value       = aws_dms_endpoint.target.endpoint_arn
}

output "dms_replication_task_arn" {
  description = "DMS replication task ARN"
  value       = aws_dms_replication_task.main.replication_task_arn
}

output "s3_migration_bucket_name" {
  description = "S3 bucket name for file migration"
  value       = aws_s3_bucket.migration.id
}

output "s3_migration_bucket_arn" {
  description = "S3 bucket ARN for file migration"
  value       = aws_s3_bucket.migration.arn
}

output "sns_topic_arn" {
  description = "SNS topic ARN for migration alerts"
  value       = aws_sns_topic.migration_alerts.arn
}

output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.migration.dashboard_name
}

output "kms_rds_key_id" {
  description = "KMS key ID for RDS encryption"
  value       = aws_kms_key.rds.id
}

output "kms_s3_key_id" {
  description = "KMS key ID for S3 encryption"
  value       = aws_kms_key.s3.id
}

output "security_group_aurora_id" {
  description = "Security group ID for Aurora"
  value       = aws_security_group.aurora.id
}

output "security_group_dms_id" {
  description = "Security group ID for DMS"
  value       = aws_security_group.dms.id
}
