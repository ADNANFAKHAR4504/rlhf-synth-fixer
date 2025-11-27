# outputs.tf - Output values for the infrastructure

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_app_subnet_ids" {
  description = "IDs of private application subnets"
  value       = aws_subnet.private_app[*].id
}

output "private_db_subnet_ids" {
  description = "IDs of private database subnets"
  value       = aws_subnet.private_db[*].id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app.name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_security_group_id" {
  description = "Security group ID of the ALB"
  value       = aws_security_group.alb.id
}

output "ecs_task_security_group_id" {
  description = "Security group ID of ECS tasks"
  value       = aws_security_group.ecs_tasks.id
}

output "aurora_cluster_endpoint" {
  description = "Writer endpoint of the Aurora cluster"
  value       = aws_rds_cluster.aurora.endpoint
  sensitive   = true
}

output "aurora_cluster_reader_endpoint" {
  description = "Reader endpoint of the Aurora cluster"
  value       = aws_rds_cluster.aurora.reader_endpoint
  sensitive   = true
}

output "aurora_cluster_id" {
  description = "ID of the Aurora cluster"
  value       = aws_rds_cluster.aurora.cluster_identifier
}

output "aurora_master_password_secret_arn" {
  description = "ARN of the Secrets Manager secret containing Aurora master password"
  value       = aws_secretsmanager_secret.aurora_master_password.arn
  sensitive   = true
}

output "s3_static_assets_bucket_name" {
  description = "Name of the S3 bucket for static assets"
  value       = aws_s3_bucket.static_assets.bucket
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.static_assets.id
}

output "cloudfront_distribution_domain" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.static_assets.domain_name
}

output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.alb.id
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.alb.arn
}

output "kms_database_key_id" {
  description = "ID of the KMS key for database encryption"
  value       = aws_kms_key.database.id
}

output "kms_s3_key_id" {
  description = "ID of the KMS key for S3 encryption"
  value       = aws_kms_key.s3.id
}

output "kms_cloudwatch_key_id" {
  description = "ID of the KMS key for CloudWatch Logs encryption"
  value       = aws_kms_key.cloudwatch.id
}

output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.ecs_task.arn
}

output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = var.environment_suffix
}

output "aws_region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}
