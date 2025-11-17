output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "blue_target_group_arn" {
  description = "ARN of the blue target group"
  value       = aws_lb_target_group.blue.arn
}

output "green_target_group_arn" {
  description = "ARN of the green target group"
  value       = aws_lb_target_group.green.arn
}

output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_blue_name" {
  description = "Name of the blue ECS service"
  value       = aws_ecs_service.blue.name
}

output "ecs_service_green_name" {
  description = "Name of the green ECS service"
  value       = aws_ecs_service.green.name
}

output "rds_cluster_endpoint" {
  description = "Writer endpoint for the Aurora PostgreSQL cluster"
  value       = aws_rds_cluster.aurora_postgresql.endpoint
}

output "rds_cluster_reader_endpoint" {
  description = "Reader endpoint for the Aurora PostgreSQL cluster"
  value       = aws_rds_cluster.aurora_postgresql.reader_endpoint
}

output "rds_cluster_id" {
  description = "ID of the Aurora PostgreSQL cluster"
  value       = aws_rds_cluster.aurora_postgresql.id
}

output "rds_cluster_arn" {
  description = "ARN of the Aurora PostgreSQL cluster"
  value       = aws_rds_cluster.aurora_postgresql.arn
}

output "db_connection_string_parameter" {
  description = "SSM Parameter name for database connection string"
  value       = aws_ssm_parameter.db_connection_string.name
}

output "db_password_parameter" {
  description = "SSM Parameter name for database password"
  value       = aws_ssm_parameter.db_password.name
  sensitive   = true
}

output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = aws_iam_role.ecs_execution_role.arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.ecs_task_role.arn
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group for ECS tasks"
  value       = aws_cloudwatch_log_group.ecs_tasks.name
}
