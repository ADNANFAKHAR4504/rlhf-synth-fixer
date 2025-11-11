output "cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.main.name
}

output "ecr_registry" {
  description = "ECR registry URL"
  value       = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.region}.amazonaws.com"
}

output "rds_master_user_secret_arn" {
  description = "RDS master user secret ARN in AWS Secrets Manager"
  value       = aws_rds_cluster.main.master_user_secret[0].secret_arn
}

output "cache_cluster_endpoint" {
  description = "ElastiCache cluster endpoint"
  value       = aws_elasticache_cluster.main.cache_nodes[0].address
}

output "cognito_user_pool_id" {
  description = "Cognito user pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_user_pool_client_id" {
  description = "Cognito user pool client ID"
  value       = aws_cognito_user_pool_client.main.id
}

output "circleci_dev_role_arn" {
  description = "CircleCI dev role ARN"
  value       = aws_iam_role.circleci_dev.arn
}

output "circleci_staging_role_arn" {
  description = "CircleCI staging role ARN"
  value       = aws_iam_role.circleci_staging.arn
}

output "circleci_prod_role_arn" {
  description = "CircleCI prod role ARN"
  value       = aws_iam_role.circleci_prod.arn
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "sns_alerts_topic_arn" {
  description = "SNS topic ARN for infrastructure alerts"
  value       = aws_sns_topic.alerts.arn
}

output "terraform_state_bucket_name" {
  description = "S3 bucket name for Terraform state"
  value       = aws_s3_bucket.terraform_state.bucket
}

output "terraform_state_bucket_arn" {
  description = "S3 bucket ARN for Terraform state"
  value       = aws_s3_bucket.terraform_state.arn
}

output "terraform_locks_table_name" {
  description = "DynamoDB table name for Terraform state locks"
  value       = aws_dynamodb_table.terraform_locks.name
}

output "kms_rds_key_arn" {
  description = "KMS key ARN for RDS encryption"
  value       = aws_kms_key.rds.arn
}

output "kms_cache_key_arn" {
  description = "KMS key ARN for ElastiCache encryption"
  value       = aws_kms_key.cache.arn
}