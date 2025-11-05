# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = local.vpc_id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = local.private_subnet_ids
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = local.public_subnet_ids
}

# ECR Outputs
output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.app.repository_url
}

output "ecr_repository_name" {
  description = "Name of the ECR repository"
  value       = aws_ecr_repository.app.name
}

# ALB Outputs
output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the load balancer"
  value       = aws_lb.main.arn
}

output "alb_url" {
  description = "URL of the application (HTTP endpoint)"
  value       = "http://${aws_lb.main.dns_name}"
}

output "alb_https_url" {
  description = "HTTPS URL of the application (if HTTPS enabled)"
  value       = var.enable_https ? "https://${aws_lb.main.dns_name}" : null
}

output "application_url" {
  description = "Primary application URL"
  value       = var.enable_route53 && var.enable_https ? "https://${var.domain_name}" : (var.enable_route53 ? "http://${var.domain_name}" : "http://${aws_lb.main.dns_name}")
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

output "ecs_task_definition_arn" {
  description = "ARN of the ECS task definition"
  value       = aws_ecs_task_definition.app.arn
}

# RDS Outputs
output "rds_cluster_endpoint" {
  description = "Writer endpoint for the RDS cluster"
  value       = aws_rds_cluster.aurora.endpoint
}

output "rds_cluster_reader_endpoint" {
  description = "Reader endpoint for the RDS cluster"
  value       = aws_rds_cluster.aurora.reader_endpoint
}

output "rds_cluster_id" {
  description = "ID of the RDS cluster"
  value       = aws_rds_cluster.aurora.id
}

output "rds_database_name" {
  description = "Name of the database"
  value       = aws_rds_cluster.aurora.database_name
}

# CloudWatch Outputs
output "cloudwatch_log_group" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.ecs_tasks.name
}

output "cloudwatch_log_group_arn" {
  description = "ARN of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.ecs_tasks.arn
}

# Target Group Outputs
output "blue_target_group_arn" {
  description = "ARN of the blue target group"
  value       = aws_lb_target_group.blue.arn
}

output "green_target_group_arn" {
  description = "ARN of the green target group"
  value       = aws_lb_target_group.green.arn
}

output "blue_target_group_name" {
  description = "Name of the blue target group"
  value       = aws_lb_target_group.blue.name
}

output "green_target_group_name" {
  description = "Name of the green target group"
  value       = aws_lb_target_group.green.name
}

# SNS Outputs
output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

# WAF Outputs
output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.id
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.arn
}

# Secrets Manager Outputs
output "secrets_manager_rds_secret_arn" {
  description = "ARN of the RDS credentials secret"
  value       = aws_secretsmanager_secret.rds_credentials.arn
  sensitive   = true
}

output "secrets_manager_rds_secret_name" {
  description = "Name of the RDS credentials secret"
  value       = aws_secretsmanager_secret.rds_credentials.name
}

# Security Group Outputs
output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "ecs_security_group_id" {
  description = "ID of the ECS tasks security group"
  value       = aws_security_group.ecs_tasks.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

# Route53 Outputs (conditional)
output "route53_record_fqdn" {
  description = "FQDN of the Route53 record (if enabled)"
  value       = var.enable_route53 ? aws_route53_record.app[0].fqdn : null
}

output "route53_health_check_id" {
  description = "ID of the Route53 health check (if enabled)"
  value       = var.enable_route53 ? aws_route53_health_check.app[0].id : null
}

# Environment Suffix Output
output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = local.environment_suffix
}

# Region Output
output "aws_region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}
