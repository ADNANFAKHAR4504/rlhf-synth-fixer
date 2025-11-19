output "environment_suffix" {
  description = "Environment suffix used for this deployment"
  value       = var.environment_suffix
}

output "primary_vpc_id" {
  description = "Primary region VPC ID"
  value       = module.vpc_primary.vpc_id
}

output "secondary_vpc_id" {
  description = "Secondary region VPC ID"
  value       = module.vpc_secondary.vpc_id
}

output "aurora_global_cluster_id" {
  description = "Aurora Global Database cluster identifier"
  value       = module.aurora_global.global_cluster_id
}

output "primary_aurora_endpoint" {
  description = "Primary Aurora cluster endpoint"
  value       = module.aurora_global.primary_cluster_endpoint
  sensitive   = true
}

output "secondary_aurora_endpoint" {
  description = "Secondary Aurora cluster endpoint"
  value       = module.aurora_global.secondary_cluster_endpoint
  sensitive   = true
}

output "dynamodb_table_name" {
  description = "DynamoDB global table name"
  value       = module.dynamodb_global.table_name
}

output "primary_lambda_function_name" {
  description = "Primary Lambda function name"
  value       = module.lambda_primary.function_name
}

output "secondary_lambda_function_name" {
  description = "Secondary Lambda function name"
  value       = module.lambda_secondary.function_name
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = module.route53_failover.zone_id
}

output "route53_domain_name" {
  description = "Route 53 domain name for payment system"
  value       = module.route53_failover.domain_name
}

output "primary_sns_topic_arn" {
  description = "Primary region SNS topic ARN for alerts"
  value       = module.cloudwatch_primary.sns_topic_arn
}

output "secondary_sns_topic_arn" {
  description = "Secondary region SNS topic ARN for alerts"
  value       = module.cloudwatch_secondary.sns_topic_arn
}

output "lambda_iam_role_arn" {
  description = "IAM role ARN used by Lambda functions"
  value       = module.lambda_iam_role.role_arn
}

output "vpc_peering_connection_id" {
  description = "VPC peering connection ID between regions"
  value       = aws_vpc_peering_connection.primary_to_secondary.id
}
