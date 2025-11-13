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
  value       = { for k, v in aws_subnet.public : k => v.id }
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = { for k, v in aws_subnet.private : k => v.id }
}

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

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.main.arn
}

output "rds_endpoint" {
  description = "Connection endpoint for RDS instance"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_address" {
  description = "Address of the RDS instance"
  value       = aws_db_instance.main.address
  sensitive   = true
}

output "rds_port" {
  description = "Port of the RDS instance"
  value       = aws_db_instance.main.port
}

output "rds_database_name" {
  description = "Name of the database"
  value       = aws_db_instance.main.db_name
}

output "ec2_instance_ids" {
  description = "IDs of EC2 instances"
  value       = { for k, v in module.ec2_instances : k => v.instance_id }
}

output "ec2_private_ips" {
  description = "Private IP addresses of EC2 instances"
  value       = { for k, v in module.ec2_instances : k => v.private_ip }
}

output "ec2_public_ips" {
  description = "Public IP addresses of EC2 instances"
  value       = { for k, v in module.ec2_instances : k => v.public_ip }
}

output "s3_state_bucket" {
  description = "Name of the S3 bucket for Terraform state"
  value       = aws_s3_bucket.terraform_state.id
}

output "dynamodb_lock_table" {
  description = "Name of the DynamoDB table for state locking"
  value       = aws_dynamodb_table.terraform_lock.name
}

output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = var.environmentSuffix
}