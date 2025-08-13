# main.tf - Root module that calls the secure_env module

module "secure_environment" {
  source = "./secure_env"

  # Pass variables to the module
  trusted_account_id = var.trusted_account_id
  allowed_cidr_blocks = var.allowed_cidr_blocks
  instance_type      = var.instance_type
  key_pair_name      = var.key_pair_name
}

# Root level variables
variable "trusted_account_id" {
  description = "AWS Account ID that is allowed to assume the cross-account role"
  type        = string
  default     = "123456789012"  # Replace with actual trusted account ID
}

variable "allowed_cidr_blocks" {
  description = "List of CIDR blocks allowed to access HTTP/HTTPS ports"
  type        = list(string)
  default = [
    "10.0.0.0/8",     # Private network range
    "172.16.0.0/12",  # Private network range
    "192.168.0.0/16"  # Private network range
  ]
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "key_pair_name" {
  description = "Name of the EC2 Key Pair for instance access"
  type        = string
  default     = "secure-env-key"  # Replace with your actual key pair name
}

# Output values from the module
output "instance_id" {
  description = "ID of the created EC2 instance"
  value       = module.secure_environment.instance_id
}

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = module.secure_environment.instance_public_ip
}

output "instance_private_ip" {
  description = "Private IP address of the EC2 instance"
  value       = module.secure_environment.instance_private_ip
}

output "security_group_id" {
  description = "ID of the created security group"
  value       = module.secure_environment.security_group_id
}

output "cross_account_role_arn" {
  description = "ARN of the cross-account IAM role"
  value       = module.secure_environment.cross_account_role_arn
}

output "cross_account_role_external_id" {
  description = "External ID required for assuming the cross-account role"
  value       = module.secure_environment.cross_account_role_external_id
  sensitive   = true
}