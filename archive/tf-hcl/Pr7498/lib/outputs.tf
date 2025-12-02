# outputs.tf
output "vpc_id" {
  description = "VPC ID"
  value       = module.networking.vpc_id
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.alb_dns_name
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "rds_cluster_endpoint" {
  description = "RDS cluster endpoint"
  value       = module.rds.cluster_endpoint
  sensitive   = true
}

output "rds_reader_endpoint" {
  description = "RDS reader endpoint"
  value       = module.rds.cluster_reader_endpoint
  sensitive   = true
}

output "state_bucket_name" {
  description = "S3 bucket name for Terraform state"
  value       = aws_s3_bucket.terraform_state.id
}

output "locks_table_name" {
  description = "DynamoDB table name for state locks"
  value       = aws_dynamodb_table.terraform_locks.name
}
