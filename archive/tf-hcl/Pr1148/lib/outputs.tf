# outputs.tf
# Output values for important resource identifiers

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

output "availability_zones" {
  description = "Availability zones used"
  value       = var.availability_zones
}

# Security outputs
output "security_group_ids" {
  description = "IDs of the security groups"
  value       = [aws_security_group.web.id, aws_security_group.database.id]
}

output "network_acl_ids" {
  description = "IDs of the network ACLs"
  value       = [aws_network_acl.public.id, aws_network_acl.private.id]
}

output "iam_role_names" {
  description = "Names of the IAM roles"
  value       = [aws_iam_role.ec2_role.name, aws_iam_role.flow_log_role.name, aws_iam_role.backup_role.name]
}

output "iam_instance_profile_name" {
  description = "Name of the IAM instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

# Logging outputs
output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.main.name
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.main.arn
}

output "s3_bucket_names" {
  description = "Names of the S3 buckets"
  value       = [aws_s3_bucket.cloudtrail_logs.id, aws_s3_bucket.access_logs.id]
}

output "vpc_flow_log_group_name" {
  description = "Name of the VPC Flow Logs CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.vpc_flow_logs.name
}

output "vpc_flow_log_id" {
  description = "ID of the VPC Flow Log"
  value       = aws_flow_log.vpc_flow_logs.id
}

# Secrets outputs
output "secret_arn" {
  description = "ARN of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.app_secret.arn
}

output "kms_key_id" {
  description = "ID of the KMS key for secrets encryption"
  value       = aws_kms_key.secrets_key.key_id
}

# Route table outputs for integration tests
output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "IDs of the private route tables"
  value       = aws_route_table.private[*].id
}

# Random suffix for testing
output "resource_suffix" {
  description = "Random suffix used for resource naming"
  value       = local.name_suffix
}

# Monitoring outputs
output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "cloudwatch_dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.infrastructure.dashboard_name
}

output "cloudwatch_alarm_names" {
  description = "Names of the CloudWatch alarms"
  value = [
    aws_cloudwatch_metric_alarm.flow_log_errors.alarm_name,
    aws_cloudwatch_metric_alarm.cloudtrail_errors.alarm_name,
    aws_cloudwatch_metric_alarm.s3_access_anomalies.alarm_name,
    aws_cloudwatch_metric_alarm.kms_key_usage.alarm_name
  ]
}

# Backup outputs
output "backup_vault_name" {
  description = "Name of the AWS Backup vault"
  value       = aws_backup_vault.main.name
}

output "backup_plan_id" {
  description = "ID of the backup plan"
  value       = aws_backup_plan.main.id
}

output "backup_kms_key_id" {
  description = "ID of the KMS key for backup encryption"
  value       = aws_kms_key.backup.key_id
}
