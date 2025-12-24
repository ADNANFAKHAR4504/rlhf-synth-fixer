output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.networking.alb_dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = module.networking.alb_arn
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = module.compute.autoscaling_group_name
}

output "database_endpoint" {
  description = "Writer endpoint for the Aurora cluster"
  value       = module.database.cluster_endpoint
}

output "database_reader_endpoint" {
  description = "Reader endpoint for the Aurora cluster"
  value       = module.database.cluster_reader_endpoint
}

output "database_name" {
  description = "Name of the database"
  value       = module.database.database_name
}

output "database_port" {
  description = "Port for the database"
  value       = module.database.cluster_port
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = local.vpc_id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = local.private_subnet_ids
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = local.public_subnet_ids
}
