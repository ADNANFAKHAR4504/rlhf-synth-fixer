# Root Module - Outputs

output "vpc_id" {
  value       = module.vpc.vpc_id
  description = "ID of the VPC"
}

output "alb_dns_name" {
  value       = module.alb.alb_dns_name
  description = "DNS name of the Application Load Balancer"
}

output "rds_endpoint" {
  value       = module.rds.endpoint
  description = "RDS instance endpoint"
  sensitive   = true
}

output "s3_bucket_name" {
  value       = module.s3.bucket_name
  description = "Name of the S3 bucket"
}

output "environment" {
  value       = var.environment
  description = "Current environment"
}