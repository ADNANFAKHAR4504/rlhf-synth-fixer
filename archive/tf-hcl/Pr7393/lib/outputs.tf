# Terraform Outputs

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "api_service_name" {
  description = "Name of the API ECS service"
  value       = aws_ecs_service.api.name
}

output "worker_service_name" {
  description = "Name of the Worker ECS service"
  value       = aws_ecs_service.worker.name
}

output "scheduler_service_name" {
  description = "Name of the Scheduler ECS service"
  value       = aws_ecs_service.scheduler.name
}

output "api_target_group_arn" {
  description = "ARN of the API target group"
  value       = aws_lb_target_group.api.arn
}

output "worker_target_group_arn" {
  description = "ARN of the Worker target group"
  value       = aws_lb_target_group.worker.arn
}

output "scheduler_target_group_arn" {
  description = "ARN of the Scheduler target group"
  value       = aws_lb_target_group.scheduler.arn
}

output "api_log_group_name" {
  description = "CloudWatch log group name for API service"
  value       = aws_cloudwatch_log_group.api.name
}

output "worker_log_group_name" {
  description = "CloudWatch log group name for Worker service"
  value       = aws_cloudwatch_log_group.worker.name
}

output "scheduler_log_group_name" {
  description = "CloudWatch log group name for Scheduler service"
  value       = aws_cloudwatch_log_group.scheduler.name
}

output "service_discovery_namespace" {
  description = "Service discovery namespace ID"
  value       = aws_service_discovery_private_dns_namespace.main.id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "ecs_security_group_id" {
  description = "Security group ID for ECS tasks"
  value       = aws_security_group.ecs_tasks.id
}

output "api_task_definition_arn" {
  description = "ARN of API task definition"
  value       = aws_ecs_task_definition.api.arn
}

output "worker_task_definition_arn" {
  description = "ARN of Worker task definition"
  value       = aws_ecs_task_definition.worker.arn
}

output "scheduler_task_definition_arn" {
  description = "ARN of Scheduler task definition"
  value       = aws_ecs_task_definition.scheduler.arn
}
