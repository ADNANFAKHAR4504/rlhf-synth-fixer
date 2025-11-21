# outputs.tf

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.compute.alb_dns_name
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.network.vpc_id
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.database.db_endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for transaction logs"
  value       = module.storage.bucket_name
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.compute.ecs_cluster_name
}
