# outputs.tf

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "rds_endpoint" {
  description = "Endpoint of the RDS PostgreSQL instance"
  value       = aws_db_instance.payment_db.endpoint
  sensitive   = true
}

output "rds_database_name" {
  description = "Name of the RDS database"
  value       = aws_db_instance.payment_db.db_name
}

output "kms_key_rds_arn" {
  description = "ARN of the KMS key for RDS encryption"
  value       = aws_kms_key.rds.arn
}

output "kms_key_s3_arn" {
  description = "ARN of the KMS key for S3 encryption"
  value       = aws_kms_key.s3.arn
}

output "kms_key_logs_arn" {
  description = "ARN of the KMS key for CloudWatch Logs encryption"
  value       = aws_kms_key.logs.arn
}

output "app_logs_bucket" {
  description = "Name of the S3 bucket for application logs"
  value       = aws_s3_bucket.app_logs.id
}

output "audit_trails_bucket" {
  description = "Name of the S3 bucket for audit trails"
  value       = aws_s3_bucket.audit_trails.id
}

output "flow_logs_bucket" {
  description = "Name of the S3 bucket for VPC flow logs"
  value       = aws_s3_bucket.flow_logs.id
}

output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = data.aws_guardduty_detector.main.id
}

output "security_alerts_topic_arn" {
  description = "ARN of the SNS topic for security alerts"
  value       = aws_sns_topic.security_alerts.arn
}

output "ec2_instance_ids" {
  description = "IDs of the EC2 payment processing instances"
  value       = aws_instance.payment_processing[*].id
}

output "security_group_app_tier_id" {
  description = "ID of the application tier security group"
  value       = aws_security_group.app_tier.id
}

output "security_group_database_tier_id" {
  description = "ID of the database tier security group"
  value       = aws_security_group.database_tier.id
}

output "vpc_endpoint_s3_id" {
  description = "ID of the S3 VPC endpoint"
  value       = aws_vpc_endpoint.s3.id
}

output "vpc_endpoint_ec2_id" {
  description = "ID of the EC2 VPC endpoint"
  value       = aws_vpc_endpoint.ec2.id
}

output "vpc_endpoint_rds_id" {
  description = "ID of the RDS VPC endpoint"
  value       = aws_vpc_endpoint.rds.id
}

output "db_password_secret_arn" {
  description = "ARN of the Secrets Manager secret for DB password"
  value       = aws_secretsmanager_secret.db_password.arn
  sensitive   = true
}

output "config_recorder_id" {
  description = "ID of the AWS Config recorder"
  value       = aws_config_configuration_recorder.main.id
}

# VPC
output "vpc_name" {
  description = "Name tag of the VPC"
  value       = aws_vpc.main.tags.Name
}

# Subnets
output "private_subnet_names" {
  description = "Names of the private subnets"
  value       = aws_subnet.private[*].tags.Name
}

output "private_subnet_arns" {
  description = "ARNs of the private subnets"
  value       = aws_subnet.private[*].arn
}

# S3 Buckets
output "app_logs_bucket_arn" {
  description = "ARN for app logs S3 bucket"
  value       = aws_s3_bucket.app_logs.arn
}
output "audit_trails_bucket_arn" {
  description = "ARN for audit trails S3 bucket"
  value       = aws_s3_bucket.audit_trails.arn
}
output "flow_logs_bucket_arn" {
  description = "ARN for VPC flow logs S3 bucket"
  value       = aws_s3_bucket.flow_logs.arn
}
output "config_bucket_arn" {
  description = "ARN for AWS Config S3 bucket"
  value       = aws_s3_bucket.config.arn
}

# EC2 Instances
output "ec2_instance_private_ips" {
  description = "Private IPs of payment processing EC2 instances"
  value       = aws_instance.payment_processing[*].private_ip
}
output "ec2_instance_arns" {
  description = "ARNs of payment processing EC2 instances"
  value       = aws_instance.payment_processing[*].arn
}

# Launch Template
output "ec2_launch_template_id" {
  description = "ID of the payment processing EC2 launch template"
  value       = aws_launch_template.payment_processing.id
}
output "ec2_launch_template_arn" {
  description = "ARN of the payment processing EC2 launch template"
  value       = aws_launch_template.payment_processing.arn
}

# Security Groups
output "security_group_app_tier_arn" {
  description = "ARN of the app tier security group"
  value       = aws_security_group.app_tier.arn
}
output "security_group_database_tier_arn" {
  description = "ARN of the database tier security group"
  value       = aws_security_group.database_tier.arn
}
output "security_group_vpc_endpoints_id" {
  description = "ID of the VPC endpoints security group"
  value       = aws_security_group.vpc_endpoints.id
}
output "security_group_vpc_endpoints_arn" {
  description = "ARN of the VPC endpoints security group"
  value       = aws_security_group.vpc_endpoints.arn
}

# Security Group Rules
output "sg_rule_app_to_db_id" {
  description = "ID of the app to db SG rule"
  value       = aws_security_group_rule.app_to_db.id
}
output "sg_rule_db_from_app_id" {
  description = "ID of the db from app SG rule"
  value       = aws_security_group_rule.db_from_app.id
}

# Network ACLs
output "network_acl_private_id" {
  description = "ID of the network ACL for private subnets"
  value       = aws_network_acl.private.id
}

# KMS Keys
output "kms_key_rds_id" {
  description = "Key ID for RDS KMS key"
  value       = aws_kms_key.rds.key_id
}
output "kms_key_s3_id" {
  description = "Key ID for S3 KMS key"
  value       = aws_kms_key.s3.key_id
}
output "kms_key_logs_id" {
  description = "Key ID for Logs KMS key"
  value       = aws_kms_key.logs.key_id
}

# KMS Aliases
output "kms_alias_rds_name" {
  description = "Alias for RDS KMS key"
  value       = aws_kms_alias.rds.name
}
output "kms_alias_s3_name" {
  description = "Alias for S3 KMS key"
  value       = aws_kms_alias.s3.name
}
output "kms_alias_logs_name" {
  description = "Alias for Logs KMS key"
  value       = aws_kms_alias.logs.name
}

# IAM Roles and Policies
output "iam_role_ec2_payment_processing_id" {
  description = "ID of EC2 payment processing IAM role"
  value       = aws_iam_role.ec2_payment_processing.id
}
output "iam_role_ec2_payment_processing_arn" {
  description = "ARN of EC2 payment processing IAM role"
  value       = aws_iam_role.ec2_payment_processing.arn
}
output "iam_instance_profile_ec2_payment_processing_id" {
  description = "ID of EC2 payment processing instance profile"
  value       = aws_iam_instance_profile.ec2_payment_processing.id
}
output "iam_role_config_id" {
  description = "ID of AWS Config IAM role"
  value       = aws_iam_role.config.id
}
output "iam_role_config_arn" {
  description = "ARN of AWS Config IAM role"
  value       = aws_iam_role.config.arn
}
output "iam_role_flow_logs_id" {
  description = "ID of VPC flow logs IAM role"
  value       = aws_iam_role.flow_logs.id
}
output "iam_role_flow_logs_arn" {
  description = "ARN of VPC flow logs IAM role"
  value       = aws_iam_role.flow_logs.arn
}

# Database
output "db_subnet_group_name" {
  description = "Name of DB subnet group"
  value       = aws_db_subnet_group.main.name
}
output "db_subnet_group_id" {
  description = "ID of DB subnet group"
  value       = aws_db_subnet_group.main.id
}
output "db_parameter_group_name" {
  description = "Name of DB parameter group"
  value       = aws_db_parameter_group.postgres_ssl.name
}
output "db_parameter_group_id" {
  description = "ID of DB parameter group"
  value       = aws_db_parameter_group.postgres_ssl.id
}
output "db_instance_arn" {
  description = "ARN of payment processing RDS DB instance"
  value       = aws_db_instance.payment_db.arn
}
output "db_instance_id" {
  description = "ID of payment processing RDS DB instance"
  value       = aws_db_instance.payment_db.id
}
output "db_instance_status" {
  description = "Status of payment processing RDS DB instance"
  value       = aws_db_instance.payment_db.status
}
output "db_instance_address" {
  description = "Address of payment processing RDS DB instance"
  value       = aws_db_instance.payment_db.address
}

# Secrets Manager
output "secret_db_password_name" {
  description = "Name of DB password secret"
  value       = aws_secretsmanager_secret.db_password.name
}
output "secret_db_password_id" {
  description = "ID of DB password secret"
  value       = aws_secretsmanager_secret.db_password.id
}
output "secret_db_password_version_id" {
  description = "ID of DB password secret version"
  value       = aws_secretsmanager_secret_version.db_password.version_id
}

# GuardDuty
output "guardduty_detector_arn" {
  description = "ARN of the GuardDuty detector"
  value       = data.aws_guardduty_detector.main.arn
}

output "guardduty_feature_s3_status" {
  description = "Status of GuardDuty S3 Protection Feature"
  value       = aws_guardduty_detector_feature.s3_protection.status
}

# SNS
output "security_alerts_topic_id" {
  description = "ID of the SNS Security Alerts Topic"
  value       = aws_sns_topic.security_alerts.id
}
output "security_alerts_topic_policy" {
  description = "Policy attached to SNS security alerts topic"
  value       = aws_sns_topic_policy.security_alerts.policy
}

# EventBridge
output "cloudwatch_event_rule_guardduty_findings_id" {
  description = "ID of GuardDuty findings EventBridge rule"
  value       = aws_cloudwatch_event_rule.guardduty_findings.id
}
output "cloudwatch_event_target_guardduty_sns_id" {
  description = "ID of GuardDuty SNS EventBridge target"
  value       = aws_cloudwatch_event_target.guardduty_sns.id
}

# CloudWatch Log Group
output "cloudwatch_log_group_security_events_name" {
  description = "Name of the security events log group"
  value       = aws_cloudwatch_log_group.security_events.name
}
output "cloudwatch_log_group_security_events_arn" {
  description = "ARN of the security events log group"
  value       = aws_cloudwatch_log_group.security_events.arn
}

# CloudWatch Alarms
output "cloudwatch_metric_alarm_root_login_id" {
  description = "ID of root account login alarm"
  value       = aws_cloudwatch_metric_alarm.root_login.id
}
output "cloudwatch_metric_alarm_failed_auth_id" {
  description = "ID of failed auth alarm"
  value       = aws_cloudwatch_metric_alarm.failed_auth.id
}
output "cloudwatch_metric_alarm_unauthorized_api_id" {
  description = "ID of unauthorized API calls alarm"
  value       = aws_cloudwatch_metric_alarm.unauthorized_api.id
}

# VPC Endpoints
output "vpc_endpoint_s3_arn" {
  description = "ARN of the S3 VPC endpoint"
  value       = aws_vpc_endpoint.s3.arn
}
output "vpc_endpoint_ec2_arn" {
  description = "ARN of the EC2 VPC endpoint"
  value       = aws_vpc_endpoint.ec2.arn
}
output "vpc_endpoint_rds_arn" {
  description = "ARN of the RDS VPC endpoint"
  value       = aws_vpc_endpoint.rds.arn
}

# Route Table
output "route_table_private_id" {
  description = "ID of the private route table"
  value       = aws_route_table.private.id
}

# Route Table Association
output "route_table_association_private_ids" {
  description = "IDs of the private route table associations"
  value       = aws_route_table_association.private[*].id
}

# Flow Logs
output "flow_log_main_id" {
  description = "ID of the VPC flow log resource"
  value       = aws_flow_log.main.id
}

# IAM Policies
output "iam_role_policy_ec2_session_policy_id" {
  description = "ID of the EC2 session IAM policy"
  value       = aws_iam_role_policy.ec2_session_policy.id
}
output "iam_role_policy_config_s3_id" {
  description = "ID of the AWS Config S3 policy"
  value       = aws_iam_role_policy.config_s3.id
}
output "iam_role_policy_flow_logs_id" {
  description = "ID of the VPC flow logs IAM role policy"
  value       = aws_iam_role_policy.flow_logs.id
}

