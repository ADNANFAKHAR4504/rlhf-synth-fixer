output "primary_vpc_id" {
  description = "Primary VPC ID"
  value       = module.vpc_primary.vpc_id
}

output "dr_vpc_id" {
  description = "DR VPC ID"
  value       = module.vpc_dr.vpc_id
}

output "vpc_peering_id" {
  description = "VPC Peering Connection ID"
  value       = module.vpc_peering.peering_connection_id
}

output "primary_rds_cluster_endpoint" {
  description = "Primary RDS cluster endpoint"
  value       = module.rds_primary.cluster_endpoint
  sensitive   = true
}

output "dr_rds_cluster_endpoint" {
  description = "DR RDS cluster endpoint"
  value       = module.rds_dr.cluster_endpoint
  sensitive   = true
}

output "dynamodb_table_name" {
  description = "DynamoDB global table name"
  value       = module.dynamodb.table_name
}

output "primary_s3_bucket" {
  description = "Primary S3 bucket name"
  value       = module.s3_primary.bucket_name
}

output "dr_s3_bucket" {
  description = "DR S3 bucket name"
  value       = module.s3_dr.bucket_name
}

output "primary_lambda_function" {
  description = "Primary Lambda function ARN"
  value       = module.lambda_primary.function_arn
}

output "dr_lambda_function" {
  description = "DR Lambda function ARN"
  value       = module.lambda_dr.function_arn
}

output "primary_alb_dns" {
  description = "Primary ALB DNS name"
  value       = module.alb_primary.dns_name
}

output "dr_alb_dns" {
  description = "DR ALB DNS name"
  value       = module.alb_dr.dns_name
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = module.route53.zone_id
}

output "route53_name_servers" {
  description = "Route 53 hosted zone name servers"
  value       = module.route53.name_servers
}

output "failover_endpoint" {
  description = "Route 53 failover endpoint URL"
  value       = "https://${var.domain_name}"
}

output "primary_sns_topic" {
  description = "Primary SNS topic ARN"
  value       = module.sns_primary.topic_arn
}

output "dr_sns_topic" {
  description = "DR SNS topic ARN"
  value       = module.sns_dr.topic_arn
}
