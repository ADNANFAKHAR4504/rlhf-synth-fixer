output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.alb_dns_name
}

output "alb_arn" {
  description = "ALB ARN"
  value       = module.alb.alb_arn
}

output "ecs_cluster_arn" {
  description = "ECS Cluster ARN"
  value       = module.ecs.cluster_arn
}

output "ecs_service_name" {
  description = "ECS Service name"
  value       = module.ecs.service_name
}

output "rds_cluster_endpoint" {
  description = "RDS Aurora cluster endpoint"
  value       = module.database.cluster_endpoint
}

output "rds_cluster_reader_endpoint" {
  description = "RDS Aurora cluster reader endpoint"
  value       = module.database.cluster_reader_endpoint
}

output "database_secret_arn" {
  description = "Secrets Manager secret ARN for database credentials"
  value       = module.database.secret_arn
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = module.sns.topic_arn
}

output "cloudwatch_log_group_name" {
  description = "CloudWatch log group name"
  value       = module.cloudwatch.log_group_name
}

output "environment" {
  description = "Current environment"
  value       = var.environment
}

output "environment_suffix" {
  description = "Environment suffix used"
  value       = var.environment_suffix
}
