output "cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "service_names" {
  description = "ECS service names"
  value       = { for k, v in aws_ecs_service.services : k => v.name }
}

output "task_definition_arns" {
  description = "Task definition ARNs"
  value       = { for k, v in aws_ecs_task_definition.services : k => v.arn }
}

output "log_groups" {
  description = "CloudWatch log group names"
  value       = { for k, v in aws_cloudwatch_log_group.ecs : k => v.name }
}

output "security_group_ids" {
  description = "Security group IDs"
  value       = { for k, v in aws_security_group.ecs_services : k => v.id }
}

output "target_group_arns" {
  description = "ALB target group ARNs"
  value = {
    for k, v in aws_lb_target_group.services : k => v.arn
  }
}

output "ecr_repository_urls" {
  description = "ECR repository URLs"
  value = {
    for k, v in data.aws_ecr_repository.services : k => v.repository_url
  }
}