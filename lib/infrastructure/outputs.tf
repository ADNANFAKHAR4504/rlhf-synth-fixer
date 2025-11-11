output "cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.main.name
}

output "ecr_registry" {
  description = "ECR registry URL"
  value       = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.region}.amazonaws.com"
}

output "rds_cluster_endpoint" {
  description = "RDS cluster endpoint"
  value       = aws_rds_cluster.main.endpoint
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