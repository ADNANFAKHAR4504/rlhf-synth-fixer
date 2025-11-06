# outputs.tf

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "rds_endpoint" {
  description = "Endpoint of the RDS PostgreSQL instance"
  value       = aws_db_instance.payment_db.endpoint
  sensitive   = true
}

output "rds_database_name" {
  description = "Name of the RDS database"
  value       = aws_db_instance.payment_db.db_name
}

output "kms_key_rds_arn" {
  description = "ARN of the KMS key for RDS encryption"
  value       = aws_kms_key.rds.arn
}

output "kms_key_s3_arn" {
  description = "ARN of the KMS key for S3 encryption"
  value       = aws_kms_key.s3.arn
}

output "kms_key_logs_arn" {
  description = "ARN of the KMS key for CloudWatch Logs encryption"
  value       = aws_kms_key.logs.arn
}

output "app_logs_bucket" {
  description = "Name of the S3 bucket for application logs"
  value       = aws_s3_bucket.app_logs.id
}

output "audit_trails_bucket" {
  description = "Name of the S3 bucket for audit trails"
  value       = aws_s3_bucket.audit_trails.id
}

output "flow_logs_bucket" {
  description = "Name of the S3 bucket for VPC flow logs"
  value       = aws_s3_bucket.flow_logs.id
}

output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = data.aws_guardduty_detector.main.id
}

output "security_alerts_topic_arn" {
  description = "ARN of the SNS topic for security alerts"
  value       = aws_sns_topic.security_alerts.arn
}

output "ec2_instance_ids" {
  description = "IDs of the EC2 payment processing instances"
  value       = aws_instance.payment_processing[*].id
}

output "security_group_app_tier_id" {
  description = "ID of the application tier security group"
  value       = aws_security_group.app_tier.id
}

output "security_group_database_tier_id" {
  description = "ID of the database tier security group"
  value       = aws_security_group.database_tier.id
}

output "vpc_endpoint_s3_id" {
  description = "ID of the S3 VPC endpoint"
  value       = aws_vpc_endpoint.s3.id
}

output "vpc_endpoint_ec2_id" {
  description = "ID of the EC2 VPC endpoint"
  value       = aws_vpc_endpoint.ec2.id
}

output "vpc_endpoint_rds_id" {
  description = "ID of the RDS VPC endpoint"
  value       = aws_vpc_endpoint.rds.id
}

output "db_password_secret_arn" {
  description = "ARN of the Secrets Manager secret for DB password"
  value       = aws_secretsmanager_secret.db_password.arn
  sensitive   = true
}

output "config_recorder_id" {
  description = "ID of the AWS Config recorder"
  value       = aws_config_configuration_recorder.main.id
}
