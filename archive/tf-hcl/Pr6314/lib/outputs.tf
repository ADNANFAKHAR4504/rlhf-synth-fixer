# outputs.tf

# KMS Key outputs
output "kms_key_arn" {
  description = "ARN of the customer-managed KMS key"
  value       = aws_kms_key.main.arn
}

output "kms_key_id" {
  description = "ID of the customer-managed KMS key"
  value       = aws_kms_key.main.id
}

output "kms_alias_name" {
  description = "Alias name of the KMS key"
  value       = aws_kms_alias.main.name
}

# VPC outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

# VPC Endpoint outputs
output "vpc_endpoint_s3_id" {
  description = "ID of the S3 VPC endpoint"
  value       = aws_vpc_endpoint.s3.id
}

output "vpc_endpoint_ec2_id" {
  description = "ID of the EC2 VPC endpoint"
  value       = aws_vpc_endpoint.ec2.id
}

output "vpc_endpoint_ssm_id" {
  description = "ID of the SSM VPC endpoint"
  value       = aws_vpc_endpoint.ssm.id
}

output "vpc_endpoint_logs_id" {
  description = "ID of the CloudWatch Logs VPC endpoint"
  value       = aws_vpc_endpoint.logs.id
}

output "vpc_endpoint_ids" {
  description = "All VPC endpoint IDs"
  value = {
    s3   = aws_vpc_endpoint.s3.id
    ec2  = aws_vpc_endpoint.ec2.id
    ssm  = aws_vpc_endpoint.ssm.id
    logs = aws_vpc_endpoint.logs.id
  }
}

# S3 Bucket outputs
output "application_data_bucket_name" {
  description = "Name of the application data S3 bucket"
  value       = aws_s3_bucket.application_data.id
}

output "application_data_bucket_arn" {
  description = "ARN of the application data S3 bucket"
  value       = aws_s3_bucket.application_data.arn
}

output "audit_logs_bucket_name" {
  description = "Name of the audit logs S3 bucket"
  value       = aws_s3_bucket.audit_logs.id
}

output "audit_logs_bucket_arn" {
  description = "ARN of the audit logs S3 bucket"
  value       = aws_s3_bucket.audit_logs.arn
}

output "config_bucket_name" {
  description = "Name of the AWS Config S3 bucket"
  value       = aws_s3_bucket.config.id
}

# IAM Role outputs
output "application_role_arn" {
  description = "ARN of the application IAM role"
  value       = aws_iam_role.application_role.arn
}

output "application_role_name" {
  description = "Name of the application IAM role"
  value       = aws_iam_role.application_role.name
}

output "config_role_arn" {
  description = "ARN of the AWS Config service role"
  value       = aws_iam_role.config.arn
}

output "permission_boundary_arn" {
  description = "ARN of the permission boundary policy"
  value       = aws_iam_policy.permission_boundary.arn
}

# Security Group outputs
output "https_security_group_id" {
  description = "ID of the HTTPS security group"
  value       = aws_security_group.https_only.id
}

output "vpc_endpoints_security_group_id" {
  description = "ID of the VPC endpoints security group"
  value       = aws_security_group.vpc_endpoints.id
}

# CloudWatch Logs outputs
output "audit_trail_log_group_name" {
  description = "Name of the audit trail CloudWatch log group"
  value       = aws_cloudwatch_log_group.audit_trail.name
}

output "audit_trail_log_group_arn" {
  description = "ARN of the audit trail CloudWatch log group"
  value       = aws_cloudwatch_log_group.audit_trail.arn
}

output "application_log_group_name" {
  description = "Name of the application CloudWatch log group"
  value       = aws_cloudwatch_log_group.application_logs.name
}

output "application_log_group_arn" {
  description = "ARN of the application CloudWatch log group"
  value       = aws_cloudwatch_log_group.application_logs.arn
}

# AWS Config outputs
output "config_recorder_name" {
  description = "Name of the AWS Config configuration recorder"
  value       = aws_config_configuration_recorder.main.name
}

output "config_delivery_channel_name" {
  description = "Name of the AWS Config delivery channel"
  value       = aws_config_delivery_channel.main.name
}

output "config_rule_arns" {
  description = "ARNs of AWS Config rules"
  value = {
    s3_encryption_rule  = aws_config_config_rule.s3_bucket_server_side_encryption_enabled.arn
    iam_password_policy = aws_config_config_rule.iam_password_policy.arn
    access_keys_rotated = aws_config_config_rule.access_keys_rotated.arn
  }
}

# Summary output
output "infrastructure_summary" {
  description = "Summary of the zero-trust security infrastructure"
  value = {
    vpc_id                   = aws_vpc.main.id
    kms_key_arn              = aws_kms_key.main.arn
    vpc_endpoint_count       = 4
    private_subnet_count     = length(aws_subnet.private)
    s3_buckets_count         = 3
    s3_bucket_policies_count = 3
    iam_roles_count          = 2
    config_rules_count       = 3
    log_groups_count         = 2
    deployment_region        = var.aws_region
    environment              = var.environment
  }
}

# Config recorder status output
output "config_recorder_status" {
  description = "AWS Config configuration recorder status"
  value       = aws_config_configuration_recorder_status.main.is_enabled
}

# Security enhancements summary
output "security_enhancements" {
  description = "Summary of security enhancements implemented"
  value = {
    config_bucket_encrypted  = true
    config_bucket_versioned  = true
    config_recorder_enabled  = aws_config_configuration_recorder_status.main.is_enabled
    s3_buckets_enforce_ssl   = true
    vpc_endpoints_restricted = true
    kms_policy_restrictive   = true
  }
}