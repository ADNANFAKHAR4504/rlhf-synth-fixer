# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

# Load Balancer Outputs
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "app_target_group_arn" {
  description = "ARN of the application target group"
  value       = aws_lb_target_group.app.arn
}

output "api_target_group_arn" {
  description = "ARN of the API target group"
  value       = aws_lb_target_group.api.arn
}

# Aurora Outputs
output "aurora_cluster_id" {
  description = "ID of the Aurora cluster"
  value       = aws_rds_cluster.aurora.id
}

output "aurora_cluster_endpoint" {
  description = "Writer endpoint of the Aurora cluster"
  value       = aws_rds_cluster.aurora.endpoint
}

output "aurora_cluster_reader_endpoint" {
  description = "Reader endpoint of the Aurora cluster"
  value       = aws_rds_cluster.aurora.reader_endpoint
}

output "aurora_cluster_port" {
  description = "Port of the Aurora cluster"
  value       = aws_rds_cluster.aurora.port
}

output "aurora_database_name" {
  description = "Name of the Aurora database"
  value       = aws_rds_cluster.aurora.database_name
}

# Auto Scaling Outputs
output "autoscaling_group_id" {
  description = "ID of the Auto Scaling group"
  value       = aws_autoscaling_group.main.id
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling group"
  value       = aws_autoscaling_group.main.name
}

output "asg_name" {
  description = "Name of the Auto Scaling group (alias)"
  value       = aws_autoscaling_group.main.name
}

output "autoscaling_group_arn" {
  description = "ARN of the Auto Scaling group"
  value       = aws_autoscaling_group.main.arn
}

# S3 Outputs
output "logs_bucket_id" {
  description = "ID of the logs S3 bucket"
  value       = aws_s3_bucket.logs.id
}

output "logs_bucket_name" {
  description = "Name of the logs S3 bucket"
  value       = aws_s3_bucket.logs.id
}

output "logs_bucket_arn" {
  description = "ARN of the logs S3 bucket"
  value       = aws_s3_bucket.logs.arn
}

output "documents_bucket_id" {
  description = "ID of the documents S3 bucket"
  value       = aws_s3_bucket.documents.id
}

output "documents_bucket_name" {
  description = "Name of the documents S3 bucket"
  value       = aws_s3_bucket.documents.id
}

output "documents_bucket_arn" {
  description = "ARN of the documents S3 bucket"
  value       = aws_s3_bucket.documents.arn
}

output "static_assets_bucket_id" {
  description = "ID of the static assets S3 bucket"
  value       = aws_s3_bucket.static_assets.id
}

output "static_assets_bucket_arn" {
  description = "ARN of the static assets S3 bucket"
  value       = aws_s3_bucket.static_assets.arn
}

# CloudFront Outputs
output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.static_assets.id
}

output "cloudfront_distribution_domain" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.static_assets.domain_name
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.static_assets.arn
}

# WAF Outputs
output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.alb.id
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.alb.arn
}

output "waf_acl_arn" {
  description = "ARN of the WAF Web ACL (alias)"
  value       = aws_wafv2_web_acl.alb.arn
}

# KMS Outputs
output "kms_key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.main.key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.main.arn
}

# CloudWatch Outputs
output "application_log_group_name" {
  description = "Name of the application CloudWatch log group"
  value       = aws_cloudwatch_log_group.application.name
}

output "batch_log_group_name" {
  description = "Name of the batch processing CloudWatch log group"
  value       = aws_cloudwatch_log_group.batch_processing.name
}

# EventBridge Outputs
output "nightly_batch_rule_arn" {
  description = "ARN of the nightly batch EventBridge rule"
  value       = aws_cloudwatch_event_rule.nightly_batch.arn
}

output "business_hours_rule_arn" {
  description = "ARN of the business hours EventBridge rule"
  value       = aws_cloudwatch_event_rule.business_hours_monitor.arn
}

# Security Group Outputs
output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "ec2_security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2.id
}

output "aurora_security_group_id" {
  description = "ID of the Aurora security group"
  value       = aws_security_group.aurora.id
}

# IAM Outputs
output "ec2_iam_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2.arn
}

output "ec2_role_arn" {
  description = "ARN of the EC2 IAM role (alias)"
  value       = aws_iam_role.ec2.arn
}

output "ec2_instance_profile_arn" {
  description = "ARN of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2.arn
}

output "eventbridge_role_arn" {
  description = "ARN of the EventBridge IAM role"
  value       = aws_iam_role.eventbridge.arn
}

# Environment Suffix Output
output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = local.env_suffix
}
