# outputs.tf
# Payment Processing Application Outputs

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
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

output "database_subnet_ids" {
  description = "IDs of the database subnets"
  value       = aws_subnet.database[*].id
}

output "rds_cluster_id" {
  description = "RDS Aurora cluster identifier"
  value       = aws_rds_cluster.main.cluster_identifier
}

output "rds_cluster_endpoint" {
  description = "RDS Aurora cluster endpoint"
  value       = aws_rds_cluster.main.endpoint
}

output "rds_cluster_reader_endpoint" {
  description = "RDS Aurora cluster reader endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "rds_cluster_port" {
  description = "RDS Aurora cluster port"
  value       = aws_rds_cluster.main.port
}

output "rds_cluster_master_username" {
  description = "RDS Aurora cluster master username"
  value       = aws_rds_cluster.main.master_username
  sensitive   = true
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.main.name
}

output "load_balancer_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "load_balancer_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "load_balancer_arn" {
  description = "ARN of the load balancer"
  value       = aws_lb.main.arn
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.main.arn
}

output "s3_logs_bucket_name" {
  description = "Name of the S3 bucket for logs"
  value       = aws_s3_bucket.logs.bucket
}

output "s3_logs_bucket_arn" {
  description = "ARN of the S3 bucket for logs"
  value       = aws_s3_bucket.logs.arn
}

output "kms_key_id" {
  description = "ID of the KMS key used for encryption"
  value       = aws_kms_key.payment_processing.key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for encryption"
  value       = aws_kms_key.payment_processing.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.arn
}

output "security_group_alb_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "security_group_ecs_id" {
  description = "ID of the ECS security group"
  value       = aws_security_group.ecs.id
}

output "security_group_rds_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "application_url" {
  description = "URL to access the application"
  value       = var.certificate_arn != "" ? "https://${aws_lb.main.dns_name}" : "http://${aws_lb.main.dns_name}"
}

output "application_http_url" {
  description = "HTTP URL to access the application"
  value       = "http://${aws_lb.main.dns_name}"
}

output "application_https_url" {
  description = "HTTPS URL to access the application (only if certificate is configured)"
  value       = var.certificate_arn != "" ? "https://${aws_lb.main.dns_name}" : "N/A - No certificate configured"
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group for ECS"
  value       = aws_cloudwatch_log_group.ecs.name
}

# Route53 Outputs
output "route53_zone_id" {
  description = "Route53 hosted zone ID (if domain configured)"
  value       = var.domain_name != "" ? data.aws_route53_zone.main[0].zone_id : "N/A - No domain configured"
}

output "route53_record_fqdn" {
  description = "Fully qualified domain name of the Route53 record"
  value       = var.domain_name != "" ? aws_route53_record.main[0].fqdn : "N/A - No domain configured"
}

output "route53_health_check_id" {
  description = "Route53 health check ID"
  value       = var.domain_name != "" ? aws_route53_health_check.alb[0].id : "N/A - No domain configured"
}

output "domain_url" {
  description = "Primary domain URL for the application"
  value       = var.domain_name != "" ? "${var.certificate_arn != "" ? "https" : "http"}://${var.environment == "prod" ? var.domain_name : "${var.environment}.${var.domain_name}"}" : "N/A - No domain configured"
}

output "www_domain_url" {
  description = "WWW domain URL for the application"
  value       = var.domain_name != "" && var.create_www_record ? "${var.certificate_arn != "" ? "https" : "http"}://www.${var.environment == "prod" ? var.domain_name : "${var.environment}.${var.domain_name}"}" : "N/A - WWW record not configured"
}