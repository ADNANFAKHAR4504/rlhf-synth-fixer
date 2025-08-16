# Root level outputs that expose module outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.tap_stack.vpc_id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.tap_stack.vpc_cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.tap_stack.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.tap_stack.private_subnet_ids
}

output "web_security_group_id" {
  description = "ID of the web security group"
  value       = module.tap_stack.web_security_group_id
}

output "database_security_group_id" {
  description = "ID of the database security group"
  value       = module.tap_stack.database_security_group_id
}

output "database_endpoint" {
  description = "RDS instance endpoint"
  value       = module.tap_stack.database_endpoint
  sensitive   = true
}

output "database_port" {
  description = "RDS instance port"
  value       = module.tap_stack.database_port
}

output "database_name" {
  description = "RDS instance database name"
  value       = module.tap_stack.database_name
}

output "database_identifier" {
  description = "RDS instance identifier"
  value       = module.tap_stack.database_identifier
}

output "db_username_secret_arn" {
  description = "ARN of the database username secret"
  value       = module.tap_stack.db_username_secret_arn
}

output "db_password_secret_arn" {
  description = "ARN of the database password secret"
  value       = module.tap_stack.db_password_secret_arn
  sensitive   = true
}

output "api_key_secret_arn" {
  description = "ARN of the API key secret"
  value       = module.tap_stack.api_key_secret_arn
  sensitive   = true
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = module.tap_stack.nat_gateway_ids
}

output "nat_gateway_public_ips" {
  description = "Public IPs of the NAT Gateways"
  value       = module.tap_stack.nat_gateway_public_ips
}

output "log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = module.tap_stack.log_group_name
}

output "log_group_arn" {
  description = "ARN of the CloudWatch log group"
  value       = module.tap_stack.log_group_arn
}

output "environment" {
  description = "Environment name"
  value       = module.tap_stack.environment
}

output "project_name" {
  description = "Project name"
  value       = module.tap_stack.project_name
}

output "name_prefix" {
  description = "Name prefix used for resources"
  value       = module.tap_stack.name_prefix
}

output "aws_region" {
  description = "AWS region"
  value       = module.tap_stack.aws_region
}

output "vpc_arn" {
  description = "ARN of the VPC"
  value       = module.tap_stack.vpc_arn
}

output "db_username_secret_name" {
  description = "Name of the database username secret"
  value       = module.tap_stack.db_username_secret_name
}

output "db_password_secret_name" {
  description = "Name of the database password secret"
  value       = module.tap_stack.db_password_secret_name
  sensitive   = true
}

output "api_key_secret_name" {
  description = "Name of the API key secret"
  value       = module.tap_stack.api_key_secret_name
  sensitive   = true
}

output "environment_suffix" {
  description = "Environment suffix used for unique naming"
  value       = module.tap_stack.environment_suffix
}

output "availability_zones" {
  description = "Availability zones used"
  value       = module.tap_stack.availability_zones
}

# Additional useful outputs for connecting other resources
output "connection_info" {
  description = "Database connection information"
  value = {
    endpoint            = module.tap_stack.database_endpoint
    port                = module.tap_stack.database_port
    database            = module.tap_stack.database_name
    username_secret_arn = module.tap_stack.db_username_secret_arn
    password_secret_arn = module.tap_stack.db_password_secret_arn
  }
  sensitive = true
}

output "network_info" {
  description = "Network configuration information"
  value = {
    vpc_id             = module.tap_stack.vpc_id
    public_subnet_ids  = module.tap_stack.public_subnet_ids
    private_subnet_ids = module.tap_stack.private_subnet_ids
    web_sg_id          = module.tap_stack.web_security_group_id
    database_sg_id     = module.tap_stack.database_security_group_id
  }
}
