# =============================================================================
# VPC and Networking Outputs
# =============================================================================

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "vpc_arn" {
  description = "VPC ARN"
  value       = aws_vpc.main.arn
}

output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = aws_internet_gateway.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "public_subnet_cidrs" {
  description = "Public subnet CIDR blocks"
  value       = aws_subnet.public[*].cidr_block
}

output "private_subnet_cidrs" {
  description = "Private subnet CIDR blocks"
  value       = aws_subnet.private[*].cidr_block
}

output "public_route_table_id" {
  description = "Public route table ID"
  value       = aws_route_table.public.id
}

# =============================================================================
# KMS Module Outputs
# =============================================================================

output "kms_key_id" {
  description = "KMS key ID"
  value       = module.kms.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN"
  value       = module.kms.key_arn
}

output "kms_alias_arn" {
  description = "KMS key alias ARN"
  value       = module.kms.alias_arn
}

# =============================================================================
# IAM Module Outputs
# =============================================================================

output "ec2_role_arn" {
  description = "EC2 IAM role ARN"
  value       = module.iam.ec2_role_arn
}

output "ec2_instance_profile_name" {
  description = "EC2 instance profile name"
  value       = module.iam.ec2_instance_profile_name
}

output "cloudtrail_role_arn" {
  description = "CloudTrail IAM role ARN"
  value       = module.iam.cloudtrail_role_arn
}

# =============================================================================
# Security Groups Module Outputs
# =============================================================================

output "web_security_group_id" {
  description = "Web security group ID"
  value       = module.security_groups.web_sg_id
}

output "app_security_group_id" {
  description = "Application security group ID"
  value       = module.security_groups.app_sg_id
}

output "db_security_group_id" {
  description = "Database security group ID"
  value       = module.security_groups.db_sg_id
}

output "mgmt_security_group_id" {
  description = "Management security group ID"
  value       = module.security_groups.mgmt_sg_id
}

# =============================================================================
# S3 Module Outputs
# =============================================================================

output "cloudtrail_bucket_name" {
  description = "CloudTrail S3 bucket name"
  value       = module.s3.cloudtrail_bucket_name
}

output "cloudtrail_bucket_arn" {
  description = "CloudTrail S3 bucket ARN"
  value       = module.s3.cloudtrail_bucket_arn
}

output "app_data_bucket_name" {
  description = "Application data S3 bucket name"
  value       = module.s3.app_data_bucket_name
}

output "app_data_bucket_arn" {
  description = "Application data S3 bucket ARN"
  value       = module.s3.app_data_bucket_arn
}

# =============================================================================
# CloudTrail Module Outputs
# =============================================================================

output "cloudtrail_name" {
  description = "CloudTrail name"
  value       = module.cloudtrail.cloudtrail_name
}

output "cloudtrail_arn" {
  description = "CloudTrail ARN"
  value       = module.cloudtrail.cloudtrail_arn
}

output "cloudtrail_home_region" {
  description = "CloudTrail home region"
  value       = module.cloudtrail.cloudtrail_home_region
}

output "cloudwatch_log_group_name" {
  description = "CloudWatch Log Group name for CloudTrail"
  value       = module.cloudtrail.cloudwatch_log_group_name
}

output "cloudwatch_log_group_arn" {
  description = "CloudWatch Log Group ARN for CloudTrail"
  value       = module.cloudtrail.cloudwatch_log_group_arn
}

output "cloudtrail_logs_role_arn" {
  description = "IAM role ARN for CloudTrail to write to CloudWatch Logs"
  value       = module.cloudtrail.cloudtrail_logs_role_arn
}

# =============================================================================
# Account and Region Information
# =============================================================================

output "account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "region" {
  description = "AWS Region"
  value       = data.aws_region.current.name
}

output "caller_arn" {
  description = "ARN of the caller"
  value       = data.aws_caller_identity.current.arn
}

# =============================================================================
# Summary Outputs
# =============================================================================

output "infrastructure_summary" {
  description = "Summary of all infrastructure components"
  value = {
    vpc = {
      id   = aws_vpc.main.id
      cidr = aws_vpc.main.cidr_block
    }
    subnets = {
      public_count  = length(aws_subnet.public)
      private_count = length(aws_subnet.private)
    }
    security_groups = {
      web  = module.security_groups.web_sg_id
      app  = module.security_groups.app_sg_id
      db   = module.security_groups.db_sg_id
      mgmt = module.security_groups.mgmt_sg_id
    }
    storage = {
      cloudtrail_bucket = module.s3.cloudtrail_bucket_name
      app_data_bucket   = module.s3.app_data_bucket_name
    }
    monitoring = {
      cloudtrail_name = module.cloudtrail.cloudtrail_name
      log_group_name  = module.cloudtrail.cloudwatch_log_group_name
    }
    encryption = {
      kms_key_arn = module.kms.key_arn
    }
  }
}
