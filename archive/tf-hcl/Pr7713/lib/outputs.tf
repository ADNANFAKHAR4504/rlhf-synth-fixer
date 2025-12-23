# Terraform Outputs for Multi-Environment AWS Infrastructure

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of the database subnets"
  value       = aws_subnet.database[*].id
}

# Load Balancer Outputs
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

# ECS Outputs
output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app.name
}

output "ecs_task_definition_arn" {
  description = "ARN of the ECS task definition"
  value       = aws_ecs_task_definition.app.arn
}

# RDS Outputs
output "rds_cluster_identifier" {
  description = "Identifier of the RDS Aurora cluster"
  value       = aws_rds_cluster.main.cluster_identifier
}

output "rds_cluster_endpoint" {
  description = "Writer endpoint of the RDS Aurora cluster"
  value       = aws_rds_cluster.main.endpoint
  sensitive   = true
}

output "rds_cluster_reader_endpoint" {
  description = "Reader endpoint of the RDS Aurora cluster"
  value       = aws_rds_cluster.main.reader_endpoint
  sensitive   = true
}

output "rds_cluster_port" {
  description = "Port of the RDS Aurora cluster"
  value       = aws_rds_cluster.main.port
}

output "rds_cluster_database_name" {
  description = "Database name of the RDS Aurora cluster"
  value       = aws_rds_cluster.main.database_name
}

# S3 Outputs
output "s3_bucket_name" {
  description = "Name of the S3 assets bucket"
  value       = aws_s3_bucket.assets.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 assets bucket"
  value       = aws_s3_bucket.assets.arn
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 assets bucket"
  value       = aws_s3_bucket.assets.bucket_domain_name
}

# Security Group Outputs
output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "ecs_security_group_id" {
  description = "ID of the ECS security group"
  value       = aws_security_group.ecs.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

# Secrets Manager Outputs
output "rds_password_secret_arn" {
  description = "ARN of the RDS master password secret (AWS managed)"
  value       = aws_rds_cluster.main.master_user_secret[0].secret_arn
  sensitive   = true
}

output "rds_password_secret_name" {
  description = "Name of the RDS master password secret (AWS managed)"
  value       = split(":", aws_rds_cluster.main.master_user_secret[0].secret_arn)[6]
  sensitive   = true
}

# CloudWatch Outputs
output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group for ECS"
  value       = aws_cloudwatch_log_group.ecs.name
}

output "cloudwatch_dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = "https://${data.aws_region.current.name}.console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

# Environment Information
output "environment" {
  description = "Current environment"
  value       = var.environment
}

output "aws_region" {
  description = "AWS region"
  value       = data.aws_region.current.name
}

output "aws_account_id" {
  description = "AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}

# Application URL
output "application_url" {
  description = "URL to access the application"
  value       = "http://${aws_lb.main.dns_name}"
}