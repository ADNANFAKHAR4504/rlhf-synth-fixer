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

output "web_security_group_id" {
  description = "ID of the web security group"
  value       = module.vpc.web_security_group_id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = module.vpc.internet_gateway_id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = module.vpc.nat_gateway_ids
}

output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = module.ec2.load_balancer_dns
}

output "instance_ids" {
  description = "IDs of the EC2 instances"
  value       = module.ec2.instance_ids
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = module.ec2.target_group_arn
}

output "ec2_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = module.iam.ec2_role_arn
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = module.iam.ec2_instance_profile_name
}

output "lambda_role_arn" {
  description = "ARN of the Lambda IAM role"
  value       = module.iam.lambda_role_arn
}

output "ec2_role_name" {
  description = "Name of the EC2 IAM role"
  value       = module.iam.ec2_role_name
}

output "secrets_arns" {
  description = "ARNs of the secrets in Secrets Manager"
  value       = module.secrets.secret_arns
}

output "secret_names" {
  description = "Names of the created secrets"
  value       = module.secrets.secret_names
}

output "secrets_access_policy_arn" {
  description = "ARN of the secrets access policy"
  value       = module.secrets.secrets_access_policy_arn
}

output "secret_ids" {
  description = "IDs of the created secrets"
  value       = module.secrets.secret_ids
}

output "cloudwatch_dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = module.monitoring.dashboard_url
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = module.monitoring.sns_topic_arn
}

output "log_group_name" {
  description = "Name of the main CloudWatch log group"
  value       = module.monitoring.log_group_name
}

output "log_group_arn" {
  description = "ARN of the main CloudWatch log group"
  value       = module.monitoring.log_group_arn
}

output "system_log_group_name" {
  description = "Name of the system CloudWatch log group"
  value       = module.monitoring.system_log_group_name
}