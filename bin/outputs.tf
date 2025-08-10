
output "vpc_id" {
  value       = module.vpc.vpc_id
  description = "The VPC identifier"
}

output "public_subnet_ids" {
  value       = module.vpc.public_subnet_ids
  description = "List of public subnet IDs"
}

output "private_subnet_ids" {
  value       = module.vpc.private_subnet_ids
  description = "List of private subnet IDs"  
}

output "web_security_group_id" {
  value       = module.vpc.web_security_group_id
  description = "Web tier security group ID"
}

output "db_security_group_id" {
  value       = module.vpc.db_security_group_id
  description = "Database tier security group ID"
}
