output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.vpc.private_subnet_ids
}

output "web_security_group_id" {
  description = "ID of the web security group"
  value       = module.security_groups.web_security_group_id
}

output "ssh_security_group_id" {
  description = "ID of the SSH security group"
  value       = module.security_groups.ssh_security_group_id
}

# VPC Lattice output disabled for LocalStack compatibility
# output "service_network_id" {
#   description = "ID of the VPC Lattice Service Network"
#   value       = module.vpc.service_network_id
# }