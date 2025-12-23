output "ecs_task_role_arn" {
  description = "ARN of ECS task role"
  value       = aws_iam_role.ecs_task.arn
}

output "ecs_execution_role_arn" {
  description = "ARN of ECS execution role"
  value       = aws_iam_role.ecs_execution.arn
}

output "monitoring_role_arn" {
  description = "ARN of monitoring role"
  value       = aws_iam_role.monitoring.arn
}