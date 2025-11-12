output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "ecs_cluster_name" {
  description = "ECS Cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ECS Cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "Application Load Balancer ARN"
  value       = aws_lb.main.arn
}

output "ecr_repository_urls" {
  description = "ECR repository URLs for each microservice"
  value = {
    for service, repo in aws_ecr_repository.services : service => repo.repository_url
  }
}

output "service_discovery_namespace" {
  description = "Service Discovery namespace"
  value       = aws_service_discovery_private_dns_namespace.main.name
}

output "app_mesh_name" {
  description = "App Mesh name"
  value       = aws_appmesh_mesh.main.name
}

output "cloudwatch_log_groups" {
  description = "CloudWatch log group names for each service"
  value = {
    for service, log_group in aws_cloudwatch_log_group.services : service => log_group.name
  }
}

output "secrets_manager_arns" {
  description = "Secrets Manager secret ARNs"
  value = {
    db_connection   = aws_secretsmanager_secret.db_connection.arn
    api_credentials = aws_secretsmanager_secret.api_credentials.arn
    webhook_secrets = aws_secretsmanager_secret.webhook_secrets.arn
  }
}

output "ecs_service_names" {
  description = "ECS service names"
  value = {
    for service, svc in aws_ecs_service.services : service => svc.name
  }
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}
