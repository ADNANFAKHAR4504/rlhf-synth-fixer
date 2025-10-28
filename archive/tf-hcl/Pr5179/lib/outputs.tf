# Outputs for zero-trust architecture deployment

# ============================================================================
# Network Outputs
# ============================================================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "isolated_subnet_ids" {
  description = "IDs of isolated subnets"
  value       = aws_subnet.isolated[*].id
}

output "nat_gateway_ips" {
  description = "Elastic IP addresses of NAT gateways"
  value       = aws_eip.nat[*].public_ip
}

output "transit_gateway_id" {
  description = "ID of the Transit Gateway"
  value       = aws_ec2_transit_gateway.main.id
}

output "transit_gateway_attachment_id" {
  description = "ID of the Transit Gateway VPC attachment"
  value       = aws_ec2_transit_gateway_vpc_attachment.main.id
}

# ============================================================================
# Network Firewall Outputs
# ============================================================================

output "network_firewall_id" {
  description = "ID of the Network Firewall"
  value       = var.enable_network_firewall ? aws_networkfirewall_firewall.main[0].id : null
}

output "network_firewall_arn" {
  description = "ARN of the Network Firewall"
  value       = var.enable_network_firewall ? aws_networkfirewall_firewall.main[0].arn : null
}

output "network_firewall_policy_arn" {
  description = "ARN of the Network Firewall policy"
  value       = var.enable_network_firewall ? aws_networkfirewall_firewall_policy.main[0].arn : null
}

# ============================================================================
# Security Outputs
# ============================================================================

output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = var.enable_guardduty ? aws_guardduty_detector.main[0].id : null
}

output "security_hub_arn" {
  description = "ARN of the Security Hub"
  value       = var.enable_security_hub ? aws_securityhub_account.main[0].arn : null
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail trail"
  value       = var.enable_cloudtrail ? aws_cloudtrail.main[0].arn : null
}

output "cloudtrail_bucket" {
  description = "S3 bucket name for CloudTrail logs"
  value       = aws_s3_bucket.logs.id
}

# ============================================================================
# Logging Outputs
# ============================================================================

output "central_logging_bucket_name" {
  description = "Name of the central logging S3 bucket"
  value       = aws_s3_bucket.logs.id
}

output "central_logging_bucket_arn" {
  description = "ARN of the central logging S3 bucket"
  value       = aws_s3_bucket.logs.arn
}

output "vpc_flow_log_group" {
  description = "CloudWatch Log Group for VPC Flow Logs"
  value       = var.enable_vpc_flow_logs ? aws_cloudwatch_log_group.flow_logs[0].name : null
}

output "cloudtrail_log_group" {
  description = "CloudWatch Log Group for CloudTrail"
  value       = var.enable_cloudtrail ? aws_cloudwatch_log_group.cloudtrail[0].name : null
}

# ============================================================================
# Automation Outputs
# ============================================================================

output "incident_response_function_name" {
  description = "Name of the incident response Lambda function"
  value       = aws_lambda_function.incident_response.function_name
}

output "incident_response_function_arn" {
  description = "ARN of the incident response Lambda function"
  value       = aws_lambda_function.incident_response.arn
}

output "security_alerts_topic_arn" {
  description = "ARN of the SNS topic for security alerts"
  value       = aws_sns_topic.security_alerts.arn
}

output "security_hub_event_rule" {
  description = "EventBridge rule for Security Hub findings"
  value       = var.enable_security_hub ? aws_cloudwatch_event_rule.security_hub_findings[0].name : null
}

output "guardduty_event_rule" {
  description = "EventBridge rule for GuardDuty findings"
  value       = var.enable_guardduty ? aws_cloudwatch_event_rule.guardduty_findings[0].name : null
}

# ============================================================================
# IAM Outputs
# ============================================================================

output "ec2_ssm_role_arn" {
  description = "ARN of the EC2 SSM role"
  value       = aws_iam_role.ec2_ssm.arn
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile for SSM"
  value       = aws_iam_instance_profile.ec2_ssm.name
}

output "session_manager_role_arn" {
  description = "ARN of the Session Manager role for secure access"
  value       = aws_iam_role.session_manager.arn
}

# ============================================================================
# KMS Outputs
# ============================================================================

output "s3_kms_key_id" {
  description = "ID of the KMS key for S3 encryption"
  value       = aws_kms_key.s3.id
}

output "s3_kms_key_arn" {
  description = "ARN of the KMS key for S3 encryption"
  value       = aws_kms_key.s3.arn
}

output "cloudwatch_kms_key_id" {
  description = "ID of the KMS key for CloudWatch Logs encryption"
  value       = aws_kms_key.cloudwatch.id
}

output "cloudwatch_kms_key_arn" {
  description = "ARN of the KMS key for CloudWatch Logs encryption"
  value       = aws_kms_key.cloudwatch.arn
}

# ============================================================================
# General Outputs
# ============================================================================

output "account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "region" {
  description = "AWS Region"
  value       = data.aws_region.current.id
}

output "environment_suffix" {
  description = "Environment suffix for resource naming"
  value       = var.environment_suffix
}
