output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
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

output "api_task_definition_arn" {
  description = "ARN of the API task definition"
  value       = aws_ecs_task_definition.api.arn
}

output "worker_task_definition_arn" {
  description = "ARN of the Worker task definition"
  value       = aws_ecs_task_definition.worker.arn
}

output "scheduler_task_definition_arn" {
  description = "ARN of the Scheduler task definition"
  value       = aws_ecs_task_definition.scheduler.arn
}

output "service_discovery_namespace" {
  description = "Name of the service discovery namespace"
  value       = aws_service_discovery_private_dns_namespace.main.name
}

output "api_target_group_arn" {
  description = "ARN of the API target group"
  value       = aws_lb_target_group.api.arn
}

output "worker_target_group_arn" {
  description = "ARN of the Worker target group"
  value       = aws_lb_target_group.worker.arn
}

output "cloudwatch_log_group_api" {
  description = "Name of the API CloudWatch log group"
  value       = aws_cloudwatch_log_group.api.name
}

output "cloudwatch_log_group_worker" {
  description = "Name of the Worker CloudWatch log group"
  value       = aws_cloudwatch_log_group.worker.name
}

output "cloudwatch_log_group_scheduler" {
  description = "Name of the Scheduler CloudWatch log group"
  value       = aws_cloudwatch_log_group.scheduler.name
}

output "api_service_url" {
  description = "URL to access the API service"
  value       = "http://${aws_lb.main.dns_name}"
}

output "worker_service_url" {
  description = "URL to access the Worker service"
  value       = "http://${aws_lb.main.dns_name}/worker"
}

output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.ecs_task.arn
}
