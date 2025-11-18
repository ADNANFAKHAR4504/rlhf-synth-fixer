output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.ecs.alb_dns_name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.db_endpoint
  sensitive   = true
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.core.vpc_id
}

output "transaction_logs_bucket" {
  description = "S3 bucket for transaction logs"
  value       = aws_s3_bucket.transaction_logs.id
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}
