# outputs.tf

# VPC Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

# KMS Outputs
output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = aws_kms_key.main.id
}

output "kms_key_arn" {
  description = "KMS key ARN for encryption"
  value       = aws_kms_key.main.arn
}

# ALB Outputs
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

# ECS Outputs
output "ecs_cluster_id" {
  description = "ECS Cluster ID"
  value       = aws_ecs_cluster.main.id
}

output "ecs_cluster_arn" {
  description = "ECS Cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "ecs_cluster_name" {
  description = "ECS Cluster Name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS Service Name"
  value       = aws_ecs_service.main.name
}

# Aurora Outputs
output "aurora_cluster_endpoint" {
  description = "Aurora cluster endpoint"
  value       = aws_rds_cluster.aurora.endpoint
}

output "aurora_reader_endpoint" {
  description = "Aurora cluster reader endpoint"
  value       = aws_rds_cluster.aurora.reader_endpoint
}

output "aurora_cluster_id" {
  description = "Aurora cluster ID"
  value       = aws_rds_cluster.aurora.id
}

output "aurora_cluster_arn" {
  description = "Aurora cluster ARN"
  value       = aws_rds_cluster.aurora.arn
}

output "aurora_database_name" {
  description = "Aurora database name"
  value       = aws_rds_cluster.aurora.database_name
}

output "aurora_master_username" {
  description = "Aurora master username"
  value       = aws_rds_cluster.aurora.master_username
  sensitive   = true
}

output "aurora_secret_arn" {
  description = "ARN of the secret containing Aurora credentials"
  value       = aws_secretsmanager_secret.aurora_master_password.arn
}

# S3 Outputs
output "s3_logs_bucket_name" {
  description = "S3 logs bucket name"
  value       = aws_s3_bucket.logs.id
}

output "s3_logs_bucket_arn" {
  description = "S3 logs bucket ARN"
  value       = aws_s3_bucket.logs.arn
}

output "s3_documents_bucket_name" {
  description = "S3 documents bucket name"
  value       = aws_s3_bucket.documents.id
}

output "s3_documents_bucket_arn" {
  description = "S3 documents bucket ARN"
  value       = aws_s3_bucket.documents.arn
}

output "s3_static_assets_bucket_name" {
  description = "S3 static assets bucket name"
  value       = aws_s3_bucket.static_assets.id
}

output "s3_static_assets_bucket_arn" {
  description = "S3 static assets bucket ARN"
  value       = aws_s3_bucket.static_assets.arn
}

# CloudFront Outputs
output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.main.arn
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

# WAF Outputs
output "waf_web_acl_id" {
  description = "WAF Web ACL ID"
  value       = aws_wafv2_web_acl.main.id
}

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = aws_wafv2_web_acl.main.arn
}

# EventBridge Outputs
output "eventbridge_bus_name" {
  description = "EventBridge event bus name"
  value       = aws_cloudwatch_event_bus.main.name
}

output "eventbridge_bus_arn" {
  description = "EventBridge event bus ARN"
  value       = aws_cloudwatch_event_bus.main.arn
}

# CloudWatch Outputs
output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "sns_alarms_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarms"
  value       = aws_sns_topic.alarms.arn
}
