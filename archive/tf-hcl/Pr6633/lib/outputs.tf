# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = var.use_existing_vpc ? data.aws_vpc.existing[0].id : aws_vpc.main[0].id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = var.use_existing_vpc ? data.aws_subnets.public[0].ids : aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = var.use_existing_vpc ? data.aws_subnets.private[0].ids : aws_subnet.private[*].id
}

# ALB Outputs
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.app.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.app.arn
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.app.zone_id
}

# Auto Scaling Outputs
output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = module.ec2_autoscaling.autoscaling_group_name
}

output "autoscaling_group_arn" {
  description = "ARN of the Auto Scaling Group"
  value       = module.ec2_autoscaling.autoscaling_group_arn
}

# RDS Outputs
output "rds_endpoint" {
  description = "RDS connection endpoint"
  value       = module.rds_postgres.db_instance_endpoint
  sensitive   = true
}

output "rds_address" {
  description = "RDS instance address"
  value       = module.rds_postgres.db_instance_address
  sensitive   = true
}

output "rds_port" {
  description = "RDS instance port"
  value       = module.rds_postgres.db_instance_port
}

output "rds_database_name" {
  description = "RDS database name"
  value       = module.rds_postgres.db_instance_name
}

# Security Group Outputs
output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "ec2_security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

# State Backend Outputs
output "state_bucket_name" {
  description = "Name of the S3 bucket for Terraform state"
  value       = aws_s3_bucket.terraform_state.id
}

output "state_lock_table_name" {
  description = "Name of the DynamoDB table for state locking"
  value       = aws_dynamodb_table.terraform_state_lock.id
}

# Environment Information
output "environment" {
  description = "Current Terraform workspace/environment"
  value       = terraform.workspace
}

output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = var.environment_suffix
}

output "region" {
  description = "AWS region"
  value       = var.primary_region
}
