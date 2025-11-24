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

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = aws_lb.main.dns_name
}

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.app.repository_url
}

output "codecommit_repository_url" {
  description = "CodeCommit repository clone URL (HTTPS)"
  value       = aws_codecommit_repository.app.clone_url_http
}

output "codepipeline_name" {
  description = "CodePipeline name"
  value       = aws_codepipeline.app.name
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.app.name
}

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = aws_wafv2_web_acl.main.arn
}

output "kms_artifacts_key_id" {
  description = "KMS key ID for artifacts encryption"
  value       = aws_kms_key.artifacts.key_id
}

output "kms_ecr_key_id" {
  description = "KMS key ID for ECR encryption"
  value       = aws_kms_key.ecr.key_id
}

output "sns_topic_arn" {
  description = "SNS topic ARN for pipeline approvals"
  value       = aws_sns_topic.pipeline_approval.arn
}
