# outputs.tf - Output values for referencing in other configurations

output "aurora_cluster_id" {
  description = "The ID of the Aurora cluster"
  value       = aws_rds_cluster.aurora_serverless.id
}

output "aurora_cluster_endpoint" {
  description = "The cluster endpoint for write operations"
  value       = aws_rds_cluster.aurora_serverless.endpoint
}

output "aurora_reader_endpoint" {
  description = "The cluster reader endpoint for read operations"
  value       = aws_rds_cluster.aurora_serverless.reader_endpoint
}

output "aurora_cluster_arn" {
  description = "The ARN of the Aurora cluster"
  value       = aws_rds_cluster.aurora_serverless.arn
}

output "aurora_security_group_id" {
  description = "The ID of the security group for Aurora"
  value       = aws_security_group.aurora.id
}

output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "kms_key_id" {
  description = "The ID of the KMS key used for encryption"
  value       = aws_kms_key.aurora.id
}

output "kms_key_arn" {
  description = "The ARN of the KMS key used for encryption"
  value       = aws_kms_key.aurora.arn
}

output "backup_bucket_name" {
  description = "The name of the S3 bucket for backups"
  value       = aws_s3_bucket.aurora_backups.id
}

output "backup_bucket_arn" {
  description = "The ARN of the S3 bucket for backups"
  value       = aws_s3_bucket.aurora_backups.arn
}

output "cloudwatch_dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.aurora.dashboard_name}"
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for notifications"
  value       = aws_sns_topic.aurora_alerts.arn
}

output "connection_info" {
  description = "Database connection information"
  value = {
    endpoint      = aws_rds_cluster.aurora_serverless.endpoint
    port          = aws_rds_cluster.aurora_serverless.port
    database_name = aws_rds_cluster.aurora_serverless.database_name
    username      = aws_rds_cluster.aurora_serverless.master_username
  }
  sensitive = true
}