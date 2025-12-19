output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = module.vpc.vpc_cidr
}

output "aurora_endpoint" {
  description = "Aurora cluster endpoint"
  value       = module.aurora.cluster_endpoint
  sensitive   = true
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = module.lambda.function_name
}

output "s3_bucket_names" {
  description = "S3 bucket names"
  value       = aws_s3_bucket.data[*].id
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = aws_lb.main.dns_name
}

output "sns_topic_arn" {
  description = "SNS topic ARN"
  value       = aws_sns_topic.alerts.arn
}

output "iam_role_arns" {
  description = "IAM role ARNs"
  value       = { for k, v in aws_iam_role.app_role : k => v.arn }
}

output "environment" {
  description = "Current environment"
  value       = var.environment
}

output "workspace" {
  description = "Current workspace"
  value       = terraform.workspace
}
