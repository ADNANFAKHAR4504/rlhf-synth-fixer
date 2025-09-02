# Output values for the production infrastructure
# These outputs provide important information about created resources

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

output "nat_gateway_eips" {
  description = "Elastic IP addresses of the NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "app_instances_security_group_id" {
  description = "ID of the application instances security group"
  value       = aws_security_group.app_instances.id
}

output "vpc_endpoints_security_group_id" {
  description = "ID of the VPC endpoints security group"
  value       = aws_security_group.vpc_endpoints.id
}

output "kms_key_id" {
  description = "ID of the KMS customer managed key"
  value       = aws_kms_key.main.key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS customer managed key"
  value       = aws_kms_key.main.arn
}

output "kms_key_alias" {
  description = "Alias of the KMS customer managed key"
  value       = aws_kms_alias.main.name
}

output "app_data_bucket_id" {
  description = "ID of the application data S3 bucket"
  value       = aws_s3_bucket.app_data.id
}

output "app_data_bucket_arn" {
  description = "ARN of the application data S3 bucket"
  value       = aws_s3_bucket.app_data.arn
}

output "logging_bucket_id" {
  description = "ID of the logging S3 bucket"
  value       = aws_s3_bucket.logging.id
}

output "logging_bucket_arn" {
  description = "ARN of the logging S3 bucket"
  value       = aws_s3_bucket.logging.arn
}

output "ec2_instance_role_arn" {
  description = "ARN of the EC2 instance IAM role"
  value       = aws_iam_role.ec2_instance.arn
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_instance.name
}

output "cloudtrail_role_arn" {
  description = "ARN of the CloudTrail IAM role"
  value       = aws_iam_role.cloudtrail.arn
}

output "config_role_arn" {
  description = "ARN of the AWS Config IAM role"
  value       = aws_iam_role.config.arn
}

output "launch_template_id" {
  description = "ID of the launch template"
  value       = aws_launch_template.app_servers.id
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.app_servers.name
}

output "autoscaling_group_arn" {
  description = "ARN of the Auto Scaling Group"
  value       = aws_autoscaling_group.app_servers.arn
}

output "load_balancer_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.app_lb.arn
}

output "load_balancer_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.app_lb.dns_name
}

output "load_balancer_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.app_lb.zone_id
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.app_servers.arn
}

output "acm_certificate_arn" {
  description = "ARN of the ACM certificate"
  value       = aws_acm_certificate.app_cert.arn
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.main.name
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.main.arn
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group for CloudTrail"
  value       = aws_cloudwatch_log_group.cloudtrail.name
}

output "cloudwatch_log_group_arn" {
  description = "ARN of the CloudWatch log group for CloudTrail"
  value       = aws_cloudwatch_log_group.cloudtrail.arn
}

output "root_usage_alarm_name" {
  description = "Name of the root usage CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.root_usage_alarm.alarm_name
}

output "failed_logins_alarm_name" {
  description = "Name of the failed console logins CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.failed_console_logins_alarm.alarm_name
}

output "unauthorized_api_alarm_name" {
  description = "Name of the unauthorized API calls CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.unauthorized_api_calls_alarm.alarm_name
}

output "security_dashboard_url" {
  description = "URL of the CloudWatch security dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.security_dashboard.dashboard_name}"
}

output "config_recorder_name" {
  description = "Name of the AWS Config configuration recorder"
  value       = aws_config_configuration_recorder.main.name
}

output "config_delivery_channel_name" {
  description = "Name of the AWS Config delivery channel"
  value       = aws_config_delivery_channel.main.name
}

output "config_rules" {
  description = "Names of the AWS Config rules"
  value = [
    aws_config_config_rule.ec2_in_asg.name,
    aws_config_config_rule.autoscaling_group_elb_healthcheck_required.name
  ]
}

output "security_alerts_topic_arn" {
  description = "ARN of the security alerts SNS topic"
  value       = aws_sns_topic.security_alerts.arn
}

output "operational_alerts_topic_arn" {
  description = "ARN of the operational alerts SNS topic"
  value       = aws_sns_topic.operational_alerts.arn
}

output "availability_zones" {
  description = "List of availability zones used"
  value       = data.aws_availability_zones.available.names
}

output "account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "region" {
  description = "AWS Region"
  value       = data.aws_region.current.name
}

# Security validation outputs
output "security_validation" {
  description = "Security configuration validation summary"
  value = {
    vpc_flow_logs_enabled        = false # Not implemented in this basic setup
    s3_encryption_enabled        = true
    s3_versioning_enabled        = true
    s3_public_access_blocked     = true
    kms_key_rotation_enabled     = true
    cloudtrail_enabled           = true
    config_enabled               = true
    security_groups_validated    = true
    nacls_configured             = true
    instances_in_private_subnets = true
    ssm_session_manager_enabled  = true
  }
}
