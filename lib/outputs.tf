# VPC Outputs
output "vpc_primary_id" {
  description = "ID of the primary VPC"
  value       = aws_vpc.primary.id
}

output "vpc_secondary_id" {
  description = "ID of the secondary VPC"
  value       = aws_vpc.secondary.id
}

# Subnet Outputs
output "public_subnet_ids_primary" {
  description = "IDs of the public subnets in primary region"
  value       = aws_subnet.public_primary[*].id
}

output "private_subnet_ids_primary" {
  description = "IDs of the private subnets in primary region"
  value       = aws_subnet.private_primary[*].id
}

output "public_subnet_ids_secondary" {
  description = "IDs of the public subnets in secondary region"
  value       = aws_subnet.public_secondary[*].id
}

output "private_subnet_ids_secondary" {
  description = "IDs of the private subnets in secondary region"
  value       = aws_subnet.private_secondary[*].id
}

# KMS Key Outputs
output "kms_key_primary_id" {
  description = "ID of the KMS key in primary region"
  value       = aws_kms_key.financial_app_primary.id
}

output "kms_key_secondary_id" {
  description = "ID of the KMS key in secondary region"
  value       = aws_kms_key.financial_app_secondary.id
}

output "kms_key_primary_arn" {
  description = "ARN of the KMS key in primary region"
  value       = aws_kms_key.financial_app_primary.arn
}

output "kms_key_secondary_arn" {
  description = "ARN of the KMS key in secondary region"
  value       = aws_kms_key.financial_app_secondary.arn
}

# IAM Role Outputs
output "financial_app_role_arn" {
  description = "ARN of the financial app IAM role"
  value       = aws_iam_role.financial_app_role.arn
}

output "financial_app_instance_profile_name" {
  description = "Name of the financial app instance profile"
  value       = aws_iam_instance_profile.financial_app_profile.name
}

# Security Group Outputs
output "security_group_primary_id" {
  description = "ID of the security group in primary region"
  value       = aws_security_group.financial_app_primary.id
}

output "security_group_secondary_id" {
  description = "ID of the security group in secondary region"
  value       = aws_security_group.financial_app_secondary.id
}

# CloudWatch Log Group Outputs
output "log_group_primary_name" {
  description = "Name of the CloudWatch log group in primary region"
  value       = aws_cloudwatch_log_group.financial_app_primary.name
}

output "log_group_secondary_name" {
  description = "Name of the CloudWatch log group in secondary region"
  value       = aws_cloudwatch_log_group.financial_app_secondary.name
}

# SNS Topic Outputs
output "sns_topic_primary_arn" {
  description = "ARN of the SNS topic in primary region"
  value       = aws_sns_topic.alerts_primary.arn
}

output "sns_topic_secondary_arn" {
  description = "ARN of the SNS topic in secondary region"
  value       = aws_sns_topic.alerts_secondary.arn
}

# Region Information
output "primary_region" {
  description = "Primary AWS region"
  value       = var.primary_region
}

output "secondary_region" {
  description = "Secondary AWS region"
  value       = var.secondary_region
}
