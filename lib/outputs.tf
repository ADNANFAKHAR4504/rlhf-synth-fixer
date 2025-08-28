output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.vpc.private_subnet_ids
}

output "ec2_instance_ids" {
  description = "IDs of the EC2 instances"
  value       = module.ec2.instance_ids
}

output "iam_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = module.iam.ec2_role_arn
}

output "secrets_arns" {
  description = "ARNs of the secrets in Secrets Manager"
  value       = module.secrets.secret_arns
}