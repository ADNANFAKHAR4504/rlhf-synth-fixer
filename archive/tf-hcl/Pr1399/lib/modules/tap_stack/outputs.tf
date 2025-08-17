# VPC outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

# Subnet outputs
output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "public_subnet_cidrs" {
  description = "CIDR blocks of the public subnets"
  value       = aws_subnet.public[*].cidr_block
}

output "private_subnet_cidrs" {
  description = "CIDR blocks of the private subnets"
  value       = aws_subnet.private[*].cidr_block
}

# Security Group outputs
output "web_security_group_id" {
  description = "ID of the web security group"
  value       = aws_security_group.web.id
}

output "database_security_group_id" {
  description = "ID of the database security group"
  value       = aws_security_group.database.id
}

# Database outputs
output "database_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "database_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "database_name" {
  description = "RDS instance database name"
  value       = aws_db_instance.main.db_name
}

output "database_identifier" {
  description = "RDS instance identifier"
  value       = aws_db_instance.main.identifier
}

# Secrets Manager outputs
output "db_username_secret_arn" {
  description = "ARN of the database username secret"
  value       = aws_secretsmanager_secret.db_master_username.arn
}

output "db_password_secret_arn" {
  description = "ARN of the database password secret"
  value       = aws_secretsmanager_secret.db_master_password.arn
  sensitive   = true
}

output "api_key_secret_arn" {
  description = "ARN of the API key secret"
  value       = aws_secretsmanager_secret.api_key.arn
  sensitive   = true
}

# NAT Gateway outputs (conditional)
output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = var.enable_nat_gateway ? aws_nat_gateway.main[*].id : []
}

output "nat_gateway_public_ips" {
  description = "Public IPs of the NAT Gateways"
  value       = var.enable_nat_gateway ? aws_eip.nat[*].public_ip : []
}

# CloudWatch outputs
output "log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.app_logs.name
}

output "log_group_arn" {
  description = "ARN of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.app_logs.arn
}

# Environment info outputs
output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}

output "name_prefix" {
  description = "Name prefix used for resources"
  value       = local.name_prefix
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "availability_zones" {
  description = "Availability zones used"
  value       = var.availability_zones
}

# VPC ARN output
output "vpc_arn" {
  description = "ARN of the VPC"
  value       = aws_vpc.main.arn
}

# Secret name outputs for integration tests
output "db_username_secret_name" {
  description = "Name of the database username secret"
  value       = aws_secretsmanager_secret.db_master_username.name
}

output "db_password_secret_name" {
  description = "Name of the database password secret"
  value       = aws_secretsmanager_secret.db_master_password.name
  sensitive   = true
}

output "api_key_secret_name" {
  description = "Name of the API key secret"
  value       = aws_secretsmanager_secret.api_key.name
  sensitive   = true
}

# Environment suffix output
output "environment_suffix" {
  description = "Environment suffix used for unique naming"
  value       = var.environment_suffix
}
