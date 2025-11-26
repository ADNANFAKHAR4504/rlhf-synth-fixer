# outputs.tf

# ================================
# VPC OUTPUTS
# ================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

# ================================
# RDS AURORA OUTPUTS
# ================================

output "aurora_cluster_id" {
  description = "Aurora cluster identifier"
  value       = aws_rds_cluster.aurora.cluster_identifier
}

output "aurora_cluster_endpoint" {
  description = "Aurora cluster endpoint (write)"
  value       = aws_rds_cluster.aurora.endpoint
}

output "aurora_cluster_reader_endpoint" {
  description = "Aurora cluster reader endpoint (read-only)"
  value       = aws_rds_cluster.aurora.reader_endpoint
}

output "aurora_cluster_arn" {
  description = "ARN of the Aurora cluster"
  value       = aws_rds_cluster.aurora.arn
}

output "aurora_cluster_port" {
  description = "Port of the Aurora cluster"
  value       = aws_rds_cluster.aurora.port
}

output "aurora_database_name" {
  description = "Name of the default database"
  value       = aws_rds_cluster.aurora.database_name
}

output "aurora_master_username" {
  description = "Master username for the Aurora cluster"
  value       = aws_rds_cluster.aurora.master_username
  sensitive   = true
}

output "aurora_instance_ids" {
  description = "IDs of the Aurora cluster instances"
  value       = aws_rds_cluster_instance.aurora_instances[*].id
}

output "aurora_instance_endpoints" {
  description = "Endpoints of the Aurora cluster instances"
  value       = aws_rds_cluster_instance.aurora_instances[*].endpoint
}

# ================================
# ROUTE53 OUTPUTS
# ================================

output "route53_zone_id" {
  description = "ID of the Route53 private hosted zone"
  value       = aws_route53_zone.private.zone_id
}

output "route53_primary_endpoint" {
  description = "Route53 DNS name for primary database endpoint"
  value       = aws_route53_record.primary.fqdn
}

output "route53_reader_endpoint" {
  description = "Route53 DNS name for reader database endpoint"
  value       = aws_route53_record.reader.fqdn
}

# ================================
# SECRETS MANAGER OUTPUTS
# ================================

output "db_credentials_secret_arn" {
  description = "ARN of the Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "db_credentials_secret_name" {
  description = "Name of the Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.db_credentials.name
}

# ================================
# SNS OUTPUTS
# ================================

output "sns_alerts_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "sns_alerts_topic_name" {
  description = "Name of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.name
}

# ================================
# LAMBDA OUTPUTS
# ================================

output "lambda_failover_coordinator_arn" {
  description = "ARN of the failover coordinator Lambda function"
  value       = aws_lambda_function.failover_coordinator.arn
}

output "lambda_health_checker_arn" {
  description = "ARN of the health checker Lambda function"
  value       = aws_lambda_function.health_checker.arn
}

output "lambda_connection_drainer_arn" {
  description = "ARN of the connection drainer Lambda function"
  value       = aws_lambda_function.connection_drainer.arn
}

output "lambda_secret_rotation_arn" {
  description = "ARN of the secret rotation Lambda function"
  value       = aws_lambda_function.secret_rotation.arn
}

output "lambda_backup_verifier_arn" {
  description = "ARN of the backup verifier Lambda function"
  value       = aws_lambda_function.backup_verifier.arn
}

# ================================
# CLOUDWATCH OUTPUTS
# ================================

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "cloudwatch_log_group_rds" {
  description = "Name of the CloudWatch log group for RDS"
  value       = aws_cloudwatch_log_group.rds_postgresql.name
}

# ================================
# SECURITY GROUP OUTPUTS
# ================================

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "lambda_security_group_id" {
  description = "ID of the Lambda security group"
  value       = aws_security_group.lambda.id
}

# ================================
# KMS OUTPUTS
# ================================

output "kms_rds_key_id" {
  description = "ID of the KMS key for RDS encryption"
  value       = aws_kms_key.rds.id
}

output "kms_rds_key_arn" {
  description = "ARN of the KMS key for RDS encryption"
  value       = aws_kms_key.rds.arn
}

output "kms_sns_key_id" {
  description = "ID of the KMS key for SNS encryption"
  value       = aws_kms_key.sns.id
}

# ================================
# FIS OUTPUTS
# ================================

output "fis_experiment_template_id" {
  description = "ID of the FIS experiment template for failover testing"
  value       = aws_fis_experiment_template.aurora_failover.id
}

# ================================
# CONNECTION INFORMATION
# ================================

output "database_connection_info" {
  description = "Database connection information"
  value = {
    endpoint        = aws_rds_cluster.aurora.endpoint
    reader_endpoint = aws_rds_cluster.aurora.reader_endpoint
    port            = aws_rds_cluster.aurora.port
    database        = aws_rds_cluster.aurora.database_name
    secret_arn      = aws_secretsmanager_secret.db_credentials.arn
  }
}

output "monitoring_endpoints" {
  description = "Monitoring and observability endpoints"
  value = {
    dashboard_name   = aws_cloudwatch_dashboard.main.dashboard_name
    sns_topic_arn    = aws_sns_topic.alerts.arn
    log_group_rds    = aws_cloudwatch_log_group.rds_postgresql.name
    log_group_lambda = aws_cloudwatch_log_group.lambda_failover.name
  }
}
