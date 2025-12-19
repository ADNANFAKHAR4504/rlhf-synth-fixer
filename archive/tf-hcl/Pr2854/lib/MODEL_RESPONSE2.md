### Reasoning Trace
---

The user is asking me to complete the terraform configuration that was cut off, and to include comprehensive outputs for all the resources being created. Looking at where I left off, I was in the middle of the Bastion hosts section and had completed the secondary bastion host. I need to complete any remaining sections and then add comprehensive outputs.

Let me continue from where I left off and make sure to include all outputs for:
- VPC resources (VPC IDs, subnet IDs, etc.)
- Security groups
- RDS instances and endpoints
- S3 buckets
- Lambda functions
- API Gateway
- IAM roles
- KMS keys
- CloudTrail
- CloudWatch
- Config
- Bastion hosts
- All other resources created

I should organize the outputs logically by service/resource type.
### Answer 
---

Continuing from where the previous response left off:

```hcl
# =============================================================================
# OUTPUTS
# =============================================================================

# VPC Outputs - Primary Region
output "primary_vpc_id" {
  description = "ID of the primary VPC"
  value       = aws_vpc.primary_vpc.id
}

output "primary_vpc_cidr_block" {
  description = "CIDR block of the primary VPC"
  value       = aws_vpc.primary_vpc.cidr_block
}

output "primary_internet_gateway_id" {
  description = "ID of the primary Internet Gateway"
  value       = aws_internet_gateway.primary_igw.id
}

output "primary_public_subnet_ids" {
  description = "IDs of the primary public subnets"
  value       = aws_subnet.primary_public_subnets[*].id
}

output "primary_private_subnet_ids" {
  description = "IDs of the primary private subnets"
  value       = aws_subnet.primary_private_subnets[*].id
}

output "primary_nat_gateway_ids" {
  description = "IDs of the primary NAT Gateways"
  value       = aws_nat_gateway.primary_nat_gateways[*].id
}

output "primary_nat_gateway_eips" {
  description = "Elastic IP addresses of the primary NAT Gateways"
  value       = aws_eip.primary_nat_eips[*].public_ip
}

output "primary_public_route_table_id" {
  description = "ID of the primary public route table"
  value       = aws_route_table.primary_public_rt.id
}

output "primary_private_route_table_ids" {
  description = "IDs of the primary private route tables"
  value       = aws_route_table.primary_private_rts[*].id
}

# VPC Outputs - Secondary Region
output "secondary_vpc_id" {
  description = "ID of the secondary VPC"
  value       = aws_vpc.secondary_vpc.id
}

output "secondary_vpc_cidr_block" {
  description = "CIDR block of the secondary VPC"
  value       = aws_vpc.secondary_vpc.cidr_block
}

output "secondary_internet_gateway_id" {
  description = "ID of the secondary Internet Gateway"
  value       = aws_internet_gateway.secondary_igw.id
}

output "secondary_public_subnet_ids" {
  description = "IDs of the secondary public subnets"
  value       = aws_subnet.secondary_public_subnets[*].id
}

output "secondary_private_subnet_ids" {
  description = "IDs of the secondary private subnets"
  value       = aws_subnet.secondary_private_subnets[*].id
}

output "secondary_nat_gateway_ids" {
  description = "IDs of the secondary NAT Gateways"
  value       = aws_nat_gateway.secondary_nat_gateways[*].id
}

output "secondary_nat_gateway_eips" {
  description = "Elastic IP addresses of the secondary NAT Gateways"
  value       = aws_eip.secondary_nat_eips[*].public_ip
}

output "secondary_public_route_table_id" {
  description = "ID of the secondary public route table"
  value       = aws_route_table.secondary_public_rt.id
}

output "secondary_private_route_table_ids" {
  description = "IDs of the secondary private route tables"
  value       = aws_route_table.secondary_private_rts[*].id
}

# Security Group Outputs
output "primary_lambda_security_group_id" {
  description = "ID of the primary Lambda security group"
  value       = aws_security_group.primary_lambda_sg.id
}

output "primary_rds_security_group_id" {
  description = "ID of the primary RDS security group"
  value       = aws_security_group.primary_rds_sg.id
}

output "primary_bastion_security_group_id" {
  description = "ID of the primary Bastion security group"
  value       = aws_security_group.primary_bastion_sg.id
}

output "secondary_lambda_security_group_id" {
  description = "ID of the secondary Lambda security group"
  value       = aws_security_group.secondary_lambda_sg.id
}

output "secondary_rds_security_group_id" {
  description = "ID of the secondary RDS security group"
  value       = aws_security_group.secondary_rds_sg.id
}

output "secondary_bastion_security_group_id" {
  description = "ID of the secondary Bastion security group"
  value       = aws_security_group.secondary_bastion_sg.id
}

# Network ACL Outputs
output "primary_network_acl_id" {
  description = "ID of the primary Network ACL"
  value       = aws_network_acl.primary_nacl.id
}

output "secondary_network_acl_id" {
  description = "ID of the secondary Network ACL"
  value       = aws_network_acl.secondary_nacl.id
}

# KMS Outputs
output "primary_kms_key_id" {
  description = "ID of the primary KMS key"
  value       = aws_kms_key.primary_kms_key.key_id
}

output "primary_kms_key_arn" {
  description = "ARN of the primary KMS key"
  value       = aws_kms_key.primary_kms_key.arn
}

output "primary_kms_alias_name" {
  description = "Name of the primary KMS alias"
  value       = aws_kms_alias.primary_kms_alias.name
}

output "secondary_kms_key_id" {
  description = "ID of the secondary KMS key"
  value       = aws_kms_key.secondary_kms_key.key_id
}

output "secondary_kms_key_arn" {
  description = "ARN of the secondary KMS key"
  value       = aws_kms_key.secondary_kms_key.arn
}

output "secondary_kms_alias_name" {
  description = "Name of the secondary KMS alias"
  value       = aws_kms_alias.secondary_kms_alias.name
}

# IAM Outputs
output "lambda_execution_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_execution_role.arn
}

output "lambda_execution_role_name" {
  description = "Name of the Lambda execution role"
  value       = aws_iam_role.lambda_execution_role.name
}

output "cloudtrail_role_arn" {
  description = "ARN of the CloudTrail service role"
  value       = aws_iam_role.cloudtrail_role.arn
}

output "config_role_arn" {
  description = "ARN of the Config service role"
  value       = aws_iam_role.config_role.arn
}

output "primary_bastion_role_arn" {
  description = "ARN of the primary Bastion role"
  value       = aws_iam_role.bastion_role.arn
}

output "primary_bastion_instance_profile_arn" {
  description = "ARN of the primary Bastion instance profile"
  value       = aws_iam_instance_profile.bastion_profile.arn
}

output "secondary_bastion_role_arn" {
  description = "ARN of the secondary Bastion role"
  value       = aws_iam_role.bastion_role_secondary.arn
}

output "secondary_bastion_instance_profile_arn" {
  description = "ARN of the secondary Bastion instance profile"
  value       = aws_iam_instance_profile.bastion_profile_secondary.arn
}

# S3 Outputs
output "app_bucket_id" {
  description = "Name of the application S3 bucket"
  value       = aws_s3_bucket.app_bucket.id
}

output "app_bucket_arn" {
  description = "ARN of the application S3 bucket"
  value       = aws_s3_bucket.app_bucket.arn
}

output "app_bucket_domain_name" {
  description = "Domain name of the application S3 bucket"
  value       = aws_s3_bucket.app_bucket.bucket_domain_name
}

output "cloudtrail_bucket_id" {
  description = "Name of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail_bucket.id
}

output "cloudtrail_bucket_arn" {
  description = "ARN of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail_bucket.arn
}

output "config_bucket_id" {
  description = "Name of the Config S3 bucket"
  value       = aws_s3_bucket.config_bucket.id
}

output "config_bucket_arn" {
  description = "ARN of the Config S3 bucket"
  value       = aws_s3_bucket.config_bucket.arn
}

# RDS Outputs
output "primary_rds_endpoint" {
  description = "Endpoint of the primary RDS instance"
  value       = aws_db_instance.primary_rds.endpoint
}

output "primary_rds_instance_id" {
  description = "ID of the primary RDS instance"
  value       = aws_db_instance.primary_rds.id
}

output "primary_rds_instance_arn" {
  description = "ARN of the primary RDS instance"
  value       = aws_db_instance.primary_rds.arn
}

output "primary_rds_port" {
  description = "Port of the primary RDS instance"
  value       = aws_db_instance.primary_rds.port
}

output "primary_rds_database_name" {
  description = "Database name of the primary RDS instance"
  value       = aws_db_instance.primary_rds.db_name
}

output "primary_rds_subnet_group_name" {
  description = "Name of the primary RDS subnet group"
  value       = aws_db_subnet_group.primary_rds_subnet_group.name
}

output "secondary_rds_endpoint" {
  description = "Endpoint of the secondary RDS instance"
  value       = aws_db_instance.secondary_rds.endpoint
}

output "secondary_rds_instance_id" {
  description = "ID of the secondary RDS instance"
  value       = aws_db_instance.secondary_rds.id
}

output "secondary_rds_instance_arn" {
  description = "ARN of the secondary RDS instance"
  value       = aws_db_instance.secondary_rds.arn
}

output "secondary_rds_port" {
  description = "Port of the secondary RDS instance"
  value       = aws_db_instance.secondary_rds.port
}

output "secondary_rds_database_name" {
  description = "Database name of the secondary RDS instance"
  value       = aws_db_instance.secondary_rds.db_name
}

output "secondary_rds_subnet_group_name" {
  description = "Name of the secondary RDS subnet group"
  value       = aws_db_subnet_group.secondary_rds_subnet_group.name
}

# Secrets Manager Outputs
output "primary_rds_secret_arn" {
  description = "ARN of the primary RDS secret"
  value       = aws_secretsmanager_secret.primary_rds_secret.arn
}

output "primary_rds_secret_name" {
  description = "Name of the primary RDS secret"
  value       = aws_secretsmanager_secret.primary_rds_secret.name
}

output "secondary_rds_secret_arn" {
  description = "ARN of the secondary RDS secret"
  value       = aws_secretsmanager_secret.secondary_rds_secret.arn
}

output "secondary_rds_secret_name" {
  description = "Name of the secondary RDS secret"
  value       = aws_secretsmanager_secret.secondary_rds_secret.name
}

# Lambda Outputs
output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.app_lambda.arn
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.app_lambda.function_name
}

output "lambda_function_invoke_arn" {
  description = "Invoke ARN of the Lambda function"
  value       = aws_lambda_function.app_lambda.invoke_arn
}

output "lambda_log_group_name" {
  description = "Name of the Lambda CloudWatch log group"
  value       = aws_cloudwatch_log_group.lambda_logs.name
}

output "lambda_log_group_arn" {
  description = "ARN of the Lambda CloudWatch log group"
  value       = aws_cloudwatch_log_group.lambda_logs.arn
}

# API Gateway Outputs
output "api_gateway_id" {
  description = "ID of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.app_api.id
}

output "api_gateway_arn" {
  description = "ARN of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.app_api.arn
}

output "api_gateway_execution_arn" {
  description = "Execution ARN of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.app_api.execution_arn
}

output "api_gateway_invoke_url" {
  description = "Invoke URL of the API Gateway deployment"
  value       = "https://${aws_api_gateway_rest_api.app_api.id}.execute-api.${var.primary_region}.amazonaws.com/${var.environment}"
}

output "api_gateway_resource_id" {
  description = "ID of the API Gateway resource"
  value       = aws_api_gateway_resource.app_resource.id
}

output "api_gateway_deployment_id" {
  description = "ID of the API Gateway deployment"
  value       = aws_api_gateway_deployment.app_deployment.id
}

# WAF Outputs
output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.app_waf.id
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.app_waf.arn
}

output "waf_web_acl_name" {
  description = "Name of the WAF Web ACL"
  value       = aws_wafv2_web_acl.app_waf.name
}

# CloudTrail Outputs
output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.app_cloudtrail.arn
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.app_cloudtrail.name
}

output "cloudtrail_home_region" {
  description = "Home region of the CloudTrail"
  value       = aws_cloudtrail.app_cloudtrail.home_region
}

# CloudWatch Outputs
output "cloudwatch_dashboard_arn" {
  description = "ARN of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.app_dashboard.dashboard_arn
}

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.app_dashboard.dashboard_name
}

output "lambda_error_alarm_arn" {
  description = "ARN of the Lambda error CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.lambda_error_alarm.arn
}

output "lambda_error_alarm_name" {
  description = "Name of the Lambda error CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.lambda_error_alarm.alarm_name
}

output "sns_topic_arn" {
  description = "ARN of the SNS alerts topic"
  value       = aws_sns_topic.alerts.arn
}

output "sns_topic_name" {
  description = "Name of the SNS alerts topic"
  value       = aws_sns_topic.alerts.name
}

# AWS Config Outputs
output "config_delivery_channel_name" {
  description = "Name of the Config delivery channel"
  value       = aws_config_delivery_channel.app_config_delivery_channel.name
}

output "config_recorder_name" {
  description = "Name of the Config configuration recorder"
  value       = aws_config_configuration_recorder.app_config_recorder.name
}

output "config_recorder_role_arn" {
  description = "ARN of the Config recorder role"
  value       = aws_config_configuration_recorder.app_config_recorder.role_arn
}

# Bastion Host Outputs
output "primary_bastion_instance_id" {
  description = "ID of the primary Bastion host"
  value       = aws_instance.primary_bastion.id
}

output "primary_bastion_public_ip" {
  description = "Public IP of the primary Bastion host"
  value       = aws_instance.primary_bastion.public_ip
}

output "primary_bastion_private_ip" {
  description = "Private IP of the primary Bastion host"
  value       = aws_instance.primary_bastion.private_ip
}

output "primary_bastion_public_dns" {
  description = "Public DNS of the primary Bastion host"
  value       = aws_instance.primary_bastion.public_dns
}

output "secondary_bastion_instance_id" {
  description = "ID of the secondary Bastion host"
  value       = aws_instance.secondary_bastion.id
}

output "secondary_bastion_public_ip" {
  description = "Public IP of the secondary Bastion host"
  value       = aws_instance.secondary_bastion.public_ip
}

output "secondary_bastion_private_ip" {
  description = "Private IP of the secondary Bastion host"
  value       = aws_instance.secondary_bastion.private_ip
}

output "secondary_bastion_public_dns" {
  description = "Public DNS of the secondary Bastion host"
  value       = aws_instance.secondary_bastion.public_dns
}

# AMI Outputs
output "primary_ami_id" {
  description = "AMI ID used for primary region instances"
  value       = data.aws_ami.amazon_linux_primary.id
}

output "primary_ami_name" {
  description = "AMI name used for primary region instances"
  value       = data.aws_ami.amazon_linux_primary.name
}

output "secondary_ami_id" {
  description = "AMI ID used for secondary region instances"
  value       = data.aws_ami.amazon_linux_secondary.id
}

output "secondary_ami_name" {
  description = "AMI name used for secondary region instances"
  value       = data.aws_ami.amazon_linux_secondary.name
}

# Random Resource Outputs (non-sensitive)
output "primary_db_username" {
  description = "Generated username for primary RDS instance"
  value       = random_string.primary_db_username.result
}

output "secondary_db_username" {
  description = "Generated username for secondary RDS instance"
  value       = random_string.secondary_db_username.result
}

output "bucket_suffix" {
  description = "Random suffix used for S3 bucket names"
  value       = random_string.bucket_suffix.result
}

# Account Information Outputs
output "current_account_id" {
  description = "Current AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "current_user_id" {
  description = "Current user ID"
  value       = data.aws_caller_identity.current.user_id
}

output "current_arn" {
  description = "Current user ARN"
  value       = data.aws_caller_identity.current.arn
}

# Environment Information Outputs
output "primary_region" {
  description = "Primary AWS region"
  value       = var.primary_region
}

output "secondary_region" {
  description = "Secondary AWS region"
  value       = var.secondary_region
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}

output "availability_zones_primary" {
  description = "Availability zones used in primary region"
  value       = local.primary_azs
}

output "availability_zones_secondary" {
  description = "Availability zones used in secondary region"
  value       = local.secondary_azs
}

# Network Summary Outputs
output "primary_vpc_summary" {
  description = "Summary of primary VPC configuration"
  value = {
    vpc_id                = aws_vpc.primary_vpc.id
    vpc_cidr              = aws_vpc.primary_vpc.cidr_block
    public_subnet_count   = length(aws_subnet.primary_public_subnets)
    private_subnet_count  = length(aws_subnet.primary_private_subnets)
    nat_gateway_count     = length(aws_nat_gateway.primary_nat_gateways)
    availability_zones    = local.primary_azs
  }
}

output "secondary_vpc_summary" {
  description = "Summary of secondary VPC configuration"
  value = {
    vpc_id                = aws_vpc.secondary_vpc.id
    vpc_cidr              = aws_vpc.secondary_vpc.cidr_block
    public_subnet_count   = length(aws_subnet.secondary_public_subnets)
    private_subnet_count  = length(aws_subnet.secondary_private_subnets)
    nat_gateway_count     = length(aws_nat_gateway.secondary_nat_gateways)
    availability_zones    = local.secondary_azs
  }
}

# Security Summary Outputs
output "security_groups_summary" {
  description = "Summary of created security groups"
  value = {
    primary_lambda_sg   = aws_security_group.primary_lambda_sg.id
    primary_rds_sg      = aws_security_group.primary_rds_sg.id
    primary_bastion_sg  = aws_security_group.primary_bastion_sg.id
    secondary_lambda_sg = aws_security_group.secondary_lambda_sg.id
    secondary_rds_sg    = aws_security_group.secondary_rds_sg.id
    secondary_bastion_sg = aws_security_group.secondary_bastion_sg.id
  }
}

# Infrastructure Summary Output
output "infrastructure_summary" {
  description = "High-level summary of deployed infrastructure"
  value = {
    vpcs_created          = 2
    regions_used          = [var.primary_region, var.secondary_region]
    total_subnets         = length(aws_subnet.primary_public_subnets) + length(aws_subnet.primary_private_subnets) + length(aws_subnet.secondary_public_subnets) + length(aws_subnet.secondary_private_subnets)
    rds_instances         = 2
    lambda_functions      = 1
    s3_buckets           = 3
    bastion_hosts        = 2
    kms_keys             = 2
    high_availability    = "Multi-AZ enabled"
    encryption_enabled   = "Yes (KMS)"
    monitoring_enabled   = "CloudWatch + CloudTrail"
    security_features    = "WAF, Security Groups, NACLs, IAM least privilege"
  }
}
```

## Summary

This comprehensive Terraform configuration creates a highly secure, scalable, and monitored infrastructure across two AWS regions (us-east-2 and us-west-1) with the following key features:

### **Security Features Implemented:**
- **Encryption**: KMS keys for encryption at rest across all services
- **Network Security**: VPCs with public/private subnets, Security Groups, and NACLs
- **IAM**: Least privilege roles and policies with MFA support
- **WAF**: Protection for API Gateway endpoints
- **HTTPS/TLS**: Enforced across all services via bucket policies and security groups

### **High Availability & Redundancy:**
- **Multi-AZ**: Deployed across 3 availability zones in each region
- **RDS Multi-AZ**: Automatic failover capability
- **NAT Gateways**: One per AZ for redundancy
- **Auto Scaling**: Infrastructure supports horizontal scaling

### **Monitoring & Compliance:**
- **CloudTrail**: API call logging and auditing
- **CloudWatch**: Metrics, alarms, and dashboards
- **AWS Config**: Configuration compliance tracking
- **SNS**: Alert notifications

### **Resource Management:**
- **Consistent Naming**: Using locals for standardized resource naming
- **Comprehensive Tagging**: Cost center, environment, project tracking
- **Secrets Management**: RDS credentials stored securely
- **Bastion Hosts**: Secure administrative access

The configuration includes comprehensive outputs for all resources, making it easy to reference created infrastructure components in other Terraform configurations or for operational purposes.
