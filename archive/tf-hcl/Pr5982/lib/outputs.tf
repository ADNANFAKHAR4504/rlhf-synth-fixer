# Networking Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_app_subnet_ids" {
  description = "IDs of private application subnets"
  value       = aws_subnet.private_app[*].id
}

output "private_db_subnet_ids" {
  description = "IDs of private database subnets"
  value       = aws_subnet.private_db[*].id
}

# Database Outputs
output "aurora_cluster_endpoint" {
  description = "Writer endpoint for Aurora cluster"
  value       = aws_rds_cluster.payment.endpoint
  sensitive   = true
}

output "aurora_reader_endpoint" {
  description = "Reader endpoint for Aurora cluster"
  value       = aws_rds_cluster.payment.reader_endpoint
  sensitive   = true
}

output "aurora_cluster_id" {
  description = "Aurora cluster identifier"
  value       = aws_rds_cluster.payment.cluster_identifier
}

output "aurora_database_name" {
  description = "Aurora database name"
  value       = aws_rds_cluster.payment.database_name
}

# Load Balancer Outputs
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.payment.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.payment.arn
}

output "blue_target_group_arn" {
  description = "ARN of blue target group"
  value       = aws_lb_target_group.blue.arn
}

output "green_target_group_arn" {
  description = "ARN of green target group"
  value       = aws_lb_target_group.green.arn
}

# ECS Outputs
output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.payment.name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.payment.arn
}

output "ecs_blue_service_name" {
  description = "Name of blue ECS service"
  value       = aws_ecs_service.payment_blue.name
}

output "ecs_green_service_name" {
  description = "Name of green ECS service"
  value       = aws_ecs_service.payment_green.name
}

# DMS Outputs
output "dms_replication_instance_arn" {
  description = "ARN of DMS replication instance"
  value       = aws_dms_replication_instance.main.replication_instance_arn
}

output "dms_replication_task_arn" {
  description = "ARN of DMS replication task"
  value       = aws_dms_replication_task.main.replication_task_arn
}

output "dms_source_endpoint_arn" {
  description = "ARN of DMS source endpoint"
  value       = aws_dms_endpoint.source.endpoint_arn
}

output "dms_target_endpoint_arn" {
  description = "ARN of DMS target endpoint"
  value       = aws_dms_endpoint.target.endpoint_arn
}

# Route 53 Outputs
output "private_hosted_zone_id" {
  description = "ID of Route 53 private hosted zone"
  value       = aws_route53_zone.private.zone_id
}

output "private_hosted_zone_name" {
  description = "Name of Route 53 private hosted zone"
  value       = aws_route53_zone.private.name
}

# Migration Status Outputs
output "migration_phase" {
  description = "Current migration phase"
  value       = var.migration_phase
}

output "traffic_distribution" {
  description = "Current traffic distribution between blue and green"
  value = {
    blue_weight  = var.blue_target_weight
    green_weight = var.green_target_weight
  }
}

output "workspace" {
  description = "Current Terraform workspace"
  value       = local.environment
}

# S3 Bucket Outputs
output "alb_logs_bucket" {
  description = "S3 bucket for ALB logs"
  value       = aws_s3_bucket.alb_logs.bucket
}

output "logs_backup_bucket" {
  description = "S3 bucket for log backups"
  value       = aws_s3_bucket.logs_backup.bucket
}

# CloudWatch Outputs
output "ecs_log_group" {
  description = "CloudWatch log group for ECS tasks"
  value       = aws_cloudwatch_log_group.ecs_payment.name
}

output "dms_log_group" {
  description = "CloudWatch log group for DMS"
  value       = aws_cloudwatch_log_group.dms.name
}

# Connection Information
output "connection_info" {
  description = "Connection information for migration"
  value = {
    alb_endpoint = "https://${aws_lb.payment.dns_name}"
    internal_api = "https://api.payment.internal"
    db_writer    = "db-writer.payment.internal"
    db_reader    = "db-reader.payment.internal"
  }
}