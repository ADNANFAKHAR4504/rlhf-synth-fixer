# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of database subnets"
  value       = aws_subnet.database[*].id
}

output "nat_gateway_ids" {
  description = "IDs of NAT gateways"
  value       = aws_nat_gateway.main[*].id
}

# ALB Outputs
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

# ECS Outputs
output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app.name
}

output "ecs_task_count" {
  description = "Number of ECS tasks running"
  value       = aws_ecs_service.app.desired_count
}

# RDS Outputs
output "rds_cluster_endpoint" {
  description = "Writer endpoint for the RDS Aurora cluster"
  value       = aws_rds_cluster.main.endpoint
}

output "rds_cluster_reader_endpoint" {
  description = "Reader endpoint for the RDS Aurora cluster"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "rds_cluster_id" {
  description = "ID of the RDS Aurora cluster"
  value       = aws_rds_cluster.main.id
}

output "rds_database_name" {
  description = "Name of the database"
  value       = aws_rds_cluster.main.database_name
}

# S3 Outputs
output "audit_logs_bucket_name" {
  description = "Name of the S3 audit logs bucket"
  value       = aws_s3_bucket.audit_logs.bucket
}

output "audit_logs_bucket_arn" {
  description = "ARN of the S3 audit logs bucket"
  value       = aws_s3_bucket.audit_logs.arn
}

# Environment Summary
output "environment_summary" {
  description = "Summary of the deployed environment"
  value = {
    environment        = var.environment_suffix
    workspace          = terraform.workspace
    vpc_cidr           = var.vpc_cidr
    ecs_task_count     = var.ecs_task_count
    rds_instance_class = var.rds_instance_class
    region             = var.aws_region
    alb_endpoint       = aws_lb.main.dns_name
    rds_endpoint       = aws_rds_cluster.main.endpoint
  }
}
