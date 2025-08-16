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

# Environment and Naming Outputs
output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = local.environment_suffix
}

output "name_prefix" {
  description = "Name prefix used for all resources"
  value       = local.name_prefix
}

# Random suffix for verification
output "random_suffix" {
  description = "Random suffix for unique resource naming"
  value       = random_string.suffix.result
}

# Internet Gateway Outputs
output "igw_primary_id" {
  description = "ID of the internet gateway in primary region"
  value       = aws_internet_gateway.primary.id
}

output "igw_secondary_id" {
  description = "ID of the internet gateway in secondary region"
  value       = aws_internet_gateway.secondary.id
}

# NAT Gateway Outputs
output "nat_gateway_primary_ids" {
  description = "IDs of NAT gateways in primary region"
  value       = aws_nat_gateway.primary[*].id
}

output "nat_gateway_secondary_ids" {
  description = "IDs of NAT gateways in secondary region"
  value       = aws_nat_gateway.secondary[*].id
}

# Route Table Outputs
output "public_route_table_primary_id" {
  description = "ID of public route table in primary region"
  value       = aws_route_table.public_primary.id
}

output "private_route_table_primary_ids" {
  description = "IDs of private route tables in primary region"
  value       = aws_route_table.private_primary[*].id
}

output "public_route_table_secondary_id" {
  description = "ID of public route table in secondary region"
  value       = aws_route_table.public_secondary.id
}

output "private_route_table_secondary_ids" {
  description = "IDs of private route tables in secondary region"
  value       = aws_route_table.private_secondary[*].id
}

# CloudWatch Alarm Outputs
output "cloudwatch_alarm_primary_name" {
  description = "Name of CloudWatch alarm in primary region"
  value       = aws_cloudwatch_metric_alarm.high_cpu_primary.alarm_name
}

output "cloudwatch_alarm_secondary_name" {
  description = "Name of CloudWatch alarm in secondary region"
  value       = aws_cloudwatch_metric_alarm.high_cpu_secondary.alarm_name
}

# KMS Alias Outputs
output "kms_alias_primary_name" {
  description = "Name of KMS alias in primary region"
  value       = aws_kms_alias.financial_app_primary.name
}

output "kms_alias_secondary_name" {
  description = "Name of KMS alias in secondary region"
  value       = aws_kms_alias.financial_app_secondary.name
}

# Application Monitoring Outputs
output "app_metrics_log_group_primary" {
  description = "Application metrics log group in primary region"
  value       = aws_cloudwatch_log_group.app_metrics_primary.name
}

output "app_metrics_log_group_secondary" {
  description = "Application metrics log group in secondary region"
  value       = aws_cloudwatch_log_group.app_metrics_secondary.name
}

# Monitoring Alarm Outputs
output "app_response_time_alarm_primary" {
  description = "Application response time alarm in primary region"
  value       = aws_cloudwatch_metric_alarm.app_response_time_primary.alarm_name
}

output "app_response_time_alarm_secondary" {
  description = "Application response time alarm in secondary region"
  value       = aws_cloudwatch_metric_alarm.app_response_time_secondary.alarm_name
}

output "app_error_rate_alarm_primary" {
  description = "Application error rate alarm in primary region"
  value       = aws_cloudwatch_metric_alarm.app_error_rate_primary.alarm_name
}

output "app_error_rate_alarm_secondary" {
  description = "Application error rate alarm in secondary region"
  value       = aws_cloudwatch_metric_alarm.app_error_rate_secondary.alarm_name
}

output "transaction_volume_alarm_primary" {
  description = "Transaction volume alarm in primary region"
  value       = aws_cloudwatch_metric_alarm.transaction_volume_primary.alarm_name
}

output "transaction_volume_alarm_secondary" {
  description = "Transaction volume alarm in secondary region"
  value       = aws_cloudwatch_metric_alarm.transaction_volume_secondary.alarm_name
}

output "memory_utilization_alarm_primary" {
  description = "Memory utilization alarm in primary region"
  value       = aws_cloudwatch_metric_alarm.memory_utilization_primary.alarm_name
}

output "memory_utilization_alarm_secondary" {
  description = "Memory utilization alarm in secondary region"
  value       = aws_cloudwatch_metric_alarm.memory_utilization_secondary.alarm_name
}

output "app_health_check_alarm_primary" {
  description = "Application health check alarm in primary region"
  value       = aws_cloudwatch_metric_alarm.app_health_check_primary.alarm_name
}

output "app_health_check_alarm_secondary" {
  description = "Application health check alarm in secondary region"
  value       = aws_cloudwatch_metric_alarm.app_health_check_secondary.alarm_name
}
