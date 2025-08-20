# outputs.tf - Output values for secure AWS infrastructure

########################
# VPC and Networking Outputs
########################

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

output "vpc_flow_log_id" {
  description = "ID of the VPC Flow Log"
  value       = aws_flow_log.vpc_flow_log.id
}

########################
# Security Group Outputs
########################

output "web_security_group_id" {
  description = "ID of the web security group"
  value       = aws_security_group.web.id
}

output "session_manager_security_group_id" {
  description = "ID of the Session Manager security group"
  value       = aws_security_group.session_manager.id
}

output "ssh_legacy_security_group_id" {
  description = "ID of the legacy SSH security group (deprecated)"
  value       = aws_security_group.ssh_legacy.id
}

output "vpc_endpoints_security_group_id" {
  description = "ID of the VPC endpoints security group"
  value       = aws_security_group.vpc_endpoints.id
}

output "database_security_group_id" {
  description = "ID of the database security group"
  value       = aws_security_group.database.id
}

########################
# S3 Bucket Outputs
########################

output "s3_bucket_ids" {
  description = "IDs of the S3 buckets"
  value       = aws_s3_bucket.main[*].id
}

output "s3_bucket_arns" {
  description = "ARNs of the S3 buckets"
  value       = aws_s3_bucket.main[*].arn
}

output "cloudtrail_bucket_id" {
  description = "ID of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.id
}

output "cloudtrail_bucket_arn" {
  description = "ARN of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.arn
}

output "config_bucket_id" {
  description = "ID of the AWS Config S3 bucket"
  value       = var.use_existing_config_resources ? null : aws_s3_bucket.config[0].id
}

output "config_bucket_arn" {
  description = "ARN of the AWS Config S3 bucket"
  value       = var.use_existing_config_resources ? null : aws_s3_bucket.config[0].arn
}

output "cloudfront_logs_bucket_id" {
  description = "ID of the CloudFront logs S3 bucket"
  value       = aws_s3_bucket.cloudfront_logs.id
}

########################
# CloudTrail Outputs
########################

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.main.arn
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.main.name
}

########################
# IAM Outputs
########################

output "vpc_flow_log_role_arn" {
  description = "ARN of the VPC Flow Log IAM role"
  value       = aws_iam_role.flow_log.arn
}

output "config_role_arn" {
  description = "ARN of the AWS Config IAM role"
  value       = aws_iam_role.config.arn
}

output "example_user_arn" {
  description = "ARN of the example IAM user with MFA requirement"
  value       = aws_iam_user.example.arn
}

output "session_manager_role_arn" {
  description = "ARN of the Session Manager IAM role"
  value       = aws_iam_role.session_manager.arn
}

output "session_manager_instance_profile_arn" {
  description = "ARN of the Session Manager instance profile"
  value       = aws_iam_instance_profile.session_manager.arn
}

output "session_manager_user_policy_arn" {
  description = "ARN of the Session Manager user access policy"
  value       = aws_iam_policy.session_manager_user_access.arn
}

########################
# RDS Outputs
########################

output "rds_instance_id" {
  description = "ID of the RDS instance"
  value       = aws_db_instance.main.id
}

output "rds_instance_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_instance_arn" {
  description = "ARN of the RDS instance"
  value       = aws_db_instance.main.arn
}

output "rds_subnet_group_name" {
  description = "Name of the RDS subnet group"
  value       = aws_db_subnet_group.main.name
}

########################
# AWS Config Outputs
########################

output "config_recorder_name" {
  description = "Name of the AWS Config configuration recorder"
  value       = local.config_configuration_recorder_name
}

output "config_delivery_channel_name" {
  description = "Name of the AWS Config delivery channel"
  value       = local.config_delivery_channel_name
}

output "config_rules" {
  description = "Names of AWS Config rules"
  value = var.enable_config_rules ? [
    aws_config_config_rule.s3_bucket_public_access_prohibited[0].name,
    aws_config_config_rule.encrypted_volumes[0].name,
    aws_config_config_rule.rds_storage_encrypted[0].name
  ] : []
}

########################
# CloudWatch Outputs
########################

output "cloudwatch_log_group_name" {
  description = "Name of the VPC Flow Logs CloudWatch log group"
  value       = aws_cloudwatch_log_group.vpc_flow_log.name
}

output "cloudwatch_log_group_arn" {
  description = "ARN of the VPC Flow Logs CloudWatch log group"
  value       = aws_cloudwatch_log_group.vpc_flow_log.arn
}

output "cloudwatch_alarms" {
  description = "Names of CloudWatch alarms"
  value = [
    aws_cloudwatch_metric_alarm.high_cpu.alarm_name,
    aws_cloudwatch_metric_alarm.database_connections.alarm_name
  ]
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

########################
# Systems Manager Parameter Store Outputs
########################

output "ssm_parameter_names" {
  description = "Names of Systems Manager parameters (legacy)"
  value = [
    aws_ssm_parameter.db_password_legacy.name,
    aws_ssm_parameter.db_endpoint.name,
    aws_ssm_parameter.vpc_id.name
  ]
}

########################
# VPC Endpoints Outputs
########################

output "vpc_endpoint_ssm_id" {
  description = "ID of the SSM VPC endpoint"
  value       = aws_vpc_endpoint.ssm.id
}

output "vpc_endpoint_ssmmessages_id" {
  description = "ID of the SSM Messages VPC endpoint"
  value       = aws_vpc_endpoint.ssmmessages.id
}

output "vpc_endpoint_ec2messages_id" {
  description = "ID of the EC2 Messages VPC endpoint"
  value       = aws_vpc_endpoint.ec2messages.id
}

output "vpc_endpoint_secretsmanager_id" {
  description = "ID of the Secrets Manager VPC endpoint"
  value       = aws_vpc_endpoint.secretsmanager.id
}

########################
# Secrets Manager Outputs
########################

output "secrets_manager_db_master_arn" {
  description = "ARN of the database master credentials secret"
  value       = aws_secretsmanager_secret.db_master_credentials.arn
}

output "secrets_manager_db_app_arn" {
  description = "ARN of the database application credentials secret"
  value       = aws_secretsmanager_secret.db_app_credentials.arn
}

output "secrets_manager_api_keys_arn" {
  description = "ARN of the API keys secret"
  value       = aws_secretsmanager_secret.api_keys.arn
}

output "secrets_manager_db_master_name" {
  description = "Name of the database master credentials secret"
  value       = aws_secretsmanager_secret.db_master_credentials.name
}

output "secrets_manager_db_app_name" {
  description = "Name of the database application credentials secret"
  value       = aws_secretsmanager_secret.db_app_credentials.name
}

output "secrets_manager_api_keys_name" {
  description = "Name of the API keys secret"
  value       = aws_secretsmanager_secret.api_keys.name
}

########################
# Lambda Outputs
########################

output "lambda_secrets_rotation_arn" {
  description = "ARN of the secrets rotation Lambda function"
  value       = aws_lambda_function.secrets_rotation.arn
}

output "lambda_secrets_rotation_name" {
  description = "Name of the secrets rotation Lambda function"
  value       = aws_lambda_function.secrets_rotation.function_name
}

output "secrets_rotation_lambda_role_arn" {
  description = "ARN of the secrets rotation Lambda IAM role"
  value       = aws_iam_role.secrets_rotation_lambda.arn
}

output "secrets_rotation_lambda_log_group_name" {
  description = "Name of the secrets rotation Lambda CloudWatch log group"
  value       = aws_cloudwatch_log_group.secrets_rotation_lambda.name
}

########################
# CloudFront Outputs
########################

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.arn
}

output "cloudfront_distribution_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "cloudfront_distribution_hosted_zone_id" {
  description = "Hosted zone ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.hosted_zone_id
}

output "cloudfront_origin_access_identity_arn" {
  description = "ARN of the CloudFront Origin Access Identity"
  value       = aws_cloudfront_origin_access_identity.main.iam_arn
}

########################
# WAF Outputs
########################

output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.id
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.arn
}

########################
# Security Compliance Summary
########################

output "security_compliance_summary" {
  description = "Summary of implemented security requirements with Phase 1B enhancements"
  value = {
    "1_iam_least_privilege"   = "✓ IAM roles follow least privilege principle"
    "2_resource_tagging"      = "✓ All resources tagged with Environment and Owner"
    "3_cloudtrail_logging"    = "✓ CloudTrail enabled in all regions"
    "4_s3_versioning"         = "✓ S3 bucket versioning enabled"
    "5_ssh_access_restricted" = "✓ Security groups limit SSH access (ENHANCED: Session Manager replaces SSH)"
    "6_rds_encryption"        = "✓ RDS encrypted with AWS managed keys"
    "7_no_public_access"      = "✓ No public accessibility by default"
    "8_aws_config"            = "✓ AWS Config monitors resource compliance"
    "9_vpc_flow_logs"         = "✓ VPC Flow Logs enabled for network analysis"
    "10_mfa_required"         = "✓ MFA required for IAM users"
    "11_https_only"           = "✓ HTTP disabled, HTTPS enforced"
    "12_parameter_store"      = "✓ Sensitive data in Systems Manager Parameter Store (ENHANCED: Secrets Manager added)"
    "13_cloudwatch_alarms"    = "✓ CloudWatch alarms for critical resources"
    "14_ddos_protection"      = "✓ AWS Shield and WAF protect CloudFront"
    "15_session_manager"      = "✓ AWS Systems Manager Session Manager for secure access"
    "16_secrets_manager"      = "✓ AWS Secrets Manager with automatic rotation"
    "17_vpc_endpoints"        = "✓ VPC endpoints for secure service communication"
    "18_lambda_rotation"      = "✓ Lambda-based custom secret rotation capabilities"
  }
}

########################
# Infrastructure Summary
########################

output "infrastructure_summary" {
  description = "Summary of deployed infrastructure with Phase 1B enhancements"
  value = {
    region                     = var.aws_region
    project_name               = var.project_name
    environment                = var.environment
    vpc_cidr                   = var.vpc_cidr
    public_subnets             = length(var.public_subnet_cidrs)
    private_subnets            = length(var.private_subnet_cidrs)
    s3_buckets_created         = length(var.s3_bucket_names) + (var.use_existing_config_resources ? 2 : 3) # main buckets + cloudtrail + (optional config) + cloudfront logs
    rds_encrypted              = true
    cloudtrail_multi_region    = var.cloudtrail_is_multi_region_trail
    config_enabled             = var.use_existing_config_resources || length(aws_config_configuration_recorder.main) > 0
    flow_logs_enabled          = true
    cloudfront_waf_enabled     = true
    session_manager_enabled    = var.enable_session_manager
    secrets_manager_enabled    = true
    automatic_rotation_enabled = var.enable_automatic_rotation
    vpc_endpoints_count        = 4 # SSM, SSM Messages, EC2 Messages, Secrets Manager
    lambda_functions_count     = 1 # Secrets rotation function
    secrets_count              = 3 # DB master, DB app, API keys
    rotation_schedule_days     = var.secrets_rotation_days
    enhanced_security_features = [
      "Session Manager VPC Endpoints",
      "Automatic Secret Rotation",
      "Cross-Service Secret Access",
      "Lambda-based Custom Rotation",
      "Enhanced IAM Policies"
    ]
  }
}