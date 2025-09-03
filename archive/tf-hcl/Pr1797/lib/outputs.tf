output "dev_vpc_id" {
  description = "ID of the development VPC"
  value       = module.dev_environment.vpc_id
}

output "staging_vpc_id" {
  description = "ID of the staging VPC"
  value       = module.staging_environment.vpc_id
}

output "prod_vpc_id" {
  description = "ID of the production VPC"
  value       = module.prod_environment.vpc_id
}

output "dev_instance_ids" {
  description = "IDs of development EC2 instances"
  value       = module.dev_environment.instance_ids
}

output "staging_instance_ids" {
  description = "IDs of staging EC2 instances"
  value       = module.staging_environment.instance_ids
}

output "prod_instance_ids" {
  description = "IDs of production EC2 instances"
  value       = module.prod_environment.instance_ids
}

output "dev_instance_public_ips" {
  description = "Public IPs of development EC2 instances"
  value       = module.dev_environment.instance_public_ips
}

output "staging_instance_public_ips" {
  description = "Public IPs of staging EC2 instances"
  value       = module.staging_environment.instance_public_ips
}

output "prod_instance_public_ips" {
  description = "Public IPs of production EC2 instances"
  value       = module.prod_environment.instance_public_ips
}

output "dev_security_group_id" {
  description = "ID of the development security group"
  value       = module.dev_environment.security_group_id
}

output "staging_security_group_id" {
  description = "ID of the staging security group"
  value       = module.staging_environment.security_group_id
}

output "prod_security_group_id" {
  description = "ID of the production security group"
  value       = module.prod_environment.security_group_id
}