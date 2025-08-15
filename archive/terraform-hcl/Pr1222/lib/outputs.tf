# VPC Outputs
output "vpc_ids" {
  description = "IDs of the VPCs"
  value       = { for k, v in aws_vpc.main : k => v.id }
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = { for k, v in aws_subnet.public : k => v.id }
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = { for k, v in aws_subnet.private : k => v.id }
}

# EC2 Outputs
output "ec2_instance_ids" {
  description = "IDs of the EC2 instances"
  value       = { for k, v in aws_instance.web : k => v.id }
}

output "elastic_ips" {
  description = "Elastic IP addresses"
  value       = { for k, v in aws_eip.web : k => v.public_ip }
}

# RDS Outputs
output "rds_endpoints" {
  description = "RDS instance endpoints"
  value       = { for k, v in aws_db_instance.main : k => v.endpoint }
  sensitive   = true
}

# Load Balancer Outputs
output "alb_dns_names" {
  description = "DNS names of the Application Load Balancers"
  value       = { for k, v in aws_lb.main : k => v.dns_name }
}

# S3 Bucket Outputs
output "s3_bucket_names" {
  description = "Names of the S3 buckets"
  value       = { for k, v in aws_s3_bucket.main : k => v.bucket }
}

# Lambda Output
output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.example.function_name
}

# WAF Output
output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.arn
}

# Backup Vault Output
output "backup_vault_name" {
  description = "Name of the backup vault"
  value       = aws_backup_vault.main.name
}

# Secrets Manager Outputs
output "secrets_manager_secret_arns" {
  description = "ARNs of the Secrets Manager secrets"
  value       = { for k, v in aws_secretsmanager_secret.db_credentials : k => v.arn }
  sensitive   = true
}